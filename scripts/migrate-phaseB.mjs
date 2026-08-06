import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log("Starting Phase B Migration (Adding OTP columns to users)...");
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMP;
    `);
    console.log("Successfully added OTP columns to users table.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
