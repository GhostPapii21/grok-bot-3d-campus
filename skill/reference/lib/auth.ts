import crypto from "crypto";
import { cookies } from "next/headers";
// Access model: no password. The app opens only through the private link /<CONTROL_ACCESS_TOKEN>,
// which sets a signed httpOnly cookie. Without the cookie every route answers 404.
export const COOKIE = "cc_session";
const DAYS = 60;
const secret = () => (process.env.SESSION_SECRET || "").trim();
const accessToken = () => (process.env.CONTROL_ACCESS_TOKEN || "").trim();
const h = (s: string) => crypto.createHash("sha256").update(s).digest();
// tag ties sessions to the current link: rotating CONTROL_ACCESS_TOKEN logs every device out
const tag = () => h(accessToken()).toString("hex").slice(0, 16);
const sign = (p: string) => crypto.createHmac("sha256", secret()).update(p).digest("base64url");

export function checkAccess(input?: string | null) {
  const t = accessToken();
  if (!t || t.length < 24 || !secret() || !input) return false;
  return crypto.timingSafeEqual(h(input), h(t));
}
export function makeToken() {
  const exp = Math.floor(Date.now() / 1000) + DAYS * 86400;
  return `v1.${exp}.${sign(`${exp}.${tag()}`)}`;
}
export function validToken(tok?: string | null) {
  if (!tok || !secret() || !accessToken()) return false;
  const [v, exp, mac] = tok.split(".");
  const e = Number(exp);
  if (v !== "v1" || !/^\d{1,12}$/.test(exp || "") || !mac || !Number.isFinite(e) || e * 1000 < Date.now()) return false;
  const want = sign(`${exp}.${tag()}`);
  return mac.length === want.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want));
}
export async function isAuthed() {
  return validToken((await cookies()).get(COOKIE)?.value);
}
export const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: DAYS * 86400 };
export function notFound404() {
  return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } });
}
