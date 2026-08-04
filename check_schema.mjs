import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'export_shipments'")
  .then(res => { console.log(JSON.stringify(res.rows, null, 2)); pool.end(); })
  .catch(err => { console.error(err); process.exit(1); })
