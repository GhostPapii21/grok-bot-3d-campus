// Single source for room copy so specialists can later swap in static JSON.
// v1 is placeholder-only: no live data, no fabricated numbers, no picks.

export type PanelKind = "status" | "board" | "notes"

export type Panel = {
  id: string
  title: string
  body: string
  kind: PanelKind
  status?: { label: string; tone: "not-ready" }
}

export type Section = {
  id: string
  hash: string
  name: string
  owner: string
  ownerRole: string
  tagline: string
  work: string
  next: string
  lines: string[]
  panels: Panel[]
}

export const PLACEHOLDER = "Placeholder – content coming soon"

export const sections: Section[] = [
  {
    id: "travel",
    hash: "#/travel",
    name: "Travel Room",
    owner: "Travel Agent",
    ownerRole: "Room owner",
    tagline: "Trip desk and destination boards.",
    work: `${PLACEHOLDER} Itineraries and trip briefs will appear here when Travel Agent supplies them.`,
    next: "Travel Agent will send a room brief later.",
    lines: [PLACEHOLDER, "Trip desk", "Destinations board"],
    panels: [
      { id: "trip-desk", title: "Trip desk", kind: "board", body: `${PLACEHOLDER} Itineraries and trip briefs will appear here when Travel Agent supplies them. Nothing is listed in v1.` },
      { id: "destinations", title: "Destinations board", kind: "board", body: `${PLACEHOLDER} Saved destinations and trip ideas will appear here. Nothing is listed in v1.` },
      { id: "timing", title: "Packing & timing", kind: "notes", body: `${PLACEHOLDER} Travel timing and packing notes will appear here. No notes are posted in v1.` },
    ],
  },
  {
    id: "nfl",
    hash: "#/nfl",
    name: "NFL Game Hub",
    owner: "Blitz",
    ownerRole: "Room owner",
    tagline: "Slate, injuries, weather, and matchup notes.",
    work: `${PLACEHOLDER} This hub is not showing live picks.`,
    next: "Blitz can feed this hub later.",
    lines: [PLACEHOLDER, "NOT READY – not live picks"],
    panels: [
      { id: "model-status", title: "Model status", kind: "status", status: { label: "NOT READY – not live picks", tone: "not-ready" }, body: `${PLACEHOLDER} This light stays red until Blitz marks the model ready. It is not showing live picks.` },
      { id: "slate", title: "Slate board", kind: "board", body: `${PLACEHOLDER} The week's games will appear here when Blitz supplies the slate. No games are shown in v1.` },
      { id: "injuries", title: "Injury & inactives board", kind: "board", body: `${PLACEHOLDER} Injury and inactive reports will appear here once the feed is connected. Nothing is listed yet.` },
      { id: "weather", title: "Weather & roof flags", kind: "board", body: `${PLACEHOLDER} Weather and roof or open-air flags will appear here when available. Nothing is listed yet.` },
      { id: "matchup", title: "Matchup notes", kind: "notes", body: `${PLACEHOLDER} Specialist matchup notes will be posted here. No notes are posted in v1.` },
    ],
  },
  {
    id: "nba",
    hash: "#/nba",
    name: "NBA Game Hub",
    owner: "BetGuru",
    ownerRole: "Room owner",
    tagline: "Paper-only slate and injury boards.",
    work: `${PLACEHOLDER} Paper only, not picks.`,
    next: "BetGuru can feed this hub later.",
    lines: [PLACEHOLDER, "NOT READY – paper only, not picks"],
    panels: [
      { id: "model-status", title: "Model status", kind: "status", status: { label: "NOT READY – paper only, not picks", tone: "not-ready" }, body: `${PLACEHOLDER} This light stays red. The hub is paper only and is not showing picks.` },
      { id: "slate", title: "Tonight's slate", kind: "board", body: `${PLACEHOLDER} Tonight's games will appear here when BetGuru supplies the slate. No games are shown in v1.` },
      { id: "injuries", title: "Injury board", kind: "board", body: `${PLACEHOLDER} Injury updates will appear here once the feed is connected. Nothing is listed yet.` },
      { id: "paper", title: "Paper scoreboard ($0 cash)", kind: "board", body: `${PLACEHOLDER} The paper scoreboard will track paper results here. Cash is $0. No results are posted in v1.` },
    ],
  },
  {
    id: "money",
    hash: "#/money",
    name: "Money Room",
    owner: "Money Maker Bot",
    ownerRole: "Room owner",
    tagline: "Ledger, watchlist, and briefings.",
    work: `${PLACEHOLDER} Accounts and activity will appear here when Money Maker Bot supplies them.`,
    next: "Money Maker Bot will send a room brief later.",
    lines: [PLACEHOLDER, "Ledger desk", "Watchlist"],
    panels: [
      { id: "ledger", title: "Ledger desk", kind: "board", body: `${PLACEHOLDER} Accounts and activity will appear here when Money Maker Bot supplies them. Nothing is listed in v1.` },
      { id: "watchlist", title: "Watchlist", kind: "board", body: `${PLACEHOLDER} Items being watched will appear here. Nothing is listed in v1.` },
      { id: "briefing", title: "Briefing", kind: "notes", body: `${PLACEHOLDER} Money-room briefings will appear here. No briefings are posted in v1.` },
    ],
  },
  {
    id: "shop",
    hash: "#/shop",
    name: "ApexTitan Shop",
    owner: "ApexTitan",
    ownerRole: "Room owner",
    tagline: "Shop floor, collections, and the counter.",
    work: `${PLACEHOLDER} Featured items will appear here when ApexTitan stocks the floor.`,
    next: "ApexTitan will send a room brief later.",
    lines: [PLACEHOLDER, "Shop floor", "Collections"],
    panels: [
      { id: "floor", title: "Shop floor", kind: "board", body: `${PLACEHOLDER} Featured items will appear here when ApexTitan stocks the floor. Nothing is listed in v1.` },
      { id: "collections", title: "Collections", kind: "board", body: `${PLACEHOLDER} Shop collections will appear here. Nothing is listed in v1.` },
      { id: "counter", title: "Counter", kind: "notes", body: `${PLACEHOLDER} Order and pickup notes will appear here. No orders are posted in v1.` },
    ],
  },
]

export const sectionsById: Record<string, Section> = Object.fromEntries(
  sections.map((section) => [section.id, section]),
)

export function sectionFromHash(hash: string): Section | null {
  const normalized = hash.trim()
  if (!normalized || normalized === "#" || normalized === "#/") return null
  return sections.find((section) => section.hash === normalized) ?? null
}
