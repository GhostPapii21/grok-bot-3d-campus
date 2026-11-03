import { isAuthed, notFound404 } from "../../../lib/auth";
import { readData } from "../../../lib/store";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  if (!(await isAuthed())) return notFound404();
  return Response.json(await readData(), { headers: { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" } });
}
