"use client";

import { AgentDef } from "./agents";

const GLYPHS: Record<AgentDef["glyph"], string> = {
  ghost: "👻",
  cloud: "☁️",
  drop: "💧",
  bolt: "⚡",
  spark: "✦",
};

export default function AgentAvatar({
  agent,
  size = 44,
}: {
  agent: AgentDef;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: agent.glyph === "cloud" ? "44% 44% 50% 50%" : 999,
        background: agent.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <span style={{ filter: agent.glyph === "ghost" ? "grayscale(1) brightness(0)" : undefined, opacity: agent.glyph === "ghost" ? 0.85 : 1 }}>
        {GLYPHS[agent.glyph]}
      </span>
    </div>
  );
}
