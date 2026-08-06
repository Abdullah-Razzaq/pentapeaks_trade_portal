import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding anti-scraping columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS daily_search_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_search_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;
      ALTER TABLE users ADD CONSTRAINT users_plan_type_check CHECK (plan_type = ANY (ARRAY['trial'::text, 'pro'::text, 'premium'::text]));
    `);

    await client.query('COMMIT');
    console.log('Migration successful.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
