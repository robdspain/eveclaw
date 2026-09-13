import { NextResponse } from "next/server";

import { getHermesRuntimeConfig } from "@/lib/hermes-runtime";
import type { HermesStatusResponse } from "@/lib/hermes-protocol";

export const dynamic = "force-dynamic";

export function GET() {
  const config = getHermesRuntimeConfig();
  const body: HermesStatusResponse = {
    ok: config.mode === "local-dev" || config.bridgeUrl !== null,
    bridgeVersion: "unwired",
    gatewayConnected: false,
    subscriptionProviders: [
      { id: "anthropic", label: "Claude OAuth", status: "not-configured", detail: "Reported by the Mac-mini bridge" },
      { id: "openai-codex", label: "ChatGPT/Codex OAuth", status: "not-configured", detail: "Reported by the Mac-mini bridge" },
      { id: "gemini-cli", label: "Gemini Antigravity", status: "not-configured", detail: "Reported by the Mac-mini bridge" },
      { id: "xai", label: "SuperGrok OAuth", status: "needs-auth", detail: "Subscription OAuth is not wired in this Hermes build" },
    ],
  };
  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
}
