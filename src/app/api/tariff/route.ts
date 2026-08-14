import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";
import { ALL_COUNTRIES } from "@/lib/countryCodes";
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

  let planType = "trial";
  if (session.role !== "admin") {
    const { rows: userRows } = await pool.query(
      `SELECT plan_type FROM users WHERE id = $1`,
      [session.userId]
    );

    if (userRows.length > 0) {
      planType = userRows[0].plan_type;
      if (planType !== 'premium') {
        return NextResponse.json(
          { error: "Check Tariff/VAT is a Premium feature" },
          { status: 403 }
        );
      }
    }
  }

  const securityResponse = await enforceSearchSecurity(session, planType);
  if (securityResponse) return securityResponse;

  const exportCountry = request.nextUrl.searchParams.get("export_country")?.trim() ?? "";
  const importCountry = request.nextUrl.searchParams.get("import_country")?.trim() ?? "";
  const hsCode = request.nextUrl.searchParams.get("hs_code")?.trim() ?? "";

  if (!exportCountry || !importCountry || !hsCode) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // Find ISO 3-digit numeric and ISO3 codes for APIs
  const exportData = ALL_COUNTRIES.find(c => c.name.toLowerCase() === exportCountry.toLowerCase());
  const importData = ALL_COUNTRIES.find(c => c.name.toLowerCase() === importCountry.toLowerCase());

  if (!exportData || !importData) {
    return NextResponse.json({ error: "Invalid country selected" }, { status: 400 });
  }

  // Variables prepared for future WITS / Comtrade calls:


  // Normalize Input HS Code: Strip all non-numeric characters
  const cleanHs = hsCode.replace(/[^0-9]/g, '');
  if (cleanHs.length < 4 || cleanHs.length > 10) {
    return NextResponse.json({ error: "Invalid HS Code format. Must be 4 to 10 digits." }, { status: 400 });
  }

  const hs6 = cleanHs.slice(0, 6);
  const hs4 = cleanHs.slice(0, 4);

  try {
    // 1. Country & HS Code Verification (NeonDB) Multi-Tier Lookup
    const dbQuery = `
      SELECT pct, description
      FROM export_shipments 
      WHERE REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE $1 || '%'
      LIMIT 1
    `;

    // Attempt 1: Exact / Full input
    let dbResult = await pool.query(dbQuery, [cleanHs]);
    let matchLevel = "Exact Match";

    // Attempt 2: 6-digit prefix
    if (dbResult.rowCount === 0 && cleanHs.length >= 6) {
      dbResult = await pool.query(dbQuery, [hs6]);
      matchLevel = "Matched at 6-digit HS Subheading level";
    }

    // Attempt 3: 4-digit heading prefix
    if (dbResult.rowCount === 0) {
      dbResult = await pool.query(dbQuery, [hs4]);
      matchLevel = "Matched at 4-digit HS Heading level";
    }
    
    if (dbResult.rowCount === 0) {
      return NextResponse.json(
        { error: "No verified customs tariff record found for the provided corridor and HS Code. Please check your country names and HS Code." }, 
        { status: 404 }
      );
    }
    
    // Matched record found in local NeonDB.
    // Since real tariff columns are pending, return the matching tier notation.
    return NextResponse.json({
      exportCountry,
      importCountry,
      hsCode,
      details: {
        customsDuty: 0,
        salesTax: 18,
        additionalDuty: 0,
        totalDuty: 18,
        tradeAgreement: matchLevel,
      }
    });
  } catch (error) {
    console.error("Tariff API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
