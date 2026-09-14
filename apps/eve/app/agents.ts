export interface Routine {
  id: string;
  label: string;
  scheduleLabel: string;
  paused: boolean;
}

export interface AgentDef {
  id: string;
  name: string;
  title?: string;
  color: string;
  glyph: "ghost" | "cloud" | "drop" | "bolt" | "spark";
  shape?: AgentShape;
  instructions?: string;
  routines?: Routine[];
  notifications?: boolean;
}

export type AgentShape = "circle" | "circle-outline" | "squircle" | "pill" | "triangle" | "hex" | "cloud" | "drop";

export const SHAPE_OPTIONS: AgentShape[] = [
  "circle-outline",
  "circle",
  "squircle",
  "pill",
  "triangle",
  "hex",
  "cloud",
  "drop",
];

export const COLOR_OPTIONS = [
  "#ffffff",
  "#8a5a3a",
  "#e0393e",
  "#e2621f",
  "#e8933a",
  "#1fae7a",
  "#1fbfa0",
  "#2f8fe0",
  "#8a5ee8",
  "#e83f8f",
  "#8a8f96",
];


export const DEFAULT_AGENTS: AgentDef[] = [
  { id: "general", name: "Hermes", color: "#e8933a", glyph: "cloud", shape: "cloud" },
  {
    id: "team",
    name: "Team",
    color: "#8a5ee8",
    glyph: "spark",
    shape: "hex",
    instructions:
      "You are the Team coordinator lane. When a request has independent sub-parts, use delegate_task to run genuinely parallel subagents (not sequential tool calls) and combine their results — don't just talk about doing it, actually call the tool. Keep the final combined answer concise. For simple single-step requests, just answer directly without delegating.",
  },
  { id: "study", name: "Study", color: "#ffffff", glyph: "ghost", shape: "circle" },
  { id: "newsletter", name: "Newsletter", color: "#8b8f96", glyph: "ghost", shape: "circle" },
  { id: "inbox", name: "Personal Inbox", color: "#2f8fe0", glyph: "drop", shape: "drop" },
  { id: "macmini", name: "Mac Mini Health", color: "#e8933a", glyph: "bolt", shape: "triangle" },
  { id: "finance", name: "Financial Manager", color: "#1fae7a", glyph: "spark", shape: "squircle" },
];

const OVERRIDES_KEY = "hermes-agent-overrides";

type AgentOverride = Partial<Pick<AgentDef, "name" | "title" | "color" | "shape" | "instructions" | "routines" | "notifications">>;

function loadOverrides(): Record<string, AgentOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAgentOverride(id: string, patch: AgentOverride) {
  const overrides = loadOverrides();
  overrides[id] = { ...overrides[id], ...patch };
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function resetAgentOverride(id: string) {
  const overrides = loadOverrides();
  delete overrides[id];
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

/**
 * Default agent roster shown on the Hermes Command Center home screen,
 * GrokBot-style, merged with any user customizations (name/title/color/
 * shape/instructions) saved from the edit screen. Each is a persona
 * threaded on top of the same underlying Hermes bridge (one real agent,
 * subscription-backed) — the persona just prefixes a system message so
 * replies stay scoped to that lane.
 */
export function getAgents(): AgentDef[] {
  const overrides = loadOverrides();
  return DEFAULT_AGENTS.map((agent) => ({ ...agent, ...overrides[agent.id] }));
}

export const AGENTS = DEFAULT_AGENTS;

export function findAgent(id: string): AgentDef {
  return getAgents().find((a) => a.id === id) ?? getAgents()[0];
}

export function agentSystemPrompt(agent: AgentDef): string {
  if (agent.instructions?.trim()) return agent.instructions.trim();
  if (agent.id === "general") return "";
  return `You are being addressed through the "${agent.name}" lane of Rob's Hermes Command Center. Stay focused on topics relevant to that lane when possible, but you have full access to real Hermes tools and memory — this is not a sandboxed persona, just a UI grouping.`;
}

