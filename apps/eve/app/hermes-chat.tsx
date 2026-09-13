"use client";

import { useCallback, useRef, useState } from "react";

type Role = "user" | "assistant";
interface Msg {
  id: string;
  role: Role;
  content: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function HermesChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");

    const userMsg: Msg = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setBusy(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
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
  }, [input, busy, messages]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.dot} />
        <span style={styles.title}>Hermes</span>
        <span style={styles.subtitle}>running on your subscriptions, not API credits</span>
      </header>

      <main style={styles.thread}>
        {messages.length === 0 && (
          <div style={styles.empty}>Say something to start a real Hermes run on the Mac mini.</div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}>
            <div style={styles.bubbleRole}>{m.role === "user" ? "You" : "Hermes"}</div>
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
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Hermes…"
          disabled={busy}
        />
        <button type="submit" style={styles.sendBtn} disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "#0b0d10",
    color: "#e8e8ec",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "14px 18px",
    borderBottom: "1px solid #1c1f24",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#3ddc84",
    display: "inline-block",
  },
  title: { fontWeight: 700, fontSize: 16 },
  subtitle: { fontSize: 12, color: "#8a8f98" },
  thread: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  empty: { color: "#5c626c", fontSize: 14, marginTop: 40, textAlign: "center" },
  bubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    background: "#2a5bd7",
    borderRadius: "14px 14px 2px 14px",
    padding: "8px 12px",
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    maxWidth: "80%",
    background: "#1a1d22",
    borderRadius: "14px 14px 14px 2px",
    padding: "8px 12px",
  },
  bubbleRole: { fontSize: 11, opacity: 0.6, marginBottom: 2 },
  bubbleContent: { fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.4 },
  error: { color: "#ff6b6b", fontSize: 13, padding: "6px 4px" },
  composer: {
    display: "flex",
    gap: 8,
    padding: 14,
    borderTop: "1px solid #1c1f24",
  },
  input: {
    flex: 1,
    background: "#15171b",
    border: "1px solid #262a30",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#e8e8ec",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    background: "#2a5bd7",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
