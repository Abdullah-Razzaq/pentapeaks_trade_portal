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

    // 1. Check for existing email in users
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // Generate secure token for magic link and 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const verificationToken = `${code}_${crypto.randomBytes(32).toString('hex')}`;
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24); // 24 hours validity

    // 3. Upsert into pending_verifications (allow resending if requested again)
    await pool.query(
      `INSERT INTO pending_verifications (token, email, name, password_hash, batch, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (token) DO NOTHING`,
      [verificationToken, normalizedEmail, name, passwordHash, batch, verificationExpiresAt]
    );

    // Dynamic Base URL handling
    const origin = request.headers.get("origin");
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "https://trade.pentapeaks.com";

    // 4. Send Email
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken, baseUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "Verification link sent." }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
