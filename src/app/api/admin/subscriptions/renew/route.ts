import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await request.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const startDateObj = new Date(); // Today
    const renewDateObj = new Date(startDateObj);
    renewDateObj.setDate(renewDateObj.getDate() + 30);
    const alertDateObj = new Date(startDateObj);
    alertDateObj.setDate(alertDateObj.getDate() + 28);

    const { rows } = await pool.query(
      `UPDATE admin_subscriptions 
       SET start_date = $1, renew_date = $2, alert_date = $3, is_active = true
       WHERE id = $4 
       RETURNING *`,
      [
        startDateObj.toISOString().split('T')[0],
        renewDateObj.toISOString().split('T')[0],
        alertDateObj.toISOString().split('T')[0],
        subscriptionId
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, subscription: rows[0] });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
