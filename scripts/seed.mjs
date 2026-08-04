import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local before seeding.");
  process.exit(1);
}

const adminName = process.env.ADMIN_NAME || "Administrator";
const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log("Ensuring users table exists...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);

  if (rows.length > 0) {
    console.log(`Admin user already exists: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'admin', true)`,
      [adminName, adminEmail, passwordHash]
    );
    console.log(`Created admin user: ${adminEmail}`);
    console.log(`Temporary password: ${adminPassword}`);
    console.log("Please change this password by creating a new admin and deactivating this one, or updating it directly in the database.");
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
