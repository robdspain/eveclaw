"use client";

import { useEffect, useState } from "react";

interface AgentStatus {
  id: string;
  label: string;
  status: "connected" | "not-configured" | "needs-auth";
  detail: string;
}

interface HealthResponse {
  gatewayConnected: boolean;
  subscriptionProviders: AgentStatus[];
}

const AVATAR_GLYPH: Record<string, string> = {
  anthropic: "◆",
  "openai-codex": "●",
  "gemini-cli": "▲",
  xai: "✦",
};

/**
 * GrokBot-style animated agent roster, shown alongside the chat. Reflects
 * REAL bridge state polled from /api/hermes/health (not decorative) — the
 * pulse animation runs only on agents actually connected right now.
 */
export default function AgentRoster({ busy }: { busy: boolean }) {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [gatewayConnected, setGatewayConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/hermes/health", { cache: "no-store" });
        const data: HealthResponse = await res.json();
        if (!cancelled) {
          setAgents(data.subscriptionProviders ?? []);
          setGatewayConnected(Boolean(data.gatewayConnected));
        }
      } catch {
        if (!cancelled) setGatewayConnected(false);
      }
    }
    poll();
    const interval = setInterval(poll, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside style={styles.rail}>
      <div style={styles.railHeader}>Agents</div>
      <div style={styles.list}>
        {agents.map((agent) => {
          const active = agent.status === "connected";
          const thinking = active && gatewayConnected && busy;
          return (
            <div key={agent.id} style={styles.card} title={agent.detail}>
              <div style={{ ...styles.avatar, ...(active ? styles.avatarActive : styles.avatarIdle) }}>
                <span style={thinking ? styles.glyphSpin : undefined}>{AVATAR_GLYPH[agent.id] ?? "•"}</span>
                {active && <span style={{ ...styles.pulse, ...(thinking ? styles.pulseFast : null) }} />}
              </div>
              <div style={styles.meta}>
                <div style={styles.name}>{agent.label}</div>
                <div style={styles.status}>
                  {agent.status === "connected" ? (thinking ? "thinking…" : "ready") : agent.status === "needs-auth" ? "needs auth" : "offline"}
                </div>
              </div>
            </div>
          );
        })}
        {agents.length === 0 && <div style={styles.loading}>Loading roster…</div>}
      </div>
      <style>{`
        @keyframes hermes-pulse { 0% { transform: scale(0.9); opacity: 0.9; } 70% { transform: scale(1.9); opacity: 0; } 100% { opacity: 0; } }
        @keyframes hermes-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  rail: {
    width: 168,
    flexShrink: 0,
    borderRight: "1px solid #1c1f24",
    background: "#0d0f13",
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
  },
  railHeader: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#6a707a",
    padding: "0 4px 4px",
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 8px",
    borderRadius: 10,
    background: "#15171b",
    border: "1px solid #21252b",
  },
  avatar: {
    position: "relative",
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    flexShrink: 0,
  },
  avatarActive: { background: "#173a2b", color: "#3ddc84", border: "1px solid #26593f" },
  avatarIdle: { background: "#1c1e23", color: "#4b5057", border: "1px solid #23262c" },
  pulse: {
    position: "absolute",
    inset: -2,
    borderRadius: 999,
    border: "1.5px solid #3ddc84",
    animation: "hermes-pulse 2.2s ease-out infinite",
  },
  pulseFast: { animation: "hermes-pulse 0.9s ease-out infinite" },
  glyphSpin: { display: "inline-block" },
  meta: { minWidth: 0 },
  name: { fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  status: { fontSize: 10.5, color: "#7b818b", marginTop: 1 },
  loading: { fontSize: 12, color: "#565b64", padding: "6px 4px" },
};
