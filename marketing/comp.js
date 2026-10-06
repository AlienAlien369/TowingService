// RoadSaathi demo film — deterministic composition. window.renderAt(t) draws any frame; nothing depends on wall-clock time.
const Q = new URLSearchParams(location.search);
const LAND = Q.get("mode") !== "port";
const W = LAND ? 1920 : 1080;
const H = LAND ? 1080 : 1920;
document.documentElement.style.setProperty("--W", W + "px");
document.documentElement.style.setProperty("--H", H + "px");
const stage = document.getElementById("stage");
const INK = "#14161A", BRAND = "#FFC400", RED = "#E5484D", GREEN = "#17935A";
const BRANDNAME = Q.get("brand") || "RoadSaathi";
const URLTEXT = Q.get("url") || "towingservice.vercel.app";

// ───────── math & helpers ─────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  lin: (t) => t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  elastic: (t) => { if (t === 0 || t === 1) return t; const c = (2 * Math.PI) / 3; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1; },
};
const seg = (t, a, b, e = E.out) => e(clamp((t - a) / (b - a)));
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

function h(tag, o = {}, parent = stage) {
  const e = document.createElement(tag);
  if (o.cls) e.className = o.cls;
  if (o.html != null) e.innerHTML = o.html;
  if (o.css) Object.assign(e.style, o.css);
  if (o.src) e.src = o.src;
  parent.appendChild(e);
  return e;
}
const show = (e, on) => { const d = on ? e._d || "block" : "none"; if (e.style.display !== d) e.style.display = d; };
const A = (css) => ({ position: "absolute", ...css });
function tf(e, { x = 0, y = 0, s = 1, r = 0, o = 1 }) { e.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`; e.style.opacity = o; }
function popIn(e, t, t0, { dur = 0.42, from = 0.55, y = 0, x = 0, r = 0, ease = E.back } = {}) {
  const p = clamp((t - t0) / dur);
  if (p <= 0) { e.style.opacity = 0; return 0; }
  const k = ease(p);
  tf(e, { x: x * (1 - k), y: y * (1 - k), s: lerp(from, 1, k), r: r * (1 - k), o: clamp(p * 4) });
  return p;
}

// ───────── load data, images, fonts ─────────
const TL = await (await fetch("/timeline.json")).json();
const SC = Object.fromEntries(TL.scenes.map((s) => [s.id, s]));
const IMGS = ["book-1-service", "book-2-locations", "book-3-fare", "track", "invoice", "admin-dispatch", "admin-payments", "driver-contract", "m-book-1-service", "m-book-2-locations", "m-book-3-fare", "m-track", "m-track-2", "m-invoice", "m-driver-offer"];
await Promise.all(IMGS.map(async (n) => { const i = new Image(); i.src = `/screens/${n}.png`; await i.decode(); }));
await Promise.all(['800 100px "Barlow Condensed"', '700 40px "Barlow Condensed"', '600 40px "Barlow Condensed"', "400 30px Inter", "700 30px Inter", '700 30px "Noto Deva"'].map((f) => document.fonts.load(f)));
await document.fonts.ready;

// ───────── reusable pieces ─────────
const ASP_D = 2160 / 3840, ASP_M = 3376 / 1560;
function mkView(parent, w, hh, name, asp) {
  const box = h("div", { css: A({ width: w + "px", height: hh + "px", overflow: "hidden", background: "#fff" }) }, parent);
  const img = h("img", { src: `/screens/${name}.png`, css: A({ left: 0, top: 0, transformOrigin: "0 0" }) }, box);
  Object.assign(box, { _w: w, _h: hh, _asp: asp, _img: img });
  return box;
}
function setSrc(view, name) { view._img.src = `/screens/${name}.png`; }
function pan(view, scale, fx, fy) {
  const iw = view._w * scale, ih = iw * view._asp;
  let tx = view._w / 2 - fx * iw, ty = view._h / 2 - fy * ih;
  tx = clamp(tx, Math.min(0, view._w - iw), 0);
  ty = clamp(ty, Math.min(0, view._h - ih), 0);
  Object.assign(view._img.style, { width: iw + "px", height: ih + "px", transform: `translate(${tx}px,${ty}px)` });
}
function browser(parent, w, name, urlTxt, x, y) {
  const barH = Math.round(w * 0.028), vh = w * ASP_D;
  const root = h("div", { css: A({ left: x + "px", top: y + "px", width: w + "px", height: vh + barH + "px", borderRadius: Math.round(w * 0.014) + "px", overflow: "hidden", background: "#fff", boxShadow: "0 50px 140px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.1)" }) }, parent);
  const bar = h("div", { css: A({ left: 0, top: 0, width: "100%", height: barH + "px", background: "#23262d", display: "flex", alignItems: "center", gap: barH * 0.28 + "px", padding: `0 ${barH * 0.55}px` }) }, root);
  for (const c of ["#ff5f57", "#febc2e", "#28c840"]) h("i", { css: { width: barH * 0.3 + "px", height: barH * 0.3 + "px", borderRadius: "50%", background: c, display: "block" } }, bar);
  h("div", { html: urlTxt, css: { marginLeft: barH * 0.4 + "px", flex: 1, height: barH * 0.62 + "px", lineHeight: barH * 0.62 + "px", background: "#14161a", borderRadius: "999px", padding: `0 ${barH * 0.4}px`, fontSize: barH * 0.36 + "px", color: "#9aa0a8", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" } }, bar);
  const view = mkView(root, w, vh, name, ASP_D);
  view.style.top = barH + "px";
  return { root, view, w, h: vh + barH, barH };
}
function phone(parent, w, name, x, y) {
  const sw = w - 26, sh = sw * ASP_M;
  const root = h("div", { css: A({ left: x + "px", top: y + "px", width: w + "px", height: sh + 26 + "px", borderRadius: w * 0.105 + "px", background: "#0b0c0f", boxShadow: "0 60px 150px rgba(0,0,0,.65), 0 0 0 3px #2c2f36, inset 0 0 0 2px #1b1d22" }) }, parent);
  const scr = h("div", { css: A({ left: "13px", top: "13px", width: sw + "px", height: sh + "px", borderRadius: w * 0.085 + "px", overflow: "hidden" }) }, root);
  const view = mkView(scr, sw, sh, name, ASP_M);
  h("div", { css: A({ left: "50%", top: "22px", width: w * 0.26 + "px", height: w * 0.05 + "px", marginLeft: -w * 0.13 + "px", borderRadius: "999px", background: "#0b0c0f" }) }, root);
  return { root, view, w, h: sh + 26 };
}
function pill(parent, text, { bg = BRAND, fg = INK, size = 44, icon = "✓" } = {}) {
  const e = h("div", { cls: "disp", html: `<span style="display:inline-grid;place-items:center;width:${size * 1.05}px;height:${size * 1.05}px;border-radius:50%;background:${fg};color:${bg};font-size:${size * 0.68}px;margin-right:${size * 0.35}px;flex:none">${icon}</span><span>${text}</span>`, css: A({ display: "flex", alignItems: "center", padding: `${size * 0.26}px ${size * 0.7}px ${size * 0.26}px ${size * 0.26}px`, borderRadius: "999px", background: bg, color: fg, fontSize: size + "px", whiteSpace: "nowrap", boxShadow: "0 16px 44px rgba(0,0,0,.35)" }) }, parent);
  e._d = "flex";
  return e;
}
const MARK = (s) => `<svg viewBox="0 0 40 40" width="${s}" height="${s}"><rect width="40" height="40" rx="10" fill="${BRAND}"/><path d="M0 31 L9 40 H0Z M13 25 L28 40 H18 L13 35Z" fill="${INK}" opacity=".1"/><circle cx="20" cy="9.5" r="3.4" fill="none" stroke="${INK}" stroke-width="3"/><path d="M20 13v12.5a5.5 5.5 0 1 1-5.5-5.5" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M12 21.2l3.3-1.9-.3 3.8z" fill="${INK}"/></svg>`;
const hazardBg = (a = BRAND, b = INK, s = 40) => `repeating-linear-gradient(-45deg, ${a} 0 ${s}px, ${b} ${s}px ${s * 2}px)`;

// ───────── scene scaffolding ─────────
const content = h("div", { css: A({ inset: 0 }) });
const scenes = [];
function scn(id, build) {
  const sc = SC[id];
  const root = h("div", { css: A({ inset: 0, display: "none", overflow: "hidden" }) }, content);
  const upd = build(root, sc);
  scenes.push({ id, sc, root, upd });
}

// ═════════════════ 1. HOOK ═════════════════
scn("hook", (root, sc) => {
  h("div", { css: A({ inset: 0, background: "linear-gradient(180deg,#04050a 0%,#0b0d15 58%,#14161a 100%)" }) }, root);
  const red = h("div", { css: A({ inset: 0, background: "radial-gradient(ellipse at 8% 45%, rgba(229,72,77,.85), transparent 55%)" }) }, root);
  const blue = h("div", { css: A({ inset: 0, background: "radial-gradient(ellipse at 92% 45%, rgba(64,112,255,.75), transparent 55%)" }) }, root);
  const roadH = H * (LAND ? 0.24 : 0.2);
  const road = h("div", { css: A({ left: 0, bottom: 0, width: "100%", height: roadH + "px", background: "#090a0e", overflow: "hidden" }) }, root);
  const dash = h("div", { css: A({ left: "-200px", top: roadH * 0.55 + "px", width: W + 400 + "px", height: "10px", background: `repeating-linear-gradient(90deg, ${BRAND} 0 90px, transparent 90px 200px)` }) }, road);
  const carW = LAND ? 820 : 960;
  const car = h("div", { css: A({ left: (LAND ? 130 : (W - carW) / 2) + "px", top: (LAND ? H - roadH - carW * 0.3 : H - roadH - carW * 0.3 - 20) + "px", width: carW + "px" }), html: `<svg viewBox="0 0 380 130" width="${carW}" style="overflow:visible"><defs><filter id="bl"><feGaussianBlur stdDeviation="9"/></filter></defs><ellipse cx="190" cy="126" rx="175" ry="8" fill="rgba(0,0,0,.55)"/><path d="M12 92 q0-28 24-33 l54-8 q30-42 84-42 h78 q44 0 72 44 l38 10 q20 5 20 27 v6 H12z" fill="#2b2f38"/><path d="M100 58 q22-30 68-30 h70 q34 0 56 30z" fill="#1a2740"/><path d="M172 28 v30 M244 28 v30" stroke="#2b2f38" stroke-width="6"/><circle cx="92" cy="106" r="23" fill="#0a0b0e"/><circle cx="92" cy="106" r="10" fill="#6b7078"/><circle cx="302" cy="106" r="23" fill="#0a0b0e"/><circle cx="302" cy="106" r="10" fill="#6b7078"/><rect x="10" y="70" width="15" height="13" rx="4" fill="#e5484d"/><rect x="356" y="76" width="15" height="13" rx="4" fill="#fff6c9"/><circle id="hz1" cx="17" cy="76" r="30" fill="#ffa000" filter="url(#bl)" opacity="0"/><circle id="hz2" cx="363" cy="82" r="30" fill="#ffa000" filter="url(#bl)" opacity="0"/></svg>` }, root);
  const hz1 = car.querySelector("#hz1"), hz2 = car.querySelector("#hz2");
  const clockSz = LAND ? 140 : 150;
  const clock = h("div", { cls: "disp", html: `11<span class="c">:</span>07 <span style="font-size:.5em;letter-spacing:.06em">PM</span>`, css: A({ left: (LAND ? 120 : 80) + "px", top: (LAND ? 90 : 150) + "px", fontSize: clockSz + "px", color: "#fff", textShadow: `0 0 40px ${RED}` }) }, root);
  const tri = h("div", { html: `<svg viewBox="0 0 64 56" width="${LAND ? 120 : 130}"><path d="M32 4 L60 52 H4Z" fill="${BRAND}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M32 22v14" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="44" r="3.2" fill="${INK}"/></svg>`, css: A({ right: (LAND ? 130 : 80) + "px", top: (LAND ? 100 : 160) + "px" }) }, root);
  const t1 = h("div", { cls: "disp", html: "Delhi.", css: A({ left: (LAND ? 980 : 80) + "px", top: (LAND ? 260 : 400) + "px", fontSize: (LAND ? 210 : 230) + "px" }) }, root);
  const t2 = h("div", { cls: "disp", html: "Gaadi<br>band.", css: A({ left: (LAND ? 980 : 80) + "px", top: (LAND ? 470 : 640) + "px", fontSize: (LAND ? 250 : 310) + "px", color: BRAND, webkitTextStroke: "0px", textShadow: "0 8px 0 rgba(0,0,0,.45)" }) }, root);
  const flash = h("div", { css: A({ inset: 0, background: "#fff", opacity: 0 }) }, root);
  const w = sc.words;
  return (lt, t) => {
    const sir = Math.sin(t * Math.PI * 3.6);
    red.style.opacity = 0.35 + 0.65 * clamp(sir + 0.2); blue.style.opacity = 0.35 + 0.65 * clamp(-sir + 0.2);
    dash.style.transform = `translateX(${-((t * 520) % 200)}px)`;
    const on = Math.floor(t * 4) % 2 === 0; hz1.setAttribute("opacity", on ? 0.95 : 0.05); hz2.setAttribute("opacity", on ? 0.95 : 0.05);
    popIn(clock, t, sc.start + 0.25, { dur: 0.3, from: 1.25, y: -30 });
    const c = clock.querySelector(".c"); c.style.opacity = Math.floor(t * 2) % 2 ? 0.25 : 1;
    popIn(tri, t, sc.start + 0.9, { dur: 0.35 }); if (t > sc.start + 0.9) tri.style.transform += ` scale(${1 + 0.06 * Math.sin(t * 14)})`;
    for (const [el, idx, big] of [[t1, 4, 2.1], [t2, 5, 2.4]]) {
      const t0 = w[idx].start - 0.04, p = clamp((t - t0) / 0.2);
      if (p <= 0) { el.style.opacity = 0; continue; }
      const sh = Math.max(0, 1 - (t - t0) / 0.3) * 14;
      tf(el, { s: lerp(big, 1, E.out(p)), x: Math.sin(t * 130) * sh, y: Math.cos(t * 110) * sh, o: 1 });
    }
    flash.style.opacity = Math.max(seg(t, w[4].start - 0.04, w[4].start + 0.05, E.lin) * (1 - seg(t, w[4].start + 0.05, w[4].start + 0.2, E.lin)), seg(t, w[5].start - 0.04, w[5].start + 0.05, E.lin) * (1 - seg(t, w[5].start + 0.05, w[5].start + 0.22, E.lin))) * 0.8;
    // freeze-frame dread at the end: slow push-in
    root.style.transform = `scale(${1 + 0.05 * seg(lt, 0, sc.len, E.lin)})`;
  };
});

// ═════════════════ 2. PAIN ═════════════════
scn("pain", (root, sc) => {
  h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 50% 40%, #1f232c 0%, #0e1015 70%)" }) }, root);
  h("div", { css: A({ inset: 0, opacity: 0.12, backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }) }, root);
  const defs = [
    { e: "📞", l: "Call", s: "Number dhundo…", wi: 0, rot: -4 },
    { e: "🗣️", l: "Haggle", s: "₹2000? ₹3000? “Boss, kitna?”", wi: 2, rot: 3 },
    { e: "⏳", l: "Wait", s: "“Bas aa raha hoon…”", wi: 4, rot: -2.5 },
    { e: "🙏", l: "Pray", s: "Bhagwan bharose", wi: 7, rot: 4 },
  ];
  const cw = LAND ? 380 : 440, ch = LAND ? 500 : 540, gap = 40;
  const cards = defs.map((d, i) => {
    const x = LAND ? (W - (4 * cw + 3 * gap)) / 2 + i * (cw + gap) : (W - (2 * cw + gap)) / 2 + (i % 2) * (cw + gap);
    const y = LAND ? 250 : 300 + Math.floor(i / 2) * (ch + gap);
    const el = h("div", { css: A({ left: x + "px", top: y + "px", width: cw + "px", height: ch + "px", borderRadius: "44px", background: "#fff", color: INK, boxShadow: "0 40px 100px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px", textAlign: "center" }), html: `<div style="font-size:${cw * 0.42}px;line-height:1">${d.e}</div><div class="disp" style="font-size:${cw * 0.2}px">${d.l}</div><div style="font-size:${cw * 0.062}px;font-weight:700;color:#666b73">${d.s}</div>` }, root);
    const x1 = h("div", { cls: "disp", html: "✕", css: A({ inset: 0, display: "grid", placeItems: "center", fontSize: cw * 1.1 + "px", color: RED, opacity: 0, textShadow: "0 10px 50px rgba(229,72,77,.6)" }) }, el);
    return { el, x1, d };
  });
  const dim = h("div", { css: A({ inset: 0, background: "rgba(8,9,13,.9)", opacity: 0 }) }, root);
  const big = h("div", { cls: "disp", html: `There's a<br><span style="color:${BRAND}">better way.</span>`, css: A({ left: 0, width: "100%", top: (LAND ? 320 : 700) + "px", textAlign: "center", fontSize: (LAND ? 190 : 200) + "px", opacity: 0 }) }, root);
  const w = sc.words;
  return (lt, t) => {
    cards.forEach((c, i) => {
      popIn(c.el, t, w[c.d.wi].start - 0.05, { dur: 0.5, from: 0.3, y: -700, r: c.d.rot * 4, ease: E.back });
      if (t > w[c.d.wi].start) { const k = Math.min(1, (t - w[c.d.wi].start) * 3); c.el.style.transform += ` rotate(${c.d.rot * k}deg)`; }
      const tx = w[8].end - 0.05 + i * 0.1;
      c.x1.style.opacity = clamp((t - tx) / 0.1); c.x1.style.transform = `scale(${lerp(2.2, 1, E.out(clamp((t - tx) / 0.18)))})`;
    });
    const t0 = w[8].end + 0.35;
    dim.style.opacity = seg(t, t0, t0 + 0.2, E.lin);
    popIn(big, t, t0 + 0.1, { dur: 0.45, from: 1.5 });
  };
});

// ═════════════════ 3. BRAND REVEAL ═════════════════
scn("brand", (root, sc) => {
  h("div", { css: A({ inset: 0, background: BRAND }) }, root);
  const rays = h("div", { css: A({ left: "50%", top: "50%", width: "260%", height: "260%", marginLeft: "-130%", marginTop: "-130%", background: "repeating-conic-gradient(rgba(255,255,255,.2) 0 5deg, transparent 5deg 10deg)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 62%)", maskImage: "radial-gradient(circle, #000 0%, transparent 62%)" }) }, root);
  h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,.25) 100%)" }) }, root);
  h("div", { css: A({ left: 0, top: 0, width: "100%", height: "34px", background: hazardBg(INK, BRAND, 24) }) }, root);
  h("div", { css: A({ left: 0, bottom: 0, width: "100%", height: "34px", background: hazardBg(INK, BRAND, 24) }) }, root);
  const ms = LAND ? 230 : 280, wsz = LAND ? 270 : 190;
  const top = LAND ? 250 : 320;
  const mark = h("div", { html: MARK(ms), css: A({ left: (LAND ? 0 : (W - ms) / 2) + "px", top: top + "px", filter: "drop-shadow(0 20px 40px rgba(0,0,0,.35))" }) }, root);
  const letters = BRANDNAME.toUpperCase().split("").map((c) => h("span", { cls: "disp", html: c === " " ? "&nbsp;" : c, css: { display: "inline-block", fontSize: wsz + "px", color: INK, opacity: 0 } }));
  const word = h("div", { css: A({ left: 0, width: "100%", top: (LAND ? top - 8 : top + ms + 40) + "px", textAlign: LAND ? "left" : "center", paddingLeft: LAND ? (W - (ms + 40 + BRANDNAME.length * wsz * 0.5)) / 2 + ms + 40 + "px" : "0", whiteSpace: "nowrap" }) }, root);
  letters.forEach((l) => word.appendChild(l));
  if (LAND) mark.style.left = (W - (ms + 40 + BRANDNAME.length * wsz * 0.5)) / 2 + "px";
  const sub = h("div", { html: `Delhi's roadside rescue <span style="font-family:'Noto Deva';font-weight:800"> · दिल्ली की रात का साथी</span>`, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 600 : 830) + "px", fontSize: (LAND ? 52 : 44) + "px", fontWeight: 800, color: INK }) }, root);
  const rsz = LAND ? 200 : 300, rtop = LAND ? 690 : 980;
  const ring = h("div", { css: A({ left: (W - rsz) / 2 + "px", top: rtop + "px", width: rsz + "px", height: rsz + "px" }), html: `<svg viewBox="0 0 120 120" width="${rsz}" height="${rsz}"><circle cx="60" cy="60" r="50" fill="${INK}"/><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/><circle id="arc" cx="60" cy="60" r="50" fill="none" stroke="${BRAND}" stroke-width="10" stroke-linecap="round" stroke-dasharray="314.16" stroke-dashoffset="314.16" transform="rotate(-90 60 60)"/></svg><div class="disp" id="num" style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:${rsz * 0.4}px;padding-bottom:${rsz * 0.12}px">60</div><div class="disp" style="position:absolute;left:0;right:0;bottom:${rsz * 0.2}px;text-align:center;color:${BRAND};font-size:${rsz * 0.11}px;letter-spacing:.14em">seconds</div>` }, root);
  const arc = ring.querySelector("#arc"), num = ring.querySelector("#num");
  const w = sc.words;
  return (lt, t) => {
    rays.style.transform = `rotate(${t * 9}deg)`;
    const m0 = 0.35; popIn(mark, t, sc.start + m0, { dur: 0.5, from: 0.2, r: -40, ease: E.elastic });
    letters.forEach((l, i) => { const p = clamp((t - (sc.start + 0.6 + i * 0.05)) / 0.35); l.style.opacity = clamp(p * 4); l.style.transform = `translateY(${(1 - E.back(p)) * 180}px) rotate(${(1 - E.back(p)) * 14}deg)`; });
    popIn(sub, t, sc.start + 1.35, { dur: 0.4, from: 1, y: 40 });
    const r0 = w[5].start - 0.15, p = clamp((t - r0) / 1.2);
    popIn(ring, t, r0, { dur: 0.45, from: 0.3, ease: E.elastic });
    arc.setAttribute("stroke-dashoffset", 314.16 * (1 - E.io(p)));
    num.textContent = Math.round(60 * E.io(p));
  };
});

// ═════════════════ demo scene factory (browser on desktop / phone on vertical) ═════════════════
function demoTitle(root, text) {
  return h("div", { cls: "disp", html: text, css: A({ left: (LAND ? 80 : 60) + "px", top: (LAND ? 52 : 70) + "px", fontSize: (LAND ? 58 : 64) + "px", color: BRAND, letterSpacing: ".06em" }) }, root);
}
function stepRows(root, rows, x, y, gap, size) {
  return rows.map((r, i) => { const el = pill(root, r, { size, icon: i + 1 }); el.style.left = x + "px"; el.style.top = y + i * gap + "px"; return el; });
}

// ═════════════════ 4. BOOK ═════════════════
scn("book", (root, sc) => {
  h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 25% 20%, #232733 0%, #101218 65%)" }) }, root);
  demoTitle(root, "Book in under a minute");
  const w = sc.words;
  let dev, viewA, viewB, viewC;
  const stage3 = {};
  if (LAND) { dev = browser(root, 1180, "book-1-service", `${URLTEXT}/en/book`, 80, 150); }
  else { dev = phone(root, 540, "m-book-1-service", (W - 540) / 2, 330); }
  const view = dev.view;
  const layers = (LAND ? ["book-1-service", "book-2-locations", "book-3-fare"] : ["m-book-1-service", "m-book-2-locations", "m-book-3-fare"]).map((n, i) => (i === 0 ? view : (() => { const v = mkView(view.parentNode, view._w, view._h, n, view._asp); v.style.top = view.style.top; v.style.opacity = 0; return v; })()));
  const rows = stepRows(root, ["Pick your vehicle", "Drop a pin", "Fixed fare · GST incl."], LAND ? 1330 : (W - 700) / 2, LAND ? 190 : 1440, LAND ? 96 : 0, LAND ? 40 : 40);
  if (!LAND) rows.forEach((r) => (r.style.left = "50%"));
  const card = h("div", { css: A({ left: (LAND ? 1330 : 60) + "px", top: (LAND ? 520 : 150) + "px", width: (LAND ? 520 : W - 120) + "px", height: (LAND ? 330 : 170) + "px", borderRadius: "36px", background: INK, border: `3px solid ${BRAND}`, boxShadow: "0 30px 90px rgba(0,0,0,.5)", display: "flex", flexDirection: LAND ? "column" : "row", alignItems: "center", justifyContent: "center", gap: LAND ? "0" : "40px" }) }, root);
  card._d = "flex";
  const lab = h("div", { cls: "disp", html: `Your fare<br><span style="font-size:.5em;color:#9aa0a8;letter-spacing:.1em">incl. GST · no haggling</span>`, css: { fontSize: (LAND ? 56 : 52) + "px", textAlign: LAND ? "center" : "left", color: "#fff" } }, card);
  const price = h("div", { cls: "disp", html: "₹0", css: { fontSize: (LAND ? 190 : 120) + "px", color: BRAND, lineHeight: 1 } }, card);
  const stamp = h("div", { cls: "disp", html: "No<br>haggling", css: A({ left: (LAND ? 1640 : W - 350) + "px", top: (LAND ? 470 : 1020) + "px", fontSize: (LAND ? 62 : 54) + "px", color: RED, border: `8px solid ${RED}`, padding: "10px 24px", borderRadius: "16px", textAlign: "center", background: "rgba(255,255,255,.96)", textShadow: "none" }) }, root);
  const t1 = w[0].start - 0.05, t2 = w[2].start - 0.05, t3 = w[4].start - 0.1, tg = w[9].start - 0.2;
  return (lt, t) => {
    const f2 = seg(t, t2, t2 + 0.35, E.io), f3 = seg(t, t3, t3 + 0.35, E.io);
    layers[1].style.opacity = f2 * (1 - f3); layers[2].style.opacity = f3; layers[0].style.opacity = 1;
    layers[1].style.opacity = f2; layers[2].style.opacity = f3;
    if (LAND) {
      pan(layers[0], 1.0 + 0.1 * seg(t, sc.start, t2, E.lin), 0.36, 0.55);
      pan(layers[1], 1.0 + 0.5 * seg(t, t2, t3, E.io), lerp(0.5, 0.78, seg(t, t2, t3, E.io)), 0.55);
      pan(layers[2], 1.0 + 0.55 * seg(t, t3, t3 + 0.8, E.out), lerp(0.55, 0.36, seg(t, t3, t3 + 0.8)), lerp(0.5, 0.64, seg(t, t3, t3 + 0.8)));
    } else { layers.forEach((l) => pan(l, 1, 0.5, 0.5)); }
    popIn(rows[0], t, t1, { dur: 0.4, x: 80 }); popIn(rows[1], t, t2, { dur: 0.4, x: 80 }); popIn(rows[2], t, t3, { dur: 0.4, x: 80 });
    if (!LAND) { rows.forEach((r, i) => { const on = t >= [t1, t2, t3][i] && (i === 2 || t < [t1, t2, t3][i + 1]); show(r, on); r.style.marginLeft = -r.offsetWidth / 2 + "px"; }); }
    popIn(card, t, t3 - 0.05, { dur: 0.5, from: 0.7, y: LAND ? 60 : -60 });
    const p = seg(t, t3, t3 + 1.0, E.out); price.textContent = inr(2297 * p);
    if (t > t3 + 1.0) price.style.transform = `scale(${1 + 0.05 * Math.max(0, Math.sin((t - t3 - 1) * 8)) * Math.max(0, 1 - (t - t3 - 1))})`;
    popIn(stamp, t, w[11].end - 0.1, { dur: 0.3, from: 2.4, r: -18, ease: E.out }); if (t > w[11].end - 0.1) stamp.style.transform += " rotate(-9deg)";
  };
});

// ═════════════════ 5. TRACK ═════════════════
scn("track", (root, sc) => {
  h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 75% 25%, #1d2a22 0%, #101218 65%)" }) }, root);
  demoTitle(root, "Verified. Live. PIN-safe.");
  const w = sc.words;
  const dev = LAND ? browser(root, 1180, "track", `${URLTEXT}/en/track/RS-7K3M9Q2A`, 80, 150) : phone(root, 540, "m-track", (W - 540) / 2, 300);
  const view = dev.view;
  let view2 = null;
  if (!LAND) { view2 = mkView(view.parentNode, view._w, view._h, "m-track-2", ASP_M); view2.style.opacity = 0; }
  // pulse ring over the driver's marker (landscape)
  const ringEl = h("div", { css: A({ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${BRAND}`, opacity: 0 }) }, view.parentNode);
  const rows = stepRows(root, ["Verified driver ★ 4.7", "Live tracking", "PIN-safe handover"], LAND ? 1330 : 0, LAND ? 220 : 1450, LAND ? 120 : 0, LAND ? 40 : 40);
  const idx = [0, 2, 5];
  const times = [w[0].start - 0.05, w[2].start - 0.05, w[5].start - 0.05];
  return (lt, t) => {
    if (LAND) {
      const a = seg(t, times[1] - 0.25, times[1] + 0.4, E.io), b = seg(t, times[2] - 0.25, times[2] + 0.4, E.io);
      pan(view, lerp(lerp(1.5, 1.9, a), 1.9, b), lerp(lerp(0.5, 0.7, a), 0.42, b), lerp(lerp(0.5, 0.42, a), 0.6, b));
      const mx = (0.7025 * 3840), my = 0.388 * 2160; void mx; void my;
      const sc2 = view._img.offsetWidth / 3840; // current image scale
      const tr = view._img.style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\)/);
      if (tr) { ringEl.style.left = parseFloat(tr[1]) + 0.7025 * view._img.offsetWidth - 45 + "px"; ringEl.style.top = parseFloat(tr[2]) + 0.388 * view._img.offsetHeight - 45 + "px"; }
      const k = (t * 1.1) % 1; ringEl.style.opacity = t > times[1] - 0.2 && t < times[2] ? 1 - k : 0; ringEl.style.transform = `scale(${0.6 + 1.6 * k})`; void sc2;
      view._img.style.filter = "none";
    } else {
      pan(view, 1, 0.5, 0.5); const b = seg(t, times[2] - 0.2, times[2] + 0.4, E.io); view2.style.opacity = b; pan(view2, 1, 0.5, 0.5); ringEl.style.opacity = 0;
    }
    rows.forEach((r, i) => {
      popIn(r, t, times[i], { dur: 0.4, x: 80 });
      if (!LAND) { const on = t >= times[i] && (i === 2 || t < times[i + 1]); show(r, on); r.style.left = "50%"; r.style.marginLeft = -r.offsetWidth / 2 + "px"; }
    });
    void idx;
  };
});

// ═════════════════ 6. PAY + GST INVOICE ═════════════════
scn("pay", (root, sc) => {
  h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 70% 35%, #2a2514 0%, #101218 65%)" }) }, root);
  demoTitle(root, "Paperwork? Done.");
  const w = sc.words;
  let doc;
  if (LAND) { doc = browser(root, 1060, "invoice", `${URLTEXT}/en/invoice/RS-4TN8Q5WD`, 780, 150); }
  else { doc = phone(root, 540, "m-invoice", (W - 540) / 2, 300); }
  const view = doc.view;
  const stamp = h("div", { cls: "disp", html: "Paid ✓", css: A({ left: (LAND ? 1340 : W - 400) + "px", top: (LAND ? 600 : 800) + "px", fontSize: (LAND ? 150 : 130) + "px", color: GREEN, border: `12px solid ${GREEN}`, padding: "6px 40px", borderRadius: "24px", background: "rgba(255,255,255,.9)" }) }, root);
  const bigL = h("div", { cls: "disp", html: `Pay<br><span style="color:${BRAND}">after</span><br>service`, css: A({ left: "80px", top: "230px", fontSize: "160px" }) }, root);
  const chipA = pill(root, "Cash or UPI to driver", { size: 40 }); chipA.style.left = "80px"; chipA.style.top = "700px";
  const chipB = pill(root, "GST invoice on email", { size: 40 }); chipB.style.left = "80px"; chipB.style.top = "790px";
  if (!LAND) { [chipA, chipB].forEach((c, i) => { c.style.left = "50%"; c.style.top = 1445 + "px"; }); bigL.style.display = "none"; }
  return (lt, t) => {
    if (LAND) { pan(view, 1.0 + 0.08 * seg(t, sc.start, sc.start + sc.len, E.lin), 0.5, 0.35 + 0.1 * seg(t, sc.start, sc.start + sc.len, E.lin)); } else pan(view, 1, 0.5, 0.5);
    popIn(doc.root, t, sc.start + 0.05, { dur: 0.55, from: 0.9, y: 220, r: 4 });
    if (LAND) popIn(bigL, t, sc.start + 0.1, { dur: 0.45, from: 0.7, x: -120 });
    popIn(chipA, t, w[1].start, { dur: 0.4, x: LAND ? -80 : 0, y: LAND ? 0 : 60 });
    popIn(chipB, t, w[4].start - 0.1, { dur: 0.4, x: LAND ? -80 : 0, y: LAND ? 0 : 60 });
    if (!LAND) { show(chipA, t < w[4].start - 0.1); [chipA, chipB].forEach((c) => (c.style.marginLeft = -c.offsetWidth / 2 + "px")); }
    popIn(stamp, t, w[3].end - 0.05, { dur: 0.28, from: 2.6, r: -14, ease: E.out }); if (t > w[3].end - 0.05) stamp.style.transform += " rotate(-10deg)";
  };
});

// ═════════════════ 7. OPERATORS ═════════════════
scn("biz", (root, sc) => {
  h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 30% 60%, #262033 0%, #101218 65%)" }) }, root);
  const head = h("div", { cls: "disp", html: `Own a tow truck? <span style="color:${BRAND}">Partner with us.</span>`, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 30 : 90) + "px", fontSize: (LAND ? 78 : 62) + "px" }) }, root);
  const w = sc.words;
  const shots = [
    { kind: "phone", name: "m-driver-offer", label: "Job offers on the driver app", t0: sc.start + 0.05 },
    { kind: "browser", name: "driver-contract", label: "E-signed partner contracts", t0: w[6].start - 0.1, fx: 0.5, fy: 0.3 },
    { kind: "browser", name: "admin-dispatch", label: "Live dispatch board", t0: w[9].start - 0.1, fx: 0.55, fy: 0.4 },
    { kind: "browser", name: "admin-payments", label: "Payouts & ledger", t0: w[10].start + 0.15, fx: 0.55, fy: 0.3 },
  ].map((s) => {
    const g = h("div", { css: A({ inset: 0 }) }, root);
    let dev;
    if (s.kind === "phone") dev = phone(g, LAND ? 330 : 560, s.name, (W - (LAND ? 330 : 560)) / 2, LAND ? 215 : 300);
    else { const bw = LAND ? 1060 : 960; dev = browser(g, bw, s.name, `${URLTEXT}/en/${s.name.startsWith("admin") ? "admin" : "driver"}`, (W - bw) / 2, LAND ? 225 : 480); }
    const lab = pill(g, s.label, { size: LAND ? 48 : 42 });
    lab.style.left = "50%"; lab.style.top = LAND ? "128px" : "1450px";
    return { ...s, g, dev, lab };
  });
  return (lt, t) => {
    popIn(head, t, sc.start + 0.1, { dur: 0.4, from: 0.8, y: -40 });
    shots.forEach((s, i) => {
      const next = shots[i + 1] ? shots[i + 1].t0 : 1e9;
      const on = t >= s.t0 && t < next + 0.08; show(s.g, on);
      if (!on) return;
      popIn(s.dev.root, t, s.t0, { dur: 0.35, from: 0.86, x: i % 2 ? 200 : -200, ease: E.out });
      popIn(s.lab, t, s.t0 + 0.1, { dur: 0.35, from: 0.6 }); s.lab.style.marginLeft = -s.lab.offsetWidth / 2 + "px";
      const k = seg(t, s.t0, next, E.lin);
      if (s.kind === "browser") pan(s.dev.view, 1.12 + 0.12 * k, s.fx, s.fy); else pan(s.dev.view, 1, 0.5, 0.5);
    });
  };
});

// ═════════════════ 8. PAYOFF ═════════════════
scn("payoff", (root, sc) => {
  h("div", { css: A({ inset: 0, background: BRAND }) }, root);
  const rays = h("div", { css: A({ left: "50%", top: "50%", width: "260%", height: "260%", marginLeft: "-130%", marginTop: "-130%", background: "repeating-conic-gradient(rgba(255,255,255,.22) 0 5deg, transparent 5deg 10deg)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 62%)", maskImage: "radial-gradient(circle, #000 0%, transparent 62%)" }) }, root);
  const w = sc.words;
  const big = h("div", { cls: "disp", html: `Breakdown <span style="color:#fff;-webkit-text-stroke:0">→</span> Booked`, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 130 : 330) + "px", fontSize: (LAND ? 190 : 170) + "px", color: INK }) }, root);
  const bs = LAND ? 360 : 430;
  const timer = h("div", { cls: "disp", html: `<span id="n">60</span><span style="font-size:.38em;letter-spacing:.08em"> sec</span>`, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 400 : 640) + "px", fontSize: bs + "px", color: INK, textShadow: "0 10px 0 rgba(255,255,255,.35)" }) }, root);
  const n = timer.querySelector("#n");
  const chips = ["Fixed fare", "Verified drivers", "Live tracking", "GST invoice"].map((c) => pill(root, c, { bg: INK, fg: BRAND, size: LAND ? 50 : 52 }));
  const cw = LAND ? [330, 440, 390, 380] : [0, 0, 0, 0];
  chips.forEach((c, i) => { if (LAND) { c.style.left = [120, 520, 1000, 1440][i] + "px"; c.style.top = "800px"; } else { c.style.left = "50%"; c.style.top = 1080 + i * 120 + "px"; } });
  void cw;
  const conf = Array.from({ length: 70 }, (_, i) => { const r = rng(i * 77 + 5); return { x: r() * W, vx: (r() - 0.5) * 500, vy: -(400 + r() * 700), sz: 14 + r() * 22, rot: r() * 360, vr: (r() - 0.5) * 900, c: [INK, "#fff", RED, GREEN][Math.floor(r() * 4)], e: h("i", { css: A({ width: "0px", height: "0px", display: "block" }) }, root) }; });
  conf.forEach((c) => { Object.assign(c.e.style, { width: c.sz + "px", height: c.sz * 0.5 + "px", background: c.c, top: "0px", left: "0px", opacity: 0 }); });
  const tc = w[6].end - 1.3;
  return (lt, t) => {
    rays.style.transform = `rotate(${-t * 12}deg)`;
    popIn(big, t, sc.start + 0.1, { dur: 0.45, from: 1.6 });
    const p = seg(t, sc.start + 0.25, sc.start + 1.7, E.io); n.textContent = Math.round(60 * p);
    popIn(timer, t, sc.start + 0.2, { dur: 0.4, from: 0.7 });
    chips.forEach((c, i) => { popIn(c, t, sc.start + 1.2 + i * 0.14, { dur: 0.35, y: 60 }); if (!LAND) c.style.marginLeft = -c.offsetWidth / 2 + "px"; });
    const t0 = sc.start + 1.7;
    conf.forEach((c) => { const q = t - t0; if (q < 0) { c.e.style.opacity = 0; return; } const x = c.x + c.vx * q, y = H * 0.55 + c.vy * q + 900 * q * q; c.e.style.opacity = y < H + 60 ? 1 : 0; c.e.style.transform = `translate(${x}px,${y}px) rotate(${c.rot + c.vr * q}deg)`; });
    void tc;
  };
});

// ═════════════════ 9. CTA ═════════════════
scn("cta", (root, sc) => {
  h("div", { css: A({ inset: 0, background: INK }) }, root);
  const glow = h("div", { css: A({ inset: 0, background: `radial-gradient(circle at 50% 38%, rgba(255,196,0,.4), transparent 55%)` }) }, root);
  h("div", { css: A({ left: 0, top: 0, width: "100%", height: "36px", background: hazardBg(BRAND, INK, 26) }) }, root);
  h("div", { css: A({ left: 0, bottom: 0, width: "100%", height: "36px", background: hazardBg(BRAND, INK, 26) }) }, root);
  const ms = LAND ? 150 : 190;
  const mk = h("div", { html: MARK(ms), css: A({ left: (W - ms) / 2 + "px", top: (LAND ? 40 : 340) + "px" }) }, root);
  const name = h("div", { cls: "disp", html: BRANDNAME, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 190 : 560) + "px", fontSize: (LAND ? 120 : 150) + "px", color: "#fff" }) }, root);
  const book = h("div", { cls: "disp", html: `Book your <span style="color:${BRAND}">tow.</span>`, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 310 : 780) + "px", fontSize: (LAND ? 200 : 150) + "px" }) }, root);
  const cta = h("div", { cls: "disp", html: `<span style="margin-right:28px">▶</span>${URLTEXT}`, css: A({ left: "50%", top: (LAND ? 560 : 1090) + "px", fontSize: (LAND ? 78 : 66) + "px", background: BRAND, color: INK, padding: "20px 64px", borderRadius: "999px", whiteSpace: "nowrap", boxShadow: `0 20px 80px rgba(255,196,0,.45)`, overflow: "hidden" }) }, root);
  const shine = h("div", { css: A({ left: "-60%", top: 0, width: "40%", height: "100%", background: "linear-gradient(100deg, transparent, rgba(255,255,255,.7), transparent)", transform: "skewX(-20deg)" }) }, cta);
  const tags = h("div", { cls: "disp", html: `24×7 · Delhi · English + हिंदी`, css: A({ left: 0, width: "100%", textAlign: "center", top: (LAND ? 710 : 1250) + "px", fontSize: (LAND ? 56 : 52) + "px", color: "#c8ccd2" }) }, root);
  const soon = pill(root, "NCR coming soon", { bg: "#2a2e36", fg: BRAND, size: LAND ? 38 : 40, icon: "★" }); soon.style.left = "50%"; soon.style.top = (LAND ? 790 : 1350) + "px";
  return (lt, t) => {
    glow.style.opacity = 0.7 + 0.3 * Math.sin(t * 3);
    popIn(mk, t, sc.start + 0.1, { dur: 0.5, from: 0.2, r: -30, ease: E.elastic });
    popIn(name, t, sc.start + 0.25, { dur: 0.4, from: 0.8, y: 50 });
    popIn(book, t, sc.start + 0.5, { dur: 0.45, from: 1.5 });
    const p = popIn(cta, t, sc.start + 1.0, { dur: 0.45, from: 0.5, y: 60 });
    cta.style.marginLeft = -cta.offsetWidth / 2 + "px";
    if (p >= 1) cta.style.transform += ` scale(${1 + 0.025 * Math.sin((t - sc.start) * 7)})`;
    shine.style.left = -60 + ((((t - sc.start) * 0.6) % 1.6) * 200) + "%";
    popIn(tags, t, sc.start + 1.3, { dur: 0.4, y: 20 });
    popIn(soon, t, sc.start + 1.5, { dur: 0.4, y: 20 }); soon.style.marginLeft = -soon.offsetWidth / 2 + "px";
  };
});

// ───────── global overlays: transitions, captions, progress ─────────
const tape = h("div", { css: A({ inset: 0, background: hazardBg(BRAND, INK, 70), opacity: 0 }) });
const flashG = h("div", { css: A({ inset: 0, background: "#fff", opacity: 0 }) });
const vign = h("div", { css: A({ inset: 0, background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,.35) 100%)", pointerEvents: "none" }) });
const capBox = h("div", { cls: "disp", css: A({ left: 0, width: "100%", top: (LAND ? 900 : 1530) + "px", textAlign: "center", fontSize: (LAND ? 104 : 108) + "px", letterSpacing: ".012em", whiteSpace: "nowrap", pointerEvents: "none", textShadow: "0 6px 0 rgba(0,0,0,.6), 0 0 26px rgba(0,0,0,.8)" }) });
const prog = h("div", { css: A({ left: 0, bottom: 0, height: (LAND ? 12 : 14) + "px", width: "0%", background: hazardBg(BRAND, INK, 12) }) });
const progBg = h("div", { css: A({ left: 0, bottom: 0, height: (LAND ? 12 : 14) + "px", width: "100%", background: "rgba(255,255,255,.12)", zIndex: -1 }) });
stage.insertBefore(progBg, prog);

const capChunks = [];
for (const s of TL.scenes) {
  let cur = [];
  s.words.forEach((wd, i) => { cur.push(wd); if (/[.?,:]$/.test(wd.text) || cur.length >= 3 || i === s.words.length - 1) { capChunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end, scene: s.id }); cur = []; } });
}
const noCaps = new Set(Q.get("nocaps") ? Q.get("nocaps").split(",") : []);

const bounds = TL.scenes.map((s) => s.start).slice(1);
window.renderAt = (t) => {
  const idx = TL.scenes.findIndex((s) => t >= s.start && t < s.start + s.len);
  const cur = idx < 0 ? scenes[scenes.length - 1] : scenes[idx];
  scenes.forEach((s) => show(s.root, s === cur));
  cur.upd(t - cur.sc.start, t);
  // beat pulse on the product scenes
  const ph = (t / TL.beat) % 1;
  const pulse = idx >= 2 && idx !== 7 ? 1 + 0.012 * Math.pow(1 - ph, 3) : 1;
  content.style.transform = `scale(${pulse})`;
  // transitions
  let tp = 0, fl = 0;
  for (let i = 0; i < bounds.length; i++) {
    const b = bounds[i], d = t - b;
    if (i === 1 && d > -0.32 && d < 0.45) tp = d < 0.05 ? seg(d, -0.32, 0.05, E.in) : 1 - seg(d, 0.05, 0.45, E.out);
    else if (d > -0.04 && d < 0.18) fl = Math.max(fl, (1 - d / 0.18) * (i === 0 ? 0.9 : 0.45));
  }
  if (tp > 0) { tape.style.opacity = 1; tape.style.clipPath = t < bounds[1] + 0.05 ? `inset(0 ${(1 - tp) * 100}% 0 0)` : `inset(0 0 0 ${(1 - tp) * 100}%)`; tape.style.backgroundPosition = `${t * 400}px 0`; } else tape.style.opacity = 0;
  flashG.style.opacity = fl;
  // captions
  const yel = cur.id === "brand" || cur.id === "payoff";
  capBox.style.textShadow = yel ? "0 5px 0 rgba(255,255,255,.45), 0 0 18px rgba(0,0,0,.25)" : "0 6px 0 rgba(0,0,0,.6), 0 0 26px rgba(0,0,0,.8)";
  const ch = capChunks.find((c) => t >= c.start - 0.05 && t <= c.end + 0.28 && !noCaps.has(c.scene));
  if (ch) {
    capBox.style.display = "block";
    capBox.innerHTML = ch.words.map((wd) => { const on = t >= wd.start - 0.02 && t < wd.end + 0.06; return `<span style="display:inline-block;margin:0 .13em;color:${on ? (yel ? INK : BRAND) : "#fff"};transform:scale(${on ? 1.1 : 1})">${wd.text}</span>`; }).join("");
  } else capBox.style.display = "none";
  prog.style.width = clamp(t / TL.total) * 100 + "%";
};
window.TL = TL;
window.ready = true;
window.renderAt(0);
