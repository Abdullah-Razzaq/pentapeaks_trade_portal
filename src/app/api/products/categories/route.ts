import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parent = searchParams.get("parent")?.trim();
  const level = parseInt(searchParams.get("level") || "2", 10);

  let query = "";
  const values: any[] = [];

  if (parent) {
    const parentCode = parent.split(" ")[0];
    query = `
      SELECT DISTINCT h.hs_code, h.description 
      FROM export_shipments e
      JOIN hs_code_directory h ON h.hs_code = SUBSTRING(REPLACE(to_char(e.pct, 'FM0000.0000'), '.', '') FROM 1 FOR $1)
      WHERE h.level = $1 AND e.pct IS NOT NULL AND h.hs_code LIKE $2 || '%' 
      ORDER BY h.hs_code ASC
    `;
    values.push(level, parentCode);
  } else {
    query = `
      SELECT DISTINCT h.hs_code, h.description 
      FROM export_shipments e
      JOIN hs_code_directory h ON h.hs_code = SUBSTRING(REPLACE(to_char(e.pct, 'FM0000.0000'), '.', '') FROM 1 FOR $1)
      WHERE h.level = $1 AND e.pct IS NOT NULL
      ORDER BY h.hs_code ASC
    `;
    values.push(level);
  }

  try {
    const res = await pool.query(query, values);
    const categories = res.rows.map(r => `${r.hs_code} - ${r.description}`);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
