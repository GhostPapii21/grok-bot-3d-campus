import ControlCenter from "../components/ControlCenter";
import { demoData } from "../lib/demo-data";
export const dynamic = "force-dynamic";

// Demo: no login, no private link. Everything shown is invented example data.
export default function Page() {
  return <ControlCenter initial={demoData() as any} />;
}
