import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const ADMIN_PREFIX = "/dashboard/admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(ADMIN_PREFIX) && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (session.role !== "admin" && pathname !== "/dashboard/expired") {
    try {
      const meUrl = new URL("/api/auth/me", request.url);
      const res = await fetch(meUrl.toString(), {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.subscription_expires_at && new Date(data.user.subscription_expires_at) > new Date()) {
          // active — explicitly allow through, no action needed, falls to NextResponse.next()
        } else {
          // covers: no user, no expiry date, or expiry in the past — all treated as expired
          console.error("[CRITICAL] Subscription check returned no active user — failing closed.");
          return NextResponse.redirect(new URL("/dashboard/expired", request.url));
        }
      } else {
        console.error(`[CRITICAL] Subscription expiry check failed with status ${res.status}. Failing closed.`);
        return NextResponse.redirect(new URL("/dashboard/expired", request.url));
      }
    } catch (err) {
      console.error("[CRITICAL] Middleware DB check threw an exception. Failing closed.", err);
      return NextResponse.redirect(new URL("/dashboard/expired", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
