import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address.").refine((val) => val.toLowerCase().endsWith("@gmail.com"), {
    message: "Only Gmail addresses are accepted.",
  }),
  password: z.string().min(6, "Password must be at least 6 characters."),
  batch: z.string().min(1, "Batch selection is required."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { name, email, password, batch } = parsed.data;
    
    // Dynamic Batch Validation
    let maxBatch = 15;
    try {
      const { rows: settingsRows } = await pool.query("SELECT value FROM settings WHERE key = 'current_max_batch'");
      if (settingsRows.length > 0) {
        maxBatch = parseInt(settingsRows[0].value, 10);
      }
    } catch {
      // settings table might not exist yet if admin hasn't visited the page
    }

    const validBatches = ["Not a Student"];
    for (let i = 1; i <= maxBatch; i++) {
      validBatches.push(`Batch ${i}`);
    }

    if (!validBatches.includes(batch)) {
      return NextResponse.json({ error: "Invalid batch selection." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. Check for existing email
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Set subscription expiry (3 days trial)
    const startDate = new Date();
    const expireDate = new Date();
    expireDate.setDate(startDate.getDate() + 3);

    // Generate 6-digit OTP
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setMinutes(verificationExpiresAt.getMinutes() + 15);

    // 4. Insert new user (inactive until verified)
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active, subscription_expires_at, plan_type, batch, verification_code, verification_code_expires_at)
       VALUES ($1, $2, $3, 'user', false, $4, 'trial', $5, $6, $7)
       RETURNING id, name, email, role, is_active, subscription_expires_at, plan_type, batch, created_at`,
      [name, normalizedEmail, passwordHash, expireDate, batch, verificationCode, verificationExpiresAt]
    );

    // 5. Send Email
    try {
      await sendVerificationEmail(normalizedEmail, verificationCode);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // We could delete the user here or leave them inactive and let them resend
    }

    return NextResponse.json({ user: rows[0], message: "Verification code sent." }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
