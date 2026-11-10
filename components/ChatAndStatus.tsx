"use client";
import { bots, botsByRoomId, chatHref, type CampusBot } from "../lib/bots";
import { formatStatusTime, isPosted, itemsForRoom, useCampusStatus, type StatusItem } from "../lib/status";
import { useGrokTheme } from "../lib/theme";

export { chatHref };

function ChatButton(props: { bot: CampusBot }) {
  const th = useGrokTheme();
  const href = chatHref(props.bot.id);
  return (
    <div>
      <a
        href={href}
        style={{
          display: "inline-block",
          font: "inherit",
          fontSize: 13,
          fontWeight: 700,
          padding: "7px 14px",
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
  if (s === "in progress") return th.text.accent;
  if (s === "blocked") return th.text.danger;
  return th.text.tertiary;
}

function StatusRows(props: { items: StatusItem[]; compact?: boolean; onOpenRoom?: (bot: string) => void }) {
  const th = useGrokTheme();
  return (
    <div>
      {props.items.map((item) => {
        const posted = isPosted(item);
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

export function WorkingOnBoard(props: { roomId: string; roomOwner?: string }) {
  const th = useGrokTheme();
  const file = useCampusStatus();
  const items = itemsForRoom(file, props.roomId, props.roomOwner);
  return (
    <div style={{ background: th.bg.base, border: `1px solid ${th.border.subtle}`, borderRadius: 14, padding: "12px", marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: th.text.tertiary, marginBottom: 4 }}>WHAT WE'RE WORKING ON</div>
      <StatusRows items={items} />
    </div>
  );
}

export function WorkingOnHud(props: { onOpenBot: (bot: string) => void }) {
  const file = useCampusStatus();
  return (
    <div>
      <StatusRows items={file.items} compact onOpenRoom={props.onOpenBot} />
    </div>
  );
}

export function usePostedCount() {
  const file = useCampusStatus();
  return file.items.filter(isPosted).length;
}

export function roomIdForBot(botName: string): string | null {
  const bot = bots.find((b) => b.name === botName);
  if (!bot) return null;
  return bot.roomId || "hq";
}
