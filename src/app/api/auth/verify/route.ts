import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const email = request.nextUrl.searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
    }

    const normalizedEmail = email.toLowerCase();

    // Query pending verifications
    const { rows } = await pool.query(
      "SELECT token, email, name, password_hash, batch, expires_at FROM pending_verifications WHERE token = $1 AND email = $2",
      [token, normalizedEmail]
    );

    if (rows.length === 0) {
      return NextResponse.redirect(new URL("/login?error=invalid_or_expired_link", request.url));
    }

    const pending = rows[0];

    if (new Date() > new Date(pending.expires_at)) {
      await pool.query("DELETE FROM pending_verifications WHERE token = $1", [token]);
      return NextResponse.redirect(new URL("/login?error=token_expired", request.url));
    }

    // Set subscription expiry (3 days trial)
    const startDate = new Date();
    const expireDate = new Date();
    expireDate.setDate(startDate.getDate() + 3);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if user somehow was created while this was pending
      const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
      if (existingUser.rows.length === 0) {
        // Insert into users
        await client.query(
          `INSERT INTO users (name, email, password_hash, role, is_active, subscription_expires_at, plan_type, batch)
           VALUES ($1, $2, $3, 'user', true, $4, 'trial', $5)`,
          [pending.name, normalizedEmail, pending.password_hash, expireDate, pending.batch]
        );
      }
      
      // Delete from pending
      await client.query("DELETE FROM pending_verifications WHERE email = $1", [normalizedEmail]);
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Redirect to login with success message
    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch (error) {
    console.error("Verify email GET error:", error);
    return NextResponse.redirect(new URL("/login?error=internal_error", request.url));
  }
}
