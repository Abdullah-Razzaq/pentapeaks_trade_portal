import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = (page - 1) * limit;

  let whereClause = "";
  const values: any[] = [];

  if (query) {
    const words = query.split(/\s+/).filter(Boolean);
    whereClause = "WHERE hs_code ILIKE $1 OR description ILIKE ALL($2::text[])";
    values.push(`%${query}%`);
    values.push(words.map(w => `%${w}%`));
  }

  const countQuery = `SELECT COUNT(*) AS total FROM hs_code_directory ${whereClause}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT id, section, hs_code, description, parent, level
    FROM hs_code_directory
    ${whereClause}
    ORDER BY hs_code ASC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

  return NextResponse.json({
    results: dataResult.rows,
    total,
    page,
    limit,
  });
}
