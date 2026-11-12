"use client";
// Bot chat: the live conversation between bots across the campus, and a box to give a team an instruction.
// In the demo the conversation is simulated in the browser. In the real app the instruction goes to the main bot
// through the same signed webhook as every other button, and the feed shows the CHAT list the bot publishes.
import { useEffect, useRef, useState } from "react";
import { chatAt, chatSoFar, TALK_MS, type ChatMsg } from "../lib/chat";

type TeamLite = { id: string; name: string; status: string; lead: { name: string } };
const IDEAS = ["Give me a status update on everything in progress", "Check each other's work and fix anything that is off", "Ask the other teams if they need anything from you"];

export default function BotChat(props: {
  teams: TeamLite[]; chat: ChatMsg[]; colorOf: (teamId: string) => string; team: string | null; phone: boolean; demo: boolean;
  th: any; onInstruct: (teamId: string, text: string) => void; onClose: () => void; onOpenTeam: (teamId: string) => void;
}) {
  const { th, teams, phone } = props;
  const live = teams.filter((t) => t.status !== "frozen");
  const [team, setTeam] = useState<string>(props.team && live.some((t) => t.id === props.team) ? props.team : live[0] ? live[0].id : "");
  const [text, setText] = useState("");
  const [only, setOnly] = useState(false);
  useEffect(() => { if (props.team && live.some((t) => t.id === props.team)) setTeam(props.team); }, [props.team]);
  const now = Date.now();
  const all = chatSoFar(props.chat, now);
  const list = (only ? all.filter((m) => m.team === team || m.toTeam === team) : all).slice(-70);
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastId = list.length ? list[list.length - 1].id : "";
  useEffect(() => { const el = box.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [lastId, only]);
  const nameOf = (id?: string) => (teams.find((t) => t.id === id) || { name: id || "" }).name;
  const send = () => { const v = text.trim(); if (!v || !team) return; props.onInstruct(team, v); setText(""); stick.current = true; };
  const hhmm = (ms: number) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`; };
  const chip: any = { font: "inherit", fontSize: 12, padding: "4px 9px", borderRadius: 999, border: `1px solid ${th.border.default}`, background: th.bg.subtle, color: th.text.secondary, cursor: "pointer", whiteSpace: "nowrap" };
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} dir="ltr"
      style={{ position: "absolute", zIndex: 9, ...(phone ? { left: 8, right: 8, bottom: 8, top: 64 } : { right: 14, bottom: 78, width: 400, height: "min(560px, calc(100% - 150px))" }), display: "flex", flexDirection: "column", borderRadius: 18, background: th.bg.elevated, border: `1px solid ${th.border.strong}`, boxShadow: "0 18px 48px rgba(0,0,0,.55)", color: th.text.primary, overflow: "hidden" } as any}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px 9px", borderBottom: `1px solid ${th.border.weak}` }}>
        <span style={{ fontSize: 18 }}>💬</span>
        <b style={{ fontSize: 15.5 }}>Bot chat</b>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: th.text.danger }}><span style={{ width: 7, height: 7, borderRadius: 4, background: th.text.danger }} />LIVE</span>
        <label style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: th.text.secondary, cursor: "pointer" }}>
          <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> This team only
        </label>
        <button onClick={props.onClose} aria-label="Close bot chat" style={{ font: "inherit", width: 28, height: 26, borderRadius: 8, border: "none", background: th.fill.secondary, color: th.text.primary, cursor: "pointer" }}>✕</button>
      </div>
      <div ref={box} onScroll={(e: any) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
        style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
        {!list.length && <div style={{ margin: "auto", textAlign: "center", color: th.text.tertiary, fontSize: 13.5, lineHeight: "20px" }}>No bot messages yet.<br />Give a team an instruction below and watch them work it out.</div>}
        {list.map((m) => {
          const you = m.from === "You"; const c = props.colorOf(m.team); const talking = now - chatAt(m) < TALK_MS;
          return (
            <div key={m.id} style={{ alignSelf: you ? "flex-end" : "flex-start", maxWidth: "92%", padding: "7px 10px", borderRadius: 13, background: you ? th.fill.accentSubtle : th.bg.base, border: `1px solid ${talking ? c : th.border.weak}`, boxShadow: talking ? `0 0 0 2px ${c}33` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: th.text.tertiary, marginBottom: 2, flexWrap: "wrap" }}>
                <button onClick={() => props.onOpenTeam(m.team)} title="Open this room" style={{ font: "inherit", fontSize: 11.5, fontWeight: 700, color: c, background: "none", border: "none", padding: 0, cursor: "pointer" }}>{nameOf(m.team)}</button>
                <b style={{ color: th.text.primary }}>{you ? "You" : m.from}</b>
                {(m.to || m.toTeam) && <span>→ {m.to || ""}{m.toTeam && m.toTeam !== m.team ? ` (${nameOf(m.toTeam)})` : ""}</span>}
                <span style={{ marginInlineStart: "auto" }}>{hhmm(chatAt(m))}</span>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: "18px" }}>{m.text}</div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: `1px solid ${th.border.weak}`, padding: "9px 12px 11px", display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 1 }}>
          {IDEAS.map((s) => <button key={s} onClick={() => setText(s)} style={chip}>{s}</button>)}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Team to instruct" style={{ font: "inherit", fontSize: 13, padding: "8px 6px", borderRadius: 10, border: `1px solid ${th.border.default}`, background: th.bg.base, color: th.text.primary, maxWidth: 130 }}>
            {live.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") send(); }} placeholder="Tell this team what to do…" maxLength={400} aria-label="Instruction"
            style={{ flex: "1 1 auto", minWidth: 0, font: "inherit", fontSize: 13.5, padding: "8px 10px", borderRadius: 10, border: `1px solid ${th.border.default}`, background: th.bg.base, color: th.text.primary }} />
          <button onClick={send} disabled={!text.trim()} style={{ font: "inherit", fontSize: 13.5, fontWeight: 700, padding: "8px 14px", borderRadius: 10, border: "none", background: text.trim() ? th.fill.accent : th.fill.secondary, color: text.trim() ? th.text.onColor : th.text.tertiary, cursor: text.trim() ? "pointer" : "default" }}>Send</button>
        </div>
        <div style={{ fontSize: 11.5, color: th.text.tertiary, lineHeight: "15px" }}>
          {props.demo ? "Demo: the conversation is simulated in your browser. Nothing is sent anywhere."
            : "Your instruction goes to your main bot, which passes it to the team lead. The feed shows the bot messages your main bot publishes."}
        </div>
      </div>
    </div>
  );
}
