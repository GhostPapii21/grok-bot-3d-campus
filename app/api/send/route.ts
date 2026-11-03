export const dynamic = "force-dynamic";
// Demo mode: nothing is sent anywhere.
// In the real app this route forwards the queued commands (or a refresh request) to the main bot's webhook routine.
export async function POST(req: Request) {
  let body: any = null;
  try { body = await req.json(); } catch (e) {}
  if (body && body.kind === "refresh") return Response.json({ ok: true, demo: true, kind: "refresh", at: Date.now(), waitMs: 5 * 60000 });
  const n = Array.isArray(body?.items) ? body.items.length : 0;
  return Response.json({ ok: true, demo: true, count: n });
}
