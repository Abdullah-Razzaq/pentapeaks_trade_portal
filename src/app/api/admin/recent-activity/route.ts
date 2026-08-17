import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT id, dataset_name, file_size, records_processed, status, created_at 
       FROM data_activity_logs 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    return NextResponse.json({ logs: rows });
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
