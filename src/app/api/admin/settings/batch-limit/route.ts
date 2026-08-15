import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { z } from "zod";

const updateLimitSchema = z.object({
  current_max_batch: z.number().int().min(0).max(100),
});

export async function GET() {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS settings (key VARCHAR PRIMARY KEY, value VARCHAR)');
    await pool.query("INSERT INTO settings (key, value) VALUES ('current_max_batch', '15') ON CONFLICT (key) DO NOTHING");
    
    const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'current_max_batch'");
    const current_max_batch = rows.length > 0 ? parseInt(rows[0].value, 10) : 15;
    
    return NextResponse.json({ current_max_batch });
  } catch (error) {
    console.error("Error fetching batch limit:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateLimitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid current_max_batch." }, { status: 400 });
    }

    const { current_max_batch } = parsed.data;

    await pool.query('CREATE TABLE IF NOT EXISTS settings (key VARCHAR PRIMARY KEY, value VARCHAR)');
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('current_max_batch', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [current_max_batch.toString()]
    );

    return NextResponse.json({ success: true, current_max_batch });
  } catch (error) {
    console.error("Error updating batch limit:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
