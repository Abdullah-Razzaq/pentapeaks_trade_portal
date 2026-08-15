import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);

    if (rows.length === 0) {
      // Return 200 even if not found to prevent email enumeration
      return NextResponse.json({ success: true, message: "If the email exists, a reset code was sent." }, { status: 200 });
    }

    const user = rows[0];

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetExpiresAt = new Date();
    resetExpiresAt.setMinutes(resetExpiresAt.getMinutes() + 15);

    await pool.query(
      "UPDATE users SET reset_code = $1, reset_code_expires_at = $2 WHERE id = $3",
      [resetCode, resetExpiresAt, user.id]
    );


    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      return NextResponse.json({ error: "Failed to send email. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Reset code sent." }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
