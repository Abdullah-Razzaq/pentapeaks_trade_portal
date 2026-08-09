import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["admin", "user"]),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pool.query(
    `SELECT id, name, email, role, is_active, plan_type, subscription_start_date, subscription_expires_at, created_at, batch, business_role
     FROM users
     ORDER BY created_at DESC`
  );

  return NextResponse.json({ users: rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const startDate = new Date();
  const expireDate = new Date();
  expireDate.setDate(startDate.getDate() + 7);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active, subscription_expires_at, plan_type)
     VALUES ($1, $2, $3, $4, true, $5, 'trial')
     RETURNING id, name, email, role, is_active, subscription_expires_at, plan_type, created_at`,
    [name, normalizedEmail, passwordHash, role, expireDate]
  );

  return NextResponse.json({ user: rows[0] }, { status: 201 });
}
