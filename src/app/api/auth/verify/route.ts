import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET removed: Link-based verification disabled

export async function POST(request: NextRequest) {
  try {
    const { code, email } = await request.json();
    if (!code || !email) {
      return NextResponse.json({error: "Missing code or email"}, {status: 400});
    }

    const normalizedEmail = email.toLowerCase();

    // Query pending verifications using the 6-digit prefix
    const { rows } = await pool.query(
      "SELECT token, email, name, password_hash, batch, expires_at FROM pending_verifications WHERE token LIKE $1 AND email = $2",
      [`${code}_%`, normalizedEmail]
    );

    if (rows.length === 0) {
      return NextResponse.json({error: "Invalid or expired verification code."}, {status: 400});
    }

    const pending = rows[0];

    if (new Date() > new Date(pending.expires_at)) {
      await pool.query("DELETE FROM pending_verifications WHERE token = $1", [pending.token]);
      return NextResponse.json({error: "Verification code expired."}, {status: 400});
    }

    // Set subscription expiry (1 day trial)
    const startDate = new Date();
    const expireDate = new Date();
    expireDate.setDate(startDate.getDate() + 1);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
      if (existingUser.rows.length === 0) {
        await client.query(
          `INSERT INTO users (name, email, password_hash, role, is_active, subscription_expires_at, plan_type, batch)
           VALUES ($1, $2, $3, 'user', true, $4, 'trial', $5)`,
          [pending.name, normalizedEmail, pending.password_hash, expireDate, pending.batch]
        );
      }
      
      await client.query("DELETE FROM pending_verifications WHERE email = $1", [normalizedEmail]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({message: "Verified successfully"});
  } catch (error) {
    console.error("Verify email POST error:", error);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
