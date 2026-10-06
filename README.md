# RoadSaathi — towing & roadside-assistance platform (Delhi)

A modular-monolith platform: customer website + booking, live tracking, driver app (PWA), fleet-company portal, partner onboarding with e-signed contracts, dispatch, GST invoicing, ledger/payouts and a full admin back-office. English + Hindi, mobile-first, safety-yellow & charcoal design system.

> **The brand name is a variable.** "RoadSaathi" is only the default. Change it in **Admin → Settings → Brand** (live, no redeploy) or via `BRAND_NAME`. It flows through the site, titles/SEO, emails, SMS, invoices, contracts, legal pages, PWA manifest and favicon.

## Quick start

### A) Everything in Docker (db + mail catcher + migrations + app + cron)
```bash
cp .env.example .env            # optional – compose has safe dev defaults
docker compose up --build
```
- App: http://localhost:3000  · Mailpit (every email the app sends): http://localhost:8025
- First boot runs migrations + seed (`SEED_DEMO=true` adds demo drivers/company). Demo OTP codes are shown on screen (`EXPOSE_DEV_OTP=true`) — **turn that off for real deployments**.
- Admin login: `admin@roadsaathi.example` (set `ADMIN_EMAIL`) → enter the code → `/en/admin`.

### B) Local dev (hot reload)
```bash
npm install
docker compose up -d db mailpit
npx prisma migrate deploy && SEED_DEMO=true npm run db:seed
npm run dev                      # http://localhost:3000
npm test                         # unit tests (pricing engine, booking state machine)
npm run lint                     # type-check
```

## Demo accounts (after `SEED_DEMO=true`)
| Role | Email (sign in with an emailed one-time code) |
|---|---|
| Super admin | `ADMIN_EMAIL` (default admin@roadsaathi.example) |
| Independent drivers | driver.cp@demo.test · driver.saket@demo.test · driver.dwarka@demo.test |
| Fleet owner | owner@demo-fleet.test (drivers: fleet.driver1@demo.test, fleet.driver2@demo.test) |
| Customer | any email/mobile — sign in on `/en/login` or during booking |

Try the loop: book a tow → sign in as a driver, *Go online* (demo tools let you set a Delhi location) → accept the offer → *Start driving → Arrived → enter customer's PIN → Complete* → invoice + ledger + emails appear.

## What's inside
| Area | Highlights |
|---|---|
| Customer site | Home, services, pricing, coverage + per-locality SEO pages, FAQ, contact/call-back, legal pages (all CMS-editable), EN/HI |
| Booking | 4-step flow, OpenStreetMap search + route, instant GST-inclusive fare, scheduling, trip PIN, OTP sign-in, live tracking, cancel, review, printable GST invoice |
| Partners | Public partner landing + application (independent **or** company), admin review, **contract template → personalised agreement → e-sign (typed name + email OTP, IP/time recorded)**, company adds drivers/trucks, payout details |
| Driver app | Online/offline, live GPS, offers with countdown, PIN-verified start, cash collection prompt, earnings ledger |
| Dispatch | Nearest-eligible-driver rounds, atomic accept, auto-expiry/next round, manual assign, scheduled release, lazy advance without cron |
| Admin | Dashboard, bookings, dispatch board, partners, users & staff roles, **catalog / rate cards / areas / FAQs / testimonials / legal pages / contract templates / every setting editable**, leads, payouts & ledger, invoices, analytics funnel, notification log, audit log |
| Notifications | Branded HTML email (SMTP) + SMS (mock now, MSG91 adapter ready). Customer, **driver and the driver's company** are all notified on assignment |
| Payments | Cash/UPI to driver live. **Razorpay is built and shown as “Coming soon”** until enabled (see below) |
| Money & tax | Paise-integer pricing engine, night/surge, GST CGST+SGST/IGST split, FY invoice numbering, SAC code, commission ledger |

## Turning on Razorpay later
1. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to the environment.
2. Razorpay Dashboard → Webhooks → `https://<your-domain>/api/webhooks/razorpay` (events `payment.captured`, `order.paid`, `payment.failed`).
3. **Admin → Settings → Payments** → set mode to *Test* then *Live*. The checkout option activates instantly; prepaid bookings dispatch only after payment is captured.

## Swapping maps to Google
Set `GOOGLE_MAPS_API_KEY`, then **Admin → Settings → Maps → Google Maps** (or `MAP_PROVIDER=google`). Geocoding and routing switch via the provider interface in `src/modules/geo/providers.ts`; swap the tile layer URL in the same settings page.

## Configuration
See `.env.example`. Everything business-facing (brand, phones, address, GST, pricing rules, dispatch tuning, payments flag, notifications) lives in the database and is edited in **Admin → Settings**.

## Documentation
- [Architecture](docs/ARCHITECTURE.md) — modules, boundaries, data flow, state machine
- [Deployment](docs/DEPLOY.md) — Vercel + Neon, Docker/VPS, cron, SMS/email, scaling notes
- [Tracking plan](docs/tracking-plan.md) — analytics events and funnels
- [OpenAPI](docs/openapi.yaml) — HTTP surface for the route handlers

## Before going live — checklist
- [ ] Replace placeholder brand, phones, address, GSTIN/PAN, SAC code and GST rate (confirm with your CA) in Admin → Settings.
- [ ] **Have a lawyer review** every seeded legal page and both partner-agreement templates (they are templates, not legal advice).
- [ ] Set a long random `AUTH_SECRET`, `CRON_SECRET`; set `EXPOSE_DEV_OTP=false`; remove `SEED_DEMO`.
- [ ] Configure real SMTP (SES/Resend/SendGrid) + sender domain (SPF/DKIM) and MSG91 (DLT-registered templates).
- [ ] Use your own map tile provider and a hosted geocoder/router for production traffic (public OSM servers are for light use only).
- [ ] Schedule `/api/cron/tick` every minute.
- [ ] Add real testimonials in Admin (the home-page section stays hidden until you do).
