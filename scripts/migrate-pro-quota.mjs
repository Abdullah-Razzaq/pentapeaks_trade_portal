// Using --env-file instead
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    console.log("Adding pro_searched_products and pro_quota_reset_date to users table...");

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS pro_searched_products JSONB DEFAULT '[]'::jsonb;
    `);

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS pro_quota_reset_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
