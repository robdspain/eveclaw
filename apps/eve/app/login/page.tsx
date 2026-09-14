"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        setError("Wrong code.");
        setBusy(false);
        return;
      }
      router.replace(params.get("next") || "/");
      router.refresh();
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={styles.card}>
      <div style={styles.logo}>☁️</div>
      <div style={styles.title}>Hermes Command Center</div>
      <div style={styles.subtitle}>Enter access code</div>
      <input
        style={styles.input}
        type="password"
        inputMode="numeric"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="••••"
      />
      {error && <div style={styles.error}>{error}</div>}
      <button style={styles.button} type="submit" disabled={busy || !code}>
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b0d10",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: 300,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: 24,
    background: "#17191d",
    borderRadius: 18,
  },
  logo: { fontSize: 40, marginBottom: 4 },
  title: { color: "#e8e8ec", fontSize: 17, fontWeight: 700 },
  subtitle: { color: "#8a8f98", fontSize: 13, marginBottom: 10 },
  input: {
    width: "100%",
    background: "#101215",
    border: "1px solid #262a30",
    borderRadius: 10,
    color: "#e8e8ec",
    fontSize: 20,
    letterSpacing: 6,
    textAlign: "center",
    padding: "12px 10px",
    outline: "none",
    boxSizing: "border-box",
  },
  error: { color: "#e0393e", fontSize: 13 },
  button: {
    width: "100%",
    marginTop: 6,
    padding: "12px 0",
    background: "#e8933a",
    border: "none",
    borderRadius: 10,
    color: "#0b0d10",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
};
