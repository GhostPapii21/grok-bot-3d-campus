# Grok Bot Control Center (demo)

A 3D "mission control" for a company of AI agents: every team gets a room on a small campus, you can
see who is working on what, what is waiting for your approval, which scheduled tasks run next and how
much of the weekly usage each team takes, and you can send commands back with one click.

**Built with Grok Bot.** The real version runs privately and is fed by the owner's main Grok Bot, which
coordinates 9 teams of bots. This repo is a **demo with invented data**: the teams, agents, tasks,
approvals and numbers are all made up, and no button contacts anything.

![Campus](screenshots/demo_home_1440x900.png)

| Inside a team room | Approvals and a sent command |
|---|---|
| ![Room](screenshots/demo_inroom_1440x900.png) | ![Sent](screenshots/demo_sent_1440x900.png) |

| Tablet / foldable (884×1104) | Phone (390×844) |
|---|---|
| ![Fold](screenshots/demo_home_884x1104.png) | ![Phone](screenshots/demo_home_390x844.png) |

## Features

- **3D campus** (three.js): one room per active team, a side wing for frozen teams, orbit/zoom, minimap,
  keyboard shortcuts (`1–9` rooms, `/` search, `Esc` back, `?` help). SVG fallback when WebGL is missing.
- **Team rooms**: walk in and look around. Lead and member bots at their desks, a task board
  (to do / in progress / done), a live activity screen, a goal gauge, a usage battery and a
  scheduled-tasks panel with live countdowns and failure alerts.
- **Approvals tray**: approve, reject or ask about any pending item; queue several and send them
  together. In the real app they go to the main bot through a webhook; here you get a "demo mode" toast.
- **Live feed and HUD**: in-progress list, approvals window, usage %, next routines, "what changed
  since your last visit".
- **Refresh**: ⟳ reloads the data now and, in the real app, asks the bot to rebuild it (at most once
  every 5 minutes), then polls until the new data lands. In the demo the data changes every minute.
- Responsive: desktop, foldables and phones.

## Run locally

Requires Node 20+.

```bash
npm ci
npm run dev                # http://localhost:3000
# or a production build:
npm run build && npm start
```

Optional: `NEXT_PUBLIC_TIMEZONE=Europe/Berlin npm run dev` to show times in your zone (default UTC).

## Demo vs. the real thing

| | Demo (this repo) | Real app |
|---|---|---|
| Data | `lib/demo-data.ts`, generated relative to now | JSON in a private Vercel Blob, pushed by the main bot |
| Access | open | private link `/<token>` → signed httpOnly cookie, everything else 404 |
| Buttons | "demo mode" toast | `POST /api/send` → the bot's webhook routine → team leads |
| Refresh | reloads demo data | reload + webhook "refresh" (once per 5 min) + polling |

## Build your own

[`skill/SKILL.md`](skill/SKILL.md) is a skill you can give your own main Grok Bot. It walks the bot
through creating a new Vercel project and private Blob store, the private-link access, a webhook
routine (with a prompt template), joining your team chats, the data schema, the push script, rate
limits, a verification checklist and safety rules. `skill/reference/` holds the backend files it uses.

## Tech

Next.js 16, React 19, three.js 0.187. No backend services in the demo.

## License

Not chosen yet. Until a LICENSE file is added, all rights are reserved.
