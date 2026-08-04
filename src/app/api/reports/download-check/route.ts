import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "admin") {
    return NextResponse.json({ success: true, allowed: true });
  }

  const { rows } = await pool.query("SELECT download_count FROM users WHERE id = $1", [session.userId]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const downloadCount = rows[0].download_count;

  if (downloadCount >= 10) {
    return NextResponse.json(
      { error: "You have reached your limit of 10 downloads for this 30-day cycle." },
      { status: 429 }
    );
  }

  await pool.query("UPDATE users SET download_count = download_count + 1 WHERE id = $1", [session.userId]);
  
  return NextResponse.json({ success: true, allowed: true, newCount: downloadCount + 1 });
}
