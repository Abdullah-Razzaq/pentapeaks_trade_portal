import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  console.log("API /auth/me session:", session);

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const { rows } = await pool.query(
    "SELECT last_activated_at, download_count, downloads_today, last_download_date, subscription_expires_at, plan_type, data_access_months FROM users WHERE id = $1", 
    [session.userId]
  );
  const userStats = rows[0] || {};
  const now = new Date();
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      last_activated_at: userStats.last_activated_at,
      download_count: userStats.download_count || 0,
      downloads_today: userStats.downloads_today || 0,
      last_download_date: userStats.last_download_date,
      subscription_expires_at: userStats.subscription_expires_at,
      plan_type: userStats.plan_type || 'trial',
      data_access_months: userStats.data_access_months ?? 1,
      resetsAt,
    },
  });
}
