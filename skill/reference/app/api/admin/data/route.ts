import { isAdmin } from "../../../../lib/admin";
import { notFound404 } from "../../../../lib/auth";
import { validData, writeData } from "../../../../lib/store";
export const dynamic = "force-dynamic";
// POST the full DATA JSON with Authorization: Bearer <ADMIN_KEY>. Used by push-data.sh. No redeploy needed.
export async function POST(req: Request) {
  if (!isAdmin(req)) return notFound404();
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 2_000_000) return Response.json({ ok: false, error: "DATA is larger than 2 MB" }, { status: 413 });
  let d: any = null;
  try { d = await req.json(); } catch {}
  if (!validData(d)) return Response.json({ ok: false, error: "bad schema (need UPDATED, USAGE.weeklyPct, TEAMS[])" }, { status: 400 });
  await writeData(d);
  return Response.json({ ok: true, teams: d.TEAMS.length, updated: d.UPDATED });
}
