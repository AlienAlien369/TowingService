# Chapter 5 — AI features roadmap

**Principle:** every AI feature must move a business metric in the KPI table (chapter 7): arrival time, completion rate,
CAC, damage disputes, support cost or leakage. AI that only looks impressive is out of scope. Every feature below says
what data it needs. Most of that data is **already captured** by the platform: `BookingEvent` timelines,
`DispatchOffer` accept/decline/expiry, driver GPS, reviews, ledger and analytics funnel.

## 5.1 Feature catalogue

| # | Feature | What it does | Business value | Data needed (✓ = already captured) | Effort | Phase |
|---|---|---|---|---|---|---|
| AI-1 | **Voice and WhatsApp booking agent (Hindi / English / Hinglish)** | A stranded customer calls or messages; an AI agent collects vehicle, problem and location (WhatsApp location pin), quotes the fare and creates the booking through the existing booking service, with a human takeover button | 24×7 intake without extra night staff; many stranded users prefer to call; lower CAC from WhatsApp | Booking API ✓, rate cards ✓, FAQ ✓; WhatsApp Business API + speech-to-text/LLM provider | M | 3 |
| AI-2 | **Photo triage and condition report** | Customer or driver uploads photos; a vision model identifies the vehicle class, visible damage, low ground clearance or EV badge, and recommends flatbed vs. wheel-lift. Pickup and drop photos are compared to flag new damage | Right truck first time; **evidence in damage disputes** (risk R5); insurer-ready claim pack | Photo upload (to build); vehicle catalog ✓; booking timeline ✓ | M | 3 |
| AI-3 | **Smart dispatch: ETA and acceptance prediction** | Predicts each driver's real arrival time (traffic, time of day, truck type) and probability of accepting, then offers the job to the driver set most likely to arrive fastest | Lower time-to-assign and arrival time (the core KPI); fewer dispatch rounds | `DispatchOffer` outcomes ✓, driver GPS ✓, `BookingEvent` timestamps ✓, OSRM/Google travel times ✓ | M | 3 |
| AI-4 | **Demand forecasting and driver pre-positioning** | Hour-by-zone forecast from history, weather (IMD rain alerts, fog), festivals, cricket matches and road closures; heatmap in the driver app and incentives for under-supplied zones | Fixes obstacle #1 (supply density); fewer `NO_DRIVER_FOUND` | Booking history ✓, areas ✓, weather API | M | 3 |
| AI-5 | **Fair dynamic pricing with guardrails** | Suggests the surge multiplier per zone and hour from forecast vs. supply, capped (e.g. ≤ 1.5×) and always shown in the quote | Balances supply at peaks while staying compliant with dark-pattern rules and fare-cap norms | Pricing engine ✓ (surge is already a parameter), AI-4 forecast | S | 4 |
| AI-6 | **Document AI for partner KYC** | OCR of driving licence, RC, insurance, permit and fitness certificates; checks against DigiLocker / Vahan / Sarathi where permitted; expiry reminders; face match of driver selfie to licence | Onboard partners in hours, not days; fewer expired-document risks (Motor Vehicles Act compliance) | Document upload (to build); `Truck` expiry fields ✓ | M | 2–3 |
| AI-7 | **Fraud and leakage detection** | Flags GPS spoofing (impossible speeds), completed jobs with no movement, repeated cancellations between the same customer and driver (collusion), and partners whose job count fell while customers reappear off-platform | Protects margins (risks R3, R13) | Driver GPS ✓, booking events ✓, ledger ✓, reviews ✓ | M | 4 |
| AI-8 | **Support and grievance copilot** | Summarises a booking's full timeline for the agent, drafts the reply in the customer's language, classifies the grievance and tracks the 48-hour legal acknowledgement deadline | Faster, consistent support; legal SLA compliance (chapter 3) | `BookingEvent` ✓, notification log ✓, audit log ✓ | S | 3 |
| AI-9 | **Insurance claim pack generator (B2B)** | One click produces a PDF and JSON pack (photos, timeline, GPS trail, invoice, recovery receipt) for the customer's insurer, available through the B2B API | Differentiator for insurer and OEM contracts; faster claims for customers | Invoice ✓, timeline ✓, photos (AI-2) | S | 3 |
| AI-10 | **Predictive breakdown alerts (telematics partners)** | With OEM, fleet or OBD-device partners, predicts battery failure and other faults and offers a jump-start or service before the vehicle stops | Turns emergency jobs into scheduled ones; strong B2B story for fleets | Third-party telematics feed | L | 5 |
| AI-11 | **Crash detection (opt-in)** | The PWA or a future app detects a likely crash from phone sensors and offers help and recovery, with emergency-contact sharing | Safety brand; earliest possible booking | Device sensors; explicit consent (DPDP) | L | 5 |
| AI-12 | **Partner quality score and coaching** | Combines ratings, review text sentiment, cancellations, arrival accuracy and complaints into one score that drives job priority and coaching messages | Better service without manual policing | Reviews ✓, offers ✓, events ✓ | S | 3 |
| AI-13 | **Admin natural-language analytics** | Ops staff ask "cancellations in Dwarka last week by hour" and get a chart. The LLM writes read-only SQL against a safe view | Faster decisions without a data analyst | Analytics events ✓, transactional tables ✓ | S | 4 |
| AI-14 | **Bilingual content and SEO generation** | Drafts locality pages, FAQs and service pages in English and Hindi for human review | Organic acquisition (lower CAC) | Areas ✓, services ✓ | S | 2 |
| AI-15 | **Earnings forecast for partners** | Tells each partner expected earnings by zone and hour, and when to go online | Partner retention and supply at the right hours | Ledger ✓, AI-4 | S | 4 |

Effort: **S** ≈ 1–2 engineer-weeks, **M** ≈ 3–6, **L** ≈ 8+ including partnerships.
Phases follow the execution roadmap: 2 = NCR + B2B (months 4–9), 3 = scale + AI wave 1 (9–18), 4 = platform (18–36), 5 = later.

## 5.2 Recommended first wave (months 9–18)

1. **AI-3 smart dispatch**, which directly improves the core KPI and uses data we already have.
2. **AI-2 photo condition report**, which builds trust, limits damage claims and sells to insurers (with **AI-9**).
3. **AI-1 WhatsApp and voice agent**, for night-time intake without hiring more desk staff.
4. **AI-8 support copilot**, a small effort that protects the 48-hour grievance SLA.

## 5.3 Architecture fit

- The modular monolith already isolates the places AI plugs into. Dispatch scoring goes inside `modules/dispatch`
  (`runDispatchRound` chooses drivers today by distance). Photo checks become a new `modules/media` module. The agent
  calls the same `createBooking` service the website uses, so business rules are never duplicated.
- LLM and vision calls go through one provider interface, the same pattern as `modules/geo/providers.ts`. That keeps the
  vendor swappable and makes cost, logging and redaction easy to control.
- **Human in the loop** for anything that affects money or a person's livelihood: price changes, partner suspension and
  claim decisions. AI recommends; staff approve. Each decision is written to the existing `AuditLog`.

## 5.4 AI governance (DPDP and trust)

- Collect only what each feature needs, with a purpose-specific consent line (e.g. "photos are used to record your
  vehicle's condition and resolve damage claims").
- Strip or mask personal data (names, phones, number plates where not needed) before sending to an external model.
  Record which vendors process data in the privacy policy's subprocessor list.
- Keep model inputs and outputs for audit for a defined period, then delete them.
- Publish a short "How we use AI" section in the privacy policy.
