import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  planType: z.enum(["trial", "pro", "premium"]).optional(),
  batch: z.string().nullable().optional(),
  isSuspended: z.boolean().optional(),
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

  const { rows: targetUserRows } = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
  if (targetUserRows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (targetUserRows[0].role === "admin") {
    return NextResponse.json({ error: "You cannot delete another admin account." }, { status: 403 });
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

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { isActive, planType, batch, isSuspended } = parsed.data;

  if (userId === session.userId && (isActive !== undefined || planType !== undefined || isSuspended !== undefined)) {
    return NextResponse.json({ error: "You cannot change your own account status or plan." }, { status: 400 });
  }
  
  const { rows: targetUserRows } = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
  if (targetUserRows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (targetUserRows[0].role === "admin") {
    return NextResponse.json({ error: "You cannot modify another admin account." }, { status: 403 });
  }
  
  let query = "";
  let queryParams: any[] = [];
  const returningClause = "RETURNING id, name, email, role, is_active, plan_type, is_suspended, subscription_expires_at, created_at, last_activated_at, download_count";

  if (planType !== undefined) {
    if (planType === "pro" || planType === "premium") {
      query = `UPDATE users SET 
                 plan_type = $1,
                 subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
               WHERE id = $2 ${returningClause}`;
    } else {
      query = `UPDATE users SET plan_type = $1 WHERE id = $2 ${returningClause}`;
    }
    queryParams = [planType, userId];
  } else if (isActive !== undefined) {
    if (isActive) {
      query = `UPDATE users SET is_active = $1, last_activated_at = CURRENT_TIMESTAMP, download_count = 0, subscription_expires_at = CURRENT_TIMESTAMP + interval '30 days' WHERE id = $2 ${returningClause}`;
    } else {
      query = `UPDATE users SET is_active = $1 WHERE id = $2 ${returningClause}`;
    }
    queryParams = [isActive, userId];
  } else if (batch !== undefined) {
    query = `UPDATE users SET batch = $1 WHERE id = $2 RETURNING id, name, email, role, is_active, plan_type, is_suspended, batch, subscription_expires_at, created_at, last_activated_at, download_count`;
    queryParams = [batch, userId];
  } else if (isSuspended !== undefined) {
    query = `UPDATE users SET is_suspended = $1 WHERE id = $2 ${returningClause}`;
    queryParams = [isSuspended, userId];
  } else {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const { rows } = await pool.query(query, queryParams);

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}
