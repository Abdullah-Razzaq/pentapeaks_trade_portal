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

  const intent = request.nextUrl.searchParams.get("intent")?.trim();

  // For standard users, enforce quota checks only if they are actually downloading
  if (!isAdmin && intent === "download") {
    // 1. Fetch user subscription data first
    const { rows: userRows } = await pool.query(
      `SELECT subscription_expires_at FROM users WHERE id = $1`,
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { subscription_expires_at } = userRows[0];

    // Check subscription expiration
    if (subscription_expires_at && new Date(subscription_expires_at) < new Date()) {
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
         AND ((last_download_date AT TIME ZONE 'UTC')::date <> (NOW() AT TIME ZONE 'UTC')::date OR downloads_today < 10)
       RETURNING downloads_today, last_download_date`,
      [userId]
    );

    if (updateRows.length === 0) {
      return NextResponse.json(
        { 
          error: "Daily download limit reached (10/10). Your limit will reset tomorrow.", 
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
         ${isAdmin ? 'ntn AS "NTN",' : ""}
         importer AS "Buyer",
         origin AS "Destination",
         pct AS "HS Code",
         qty AS "Quantity",
         unit AS "Unit",
         description AS "Description",
         value_pkr AS "Value (PKR)"
       FROM export_shipments
       WHERE exporter IS NOT NULL
         AND ($1 = '' OR exporter ILIKE '%' || $1 || '%')
         AND ($2 = '' OR description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR origin = $3)
         AND ($4 = '' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($4, '.', '') || '%')
       ORDER BY value_pkr DESC NULLS LAST
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
