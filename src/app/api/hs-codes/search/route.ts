import { NextResponse } from 'next/server';
import { pool } from '@/lib/db'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ hsCodes: [] });
  }

  try {
    const cleanHs = query.replace(/[^0-9]/g, '');
    
    // Query NeonDB for distinct PCT/HS codes and descriptions matching input
    const results = await pool.query(
      `SELECT DISTINCT to_char(pct, 'FM0000.0000') AS code, description 
       FROM export_shipments 
       WHERE (LENGTH($1) > 0 AND REPLACE(to_char(pct, 'FM0000.0000'), '.', '') LIKE $1 || '%') 
          OR LOWER(description) LIKE '%' || LOWER($2) || '%'
       LIMIT 20`,
      [cleanHs, query]
    );

    return NextResponse.json({ hsCodes: results.rows || results });
  } catch (error) {
    console.error('HS Code Search Error:', error);
    return NextResponse.json({ hsCodes: [] });
  }
}
