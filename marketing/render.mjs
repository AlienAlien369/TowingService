// Renders the composition to PNG frames. Usage:
//   node render.mjs test <mode> <dpr> t1,t2,...     -> frames/test-<mode>-<t>.png
//   node render.mjs full <mode> <dpr> [workers]     -> frames/<mode>/f000000.png ...
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { serve } from "./serve.mjs";

const [cmd, mode = "land", dprArg = "1", arg] = process.argv.slice(2);
const dpr = Number(dprArg);
const dir = import.meta.dirname;
const PORT = 3300 + Math.floor(Math.random() * 500);
const server = await serve(PORT);
const TL = JSON.parse(fs.readFileSync(path.join(dir, "timeline.json"), "utf8"));
const W = mode === "land" ? 1920 : 1080, H = mode === "land" ? 1080 : 1920;
const browser = await chromium.launch({ channel: "chrome", args: ["--force-color-profile=srgb", "--disable-gpu-vsync", "--font-render-hinting=none"] });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("PAGEERR", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("CONSOLE", m.text()));
  await page.goto(`http://localhost:${PORT}/?mode=${mode}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  return page;
}

if (cmd === "test") {
  const page = await open();
  fs.mkdirSync(path.join(dir, "frames"), { recursive: true });
  for (const t of arg.split(",").map(Number)) {
    await page.evaluate((x) => window.renderAt(x), t);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, `frames/test-${mode}-${t}.png`), clip: { x: 0, y: 0, width: W, height: H } });
    console.log("shot", t);
  }
} else {
  const workers = Number(arg ?? 4);
  const total = Math.round(TL.total * TL.fps);
  const out = path.join(dir, "frames", mode);
  fs.mkdirSync(out, { recursive: true });
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await open();
    while (true) {
      const i = next++;
      if (i >= total) break;
      const f = path.join(out, `f${String(i).padStart(5, "0")}.png`);
      if (!fs.existsSync(f)) {
        await page.evaluate((x) => window.renderAt(x), i / TL.fps);
        await page.screenshot({ path: f, clip: { x: 0, y: 0, width: W, height: H }, animations: "disabled" });
      }
      if (++done % 60 === 0) console.log(`${done}/${total} ${(((Date.now() - t0) / done) / 1000).toFixed(2)}s/frame`);
    }
  }));
  console.log("frames done", total);
}
await browser.close();
server.close();
