"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { bots, botsByRoomId, chatHref, type CampusBot } from "../lib/bots";
import {
  boardsForRoom,
  formatLastRun,
  formatStatusTime,
  hasPostedBoard,
  itemsForRoom,
  lastRunFailed,
  stateTint,
  useCampusStatus,
  usePostedCount,
  waitingMessage,
  type BotBoard,
  type StatusItem,
} from "../lib/status";
import { useCampusFeed } from "../lib/feed";
import { useGrokTheme } from "../lib/theme";

export { chatHref, usePostedCount };

export function ChatButton(props: { bot: CampusBot; large?: boolean }) {
  const th = useGrokTheme();
  const href = chatHref(props.bot.id);
  return (
    <div>
      <a
        href={href}
        style={{
          display: "inline-block",
          font: "inherit",
          fontSize: props.large ? 16 : 13,
          fontWeight: 700,
          padding: props.large ? "10px 18px" : "7px 14px",
          borderRadius: 999,
          border: "none",
          background: th.fill.accent,
          color: th.text.onColor,
          cursor: "pointer",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Chat with {props.bot.name}
      </a>
      <div style={{ marginTop: 5, fontSize: 11.5, color: th.text.tertiary }}>Opens in the Grok Bot app</div>
    </div>
  );
}

export function OwnerBotCard(props: { roomId: string }) {
  const th = useGrokTheme();
  const bot = botsByRoomId[props.roomId];
  if (!bot) return null;
  return (
    <div style={{ background: th.bg.base, border: `1px solid ${th.border.subtle}`, borderRadius: 14, padding: "12px 12px 10px", marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: th.text.tertiary, marginBottom: 6 }}>OWNER BOT</div>
      <b style={{ fontSize: 15, display: "block" }}>{bot.name}</b>
      {bot.role ? <div style={{ fontSize: 12.5, color: th.text.secondary, margin: "2px 0 10px" }}>{bot.role}</div> : <div style={{ height: 8 }} />}
      <ChatButton bot={bot} />
    </div>
  );
}

export function HqBotRoster() {
  const th = useGrokTheme();
  return (
    <div style={{ background: th.bg.base, border: `1px solid ${th.border.subtle}`, borderRadius: 14, padding: "12px 12px 6px", marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: th.text.tertiary, marginBottom: 8 }}>ALL BOTS</div>
      {bots.map((bot) => (
        <div key={bot.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${th.border.weak}` }}>
          <div style={{ minWidth: 0, paddingTop: 2 }}>
            <b style={{ fontSize: 14 }}>{bot.name}</b>
            <div style={{ fontSize: 12, color: th.text.secondary, lineHeight: "16px" }}>
              {[bot.role, bot.roomName].filter(Boolean).join(" · ") || "Listed in Ghost HQ"}
            </div>
          </div>
          <div style={{ flex: "none" }}>
            <ChatButton bot={bot} />
          </div>
        </div>
      ))}
    </div>
  );
}

function stateColor(state: string, th: any) {
  const s = state.toLowerCase();
  if (s === "in progress" || s === "enabled") return th.text.accent;
  if (s.includes("blocked") || s.includes("failed")) return th.text.danger;
  if (s.includes("paused") || s.includes("waiting")) return th.text.warning;
  return th.text.tertiary;
}

function StatusRows(props: { items: StatusItem[]; compact?: boolean; onOpenRoom?: (bot: string) => void }) {
  const th = useGrokTheme();
  return (
    <div>
      {props.items.map((item) => {
        const posted = item.state !== "no update" && item.task !== waitingMessage(item.bot) && item.task !== "Nothing running right now";
        const when = formatStatusTime(item.updatedAt);
        return (
          <div key={item.bot} style={{ padding: props.compact ? "7px 0" : "9px 0", borderBottom: `1px solid ${th.border.weak}` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => props.onOpenRoom?.(item.bot)}
                disabled={!props.onOpenRoom}
                style={{ font: "inherit", fontWeight: 800, fontSize: 13.5, background: "none", border: "none", padding: 0, color: th.text.primary, cursor: props.onOpenRoom ? "pointer" : "default", textAlign: "start" }}
              >
                {item.bot}
              </button>
              <span style={{ fontSize: 11, fontWeight: 800, color: stateColor(item.state, th), textTransform: "uppercase", letterSpacing: 0.3 }}>{item.state}</span>
              {when ? <span style={{ marginInlineStart: "auto", fontSize: 11, color: th.text.tertiary, whiteSpace: "nowrap" }}>{when}</span> : null}
            </div>
            <div style={{ fontSize: 13, lineHeight: "18px", color: posted ? th.text.secondary : th.text.tertiary, marginTop: 3 }}>{item.task}</div>
          </div>
        );
      })}
    </div>
  );
}

export function BotBoardView(props: { board: BotBoard }) {
  const th = useGrokTheme();
  const { board } = props;
  const posted = hasPostedBoard(board);
  const sec: CSSProperties = { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: th.text.tertiary, margin: "10px 0 6px" };
  const empty: CSSProperties = { fontSize: 13, color: th.text.tertiary, fontStyle: "italic" };
  return (
    <div style={{ background: "#f4f1e6", color: "#1a1a1a", border: "2px solid #d4cbb0", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <b style={{ fontSize: 16 }}>{board.bot}</b>
        <span style={{ fontSize: 11.5, color: "#666" }}>Room board</span>
      </div>
      {!posted ? (
        <div style={{ fontSize: 14, color: "#555", padding: "8px 0 4px" }}>{waitingMessage(board.bot)}</div>
      ) : (
        <>
          <div style={sec}>WORKING ON NOW</div>
          {board.workingOn.length ? board.workingOn.map((w, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, lineHeight: "18px" }}>{w.task}</div>
              <div style={{ fontSize: 11.5, color: "#555" }}><b style={{ textTransform: "uppercase" }}>{w.state}</b>{w.updatedAt ? ` · ${formatStatusTime(w.updatedAt)}` : ""}</div>
            </div>
          )) : <div style={empty}>Nothing running right now</div>}
          <div style={sec}>ROUTINES</div>
          {board.routines.length ? board.routines.map((r, i) => (
            <div key={i} style={{ marginBottom: 7, paddingBottom: 6, borderBottom: "1px solid #e4dcc8" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#444" }}>{r.schedule}</div>
              <div style={{ fontSize: 11.5, color: "#555" }}>
                <b style={{ textTransform: "uppercase", color: stateTint(r.state) }}>{r.state}</b>
                {" · last run "}
                <span style={{ color: lastRunFailed(r.lastRun) ? "#c62828" : undefined, fontWeight: lastRunFailed(r.lastRun) ? 700 : 400 }}>{formatLastRun(r.lastRun)}</span>
              </div>
            </div>
          )) : <div style={empty}>No routines</div>}
          <div style={sec}>OPEN TASKS</div>
          {board.openTasks.length ? board.openTasks.map((t, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, lineHeight: "18px" }}>{t.task}</div>
              <div style={{ fontSize: 11.5, color: "#555" }}><b style={{ textTransform: "uppercase" }}>{t.state}</b>{t.updatedAt ? ` · ${formatStatusTime(t.updatedAt)}` : ""}</div>
            </div>
          )) : <div style={empty}>No open tasks</div>}
        </>
      )}
    </div>
  );
}

export function WorkingOnBoard(props: { roomId: string; roomOwner?: string }) {
  const th = useGrokTheme();
  const file = useCampusStatus();
  const boards = boardsForRoom(file, props.roomId, props.roomOwner);
  return (
    <div>
      {boards.map((b) => <BotBoardView key={b.id || b.bot} board={b} />)}
      {!boards.length && (
        <div style={{ background: th.bg.base, border: `1px solid ${th.border.subtle}`, borderRadius: 14, padding: "12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: th.text.tertiary, marginBottom: 4 }}>WHAT WE'RE WORKING ON</div>
          <div style={{ fontSize: 13, color: th.text.tertiary }}>No board posted yet.</div>
        </div>
      )}
    </div>
  );
}

export function WorkingOnHud(props: { onOpenBot: (bot: string) => void }) {
  const file = useCampusStatus();
  return (
    <div>
      <StatusRows items={itemsForRoom(file, "all")} compact onOpenRoom={props.onOpenBot} />
    </div>
  );
}

export function roomIdForBot(botName: string): string | null {
  const bot = bots.find((b) => b.name === botName || botName.startsWith(b.name) || b.id === botName);
  if (!bot) return null;
  return bot.roomId || "hq";
}

export function CampusFeedPanel(props: { onReplay?: () => void; compact?: boolean }) {
  const th = useGrokTheme();
  const file = useCampusFeed();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: th.text.tertiary }}>CAMPUS FEED</div>
        <button
          type="button"
          onClick={() => props.onReplay?.()}
          style={{
            marginInlineStart: "auto",
            font: "inherit",
            fontSize: 12.5,
            fontWeight: 700,
            padding: "5px 12px",
            borderRadius: 999,
            border: "none",
            background: th.fill.accent,
            color: th.text.onColor,
            cursor: "pointer",
          }}
        >
          Replay
        </button>
      </div>
      {file.entries.length === 0 ? (
        <div style={{ fontSize: 13, color: th.text.tertiary, padding: "8px 0" }}>No campus messages posted yet.</div>
      ) : (
        file.entries.map((e, i) => (
          <div
            key={i}
            style={{
              padding: props.compact ? "7px 0" : "9px 0",
              borderTop: `1px solid ${th.border.weak}`,
            }}
          >
            <div style={{ fontSize: 11.5, color: th.text.tertiary }}>
              <b style={{ color: th.text.accent }}>{e.from}</b>
              {" → "}
              {e.to}
              {" · "}
              {e.kind}
              {" · "}
              {e.at}
            </div>
            <div style={{ fontSize: props.compact ? 13 : 14, lineHeight: "19px", marginTop: 2 }}>{e.text}</div>
          </div>
        ))
      )}
    </div>
  );
}

export function CampusFeedTicker(props: {
  open: boolean;
  collapsed: boolean;
  onToggleOpen: () => void;
  onToggleCollapsed: () => void;
  onReplay: () => void;
  phone?: boolean;
}) {
  const th = useGrokTheme();
  const file = useCampusFeed();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!file.entries.length) return;
    const id = window.setInterval(() => setI((n) => n + 1), 4500);
    return () => window.clearInterval(id);
  }, [file.entries.length]);
  const entry = file.entries.length ? file.entries[i % file.entries.length] : null;
  const pill: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: `color-mix(in srgb, ${th.bg.elevated} 92%, transparent)`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${th.border.default}`,
    boxShadow: "0 8px 28px rgba(0,0,0,.28)",
    borderRadius: 22,
    padding: props.collapsed ? "6px 8px 6px 14px" : "6px 6px 6px 14px",
    pointerEvents: "auto",
    width: props.collapsed ? "auto" : "min(740px, 100%)",
    maxWidth: "min(740px, 100%)",
    boxSizing: "border-box",
  };
  const btn: CSSProperties = {
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${th.border.default}`,
    background: th.bg.subtle,
    color: th.text.primary,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  return (
    <div style={pill}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: th.text.accent, flex: "none" }}>
        Campus Feed
      </span>
      {!props.collapsed && entry && (
        <div style={{ minWidth: 0, flex: "1 1 0", fontSize: props.phone ? 13 : 14, lineHeight: "18px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as CSSProperties}>
          <b>{entry.from}</b>
          <span style={{ color: th.text.tertiary }}> → {entry.to} · {entry.at}</span>
          {" · "}
          {entry.text}
        </div>
      )}
      <button type="button" onClick={props.onReplay} style={{ ...btn, background: th.fill.accent, color: th.text.onColor, border: "none" }}>
        Replay
      </button>
      <button type="button" onClick={props.onToggleOpen} style={{ ...btn, background: props.open ? th.fill.accentSubtle : th.bg.subtle }}>
        {props.open ? "Hide list" : "Full feed"}
      </button>
      <button type="button" onClick={props.onToggleCollapsed} aria-label={props.collapsed ? "Expand campus feed" : "Collapse campus feed"} style={{ ...btn, padding: "6px 10px" }}>
        {props.collapsed ? "▸" : "▾"}
      </button>
    </div>
  );
}
