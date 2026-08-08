import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  try {
    if (!query || query.length < 2) {
      const res = await pool.query(
        `SELECT UPPER(SUBSTRING(description FROM '(?i)\\m([A-Za-z]{4,})(?:[^A-Za-z]|$)')) AS keyword
         FROM (SELECT description FROM export_shipments LIMIT 10000) as sample
         WHERE description ~* '[A-Za-z]'
         GROUP BY keyword
         ORDER BY COUNT(*) DESC
         LIMIT 10`
      );
      const categories = res.rows
        .filter(r => r.keyword && r.keyword !== 'USED')
        .map(r => ({ label: r.keyword, value: r.keyword }));
      return NextResponse.json({ categories });
    }

    const cleanHs = query.replace(/[^0-9]/g, '');
    const isNumeric = cleanHs.length > 0 && query.replace(/[0-9\s]/g, '').length === 0;

    let rootKeyword = "";

    if (isNumeric) {
      // Find the most common word for this HS code
      const res = await pool.query(
        `SELECT UPPER(SUBSTRING(description FROM '(?i)\\m([A-Za-z]{3,})(?:[^A-Za-z]|$)')) AS keyword
         FROM export_shipments
         WHERE REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE $1 || '%'
           AND description ~* '[A-Za-z]'
         GROUP BY keyword
         ORDER BY COUNT(*) DESC
         LIMIT 1`,
        [cleanHs]
      );
      if ((res.rowCount ?? 0) > 0 && res.rows[0]?.keyword) {
        rootKeyword = res.rows[0].keyword;
      }
    } else {
      // Extract the primary root alphabetical keyword from the user's query
      const match = query.match(/[A-Za-z]+/);
      if (match) {
        rootKeyword = match[0].toUpperCase();
        
        // Validate it actually exists in the db
        const res = await pool.query(
          `SELECT 1 FROM export_shipments WHERE description ~* $1 LIMIT 1`,
          ['\\m' + rootKeyword + '\\M']
        );
        if (res.rowCount === 0) {
          rootKeyword = "";
        }
      }
    }

    const categories = [];
    if (rootKeyword) {
      categories.push({
        label: rootKeyword,
        value: rootKeyword
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Products search error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
