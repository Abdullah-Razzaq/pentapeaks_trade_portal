import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { enforceSearchSecurity } from "@/lib/rateLimit";

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

  const isAdmin = session.role === "admin";
  let planType = "trial";
  let proSearchedProducts: string[] = [];
  let proQuotaResetDate: Date | null = null;
  
  if (!isAdmin) {
    const { rows: userRows } = await pool.query(
      `SELECT plan_type, pro_searched_products, pro_quota_reset_date FROM users WHERE id = $1`,
      [session.userId]
    );
    if (userRows.length > 0) {
      planType = userRows[0].plan_type;
      proSearchedProducts = userRows[0].pro_searched_products || [];
      proQuotaResetDate = userRows[0].pro_quota_reset_date;
    }
  }

  const securityResponse = await enforceSearchSecurity(session, planType);
  if (securityResponse) return securityResponse;

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

  // Enforce Pro Quota
  if (!isAdmin && planType === "pro" && (product || hs_code)) {
    const queryTerm = product || hs_code; // Usually one is provided per search field
    
    // Auto-reset logic if it's been more than 30 days
    if (proQuotaResetDate) {
      const daysSinceReset = (new Date().getTime() - new Date(proQuotaResetDate).getTime()) / (1000 * 3600 * 24);
      if (daysSinceReset >= 30) {
        proSearchedProducts = [];
        await pool.query(
          "UPDATE users SET pro_searched_products = '[]'::jsonb, pro_quota_reset_date = CURRENT_TIMESTAMP WHERE id = $1",
          [session.userId]
        );
      }
    } else {
      // If no reset date is set but user is searching, set it now
      await pool.query(
        "UPDATE users SET pro_quota_reset_date = CURRENT_TIMESTAMP WHERE id = $1",
        [session.userId]
      );
    }

    const searchTermLower = queryTerm.toLowerCase();
    const alreadySearched = proSearchedProducts.some(p => p.toLowerCase() === searchTermLower);
    
    if (!alreadySearched) {
      if (proSearchedProducts.length >= 5) {
        return NextResponse.json(
          { error: "Pro plan quota reached. You can view data for your 5 chosen products this month." },
          { status: 403 }
        );
      } else {
        // Append new search term
        proSearchedProducts.push(queryTerm);
        await pool.query(
          "UPDATE users SET pro_searched_products = $1::jsonb WHERE id = $2",
          [JSON.stringify(proSearchedProducts), session.userId]
        );
      }
    }
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const orderClause =
    sort === "az" ? "ORDER BY importer ASC" : 
    sort === "za" ? "ORDER BY importer DESC" : 
    sort === "value_asc" ? "ORDER BY value_pkr ASC" : 
    sort === "value_desc" ? "ORDER BY value_pkr DESC NULLS LAST" :
    sort === "date_desc" ? "ORDER BY date DESC NULLS LAST" :
    "ORDER BY date ASC NULLS LAST";

  const countResult = await pool.query(
    `SELECT COUNT(*)
     FROM export_shipments
     WHERE importer IS NOT NULL
       AND ($1 = '' OR importer ILIKE '%' || $1 || '%')
       AND ($2 = '' OR description ILIKE '%' || $2 || '%')
       AND ($3 = '' OR origin = $3)
       AND ($4 = '' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($4, '.', '') || '%')`,
    [company, product, destination_country, hs_code]
  );
  
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

  let rows: any[] = [];
  if (actualLimit > 0) {
    const { rows: dataRows } = await pool.query(
      `SELECT
         id,
         importer AS company,
         ntn,
         email,
         phone,
         address,
         website,
         origin AS country,
         exporter AS counterparty,
         pct,
         qty,
         unit,
         description,
         COALESCE(value_pkr, 0)::float8 AS value_pkr,
         date AS shipment_date
       FROM export_shipments
       WHERE importer IS NOT NULL
         AND ($1 = '' OR importer ILIKE '%' || $1 || '%')
         AND ($2 = '' OR description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR origin = $3)
         AND ($4 = '' OR REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE REPLACE($4, '.', '') || '%')
       ${orderClause}
       LIMIT $5 OFFSET $6`,
      [company, product, destination_country, hs_code, actualLimit, offset]
    );
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
}
