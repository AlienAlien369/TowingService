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
  // Streams frames straight into ffmpeg (no PNG sequence on disk): out/<mode>-video.mp4, visually lossless x264.
  const { spawn } = await import("node:child_process");
  const workers = Number(arg ?? 4);
  const total = Math.round(TL.total * TL.fps);
  const cache = path.join(dir, "frames", mode);
  fs.mkdirSync(cache, { recursive: true }); fs.mkdirSync(path.join(dir, "out"), { recursive: true });
  const outFile = path.join(dir, "out", `${mode}-video.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(TL.fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", outFile], { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((r) => ff.on("close", r));
  const ready = new Map();
  let next = 0, written = 0;
  const t0 = Date.now();
  const writer = (async () => {
    while (written < total) {
      if (!ready.has(written)) { await new Promise((r) => setTimeout(r, 20)); continue; }
      const buf = ready.get(written); ready.delete(written);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      written++;
      if (written % 60 === 0) console.log(`${written}/${total} ${(((Date.now() - t0) / written) / 1000).toFixed(2)}s/frame`);
    }
    ff.stdin.end();
  })();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await open();
    while (true) {
      while (next - written > 32) await new Promise((r) => setTimeout(r, 50));
      const i = next++;
      if (i >= total) break;
      const f = path.join(cache, `f${String(i).padStart(5, "0")}.png`);
      let buf = fs.existsSync(f) && fs.statSync(f).size > 1000 ? fs.readFileSync(f) : null;
      if (!buf) {
        await page.evaluate((x) => window.renderAt(x), i / TL.fps);
        buf = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, animations: "disabled" });
      } else fs.unlinkSync(f);
      ready.set(i, buf);
    }
  }));
  await writer; await ffDone;
  console.log("frames done", total);
}
await browser.close();
server.close();
