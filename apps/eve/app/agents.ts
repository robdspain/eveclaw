export interface AgentDef {
  id: string;
  name: string;
  color: string;
  glyph: "ghost" | "cloud" | "drop" | "bolt" | "spark";
}

/**
 * Default agent roster shown on the Hermes Command Center home screen,
 * GrokBot-style. Each is a persona threaded on top of the same underlying
 * Hermes bridge (one real agent, subscription-backed) — the persona just
 * prefixes a system message so replies stay scoped to that lane. Users can
 * rename/add more later; this is the sensible default set for Rob's stack.
 */
export const AGENTS: AgentDef[] = [
  { id: "general", name: "Hermes", color: "#e8933a", glyph: "cloud" },
  { id: "study", name: "Study", color: "#e8e8ec", glyph: "ghost" },
  { id: "newsletter", name: "Newsletter", color: "#8b8f96", glyph: "ghost" },
  { id: "inbox", name: "Personal Inbox", color: "#2f8fe0", glyph: "drop" },
  { id: "macmini", name: "Mac Mini Health", color: "#e8933a", glyph: "bolt" },
  { id: "finance", name: "Financial Manager", color: "#1fae7a", glyph: "spark" },
];

export function findAgent(id: string): AgentDef {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}

export function agentSystemPrompt(agent: AgentDef): string {
  if (agent.id === "general") return "";
  return `You are being addressed through the "${agent.name}" lane of Rob's Hermes Command Center. Stay focused on topics relevant to that lane when possible, but you have full access to real Hermes tools and memory — this is not a sandboxed persona, just a UI grouping.`;
}
