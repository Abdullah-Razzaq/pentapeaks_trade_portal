import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetAndSeedAdmins() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Truncating users table...');
    // TRUNCATE CASCADE will remove linked rows in sessions/tokens if foreign keys are set up.
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    const admin1Name = process.env.ADMIN1_NAME;
    const admin1Email = process.env.ADMIN1_EMAIL;
    const admin1Password = process.env.ADMIN1_PASSWORD;
    const admin2Name = process.env.ADMIN2_NAME;
    const admin2Email = process.env.ADMIN2_EMAIL;
    const admin2Password = process.env.ADMIN2_PASSWORD;

    if (!admin1Email || !admin1Password || !admin2Email || !admin2Password) {
      throw new Error('Admin credentials not found in .env.local');
    }

    const salt = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash(admin1Password, salt);
    const hash2 = await bcrypt.hash(admin2Password, salt);

    console.log('Seeding admins...');
    
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role, is_active, plan_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(insertQuery, [admin1Name || 'Admin1', admin1Email, hash1, 'admin', true, 'premium']);
    await client.query(insertQuery, [admin2Name || 'Admin2', admin2Email, hash2, 'admin', true, 'premium']);

    await client.query('COMMIT');
    console.log('Successfully cleared users and seeded 2 Admin accounts.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAndSeedAdmins();
