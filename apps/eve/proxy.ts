import { NextRequest, NextResponse } from "next/server";

/**
 * Access gate disabled at the user's explicit request (2026-09-14): "No auth
 * required at the moment just open." The code+cookie gate is still fully
 * implemented in app/login and app/api/auth/login — flip this back to the
 * commit before this one (or re-enable the check below) to turn it back on.
 */
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
