import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./auth";
import { pool } from "./db";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  try {
    const { rows } = await pool.query(
      "SELECT current_session_token, subscription_expires_at, subscription_status, is_suspended FROM users WHERE id = $1",
      [payload.userId]
    );

    if (rows.length === 0 || rows[0].current_session_token !== payload.sessionToken) {
      // Mismatch: log out the user by clearing cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }
    
    if (payload.role !== "admin") {
      const now = new Date();
      const expiresAt = rows[0].subscription_expires_at;
      payload.isExpired = expiresAt ? new Date(expiresAt) < now : false;
      payload.subscriptionStatus = rows[0].subscription_status;
      payload.isSuspended = rows[0].is_suspended;
    }
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }

  return payload;
}
