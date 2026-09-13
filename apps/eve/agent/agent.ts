import type { LanguageModelMiddleware, ModelMessage } from "ai";
import { gateway, wrapLanguageModel } from "ai";
import { defineAgent, defineDynamic } from "eve";

import { getHermesBridgeModel } from "@/lib/hermes-bridge-model";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

const MODEL_ID_PATTERN = /^[\w.-]+\/[\w.:-]+$/;

/** The AI SDK's provider-agnostic reasoning effort levels, minus the default. */
const REASONING_LEVELS = ["none", "minimal", "low", "medium", "high", "xhigh"] as const;
type ReasoningLevel = (typeof REASONING_LEVELS)[number];

function isReasoningLevel(value: unknown): value is ReasoningLevel {
  return typeof value === "string" && (REASONING_LEVELS as readonly string[]).includes(value);
}

const CLIENT_CONTEXT_PREFIX = "Client context:\n";

interface TurnSettings {
  model: string | null;
  reasoning: ReasoningLevel | null;
}

const NO_SETTINGS: TurnSettings = { model: null, reasoning: null };

/**
 * The web chat attaches `{ eveWebModel, eveWebReasoning? }` as one-turn
 * `clientContext`, which the eve channel delivers as a user-role message of
 * the exact form `Client context:\n<json>`. Scan the visible conversation
 * from the end for a message that parses to that shape, so ordinary
 * conversation text merely mentioning the keys cannot match.
 */
function requestedSettings(messages: readonly ModelMessage[]): TurnSettings {
  for (let index = messages.length - 1; index >= 0; index--) {
    const { content } = messages[index];
    const texts =
      typeof content === "string"
        ? [content]
        : content.map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""));
    for (const text of texts) {
      const settings = parseSettingsMarker(text);
      if (settings !== null) return settings;
    }
  }
  return NO_SETTINGS;
}

function parseSettingsMarker(text: string): TurnSettings | null {
  if (!text.startsWith(CLIENT_CONTEXT_PREFIX)) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(CLIENT_CONTEXT_PREFIX.length));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const modelValue = record.eveWebModel;
    const model =
      typeof modelValue === "string" && MODEL_ID_PATTERN.test(modelValue) ? modelValue : null;
    const reasoning = isReasoningLevel(record.eveWebReasoning) ? record.eveWebReasoning : null;
    if (model === null && reasoning === null) return null;
    return { model, reasoning };
  } catch {
    return null;
  }
}

function reasoningMiddleware(reasoning: ReasoningLevel): LanguageModelMiddleware {
  return {
    specificationVersion: "v4",
    transformParams: async ({ params }) => ({
      ...params,
      reasoning: params.reasoning ?? reasoning,
      providerOptions: {
        ...params.providerOptions,
        // eve enables the gateway's automatic prompt caching for string model
        // ids only; a live model bypasses that path, so re-apply it here.
        gateway: { caching: "auto", ...params.providerOptions?.gateway },
      },
    }),
  };
}

export default defineAgent({
  model: defineDynamic({
    fallback: DEFAULT_MODEL,
    events: {
      "turn.started": (_event, ctx) => requestedSettings(ctx.messages).model,
      // Live models (Hermes bridge, or a reasoning-wrapped gateway model) are
      // only allowed from step.started. The Hermes bridge — the Mac mini's
      // native api_server gateway, OpenAI-compatible, confirmed live
      // 2026-09-13 — takes priority whenever it's configured: it is the
      // subscription-backed (no API keys) execution path this app is built
      // around. Falls through to the AI Gateway path when the bridge isn't
      // configured (e.g. local dev without a Mac-mini connection).
      "step.started": (_event, ctx) => {
        const bridgeModel = getHermesBridgeModel();
        if (bridgeModel) return bridgeModel;

        const { model, reasoning } = requestedSettings(ctx.messages);
        if (reasoning === null) return null;
        return wrapLanguageModel({
          model: gateway(model ?? DEFAULT_MODEL),
          middleware: reasoningMiddleware(reasoning),
        });
      },
    },
  }),
});

