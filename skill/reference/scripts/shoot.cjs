// Screenshots of the control center (or the public demo) for the visual check.
// Usage:
//   node shoot.cjs https://grok-bot-3d-campus-demo.vercel.app <out-dir>     # the reference demo
//   node shoot.cjs --private <out-dir>                                        # your own deployment
// --private reads CC_URL and CONTROL_ACCESS_TOKEN from ~/.secrets/control-center.env and never prints them.
// Needs puppeteer-core (npm i puppeteer-core) and Chrome/Chromium (CHROME env var, default /usr/bin/google-chrome).
const fs = require("fs"), os = require("os"), path = require("path");
const p = require("puppeteer-core");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let [, , url, out] = process.argv;
if (url === "--private") {
  const env = Object.fromEntries(fs.readFileSync(path.join(os.homedir(), ".secrets/control-center.env"), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
  url = `${env.CC_URL}/${env.CONTROL_ACCESS_TOKEN}`; // sets the cookie, then redirects to /
}
if (!url || !out) { console.log("usage: node shoot.cjs <url|--private> <out-dir>"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const clickText = (pg, t) => pg.evaluate((t) => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(t)); if (b) { b.click(); return true; } return false; }, t);
(async () => {
  const b = await p.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: "new",
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
  const done = [];
  for (const [w, h, mob] of [[1440, 900, false], [998, 1024, false], [390, 844, true]]) {
    const tag = `${w}x${h}`;
    const pg = await b.newPage();
    await pg.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
    await pg.goto(url, { waitUntil: "networkidle2" }); await wait(6000);
    const shot = async (n) => { const f = path.join(out, `${n}_${tag}.png`); await pg.screenshot({ path: f }); done.push(path.basename(f)); };
    await shot("campus_home");
    await pg.keyboard.press("1"); await wait(2200); await shot("room_closeup");
    await pg.keyboard.press("Enter"); await wait(2800); await shot("room_interior");
    await clickText(pg, "📝 Tasks"); await wait(1200); await shot("room_wall_zoom");
    await pg.close();
  }
  await b.close();
  console.log("saved:", done.join(", ")); // file names only, never the URL
})();
