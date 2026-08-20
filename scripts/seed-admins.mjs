import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  for (let i = 1; i <= 5; i++) {
    const name = process.env[`ADMIN${i}_NAME`];
    const email = process.env[`ADMIN${i}_EMAIL`];
    const password = process.env[`ADMIN${i}_PASSWORD`];

    if (!name || !email || !password) {
      console.log(`Skipping Admin ${i} - Missing credentials in .env.local`);
      continue;
    }

    const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (rows.length > 0) {
      console.log(`Admin user already exists: ${email}. Updating password and name...`);
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name = $1, password_hash = $2, role = 'admin', is_active = true WHERE email = $3`,
        [name, passwordHash, email]
      );
      console.log(`Updated admin user: ${email}`);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'admin', true)`,
        [name, email, passwordHash]
      );
      console.log(`Created new admin user: ${email}`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Failed to seed admins:", err);
  process.exit(1);
});
