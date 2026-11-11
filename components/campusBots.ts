import { W3, ctrlFor, qpt, PLAZA, ROOM_POS } from "./ControlCenter";
import type { BotKey } from "./botAvatars";
import type { FeedEntry } from "../lib/feed";

export type XZ = { x: number; z: number };

export type BotHome = { key: BotKey; name: string; roomId: string; home: XZ };

export function botHomes(): BotHome[] {
  const C = (id: string) => W3(ROOM_POS[id]);
  const hq = C("hq");
  const front = (id: string, ox = 0, oz = 2.35): XZ => {
    const c = C(id);
    return { x: c.x + ox, z: c.z + oz };
  };
  return [
    { key: "ghost6", name: "Ghost6", roomId: "hq", home: { x: hq.x, z: hq.z + 2.5 } },
    { key: "einstein", name: "Einstein", roomId: "hq", home: { x: hq.x + 1.85, z: hq.z + 2.15 } },
    { key: "dropout", name: "College DropOut", roomId: "hq", home: { x: hq.x - 1.9, z: hq.z + 2.2 } },
    { key: "topshotta", name: "TopShotta", roomId: "hq", home: { x: hq.x + 3.1, z: hq.z + 1.6 } },
    { key: "travel", name: "Travel Agent", roomId: "travel", home: front("travel", 0.2, 2.35) },
    { key: "blitz", name: "Blitz", roomId: "nfl", home: front("nfl", -0.2, 2.35) },
    { key: "betguru", name: "BetGuru", roomId: "nba", home: front("nba", 0.2, 2.35) },
    { key: "money", name: "Money Maker Bot", roomId: "money", home: front("money", 0.25, 2.35) },
    { key: "apextitan", name: "ApexTitan", roomId: "shop", home: front("shop", 0, 2.2) },
  ];
}

function roadFromPlaza(roomId: string, reverse: boolean): XZ[] {
  if (roomId === "hq") return [W3(PLAZA)];
  const p = ROOM_POS[roomId];
  if (!p) return [W3(PLAZA)];
  const c = ctrlFor(p);
  const pts: XZ[] = [];
  for (let i = 0; i <= 24; i++) {
    const k = reverse ? 1 - i / 24 : i / 24;
    pts.push(W3(qpt(PLAZA, c, p, k)));
  }
  return pts;
}

function dedupe(pts: XZ[]): XZ[] {
  const out: XZ[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || (p.x - last.x) ** 2 + (p.z - last.z) ** 2 > 0.01) out.push(p);
  }
  return out;
}

export function pathBetween(from: BotHome, to: BotHome): XZ[] {
  if (from.roomId === to.roomId) {
    const mid = { x: (from.home.x + to.home.x) / 2, z: (from.home.z + to.home.z) / 2 + 0.4 };
    return dedupe([from.home, mid, to.home]);
  }
  const a = roadFromPlaza(from.roomId, true); // building -> plaza
  const b = roadFromPlaza(to.roomId, false); // plaza -> building
  return dedupe([from.home, ...a, ...b, to.home]);
}

export type WalkJob = {
  key: BotKey;
  pts: XZ[];
  text: string | null;
  hold: number;
};

export function playbackJobs(entries: FeedEntry[], homes: BotHome[]): WalkJob[] {
  const jobs: WalkJob[] = [];
  const find = (name: string) =>
    homes.find((h) => name === h.name || name.startsWith(h.name)) || null;
  for (const e of entries) {
    const from = find(e.from);
    if (!from) continue;
    if (e.to === "all") {
      const step = { x: from.home.x, z: from.home.z + 0.8 };
      jobs.push({ key: from.key, pts: [from.home, step], text: e.text, hold: 2.4 });
      jobs.push({ key: from.key, pts: [step, from.home], text: null, hold: 0.2 });
      continue;
    }
    const to = find(e.to);
    if (!to) continue;
    const there = pathBetween(from, to);
    const back = [...there].reverse();
    jobs.push({ key: from.key, pts: there, text: e.text, hold: 2.3 });
    jobs.push({ key: from.key, pts: back, text: null, hold: 0.15 });
  }
  return jobs;
}

export function lengthOf(pts: XZ[]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    n += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  }
  return n;
}

export function pointAlong(pts: XZ[], d: number): { x: number; z: number; heading: number } {
  if (pts.length < 2) return { x: pts[0].x, z: pts[0].z, heading: 0 };
  let left = d;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dz = pts[i].z - pts[i - 1].z;
    const seg = Math.hypot(dx, dz) || 0.0001;
    if (left <= seg) {
      const k = left / seg;
      return { x: pts[i - 1].x + dx * k, z: pts[i - 1].z + dz * k, heading: Math.atan2(dx, dz) };
    }
    left -= seg;
  }
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  return { x: b.x, z: b.z, heading: Math.atan2(b.x - a.x, b.z - a.z) };
}
