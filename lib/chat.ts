// Bot-to-bot chat: who said what to whom, and when. The campus plays each message for a few seconds:
// the speaker walks over to the listener (or a courier runs to the other team's room) with a speech bubble.
export type ChatMsg = {
  id: string;
  at: number | string;      // epoch ms, or an ISO time
  team: string;             // team id of the speaker
  from: string;             // bot name, or "You" for the owner's instruction
  to?: string;              // bot name in the same team (or in toTeam)
  toTeam?: string;          // set when the message goes to another team's room
  text: string;
};
export const TALK_MS = 6500;   // how long one message is acted out in the scene

export function chatAt(m: ChatMsg): number {
  if (typeof m.at === "number") return m.at;
  const v = Date.parse(String(m.at));
  return isNaN(v) ? 0 : v;
}

/** Messages already said, newest last. */
export function chatSoFar(chat: ChatMsg[] | undefined, now: number): ChatMsg[] {
  return (chat || []).filter((m) => chatAt(m) > 0 && chatAt(m) <= now).sort((a, b) => chatAt(a) - chatAt(b));
}

/** Messages being acted out right now, with k = progress 0..1. */
export function activeTalks(chat: ChatMsg[] | undefined, now: number): { m: ChatMsg; k: number }[] {
  const out: { m: ChatMsg; k: number }[] = [];
  for (const m of chat || []) { const t0 = chatAt(m); if (t0 > 0 && now >= t0 && now < t0 + TALK_MS) out.push({ m, k: (now - t0) / TALK_MS }); }
  return out;
}

/** Walk-out, talk, walk-back: 0..1 of the way to the listener for a talk at progress k. */
export function walkPhase(k: number): number {
  const e = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  if (k < 0.22) return e(k / 0.22);
  if (k < 0.78) return 1;
  return 1 - e((k - 0.78) / 0.22);
}

export function validChat(v: any): ChatMsg[] {
  if (!Array.isArray(v)) return [];
  return v.filter((m) => m && typeof m.team === "string" && typeof m.from === "string" && typeof m.text === "string" && (typeof m.at === "number" || typeof m.at === "string"))
    .slice(-200).map((m, i) => ({ id: String(m.id || `c${i}`), at: m.at, team: m.team, from: m.from, to: typeof m.to === "string" ? m.to : undefined,
      toTeam: typeof m.toTeam === "string" ? m.toTeam : undefined, text: String(m.text).slice(0, 280) }));
}
