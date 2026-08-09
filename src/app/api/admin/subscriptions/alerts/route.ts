import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The requirement says: alert when subscription is at its 28-day mark.
    const { rows } = await pool.query(
      `SELECT * FROM admin_subscriptions 
       WHERE is_active = true AND CURRENT_DATE >= alert_date`
    );

    return NextResponse.json({ alerts: rows });
  } catch (error) {
    console.error("Error fetching subscription alerts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
