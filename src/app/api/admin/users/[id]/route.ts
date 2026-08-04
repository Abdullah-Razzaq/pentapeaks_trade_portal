import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

const updateUserSchema = z.object({
  isActive: z.boolean(),
});

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  if (userId === session.userId) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [userId]);

  if (!rowCount || rowCount === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  if (userId === session.userId) {
    return NextResponse.json({ error: "You cannot change your own account status." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  let query = `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, role, is_active, created_at, last_activated_at, download_count`;
  
  if (parsed.data.isActive) {
    query = `UPDATE users SET is_active = $1, last_activated_at = CURRENT_TIMESTAMP, download_count = 0, subscription_expires_at = CURRENT_DATE + interval '30 days' WHERE id = $2 RETURNING id, name, email, role, is_active, created_at, last_activated_at, download_count, subscription_expires_at`;
  }

  const { rows } = await pool.query(query, [parsed.data.isActive, userId]);

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}
