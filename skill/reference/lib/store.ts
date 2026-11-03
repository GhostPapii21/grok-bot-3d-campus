import { get, put } from "@vercel/blob";
import seed from "../data.json"; // a small valid DATA file shipped with the app (fallback)
// Everything lives in a PRIVATE Vercel Blob store. No database needed.
const DATA_PATH = "control-center/data.json";
const REFRESH_PATH = "control-center/refresh-request.json";
export const REFRESH_WINDOW_MS = 5 * 60 * 1000;

async function readJson(path: string): Promise<any> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const r: any = await get(path, { access: "private", useCache: false } as any);
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch { return null; }
}
async function writeJson(path: string, v: any) {
  await put(path, JSON.stringify(v), { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json" } as any);
}
export async function readData(): Promise<any> {
  const j = await readJson(DATA_PATH);
  return j && Array.isArray(j.TEAMS) ? j : seed;
}
export const writeData = (d: any) => writeJson(DATA_PATH, d);
export function validData(d: any) {
  return d && typeof d.UPDATED === "string" && d.USAGE && typeof d.USAGE.weeklyPct === "number" && Array.isArray(d.TEAMS)
    && d.TEAMS.every((t: any) => t && typeof t.id === "string" && typeof t.name === "string");
}
// refresh-request rate limit, shared by all server instances through the Blob
let refreshMem = 0;
export async function lastRefreshAt() {
  const j = await readJson(REFRESH_PATH);
  return Math.max(refreshMem, Number(j?.at) || 0);
}
export async function markRefresh(at: number) {
  refreshMem = at;
  try { await writeJson(REFRESH_PATH, { at }); } catch {}
}
