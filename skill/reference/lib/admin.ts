import crypto from "crypto";
// Bot-only endpoints (data push) check Authorization: Bearer <ADMIN_KEY>.
export function isAdmin(req: Request) {
  const key = (process.env.ADMIN_KEY || "").trim();
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!key || !got) return false;
  const h = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(got), h(key));
}
