// Rico's Campus: six rooms (including Ghost HQ), placeholder copy plus posted status.json items only.
// No invented activity, usage, approvals, or picks. Specialists can later swap lib/sections.ts (or static JSON).
import { sections } from "./sections"

export function demoData(_nowMs = Date.now()) {
  const TEAMS = sections.map((section) => ({
    id: section.id,
    name: section.name,
    status: "active" as const,
    lead: { name: section.owner, role: section.ownerRole },
    members: [],
    work: section.work,
    next: section.next,
    lines: section.lines,
    pending: [],
    activity: [],
    tasks: [],
    routines: [],
  }))

  return {
    UPDATED: "v1 prototype · placeholder data only",
    USAGE: {
      weeklyPct: 0,
      reset: "",
      onDemandPct: 0,
      period: "",
      byTeam: [],
      topBots: [],
    },
    TEAMS,
  }
}
