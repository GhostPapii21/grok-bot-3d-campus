import { checkAccess, makeToken, COOKIE, cookieOpts, notFound404 } from "../../lib/auth";
export const dynamic = "force-dynamic";
// GET /<token>: sets the session cookie and redirects to the clean URL "/"
export async function GET(req: Request, ctx: { params: Promise<{ k: string }> }) {
  const { k } = await ctx.params;
  if (!checkAccess(decodeURIComponent(k || ""))) { await new Promise((r) => setTimeout(r, 300)); return notFound404(); }
  const res = new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  res.headers.append("Set-Cookie", `${COOKIE}=${makeToken()}; Path=/; Max-Age=${cookieOpts.maxAge}; HttpOnly; Secure; SameSite=Lax`);
  return res;
}
