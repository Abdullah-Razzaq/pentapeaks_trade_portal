import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Ensure the trade_data table and unique constraint exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_data (
        id SERIAL PRIMARY KEY,
        shipment_date DATE,
        buyer_name VARCHAR(255) NOT NULL DEFAULT '',
        supplier_name VARCHAR(255) NOT NULL DEFAULT '',
        hs_code VARCHAR(50) NOT NULL DEFAULT '',
        product_description TEXT NOT NULL DEFAULT '',
        destination_country VARCHAR(100),
        origin_country VARCHAR(100),
        quantity NUMERIC,
        unit VARCHAR(50),
        value_pkr NUMERIC NOT NULL DEFAULT 0,
        ntn VARCHAR(100)
      )
    `);

    // Ensure NTN column exists (if table was created previously)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_data' AND column_name = 'ntn') THEN
          ALTER TABLE trade_data ADD COLUMN ntn VARCHAR(100);
        END IF;
      END $$;
    `);

    // Add unique constraint if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_trade_record'
        ) THEN
          ALTER TABLE trade_data 
          ADD CONSTRAINT unique_trade_record 
          UNIQUE (shipment_date, buyer_name, supplier_name, hs_code, product_description, value_pkr);
        END IF;
      END $$;
    `);

    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const file of files) {
      const fileSize = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const logRes = await pool.query(
        `INSERT INTO data_activity_logs (dataset_name, file_size, status) VALUES ($1, $2, 'Processing') RETURNING id`,
        [file.name, fileSize]
      );
      const logId = logRes.rows[0].id;
      let fileProcessed = 0;

      const buffer = await file.arrayBuffer();
      let rawRows: Record<string, unknown>[] = [];
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      } catch (err) {
        console.error("Parse error for file", file.name, err);
        await pool.query(`UPDATE data_activity_logs SET status = 'Failed' WHERE id = $1`, [logId]);
        return NextResponse.json({ error: `Failed to parse file: ${file.name}` }, { status: 400 });
      }

      if (rawRows.length === 0) {
        await pool.query(`UPDATE data_activity_logs SET status = 'Completed', records_processed = 0 WHERE id = $1`, [logId]);
        continue;
      }

      // Extract and Normalize Headers
      const mappedRows: Record<string, unknown>[] = [];
      
      const aliases = {
        hs_code: ["hs code", "pct", "pct code", "hscode", "tariff code", "commodity"],
        buyer_name: ["importer", "buyer", "buyer_name", "consignee"],
        supplier_name: ["exporter", "supplier", "supplier_name", "shipper"],
        product_description: ["description", "product_description", "item_desc", "goods_desc"],
        shipment_date: ["date", "sb_date", "gd_date", "shipment_date"],
        origin_country: ["origin", "origin_country", "country_of_origin"],
        destination_country: ["dest", "destination", "destination_country"],
        quantity: ["qty", "quantity", "total_qty"],
        unit: ["unit", "uom", "unit_desc"],
        value_pkr: ["value (pkr)", "value_pkr", "pkr_value", "total value pkr", "value"],
        ntn: ["ntn", "ntn_no", "tax_id"]
      };

      rawRows.forEach((row) => {
        const normalizedRow: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase().trim();
          if (lowerKey.startsWith("__empty")) continue;
          
          let matched = false;
          for (const [stdKey, aliasList] of Object.entries(aliases)) {
            if (stdKey === lowerKey || aliasList.includes(lowerKey)) {
              normalizedRow[stdKey] = value;
              matched = true;
              break;
            }
          }
          if (!matched) {
            normalizedRow[lowerKey] = value;
          }
        }
        mappedRows.push(normalizedRow);
      });

      const BATCH_SIZE = 2500;
      for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
        const batch = mappedRows.slice(i, i + BATCH_SIZE);
        const values: unknown[] = [];
        let queryParams = "";
        
        let batchProcessed = 0;
        
        batch.forEach((row, rowIndex) => {
           try {
             // Validate and Parse Date
             const rawDate = (row["shipment_date"] || "") as string | number;
             let shipment_date = null;
             
             if (rawDate) {
               let d: Date;
               if (typeof rawDate === "number") {
                 d = new Date((rawDate - (25567 + 2)) * 86400 * 1000); // Excel serial date
               } else {
                 // handle DD/MM/YYYY vs MM/DD/YYYY if necessary, fallback to native Date
                 const parts = rawDate.toString().split("/");
                 if (parts.length === 3 && parts[2].length === 4) {
                   // Assumes DD/MM/YYYY
                   d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                 } else {
                   d = new Date(rawDate);
                 }
               }
               if (isNaN(d.getTime())) {
                 throw new Error("Invalid date");
               }
               shipment_date = d.toISOString().split("T")[0];
             } else {
               throw new Error("Missing date");
             }

             const hs_code = (row["hs_code"] || "").toString().trim();
             const product_description = (row["product_description"] || "").toString().trim();

             if (!hs_code && !product_description) {
               throw new Error("Missing HS Code and Description");
             }

             const buyer_name = (row["buyer_name"] || "").toString().trim();
             const supplier_name = (row["supplier_name"] || "").toString().trim();
             const destination_country = (row["destination_country"] || "").toString().trim() || null;
             const origin_country = (row["origin_country"] || "").toString().trim() || null;
             const ntn = (row["ntn"] || "").toString().trim() || null;
             
             // Clean numeric values
             const rawQty = (row["quantity"] || "0").toString().replace(/[^0-9.-]+/g,"");
             let quantity = parseFloat(rawQty);
             if (isNaN(quantity)) quantity = 0;
             
             const unit = (row["unit"] || "").toString().trim() || null;
             
             const rawVal = (row["value_pkr"] || "0").toString().replace(/[^0-9.-]+/g,"");
             let value_pkr = parseFloat(rawVal);
             if (isNaN(value_pkr)) value_pkr = 0;

             const offset = batchProcessed * 11;
             queryParams += `($${offset+1}::date, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6}, $${offset+7}, $${offset+8}, $${offset+9}, $${offset+10}, $${offset+11}),`;
             
             values.push(
               shipment_date, 
               buyer_name, 
               supplier_name, 
               hs_code, 
               product_description, 
               destination_country, 
               origin_country, 
               quantity, 
               unit, 
               value_pkr,
               ntn
             );
             batchProcessed++;
           } catch (err: unknown) {
             totalSkipped++;
             console.log(`Row ${i + rowIndex + 1} skipped: ${(err instanceof Error ? err.message : "Validation failed")}`);
           }
        });

        if (batchProcessed > 0) {
           queryParams = queryParams.slice(0, -1);
           const client = await pool.connect();
           try {
             await client.query("BEGIN");
             const res = await client.query(`
               INSERT INTO trade_data 
               (shipment_date, buyer_name, supplier_name, hs_code, product_description, destination_country, origin_country, quantity, unit, value_pkr, ntn)
               VALUES ${queryParams}
               ON CONFLICT (shipment_date, buyer_name, supplier_name, hs_code, product_description, value_pkr)
               DO UPDATE SET
                 destination_country = EXCLUDED.destination_country,
                 origin_country = EXCLUDED.origin_country,
                 quantity = EXCLUDED.quantity,
                 unit = EXCLUDED.unit,
                 ntn = COALESCE(EXCLUDED.ntn, trade_data.ntn)
               RETURNING (xmax = 0) AS is_insert
             `, values);
             
             await client.query("COMMIT");
             
             totalProcessed += batchProcessed;
             fileProcessed += batchProcessed;
             
             res.rows.forEach(r => {
               if (r.is_insert) {
                 totalInserted++;
               } else {
                 totalUpdated++;
               }
             });
             
           } catch (e) {
             await client.query("ROLLBACK");
             console.error("Batch insert failed:", e);
             await pool.query(`UPDATE data_activity_logs SET status = 'Failed' WHERE id = $1`, [logId]);
             throw e;
           } finally {
             client.release();
           }
        }
      }
      await pool.query(`UPDATE data_activity_logs SET status = 'Completed', records_processed = $1 WHERE id = $2`, [fileProcessed, logId]);
    }

    return NextResponse.json({ 
      success: true, 
      totalProcessed, 
      inserted: totalInserted, 
      updated: totalUpdated,
      skipped: totalSkipped,
      message: "Data ingestion complete."
    });

  } catch (error: unknown) {
    console.error("Data upload error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process data upload." }, { status: 400 });
  }
}
