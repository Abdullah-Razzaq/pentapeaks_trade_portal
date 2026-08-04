import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getCategoryLabel, CHAPTER_SQL_EXPR } from "@/lib/productCategories";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT ${CHAPTER_SQL_EXPR} AS chapter, COUNT(*)::int AS shipments
     FROM export_shipments
     WHERE pct IS NOT NULL
     GROUP BY chapter
     ORDER BY shipments DESC`
  );

  const categories = rows.map((row: { chapter: string; shipments: number }) => ({
    chapter: row.chapter,
    label: getCategoryLabel(row.chapter),
    shipments: row.shipments,
  }));

  return NextResponse.json({ categories });
}
