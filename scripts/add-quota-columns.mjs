import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Adding quota columns to users table...");
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS downloads_today INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_download_date DATE,
      ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
    `);
    
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

main();
