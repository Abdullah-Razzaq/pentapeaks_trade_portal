import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const email = request.nextUrl.searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const { rows } = await pool.query(
      "SELECT id, name, email, role, verification_code, verification_code_expires_at FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", request.url));
    }

    const user = rows[0];

    if (!user.verification_code || user.verification_code !== token) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    if (new Date() > new Date(user.verification_code_expires_at)) {
      return NextResponse.redirect(new URL("/login?error=token_expired", request.url));
    }

    const sessionToken = crypto.randomUUID();

    // Activate user, clear codes, and set session token
    await pool.query(
      "UPDATE users SET is_active = true, verification_code = NULL, verification_code_expires_at = NULL, current_session_token = $1 WHERE id = $2",
      [sessionToken, user.id]
    );

    const authToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionToken,
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    response.cookies.set(SESSION_COOKIE_NAME, authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Verify email GET error:", error);
    return NextResponse.redirect(new URL("/login?error=internal_error", request.url));
  }
}
