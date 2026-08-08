import { Pool } from "pg";
import fs from "fs";

const envStr = fs.readFileSync(".env.local", "utf-8");
const dbUrl = envStr.split("\n").find(line => line.startsWith("DATABASE_URL=")).split("=")[1].replace(/"/g, "").trim();

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS pro_products TEXT[] DEFAULT '{}';
    `);
    console.log("Migration successful: added pro_products column");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

main();
