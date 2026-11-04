# Chapter 8 — Execution roadmap and launch checklist

Owners: **F** founder · **E** engineering · **O** operations · **L** lawyer · **CA** chartered accountant.

## 8.1 Timeline

<figure class="chart">
<svg viewBox="0 0 720 230" role="img" aria-labelledby="rtitle rdesc" xmlns="http://www.w3.org/2000/svg">
  <title id="rtitle">Roadmap phases over 36 months</title>
  <desc id="rdesc">Phase 0 launch readiness weeks 0 to 6; Phase 1 Delhi pilot months 2 to 4; Phase 2 NCR and B2B months 4 to 9; Phase 3 scale and AI wave 1 months 9 to 18; Phase 4 platform months 18 to 36.</desc>
  <style>
    .p{font:600 12px Inter,system-ui,sans-serif;fill:#0b0b0b}
    .m{font:500 11px Inter,system-ui,sans-serif;fill:#52514e}
    .g{stroke:#ecebe7;stroke-width:1}
  </style>
  <!-- x: 200 + month*14 (36 months -> 504px) -->
  <g>
    <line class="g" x1="200" y1="20" x2="200" y2="200"/><text class="m" x="200" y="215" text-anchor="middle">0</text>
    <line class="g" x1="284" y1="20" x2="284" y2="200"/><text class="m" x="284" y="215" text-anchor="middle">6</text>
    <line class="g" x1="368" y1="20" x2="368" y2="200"/><text class="m" x="368" y="215" text-anchor="middle">12</text>
    <line class="g" x1="452" y1="20" x2="452" y2="200"/><text class="m" x="452" y="215" text-anchor="middle">18</text>
    <line class="g" x1="536" y1="20" x2="536" y2="200"/><text class="m" x="536" y="215" text-anchor="middle">24</text>
    <line class="g" x1="620" y1="20" x2="620" y2="200"/><text class="m" x="620" y="215" text-anchor="middle">30</text>
    <line class="g" x1="704" y1="20" x2="704" y2="200"/><text class="m" x="704" y="215" text-anchor="middle">36 mo</text>
  </g>
  <text class="p" x="10" y="44">0 · Launch readiness</text><rect x="200" y="32" width="21" height="18" rx="4" fill="#2a78d6"/>
  <text class="p" x="10" y="80">1 · Delhi pilot</text><rect x="228" y="68" width="28" height="18" rx="4" fill="#2a78d6"/>
  <text class="p" x="10" y="116">2 · NCR + B2B</text><rect x="256" y="104" width="70" height="18" rx="4" fill="#2a78d6"/>
  <text class="p" x="10" y="152">3 · Scale + AI wave 1</text><rect x="326" y="140" width="126" height="18" rx="4" fill="#2a78d6"/>
  <text class="p" x="10" y="188">4 · Platform</text><rect x="452" y="176" width="252" height="18" rx="4" fill="#2a78d6"/>
</svg>
<figcaption>Months from go-ahead. Phases overlap slightly in practice; exit criteria, not dates, decide when the next phase starts.</figcaption>
</figure>

## 8.2 Phase 0 — Launch readiness (weeks 0–6)

**Business and legal**
- [ ] Incorporate a private limited company; PAN, TAN, bank account (F, CA)
- [ ] GST registration; confirm SAC/rate per service and principal vs. marketplace model (CA)
- [ ] Trademark search and filing for the brand, classes 39 and 9/42 (L)
- [ ] Lawyer review of Terms, Privacy, Cancellation & Refund, Grievance, Cookie notice and both partner agreements (L)
- [ ] Appoint and publish the Grievance Officer (F)
- [ ] Insurance: commercial general liability and cyber; partner insurance requirements finalised (F)
- [ ] IP assignment agreements from all contributors (L)
- [ ] DPIIT Startup India recognition (optional, F)

**Product and engineering (PRD v1.1 items L1–L11)**
- [ ] Consent capture at booking and partner sign-up (E)
- [ ] Grievance officer settings fields and page (E)
- [ ] Partner KYC document upload and verification, with expiry blocking (E)
- [ ] Analytics consent banner (E)
- [ ] Contract template v2 with softened e-signature wording (L, E)
- [ ] Sentry, uptime monitor, log drain with 180-day retention (E)
- [ ] CI with type-check and tests (E)
- [ ] Production SMTP (SPF/DKIM), DLT SMS (MSG91) live, `EXPOSE_DEV_OTP=false`, rotate `AUTH_SECRET` and `CRON_SECRET` (E)
- [ ] Paid or self-hosted geocoding and routing before marketing spend (E)
- [ ] Load test: 50 concurrent bookings and 200 online drivers (E)
- [ ] Security review against `docs/developer/SECURITY.md` (E)

**Operations**
- [ ] Recruit and onboard 30+ partners across launch zones, with at least 3 night-capable trucks per zone (O)
- [ ] Staff the 24×7 desk (5 people, 3 shifts); train on `docs/operations/OPERATIONS-SOP.md` (O)
- [ ] Set rate cards, service areas, contact numbers and business details in Admin → Settings (O)
- [ ] Run 20 internal test bookings end to end, including night, cancellation and cash flows (O, E)

**Exit criteria:** every box above ticked; legal sign-off received; 30 active partners.

## 8.3 Phase 1 — Delhi pilot (months 2–4)
- Soft launch in 4 zones; Google Business Profile; SEO; small night-time paid search test.
- Weekly KPI review (chapter 7 table); fix the top three issues each week.
- Razorpay KYC and test mode; enable live mode once refunds (L10) ship.
- Collect the six pilot assumptions in chapter 6 §6.6.
- **Exit:** ≥ 30 jobs/day; p50 arrival < 35 min; completion > 90 %; rating ≥ 4.5; 100 % grievances acknowledged in 48 h.

## 8.4 Phase 2 — NCR and B2B (months 4–9)
- Open Noida, Gurugram, Ghaziabad and Faridabad in demand order (`coming_soon_lead`).
- B2B: accounts, API keys, status webhooks, monthly invoicing; sign 2+ contracts (dealers, fleets, an RSA company).
- Operator SaaS beta for 20 partners; push notifications; automated payouts; damage-claim workflow; photo condition report.
- Raise the seed round on pilot data.
- **Exit:** 150+ jobs/day; 2 B2B contracts live; CAC < ₹300 blended.

## 8.5 Phase 3 — Scale and AI wave 1 (months 9–18)
- AI-3 smart dispatch, AI-2 photo triage with AI-9 claim pack, AI-1 WhatsApp/voice agent, AI-8 support copilot.
- DPDP readiness by 13 May 2027: consent records, deletion/export, breach process, processor contracts.
- Second metro (choose by partner interest and demand data).
- Realtime (SSE/WebSockets) and Redis for locations; PostGIS for matching.
- **Exit:** 400+ jobs/day; contribution margin positive after marketing.

## 8.6 Phase 4 — Platform (months 18–36)
- RSA membership launch; insurer/OEM integrations; telematics pilots (AI-10).
- Three or more cities; per-city pricing and dispatch settings.
- **Exit:** EBITDA positive (chapter 6 planning case, year 3).

## 8.7 Engineering estimate for Phase 0 items

| Item | Estimate (engineer-days) |
|---|---|
| Consent capture + records table | 2 |
| Grievance officer settings + page | 0.5 |
| KYC document upload (object storage, admin review, expiry blocking) | 5 |
| Analytics consent banner | 1 |
| Contract template v2 | 0.5 |
| Monitoring, log drain, uptime | 1.5 |
| CI pipeline | 0.5 |
| Production integrations (SMTP, DLT, secrets) | 1.5 |
| Geocoding/routing provider switch or self-host | 2–4 |
| Load test + fixes | 3 |
| Security review + fixes | 2 |
| **Total** | **≈ 20–22 engineer-days** (about 2 weeks for 2 engineers) |
