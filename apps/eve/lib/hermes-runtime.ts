export type HermesExecutionMode = "bridge" | "local-dev";

export interface HermesRuntimeConfig {
  mode: HermesExecutionMode;
  bridgeUrl: string | null;
  appName: string;
  agentName: string;
  ownerName: string;
}

function optional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getHermesRuntimeConfig(): HermesRuntimeConfig {
  const rawMode = process.env.HERMES_EXECUTION_MODE?.trim();
  const mode: HermesExecutionMode = rawMode === "local-dev" ? "local-dev" : "bridge";
  return {
    mode,
    bridgeUrl: optional(process.env.HERMES_BRIDGE_URL),
    appName: optional(process.env.NEXT_PUBLIC_APP_NAME) ?? "Hermes Command Center",
    agentName: optional(process.env.NEXT_PUBLIC_AGENT_NAME) ?? "Hermes",
    ownerName: optional(process.env.NEXT_PUBLIC_OWNER_NAME) ?? "Rob",
  };
}

export function assertBridgeConfigured(config = getHermesRuntimeConfig()): void {
  if (config.mode === "bridge" && !config.bridgeUrl) {
    throw new Error("Hermes bridge is not configured; set HERMES_BRIDGE_URL on the server.");
  }
}
