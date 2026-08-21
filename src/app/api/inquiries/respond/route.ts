import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inquiry_id, message } = await request.json();
    if (!inquiry_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO inquiry_responses (inquiry_id, user_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [inquiry_id, session.userId, message]
    );

    return NextResponse.json({ response: rows[0] });
  } catch (error) {
    console.error("Error creating inquiry response:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
