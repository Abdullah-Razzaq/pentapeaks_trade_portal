import { Pool } from "pg";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local before running.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

// Resolve the CSV path relative to this script
const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../../export data jan2026/harmonized-system.csv");

/**
 * Parse a single CSV line, handling quoted fields with commas.
 * Returns an array of field values.
 */
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

async function main() {
  console.log(`Reading CSV from: ${csvPath}`);

  // Ensure pg_trgm extension (for trigram index on description)
  console.log("Ensuring pg_trgm extension...");
  await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

  // Create table
  console.log("Creating hs_code_directory table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hs_code_directory (
      id SERIAL PRIMARY KEY,
      section TEXT NOT NULL,
      hs_code TEXT NOT NULL,
      description TEXT NOT NULL,
      parent TEXT,
      level INTEGER
    );
  `);

  // Create indexes
  console.log("Creating indexes...");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_hs_code_directory_hscode ON hs_code_directory(hs_code);");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_hs_code_directory_desc_trgm ON hs_code_directory USING gin (description gin_trgm_ops);");

  // Truncate existing data to allow re-runs
  await pool.query("TRUNCATE hs_code_directory RESTART IDENTITY;");
  console.log("Table ready. Starting CSV import...");

  const rl = createInterface({
    input: createReadStream(csvPath, "utf-8"),
    crlfDelay: Infinity,
  });

  const BATCH_SIZE = 500;
  let batch = [];
  let totalInserted = 0;
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue; // skip header row: section,hscode,description,parent,level
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    const fields = parseCSVLine(trimmed);
    if (fields.length < 5) continue;

    const [section, hsCode, description, parent, levelStr] = fields;
    const level = parseInt(levelStr, 10) || null;

    batch.push({ section, hsCode, description, parent, level });

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      totalInserted += batch.length;
      process.stdout.write(`\r  Inserted ${totalInserted} rows...`);
      batch = [];
    }
  }

  // Insert remaining rows
  if (batch.length > 0) {
    await insertBatch(batch);
    totalInserted += batch.length;
  }

  console.log(`\nDone! Imported ${totalInserted} HS code records.`);
  await pool.end();
}

/**
 * Insert a batch of rows using a single multi-row INSERT statement.
 */
async function insertBatch(rows) {
  const values = [];
  const placeholders = [];

  rows.forEach((row, i) => {
    const offset = i * 5;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
    );
    values.push(row.section, row.hsCode, row.description, row.parent, row.level);
  });

  await pool.query(
    `INSERT INTO hs_code_directory (section, hs_code, description, parent, level)
     VALUES ${placeholders.join(", ")}`,
    values
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
