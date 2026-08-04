import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    console.log("Migrating users table...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS current_session_token TEXT,
      ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
    `);
    // ensure is_active exists and is defaulted to true if not already. The previous check_schema showed it exists as boolean.
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed", err);
    process.exit(1);
  } finally {
    pool.end();
  }
}

migrate();
