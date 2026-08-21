import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";


export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hsCode = request.nextUrl.searchParams.get("hs_code")?.trim() ?? request.nextUrl.searchParams.get("chapter")?.trim() ?? "";
  const country = request.nextUrl.searchParams.get("country")?.trim() ?? "";
  if (!hsCode) {
    return NextResponse.json({ error: "Please select a valid product category." }, { status: 400 });
  }

  let dataAccessMonths: number | null = 1;
  let planType = "trial";
  const isAdmin = session.role === "admin";
  let proProducts: string[] = [];

  if (isAdmin) {
    dataAccessMonths = null;
  } else {
    const { rows: userRows } = await pool.query(
      `SELECT plan_type, pro_products, data_access_months FROM users WHERE id = $1`,
      [session.userId]
    );
    if (userRows.length > 0) {
      planType = userRows[0].plan_type;
      proProducts = userRows[0].pro_products || [];
      dataAccessMonths = userRows[0].data_access_months ?? 1;
    }
  }

  if (!isAdmin && planType === "pro" && proProducts.length < 2) {
    return NextResponse.json({ error: "Please select your 2 products on the dashboard first." }, { status: 403 });
  }

  if (!isAdmin && planType === "pro" && hsCode) {
    // Similar to buyers/route.ts, if hsCode matches a product string, we check if it's allowed
    // Note: hsCode comes from the product filter in CompanyExplorer.tsx
    const isAllowed = proProducts.some((p: string) => p.toLowerCase() === hsCode.toLowerCase());
    
    // If it's not exactly in proProducts, we could allow numeric HS codes or let the regex filter handle it
    // But to match the UI behavior where searching by string product triggers restricted access:
    if (!isAllowed && isNaN(Number(hsCode))) {
      return NextResponse.json({ error: "Access Restricted: You can search only your selected products for this month." }, { status: 403 });
    }
  }

  let proKeywordSearch: string[] | null = null;
  let proRegexSearch: string[] | null = null;

  if (!isAdmin && planType === "pro" && proProducts.length > 0) {
    const keywords = proProducts.map(p => p.toUpperCase());
    proKeywordSearch = keywords.map(k => `%${k}%`);
    proRegexSearch = keywords.map(k => `\\m${k}\\M`);
  }

  const cteStr = isAdmin
    ? `
    WITH scoped_records AS (
      SELECT s.*
      FROM export_shipments s
      WHERE (s.description ILIKE '%' || $1 || '%' OR REPLACE(to_char(s.pct, 'FM0000.0000'), '.', '') ILIKE '%' || $1 || '%')
        AND ($2 = '' OR s.origin = $2)
    )
  `
    : `
    WITH distinct_months AS (
      SELECT DISTINCT DATE_TRUNC('month', date) AS month_start
      FROM export_shipments
      WHERE (description ILIKE '%' || $1 || '%' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') ILIKE '%' || $1 || '%')
        AND ($3::text[] IS NULL OR (description ~* ANY($4::text[]) OR UPPER(description) ILIKE ANY($3::text[])))
        AND ($5 = '' OR origin = $5)
      ORDER BY month_start ASC
      LIMIT $2::int
    ),
    scoped_records AS (
      SELECT s.*
      FROM export_shipments s
      JOIN distinct_months dm ON DATE_TRUNC('month', s.date) = dm.month_start
      WHERE (s.description ILIKE '%' || $1 || '%' OR REPLACE(to_char(s.pct, 'FM0000.0000'), '.', '') ILIKE '%' || $1 || '%')
        AND ($3::text[] IS NULL OR (s.description ~* ANY($4::text[]) OR UPPER(s.description) ILIKE ANY($3::text[])))
        AND ($5 = '' OR s.origin = $5)
    )
  `;

  const queryParams = isAdmin ? [hsCode, country] : [hsCode, dataAccessMonths, proKeywordSearch, proRegexSearch, country];

  const [summary, topBuyers, topSuppliers, topCountries] = await Promise.all([
    pool.query(
      `${cteStr}
       SELECT
         COUNT(*)::int AS shipments,
         COUNT(DISTINCT importer)::int AS buyers,
         COUNT(DISTINCT exporter)::int AS suppliers,
         COUNT(DISTINCT origin)::int AS countries_served,
         COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr,
         MIN(date) AS first_shipment,
         MAX(date) AS last_shipment
       FROM scoped_records`,
      queryParams
    ),
    pool.query(
      `${cteStr}
       SELECT importer AS company, COUNT(*)::int AS shipments, COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr
       FROM scoped_records
       WHERE importer IS NOT NULL
       GROUP BY importer
       ORDER BY total_value_pkr DESC
       LIMIT 5`,
      queryParams
    ),
    pool.query(
      `${cteStr}
       SELECT exporter AS company, COUNT(*)::int AS shipments, COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr
       FROM scoped_records
       WHERE exporter IS NOT NULL
       GROUP BY exporter
       ORDER BY total_value_pkr DESC
       LIMIT 5`,
      queryParams
    ),
    pool.query(
      `${cteStr}
       SELECT origin AS country, COUNT(*)::int AS shipments, COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr
       FROM scoped_records
       WHERE origin IS NOT NULL
       GROUP BY origin
       ORDER BY total_value_pkr DESC
       LIMIT 5`,
      queryParams
    ),
  ]);

  const stats = summary.rows[0] as
    | {
        shipments: number;
        buyers: number;
        suppliers: number;
        countries_served: number;
        total_value_pkr: number;
        first_shipment: string | null;
        last_shipment: string | null;
      }
    | undefined;

  return NextResponse.json({
    chapter: hsCode,
    label: `Product Status: ${hsCode}`,
    shipments: stats?.shipments ?? 0,
    buyers: stats?.buyers ?? 0,
    suppliers: stats?.suppliers ?? 0,
    countriesServed: stats?.countries_served ?? 0,
    totalValuePkr: stats?.total_value_pkr ?? 0,
    firstShipment: stats?.first_shipment ?? null,
    lastShipment: stats?.last_shipment ?? null,
    topBuyers: topBuyers.rows,
    topSuppliers: topSuppliers.rows,
    topCountries: topCountries.rows,
  });
}
