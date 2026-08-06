export type RateLimitResult = {
  success: boolean;
  isSuspended: boolean;
  message?: string;
};

// In-memory sliding window tracking
const requestLog = new Map<string, number[]>();
const violationLog = new Map<string, number[]>();

const RATE_LIMIT_MAX_REQUESTS = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const VIOLATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_VIOLATIONS = 3;

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  
  // 1. Clean up old requests outside the 1 minute window
  const userRequests = requestLog.get(identifier) || [];
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  // 2. Clean up old violations outside the 1 hour window
  const userViolations = violationLog.get(identifier) || [];
  const validViolations = userViolations.filter(timestamp => now - timestamp < VIOLATION_WINDOW_MS);
  
  // Update state with cleaned up data
  requestLog.set(identifier, validRequests);
  violationLog.set(identifier, validViolations);
  
  // 3. Check if user has exceeded violation strikes
  if (validViolations.length >= MAX_VIOLATIONS) {
    return {
      success: false,
      isSuspended: true,
      message: "Your account has been suspended due to unusual activity. Contact support for assistance."
    };
  }
  
  // 4. Enforce normal rate limiting
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    // Record a violation since they exceeded the limit
    validViolations.push(now);
    violationLog.set(identifier, validViolations);
    
    // Check if this new violation triggers a suspension
    if (validViolations.length >= MAX_VIOLATIONS) {
      return {
        success: false,
        isSuspended: true,
        message: "Your account has been suspended due to unusual activity. Contact support for assistance."
      };
    }
    
    return {
      success: false,
      isSuspended: false,
      message: "Rate limit exceeded. Please wait a moment before searching again."
    };
  }
  
  // 5. Success - log this request
  validRequests.push(now);
  requestLog.set(identifier, validRequests);
  
  return { success: true, isSuspended: false };
}

import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { SessionPayload } from "./auth";

export async function enforceSearchSecurity(session: SessionPayload, planType: string): Promise<NextResponse | null> {
  if (session.isSuspended) {
    return NextResponse.json(
      { error: "Your account has been suspended due to unusual activity. Contact support for assistance." },
      { status: 403 }
    );
  }

  if (session.role === "admin") return null;

  // 1. Rate limiting
  const rateLimit = checkRateLimit(`user_${session.userId}`);
  if (!rateLimit.success) {
    if (rateLimit.isSuspended) {
      await pool.query("UPDATE users SET is_suspended = true WHERE id = $1", [session.userId]);
    }
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.isSuspended ? 403 : 429 });
  }

  // 2. Trial search quota (20 per day)
  if (planType === "trial") {
    const { rows } = await pool.query(
      "SELECT daily_search_count, last_search_reset FROM users WHERE id = $1",
      [session.userId]
    );
    if (rows.length > 0) {
      const user = rows[0];
      const now = new Date();
      let searchCount = user.daily_search_count;
      const lastReset = new Date(user.last_search_reset);
      
      // Reset quota if 24 hours have passed
      if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
        searchCount = 0;
        await pool.query("UPDATE users SET daily_search_count = 0, last_search_reset = CURRENT_TIMESTAMP WHERE id = $1", [session.userId]);
      }
      
      if (searchCount >= 20) {
        return NextResponse.json({ error: "Daily search quota exceeded (20/20). Upgrade to Pro for unlimited access." }, { status: 429 });
      }
      
      // Increment search count
      await pool.query("UPDATE users SET daily_search_count = daily_search_count + 1 WHERE id = $1", [session.userId]);
    }
  }

  return null;
}
