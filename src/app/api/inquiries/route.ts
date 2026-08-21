import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Create tables if not exists (lazy init)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        country_name VARCHAR(255) NOT NULL,
        country_code VARCHAR(2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS inquiry_responses (
        id SERIAL PRIMARY KEY,
        inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const { rows } = await pool.query(`SELECT * FROM inquiries ORDER BY created_at DESC`);
    
    // Fetch responses if admin
    if (session.role === "admin") {
      const responseRows = await pool.query(`
        SELECT r.id, r.inquiry_id, r.message, r.created_at, u.name as user_name
        FROM inquiry_responses r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at ASC
      `);
      
      const inquiriesWithResponses = rows.map(inq => ({
        ...inq,
        responses: responseRows.rows.filter(r => r.inquiry_id === inq.id)
      }));
      return NextResponse.json({ inquiries: inquiriesWithResponses });
    }

    return NextResponse.json({ inquiries: rows });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, country_name, country_code } = await request.json();
    if (!description || !country_name || !country_code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        country_name VARCHAR(255) NOT NULL,
        country_code VARCHAR(2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const { rows } = await pool.query(
      `INSERT INTO inquiries (description, country_name, country_code) VALUES ($1, $2, $3) RETURNING *`,
      [description, country_name, country_code]
    );

    return NextResponse.json({ inquiry: rows[0] });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    await pool.query(`DELETE FROM inquiries WHERE id = $1`, [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
