import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("user_id");

    if (userId) {
      // Get user specific payment history
      const { rows: payments } = await pool.query(
        `SELECT id, amount, currency, status, payment_method, paid_at, notes
         FROM payments
         WHERE user_id = $1
         ORDER BY paid_at DESC`,
        [userId]
      );
      
      const { rows: totals } = await pool.query(
        `SELECT SUM(amount) as total_paid
         FROM payments
         WHERE user_id = $1 AND status = 'completed'`,
        [userId]
      );

      return NextResponse.json({
        payments,
        total_paid: totals[0]?.total_paid || 0
      });
    }

    // Otherwise, return global payments dashboard data
    const { rows: recentPayments } = await pool.query(
      `SELECT p.id, p.amount, p.currency, p.status, p.payment_method, p.paid_at, p.notes, u.name as user_name, u.email as user_email, u.id as user_id
       FROM payments p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.paid_at DESC
       LIMIT 50`
    );

    const { rows: monthlyRevenue } = await pool.query(
      `SELECT 
         DATE_TRUNC('month', paid_at) as month,
         COUNT(DISTINCT user_id) as paying_users,
         COUNT(id) as transactions_count,
         SUM(amount) as total_revenue
       FROM payments
       WHERE status = 'completed'
       GROUP BY DATE_TRUNC('month', paid_at)
       ORDER BY month DESC`
    );

    const { rows: currentMonthRow } = await pool.query(
      `SELECT SUM(amount) as total
       FROM payments
       WHERE status = 'completed' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    const { rows: lastMonthRow } = await pool.query(
      `SELECT SUM(amount) as total
       FROM payments
       WHERE status = 'completed' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`
    );

    const { rows: lifetimeRow } = await pool.query(
      `SELECT SUM(amount) as total
       FROM payments
       WHERE status = 'completed'`
    );

    return NextResponse.json({
      recentPayments,
      monthlyRevenue,
      summary: {
        thisMonth: currentMonthRow[0]?.total || 0,
        lastMonth: lastMonthRow[0]?.total || 0,
        lifetime: lifetimeRow[0]?.total || 0
      }
    });

  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id, amount, currency, status, payment_method, paid_at, notes } = await request.json();

    if (!user_id || amount === undefined) {
      return NextResponse.json({ error: "user_id and amount are required" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO payments (user_id, amount, currency, status, payment_method, paid_at, notes)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, CURRENT_TIMESTAMP), $7)
       RETURNING *`,
      [user_id, amount, currency || 'PKR', status || 'completed', payment_method || 'bank_transfer', paid_at || null, notes || '']
    );

    return NextResponse.json({ payment: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentId = request.nextUrl.searchParams.get("id");
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    await pool.query("DELETE FROM payments WHERE id = $1", [paymentId]);

    return NextResponse.json({ success: true, message: "Payment entry removed successfully" });
  } catch (error) {
    console.error("Payments DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete payment record" }, { status: 500 });
  }
}
