// Room themes: decor that matches what a team does. A team can set `theme` in its data; otherwise the theme is
// inferred from the team's id and name. Unthemed teams keep the plain office.
export type RoomTheme = "money" | "travel" | "nfl" | "nba";
export const THEMES: RoomTheme[] = ["money", "travel", "nfl", "nba"];

const RULES: [RoomTheme, RegExp][] = [
  ["nba", /\b(nba|basketball|hoops?)\b/i],
  ["nfl", /\b(nfl|football|gridiron)\b/i],
  ["travel", /\b(travel|trips?|flights?|vacation|tourism|itinerar)/i],
  ["money", /\b(money|income|revenue|earn|profit|cash|invest|trading|side.?hustle)/i],
];

export function themeOf(team: { id?: string; name?: string; theme?: string } | null | undefined): RoomTheme | null {
  if (!team) return null;
  const set = String(team.theme || "").toLowerCase();
  if ((THEMES as string[]).includes(set)) return set as RoomTheme;
  if (set === "none") return null;
  const text = `${team.id || ""} ${team.name || ""}`.replace(/[-_]/g, " ");
  for (const [theme, re] of RULES) if (re.test(text)) return theme;
  return null;
}

export const THEME_LABEL: Record<RoomTheme, string> = { money: "Money", travel: "Travel", nfl: "Football", nba: "Basketball" };
