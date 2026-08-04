import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'ACTIVE', 
    ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone;
  `);
  
  // Try to rename column, ignore error if it already exists or doesn't exist
  try {
    await client.query(`ALTER TABLE users RENAME COLUMN subscription_end_date TO subscription_expires_at;`);
  } catch (e) {
    console.log("Column might already be renamed or missing", e.message);
  }
  
  console.log("Migration successful");
} catch (e) {
  console.error("Migration failed:", e);
} finally {
  await client.end();
}
