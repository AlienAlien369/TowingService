# RoadSaathi — Business & Project Plan

**Prepared for:** management review · **Version:** 1.0 · **Date:** November 2026
**Product:** RoadSaathi, a towing and roadside-assistance platform for Delhi, with the name configurable from the admin panel
**Status:** product built and deployed (Vercel + Render + Neon); not yet launched to paying customers

> **How to read this pack.** This chapter is the summary. Every claim in it is expanded in a later chapter:
> competitors (ch. 2), laws (ch. 3), risks (ch. 4), AI roadmap (ch. 5), financial model (ch. 6),
> go-to-market (ch. 7) and the execution roadmap (ch. 8). Figures from outside sources carry a citation.
> Every RoadSaathi forecast is a **planning assumption**, labelled as such, and is not a promise.

---

## 1. Executive summary

**The problem.** A breakdown in Delhi still ends with a phone search: "towing near me" on Google or Justdial,
calls to strangers, a price agreed on the roadside, cash, no receipt, and no idea when the truck will arrive.
Most of India's roadside assistance (RSA) is sold as a free add-on to car insurance or a new-car warranty. The
assistance companies behind it subcontract the actual jobs to the same unorganised local tow operators. Supply
is fragmented, pricing is opaque, and nobody owns the customer experience end to end.

**What we built.** RoadSaathi is a working, production-grade platform with three sides:

- **Customers** book in four steps on a mobile-first bilingual (English/Hindi) website. They see an upfront
  GST-inclusive fare before confirming, track the truck live, get a trip PIN so only the right driver can
  start the job, and receive a GST tax invoice automatically.
- **Partners** (independent tow-truck owners and fleet companies) apply online, are reviewed, and e-sign a
  personalised agreement. They then get jobs through a driver app with live GPS and an earnings ledger.
- **Operations** run everything from one admin back-office: dispatch board, partner approval, pricing,
  service areas, legal pages, payouts, invoices, analytics and audit log. No code changes are needed.

The engineering is already done: about 10,600 lines of TypeScript across 44 pages, 9 API routes, a
29-table database, a unit-tested pricing engine and booking state machine, and two live deployments.

**The opportunity.** India had roughly **US$1.8 bn** of vehicle roadside-assistance revenue in 2024, forecast
to reach **US$2.85 bn by 2030 (≈7.9 % CAGR)**. Towing is the largest segment
([Grand View Research](https://www.grandviewresearch.com/horizon/outlook/vehicle-roadside-assistance-market/india)).
Delhi alone has **87.6 lakh registered vehicles** (up 7.9 % in 2025-26), adding about 8.5 lakh a year
([Economic Survey of Delhi via Millennium Post](https://www.millenniumpost.in/delhi/delhi-vehicle-count-up-79-to-876-lakh-653097)).

**How we win.** We start in one dense city with an excellent consumer experience: upfront price, live
tracking, verified partners and a GST invoice. That same supply network and software then becomes a
**fulfilment layer that insurers, OEMs, dealers and assistance companies plug into**. The world's profitable
roadside businesses (AA and RAC in the UK, at ~30–39 % EBITDA margins) are subscription and B2B businesses. The
loss-makers are thin-margin middlemen with high customer-acquisition costs (Urgently in the US). Our plan is
designed around that lesson (chapter 2).

**What we need.** The decisions in §9 below, and a launch budget sized in chapter 6. The base-case plan needs
roughly **₹2.5–3 crore over 24 months** to reach EBITDA break-even in year 3. A self-funded "lean pilot" variant
costs about ₹50 lakh for the first six months.

---

## 2. The problem in detail

| Who | Today's experience | What it costs them |
|---|---|---|
| **Vehicle owner** | Searches online, calls 3–5 numbers, negotiates on the spot, no ETA, cash only, no invoice | Time stuck on the road (often at night or in rain), overcharging, unsafe handling, no insurance paperwork |
| **Tow operator / fleet** | Leads come from Justdial listings, police contacts and word of mouth; trucks sit idle part of the day | Low utilisation, unpredictable income, no digital records, hard to get B2B contracts |
| **Insurers, OEMs, dealers, RSA companies** | Subcontract to local operators through phone-based control rooms | Slow, untracked, unverifiable jobs, and the poor experience reflects on *their* brand |

---

## 3. What has been built (product inventory)

Full detail: [`docs/product/FEATURE-INVENTORY.md`](../product/FEATURE-INVENTORY.md).

| Area | Built and working | Gaps before scale |
|---|---|---|
| Customer website | Home, 9 services, 6 vehicle classes, pricing, coverage and locality SEO pages, FAQ, contact and call-back, EN/HI | Native mobile app (the PWA works today) |
| Booking | 4-step wizard, map search, route distance, instant GST-inclusive quote, scheduling, OTP sign-in, trip PIN, live tracking, cancel, review | Photo upload of vehicle condition; automated cancellation-fee charging |
| Payments | Cash/UPI to driver (live); Razorpay online payment built behind a feature flag | Razorpay live-mode KYC; refund workflow |
| Partners | Online application (individual or company), admin review, contract templates, personalised agreement, e-sign with email OTP (time and IP recorded), fleet adds drivers and trucks, payout details | KYC document upload and verification (DL, RC, insurance) |
| Driver app | Online/offline, live GPS, job offers with countdown, PIN-verified start, cash collection, earnings ledger | Push notifications (5-second polling today) |
| Dispatch | Nearest-eligible-driver rounds, atomic accept, auto-expiry, next round, manual assign, scheduled release | Traffic-aware ETA; ML acceptance scoring (chapter 5) |
| Money and tax | Paise-exact pricing engine, night/surge, CGST+SGST/IGST split, FY invoice numbering, SAC code, commission ledger, settlement marking | Bank payout automation (e.g. RazorpayX), TDS/TCS reporting |
| Back-office | Dashboard, bookings, dispatch board, partners, users and staff roles, every setting editable, leads, payouts, invoices, analytics funnel, notification log, audit log | Error monitoring (Sentry), CI pipeline |
| Compliance | Legal page system (EN/HI, versioned), grievance page, audit log, hashed OTPs, rate limits, security headers | Consent capture, cookie consent, account deletion and data export (DPDP), finalised legal text (chapter 3) |

**Why this matters:** the platform's riskiest technical parts are finished, tested and deployed: the pricing
maths, dispatch, state machine, invoicing and partner contracts. The remaining work is mainly **launch
operations** (partners, legal, payments, support) plus a short list of engineering gaps sized in chapter 8.

---

## 4. Business model

| Revenue line | How it works | When |
|---|---|---|
| **Consumer commission (marketplace take rate)** | Customer pays the published rate-card fare plus GST. The platform keeps a commission on the taxable value, 20 % by default and configurable per partner | Launch |
| **B2B fulfilment** | Insurers, RSA companies, dealers, fleet operators and car-rental firms send jobs through an API or portal at contracted rates. We dispatch from our verified network and earn the spread or a per-job fee | Month 4+ |
| **Operator SaaS** | Tow operators use our dispatch, ledger and GST invoicing for their *own* customers for a monthly fee (₹999–1,999) | Month 6+ |
| **RSA membership** | Annual plan (e.g. ₹999–1,499/yr) covering a set number of call-outs: recurring, predictable revenue, the AA/RAC model | Year 2 |
| **White-label** | Brand name, colours, legal text and domain are configurable, so a dealer group or insurer can run "their" towing app on our platform | Year 2 |

**Unit economics (planning assumptions, chapter 6).** Blended job value is ₹1,400 before GST. A 20 % take
rate earns ₹280. After payment, messaging, support and a damage reserve, the contribution is about **₹210 per
job before marketing**. Paid search alone can cost ₹300–500 per *first* booking, so a pure-consumer model loses
money on the first job. **Repeat use, B2B volume and memberships are what make the model work.** This is the
central commercial insight of the plan.

---

## 5. How RoadSaathi is different

| Dimension | Unorganised local towers | Insurance/OEM RSA (Allianz, Europ, TVS Auto Assist) | Justdial / listings | **RoadSaathi** |
|---|---|---|---|---|
| Price known before booking | No (negotiated) | Free if covered; otherwise opaque | No | **Yes: published rate card, GST shown** |
| Live tracking and ETA | No | Partial / call-centre updates | No | **Yes** |
| Verified, contracted partners | No | Yes (subcontracted) | No | **Yes: reviewed, e-signed, rated** |
| Job-start security | No | Varies | No | **Trip PIN** |
| GST tax invoice | Rarely | Insurer-side | No | **Automatic, emailed** |
| Hindi-first experience | Phone only | Call centre | Partly | **Full EN/HI site** |
| Works without insurance cover | Yes | **No** (members only) | Yes | **Yes** |
| Software for the operator | No | No | Listing only | **Driver app, fleet portal, ledger** |
| Can be white-labelled for B2B | No | N/A | No | **Yes (brand is a setting)** |

**Defensibility over time** comes from network density (more trucks per km² means faster arrival), operator
software that operators rely on day to day (switching cost), B2B contracts, and data. That data includes
arrival times, demand heatmaps and damage evidence, which power the AI features in chapter 5.

---

## 6. Market sizing (top-down, indicative)

| Layer | Basis | Estimate |
|---|---|---|
| **TAM** — India roadside assistance | Grand View Research, 2024 revenue | ≈ US$1.8 bn (≈ ₹15,000 cr), 7.9 % CAGR to 2030 |
| **SAM** — Delhi-NCR towing and on-spot assistance | NCR's share of India's vehicle stock and RSA spend; *planning assumption 5–7 %* | ≈ ₹750–1,050 cr / yr |
| **SOM** — RoadSaathi year-3 target | ≈ 3.1 lakh jobs/yr (consumer, B2B and member call-outs), ≈ ₹43 cr GMV (chapter 6) | ≈ 4–5 % of SAM |

The SAM share is an assumption to be checked against primary data (operator interviews, insurer claim volumes)
in the first 60 days of the pilot.

---

## 7. Team and organisation (first 12 months)

| Role | Count | Why |
|---|---|---|
| Founder / product owner | 1 | Strategy, partners, fundraising, B2B sales |
| Full-stack engineers | 2 | Launch gaps, B2B API, AI features; on-call rota |
| Dispatch and support desk (24×7) | 5 | Three shifts plus cover. Watches the dispatch board, handles `NO_DRIVER_FOUND`, complaints and grievances |
| Partner acquisition and quality | 1 | Signs up and trains tow operators, audits documents, handles damage claims |
| Part-time / retained | — | Chartered accountant (GST, TDS, books), startup lawyer (documents, contracts), designer (as needed) |

---

## 8. Milestones (summary of chapter 8)

| Phase | Window | Exit criteria |
|---|---|---|
| **0. Launch readiness** | Weeks 0–6 | Entity, GST, legal pages final, DLT SMS, production email, insurance, 30+ active partners, 24×7 desk staffed |
| **1. Delhi pilot** | Months 2–4 | 30+ jobs/day, median arrival < 35 min, completion > 90 %, grievance acknowledgement < 48 h |
| **2. NCR + B2B** | Months 4–9 | Noida, Gurugram, Ghaziabad, Faridabad live; 2+ B2B contracts; Razorpay live; operator SaaS beta |
| **3. Scale + AI wave 1** | Months 9–18 | 200+ jobs/day; AI photo triage, voice/WhatsApp booking, smart dispatch; 2nd metro |
| **4. Platform** | Months 18–36 | RSA membership, insurer/OEM APIs, 3+ cities, EBITDA-positive |

---

## 9. Decisions needed from management

| # | Decision | Recommendation | Why it matters |
|---|---|---|---|
| 1 | Legal entity | **Private limited company** before launch | The E-Commerce Rules expect a Companies Act company. It also gives limited liability and lets us raise investment (chapter 3) |
| 2 | Contracting model: who is the "seller" to the customer? | **Platform as principal** to start (matches the current code), revisited with the CA | Decides GST, TDS/TCS treatment, liability for service quality, and invoice design |
| 3 | Damage and liability model | Partners must hold insurance; platform investigates and facilitates; platform liability capped. Add platform goods-in-tow cover from year 2 | The largest trust risk and the largest legal exposure |
| 4 | Named Grievance Officer | A named India-based person (founder at first) | Legal requirement; shown on the website |
| 5 | Brand name | Run a trademark search on "RoadSaathi" before spending on marketing | Avoids a forced rebrand later; changing the name is one setting in the product |
| 6 | Funding route | Lean self-funded pilot (≈ ₹50 L) **then** a seed round of ≈ ₹2.5–3 cr on pilot data | Pilot data (arrival times, repeat rate, CAC) makes fundraising far easier |
| 7 | B2C vs B2B emphasis | **B2C pilot to prove service quality, B2B to scale revenue** | Chapter 2: B2B and subscriptions are where the industry's profits are |

---

## 10. Chapters in this pack

| # | Chapter | File |
|---|---|---|
| 2 | Competitor analysis, India and global, with financials | [`02-competitor-analysis.md`](02-competitor-analysis.md) |
| 3 | Legal and regulatory map | [`03-legal-regulatory-map.md`](03-legal-regulatory-map.md) |
| 4 | Biggest obstacles and risk register | [`04-risk-register.md`](04-risk-register.md) |
| 5 | AI features roadmap | [`05-ai-roadmap.md`](05-ai-roadmap.md) |
| 6 | Financial model and unit economics | [`06-financial-model.md`](06-financial-model.md) |
| 7 | Go-to-market plan | [`07-go-to-market.md`](07-go-to-market.md) |
| 8 | Execution roadmap and launch checklist | [`../product/ROADMAP.md`](../product/ROADMAP.md) |

*Disclaimer: this plan is a business and research document, not legal, tax or investment advice. The legal and
tax points in chapter 3 must be confirmed by an Indian startup lawyer and a chartered accountant before launch.*
