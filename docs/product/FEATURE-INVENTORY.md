# Feature inventory — what is built and what is next

Status legend: **✅ Built** (in `main`, deployed) · **🟡 Partial** (works, with a known limitation) · **⬜ Not built**.
Value legend for future items: **H** high · **M** medium · **L** low.

## 1. Customer experience (public site, `/[locale]/(site)`)

| Feature | Status | Where in code | Notes |
|---|---|---|---|
| Home, services (9), vehicle types (6), pricing, about, FAQ, contact | ✅ | `app/[locale]/(site)/*` | All copy editable in admin, EN + HI |
| Coverage page and per-locality SEO pages | ✅ | `areas/`, `areas/[slug]` | JSON-LD structured data; NCR cities "coming soon" with notify-me |
| Bilingual UI (English / Hindi) | ✅ | `src/i18n/en.ts`, `hi.ts` | Typed dictionaries: Hindi must match English keys |
| Booking wizard (vehicle → service → locations → contact & confirm) | ✅ | `shared/client/booking-wizard.tsx`, `modules/bookings` | Map search, route distance, scheduling |
| Instant quote with GST breakdown | ✅ | `modules/pricing/engine.ts` | Base, per km, minimum, night, surge, rounding, GST |
| OTP sign-in (email; phone via Firebase with email fallback) | ✅ | `modules/auth` | Hashed codes, attempt limits, rate limits |
| Trip PIN (4-digit) to start the job | ✅ | `Booking.startPin` | Driver must enter it at pickup |
| Live tracking page and lookup by code | ✅ | `track/[code]`, `api/track/[code]` | 5-second polling |
| Cancel booking | 🟡 | `cancelBookingAction` | Cancellation fee is shown but not charged automatically |
| Rate and review driver | ✅ | `reviewAction` | Updates driver rating average |
| Printable GST invoice | ✅ | `invoice/[code]`, `modules/invoicing` | FY-sequenced numbers, CGST/SGST/IGST |
| Account page (profile, bookings) | ✅ | `account/` | |
| Contact form / call-back leads | ✅ | `submitLeadAction` | Visible in Admin → Leads |
| Online payment (Razorpay: UPI, cards, netbanking) | 🟡 | `modules/payments`, `api/webhooks/razorpay` | Built; shown as "Coming soon" until keys and live mode are enabled |
| Refunds | ⬜ (H) | — | `PaymentStatus.REFUNDED` exists; no refund action or Razorpay refund call |
| Vehicle photo upload / condition report | ⬜ (H) | — | Foundation for AI-2 and damage disputes |
| Consent capture for Terms/Privacy at booking | ⬜ (H) | — | Legal requirement (chapter 3) |
| Cookie / analytics consent banner | ⬜ (M) | — | Google Analytics loads when an ID is set |
| Account deletion and data export | ⬜ (H, by May 2027) | — | DPDP data-principal rights |
| WhatsApp booking and updates | ⬜ (H) | — | See AI-1 |
| Native Android/iOS app | ⬜ (M) | — | The site is a PWA (manifest and icons built) |
| Masked calling between customer and driver | ⬜ (M) | — | Reduces leakage (risk R3) |

## 2. Partner experience (driver app `/driver`, fleet portal `/partner-portal`)

| Feature | Status | Notes |
|---|---|---|
| Partner landing page and application (independent driver or company) | ✅ | `partner/`, `partner/apply` |
| Admin review, commission setting, approve/reject/suspend | ✅ | `admin/providers` |
| Contract templates (versioned), personalised agreement, e-sign with email OTP | ✅ | Immutable `ProviderContract.renderedBody`; time, IP and method stored |
| Online/offline toggle, live GPS, capabilities (vehicle types, services) | ✅ | `api/driver/state`, `api/driver/location` |
| Job offers with countdown, accept/decline | ✅ | `modules/dispatch` |
| Job flow: start driving → arrived → PIN → in progress → complete | ✅ | State machine in `modules/bookings/state.ts` |
| Cash collection prompt | ✅ | |
| Earnings ledger (gross, commission, net, settled) | ✅ | `driver/earnings`, `partner-portal/earnings` |
| Fleet company: add/remove drivers, add trucks, payout details | ✅ | `partner-portal/*` |
| Company notified when its driver is assigned | ✅ | `modules/notifications/events.ts` |
| KYC document upload and verification (DL, RC, insurance, permit, fitness) | ⬜ (H) | Expiry fields exist on `Truck`; no file storage yet |
| Push notifications for offers | ⬜ (H) | Polling today; needs Web Push or a native app |
| Automated bank/UPI payouts | ⬜ (M) | Settlement is marked manually with a UTR today |
| Aadhaar eSign option for agreements | ⬜ (M) | Recommended in chapter 3 |
| Partner earnings forecast and demand heatmap | ⬜ (M) | AI-4, AI-15 |

## 3. Operations back-office (`/admin`)

| Feature | Status | Notes |
|---|---|---|
| Dashboard (live counts, recent activity) | ✅ | |
| Bookings list and detail with full event timeline | ✅ | Manual status change, cancel, retry dispatch |
| Dispatch board (open jobs, online drivers, manual assign) | ✅ | |
| Partners management | ✅ | |
| Users and staff roles (customer, driver, company owner, dispatcher, admin, super admin) | ✅ | Invite staff, activate/deactivate |
| Catalog: services, vehicle types, rate cards | ✅ | Generic resource editor |
| Content: areas, FAQs, testimonials, legal pages, contract templates | ✅ | Markdown, EN + HI, `{{brand}}` placeholders |
| Settings: brand, contact, business/GST, pricing, dispatch, payments, maps, notifications, SEO | ✅ | Live, no redeploy |
| Leads | ✅ | |
| Payouts and ledger, settle with reference | ✅ | |
| Invoices list | ✅ | |
| Analytics funnel (first-party events) | ✅ | `docs/tracking-plan.md` |
| Notification log (every email/SMS) | ✅ | |
| Audit log (who changed what) | ✅ | |
| Grievance register with 48-hour SLA tracking | ⬜ (H) | Legal requirement; leads table can be a stop-gap |
| Damage-claim workflow | ⬜ (H) | Today handled outside the system |
| B2B accounts, API keys, monthly invoicing | ⬜ (H) | Needed for fulfilment contracts |
| Reports export (CSV) for CA (GST, TDS/TCS) | ⬜ (M) | |

## 4. Platform and engineering

| Capability | Status | Notes |
|---|---|---|
| Modular monolith, Next.js 16 App Router, TypeScript, Prisma 7, Postgres | ✅ | `docs/ARCHITECTURE.md` |
| Unit tests: pricing engine, booking state machine, utilities (29 tests) | 🟡 | No integration or end-to-end tests yet |
| Deployments: Vercel (primary), Render (Docker), Neon Postgres | ✅ | Auto-deploy from `main` |
| Docker Compose local stack (db, mail catcher, migrate, app, cron) | ✅ | |
| Cron tick for dispatch timeouts and scheduled releases | ✅ | Self-advances on tracking polls if cron is late |
| Security headers, rate limits, Zod validation, signed webhooks | ✅ | `docs/developer/SECURITY.md` |
| Error monitoring and alerting (Sentry or similar) | ⬜ (H) | |
| CI pipeline (type-check, tests on every PR) | ⬜ (H) | |
| 180-day log retention (CERT-In) | ⬜ (H) | Needs a log drain |
| Realtime (SSE/WebSockets) and Redis for locations | ⬜ (M) | Scaling path in ARCHITECTURE.md |
| Self-hosted or paid maps/geocoding | ⬜ (H before scale) | Provider interface exists (`modules/geo/providers.ts`) |
| Marketing demo-film pipeline | ✅ | `marketing/` |
