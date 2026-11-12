// Demo data: invented teams, agents and tasks. Nothing here is real.
// Times are generated relative to "now" so countdowns, "waiting since" and the live feed always look fresh.
// The data changes once a minute (timestamp + one rotating feed item), so the ⟳ button visibly loads new data.
import { TZ } from "./tz";

const pad = (n: number) => String(n).padStart(2, "0");
function parts(ms: number) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as any).formatToParts(new Date(ms));
  const g = (t: string) => Number(f.find((p) => p.type === t)?.value || 0);
  return { d: g("day"), m: g("month"), y: g("year"), hh: g("hour"), mm: g("minute") };
}
const H = 3600e3, MIN = 60e3, DAY = 24 * H;
/** "D.M HH:MM" for a moment `ago` ms in the past */
function ago(now: number, ms: number) { const p = parts(now - ms); return `${p.d}.${p.m} ${pad(p.hh)}:${pad(p.mm)}`; }
/** "D.M" for a day `days` ago (or ahead with a negative value) */
function day(now: number, days: number) { const p = parts(now - days * DAY); return `${p.d}.${p.m}`; }
/** ISO time with offset, `ahead` ms in the future (offset taken from the configured zone) */
function iso(now: number, ahead: number) {
  const t = now + ahead; const p = parts(t);
  const off = Math.round((Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm) - Math.floor(t / MIN) * MIN) / MIN);
  const s = off >= 0 ? "+" : "-"; const a = Math.abs(off);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.hh)}:${pad(p.mm)}:00${s}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

// rotating "breaking" feed items: one is pinned on top each minute
const LIVE = [
  { team: "marketing", text: "Newsletter campaign is live: 38 sign-ups in the first hour" },
  { team: "product", text: "Google sign-in bug fixed and verified" },
  { team: "nfl", text: "Monday night packet rebuilt with the latest injury report" },
  { team: "nba", text: "Tonight's slate is ready: 8 games" },
  { team: "travel", text: "Fare alert: the Lisbon route dropped overnight" },
  { team: "money", text: "This week's income report is ready for you" },
];

export function demoData(nowMs = Date.now()) {
  const now = Math.floor(nowMs / MIN) * MIN; // changes once a minute
  const p = parts(now);
  const live = LIVE[Math.floor(now / MIN) % LIVE.length];
  const fresh = (id: string) => (live.team === id ? [{ time: ago(now, 0), text: live.text }] : []);

  const TEAMS = [
    {
      id: "marketing", name: "Marketing", status: "active",
      lead: { name: "Nova", role: "Marketing lead: strategy and coordination" },
      members: [{ name: "Echo", role: "Content and social" }, { name: "Pixel", role: "Design and creative" }, { name: "Scout", role: "SEO and communities" }, { name: "Mailer", role: "Newsletter and email" }],
      work: "Goal: 1,000 newsletter sign-ups by the end of the month. Launch campaign, 3 posts a week and 5 creator collaborations.",
      next: "Approve the launch email and next week's post calendar.",
      lines: ["Goal: 1,000 sign-ups", "Launch campaign is live", "3 posts a week", "5 collaborations"],
      pending: [
        { id: "mk-launch-mail", what: "Approve the launch email (version B, single button)", since: ago(now, 3 * H) },
        { id: "mk-calendar", what: "Next week's calendar: 3 posts and 2 stories. Approve?", since: ago(now, 26 * H) },
        { id: "mk-collab", what: "Collaboration with a creator (12K followers) for a free year of access. Approve?", since: iso(now, -5 * H) },
      ],
      usage: "24%",
      goal: { label: "Newsletter sign-ups", current: 612, target: 1000, due: day(now, -18) },
      activity: [...fresh("marketing"),
        { time: ago(now, 40 * MIN), text: "Echo finished 3 drafts of the launch post" },
        { time: ago(now, 2 * H), text: "Pixel uploaded 4 versions of the hero banner" },
        { time: ago(now, 5 * H), text: "Scout found 6 relevant communities to post in" },
        { time: ago(now, 26 * H), text: "Newsletter passed 600 sign-ups" }],
      tasks: [
        { text: "3 drafts of the launch post", state: "doing", owner: "Echo" },
        { text: "Hero banner in two versions", state: "doing", owner: "Pixel" },
        { text: "List of 20 communities and forums", state: "doing", owner: "Scout" },
        { text: "Launch email to the list", state: "todo", owner: "Mailer" },
        { text: "Approve the launch email", state: "todo", owner: "Me" },
        { text: "Last week's post performance review", state: "done", owner: "Nova" },
        { text: "Newsletter landing page", state: "done", owner: "Pixel" },
      ],
      routines: [
        { id: "mk-daily", owner: "Nova", name: "Daily marketing summary", schedule: "Mon–Fri at 09:00", state: "on", lastRun: ago(now, 20 * H), lastResult: "ok", next: iso(now, 4 * H), perWeek: 5 },
        { id: "mk-posts", owner: "Echo", name: "Schedule approved posts", schedule: "Mon, Wed and Fri at 12:00", state: "on", next: iso(now, 21 * H), perWeek: 3 },
        { id: "mk-seo", owner: "Scout", name: "Weekly rankings check", schedule: "Every Sunday at 08:30", state: "on", lastRun: ago(now, 3 * DAY), lastResult: "fail", next: iso(now, 4 * DAY), perWeek: 1, note: "Failed on a rate limit. Will retry on the next run" },
      ],
      botUsage: [{ owner: "Echo", pct: 8 }, { owner: "Nova", pct: 6 }, { owner: "Pixel", pct: 5 }, { owner: "Scout", pct: 3 }, { owner: "Mailer", pct: 2 }],
    },
    {
      id: "product", name: "Product", status: "active",
      lead: { name: "Atlas", role: "Product lead: roadmap and releases" },
      members: [{ name: "Forge", role: "Development and bugs" }, { name: "Lens", role: "Testing and QA" }, { name: "Draft", role: "UX and docs" }],
      work: "Version 2.4: Google sign-in, dark mode and a new settings page. Release planned in 5 days.",
      next: "Decide whether dark mode ships in this version or the next.",
      lines: ["v2.4 in 5 days", "Google sign-in", "Dark mode", "New settings page"],
      pending: [
        { id: "pr-dark", what: "Dark mode: ship in 2.4 (2 more days of work) or move it to 2.5?", since: ago(now, 6 * H) },
        { id: "pr-beta", what: "Open a beta for 50 users before the full release?", since: ago(now, 30 * H) },
      ],
      usage: "21%",
      goal: { label: "Features in v2.4", current: 7, target: 9, due: day(now, -5) },
      activity: [...fresh("product"),
        { time: ago(now, 25 * MIN), text: "Lens passed 42 of 45 tests" },
        { time: ago(now, 3 * H), text: "Forge merged Google sign-in" },
        { time: ago(now, 8 * H), text: "Draft updated the settings screens" }],
      tasks: [
        { text: "Last 3 sign-in tests", state: "doing", owner: "Lens" },
        { text: "Dark mode: colors and components", state: "doing", owner: "Forge" },
        { text: "Settings page docs", state: "doing", owner: "Draft" },
        { text: "Decide on dark mode", state: "todo", owner: "Me" },
        { text: "Release notes for v2.4", state: "todo", owner: "Atlas" },
        { text: "Google sign-in", state: "done", owner: "Forge" },
      ],
      routines: [
        { id: "pr-nightly", owner: "Lens", name: "Nightly automated tests", schedule: "Every night at 02:00", state: "on", lastRun: ago(now, 12 * H), lastResult: "ok", next: iso(now, 11 * H), perWeek: 7 },
        { id: "pr-weekly", owner: "Atlas", name: "Weekly roadmap summary", schedule: "Every Thursday at 16:00", state: "on", next: iso(now, 2 * DAY), perWeek: 1 },
      ],
      botUsage: [{ owner: "Forge", pct: 9 }, { owner: "Lens", pct: 6 }, { owner: "Atlas", pct: 4 }, { owner: "Draft", pct: 2 }],
    },
    {
      id: "nfl", name: "NFL", status: "active",
      lead: { name: "Blitz", role: "NFL lead: weekly game research" },
      members: [{ name: "Tape", role: "Matchups and game film" }, { name: "Snap", role: "Play-by-play numbers" }, { name: "Gauge", role: "Lines and injuries" }],
      work: "Research packets for Thursday, Sunday and Monday games: what each defense allows, who gets the ball, injuries and lines.",
      next: "Approve Monday night's breakdown before it goes out.",
      lines: ["Monday night breakdown", "Sunday slate: 12 games", "Injury report check", "Line movement watch"],
      pending: [
        { id: "nf-mnf", what: "Monday night breakdown is ready. Approve and send?", since: ago(now, 2 * H) },
        { id: "nf-src", what: "Add a second injury source for late scratches. Approve?", since: ago(now, 28 * H) },
      ],
      usage: "15%",
      goal: { label: "Games broken down this week", current: 9, target: 14, due: day(now, -3) },
      activity: [...fresh("nfl"),
        { time: ago(now, 30 * MIN), text: "Tape finished the film notes for Monday night" },
        { time: ago(now, 2 * H), text: "Snap updated the yards-allowed tables for all 32 defenses" },
        { time: ago(now, 6 * H), text: "Gauge flagged a starting guard ruled out" }],
      tasks: [
        { text: "Film notes: Monday night", state: "doing", owner: "Tape" },
        { text: "Yards allowed to tight ends, last 8 games", state: "doing", owner: "Snap" },
        { text: "Line movement since open", state: "doing", owner: "Gauge" },
        { text: "Approve the Monday night breakdown", state: "todo", owner: "Me" },
        { text: "Sunday early-window packets", state: "done", owner: "Snap" },
        { text: "Thursday night recap", state: "done", owner: "Blitz" },
      ],
      routines: [
        { id: "nf-packets", owner: "Snap", name: "Build game packets", schedule: "Tue, Thu, Sat, Sun and Mon mornings", state: "on", lastRun: ago(now, 5 * H), lastResult: "ok", next: iso(now, 19 * H), perWeek: 9 },
        { id: "nf-inactives", owner: "Gauge", name: "Check final inactives", schedule: "90 minutes before each kickoff", state: "on", next: iso(now, 7 * H), perWeek: 5 },
      ],
      botUsage: [{ owner: "Snap", pct: 6 }, { owner: "Tape", pct: 4 }, { owner: "Gauge", pct: 3 }, { owner: "Blitz", pct: 2 }],
    },
    {
      id: "nba", name: "NBA", status: "active",
      lead: { name: "Swish", role: "NBA lead: nightly slate research" },
      members: [{ name: "Dime", role: "Player usage and minutes" }, { name: "Glass", role: "Matchups and pace" }, { name: "Buzzer", role: "Injuries and lines" }],
      work: "Nightly slate research: who is out, who picks up the minutes, pace and matchup notes for every game.",
      next: "Decide whether to track back-to-backs as their own flag.",
      lines: ["Tonight: 8 games", "Minutes with a starter out", "Pace matchups", "Injury report at 5:30"],
      pending: [
        { id: "nb-b2b", what: "Track back-to-back games as a separate flag?", since: ago(now, 4 * H) },
        { id: "nb-late", what: "Re-run tonight's slate after the 5:30 injury report. Approve?", since: iso(now, -1 * H) },
      ],
      usage: "13%",
      goal: { label: "Slates graded this week", current: 4, target: 7, due: day(now, -3) },
      activity: [...fresh("nba"),
        { time: ago(now, 20 * MIN), text: "Buzzer logged two starters ruled out tonight" },
        { time: ago(now, 3 * H), text: "Dime rebuilt the minutes table for the bench" },
        { time: ago(now, 9 * H), text: "Glass graded last night's slate: 6 games" }],
      tasks: [
        { text: "Who gets the minutes with a starter out", state: "doing", owner: "Dime" },
        { text: "Pace notes for tonight's 8 games", state: "doing", owner: "Glass" },
        { text: "Decide on the back-to-back flag", state: "todo", owner: "Me" },
        { text: "Injury report check at 5:30", state: "todo", owner: "Buzzer" },
        { text: "Grade last night's slate", state: "done", owner: "Glass" },
      ],
      routines: [
        { id: "nb-slate", owner: "Swish", name: "Morning slate build", schedule: "Every day at 10:00", state: "on", lastRun: ago(now, 6 * H), lastResult: "ok", next: iso(now, 18 * H), perWeek: 7 },
        { id: "nb-inj", owner: "Buzzer", name: "Evening injury re-check", schedule: "Every day at 17:30", state: "on", lastRun: ago(now, 23 * H), lastResult: "ok", next: iso(now, 90 * MIN), perWeek: 7 },
      ],
      botUsage: [{ owner: "Dime", pct: 5 }, { owner: "Glass", pct: 4 }, { owner: "Buzzer", pct: 2 }, { owner: "Swish", pct: 2 }],
    },
    {
      id: "travel", name: "Travel", status: "active",
      lead: { name: "Atlas Jr.", role: "Travel lead: trips and bookings" },
      members: [{ name: "Jetway", role: "Flights and fares" }, { name: "Passport", role: "Hotels and visas" }],
      work: "Planning the spring trip: fares to Tokyo and Lisbon, hotel shortlists, and a day-by-day plan for each.",
      next: "Pick Tokyo or Lisbon so the fares can be held.",
      lines: ["Tokyo vs Lisbon", "Fare watch: 6 routes", "Hotel shortlist", "Visa check"],
      pending: [
        { id: "tr-pick", what: "Tokyo or Lisbon for the spring trip? Fares can be held for 24 hours.", since: ago(now, 20 * H) },
      ],
      usage: "8%",
      goal: { label: "Trip plan sections done", current: 5, target: 8, due: day(now, -6) },
      activity: [...fresh("travel"),
        { time: ago(now, 50 * MIN), text: "Jetway found a fare drop on the Lisbon route" },
        { time: ago(now, 4 * H), text: "Passport shortlisted 5 hotels in each city" },
        { time: ago(now, 30 * H), text: "Visa check done: no visa needed for either trip" }],
      tasks: [
        { text: "Fare watch on 6 routes", state: "doing", owner: "Jetway" },
        { text: "Day-by-day plan: Tokyo", state: "doing", owner: "Passport" },
        { text: "Pick the destination", state: "todo", owner: "Me" },
        { text: "Hotel shortlist", state: "done", owner: "Passport" },
      ],
      routines: [{ id: "tr-fares", owner: "Jetway", name: "Daily fare check", schedule: "Every day at 07:00", state: "on", lastRun: ago(now, 8 * H), lastResult: "ok", next: iso(now, 16 * H), perWeek: 7 }],
      botUsage: [{ owner: "Jetway", pct: 4 }, { owner: "Passport", pct: 3 }, { owner: "Atlas Jr.", pct: 1 }],
    },
    {
      id: "money", name: "Money Maker", status: "hold",
      lead: { name: "Ledger", role: "Money lead: income ideas and tracking" },
      members: [{ name: "Tally", role: "Income and expense tracking" }, { name: "Hustle", role: "New income ideas" }],
      work: "Tracking this month's income streams and testing two new ones. Waiting for your decision on which to fund.",
      next: "Choose which of the two new ideas gets this month's budget.",
      lines: ["Month to date: 3 streams", "2 new ideas tested", "Waiting on your pick"],
      pending: [
        { id: "mn-pick", what: "Two new income ideas tested. Fund the print-on-demand store or the newsletter sponsorships?", since: ago(now, 4 * DAY) },
      ],
      usage: "6%",
      goal: { label: "Monthly income goal", current: 1840, target: 3000, due: day(now, -18) },
      activity: [...fresh("money"),
        { time: ago(now, 5 * H), text: "Tally posted this week's income: 3 streams, all up" },
        { time: ago(now, 4 * DAY), text: "Hustle finished testing two new ideas. Waiting on your pick" }],
      tasks: [
        { text: "Sponsorship price sheet", state: "todo", owner: "Hustle" },
        { text: "Pick the idea to fund", state: "todo", owner: "Me" },
        { text: "Weekly income report", state: "done", owner: "Tally" },
      ],
      routines: [{ id: "mn-week", owner: "Tally", name: "Weekly income report", schedule: "Every Friday at 17:00", state: "on", next: iso(now, 2 * DAY), perWeek: 1 }],
      botUsage: [{ owner: "Tally", pct: 3 }, { owner: "Hustle", pct: 2 }, { owner: "Ledger", pct: 1 }],
    },
    { id: "legal", name: "Legal", status: "frozen", lead: { name: "Clause", role: "Legal lead" }, members: [{ name: "Draftsman", role: "Contracts" }], work: "Frozen until further notice. Routines are paused.", lines: [], pending: [], activity: [], tasks: [], routines: [{ id: "lg-review", owner: "Clause", name: "Contract review", schedule: "Every Wednesday", state: "paused", perWeek: 1 }] },
    { id: "events", name: "Events", status: "frozen", lead: { name: "Stage", role: "Events lead" }, members: [{ name: "Ticket", role: "Registration and logistics" }], work: "Frozen until further notice.", lines: [], pending: [], activity: [], tasks: [], routines: [] },
    { id: "partners", name: "Partners", status: "frozen", lead: { name: "Bridge", role: "Partnerships lead" }, members: [{ name: "Link", role: "Partner outreach" }], work: "Frozen until further notice.", lines: [], pending: [], activity: [], tasks: [], routines: [] },
  ];

  return {
    UPDATED: `${p.d}.${p.m}.${p.y}, ${pad(p.hh)}:${pad(p.mm)}`,
    USAGE: {
      weeklyPct: 42, reset: `${day(now, -3)}, 18:00`, onDemandPct: 0, period: `${day(now, 4)} to ${day(now, 0)}`,
      byTeam: [{ label: "Marketing", pct: 24 }, { label: "Product", pct: 21 }, { label: "NFL", pct: 15 }, { label: "NBA", pct: 13 }, { label: "Travel", pct: 8 }, { label: "Everyone else", pct: 23 }],
      topBots: [{ label: "Main bot", pct: 14 }, { label: "Product · Forge", pct: 9 }, { label: "Marketing · Echo", pct: 8 }, { label: "NFL · Snap", pct: 6 }, { label: "NBA · Dime", pct: 5 }],
    },
    TEAMS,
  };
}
