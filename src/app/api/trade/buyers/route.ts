import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { enforceSearchSecurity } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
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

  const isAdmin = session.role === "admin";
  let planType = "trial";
  let proProducts: string[] = [];
  let dataAccessMonths: number | null = 1;
  
  if (!isAdmin) {
    const { rows: userRows } = await pool.query(
      `SELECT plan_type, pro_products, data_access_months FROM users WHERE id = $1`,
      [session.userId]
    );
    if (userRows.length > 0) {
      planType = userRows[0].plan_type;
      proProducts = userRows[0].pro_products || [];
      dataAccessMonths = userRows[0].data_access_months ?? 1;
    }
  } else {
    dataAccessMonths = null;
  }

  const securityResponse = await enforceSearchSecurity(session, planType);
  if (securityResponse) return securityResponse;

  if (!isAdmin && planType === "pro" && proProducts.length < 2) {
    return NextResponse.json({ error: "Please select your 2 products on the dashboard first." }, { status: 403 });
  }

  let company = request.nextUrl.searchParams.get("company")?.trim() ?? "";
  let destination_country = request.nextUrl.searchParams.get("destination_country")?.trim() ?? "";
  
  if (!isAdmin && planType === "trial") {
    company = "";
    destination_country = "";
  }
  let product = request.nextUrl.searchParams.get("product")?.trim() ?? "";
  let hs_code = request.nextUrl.searchParams.get("hs_code")?.trim() ?? "";
  
  if (!isAdmin && planType === "trial") {
    product = "";
    hs_code = "";
  }
  
  let sort = request.nextUrl.searchParams.get("sort")?.trim() ?? "date_asc";
  if (!isAdmin && planType === "trial") {
    sort = "date_asc";
  }

  let shipmentDate = request.nextUrl.searchParams.get("date")?.trim() ?? "";
  if (!isAdmin) {
    shipmentDate = "";
  }

  if (!isAdmin && planType === "pro" && product) {
    const isAllowed = proProducts.some((p: string) => p.toLowerCase() === product.toLowerCase());
    if (!isAllowed) {
      return NextResponse.json(
        { error: "ACCESS_RESTRICTED", allowed_products: proProducts },
        { status: 403 }
      );
    }
  }

  let proKeywordSearch: string[] | null = null;
  let proRegexSearch: string[] | null = null;

  if (!isAdmin && planType === "pro" && proProducts.length > 0) {
    const keywords = proProducts.map((p: string) => p.toUpperCase());
    proKeywordSearch = keywords.map((k: string) => `%${k}%`);
    proRegexSearch = keywords.map((k: string) => `\\m${k}\\M`);
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const orderClause =
    sort === "az" ? "ORDER BY s.importer ASC, s.id ASC" : 
    sort === "za" ? "ORDER BY s.importer DESC, s.id ASC" : 
    sort === "value_asc" ? "ORDER BY s.value_pkr ASC, s.id ASC" : 
    sort === "value_desc" ? "ORDER BY s.value_pkr DESC NULLS LAST, s.id ASC" :
    sort === "date_desc" ? "ORDER BY s.date DESC NULLS LAST, s.id ASC" :
    "ORDER BY s.date ASC NULLS LAST, s.id ASC";

  const countQuery = isAdmin
    ? `SELECT COUNT(*)
       FROM export_shipments s
       WHERE s.importer IS NOT NULL
         AND ($1 = '' OR s.importer ILIKE '%' || $1 || '%')
         AND ($2 = '' OR s.description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR s.origin = $3)
         AND ($4 = '' OR (REPLACE(to_char(s.pct, 'FM0000.0000'), '.', '') ILIKE '%' || $4 || '%' OR s.description ILIKE '%' || $4 || '%'))
         AND ($5::text[] IS NULL OR (s.description ~* ANY($6::text[]) OR UPPER(s.description) ILIKE ANY($5::text[])))
         AND ($7 = '' OR s.date::date = NULLIF($7, '')::date)`
    : `WITH distinct_months AS (
       SELECT DISTINCT DATE_TRUNC('month', date) AS month_start
       FROM export_shipments
       WHERE importer IS NOT NULL
         AND ($1 = '' OR importer ILIKE '%' || $1 || '%')
         AND ($2 = '' OR description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR origin = $3)
         AND ($4 = '' OR (REPLACE(to_char(pct, 'FM0000.0000'), '.', '') ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%'))
         AND ($5::text[] IS NULL OR (description ~* ANY($6::text[]) OR UPPER(description) ILIKE ANY($5::text[])))
       ORDER BY month_start ASC
       LIMIT $7::int
     ),
     allowed_records AS (
       SELECT s.*
       FROM export_shipments s
       JOIN distinct_months dm ON DATE_TRUNC('month', s.date) = dm.month_start
       WHERE s.importer IS NOT NULL
         AND ($1 = '' OR s.importer ILIKE '%' || $1 || '%')
         AND ($2 = '' OR s.description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR s.origin = $3)
         AND ($4 = '' OR (REPLACE(to_char(s.pct, 'FM0000.0000'), '.', '') ILIKE '%' || $4 || '%' OR s.description ILIKE '%' || $4 || '%'))
         AND ($5::text[] IS NULL OR (s.description ~* ANY($6::text[]) OR UPPER(s.description) ILIKE ANY($5::text[])))
     )
     SELECT COUNT(*)
     FROM allowed_records`;

  const countParams = isAdmin
    ? [company, product, destination_country, hs_code, proKeywordSearch, proRegexSearch, shipmentDate]
    : [company, product, destination_country, hs_code, proKeywordSearch, proRegexSearch, dataAccessMonths];
  const countResult = await pool.query(countQuery, countParams);
  
  let total = parseInt(countResult.rows[0].count, 10);
  
  if (!isAdmin && planType === 'trial') {
    total = Math.floor(total / 2);
    if (product) {
      total = Math.min(total, 10);
    }
  }

  let actualLimit = limit;
  if (!isAdmin && planType === 'trial') {
    if (offset >= total) {
      actualLimit = 0;
    } else if (offset + limit > total) {
      actualLimit = total - offset;
    }
  }
  interface ExportRow {
    id: number;
    company: string;
    ntn: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    country: string;
    counterparty: string;
    pct: string;
    qty: string;
    unit: string;
    description: string;
    value_pkr: number;
    shipment_date: string;
  }

  let rows: ExportRow[] = [];
  if (actualLimit > 0) {
    const dataQuery = isAdmin
      ? `SELECT
           s.id,
           s.importer AS company,
           s.ntn,
           s.email,
           s.phone,
           s.address,
           s.website,
           s.origin AS country,
           s.exporter AS counterparty,
           s.pct,
           s.qty,
           s.unit,
           s.description,
           COALESCE(s.value_pkr, 0)::float8 AS value_pkr,
           s.date AS shipment_date
         FROM export_shipments s
         WHERE s.importer IS NOT NULL
           AND ($1 = '' OR s.importer ILIKE '%' || $1 || '%')
           AND ($2 = '' OR s.description ILIKE '%' || $2 || '%')
           AND ($3 = '' OR s.origin = $3)
           AND ($4 = '' OR (REPLACE(to_char(s.pct, 'FM0000.0000'), '.', '') ILIKE '%' || $4 || '%' OR s.description ILIKE '%' || $4 || '%'))
           AND ($5::text[] IS NULL OR (s.description ~* ANY($6::text[]) OR UPPER(s.description) ILIKE ANY($5::text[])))
           AND ($9 = '' OR s.date::date = NULLIF($9, '')::date)
         ${orderClause}
         LIMIT $7 OFFSET $8`
      : `WITH distinct_months AS (
           SELECT DISTINCT DATE_TRUNC('month', date) AS month_start
           FROM export_shipments
           WHERE importer IS NOT NULL
             AND ($1 = '' OR importer ILIKE '%' || $1 || '%')
             AND ($2 = '' OR description ILIKE '%' || $2 || '%')
             AND ($3 = '' OR origin = $3)
             AND ($4 = '' OR (REPLACE(to_char(pct, 'FM0000.0000'), '.', '') ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%'))
             AND ($5::text[] IS NULL OR (description ~* ANY($6::text[]) OR UPPER(description) ILIKE ANY($5::text[])))
           ORDER BY month_start ASC
           LIMIT $9::int
         ),
         allowed_records AS (
           SELECT s.*
           FROM export_shipments s
           JOIN distinct_months dm ON DATE_TRUNC('month', s.date) = dm.month_start
           WHERE s.importer IS NOT NULL
             AND ($1 = '' OR s.importer ILIKE '%' || $1 || '%')
             AND ($2 = '' OR s.description ILIKE '%' || $2 || '%')
             AND ($3 = '' OR s.origin = $3)
             AND ($4 = '' OR (REPLACE(to_char(s.pct, 'FM0000.0000'), '.', '') ILIKE '%' || $4 || '%' OR s.description ILIKE '%' || $4 || '%'))
             AND ($5::text[] IS NULL OR (s.description ~* ANY($6::text[]) OR UPPER(s.description) ILIKE ANY($5::text[])))
         )
         SELECT
           s.id,
           s.importer AS company,
           s.ntn,
           s.email,
           s.phone,
           s.address,
           s.website,
           s.origin AS country,
           s.exporter AS counterparty,
           s.pct,
           s.qty,
           s.unit,
           s.description,
           COALESCE(s.value_pkr, 0)::float8 AS value_pkr,
           s.date AS shipment_date
         FROM allowed_records s
         ${orderClause}
         LIMIT $7 OFFSET $8`;

    const dataParams = isAdmin
      ? [company, product, destination_country, hs_code, proKeywordSearch, proRegexSearch, actualLimit, offset, shipmentDate]
      : [company, product, destination_country, hs_code, proKeywordSearch, proRegexSearch, actualLimit, offset, dataAccessMonths];
    const { rows: dataRows } = await pool.query(dataQuery, dataParams);
    rows = dataRows;
  }
  
  const maskNtn = !isAdmin && planType === 'trial';
  const maskContact = !isAdmin && planType !== 'premium';
  const maskValue = !isAdmin && planType === 'trial';
  const maskString = "••••••••";

  const results = rows.map((row) => ({
    ...row,
    ntn: maskNtn ? undefined : row.ntn,
    email: maskContact ? maskString : row.email,
    phone: maskContact ? maskString : row.phone,
    address: maskContact ? maskString : row.address,
    website: maskContact ? maskString : row.website,
    qty: maskValue ? maskString : row.qty,
    value_pkr: maskValue ? maskString : row.value_pkr,
  }));

  return NextResponse.json({ results, total, page, limit });
  } catch (error) {
    console.error("Trade API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch trade data" }, { status: 500 });
  }
}
