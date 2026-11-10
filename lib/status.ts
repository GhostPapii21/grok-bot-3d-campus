// Reader for public/status.json. Only posted, real items belong here — do not invent work.
import { useEffect, useState } from "react"
import fallback from "./status-data.json"

export type StatusItem = {
  bot: string
  task: string
  state: string
  updatedAt: string | null
}

export type StatusFile = {
  updatedAt: string
  items: StatusItem[]
}

export const FALLBACK_STATUS = fallback as StatusFile

export function formatStatusTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${fmt.format(d)} ET`
}

export function isPosted(item: StatusItem) {
  return item.state !== "no update" && item.task !== "No update posted yet"
}

let cache: StatusFile | null = FALLBACK_STATUS

export function useCampusStatus(): StatusFile {
  const [data, setData] = useState<StatusFile>(cache || FALLBACK_STATUS)
  useEffect(() => {
    let alive = true
    fetch("/status.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j || !Array.isArray(j.items)) return
        cache = j as StatusFile
        setData(cache)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return data
}

export function itemsForRoom(file: StatusFile, roomId: string | "all", roomOwner?: string) {
  if (roomId === "all" || roomId === "hq") return file.items
  return file.items.filter((item) => item.bot === roomOwner)
}
