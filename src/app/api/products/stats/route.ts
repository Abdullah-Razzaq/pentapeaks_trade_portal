import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const primary = searchParams.get("primary")?.trim();
  const secondary = searchParams.get("secondary")?.trim();
  const tertiary = searchParams.get("tertiary")?.trim();

  // Determine prefix based on selected category level
  let hsPrefix = "";
  if (tertiary) hsPrefix = tertiary.split(" ")[0]; // e.g., "080410 - Dates..." -> "080410"
  else if (secondary) hsPrefix = secondary.split(" ")[0];
  else if (primary) hsPrefix = primary.split(" ")[0];

  if (!hsPrefix) {
    return NextResponse.json({ stats: null, shipments: [] });
  }

  // Get stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_shipments,
      SUM(value_pkr) as total_value
    FROM export_shipments
    WHERE REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%'
  `;

  const topExportersQuery = `
    SELECT exporter, COUNT(*) as count, SUM(value_pkr) as value
    FROM export_shipments
    WHERE REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%' AND exporter IS NOT NULL
    GROUP BY exporter
    ORDER BY value DESC
    LIMIT 5
  `;

  const topDestinationsQuery = `
    SELECT origin as destination, COUNT(*) as count, SUM(value_pkr) as value
    FROM export_shipments
    WHERE REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%' AND origin IS NOT NULL
    GROUP BY origin
    ORDER BY value DESC
    LIMIT 5
  `;

  // Get raw shipments (limit 50)
  const shipmentsQuery = `
    SELECT id, date as shipment_date, exporter as company, origin as country, importer as counterparty, pct, description, qty, unit, value_pkr
    FROM export_shipments
    WHERE REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($1, '.', '') || '%'
    ORDER BY value_pkr DESC NULLS LAST
    LIMIT 50
  `;

  try {
    const param = [hsPrefix];
    const [statsRes, exportersRes, destsRes, shipmentsRes] = await Promise.all([
      pool.query(statsQuery, param),
      pool.query(topExportersQuery, param),
      pool.query(topDestinationsQuery, param),
      pool.query(shipmentsQuery, param),
    ]);

    return NextResponse.json({
      stats: {
        total_shipments: parseInt(statsRes.rows[0].total_shipments || '0', 10),
        total_value: parseFloat(statsRes.rows[0].total_value || '0'),
        top_exporters: exportersRes.rows,
        top_destinations: destsRes.rows,
      },
      shipments: shipmentsRes.rows
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
