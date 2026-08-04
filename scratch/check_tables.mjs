import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const data = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log(data.rows);
  process.exit(0);
}
check();
