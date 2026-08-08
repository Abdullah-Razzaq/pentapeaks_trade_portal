export type RateLimitResult = {
  success: boolean;
  isSuspended: boolean;
  message?: string;
};

// In-memory sliding window tracking
const requestLog = new Map<string, number[]>();
const violationLog = new Map<string, number[]>();


const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const VIOLATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_VIOLATIONS = 3;

export function checkRateLimit(identifier: string, limit: number = 15): RateLimitResult {
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
  if (validRequests.length >= limit) {
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
  // Increased rate limit to prevent 429 during normal pagination for all users
  const limit = planType === "pro" ? 300 : 180;
  const rateLimit = checkRateLimit(`user_${session.userId}`, limit);
  if (!rateLimit.success) {
    if (rateLimit.isSuspended) {
      await pool.query("UPDATE users SET is_suspended = true WHERE id = $1", [session.userId]);
    }
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.isSuspended ? 403 : 429 });
  }

  // The 20-page limit for trial users is now handled entirely on the frontend
  // to avoid backend 429 errors during rapid pagination.

  return null;
}
