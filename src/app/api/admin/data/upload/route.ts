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
        value_pkr NUMERIC NOT NULL DEFAULT 0
      )
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

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      let rows: any[] = [];
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      } catch (err) {
        console.error("Parse error for file", file.name, err);
        return NextResponse.json({ error: \`Failed to parse file: \${file.name}\` }, { status: 400 });
      }

      if (rows.length === 0) continue;

      const BATCH_SIZE = 2000;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const values: any[] = [];
        let queryParams = "";
        
        let batchProcessed = 0;
        
        batch.forEach((row, rowIndex) => {
           // Normalization
           let rawDate = row["shipment_date"] || row["Shipment Date"] || row["Date"] || "";
           let shipment_date = null;
           if (rawDate) {
             const d = new Date(rawDate);
             if (!isNaN(d.getTime())) {
               shipment_date = d.toISOString().split("T")[0];
             }
           }

           const buyer_name = (row["buyer_name"] || row["Buyer Name"] || row["Importer"] || "").toString().trim();
           const supplier_name = (row["supplier_name"] || row["Supplier Name"] || row["Exporter"] || "").toString().trim();
           const hs_code = (row["hs_code"] || row["HS Code"] || row["PCT"] || "").toString().trim();
           const product_description = (row["product_description"] || row["Product Description"] || row["Description"] || "").toString().trim();
           const destination_country = (row["destination_country"] || row["Destination Country"] || row["Destination"] || "").toString().trim() || null;
           const origin_country = (row["origin_country"] || row["Origin Country"] || row["Origin"] || "").toString().trim() || null;
           
           // Clean numeric values by removing commas and currency symbols
           let rawQty = (row["quantity"] || row["Quantity"] || "0").toString().replace(/[^0-9.-]+/g,"");
           let quantity = parseFloat(rawQty);
           if (isNaN(quantity)) quantity = 0;
           
           const unit = (row["unit"] || row["Unit"] || "").toString().trim() || null;
           
           let rawVal = (row["value_pkr"] || row["Value"] || row["Value PKR"] || "0").toString().replace(/[^0-9.-]+/g,"");
           let value_pkr = parseFloat(rawVal);
           if (isNaN(value_pkr)) value_pkr = 0;

           const offset = batchProcessed * 10;
           queryParams += \`($\${offset+1}::date, $\${offset+2}, $\${offset+3}, $\${offset+4}, $\${offset+5}, $\${offset+6}, $\${offset+7}, $\${offset+8}, $\${offset+9}, $\${offset+10}),\`;
           
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
             value_pkr
           );
           batchProcessed++;
        });

        if (batchProcessed > 0) {
          queryParams = queryParams.slice(0, -1);
          const client = await pool.connect();
          try {
            await client.query("BEGIN");
            const res = await client.query(\`
              INSERT INTO trade_data 
              (shipment_date, buyer_name, supplier_name, hs_code, product_description, destination_country, origin_country, quantity, unit, value_pkr)
              VALUES \${queryParams}
              ON CONFLICT (shipment_date, buyer_name, supplier_name, hs_code, product_description, value_pkr)
              DO UPDATE SET
                destination_country = EXCLUDED.destination_country,
                origin_country = EXCLUDED.origin_country,
                quantity = EXCLUDED.quantity,
                unit = EXCLUDED.unit
              RETURNING (xmax = 0) AS is_insert
            \`, values);
            
            await client.query("COMMIT");
            
            totalProcessed += batchProcessed;
            
            // Count inserts vs updates based on xmax
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
            throw e;
          } finally {
            client.release();
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalProcessed, 
      inserted: totalInserted, 
      updated: totalUpdated 
    });

  } catch (error: any) {
    console.error("Data upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process data upload." }, { status: 400 });
  }
}
