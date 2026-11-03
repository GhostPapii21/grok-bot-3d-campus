// Time zone used for every time shown on the page (set NEXT_PUBLIC_TIMEZONE, e.g. "America/New_York").
// Without it, the viewer's own time zone is used (the page renders in the browser only).
const viewerTz = () => { try { return typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""; } catch (e) { return ""; } };
export const TZ = process.env.NEXT_PUBLIC_TIMEZONE || viewerTz() || "UTC";
