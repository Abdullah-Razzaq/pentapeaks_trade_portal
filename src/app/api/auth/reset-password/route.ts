import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const { rows } = await pool.query(
      "SELECT id, reset_code, reset_code_expires_at FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];

    if (!user.reset_code || user.reset_code !== code) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    if (new Date() > new Date(user.reset_code_expires_at)) {
      return NextResponse.json({ error: "Reset code has expired" }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await pool.query(
      "UPDATE users SET password_hash = $1, reset_code = NULL, reset_code_expires_at = NULL WHERE id = $2",
      [passwordHash, user.id]
    );

    return NextResponse.json({ success: true, message: "Password has been reset successfully" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
