import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin" && (session.isExpired || session.subscriptionStatus === "DEACTIVATED")) {
    return NextResponse.json(
      { 
        error: "Your 30-day subscription plan has expired. Please pay your dues to get access and contact Admin for activation.",
        code: "SUBSCRIPTION_EXPIRED"
      },
      { status: 403 }
    );
  }

  const company = request.nextUrl.searchParams.get("company")?.trim() ?? "";
  const product = request.nextUrl.searchParams.get("product")?.trim() ?? "";
  const destination_country = request.nextUrl.searchParams.get("destination_country")?.trim() ?? "";
  const hs_code = request.nextUrl.searchParams.get("hs_code")?.trim() ?? "";
  const sort = request.nextUrl.searchParams.get("sort")?.trim() ?? "value_desc";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const orderClause =
    sort === "az" ? "ORDER BY importer ASC" : 
    sort === "za" ? "ORDER BY importer DESC" : 
    sort === "value_asc" ? "ORDER BY value_pkr ASC" : 
    "ORDER BY value_pkr DESC NULLS LAST";

  const { rows } = await pool.query(
    `SELECT
       id,
       importer AS company,
       origin AS country,
       exporter AS counterparty,
       pct,
       qty,
       unit,
       description,
       COALESCE(value_pkr, 0)::float8 AS value_pkr,
       date AS shipment_date,
       COUNT(*) OVER()::int AS total_count
     FROM export_shipments
     WHERE importer IS NOT NULL
       AND ($1 = '' OR importer ILIKE '%' || $1 || '%')
       AND ($2 = '' OR description ILIKE '%' || $2 || '%')
       AND ($3 = '' OR origin = $3)
       AND ($4 = '' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($4, '.', '') || '%')
     ${orderClause}
     LIMIT $5 OFFSET $6`,
    [company, product, destination_country, hs_code, limit, offset]
  );

  const total = rows.length > 0 ? rows[0].total_count : 0;
  
  // Remove total_count from results array
  const results = rows.map(({ total_count: _total_count, ...rest }) => rest);

  return NextResponse.json({ results, total, page, limit });
}
