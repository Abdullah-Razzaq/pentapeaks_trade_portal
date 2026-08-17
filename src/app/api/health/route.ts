import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  let dbStatus = "operational";
  
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error("Database health check failed:", err);
    dbStatus = "degraded";
  }

  // API and Data Pipeline are currently hardcoded as operational 
  // since this Next.js process itself is serving the API.
  return NextResponse.json({
    database: dbStatus,
    api: "operational",
    dataPipeline: "operational"
  });
}
