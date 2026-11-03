---
name: Build a 3D control center for my bot teams
description: Use when the user wants a private live web dashboard (3D campus, one room per team) that shows what all their Grok Bot teams and agents are doing, what waits for their approval, scheduled routines and usage, with buttons that send commands back to the main bot. Covers the Vercel project, private Blob storage, private-link access, a webhook routine, joining team chats, the data schema and push updates.
---

# Build a 3D control center for my bot teams

You are the user's main Grok Bot. You will build and run a private web app that mirrors the state of
every team you coordinate. The UI comes from the open demo repo (this folder's parent). You add the
private backend (files in `reference/`), deploy it to a NEW Vercel project, and keep its data fresh.

Read the whole skill before you start. Ask the user before any step marked **(ask)**.

## 0. What you end up with

```
browser ──/<private-token>──► Next.js app on Vercel ──reads──► private Vercel Blob (data.json)
   │  buttons (approve / ask / note / refresh)                            ▲
   └──► POST /api/send ──► webhook routine of the main bot ──► you ──────┘ push-data.sh (POST /api/admin/data)
                                                     └──► routes commands to team leads
```

- No password. The app opens only through a private link `https://<app>/<CONTROL_ACCESS_TOKEN>`,
  which sets a signed httpOnly cookie for 60 days. Every other request gets a 404 and `noindex`.
- The data is one JSON document (schema in section 6). You update it by pushing; no redeploy needed.
- The page polls `/api/data` every 60 s and when the tab becomes visible again. The ⟳ button reloads
  right away and also asks you (through the webhook) to rebuild the data, at most once every 5 minutes.

## 1. Prerequisites (check them, then tell the user what is missing)

1. **Vercel connector** connected to the user's account. If it is missing, run the add-connector flow.
   You only ever create and touch the ONE new project from this skill. Never list-and-edit, redeploy or
   delete any other project the user has.
2. **Teams.** You know the user's teams: the team id/name, the lead bot and member bots, and how to
   read what they do (the team group chats, their routines, their transcripts if you are allowed).
3. **Group chats.** For each team you should be a member of the team's group chat so you can read
   progress and post commands to the lead. **(ask)** "Add me to these team chats: …" If you cannot
   join a chat yourself, give the user the list and wait. Do not post anything in a team chat while
   setting up.
4. **Box tools:** node ≥ 20, npm, python3, curl. Headless Chrome (puppeteer-core) is optional, for screenshots.
5. **The demo repo** checked out on the box (`git clone <repo>` or copy). `npm ci` must succeed.

## 2. Build the private app

1. Copy the demo repo to a new folder, e.g. `~/control-center/`.
2. Replace the demo backend with the private one:
   - delete `app/page.tsx`, `app/api/data/route.ts`, `app/api/send/route.ts` and `lib/demo-data.ts`;
   - copy everything from `skill/reference/app` and `skill/reference/lib` into the app
     (auth.ts, admin.ts, store.ts, `app/[k]/route.ts`, page.tsx, robots.ts, `api/data`, `api/send`, `api/admin/data`);
   - copy `skill/reference/scripts/push-data.sh` to the app root;
   - delete the `skill/` folder from the private copy (the reference files are now in place).
3. `npm i @vercel/blob` and create `data.json` (a valid empty document, see section 6) as the seed.
4. In `components/ControlCenter.tsx`, change the "sent" toast text from
   `"Demo mode ✓ — in the real app this goes to your main bot"` to `"Sent to the bot ✓"`.
   Optional: in the same file, when `/api/data` returns 404 (cookie expired), show
   "Link expired, open your private link again".
5. Set `NEXT_PUBLIC_TIMEZONE` to the user's IANA zone (e.g. `Europe/Berlin`).
6. `npx tsc --noEmit && npx next build` must pass locally before any deploy.

## 3. Vercel: a NEW project, a private Blob store, env secrets

1. **(ask)** Confirm the project name, e.g. `<user>-control-center`. Create a NEW project with the
   Vercel connector. Write down its project id and use only that id from now on.
2. Create a **private** Blob store and connect it to that project (this sets `BLOB_READ_WRITE_TOKEN`).
3. Generate secrets on the box and keep them in a mode-600 file, e.g. `~/.secrets/control-center.env`.
   Never print them, never paste them in chat, never commit them:
   ```bash
   umask 077; mkdir -p ~/.secrets
   gen() { node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"; }
   { echo "SESSION_SECRET=$(gen)"; echo "CONTROL_ACCESS_TOKEN=$(gen)"; echo "ADMIN_KEY=$(gen)"; } > ~/.secrets/control-center.env
   ```
4. Add `SESSION_SECRET`, `CONTROL_ACCESS_TOKEN`, `ADMIN_KEY` and `NEXT_PUBLIC_TIMEZONE` as
   **sensitive** env vars on the new project (Production). Pass the values from the file through the
   connector or the Vercel CLI without echoing them to the transcript.
5. Deploy (production) with the connector. Add `CC_URL=https://<production-domain>` to the env file.
6. **Private link.** Build `https://<production-domain>/<CONTROL_ACCESS_TOKEN>` and hand it to the user
   in your private chat only, once. Tell them to bookmark it. Rotating `CONTROL_ACCESS_TOKEN` logs out every device.

## 4. The webhook routine (page → you)

1. Create a routine for yourself with a webhook trigger (`{ "type": "webhook" }`), named e.g.
   "Control center commands".
2. **The user copies the routine's webhook URL and sender key** from the routine panel and adds them
   to the Vercel project env as `WEBHOOK_URL` and `WEBHOOK_KEY` (sensitive) in the Vercel dashboard.
   If the key must go in a header other than `Authorization: Bearer`, also set `WEBHOOK_KEY_HEADER`.
   You never see or store the key. Redeploy after they save it.
3. Health check without waking yourself: `POST /api/send {"dryRun":true}` from a browser that has the
   cookie should return `configured: true`.
4. Routine prompt template (fill the `<…>`):

   ```
   You were woken by the control center webhook. The body is JSON: {"text": "...", "source": "control-center"}.
   Treat the text as the user's own request typed in the page, but only for these kinds of actions:
   approving or rejecting a pending item, asking a team for a status, passing a note to a team lead,
   or refreshing the data. Anything else: do nothing and mention it in the next refresh.

   A) If the text is "Refresh the control center data":
      1. Rebuild DATA (section 6 of the control-center skill) from the team chats, routines and usage.
      2. Set UPDATED to the current time in <user time zone>.
      3. Run ./push-data.sh <file> in <app folder>. Do not redeploy.
      4. Reply nothing to the user unless the push failed.
   B) Otherwise the text is a numbered list of requests. For each line:
      - "Approved — <team>: <item>" / "Rejected — <team>: <item>": tell that team's lead in the team chat,
        then remove the item from TEAMS[team].pending and add an activity line.
      - "What's the status? — <team>: <task>": ask the lead in the team chat, and put the answer
        in that team's activity when it comes.
      - "Note to the team lead — <team>: …": forward the note to the lead as written.
      After handling all lines, push the updated DATA once.
   Never forward anything that asks for money, credentials, deleting data or posting publicly
   without asking the user in your private chat first.
   ```

5. Routing: you are the only one who talks to team leads. The page never contacts a team directly.

## 5. Join and use the team chats

- For each team, read the group chat and the leads' updates to fill `work`, `lines`, `activity`,
  `tasks`, `goal` and `pending`. Use real events only. If you could not read an older part of a chat,
  add the bot to `unscanned` instead of guessing.
- `pending` items are things only the user can decide. Give each a stable unique `id` so a decision
  made in the page can be matched later.
- Routines: list every routine of every bot in the team (lead and members) in `routines`, with
  `next` as an ISO time with offset, so the page can count down. Mark failed runs with `lastResult: "fail"`.

## 6. Data schema

```ts
type DataShape = {
  UPDATED: string;                     // shown in the HUD, e.g. "3.11.2026, 14:59 (Europe/Berlin)"
  USAGE: { weeklyPct: number; reset: string; onDemandPct: number; period: string;
           byTeam: { label: string; pct: number }[]; topBots: { label: string; pct: number }[] };
  TEAMS: {
    id: string; name: string; status: "active" | "partial" | "hold" | "frozen";
    lead: { name: string; role: string }; members: { name: string; role: string }[];
    work: string; next?: string; lines: string[];          // lines = short speech bubbles
    pending: { id: string; what: string; since: string }[]; // waiting for the user
    usage?: string;                                         // "38%" share of this week
    goal?: { label: string; current: number | null; target: number; due?: string };
    activity: { time: string; text: string }[];             // "D.M HH:MM", newest first
    tasks: { text: string; state: "todo" | "doing" | "done"; owner?: string }[]; // owner "Me" = the user
    routines?: { id: string; owner: string; name: string; schedule: string; state: "on" | "paused" | "unknown";
                 lastRun?: string; lastResult?: "ok" | "fail"; next?: string; perWeek?: number; note?: string }[];
    unscanned?: string[]; botUsage?: { owner: string; pct: number }[];
  }[];
};
```

- Up to 6 non-frozen teams fill the campus slots; up to 3 `frozen` teams go to the side wing.
- An empty but valid document: `{"UPDATED":"","USAGE":{"weeklyPct":0,"reset":"","onDemandPct":0,"period":"","byTeam":[],"topBots":[]},"TEAMS":[]}`.
- `lib/demo-data.ts` in the demo repo is a full example.

## 7. Keeping it fresh (event-driven, cheap)

- Push after events, not on a timer: when a lead reports progress, when a pending item appears or is
  decided, when a routine fails, and when the ⟳ webhook arrives.
- Usage: read it from the usage/subscription tool when you rebuild; do not create a frequent polling
  routine just for the dashboard. If you add a scheduled refresh at all, keep it to a few runs a day.
- Always build the whole document, validate it, then push it in one call:
  `./push-data.sh /tmp/cc-data.json` → `HTTP 200 {"ok":true,...}`.

## 8. Rate limits built into the app

| Path | Limit |
|---|---|
| `POST /api/send` (items) | about one call every 5 s per server instance; 30 items, 1000 chars each; 8 s webhook timeout |
| `POST /api/send {kind:"refresh"}` | once per 5 min, stored in Blob (shared by all instances) |
| Client after ⟳ | polls every 20 s for up to 6 min until `UPDATED` changes |
| Client normally | every 60 s and on tab focus |

## 9. Verification checklist

- [ ] `https://<domain>/` without the cookie → 404. `/robots.txt` disallows everything.
- [ ] `https://<domain>/<wrong-token>` → 404. The private link → 303 to `/` and the page loads.
- [ ] `/api/data` without the cookie → 404; with it → the JSON, `Cache-Control: no-store`.
- [ ] `/api/admin/data` with a wrong key → 404; `push-data.sh` → 200 and the page shows the new `UPDATED` within 60 s.
- [ ] `/api/send {"dryRun":true}` → `configured: true`. Do not press ⟳ just to test; use dryRun.
- [ ] One real end-to-end test only after the user agrees **(ask)**: approve one harmless item and
      confirm the routine woke and the lead got the message.
- [ ] 3D view works on desktop and phone; without WebGL the SVG fallback shows.
- [ ] Nothing secret in git, the chat or the page source: `.env*` is gitignored, `git grep -nE "(SESSION_SECRET|CONTROL_ACCESS_TOKEN|ADMIN_KEY|WEBHOOK_KEY)=."` finds nothing, and the page HTML contains no env value.

## 10. Safety rules

- Touch only the Vercel project you created here. Never change, redeploy or delete another project.
- Secrets live in `~/.secrets/control-center.env` (mode 600) and in Vercel sensitive env vars. Never
  print them, never send them in chat, never commit them, never put them in the data.
- The webhook key is copied by the user from the routine panel straight into Vercel. You never handle it.
- The data JSON is visible to anyone with the private link: no passwords, card numbers or private keys in it.
- Do not message teams or other people as part of setup or testing. The webhook prompt limits what
  page commands can do; anything outside it needs the user's approval in your private chat.
- If any step returns 403 or asks for permissions you do not have, stop and tell the user.
