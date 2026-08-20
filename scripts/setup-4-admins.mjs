import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetAndSeedAdmins() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Deleting existing admin users...');
    await client.query("DELETE FROM users WHERE role = 'admin'");

    const admins = [
      { name: process.env.ADMIN1_NAME, email: process.env.ADMIN1_EMAIL, password: process.env.ADMIN1_PASSWORD },
      { name: process.env.ADMIN2_NAME, email: process.env.ADMIN2_EMAIL, password: process.env.ADMIN2_PASSWORD },
      { name: process.env.ADMIN3_NAME, email: process.env.ADMIN3_EMAIL, password: process.env.ADMIN3_PASSWORD },
      { name: process.env.ADMIN4_NAME, email: process.env.ADMIN4_EMAIL, password: process.env.ADMIN4_PASSWORD },
    ];

    console.log('Seeding 4 admins...');
    
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role, is_active, plan_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const admin of admins) {
      if (!admin.email || !admin.password) {
        console.warn(`Skipping admin ${admin.name} due to missing credentials.`);
        continue;
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(admin.password, salt);
      await client.query(insertQuery, [admin.name, admin.email, hash, 'admin', true, 'premium']);
      console.log(`Created admin: ${admin.email}`);
    }

    await client.query('COMMIT');
    console.log('Successfully cleared old admins and seeded the new 4 Admin accounts.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAndSeedAdmins();
