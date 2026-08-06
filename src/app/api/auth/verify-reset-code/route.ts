import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { z } from "zod";

const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = verifyResetCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, code } = parsed.data;
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

    return NextResponse.json({ success: true, message: "Code verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
