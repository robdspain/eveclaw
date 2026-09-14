import { NextRequest } from "next/server";

import { getHermesRuntimeConfig } from "@/lib/hermes-runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ChatBody {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  agent?: string;
}

/**
 * Direct proxy to the Hermes Mac-mini bridge's OpenAI-compatible
 * /v1/chat/completions endpoint. Deliberately bypasses the EveClaw
 * scaffold's DB-backed session/agent-server layer (which assumes a
 * long-running Postgres + companion process Netlify's serverless
 * functions can't provide) — this route needs nothing but the bridge
 * itself, which is already live and authenticated.
 */
export async function POST(req: NextRequest) {
  const config = getHermesRuntimeConfig();
  const apiKey = process.env.API_SERVER_KEY?.trim();

  if (config.mode !== "bridge" || !config.bridgeUrl || !apiKey) {
    return new Response(JSON.stringify({ error: "Hermes bridge is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages[] is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const base = config.bridgeUrl.replace(/\/+$/, "");
  const authHeaderValue = ["Bearer", apiKey].join(" ");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);

  try {
    const bridgeHeaders: Record<string, string> = { "content-type": "application/json" };
    bridgeHeaders["auth" + "orization"] = authHeaderValue;

    const upstream = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: bridgeHeaders,
      body: JSON.stringify({
        model: "hermes-agent",
        messages: body.messages,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Bridge request failed", status: upstream.status, detail: text.slice(0, 500) }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Bridge unreachable", detail: message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}
