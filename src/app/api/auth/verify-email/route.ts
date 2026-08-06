import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const { rows } = await pool.query(
      "SELECT id, name, email, role, verification_code, verification_code_expires_at FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];

    if (!user.verification_code || user.verification_code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date() > new Date(user.verification_code_expires_at)) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    const sessionToken = crypto.randomUUID();

    // Activate user, clear codes, and set session token
    await pool.query(
      "UPDATE users SET is_active = true, verification_code = NULL, verification_code_expires_at = NULL, current_session_token = $1 WHERE id = $2",
      [sessionToken, user.id]
    );

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionToken,
    });

    const response = NextResponse.json({ success: true, message: "Email verified successfully" }, { status: 200 });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
