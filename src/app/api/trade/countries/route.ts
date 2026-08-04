import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT origin AS country FROM export_shipments WHERE origin IS NOT NULL AND origin != '' ORDER BY origin ASC`
    );
    const countries = rows.map((r) => r.country);
    return NextResponse.json({ countries });
  } catch (error) {
    console.error("Failed to fetch countries:", error);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }
}
