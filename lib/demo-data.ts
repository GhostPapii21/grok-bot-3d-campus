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
  { team: "sales", text: "New demo booked for Thursday at 11:00" },
  { team: "support", text: "Average response time is down to 14 minutes" },
  { team: "research", text: "Summary of 12 user interviews is ready to read" },
  { team: "finance", text: "This month's expense report is ready for your approval" },
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
      id: "sales", name: "Sales", status: "active",
      lead: { name: "Vega", role: "Sales lead: leads and demos" },
      members: [{ name: "Hunter", role: "Lead research" }, { name: "Pitch", role: "Decks and quotes" }, { name: "Closer", role: "Follow-ups" }],
      work: "Goal: 10 demos this month. 40 new leads on the list, 6 demos already booked.",
      next: "Approve the quote for the big account and the follow-up template.",
      lines: ["6 of 10 demos", "40 new leads", "Quote waiting", "Follow up after 3 days"],
      pending: [
        { id: "sl-quote", what: "Quote for 25 seats at 15% off. Approve and send?", since: ago(now, 2 * H) },
        { id: "sl-template", what: "New post-demo follow-up email template. Approve?", since: ago(now, 50 * H) },
      ],
      usage: "15%",
      goal: { label: "Demos this month", current: 6, target: 10, due: day(now, -12) },
      activity: [...fresh("sales"),
        { time: ago(now, 55 * MIN), text: "Hunter added 12 leads from logistics" },
        { time: ago(now, 4 * H), text: "Pitch prepared a custom deck for tomorrow's demo" },
        { time: ago(now, 28 * H), text: "Sixth demo of the month booked" }],
      tasks: [
        { text: "Research 20 more leads", state: "doing", owner: "Hunter" },
        { text: "Deck for tomorrow's demo", state: "doing", owner: "Pitch" },
        { text: "Follow up on 4 demos from this week", state: "todo", owner: "Closer" },
        { text: "Approve the quote", state: "todo", owner: "Me" },
        { text: "First list of 40 leads", state: "done", owner: "Hunter" },
      ],
      routines: [
        { id: "sl-leads", owner: "Hunter", name: "Daily lead search", schedule: "Mon–Fri at 10:00", state: "on", lastRun: ago(now, 22 * H), lastResult: "ok", next: iso(now, 2 * H + 15 * MIN), perWeek: 5 },
        { id: "sl-follow", owner: "Closer", name: "Follow-up reminders", schedule: "Every day at 17:00", state: "paused", perWeek: 5, note: "Paused until the new template is approved" },
      ],
      botUsage: [{ owner: "Hunter", pct: 7 }, { owner: "Pitch", pct: 4 }, { owner: "Vega", pct: 3 }, { owner: "Closer", pct: 1 }],
    },
    {
      id: "support", name: "Support", status: "partial",
      lead: { name: "Harbor", role: "Support lead: tickets and satisfaction" },
      members: [{ name: "Relay", role: "Ticket replies" }, { name: "Index", role: "Knowledge base and FAQ" }],
      work: "Replies within an hour. 9 open tickets, 3 of them about sign-in.",
      next: "Approve 4 new FAQ answers.",
      lines: ["9 open tickets", "Replies in 14 min", "4 new FAQ answers"],
      pending: [
        { id: "sp-faq", what: "4 new FAQ answers. Publish?", since: ago(now, 5 * H) },
        { id: "sp-refund", what: "A customer asks for a refund for an unused month. Approve the refund?", since: ago(now, 75 * MIN) },
      ],
      usage: "9%",
      activity: [...fresh("support"),
        { time: ago(now, 35 * MIN), text: "Relay closed 5 tickets this morning" },
        { time: ago(now, 6 * H), text: "Index wrote 4 new FAQ answers" }],
      tasks: [
        { text: "Reply to 9 open tickets", state: "doing", owner: "Relay" },
        { text: "Update the sign-in FAQ", state: "doing", owner: "Index" },
        { text: "Decide on the refund request", state: "todo", owner: "Me" },
        { text: "Weekly ticket summary", state: "done", owner: "Harbor" },
      ],
      routines: [
        { id: "sp-inbox", owner: "Relay", name: "Check the support inbox", schedule: "Hourly during work hours", state: "on", lastRun: ago(now, 40 * MIN), lastResult: "ok", next: iso(now, 20 * MIN), perWeek: 45, note: "Runs a lot. Could move to every 2 hours" },
      ],
      botUsage: [{ owner: "Relay", pct: 6 }, { owner: "Index", pct: 2 }, { owner: "Harbor", pct: 1 }],
    },
    {
      id: "research", name: "Research", status: "active",
      lead: { name: "Orbit", role: "Research lead: users and market" },
      members: [{ name: "Probe", role: "User interviews" }, { name: "Chart", role: "Data and analysis" }],
      work: "12 user interviews about onboarding and a competitor review of 5 similar products.",
      next: "Read the interview summary and pick 3 improvements for the quarter.",
      lines: ["12 interviews", "5 competitors", "3 improvements this quarter"],
      pending: [{ id: "rs-top3", what: "Pick 3 of the 8 improvements from the interviews", since: ago(now, 20 * H) }],
      usage: "8%",
      activity: [...fresh("research"),
        { time: ago(now, 90 * MIN), text: "Chart finished a comparison table of 5 competitors" },
        { time: ago(now, 9 * H), text: "Probe finished interview 12 of 12" }],
      tasks: [
        { text: "Competitor comparison table", state: "done", owner: "Chart" },
        { text: "Interview summary", state: "doing", owner: "Probe" },
        { text: "Onboarding drop-off chart", state: "doing", owner: "Chart" },
        { text: "Pick 3 improvements", state: "todo", owner: "Me" },
      ],
      routines: [{ id: "rs-trends", owner: "Orbit", name: "Weekly trends review", schedule: "Every Monday at 09:30", state: "on", next: iso(now, 3 * DAY + 2 * H), perWeek: 1 }],
      botUsage: [{ owner: "Chart", pct: 4 }, { owner: "Probe", pct: 3 }, { owner: "Orbit", pct: 1 }],
    },
    {
      id: "finance", name: "Finance", status: "hold",
      lead: { name: "Ledger", role: "Finance lead: budget and reports" },
      members: [{ name: "Tally", role: "Expenses and invoices" }, { name: "Forecast", role: "Forecasts and cash flow" }],
      work: "Waiting for approval of this month's expense report before the quarterly forecast.",
      next: "Approve the expense report.",
      lines: ["Expense report ready", "Waiting for approval", "Quarterly forecast next"],
      pending: [{ id: "fn-report", what: "This month's expense report: 14 invoices, 2 exceptions. Approve?", since: ago(now, 4 * DAY) }],
      usage: "6%",
      activity: [...fresh("finance"), { time: ago(now, 4 * DAY), text: "Tally finished the expense report" }],
      tasks: [
        { text: "Quarterly cash-flow forecast", state: "todo", owner: "Forecast" },
        { text: "Approve the expense report", state: "todo", owner: "Me" },
        { text: "Monthly expense report", state: "done", owner: "Tally" },
      ],
      routines: [{ id: "fn-month", owner: "Ledger", name: "Month-end close", schedule: "On the 1st of every month at 08:00", state: "on", next: iso(now, 9 * DAY), perWeek: 0.25 }],
      botUsage: [{ owner: "Tally", pct: 3 }, { owner: "Ledger", pct: 2 }, { owner: "Forecast", pct: 1 }],
    },
    { id: "legal", name: "Legal", status: "frozen", lead: { name: "Clause", role: "Legal lead" }, members: [{ name: "Draftsman", role: "Contracts" }], work: "Frozen until further notice. Routines are paused.", lines: [], pending: [], activity: [], tasks: [], routines: [{ id: "lg-review", owner: "Clause", name: "Contract review", schedule: "Every Wednesday", state: "paused", perWeek: 1 }] },
    { id: "events", name: "Events", status: "frozen", lead: { name: "Stage", role: "Events lead" }, members: [{ name: "Ticket", role: "Registration and logistics" }], work: "Frozen until further notice.", lines: [], pending: [], activity: [], tasks: [], routines: [] },
    { id: "partners", name: "Partners", status: "frozen", lead: { name: "Bridge", role: "Partnerships lead" }, members: [{ name: "Link", role: "Partner outreach" }], work: "Frozen until further notice.", lines: [], pending: [], activity: [], tasks: [], routines: [] },
  ];

  return {
    UPDATED: `${p.d}.${p.m}.${p.y}, ${pad(p.hh)}:${pad(p.mm)}`,
    USAGE: {
      weeklyPct: 42, reset: `${day(now, -3)}, 18:00`, onDemandPct: 0, period: `${day(now, 4)} to ${day(now, 0)}`,
      byTeam: [{ label: "Marketing", pct: 24 }, { label: "Product", pct: 21 }, { label: "Sales", pct: 15 }, { label: "Support", pct: 9 }, { label: "Research", pct: 8 }, { label: "Everyone else", pct: 23 }],
      topBots: [{ label: "Main bot", pct: 14 }, { label: "Product · Forge", pct: 9 }, { label: "Marketing · Echo", pct: 8 }, { label: "Sales · Hunter", pct: 7 }, { label: "Support · Relay", pct: 6 }],
    },
    TEAMS,
  };
}
