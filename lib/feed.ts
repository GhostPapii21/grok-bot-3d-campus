// Single loader for public/feed.json.
// Drop in a new file at /feed.json (same schema) — no code changes needed.
// Only real posted campus messages belong here. Do not invent events.
import { useEffect, useState } from "react"
import fallback from "./feed-data.json"

export type FeedKind = "request" | "reply" | "update"

export type FeedEntry = {
  at: string
  from: string
  to: string
  kind: FeedKind
  text: string
}

export type FeedFile = {
  updatedAt: string
  entries: FeedEntry[]
}

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback
}

export function parseFeed(raw: unknown): FeedFile | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const list = Array.isArray(r.entries) ? r.entries : []
  if (!list.length) return null
  const entries: FeedEntry[] = list.map((e) => {
    const x = (e && typeof e === "object" ? e : {}) as Record<string, unknown>
    const kind = asStr(x.kind, "update")
    return {
      at: asStr(x.at),
      from: asStr(x.from),
      to: asStr(x.to, "all"),
      kind: kind === "request" || kind === "reply" || kind === "update" ? kind : "update",
      text: asStr(x.text),
    }
  })
  return { updatedAt: asStr(r.updatedAt), entries }
}

export const FALLBACK_FEED = parseFeed(fallback) as FeedFile

let cache: FeedFile | null = FALLBACK_FEED

export function getCampusFeed(): FeedFile {
  return cache || FALLBACK_FEED
}

export function useCampusFeed(): FeedFile {
  const [data, setData] = useState<FeedFile>(cache || FALLBACK_FEED)
  useEffect(() => {
    let alive = true
    fetch("/feed.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const parsed = parseFeed(j)
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
