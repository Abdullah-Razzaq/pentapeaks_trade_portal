import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.role === "admin";
  const userId = session.userId;
  let planType = "trial";
  let subscriptionExpiresAt: Date | null = null;

  if (!isAdmin) {
    const { rows: userRows } = await pool.query(
      `SELECT subscription_expires_at, plan_type FROM users WHERE id = $1`,
      [userId]
    );
    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    planType = userRows[0].plan_type;
    subscriptionExpiresAt = userRows[0].subscription_expires_at ? new Date(userRows[0].subscription_expires_at) : null;
  }

  const intent = request.nextUrl.searchParams.get("intent")?.trim();

  // For standard users, enforce quota checks only if they are actually downloading
  if (!isAdmin && intent === "download") {
    const planLimit = planType === 'premium' ? 10 : (planType === 'pro' ? 10 : 2);

    // Check subscription expiration
    if (subscriptionExpiresAt && subscriptionExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Your 30-day plan has expired. Please renew your subscription to continue downloading data.", isExpired: true },
        { status: 403, headers: { "X-Plan-Expired": "true" } }
      );
    }

    // ATOMIC DATABASE INCREMENT
    const { rows: updateRows } = await pool.query(
      `UPDATE users
       SET downloads_today = CASE WHEN (last_download_date AT TIME ZONE 'UTC')::date <> (NOW() AT TIME ZONE 'UTC')::date THEN 1
                                  ELSE downloads_today + 1 END,
           last_download_date = NOW()
       WHERE id = $1
         AND ((last_download_date AT TIME ZONE 'UTC')::date <> (NOW() AT TIME ZONE 'UTC')::date OR downloads_today < $2)
       RETURNING downloads_today, last_download_date`,
      [userId, planLimit]
    );

    if (updateRows.length === 0) {
      return NextResponse.json(
        { 
          error: `Daily download limit reached (${planLimit}/${planLimit}). Your limit will reset tomorrow.`, 
          code: "LIMIT_REACHED" 
        },
        { status: 429 }
      );
    }
  }

  // Parse filters
  const company = request.nextUrl.searchParams.get("company")?.trim() ?? "";
  const product = request.nextUrl.searchParams.get("product")?.trim() ?? "";
  const destination_country = request.nextUrl.searchParams.get("destination_country")?.trim() ?? "";
  const hs_code = request.nextUrl.searchParams.get("hs_code")?.trim() ?? "";

  // Parse pagination parameters
  const ROWS_PER_PAGE = 50;
  let startPage = parseInt(request.nextUrl.searchParams.get("startPage") || "1");
  let endPage = parseInt(request.nextUrl.searchParams.get("endPage") || "1");
  
  // Set limit based on role
  if (!isAdmin) {
    const pageStr = request.nextUrl.searchParams.get("page") || "1";
    startPage = parseInt(pageStr);
    endPage = parseInt(pageStr);
  }
  
  // Enforce 20-page backend safety limit
  const pageCount = Math.min(endPage - startPage + 1, 20);
  const limit = pageCount * ROWS_PER_PAGE;
  const offset = (startPage - 1) * ROWS_PER_PAGE;

  const maskNtn = !isAdmin && planType === 'trial';
  const maskContact = !isAdmin && planType !== 'premium';
  const maskValue = !isAdmin && planType === 'trial';

  let sort = request.nextUrl.searchParams.get("sort")?.trim() ?? "date_asc";
  if (!isAdmin && planType === "trial") {
    sort = "date_asc";
  }

  const orderClause =
    sort === "az" ? 'ORDER BY exporter ASC' : 
    sort === "za" ? 'ORDER BY exporter DESC' : 
    sort === "value_asc" ? 'ORDER BY value_pkr ASC' : 
    sort === "value_desc" ? 'ORDER BY value_pkr DESC NULLS LAST' :
    sort === "date_desc" ? 'ORDER BY date DESC NULLS LAST' :
    'ORDER BY date ASC NULLS LAST';

  try {
    // 1. Get Total Count for UI Progress
    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM export_shipments
       WHERE exporter IS NOT NULL
         AND ($1 = '' OR exporter ILIKE '%' || $1 || '%')
         AND ($2 = '' OR description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR origin = $3)
         AND ($4 = '' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($4, '.', '') || '%')`,
      [company, product, destination_country, hs_code]
    );
    
    const totalRows = parseInt(countResult.rows[0].count);

    // 2. Fetch chunk
    const { rows } = await pool.query(
      `SELECT
         date AS "Date",
         exporter AS "Supplier",
         ${maskNtn ? '' : 'ntn AS "NTN",'}
         importer AS "Buyer",
         origin AS "Destination",
         pct AS "HS Code",
         ${maskValue ? '' : 'qty AS "Quantity",'}
         unit AS "Unit",
         description AS "Description"
         ${maskValue ? '' : ', value_pkr AS "Value (PKR)"'}
         ${maskContact ? '' : ', email AS "Email", phone AS "Phone", address AS "Address", website AS "Website"'}
       FROM export_shipments
       WHERE exporter IS NOT NULL
         AND ($1 = '' OR exporter ILIKE '%' || $1 || '%')
         AND ($2 = '' OR description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR origin = $3)
         AND ($4 = '' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($4, '.', '') || '%')
       ${orderClause}
       LIMIT $5 OFFSET $6`,
      [company, product, destination_country, hs_code, limit, offset]
    );

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const tableRows = rows.map(r => Object.values(r).map(val => val !== null ? String(val) : ""));

    return NextResponse.json({
      success: true,
      role: isAdmin ? "ADMIN" : "USER",
      headers: headers,
      data: tableRows,
      page: startPage,
      totalRows: totalRows,
      hasMore: offset + rows.length < totalRows
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate export." }, { status: 500 });
  }
}
