import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { z } from "zod";

const activateSchema = z.object({
  target_user_id: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid target_user_id." }, { status: 400 });
    }

    const { target_user_id } = parsed.data;

    const { rows } = await pool.query(
      `UPDATE users 
       SET 
         subscription_status = 'ACTIVE',
         subscription_start_date = CURRENT_TIMESTAMP,
         subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days',
         downloads_today = 0,
         last_download_date = CURRENT_DATE,
         is_active = true,
         last_activated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, subscription_status, subscription_expires_at`,
      [target_user_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User activated successfully.", user: rows[0] });
  } catch (error) {
    console.error("Activate user error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
