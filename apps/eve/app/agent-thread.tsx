"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AgentAvatar from "./agent-avatar";
import { AgentDef, agentSystemPrompt } from "./agents";

type Role = "user" | "assistant";
interface Msg {
  id: string;
  role: Role;
  content: string;
}

export interface ThreadPreview {
  text: string;
  timeLabel: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function storageKey(agentId: string) {
  return `hermes-thread-${agentId}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { weekday: "short" });
}

/**
 * Per-agent thread screen: back button + persona name in the header (like
 * GrokBot's per-bot chat), streaming replies from the shared Hermes bridge.
 * Each agent's history persists to localStorage so switching agents and
 * coming back preserves context, matching GrokBot's "separate threads" feel.
 */
export default function AgentThread({
  agent,
  onBack,
  onPreviewChange,
}: {
  agent: AgentDef;
  onBack: () => void;
  onPreviewChange: (preview: ThreadPreview) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    try {
      const raw = localStorage.getItem(storageKey(agent.id));
      if (raw) setMessages(JSON.parse(raw));
      else setMessages([]);
    } catch {
      setMessages([]);
    }
    loadedRef.current = true;
  }, [agent.id]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(storageKey(agent.id), JSON.stringify(messages));
    } catch {
      // storage full/unavailable — non-fatal
    }
    const last = messages[messages.length - 1];
    if (last) {
      onPreviewChange({ text: last.content.slice(0, 80) || "…", timeLabel: formatTime(Date.now()) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, agent.id]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");

    const userMsg: Msg = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setBusy(true);

    const system = agentSystemPrompt(agent);
    const history = [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error ? `${detail.error}${detail.detail ? `: ${detail.detail}` : ""}` : `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta: string | undefined = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
              );
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, busy, messages, agent]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={onBack} aria-label="Back">‹</button>
        <AgentAvatar agent={agent} size={30} />
        <span style={styles.title}>{agent.name}</span>
        <div style={{ flex: 1 }} />
        <button style={styles.iconBtn} aria-label="Devices">🖥</button>
      </header>

      <main style={styles.thread}>
        {messages.length === 0 && (
          <div style={styles.empty}>Ask {agent.name} anything — runs on the real Hermes bridge.</div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}>
            <div style={styles.bubbleContent}>{m.content || (busy && m.role === "assistant" ? "…" : "")}</div>
          </div>
        ))}
        {error && <div style={styles.error}>⚠ {error}</div>}
      </main>

      <form
        style={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button type="button" style={styles.plusBtn} aria-label="Attach">＋</button>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${agent.name}`}
          disabled={busy}
        />
        <button type="submit" style={styles.micBtn} disabled={busy || !input.trim()} aria-label="Send">
          {busy ? "…" : "🎙"}
        </button>
      </form>
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
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    borderBottom: "1px solid #1c1f24",
  },
  backBtn: {
    background: "#1a1d22",
    border: "1px solid #262a30",
    color: "#e8e8ec",
    width: 34,
    height: 34,
    borderRadius: 999,
    fontSize: 18,
    cursor: "pointer",
  },
  title: { fontWeight: 700, fontSize: 15.5 },
  iconBtn: {
    background: "#1a1d22",
    border: "1px solid #262a30",
    color: "#e8e8ec",
    width: 34,
    height: 34,
    borderRadius: 999,
    fontSize: 14,
    cursor: "pointer",
  },
  thread: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  empty: { color: "#5c626c", fontSize: 14, marginTop: 40, textAlign: "center" },
  bubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    background: "#2a5bd7",
    borderRadius: "16px 16px 4px 16px",
    padding: "10px 14px",
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    background: "#1a1d22",
    borderRadius: "16px 16px 16px 4px",
    padding: "10px 14px",
  },
  bubbleContent: { fontSize: 14.5, whiteSpace: "pre-wrap", lineHeight: 1.45 },
  error: { color: "#ff6b6b", fontSize: 13, padding: "6px 4px" },
  composer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #1c1f24",
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "#1a1d22",
    border: "1px solid #262a30",
    color: "#e8e8ec",
    fontSize: 16,
    cursor: "pointer",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "#15171b",
    border: "1px solid #262a30",
    borderRadius: 20,
    padding: "10px 14px",
    color: "#e8e8ec",
    fontSize: 14,
    outline: "none",
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "#1a1d22",
    border: "1px solid #262a30",
    color: "#e8e8ec",
    fontSize: 15,
    cursor: "pointer",
    flexShrink: 0,
  },
};
