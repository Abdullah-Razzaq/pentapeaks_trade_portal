import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const { rows } = await pool.query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1 LIMIT 1",
    [session.userId]
  );

  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const isCorrect = await verifyPassword(currentPassword, user.password_hash);
  if (!isCorrect) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, session.userId]);

  return NextResponse.json({ ok: true });
}
