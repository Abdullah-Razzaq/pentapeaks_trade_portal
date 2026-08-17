import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "5";
    const offset = searchParams.get("offset") || "0";

    const { rows } = await pool.query(
      `SELECT id, dataset_name, file_size, records_processed, status, created_at 
       FROM data_activity_logs 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [parseInt(limit, 10), parseInt(offset, 10)]
    );

    const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM data_activity_logs`);

    return NextResponse.json({ logs: rows, total: parseInt(countRows[0].count, 10) });
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await pool.query(`DELETE FROM data_activity_logs WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete activity log:", error);
    return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
