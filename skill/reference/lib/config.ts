import { get, put } from "@vercel/blob";
// Webhook settings for /api/send. Project env vars win; otherwise the values the user saved once
// on the private /setup page (stored in the PRIVATE Blob). Values are never returned to any client.
const CONFIG_PATH = "control-center/config.json";
export type WebhookConfig = { url: string; key: string; header: string };

export async function getConfig(): Promise<WebhookConfig> {
  let url = (process.env.WEBHOOK_URL || "").trim();
  let key = (process.env.WEBHOOK_KEY || "").trim();
  let header = (process.env.WEBHOOK_KEY_HEADER || "").trim();
  if ((!url || !key) && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const r: any = await get(CONFIG_PATH, { access: "private", useCache: false } as any);
      if (r && r.statusCode === 200 && r.stream) {
        const j = JSON.parse(await new Response(r.stream).text());
        url = url || String(j.url || "").trim();
        key = key || String(j.key || "").trim();
        header = header || String(j.header || "").trim();
      }
    } catch {}
  }
  return { url, key, header: header || "Authorization" };
}

export async function saveConfig(c: WebhookConfig) {
  await put(CONFIG_PATH, JSON.stringify(c), { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json" } as any);
}
