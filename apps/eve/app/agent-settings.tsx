"use client";

import { useState } from "react";

import AgentAvatar from "./agent-avatar";
import {
  AgentDef,
  AgentShape,
  COLOR_OPTIONS,
  DEFAULT_AGENTS,
  Routine,
  SHAPE_OPTIONS,
  resetAgentOverride,
  saveAgentOverride,
} from "./agents";

const SHAPE_GLYPH: Record<AgentShape, string> = {
  "circle-outline": "○",
  circle: "●",
  squircle: "▢",
  pill: "▭",
  triangle: "▲",
  hex: "⬡",
  cloud: "☁️",
  drop: "💧",
};

/**
 * Per-agent settings/edit screen: rename, retitle, pick a character shape +
 * accent color (GrokBot's "Character" grid), edit system instructions,
 * manage routines (scheduled runs), toggle notifications, and share as a
 * template. Matches the two reference screenshots the user provided.
 */
export default function AgentSettings({ agent, onBack, onSaved }: { agent: AgentDef; onBack: () => void; onSaved: () => void }) {
  const [name, setName] = useState(agent.name);
  const [title, setTitle] = useState(agent.title ?? "");
  const [color, setColor] = useState(agent.color);
  const [shape, setShape] = useState<AgentShape>(agent.shape ?? "circle");
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructions, setInstructions] = useState(agent.instructions ?? "");
  const [notifications, setNotifications] = useState(agent.notifications ?? true);
  const [routines, setRoutines] = useState<Routine[]>(agent.routines ?? []);

  const preview: AgentDef = { ...agent, name, title, color, shape, instructions, notifications, routines };
  const isDefault = DEFAULT_AGENTS.find((a) => a.id === agent.id);

  function persist(patch: Partial<AgentDef>) {
    saveAgentOverride(agent.id, patch);
    onSaved();
  }

  function toggleRoutine(id: string) {
    const next = routines.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r));
    setRoutines(next);
    persist({ routines: next });
  }

  function resetToDefault() {
    resetAgentOverride(agent.id);
    if (isDefault) {
      setName(isDefault.name);
      setTitle(isDefault.title ?? "");
      setColor(isDefault.color);
      setShape(isDefault.shape ?? "circle");
    }
    onSaved();
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={onBack} aria-label="Back">‹</button>
        <div style={{ flex: 1 }} />
        <button style={styles.iconBtn} aria-label="Share">⬆</button>
        <button style={styles.iconBtn} aria-label="More">⋯</button>
      </header>

      <div style={styles.hero}>
        <AgentAvatar agent={preview} size={110} />
      </div>

      <div style={styles.card}>
        <input
          style={styles.nameInput}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            persist({ name: e.target.value });
          }}
          placeholder="Name"
        />
        <div style={styles.divider} />
        <input
          style={styles.titleInput}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            persist({ title: e.target.value });
          }}
          placeholder="Title (optional)"
        />
      </div>

      <div style={styles.sectionLabel}>Character</div>
      <div style={styles.card}>
        <div style={styles.shapeGrid}>
          {SHAPE_OPTIONS.map((s) => (
            <button
              key={s}
              style={{ ...styles.shapeBtn, ...(shape === s ? styles.shapeBtnActive : null) }}
              onClick={() => {
                setShape(s);
                persist({ shape: s });
              }}
              aria-label={s}
            >
              {SHAPE_GLYPH[s]}
            </button>
          ))}
        </div>
        <div style={styles.colorGrid}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              style={{
                ...styles.colorSwatch,
                background: c,
                ...(color === c ? styles.colorSwatchActive : null),
              }}
              onClick={() => {
                setColor(c);
                persist({ color: c });
              }}
              aria-label={c}
            />
          ))}
        </div>
        <button style={styles.resetLink} onClick={resetToDefault}>
          Reset to default
        </button>
      </div>
      <div style={styles.hint}>How this Bot&apos;s mark looks everywhere</div>

      <button style={styles.rowCard} onClick={() => setInstructionsOpen((v) => !v)}>
        <span style={styles.rowIcon}>📄</span>
        <span style={styles.rowLabel}>Instructions</span>
        <span style={styles.chevron}>{instructionsOpen ? "⌄" : "›"}</span>
      </button>
      {instructionsOpen && (
        <div style={styles.card}>
          <textarea
            style={styles.instructionsArea}
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              persist({ instructions: e.target.value });
            }}
            placeholder="System instructions for this agent lane…"
            rows={5}
          />
        </div>
      )}

      <div style={styles.sectionLabel}>Routines</div>
      <div style={styles.card}>
        {routines.length === 0 && <div style={styles.noRoutines}>No routines yet</div>}
        {routines.map((r) => (
          <button key={r.id} style={styles.routineRow} onClick={() => toggleRoutine(r.id)}>
            <span style={{ ...styles.routineDot, background: r.paused ? "#c94b3f" : "#2fae5e" }} />
            <div style={styles.routineText}>
              <div style={styles.routineLabel}>{r.label}</div>
              <div style={styles.routineSchedule}>
                {r.scheduleLabel}
                {r.paused ? " · Paused" : ""}
              </div>
            </div>
            <span style={styles.chevron}>›</span>
          </button>
        ))}
        <button
          style={styles.addRoutine}
          onClick={() => {
            const next = [
              ...routines,
              { id: `r-${Date.now()}`, label: "New routine", scheduleLabel: "Not scheduled yet", paused: true },
            ];
            setRoutines(next);
            persist({ routines: next });
          }}
        >
          + Add routine
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.notifRow}>
          <span style={styles.rowLabel}>Notifications</span>
          <button
            style={{ ...styles.toggle, background: notifications ? "#2fae5e" : "#33373f" }}
            onClick={() => {
              const next = !notifications;
              setNotifications(next);
              persist({ notifications: next });
            }}
            aria-label="Toggle notifications"
          >
            <span style={{ ...styles.toggleKnob, transform: notifications ? "translateX(18px)" : "translateX(0)" }} />
          </button>
        </div>
      </div>
      <div style={styles.hint}>Get notified when this Bot finishes or needs input</div>

      <button style={styles.shareCard}>⬆ Share as Template</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100dvh",
    overflowY: "auto",
    background: "#0b0d10",
    color: "#e8e8ec",
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 16px 32px",
  },
  header: { display: "flex", alignItems: "center", padding: "14px 0", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "#1a1d22",
    border: "1px solid #262a30",
    color: "#e8e8ec",
    fontSize: 16,
    cursor: "pointer",
  },
  hero: { display: "flex", justifyContent: "center", padding: "10px 0 20px" },
  card: {
    background: "#17191d",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  nameInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "#e8e8ec",
    fontSize: 19,
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
  },
  divider: { height: 1, background: "#26292f", margin: "10px 0" },
  titleInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "#6a707a",
    fontSize: 14,
    textAlign: "center",
    outline: "none",
  },
  sectionLabel: { fontSize: 13, color: "#6a707a", padding: "2px 4px 8px" },
  shapeGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 },
  shapeBtn: {
    aspectRatio: "1",
    borderRadius: 12,
    background: "#1e2126",
    border: "1px solid transparent",
    color: "#e8e8ec",
    fontSize: 20,
    cursor: "pointer",
  },
  shapeBtnActive: { border: "1px solid #6a91ff", background: "#20242c" },
  colorGrid: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "2px solid transparent",
    cursor: "pointer",
  },
  colorSwatchActive: { border: "2px solid #e8e8ec" },
  resetLink: { background: "none", border: "none", color: "#4f8cff", fontSize: 14, cursor: "pointer", padding: 0 },
  hint: { fontSize: 12.5, color: "#5c626c", padding: "0 4px 16px" },
  rowCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    background: "#17191d",
    border: "none",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    color: "#e8e8ec",
    fontSize: 15,
    cursor: "pointer",
    textAlign: "left",
  },
  rowIcon: { fontSize: 16 },
  rowLabel: { flex: 1, fontWeight: 500 },
  chevron: { color: "#6a707a" },
  instructionsArea: {
    width: "100%",
    background: "#101215",
    border: "1px solid #23262c",
    borderRadius: 10,
    color: "#e8e8ec",
    fontSize: 13.5,
    padding: 10,
    resize: "vertical",
    outline: "none",
  },
  noRoutines: { fontSize: 13.5, color: "#5c626c", padding: "4px 2px 10px" },
  routineRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #21242a",
    padding: "10px 2px",
    cursor: "pointer",
    textAlign: "left",
  },
  routineDot: { width: 9, height: 9, borderRadius: 999, flexShrink: 0 },
  routineText: { flex: 1, minWidth: 0 },
  routineLabel: { fontSize: 14.5, color: "#e8e8ec", fontWeight: 500 },
  routineSchedule: { fontSize: 12.5, color: "#7b818b", marginTop: 2 },
  addRoutine: {
    background: "none",
    border: "none",
    color: "#4f8cff",
    fontSize: 14.5,
    padding: "10px 2px 2px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  notifRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 999,
    border: "none",
    position: "relative",
    cursor: "pointer",
    padding: 3,
  },
  toggleKnob: {
    display: "block",
    width: 20,
    height: 20,
    borderRadius: 999,
    background: "white",
    transition: "transform 0.15s ease",
  },
  shareCard: {
    width: "100%",
    background: "#17191d",
    border: "none",
    borderRadius: 14,
    padding: 14,
    color: "#4f8cff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};
