import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CURRENT_DATE >= alert_date AND CURRENT_DATE < renew_date ? 
    // The requirement says: CURRENT_DATE >= alert_date. We should also check is_active = true.
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
