import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const { rows } = await pool.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_plan_type_check'");
  console.log(rows);
  await pool.end();
}

check();
