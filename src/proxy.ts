import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic redirect only (cookie presence). Real checks live in lib/guards.ts.
export function proxy(req: NextRequest) {
  if (!getSessionCookie(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/found/:path*", "/lost/:path*", "/my-reports/:path*", "/admin/:path*"],
};
