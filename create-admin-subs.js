const { Pool } = require('pg');
const fs = require('fs');

const envStr = fs.readFileSync('.env.local', 'utf-8');
const dbUrl = envStr.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].replace(/"/g, '').trim();
const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_subscriptions (
        id SERIAL PRIMARY KEY,
        subscription_name TEXT NOT NULL,
        start_date DATE NOT NULL,
        renew_date DATE NOT NULL,
        alert_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log('Table created successfully');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
