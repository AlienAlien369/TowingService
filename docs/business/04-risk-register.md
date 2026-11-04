# Chapter 4 — Biggest obstacles and risk register

Scoring: **Likelihood (L)** and **Impact (I)** on a 1–5 scale, **Score = L × I**. Review monthly; anything at 15 or above
goes on the management agenda.

## 4.1 The five obstacles that decide success

1. **Supply density, 24×7.** A customer stuck at 2 a.m. in Dwarka needs a truck *near Dwarka at 2 a.m.* Arrival time is
   the product. With too few partners online, the dispatcher sees `NO_DRIVER_FOUND`, and one bad night can lose a
   customer for life. *Answer:* launch in a limited set of zones, guarantee minimum earnings for night partners in the
   pilot, and expand only when median arrival stays under 35 minutes.
2. **Customer acquisition cost vs. low frequency.** People need a tow rarely, perhaps once every few years. Paid search
   for "towing near me Delhi" is expensive, and our contribution is about ₹210 per job (chapter 6). *Answer:* SEO
   (locality pages are already built), partnerships with dealers, insurers, fleets, parking operators and housing
   societies, and memberships that turn a one-off into a recurring customer.
3. **Leakage (disintermediation).** After one job, the customer has the driver's number and may call directly next
   time. *Answer:* masked calling, platform-only benefits (invoice, damage cover, tracking, membership), a partner
   agreement clause against solicitation (already in clause 3.4), and making the platform the partner's best source
   of jobs so leaving costs them more than staying.
4. **Trust and damage claims.** One scratched luxury car or one rude driver can go viral. *Answer:* KYC'd partners,
   trip PIN (built), photo condition report at pickup and drop (to build, AI-assisted in chapter 5), mandatory partner
   insurance, a fast claims SOP, and ratings with automatic suspension.
5. **Incumbent B2B lock-in.** Most new cars and insured cars already come with "free" RSA from Allianz, Europ, TVS Auto
   Assist and others. *Answer:* sell to these companies as their Delhi fulfilment partner instead of fighting them,
   and win uncovered customers: older vehicles, two-wheelers, commercial vehicles, and people whose RSA failed them.

## 4.2 Risk register

| ID | Risk | Category | L | I | Score | Mitigation | Owner | Early-warning signal |
|---|---|---|---|---|---|---|---|---|
| R1 | Not enough partners online in a zone or hour; long arrivals | Operations | 4 | 5 | **20** | Zone-limited launch; night incentives; fleet-company partners; demand heatmaps (AI-4) | Ops lead | Time-to-assign > 5 min; `NO_DRIVER_FOUND` > 5 % |
| R2 | CAC higher than contribution per job | Commercial | 4 | 4 | **16** | SEO, B2B channels, memberships, referral credits; stop any paid channel with CAC > 1.5× contribution | Founder | Blended CAC > ₹300 |
| R3 | Customers or partners transact off-platform | Commercial | 4 | 4 | **16** | Masked calls, platform-only value, anti-solicitation clause, quality bonuses | Founder | Repeat rate falling while partner job count steady |
| R4 | Partners don't remit commission and GST on cash jobs | Financial | 3 | 4 | 12 | Credit limit per partner; offset against online earnings; auto-pause above a balance; push online payment | Finance | "Providers owe platform" balance > 14 days |
| R5 | Customer vehicle damaged; claim exceeds partner's means | Legal/Trust | 3 | 5 | **15** | Partner insurance mandatory; photo evidence; claims SOP; platform cover from year 2 | Ops lead | Any claim > ₹25,000 |
| R6 | Safety incident (assault, theft, accident during tow) | Safety | 2 | 5 | 10 | KYC and police verification of drivers, trip PIN, live tracking, SOS contact, suspension policy | Ops lead | Any incident |
| R7 | Regulatory change: aggregator licensing, social-security contribution, DPDP, e-commerce amendments | Legal | 3 | 3 | 9 | Compliance calendar (chapter 3); budget 1 % of turnover for social security; counsel on retainer | Founder | Gazette notifications |
| R8 | Wrong GST/TDS/TCS model causes back taxes and penalties | Tax | 3 | 4 | 12 | Decide principal vs. marketplace with CA before launch; monthly reconciliations | Finance + CA | CA review findings |
| R9 | Personal-data breach | Security | 2 | 5 | 10 | Security baseline (`docs/developer/SECURITY.md`), CERT-In incident plan, least-privilege admin roles, log retention | Eng lead | Unusual admin logins; rate-limit spikes |
| R10 | OSM public endpoints throttle us (geocoding/routing) | Technology | 4 | 3 | 12 | Self-host Nominatim/OSRM, or switch to Google/Mappls (provider interface already exists) | Eng lead | 429 errors from geo API |
| R11 | SMS OTP delivery failures (DLT, operator filtering) | Technology | 3 | 4 | 12 | DLT registration; Firebase phone auth with email fallback (built); WhatsApp OTP later | Eng lead | OTP verify rate < 85 % |
| R12 | Polling load grows with live tracking at scale | Technology | 2 | 3 | 6 | SSE/WebSockets + Redis for locations (scaling path in ARCHITECTURE.md) | Eng lead | DB CPU > 60 % sustained |
| R13 | Fraud: fake bookings, GPS spoofing, collusive fake jobs to earn incentives | Fraud | 3 | 3 | 9 | OTP-verified accounts; PIN-gated start; GPS sanity checks; anomaly detection (AI-7) | Eng + Ops | Completed jobs with zero movement |
| R14 | Key-person dependency (solo founder, single developer) | Organisation | 4 | 4 | **16** | Documentation (this pack), second engineer, shared credentials vault, runbooks | Founder | — |
| R15 | Funding gap before break-even | Financial | 3 | 5 | **15** | Lean pilot first; 18–24 months runway at seed; monthly burn review | Founder | Runway < 9 months |
| R16 | Brand/trademark conflict on "RoadSaathi" | Legal | 2 | 3 | 6 | Trademark search before marketing spend; brand is a single setting to change | Founder | Search result |
| R17 | Accounting or governance failure (GoMechanic case) | Governance | 1 | 5 | 5 | Ledger is source of truth; monthly close; external audit; no booking of unrealised revenue | Finance | Ledger vs. bank mismatch |
| R18 | 24×7 desk burnout and attrition | People | 3 | 3 | 9 | Shift rota, automation of routine steps, clear escalation, fair pay | Ops lead | Missed SLAs at night |
| R19 | Weather surges (monsoon waterlogging, fog season) overwhelm supply | Operations | 4 | 3 | 12 | Seasonal partner standby agreements; surge cap ≤ 1.5× with clear display; pre-positioning | Ops lead | IMD alerts |
| R20 | A big B2B client takes most of the volume (concentration, as at Urgently) | Commercial | 2 | 4 | 8 | No single client > 30 % of revenue; keep the consumer channel | Founder | Concentration report |

## 4.3 Top risks heat view

| Impact ↓ / Likelihood → | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **5** | R17 | R6, R9 | R5, R15 | R1 | |
| **4** | | R20 | R4, R8, R11 | R2, R3, R14 | |
| **3** | | R12, R16 | R7, R13, R18 | R10, R19 | |
