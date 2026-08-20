import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { invoice_no, buyer_name, doc_type, total_value } = body;

    const { rows } = await pool.query(
      `INSERT INTO invoice_records (admin_id, invoice_no, buyer_name, doc_type, total_value)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [session.userId, invoice_no, buyer_name, doc_type, total_value]
    );

    return NextResponse.json({ success: true, record: rows[0] });
  } catch (err) {
    console.error("Error recording invoice:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT r.id, r.invoice_no, r.buyer_name, r.doc_type, r.total_value, r.created_at, u.name as admin_name
       FROM invoice_records r
       JOIN users u ON r.admin_id = u.id
       ORDER BY r.created_at DESC`
    );

    return NextResponse.json({ records: rows });
  } catch (err) {
    console.error("Error fetching invoice records:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
