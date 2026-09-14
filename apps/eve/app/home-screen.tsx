"use client";

import { useState } from "react";

import AgentAvatar from "./agent-avatar";
import { AGENTS } from "./agents";
import AgentThread, { ThreadPreview } from "./agent-thread";

/**
 * Home screen: a list of agent "bots", GrokBot-style. Tapping one opens its
 * own thread (agent-thread.tsx). Every agent runs on the same real Hermes
 * bridge underneath — this is a UI grouping, not separate sandboxes.
 */
export default function HomeScreen() {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, ThreadPreview>>({});

  if (openAgentId) {
    const agent = AGENTS.find((a) => a.id === openAgentId)!;
    return (
      <AgentThread
        agent={agent}
        onBack={() => setOpenAgentId(null)}
        onPreviewChange={(preview) => setPreviews((prev) => ({ ...prev, [agent.id]: preview }))}
      />
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.topBar}>
        <div style={styles.avatarSmall}>🕶️</div>
        <div style={styles.topActions}>
          <button style={styles.iconBtn} aria-label="Search">🔍</button>
          <button style={styles.iconBtn} aria-label="New">＋</button>
        </div>
      </header>

      <div style={styles.hero}>
        <AgentAvatar agent={{ id: "general", name: "Hermes", color: "#e8933a", glyph: "cloud" }} size={110} />
        <div style={styles.heroName}>Rob</div>
      </div>

      <main style={styles.list}>
        {AGENTS.map((agent) => {
          const preview = previews[agent.id];
          return (
            <button key={agent.id} style={styles.row} onClick={() => setOpenAgentId(agent.id)}>
              <AgentAvatar agent={agent} size={40} />
              <div style={styles.rowText}>
                <div style={styles.rowTop}>
                  <span style={styles.rowName}>{agent.name}</span>
                  {preview?.timeLabel && <span style={styles.rowTime}>{preview.timeLabel}</span>}
                </div>
                <div style={styles.rowPreview}>{preview?.text ?? "No messages yet"}</div>
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100dvh",
    background: "#0b0d10",
    color: "#e8e8ec",
    fontFamily: "system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    maxWidth: 480,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "#22252b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  topActions: { display: "flex", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "#1a1d22",
    border: "1px solid #262a30",
    color: "#e8e8ec",
    fontSize: 15,
    cursor: "pointer",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "18px 0 22px",
  },
  heroName: { fontSize: 15, color: "#9aa0a8" },
  list: { display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #16181c",
    textAlign: "left",
    cursor: "pointer",
    color: "inherit",
    width: "100%",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  rowName: { fontSize: 15.5, fontWeight: 600 },
  rowTime: { fontSize: 12, color: "#6a707a" },
  rowPreview: {
    fontSize: 13,
    color: "#8a8f98",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 2,
  },
};
