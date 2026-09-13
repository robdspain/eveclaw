import { NextResponse } from "next/server";

import { getHermesRuntimeConfig } from "@/lib/hermes-runtime";
import type { HermesStatusResponse } from "@/lib/hermes-protocol";

export const dynamic = "force-dynamic";

interface HermesCapabilities {
  runtime?: { mode?: string };
}

async function probeBridge(bridgeUrl: string, apiKey: string): Promise<{
  ok: boolean;
  bridgeVersion: string;
}> {
  const base = bridgeUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const health = await fetch(`${base}/health`, { signal: controller.signal });
    if (!health.ok) return { ok: false, bridgeVersion: "unreachable" };

    const capsResponse = await fetch(`${base}/v1/capabilities`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!capsResponse.ok) return { ok: false, bridgeVersion: "unauthorized" };
    const caps = (await capsResponse.json()) as HermesCapabilities;
    return { ok: true, bridgeVersion: caps.runtime?.mode ?? "connected" };
  } catch {
    return { ok: false, bridgeVersion: "unreachable" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const config = getHermesRuntimeConfig();
  const apiKey = process.env.API_SERVER_KEY?.trim();

  let gatewayConnected = false;
  let bridgeVersion = "unwired";

  if (config.mode === "bridge" && config.bridgeUrl && apiKey) {
    const probe = await probeBridge(config.bridgeUrl, apiKey);
    gatewayConnected = probe.ok;
    bridgeVersion = probe.bridgeVersion;
  } else if (config.mode === "local-dev") {
    bridgeVersion = "local-dev";
  } else {
    bridgeVersion = "not-configured";
  }

  const providerStatus = gatewayConnected ? "connected" : "not-configured";
  const body: HermesStatusResponse = {
    ok: config.mode === "local-dev" || gatewayConnected,
    bridgeVersion,
    gatewayConnected,
    subscriptionProviders: [
      { id: "anthropic", label: "Claude OAuth", status: providerStatus, detail: "Reported by the Mac-mini bridge" },
      { id: "openai-codex", label: "ChatGPT/Codex OAuth", status: providerStatus, detail: "Reported by the Mac-mini bridge" },
      { id: "gemini-cli", label: "Gemini Antigravity", status: providerStatus, detail: "Reported by the Mac-mini bridge" },
      { id: "xai", label: "SuperGrok OAuth", status: "needs-auth", detail: "Subscription OAuth is not wired in this Hermes build" },
    ],
  };
  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
}
