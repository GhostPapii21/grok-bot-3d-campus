"use client";
import { useEffect, useState } from "react";
export default function SetupForm() {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [header, setHeader] = useState("Authorization");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/setup", { cache: "no-store" }).then((r) => r.json()).then((j) => setConfigured(!!j.configured)).catch(() => {}); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setState("saving"); setMsg("");
    try {
      const r = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, key, header }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setState("error"); setMsg(j.error || `Error ${r.status}`); return; }
      setKey(""); setUrl(""); setState("done"); setConfigured(true);
    } catch { setState("error"); setMsg("Could not reach the server"); }
  }
  const box: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d0d4dc", fontSize: 14, boxSizing: "border-box" };
  return (
    <main style={{ maxWidth: 520, margin: "48px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", color: "#1b1f27" }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Connect the page to your bot</h1>
      <p style={{ color: "#5b6270", fontSize: 14, lineHeight: 1.5 }}>
        Paste the webhook URL and the sender key from your bot&apos;s &quot;Control center commands&quot; routine. They are stored privately
        for this app only and are never shown again, not even to the bot. {configured ? "Already connected: saving again replaces the old values." : ""}
      </p>
      <form onSubmit={save} style={{ display: "grid", gap: 12, marginTop: 18 }}>
        <label style={{ fontSize: 13 }}>Webhook URL<input style={box} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" autoComplete="off" required /></label>
        <label style={{ fontSize: 13 }}>Sender key<input style={box} type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" required /></label>
        <details><summary style={{ fontSize: 12, color: "#5b6270", cursor: "pointer" }}>Advanced</summary>
          <label style={{ fontSize: 13 }}>Header for the key (default Authorization: Bearer)<input style={box} value={header} onChange={(e) => setHeader(e.target.value)} /></label>
        </details>
        <button disabled={state === "saving"} style={{ padding: "11px 14px", borderRadius: 10, border: 0, background: "#1b1f27", color: "#fff", fontSize: 15, cursor: "pointer" }}>
          {state === "saving" ? "Saving…" : "Save"}
        </button>
      </form>
      {state === "done" && <p style={{ color: "#137a3a", marginTop: 14 }}>Connected ✓ <a href="/">Open the control center</a></p>}
      {state === "error" && <p style={{ color: "#b42318", marginTop: 14 }}>{msg}</p>}
    </main>
  );
}
