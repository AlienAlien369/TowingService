// Builds timeline.json: scene start/length snapped to the music beat grid, VO placement, karaoke word timings.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = import.meta.dirname;
const BPM = 128;
const BEAT = 60 / BPM;
const vo = JSON.parse(fs.readFileSync(path.join(dir, "audio/vo.json"), "utf8"));
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(dir, "audio", f)]).toString().trim());

const cfg = {
  hook: { pre: 0.5, tail: 0.35, min: 10 },
  pain: { pre: 0.1, tail: 0.5, min: 8 },
  brand: { pre: 0.9, tail: 0.5, min: 10 },
  book: { pre: 0.15, tail: 0.5, min: 12 },
  track: { pre: 0.15, tail: 0.5, min: 12 },
  pay: { pre: 0.15, tail: 0.4, min: 9 },
  biz: { pre: 0.15, tail: 0.4, min: 13 },
  payoff: { pre: 0.2, tail: 0.5, min: 8 },
  cta: { pre: 0.3, tail: 1.6, min: 12 },
};

let t = 0;
const scenes = vo.map((v) => {
  const c = cfg[v.key];
  const d = dur(`${v.key}.mp3`);
  const beats = Math.max(c.min, Math.ceil((c.pre + d + c.tail) / BEAT));
  const len = beats * BEAT;
  const s = {
    id: v.key,
    start: t,
    len,
    voStart: t + c.pre,
    voDur: d,
    words: v.words.map((w, i) => ({ text: v.rom[i], start: t + c.pre + w.start, end: t + c.pre + w.end })),
  };
  t += len;
  return s;
});
const out = { bpm: BPM, beat: BEAT, total: t, fps: 30, scenes };
fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(out, null, 1));
for (const s of scenes) console.log(s.id.padEnd(7), "start", s.start.toFixed(2).padStart(6), "len", s.len.toFixed(2), "vo", s.voStart.toFixed(2), "→", (s.voStart + s.voDur).toFixed(2));
console.log("TOTAL", t.toFixed(2), "s =", Math.round(t * 30), "frames");
