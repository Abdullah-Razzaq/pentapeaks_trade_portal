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

    // For export_shipments, we will use source_file to make it idempotent
    if (isFirstChunk) {
      // Clean up previous uploads of the exact same file to maintain idempotency
      await pool.query(`DELETE FROM export_shipments WHERE source_file = $1`, [fileName]);
    }

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
    const totalUpdated = 0;
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

      type ProcessedRow = {
        date: string | null;
        importer: string;
        exporter: string;
        pct: number;
        description: string;
        origin: string | null;
        quantity: number;
        unit: string | null;
        value_pkr: number;
        ntn: string | null;
      };

      const processedRows: ProcessedRow[] = [];

      mappedRows.forEach((row) => {
         try {
           // Validate and Parse Date
           const rawDate = (row["shipment_date"] || "") as string | number;
           let date = null;
           
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
             date = d.toISOString().split("T")[0];
           } else {
             throw new Error("Missing date");
           }

           const rawHs = (row["hs_code"] || "").toString().replace(/[^0-9.]+/g,"");
           let pct = parseFloat(rawHs);
           if (isNaN(pct)) pct = 0;
           
           const description = (row["product_description"] || "").toString().trim();

           if (!pct && !description) {
             throw new Error("Missing HS Code and Description");
           }

           const importer = (row["buyer_name"] || "").toString().trim();
           const exporter = (row["supplier_name"] || "").toString().trim();
           const origin = (row["origin_country"] || "").toString().trim() || null;
           const ntn = (row["ntn"] || "").toString().trim() || null;
           
           const rawQty = (row["quantity"] || "0").toString().replace(/[^0-9.-]+/g,"");
           let quantity = parseFloat(rawQty);
           if (isNaN(quantity)) quantity = 0;
           
           const unit = (row["unit"] || "").toString().trim() || null;
           
           const rawVal = (row["value_pkr"] || "0").toString().replace(/[^0-9.-]+/g,"");
           let value_pkr = parseFloat(rawVal);
           if (isNaN(value_pkr)) value_pkr = 0;

           processedRows.push({
             date, 
             importer, 
             exporter, 
             pct, 
             description, 
             origin, 
             quantity, 
             unit, 
             value_pkr,
             ntn
           });
         } catch {
           totalSkipped++;
         }
      });

      const values: unknown[] = [];
      let queryParams = "";

      const period = fileName.split('.')[0] || "UNKNOWN";
      const source_file = fileName;

      processedRows.forEach((row, index) => {
         const offset = index * 12;
         queryParams += `($${offset+1}, $${offset+2}, $${offset+3}::date, $${offset+4}, $${offset+5}, $${offset+6}, $${offset+7}, $${offset+8}, $${offset+9}, $${offset+10}, $${offset+11}, $${offset+12}),`;
         
         values.push(
           period,
           source_file,
           row.date, 
           row.importer, 
           row.exporter, 
           row.pct, 
           row.description, 
           row.origin, 
           row.quantity, 
           row.unit, 
           row.value_pkr,
           row.ntn
         );
      });

      batchProcessed = processedRows.length;

      if (batchProcessed > 0) {
         queryParams = queryParams.slice(0, -1);
         const client = await pool.connect();
         try {
           await client.query("BEGIN");
           const res = await client.query(`
             INSERT INTO export_shipments 
             (period, source_file, date, importer, exporter, pct, description, origin, qty, unit, value_pkr, ntn)
             VALUES ${queryParams}
           `, values);
           
           await client.query("COMMIT");
           
           totalInserted += res.rowCount || batchProcessed;
           
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
