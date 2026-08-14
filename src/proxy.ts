import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// KNOWN LIMITATION: This Next.js proxy runs on the Edge Runtime by default.
// Edge functions can execute as multiple concurrent, geographically distributed instances.
// An in-memory Map is NOT shared across these instances. Therefore, this rate limiter
// is Edge-unsafe and should be treated as a best-effort measure only. An attacker's
// requests might land on different instances, each with its own counter, allowing more
// requests than intended.
//
// PRIORITY: When a shared KV/Redis store becomes available in this environment,
// this MUST be replaced with an atomic increment-with-expiry pattern (e.g. Redis INCR + EXPIRE).
const authRequestLog = new Map<string, number[]>();
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX_REQUESTS = 10;

const ADMIN_PREFIX = "/dashboard/admin";

function setCorsHeaders(headers: Headers, origin: string, isPreflight: boolean = false) {
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  if (isPreflight) {
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();
  const isApiRoute = pathname.startsWith("/api/");

  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // 1. CORS Preflight for APIs
  if (isApiRoute && request.method === 'OPTIONS') {
    const preflightHeaders = new Headers();
    if (isAllowedOrigin) {
      setCorsHeaders(preflightHeaders, origin, true);
    }
    return new NextResponse(null, { headers: preflightHeaders, status: 204 });
  }

  // 2. Auth Rate Limiting
  if (pathname.startsWith("/api/auth/")) {
    const ip = (request as NextRequest & { ip?: string }).ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const now = Date.now();
    const userRequests = authRequestLog.get(ip) || [];
    const validRequests = userRequests.filter(timestamp => now - timestamp < AUTH_RATE_LIMIT_WINDOW_MS);
    
    if (validRequests.length >= AUTH_RATE_LIMIT_MAX_REQUESTS) {
      response = new NextResponse(
        JSON.stringify({ error: "Too many requests, please try again later." }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(AUTH_RATE_LIMIT_WINDOW_MS / 1000)) } }
      );
    } else {
      validRequests.push(now);
      authRequestLog.set(ip, validRequests);
    }
  }

  // 3. Dashboard Routes Logic
  // Only execute this logic if the request has not already been intercepted by rate-limiting (status != 429)
  // Actually, dashboard routes don't overlap with /api/auth/, but for safety:
  if (pathname.startsWith("/dashboard") && response.status !== 429) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      response = NextResponse.redirect(loginUrl);
    } else if (pathname.startsWith(ADMIN_PREFIX) && session.role !== "admin") {
      response = NextResponse.redirect(new URL("/dashboard", request.url));
    } else if (session.role !== "admin" && pathname !== "/dashboard/expired") {
      try {
        const meUrl = new URL("/api/auth/me", request.url);
        const res = await fetch(meUrl.toString(), {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
          cache: "no-store"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.subscription_expires_at && new Date(data.user.subscription_expires_at) > new Date()) {
            // active
          } else {
            console.error("[CRITICAL] Subscription check returned no active user — failing closed.");
            response = NextResponse.redirect(new URL("/dashboard/expired", request.url));
          }
        } else {
          console.error(`[CRITICAL] Subscription expiry check failed with status ${res.status}. Failing closed.`);
          response = NextResponse.redirect(new URL("/dashboard/expired", request.url));
        }
      } catch (err) {
        console.error("[CRITICAL] Middleware DB check threw an exception. Failing closed.", err);
        response = NextResponse.redirect(new URL("/dashboard/expired", request.url));
      }
    }
  }

  // 4. Global Final Step: Append CORS headers if it's an API route and origin is allowed.
  // This explicitly guarantees that every response (NextResponse.next(), 429, 401, redirects, etc.)
  // returned from this proxy file will carry the proper CORS headers.
  if (isApiRoute && isAllowedOrigin) {
    setCorsHeaders(response.headers, origin, false);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
