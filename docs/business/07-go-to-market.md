# Chapter 7 — Go-to-market plan and KPIs

## 7.1 Customer segments (in launch order)

| Segment | Why they need us | How we reach them | Phase |
|---|---|---|---|
| **Delhi car and SUV owners without useful RSA** (older cars, expired cover, RSA that failed them) | Need a fast, honest, priced tow now | Google search and SEO (locality pages already built), Google Business Profile, call-now CTAs | Pilot |
| **Two-wheeler and three-wheeler owners** (Delhi has more two-wheelers than cars; e-rickshaws are growing fast) | Cheap, quick on-spot help (puncture, battery, fuel) | Hindi-first pages, WhatsApp, petrol-pump and mechanic tie-ups | Pilot |
| **Independent workshops, dealers, used-car dealers** | Need reliable pickup and drop of customer cars | Partner sales; scheduled bookings (built) | Months 2–6 |
| **Fleets**: cab operators, delivery fleets, logistics LCVs, rental cars | Downtime costs money; need invoices and tracking | B2B accounts, monthly GST invoicing, API | Months 4–9 |
| **Insurers, RSA companies, OEMs** (Allianz, Europ, TVS Auto Assist, Roadzen, ReadyAssist and others) | Need a dependable tracked Delhi-NCR fulfilment network | Fulfilment contracts, API, insurer claim pack (AI-9) | Months 6–12 |
| **Housing societies, corporate parks, parking operators** | Residents' and employees' vehicles break down on site | RWA partnerships, member pricing, QR posters | Months 3–9 |

## 7.2 Supply-side plan (partners), which comes first

Without supply there is no product. Target **30 active partners before launch** and **100 by month 4**, spread across
the launch zones so every zone has at least 3 trucks online at night.

1. **List** every towing operator in launch zones from Justdial, Google Maps and transport-nagar yards.
2. **Visit**, demo the driver app (works on any Android phone, no install needed), and explain the earnings ledger.
3. **Offer a launch package:** 0 % commission for the first 20 jobs, a guaranteed night-shift minimum in the pilot,
   and priority dispatch for top-rated partners.
4. **Onboard** through the built flow: application → review → e-signed agreement → active. Add document upload (roadmap).
5. **Retain** with weekly settlements (built), fair dispatch, a partner WhatsApp group, a monthly top-partner award, and
   later the operator SaaS so partners run their whole business on RoadSaathi.

## 7.3 Demand channels and target CAC

| Channel | Tactics | Target CAC |
|---|---|---|
| SEO | Area pages (`/areas/[slug]`), service pages, Hindi content, FAQ schema (JSON-LD already in code) | < ₹50 |
| Google Business Profile | One profile per hub, reviews request after every job | < ₹50 |
| Paid search | "towing near me", "car towing Delhi", "puncture repair near me" in launch zones only, at night | < ₹300 |
| Partnerships | Dealers, workshops, RWAs, parking operators, petrol pumps, tyre shops, with referral fees | < ₹150 |
| B2B | Insurers, RSA companies, fleets | Sales cost per contract |
| Referral | ₹100 credit for referrer and friend | < ₹200 |
| PR and social | Launch story ("first priced-upfront towing in Delhi"), monsoon readiness campaigns | — |

Marketing videos: the repo already contains a demo-film pipeline (`marketing/`) that produces product videos with voice-over
from the real app.

## 7.4 Launch zones (Delhi pilot)

Start where breakdown density and partner supply overlap. Suggested first zones are South (Saket, Okhla), West (Dwarka,
Janakpuri), Central (Connaught Place, Karol Bagh) and North (Rohini, Pitampura). Configure these in Admin → Service areas.
NCR cities (Noida, Gurugram, Ghaziabad, Faridabad) are already seeded as **coming soon** with a notify-me form, and the
`coming_soon_lead` event ranks which one to open next.

## 7.5 Pricing strategy

- Keep the **published rate card** as the core promise: no haggling, total shown before booking.
- Keep night surcharge (×1.25) and surge **capped and visible**. Plan a cap of 1.5× in line with dark-pattern rules and the
  aggregator-guideline benchmark of 2×.
- B2B: contracted per-job rates with monthly invoicing.
- Membership (year 2): ₹999–1,499/yr for N free call-outs plus discounted towing, benchmarked on insurer RSA add-ons.

## 7.6 KPIs (north star and guardrails)

| KPI | Definition | Pilot target | Where measured |
|---|---|---|---|
| **North star: completed jobs per week** | `Booking.status = COMPLETED` | Growth ≥ 10 % week on week in the pilot | Admin dashboard |
| Time to assign | `assignedAt − createdAt` | p50 < 3 min | Bookings / BookingEvent |
| Arrival time | ARRIVED event − ASSIGNED event | p50 < 35 min, p90 < 60 min | BookingEvent |
| Completion rate | Completed ÷ submitted | > 90 % | Analytics funnel |
| `NO_DRIVER_FOUND` rate | Share of bookings escalated | < 5 % | Dispatch board |
| Offer acceptance rate | Accepted ÷ offers sent | > 40 % | DispatchOffer |
| Cancellation rate (customer / partner) | Cancelled ÷ submitted | < 8 % | BookingEvent |
| Rating | Average review | ≥ 4.5 | Review |
| Booking funnel conversion | `booking_started → booking_submitted` | > 35 % | Analytics |
| CAC (blended) | Marketing spend ÷ new customers | < ₹300 | Finance + analytics |
| 90-day repeat or referral rate | Customers with 2+ jobs or a referral | > 15 % | Bookings |
| Grievance acknowledgement | Complaints acknowledged within 48 h | 100 % (legal) | Support tool |
| Cash commission recovery | Days to recover commission + GST on cash jobs | < 7 days | Ledger |
| Partner supply | Partner-hours online per zone at night | ≥ 3 trucks per zone | Driver state |
