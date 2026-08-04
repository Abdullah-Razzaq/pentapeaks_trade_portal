import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";


export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hsCode = request.nextUrl.searchParams.get("hs_code")?.trim() ?? request.nextUrl.searchParams.get("chapter")?.trim() ?? "";
  if (!hsCode) {
    return NextResponse.json({ error: "Please select a valid product category." }, { status: 400 });
  }

  const [summary, topBuyers, topSuppliers, topCountries] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS shipments,
         COUNT(DISTINCT importer)::int AS buyers,
         COUNT(DISTINCT exporter)::int AS suppliers,
         COUNT(DISTINCT origin)::int AS countries_served,
         COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr,
         MIN(date) AS first_shipment,
         MAX(date) AS last_shipment
       FROM export_shipments
       WHERE pct IS NOT NULL AND REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%'`,
      [hsCode]
    ),
    pool.query(
      `SELECT importer AS company, COUNT(*)::int AS shipments, COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr
       FROM export_shipments
       WHERE importer IS NOT NULL AND pct IS NOT NULL AND REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%'
       GROUP BY importer
       ORDER BY total_value_pkr DESC
       LIMIT 5`,
      [hsCode]
    ),
    pool.query(
      `SELECT exporter AS company, COUNT(*)::int AS shipments, COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr
       FROM export_shipments
       WHERE exporter IS NOT NULL AND pct IS NOT NULL AND REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%'
       GROUP BY exporter
       ORDER BY total_value_pkr DESC
       LIMIT 5`,
      [hsCode]
    ),
    pool.query(
      `SELECT origin AS country, COUNT(*)::int AS shipments, COALESCE(SUM(value_pkr), 0)::float8 AS total_value_pkr
       FROM export_shipments
       WHERE origin IS NOT NULL AND pct IS NOT NULL AND REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%'
       GROUP BY origin
       ORDER BY total_value_pkr DESC
       LIMIT 5`,
      [hsCode]
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
    label: `HS Code Filter: ${hsCode}`,
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
