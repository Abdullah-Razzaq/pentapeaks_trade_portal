import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT * FROM admin_subscriptions ORDER BY id DESC`
    );

    return NextResponse.json({ subscriptions: rows });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription_name, start_date } = await request.json();

    if (!subscription_name || !start_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startDateObj = new Date(start_date);
    
    // renew_date = start_date + 30 days
    const renewDateObj = new Date(startDateObj);
    renewDateObj.setDate(renewDateObj.getDate() + 30);
    
    // alert_date = start_date + 25 days
    const alertDateObj = new Date(startDateObj);
    alertDateObj.setDate(alertDateObj.getDate() + 25);

    const { rows } = await pool.query(
      `INSERT INTO admin_subscriptions (subscription_name, start_date, renew_date, alert_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        subscription_name,
        startDateObj.toISOString().split('T')[0],
        renewDateObj.toISOString().split('T')[0],
        alertDateObj.toISOString().split('T')[0]
      ]
    );

    return NextResponse.json({ subscription: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, is_active } = await request.json();

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE admin_subscriptions SET is_active = $1 WHERE id = $2 RETURNING *`,
      [is_active, id]
    );

    return NextResponse.json({ subscription: rows[0] });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM admin_subscriptions WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const startDateObj = new Date(); // Today
    const renewDateObj = new Date(startDateObj);
    renewDateObj.setDate(renewDateObj.getDate() + 30);
    const alertDateObj = new Date(startDateObj);
    alertDateObj.setDate(alertDateObj.getDate() + 25);

    const { rows } = await pool.query(
      `UPDATE admin_subscriptions 
       SET start_date = $1, renew_date = $2, alert_date = $3
       WHERE id = $4 
       RETURNING *`,
      [
        startDateObj.toISOString().split('T')[0],
        renewDateObj.toISOString().split('T')[0],
        alertDateObj.toISOString().split('T')[0],
        id
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ subscription: rows[0] });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
