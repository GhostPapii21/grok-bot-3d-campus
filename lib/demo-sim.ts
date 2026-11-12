// Demo only: simulates the real flow in the browser. Nothing is sent anywhere.
// Page commands and ⟳ schedule fake follow-ups ("the team acted") that are replayed on top of the invented data.
// The follow-ups are kept in sessionStorage, so they survive a reload until the tab is closed.
import { demoData } from "./demo-data";
import { TZ } from "./tz";

type Op =
  | { at: number; team: string; k: "act"; text: string }
  | { at: number; team: string; k: "drop"; id: string }
  | { at: number; team: string; k: "task"; text: string; state: "todo" | "doing" | "done"; owner?: string }
  | { at: number; team: string; k: "pend"; id: string; what: string }
  | { at: number; team: string; k: "goal"; d: number }
  | { at: number; team: string; k: "status"; s: string }
  | { at: number; team: string; k: "rt"; id: string; patch: Record<string, any> }
  | { at: number; team: string; k: "rtDel"; id: string }
  | { at: number; team: string; k: "upd" }
  | { at: number; team: string; k: "use"; d: number }
  | { at: number; team: string; k: "chat"; from: string; to?: string; toTeam?: string; text: string };
type State = { start: number; ops: Op[]; round: number };
export type DemoApi = {
  snapshot: () => any;
  send: (items: string[]) => void;
  refreshRound: () => void;
  subscribe: (fn: () => void) => () => void;
};

const KEY = "ccDemoSim.v1";
const pad = (n: number) => String(n).padStart(2, "0");
function parts(ms: number) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as any).formatToParts(new Date(ms));
  const g = (t: string) => Number(f.find((p) => p.type === t)?.value || 0);
  return { d: g("day"), m: g("month"), y: g("year"), hh: g("hour"), mm: g("minute") };
}
const actTime = (ms: number) => { const p = parts(ms); return `${p.d}.${p.m} ${pad(p.hh)}:${pad(p.mm)}`; };
const updTime = (ms: number) => { const p = parts(ms); return `${p.d}.${p.m}.${p.y}, ${pad(p.hh)}:${pad(p.mm)}`; };
const key = (s: string) => { const m = s.match(/(\d+)\.(\d+)(?:\.\d+)?,?\s+(\d+):(\d+)/); return m ? +m[2] * 1e6 + +m[1] * 1e4 + +m[3] * 100 + +m[4] : 0; };
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const short = (what: string) => what
  .replace(/\s*(Approve and send|Approve the refund|Approve|Publish)\?\s*$/i, "")
  .replace(/\?\s*$/, "").replace(/[.\s]+$/, "").trim() || what;
const STOP = ["approve", "publish", "decide", "with", "this", "that", "next", "from", "more"];
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.includes(w));

const PENDING_POOL = [
  "Post a short customer story on the blog this Friday. Approve?",
  "Extend the free trial from 14 to 21 days for this month. Approve?",
  "Send a thank-you email to the 50 beta users?",
  "Move next week's demo to Wednesday at 11:00?",
  "Publish the updated pricing page?",
  "Add a weekly summary for the team every Friday. Approve?",
];
const CHATTER = [
  "{m} shared a progress update in the team chat",
  "{m} fixed 2 small issues found in review",
  "{m} replied to 4 open questions",
  "{m} uploaded a new draft for the lead to check",
  "{m} cleaned up the task board",
];
const ANSWERS = [
  "it's ready to go; the full version is in the draft and we can change it today if you want.",
  "it stays within this month's budget, and nothing goes out before you approve.",
  "we tried it on a small group first and the results were good. Details are in the room.",
];

// bots talking to each other when nothing else is going on: one short exchange every AMBIENT_MS, derived from the clock
const AMBIENT_MS = 21000;
const AMBIENT: [string, string][] = [
  ["Do you have the latest numbers?", "Yes, just posted them to the board."],
  ["Can you double-check my draft before it goes up?", "Reading it now. Two small notes coming."],
  ["Anything blocking you?", "No, on track. Done within the hour."],
  ["I found something you should see.", "Send it over, I'll look right away."],
  ["Who has the newest version?", "I do. Sharing it with the team now."],
  ["Need a hand with that?", "Yes please, take the second half."],
];
const TOPIC: Record<string, [string, string][]> = {
  nfl: [["How many yards has that defense given up to tight ends?", "Seventy-plus in five of the last eight."], ["Any change on the injury report?", "One starter moved to questionable."]],
  nba: [["Who picks up the minutes if he sits tonight?", "The backup guard: about eight more."], ["Is that a back-to-back for them?", "Yes, second night, on the road."]],
  travel: [["Did the Lisbon fare move?", "Dropped again overnight. Holding it."], ["Is the hotel near the station?", "Six minutes on foot."]],
  money: [["How did this week's income land?", "Up on all three streams."], ["Which idea tested better?", "The sponsorships, by a clear margin."]],
};
function ambientChat(teams: any[], now: number) {
  const act = teams.filter((t: any) => t.status !== "frozen" && t.members.length);
  if (!act.length) return [];
  const out: any[] = [];
  const b1 = Math.floor((now + 95000) / AMBIENT_MS);
  for (let b = b1 - 22; b <= b1; b++) {
    const t = act[hash("a" + b) % act.length];
    const names = [t.lead.name, ...t.members.map((m: any) => m.name)];
    const i = hash("f" + b) % names.length; let j = hash("t" + b) % names.length; if (j === i) j = (j + 1) % names.length;
    const pool = (TOPIC[t.id] || []).concat(AMBIENT); const [q, a] = pool[hash("l" + b) % pool.length];
    const at = b * AMBIENT_MS;
    out.push({ id: `amb${b}q`, at, team: t.id, from: names[i], to: names[j], text: q });
    out.push({ id: `amb${b}a`, at: at + 7000, team: t.id, from: names[j], to: names[i], text: a });
  }
  return out;
}

export function createDemoSim(): DemoApi {
  let st: State = { start: Date.now(), ops: [], round: 0 };
  try { const v = typeof sessionStorage !== "undefined" && sessionStorage.getItem(KEY); if (v) { const j = JSON.parse(v); if (j && Array.isArray(j.ops)) st = j; } } catch (e) {}
  const subs = new Set<() => void>();
  let timer: any = null;
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const notify = () => subs.forEach((f) => f());
  const arm = () => {
    if (timer) clearTimeout(timer);
    const now = Date.now(); const next = st.ops.filter((o) => o.at > now).reduce((a, o) => Math.min(a, o.at), Infinity);
    if (next < Infinity) timer = setTimeout(() => { notify(); arm(); }, Math.max(50, next - now + 30));
  };

  const snapshot = () => {
    const now = Date.now();
    const d: any = JSON.parse(JSON.stringify(demoData(now)));
    let upd = st.start;
    const T = (id: string) => d.TEAMS.find((t: any) => t.id === id);
    for (const o of st.ops.filter((x) => x.at <= now).sort((a, b) => a.at - b.at)) {
      if (o.k === "upd") { upd = o.at; continue; }
      if (o.k === "use") { d.USAGE.weeklyPct = Math.min(99, d.USAGE.weeklyPct + o.d); continue; }
      const t = T(o.team); if (!t) continue;
      if (o.k === "act") t.activity.unshift({ time: actTime(o.at), text: o.text });
      else if (o.k === "drop") t.pending = t.pending.filter((p: any) => p.id !== o.id);
      else if (o.k === "pend") { if (!t.pending.some((p: any) => p.id === o.id)) t.pending.push({ id: o.id, what: o.what, since: actTime(o.at) }); }
      else if (o.k === "task") { const k = t.tasks.find((x: any) => x.text === o.text); if (k) { k.state = o.state; if (o.owner) k.owner = o.owner; } else t.tasks.unshift({ text: o.text, state: o.state, owner: o.owner }); }
      else if (o.k === "goal") { if (t.goal && t.goal.current !== null) t.goal.current = t.goal.current + o.d; }
      else if (o.k === "status") t.status = o.s;
      else if (o.k === "rt") { const r = (t.routines || []).find((x: any) => x.id === o.id); if (r) { Object.assign(r, o.patch); if (o.patch.lastRun === "@") r.lastRun = actTime(o.at); } }
      else if (o.k === "rtDel") t.routines = (t.routines || []).filter((x: any) => x.id !== o.id);
    }
    d.TEAMS.forEach((t: any) => { t.activity = t.activity.map((a: any, i: number) => ({ a, i })).sort((x: any, y: any) => key(y.a.time) - key(x.a.time) || x.i - y.i).map((x: any) => x.a); });
    d.UPDATED = updTime(upd);
    // bot chat: instruction scripts (including lines still to come, so the scene can play them on time) plus ambient chatter
    const scripted = st.ops.filter((o) => o.k === "chat").map((o: any, i) => ({ id: `ins${o.at}-${i}`, at: o.at, team: o.team, from: o.from, to: o.to, toTeam: o.toTeam, text: o.text }));
    d.CHAT = ambientChat(d.TEAMS, now).filter((m) => !scripted.some((x) => Math.abs(x.at - m.at) < 9000)).concat(scripted).sort((a: any, b: any) => a.at - b.at).slice(-160);
    return d;
  };

  const add = (ops: Op[]) => { st.ops.push(...ops); if (st.ops.length > 600) st.ops = st.ops.slice(-600); save(); notify(); arm(); };

  const send = (items: string[]) => {
    const cur = snapshot(); const now = Date.now(); const ops: Op[] = [];
    items.forEach((line, n) => {
      const t0 = now + n * 1500;
      const dash = line.indexOf(" — "); if (dash < 0) return;
      const kind = line.slice(0, dash); const rest = line.slice(dash + 3);
      const colon = rest.indexOf(": "); const team = cur.TEAMS.find((x: any) => x.name === rest.slice(0, colon));
      if (!team) return;
      const body = rest.slice(colon + 2);
      const id = (body.match(/\[([^\]]+)\]/) || [])[1] || "";
      const lead = team.lead.name;
      const mem = team.members.length ? team.members[hash(line) % team.members.length].name : lead;
      const T = team.id;
      const item = team.pending.find((p: any) => p.id === id);
      const what = item ? item.what : body.replace(/\s*\[[^\]]*\].*$/, "");
      const s = short(what); const s0 = s;
      const meTask = team.tasks.find((k: any) => k.owner === "Me" && k.state !== "done" && words(k.text).filter((w) => words(s0).includes(w)).length >= 1);
      if (kind === "Instruction") {
        // the owner's instruction: the lead hands it out, the bots talk it through, another team is asked, the lead reports back
        const names = team.members.map((m: any) => m.name);
        const m1 = names[0] || lead, m2 = names[1] || names[0] || lead;
        const others = cur.TEAMS.filter((x: any) => x.id !== T && x.status !== "frozen");
        const O = others.length ? others[hash(line) % others.length] : null;
        const job = clip(body.replace(/[.\s]+$/, ""), 90);
        const say = (dt: number, from: string, text: string, to?: string, toTeam?: string, tid: string = T) => ops.push({ at: t0 + dt, team: tid, k: "chat", from, to, toTeam, text });
        say(400, "You", job, lead);
        say(4500, lead, `New instruction from the owner: ${clip(job, 60)}. ${m1}, take the first pass.`, m1);
        ops.push({ at: t0 + 4500, team: T, k: "act", text: `${lead} got your instruction: ${clip(job, 70)}` });
        ops.push({ at: t0 + 4500, team: T, k: "task", text: clip(job, 60), state: "doing", owner: m1 });
        say(11500, m1, "On it. I need the latest numbers to do this properly.", m2);
        if (m2 !== m1) say(18500, m2, "Here they are. I checked them this morning.", m1);
        if (O) {
          say(25500, lead, `Quick question for ${O.name}: anything on your side we should account for?`, O.lead.name, O.id);
          say(33000, O.lead.name, "One thing: check the timing with us before it goes out. Otherwise you're clear.", lead, T, O.id);
          ops.push({ at: t0 + 33000, team: O.id, k: "act", text: `${O.lead.name} answered a question from ${team.name}` });
        }
        say(40000, m1, "First pass is done. Ready for review.", lead);
        say(47000, lead, `Done: ${clip(job, 60)}. It's on the board for you to check.`);
        ops.push({ at: t0 + 47000, team: T, k: "task", text: clip(job, 60), state: "done", owner: m1 });
        ops.push({ at: t0 + 47000, team: T, k: "act", text: `${lead}: finished your instruction: ${clip(job, 70)}` });
      } else if (kind === "Approved" || kind === "Rejected") {
        const ok = kind === "Approved";
        ops.push({ at: t0 + 1500, team: T, k: "act", text: `Main bot passed your ${ok ? "approval" : "rejection"} to ${lead}` });
        ops.push({ at: t0 + 4500, team: T, k: "drop", id });
        if (meTask) ops.push({ at: t0 + 4500, team: T, k: "task", text: meTask.text, state: "done", owner: "Me" });
        if (ok) {
          ops.push({ at: t0 + 4500, team: T, k: "act", text: `${lead}: Approved, thanks. ${mem} is on it: ${clip(s, 70)}` });
          ops.push({ at: t0 + 4500, team: T, k: "task", text: `${clip(s, 60)} (approved)`, state: "doing", owner: mem });
          ops.push({ at: t0 + 12000, team: T, k: "task", text: `${clip(s, 60)} (approved)`, state: "done", owner: mem });
          ops.push({ at: t0 + 12000, team: T, k: "act", text: `${mem} finished: ${clip(s, 70)}` });
        } else {
          ops.push({ at: t0 + 4500, team: T, k: "act", text: `${lead}: Understood, we won't go ahead with it. We'll bring you another option.` });
          ops.push({ at: t0 + 4500, team: T, k: "task", text: `New option instead of: ${clip(s, 50)}`, state: "todo", owner: lead });
          ops.push({ at: t0 + 12000, team: T, k: "task", text: `New option instead of: ${clip(s, 50)}`, state: "doing", owner: mem });
          ops.push({ at: t0 + 12000, team: T, k: "act", text: `${mem} started working on a new option` });
        }
        if (team.status === "hold" && team.pending.filter((p: any) => p.id !== id).length === 0) {
          ops.push({ at: t0 + 8000, team: T, k: "status", s: "active" });
          ops.push({ at: t0 + 8000, team: T, k: "act", text: `${lead}: Nothing is blocking us now, the team is back to work` });
        }
      } else if (kind === "Question") {
        ops.push({ at: t0 + 1500, team: T, k: "act", text: `Main bot passed your question to ${lead}` });
        ops.push({ at: t0 + 6000, team: T, k: "act", text: `${lead} answered your question on "${clip(s, 40)}": ${ANSWERS[hash(line) % ANSWERS.length]}` });
      } else if (kind === "What's the status?") {
        ops.push({ at: t0 + 1500, team: T, k: "act", text: `Main bot asked ${lead} for a status update` });
        ops.push({ at: t0 + 5500, team: T, k: "act", text: `${lead}: ${clip(body, 60)} is on track, about ${60 + (hash(line) % 4) * 10}% done. Expected later today.` });
      } else if (kind === "Note to the team lead") {
        ops.push({ at: t0 + 1500, team: T, k: "act", text: `Main bot passed your note to ${lead}` });
        ops.push({ at: t0 + 5000, team: T, k: "act", text: `${lead}: Got your note, the team will take it into account` });
      } else if (["Pause task", "Resume", "Run now", "Pause all tasks", "Cancel task", "Change task"].includes(kind)) {
        const m = body.match(/^(.*?) \/ (.*?) \[([^\]]+)\]/);
        const owner = m ? m[1] : body.replace(/\s*\[.*$/, "");
        const name = m ? m[2] : "its scheduled tasks";
        const rid = m ? m[3] : "";
        if (kind === "Pause task" || kind === "Resume") {
          const on = kind === "Resume";
          ops.push({ at: t0 + 3000, team: T, k: "rt", id: rid, patch: { state: on ? "on" : "paused" } });
          ops.push({ at: t0 + 3000, team: T, k: "act", text: `${owner} ${on ? "resumed" : "paused"} "${name}"` });
        } else if (kind === "Run now") {
          ops.push({ at: t0 + 2500, team: T, k: "act", text: `${owner} is running "${name}" now` });
          ops.push({ at: t0 + 9000, team: T, k: "rt", id: rid, patch: { lastRun: "@", lastResult: "ok" } });
          ops.push({ at: t0 + 9000, team: T, k: "act", text: `${owner} finished "${name}": all OK` });
        } else if (kind === "Pause all tasks") {
          const ids = ((body.match(/\[([^\]]+)\]/) || [])[1] || "").split(/,\s*/).filter(Boolean);
          ids.forEach((x) => ops.push({ at: t0 + 3000, team: T, k: "rt", id: x, patch: { state: "paused" } }));
          ops.push({ at: t0 + 3000, team: T, k: "act", text: `${owner} paused all its scheduled tasks` });
        } else {
          const change = kind === "Change task" ? body.split(" — ").slice(1).join(" — ") : "";
          ops.push({ at: t0 + 1500, team: T, k: "act", text: `Main bot asked you to confirm in your private chat before it ${change ? "changes" : "cancels"} "${name}"` });
          if (change) {
            ops.push({ at: t0 + 7000, team: T, k: "rt", id: rid, patch: { note: clip(change, 80) } });
            ops.push({ at: t0 + 7000, team: T, k: "act", text: `Confirmed. ${owner} updated "${name}": ${clip(change, 60)}` });
          } else {
            ops.push({ at: t0 + 7000, team: T, k: "rtDel", id: rid });
            ops.push({ at: t0 + 7000, team: T, k: "act", text: `Confirmed. "${name}" was cancelled` });
          }
        }
      } else {
        ops.push({ at: t0 + 1500, team: T, k: "act", text: `Main bot passed your request to ${lead}` });
        ops.push({ at: t0 + 5000, team: T, k: "act", text: `${lead}: Got it, on it` });
      }
    });
    add(ops);
  };

  const refreshRound = () => {
    const cur = snapshot(); const now = Date.now(); const r = st.round++;
    const act = cur.TEAMS.filter((t: any) => t.status !== "frozen");
    const n = act.length; if (!n) return;
    const ops: Op[] = [{ at: now, team: "", k: "upd" }, { at: now, team: "", k: "use", d: 1 }];
    const A = act[r % n], B = act[(r + 1) % n], C = act[(r + 2) % n], D = act[(r + 3) % n];
    const done = A.tasks.find((k: any) => k.state === "doing" && k.owner !== "Me");
    if (done) { ops.push({ at: now, team: A.id, k: "task", text: done.text, state: "done", owner: done.owner }); ops.push({ at: now, team: A.id, k: "act", text: `${done.owner || A.lead.name} finished: ${done.text}` }); }
    const start = B.tasks.find((k: any) => k.state === "todo" && k.owner !== "Me");
    if (start) { ops.push({ at: now, team: B.id, k: "task", text: start.text, state: "doing", owner: start.owner }); ops.push({ at: now, team: B.id, k: "act", text: `${start.owner || B.lead.name} started: ${start.text}` }); }
    else if (B.members.length) ops.push({ at: now, team: B.id, k: "act", text: CHATTER[r % CHATTER.length].replace("{m}", B.members[r % B.members.length].name) });
    const G = [C, ...act].find((t: any) => t.goal && t.goal.current !== null && t.goal.current < t.goal.target);
    if (G) { const dd = G.goal.target >= 100 ? 11 + (r * 7) % 19 : 1; ops.push({ at: now, team: G.id, k: "goal", d: dd }); ops.push({ at: now, team: G.id, k: "act", text: `${G.lead.name}: ${G.goal.label} now at ${G.goal.current + dd} of ${G.goal.target}` }); }
    ops.push({ at: now, team: D.id, k: "pend", id: `sim-${D.id}-${r}`, what: PENDING_POOL[r % PENDING_POOL.length] });
    ops.push({ at: now, team: D.id, k: "act", text: `${D.lead.name} sent you a new item to approve` });
    if (C.members.length) ops.push({ at: now, team: C.id, k: "act", text: CHATTER[(r + 2) % CHATTER.length].replace("{m}", C.members[(r + 1) % C.members.length].name) });
    add(ops);
  };

  if (typeof window !== "undefined") setTimeout(arm, 0);
  return { snapshot, send, refreshRound, subscribe: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; } };
}
