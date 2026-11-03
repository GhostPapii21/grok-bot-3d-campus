"use client";
// Demo wrapper: invented data generated in the browser (viewer's time zone) plus the client-side simulation.
import { useState } from "react";
import ControlCenter from "./ControlCenter";
import { createDemoSim } from "../lib/demo-sim";
const EMPTY = { UPDATED: "", USAGE: { weeklyPct: 0, reset: "", onDemandPct: 0, period: "", byTeam: [], topBots: [] }, TEAMS: [] };
export default function DemoApp() {
  const [sim] = useState(() => createDemoSim());
  return <ControlCenter initial={EMPTY as any} demo={sim} />;
}
