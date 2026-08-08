import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { enforceSearchSecurity } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  let planType = "trial";
  const isAdmin = session?.role === "admin";
  if (session && !isAdmin) {
    const { rows: userRows } = await pool.query(
      `SELECT plan_type FROM users WHERE id = $1`,
      [session.userId]
    );
    if (userRows.length > 0) {
      planType = userRows[0].plan_type;
    }
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
  let total = parseInt(countResult.rows[0].total, 10);
  
  if (!isAdmin && planType === 'trial') {
    total = Math.floor(total / 2);
  }

  let actualLimit = limit;
  if (!isAdmin && planType === 'trial') {
    if (offset >= total) {
      actualLimit = 0;
    } else if (offset + limit > total) {
      actualLimit = total - offset;
    }
  }

  let dataResult = { rows: [] };
  if (actualLimit > 0) {
    const dataQuery = `
      SELECT id, section, hs_code, description, parent, level
      FROM hs_code_directory
      ${whereClause}
      ORDER BY hs_code ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    dataResult = await pool.query(dataQuery, [...values, actualLimit, offset]);
  }

  return NextResponse.json({
    results: dataResult.rows,
    total,
    page,
    limit,
  });
}
