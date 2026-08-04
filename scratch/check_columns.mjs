import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const query = `
    SELECT DISTINCT h.hs_code, h.description 
    FROM export_shipments e
    JOIN hs_code_directory h ON h.hs_code = SUBSTRING(REPLACE(to_char(e.pct, 'FM0000.0000'), '.', '') FROM 1 FOR 2)
    WHERE h.level = 2 AND e.pct IS NOT NULL 
    ORDER BY h.hs_code ASC
  `;
  const data = await pool.query(query);
  console.log(data.rows);
  process.exit(0);
}
check();
