/**
 * Hermes bridge model provider.
 *
 * The Mac-mini's Hermes `api_server` gateway platform exposes an
 * OpenAI-compatible `/v1/chat/completions` endpoint (confirmed live,
 * 2026-09-13: a real round trip through Claude/Codex/Gemini on the Mac mini
 * returned "bridge-ok"). Rather than inventing a bespoke run/event protocol,
 * this wraps that endpoint with the AI SDK's official
 * `@ai-sdk/openai-compatible` provider so the existing `eve` agent runtime
 * (which already expects an AI-SDK `LanguageModel`) can call it unmodified.
 *
 * Server-side only: HERMES_BRIDGE_URL points at the Tailscale-only address
 * of the Mac mini and API_SERVER_KEY never reaches the browser.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { getHermesRuntimeConfig } from "@/lib/hermes-runtime";

const HERMES_MODEL_ID = "hermes-agent";

/**
 * Returns an AI-SDK LanguageModel backed by the live Hermes bridge, or null
 * when the bridge isn't configured (local-dev mode, or bridgeUrl unset) so
 * callers can fall back to a direct AI Gateway model instead.
 */
export function getHermesBridgeModel() {
  const config = getHermesRuntimeConfig();
  if (config.mode !== "bridge" || !config.bridgeUrl) return null;

  const apiKey = process.env.API_SERVER_KEY?.trim();
  if (!apiKey) return null;

  const provider = createOpenAICompatible({
    name: "hermes-bridge",
    baseURL: `${config.bridgeUrl.replace(/\/+$/, "")}/v1`,
    apiKey,
  });

  return provider.chatModel(HERMES_MODEL_ID);
}

export function isHermesBridgeConfigured(): boolean {
  const config = getHermesRuntimeConfig();
  return config.mode === "bridge" && Boolean(config.bridgeUrl) && Boolean(process.env.API_SERVER_KEY?.trim());
}
