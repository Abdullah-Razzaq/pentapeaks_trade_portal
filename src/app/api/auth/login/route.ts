import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import {
  createSessionToken,
  verifyPassword,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const { rows } = await pool.query<{
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: "admin" | "user";
    is_active: boolean;
    last_activated_at: string;
  }>(
    `SELECT id, name, email, password_hash, role, is_active, last_activated_at
     FROM users WHERE email = $1 LIMIT 1`,
    [email.toLowerCase()]
  );

  const user = rows[0];

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.is_active) {
    return NextResponse.json(
      { error: "Your 30-day subscription has expired. Please pay your dues to reactivate your account and restore full access to Pentapeaks Trade Portal." },
      { status: 403 }
    );
  }

  if (user.role !== "admin") {
    const now = new Date().getTime();
    const lastActivated = new Date(user.last_activated_at).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    if (now > lastActivated + thirtyDays) {
      return NextResponse.json(
        { error: "Your 30-day subscription has expired. Please pay your dues to reactivate your account and restore full access to Pentapeaks Trade Portal." },
        { status: 403 }
      );
    }
  }

  const sessionToken = crypto.randomUUID();
  await pool.query("UPDATE users SET current_session_token = $1 WHERE id = $2", [sessionToken, user.id]);

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionToken,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
