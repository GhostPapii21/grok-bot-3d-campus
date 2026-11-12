import { checkAccess, makeToken, COOKIE, cookieOpts, notFound404 } from "../../lib/auth";
export const dynamic = "force-dynamic";
// GET /<token>: sets the session cookie and redirects to the clean URL "/" (or "/setup" with ?next=setup)
export async function GET(req: Request, ctx: { params: Promise<{ k: string }> }) {
  const { k } = await ctx.params;
  let token = "";
  try { token = decodeURIComponent(k || ""); } catch {} // malformed %-escapes must 404, not throw a 500
  if (!checkAccess(token)) { await new Promise((r) => setTimeout(r, 300)); return notFound404(); }
  // optional ?next=setup sends the user straight to the one-time webhook setup page
  const next = new URL(req.url).searchParams.get("next") === "setup" ? "/setup" : "/";
  const res = new Response(null, { status: 303, headers: { Location: next, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  res.headers.append("Set-Cookie", `${COOKIE}=${makeToken()}; Path=/; Max-Age=${cookieOpts.maxAge}; HttpOnly; Secure; SameSite=Lax`);
  return res;
}
