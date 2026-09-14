import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "hermes-cc-auth";

/**
 * Simple shared-PIN gate for the whole Hermes Command Center site.
 * This app proxies straight through to a real Hermes agent with full
 * tool/memory/subagent access, so it must never be left publicly open.
 * Checks a signed-ish cookie set by /api/auth/login against
 * HERMES_CC_ACCESS_CODE (set in Netlify env, never in source).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page and its API route through.
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const expected = process.env.HERMES_CC_ACCESS_CODE;
  // Fail CLOSED: if the code isn't configured, block everything rather
  // than silently running open.
  if (!expected) {
    return new NextResponse("Access code not configured.", { status: 503 });
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie === expected) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  const redirect = NextResponse.redirect(loginUrl);
  redirect.headers.set("Cache-Control", "no-store");
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
