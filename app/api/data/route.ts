import { demoData } from "../../../lib/demo-data";
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Demo: the data is generated on every request (it changes once a minute).
// In the real app this route reads the latest snapshot that the main bot pushed to private storage.
export async function GET() {
  return Response.json(demoData(), { headers: { "Cache-Control": "no-store, max-age=0" } });
}
