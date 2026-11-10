// Single loader for public/status.json.
// Drop in a new file at /status.json (same schema) — no code changes needed.
// Only posted, real items belong here. Do not invent work.
import { useEffect, useState } from "react"
import fallback from "./status-data.json"
import { bots as campusBots } from "./bots"

export type WorkItem = {
  task: string
  state: string
  updatedAt: string | null
}

export type RoutineItem = {
  name: string
  schedule: string
  state: string
  lastRun: string | null
}

export type BotBoard = {
  bot: string
  id: string
  room: string | null
  workingOn: WorkItem[]
  routines: RoutineItem[]
  openTasks: WorkItem[]
}

export type StatusFile = {
  updatedAt: string
  bots: BotBoard[]
}

/** @deprecated kept so older UI helpers can derive a one-line summary */
export type StatusItem = {
  bot: string
  task: string
  state: string
  updatedAt: string | null
}

function asList<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback
}

function asNullableStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "string") return v
  return String(v)
}

/** Normalize a dropped-in status.json into the canonical per-bot shape. */
export function parseStatus(raw: unknown): StatusFile | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const list = asList<Record<string, unknown>>(r.bots)
  if (!list.length) return null
  const bots: BotBoard[] = list.map((b) => ({
    bot: asStr(b.bot, "Unknown"),
    id: asStr(b.id),
    room: asNullableStr(b.room),
    workingOn: asList<Record<string, unknown>>(b.workingOn).map((x) => ({
      task: asStr(x.task),
      state: asStr(x.state),
      updatedAt: asNullableStr(x.updatedAt),
    })),
    routines: asList<Record<string, unknown>>(b.routines).map((x) => ({
      name: asStr(x.name),
      schedule: asStr(x.schedule),
      state: asStr(x.state),
      lastRun: asNullableStr(x.lastRun),
    })),
    openTasks: asList<Record<string, unknown>>(b.openTasks).map((x) => ({
      task: asStr(x.task),
      state: asStr(x.state),
      updatedAt: asNullableStr(x.updatedAt),
    })),
  }))
  return { updatedAt: asStr(r.updatedAt), bots }
}

export const FALLBACK_STATUS = parseStatus(fallback) as StatusFile

export function hasPostedBoard(board: BotBoard) {
  return board.workingOn.length > 0 || board.routines.length > 0 || board.openTasks.length > 0
}

export function waitingMessage(botName: string) {
  return `Waiting for ${botName} to post its board`
}

export function formatStatusTime(value: string | null): string {
  if (!value) return ""
  const iso = value.match(/^(\d{4}-\d{2}-\d{2}T\S+)/)
  if (!iso) return value
  const d = new Date(iso[1])
  if (Number.isNaN(d.getTime())) return value
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const rest = value.slice(iso[0].length).trim()
  return `${fmt.format(d)} ET${rest ? ` ${rest}` : ""}`
}

export function formatLastRun(lastRun: string | null): string {
  if (!lastRun || /^(never|never run)$/i.test(lastRun.trim())) return "Never run"
  return formatStatusTime(lastRun)
}

export function lastRunFailed(lastRun: string | null): boolean {
  return !!lastRun && /\bfailed\b/i.test(lastRun)
}

/** Color for a state pill. Pass failed=true to force last-run failure red. */
export function stateTint(state: string, failed = false, monitor = false): string {
  if (failed) return monitor ? "#ff6b6b" : "#c62828"
  const s = (state || "").toLowerCase()
  if (s === "enabled" || s === "in progress") return monitor ? "#7dff9a" : "#1b7a3a"
  if (s.includes("paused") || s.includes("waiting") || s.includes("awaiting")) return monitor ? "#ffd36b" : "#b86a00"
  if (s.includes("blocked") || s.includes("failed")) return monitor ? "#ff6b6b" : "#c62828"
  if (s.includes("done") || s === "drafted" || s === "open") return monitor ? "#9ad0ff" : "#1a4a8a"
  return monitor ? "#c8a84b" : "#555555"
}

export function isPosted(item: { task: string; state: string }) {
  return item.state !== "no update" && item.task !== "No update posted yet"
}

function summarize(board: BotBoard): StatusItem {
  if (!hasPostedBoard(board)) {
    return { bot: board.bot, task: waitingMessage(board.bot), state: "no update", updatedAt: null }
  }
  const w = board.workingOn[0]
  if (w) return { bot: board.bot, task: w.task, state: w.state, updatedAt: w.updatedAt }
  return { bot: board.bot, task: "Nothing running right now", state: "no update", updatedAt: null }
}

/** One-line HUD rows derived from the per-bot boards. */
export function summaryItems(file: StatusFile): StatusItem[] {
  return file.bots.map(summarize)
}

export function boardForBot(file: StatusFile, nameOrId: string): BotBoard | undefined {
  return file.bots.find((b) => b.bot === nameOrId || b.id === nameOrId)
}

/** Boards to hang in a room interior. HQ shows Ghost6 (owner) and Einstein (HQ-listed, posted). */
export function boardsForRoom(file: StatusFile, roomId: string, roomOwner?: string): BotBoard[] {
  if (roomId === "hq") {
    const out: BotBoard[] = []
    const g6 = file.bots.find((b) => b.bot === "Ghost6" || b.room === "hq")
    const ein = file.bots.find((b) => b.bot === "Einstein")
    if (g6) out.push(g6)
    if (ein) out.push(ein)
    return out
  }
  const byRoom = file.bots.find((b) => b.room === roomId)
  if (byRoom) return [byRoom]
  if (roomOwner) {
    const byOwner = file.bots.find((b) => b.bot === roomOwner)
    if (byOwner) return [byOwner]
  }
  return []
}

let cache: StatusFile | null = FALLBACK_STATUS

export function useCampusStatus(): StatusFile {
  const [data, setData] = useState<StatusFile>(cache || FALLBACK_STATUS)
  useEffect(() => {
    let alive = true
    fetch("/status.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const parsed = parseStatus(j)
        if (!alive || !parsed) return
        cache = parsed
        setData(cache)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return data
}

// Back-compat helpers used by the campus HUD / section cards.
export function itemsForRoom(file: StatusFile, roomId: string | "all", roomOwner?: string): StatusItem[] {
  if (roomId === "all") return summaryItems(file)
  return boardsForRoom(file, roomId, roomOwner).map(summarize)
}

export function usePostedCount() {
  const file = useCampusStatus()
  return file.bots.filter(hasPostedBoard).length
}

export function knownBotNames() {
  return campusBots.map((b) => b.name)
}
