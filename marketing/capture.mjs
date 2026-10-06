// Captures 4K product screens (desktop) and phone screens (mobile) from the running demo server.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const BASE = process.env.BASE ?? "http://localhost:3200";
const OUT = path.resolve(import.meta.dirname, "screens");
fs.mkdirSync(OUT, { recursive: true });
const sessions = Object.fromEntries(fs.readFileSync(path.resolve(import.meta.dirname, ".sessions.txt"), "utf8").trim().split("\n").map((l) => l.split(" ")));

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--force-color-profile=srgb", "--hide-scrollbars"] });

async function ctx(kind, session) {
  const c = await browser.newContext(
    kind === "desktop"
      ? { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, locale: "en-IN", timezoneId: "Asia/Kolkata" }
      : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 4, isMobile: true, hasTouch: true, locale: "en-IN", timezoneId: "Asia/Kolkata", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" },
  );
  if (session) await c.addCookies([{ name: "rs_session", value: sessions[session], url: BASE }]);
  return c;
}
const settle = async (p, ms = 1200) => {
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(ms);
};
const shot = async (p, name, opts = {}) => {
  await p.screenshot({ path: path.join(OUT, `${name}.png`), type: "png", ...opts });
  console.log("✓", name);
};
const go = async (p, url, ms) => {
  await p.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await settle(p, ms);
};

const toCard = (p) => p.evaluate(() => { const h = [...document.querySelectorAll("h2")].find((x) => /YOUR FARE|WHERE ARE YOU/i.test(x.textContent)); if (h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 100); });
async function bookingFlow(p, prefix) {
  await go(p, "/en/book?vehicle=car&service=flatbed-towing", 800);
  await shot(p, `${prefix}book-1-service`);
  await p.getByRole("button", { name: "Continue" }).click();
  await p.waitForTimeout(500);
  await p.locator("#pickup").click();
  await p.locator("#pickup").pressSequentially("Connaught Place", { delay: 40 });
  await p.locator('[role="option"]').first().waitFor({ timeout: 15000 });
  await p.locator('[role="option"] button').first().click();
  await p.locator("#drop").click();
  await p.locator("#drop").pressSequentially("Saket Delhi", { delay: 40 });
  await p.locator('[role="option"]').nth(0).waitFor({ timeout: 15000 });
  await p.locator('[role="option"] button').nth(1).click().catch(async () => p.locator('[role="option"] button').first().click());
  await p.waitForTimeout(3500);
  if (prefix) await toCard(p);
  await p.waitForTimeout(400);
  await shot(p, `${prefix}book-2-locations`);
  await p.getByRole("button", { name: "Continue" }).click();
  await p.getByText("Your fare", { exact: false }).first().waitFor({ timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(4500);
  if (prefix) await toCard(p);
  await p.waitForTimeout(400);
  await shot(p, `${prefix}book-3-fare`);
}

const ONLY_MOBILE = process.env.ONLY_MOBILE === "1";
// ── desktop, anonymous ──
if (!ONLY_MOBILE) {
  const c = await ctx("desktop");
  const p = await c.newPage();
  await go(p, "/en", 1500);
  await shot(p, "home-hero");
  await p.evaluate(() => window.scrollTo(0, 1250));
  await p.waitForTimeout(800);
  await shot(p, "home-services");
  await bookingFlow(p, "");
  await go(p, "/en/track/RS-7K3M9Q2A", 4500);
  await shot(p, "track");
  await go(p, "/en/invoice/RS-4TN8Q5WD", 800);
  await shot(p, "invoice");
  await c.close();
}

// ── desktop, admin ──
if (!ONLY_MOBILE) {
  const c = await ctx("desktop", "admin@roadsaathi.example");
  const p = await c.newPage();
  for (const [url, name, ms] of [["/en/admin", "admin-dashboard", 2500], ["/en/admin/dispatch", "admin-dispatch", 5000], ["/en/admin/providers", "admin-partners", 1500], ["/en/admin/settings/brand", "admin-brand", 1200], ["/en/admin/manage/rate-cards", "admin-rates", 1200], ["/en/admin/payments", "admin-payments", 1200]]) {
    await go(p, url, ms);
    await shot(p, name);
  }
  await c.close();
}

// ── desktop, driver ──
if (!ONLY_MOBILE) {
  const c = await ctx("desktop", "driver.cp@demo.test");
  const p = await c.newPage();
  await go(p, "/en/driver", 4000);
  await shot(p, "driver-active");
  await go(p, "/en/driver/contract", 1200);
  await shot(p, "driver-contract");
  await c.close();
}

// ── mobile ──
{
  const c = await ctx("mobile");
  const p = await c.newPage();
  await go(p, "/en", 1500);
  await shot(p, "m-home");
  await bookingFlow(p, "m-");
  await go(p, "/en/track/RS-7K3M9Q2A", 4500);
  await shot(p, "m-track");
  await p.evaluate(() => window.scrollTo(0, 560));
  await p.waitForTimeout(600);
  await shot(p, "m-track-2");
  await go(p, "/en/invoice/RS-4TN8Q5WD", 800);
  await shot(p, "m-invoice");
  await c.close();
}
for (const [who, name] of [["driver.saket@demo.test", "m-driver-offer"], ["driver.cp@demo.test", "m-driver-active"]]) {
  if (name === "m-driver-offer" && process.env.DATABASE_URL) {
    const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    await db.query(`update "DispatchOffer" set "expiresAt" = now() + interval '95 seconds' where id='off_demo'`);
    await db.end();
  }
  const c = await ctx("mobile", who);
  const p = await c.newPage();
  await go(p, "/en/driver", 4500);
  await shot(p, name);
  await c.close();
}
await browser.close();
console.log("done");
