"use client";

import { AgentDef, AgentShape } from "./agents";

const GLYPHS: Record<AgentDef["glyph"], string> = {
  ghost: "👻",
  cloud: "☁️",
  drop: "💧",
  bolt: "⚡",
  spark: "✦",
};

function borderRadiusFor(shape: AgentShape | undefined): string {
  switch (shape) {
    case "squircle":
      return "30%";
    case "pill":
      return "999px";
    case "triangle":
    case "hex":
      return "0";
    case "circle":
    case "circle-outline":
    default:
      return "999px";
  }
}

function clipPathFor(shape: AgentShape | undefined): string | undefined {
  switch (shape) {
    case "triangle":
      return "polygon(50% 6%, 95% 94%, 5% 94%)";
    case "hex":
      return "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";
    default:
      return undefined;
  }
}

export default function AgentAvatar({
  agent,
  size = 44,
}: {
  agent: AgentDef;
  size?: number;
}) {
  const shape = agent.shape ?? "circle";
  const isOutline = shape === "circle-outline";
  const isSoftBlob = shape === "cloud" || shape === "drop";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: isSoftBlob ? "44% 44% 50% 50%" : borderRadiusFor(shape),
        clipPath: clipPathFor(shape),
        background: isOutline ? "transparent" : agent.color,
        border: isOutline ? `2.5px solid ${agent.color}` : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {!isOutline && (
        <span
          style={{
            filter: agent.glyph === "ghost" ? "grayscale(1) brightness(0)" : undefined,
            opacity: agent.glyph === "ghost" ? 0.85 : 1,
          }}
        >
          {GLYPHS[agent.glyph]}
        </span>
      )}
    </div>
  );
}
