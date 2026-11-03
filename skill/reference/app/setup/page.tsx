import { notFound } from "next/navigation";
import { isAuthed } from "../../lib/auth";
import SetupForm from "./SetupForm";
export const dynamic = "force-dynamic";
// Private page (cookie required). The user pastes the routine's webhook URL and sender key here once.
export default async function Setup() {
  if (!(await isAuthed())) notFound();
  return <SetupForm />;
}
