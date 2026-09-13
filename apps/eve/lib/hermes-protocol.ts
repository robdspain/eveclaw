import { z } from "zod";

export const hermesEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("run.started"), runId: z.string(), threadId: z.string(), provider: z.string(), model: z.string(), at: z.number() }),
  z.object({ type: z.literal("run.progress"), runId: z.string(), text: z.string(), at: z.number() }),
  z.object({ type: z.literal("run.tool"), runId: z.string(), tool: z.string(), status: z.enum(["started", "completed", "failed"]), at: z.number() }),
  z.object({ type: z.literal("run.completed"), runId: z.string(), messageId: z.string(), at: z.number() }),
  z.object({ type: z.literal("run.failed"), runId: z.string(), code: z.string(), message: z.string(), retryable: z.boolean(), at: z.number() }),
]);

export type HermesEvent = z.infer<typeof hermesEventSchema>;

export const hermesSendRequestSchema = z.object({
  type: z.literal("thread.send"),
  requestId: z.string(),
  threadId: z.string(),
  text: z.string().min(1).max(100_000),
  agentId: z.string().optional(),
  attachmentIds: z.array(z.string()).max(20).optional(),
});

export const hermesCancelRequestSchema = z.object({
  type: z.literal("thread.cancel"),
  requestId: z.string(),
  runId: z.string(),
});

export const hermesStatusResponseSchema = z.object({
  ok: z.boolean(),
  bridgeVersion: z.string().optional(),
  gatewayConnected: z.boolean(),
  subscriptionProviders: z.array(z.object({
    id: z.enum(["anthropic", "openai-codex", "gemini-cli", "xai"]),
    label: z.string(),
    status: z.enum(["connected", "needs-auth", "unavailable", "not-configured"]),
    detail: z.string().optional(),
  })),
});

export type HermesSendRequest = z.infer<typeof hermesSendRequestSchema>;
export type HermesCancelRequest = z.infer<typeof hermesCancelRequestSchema>;
export type HermesStatusResponse = z.infer<typeof hermesStatusResponseSchema>;

export const HERMES_PROTOCOL_VERSION = "1";

export function parseHermesEvent(input: unknown): HermesEvent {
  return hermesEventSchema.parse(input);
}
