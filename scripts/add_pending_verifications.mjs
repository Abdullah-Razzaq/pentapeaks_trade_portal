
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("Creating pending_verifications table...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_verifications (
        token text PRIMARY KEY,
        email text NOT NULL,
        name text NOT NULL,
        password_hash text NOT NULL,
        batch text NOT NULL,
        expires_at timestamp with time zone NOT NULL
      );
    `);
    console.log("Successfully created pending_verifications table.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
