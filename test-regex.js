const { Pool } = require('pg');
const fs = require('fs');

const envStr = fs.readFileSync('.env.local', 'utf-8');
const dbUrl = envStr.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].replace(/"/g, '').trim();
const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query(`
      SELECT UPPER(SUBSTRING(description FROM '(?i)\\m([A-Za-z]{4,})(?:[^A-Za-z]|$)')) AS keyword
      FROM (SELECT description FROM export_shipments LIMIT 10000) as sample
      WHERE description ~* '[A-Za-z]'
      GROUP BY keyword
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
