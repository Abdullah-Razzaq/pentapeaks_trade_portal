const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS data_access_months INT DEFAULT 1;");
    console.log("Migration successful");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    pool.end();
  }
}

run();
