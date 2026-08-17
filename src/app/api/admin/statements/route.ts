import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthParam = request.nextUrl.searchParams.get("month");
    
    // Default to current month if not provided
    const targetDate = monthParam ? new Date(monthParam) : new Date();
    // Validate date
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Format for SQL (YYYY-MM-DD)
    const formattedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;

    const { rows: transactions } = await pool.query(
      `SELECT 
         p.id, p.paid_at, p.amount, p.currency, p.payment_method, p.transaction_ref, p.notes,
         u.name AS user_name, u.email AS user_email, u.plan_type
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.paid_at >= DATE_TRUNC('month', $1::date)
         AND p.paid_at < DATE_TRUNC('month', $1::date) + INTERVAL '1 month'
         AND p.status = 'completed'
       ORDER BY p.paid_at ASC;`,
      [formattedDate]
    );

    let currentMonthTotal = 0;
    let runningTotal = 0;
    // Process transactions and add cumulative running total
    const itemized = transactions.map((t) => {
      const amt = parseFloat(t.amount);
      currentMonthTotal += amt;
      runningTotal += amt;
      return {
        ...t,
        running_total: runningTotal
      };
    });

    const averageTransactionValue = transactions.length > 0 
      ? currentMonthTotal / transactions.length 
      : 0;

    const isExport = request.nextUrl.searchParams.get("export") === "true";

    if (isExport) {
      const headers = ["Date & Time", "Transaction ID", "User", "Plan", "Payment Method", "Amount", "Running Total"];
      const csvContent = [
        headers.join(","),
        ...itemized.map(t => [
          `"${new Date(t.paid_at).toLocaleString()}"`,
          `"${t.transaction_ref || '-'}"`,
          `"${t.user_name} (${t.user_email})"`,
          `"${t.plan_type.toUpperCase()}"`,
          `"${t.payment_method.replace('_', ' ')}"`,
          t.amount,
          t.running_total
        ].join(","))
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="Statement_${formattedDate.slice(0, 7)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        totalEarned: currentMonthTotal,
        transactionsCount: transactions.length,
        averageValue: averageTransactionValue,
      },
      transactions: itemized,
    });

  } catch (error) {
    console.error("Statements API error:", error);
    return NextResponse.json({ error: "Failed to fetch statements data" }, { status: 500 });
  }
}
