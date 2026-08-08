import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const products = body.products || [];

  if (!Array.isArray(products) || products.length !== 5) {
    return NextResponse.json({ error: "Please select exactly 5 products." }, { status: 400 });
  }

  try {
    // Basic validation that they exist
    for (const p of products) {
      const res = await pool.query(
        "SELECT 1 FROM export_shipments WHERE description ~* $1 LIMIT 1",
        ['\\m' + p.toUpperCase() + '\\M']
      );
      if (res.rowCount === 0) {
        return NextResponse.json({ error: `Product not found: ${p}` }, { status: 400 });
      }
    }

    await pool.query("UPDATE users SET pro_products = $1 WHERE id = $2", [products, session.userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save products error:", error);
    return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
  }
}
