import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type, expected application/json" }, { status: 400 });
    }

    const { fileName, fileSize, chunk, isFirstChunk, isLastChunk, logId: incomingLogId } = await request.json();

    if (!fileName || !chunk || !Array.isArray(chunk)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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

    let logId = incomingLogId;

    if (isFirstChunk) {
      const sizeStr = fileSize < 1024 * 1024 ? `${(fileSize / 1024).toFixed(1)} KB` : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
      const logRes = await pool.query(
        `INSERT INTO data_activity_logs (dataset_name, file_size, status, records_processed) VALUES ($1, $2, 'Processing', 0) RETURNING id`,
        [fileName, sizeStr]
      );
      logId = logRes.rows[0].id;
    }

    let batchProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    if (chunk.length > 0) {
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

      chunk.forEach((row) => {
        const normalizedRow: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
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

      const values: unknown[] = [];
      let queryParams = "";
      
      mappedRows.forEach((row) => {
         try {
           // Validate and Parse Date
           const rawDate = (row["shipment_date"] || "") as string | number;
           let shipment_date = null;
           
           if (rawDate) {
             let d: Date;
             if (typeof rawDate === "number") {
               d = new Date((rawDate - (25567 + 2)) * 86400 * 1000); // Excel serial date
             } else {
               const parts = rawDate.toString().split("/");
               if (parts.length === 3 && parts[2].length === 4) {
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
         } catch {
           totalSkipped++;
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

    if (isLastChunk) {
       await pool.query(
         `UPDATE data_activity_logs SET status = 'Completed', records_processed = COALESCE(records_processed, 0) + $1 WHERE id = $2`, 
         [batchProcessed, logId]
       );
    } else if (batchProcessed > 0) {
       await pool.query(
         `UPDATE data_activity_logs SET records_processed = COALESCE(records_processed, 0) + $1 WHERE id = $2`, 
         [batchProcessed, logId]
       );
    }

    return NextResponse.json({ 
      success: true, 
      logId,
      processed: batchProcessed, 
      inserted: totalInserted, 
      updated: totalUpdated,
      skipped: totalSkipped
    });

  } catch (error: unknown) {
    console.error("Data upload error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process data upload." }, { status: 400 });
  }
}
