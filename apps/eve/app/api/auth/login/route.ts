import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "hermes-cc-auth";

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: "" }));
  const expected = process.env.HERMES_CC_ACCESS_CODE;

  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (typeof code !== "string" || code !== expected) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
