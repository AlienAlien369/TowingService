# Chapter 6 — Financial model and unit economics

> **Every number in this chapter is a planning assumption, not a forecast or a promise.** The model exists to show
> *which levers matter* and to size the funding need. Replace assumptions with pilot data at month 3. Amounts are in
> **₹ lakh** (1 crore = 100 lakh) unless stated. GST is excluded from revenue (it is collected for the government).

## 6.1 Pricing already in the product

Rate cards are editable in Admin → Catalog → Rate cards. Seeded defaults:

| Towing (base covers first 5 km) | Reference base | Per km after 5 km | Flatbed ×1.3 · Winch ×1.5 · Accident ×1.8 |
|---|---|---|---|
| Two-wheeler | ₹499 | ₹17–19 | e.g. flatbed ₹650 |
| Car | ₹999 | ₹30–38 | e.g. flatbed ₹1,300 |
| SUV | ₹1,299 | ₹38–48 | e.g. flatbed ₹1,690 |
| Commercial (LCV) | ₹1,999 | ₹55–69 | e.g. accident ₹3,600 |
| Heavy (truck/bus) | ₹3,999 | ₹99–113 | e.g. accident ₹7,200 |

On-spot services are flat: jump-start ₹249–899, tyre ₹249–999, fuel delivery ₹299–599 (plus fuel), lockout ₹349–699,
breakdown mechanic ₹349–1,199. Night (10 p.m.–6 a.m.) ×1.25; surge is off by default; 18 % GST is added.

## 6.2 Unit economics per consumer job (assumptions)

| Line | ₹ per job | Assumption |
|---|---|---|
| Blended job value (taxable, before GST) | **1,400** | Mix of car/SUV towing (~₹1,300–1,800) and on-spot services (~₹350–600) |
| Platform commission (take rate) | **280** | 20 % default (Admin → Pricing rules; overridable per partner) |
| Payment gateway | −10 | 30 % of jobs online × ~2 % of the GST-inclusive fare |
| SMS / OTP / maps | −6 | DLT SMS ~₹0.2 each, OTPs, routing calls |
| Support and dispatch desk (variable share) | −40 | Calls and chats per job |
| Damage-claim reserve | −14 | 1 % of job value |
| **Contribution before marketing** | **≈ 210** | 75 % of commission |
| Customer acquisition cost (paid search, first job) | 300–500 | To be measured in the pilot |

**Reading:** a customer bought with paid search only pays back after about two jobs. That is why the plan relies on
**organic and partner channels, B2B volume and memberships** (chapter 7) rather than paid ads alone.

## 6.3 Three-year planning case

| | Year 1 (Delhi pilot) | Year 2 (NCR + B2B) | Year 3 (scale, 2–3 cities) |
|---|---|---|---|
| Consumer jobs / day (average) | 33 (ramp 5 → 80) | 200 | 600 |
| Consumer jobs / year | 12,045 | 73,000 | 2,19,000 |
| B2B fulfilment jobs / year | — | 15,000 | 80,000 |
| RSA members (₹1,199/yr) | — | 2,000 | 20,000 |
| Operator SaaS accounts | — | 50 @ ₹1,000/mo | 300 @ ₹1,200/mo |
| **GMV, all jobs (taxable)** | **₹1.7 cr** | **₹12.5 cr** | **₹43.3 cr** |
| Commission revenue | 33.7 | 204.4 | 613.2 |
| B2B margin (₹150/job) | — | 22.5 | 120.0 |
| SaaS revenue | — | 6.0 | 43.2 |
| Membership revenue | — | 24.0 | 239.8 |
| **Net revenue** | **33.7** | **256.9** | **1,016.2** |
| Variable costs (per-job costs, B2B handling, member call-outs paid to partners) | −8.4 | −68.3 | −297.3 |
| **Gross margin** | 25.3 (75 %) | 188.6 (73 %) | 718.9 (71 %) |
| People | −62 | −180 | −300 |
| Marketing | −30 | −80 | −120 |
| Tech infrastructure, SMS, maps | −6 | −15 | −35 |
| Legal, CA, audit, insurance | −10 | −15 | −30 |
| Office and other | −8 | −20 | −40 |
| Social-security fund (assumed 1 % of revenue, from Y2) | — | −2.6 | −10.2 |
| **EBITDA** | **−90.7** | **−124.0** | **+183.7 (18 %)** |
| Cumulative cash need (before capex and working capital) | 90.7 | 214.7 | — |

<figure class="chart">
<svg viewBox="0 0 720 270" role="img" aria-labelledby="ftitle fdesc" xmlns="http://www.w3.org/2000/svg">
  <title id="ftitle">Net revenue and EBITDA by year, ₹ lakh</title>
  <desc id="fdesc">Net revenue 33.7, 256.9 and 1016.2 lakh in years 1 to 3. EBITDA minus 90.7, minus 124.0 and plus 183.7 lakh.</desc>
  <style>
    .t{font:700 13px Inter,system-ui,sans-serif;fill:#0b0b0b}
    .l{font:600 12px Inter,system-ui,sans-serif;fill:#52514e}
    .v{font:600 12px Inter,system-ui,sans-serif;fill:#0b0b0b}
    .ax{stroke:#d9d8d3;stroke-width:1}
  </style>
  <text class="t" x="10" y="18">Net revenue (₹ lakh)</text>
  <line class="ax" x1="10" y1="200" x2="340" y2="200"/>
  <!-- scale 0.17 px per lakh; max 1016 -> 172.7px -->
  <rect x="40"  y="194.3" width="60" height="5.7"   rx="4" fill="#2a78d6"/><text class="v" x="70"  y="188" text-anchor="middle">33.7</text>
  <rect x="140" y="156.3" width="60" height="43.7"  rx="4" fill="#2a78d6"/><text class="v" x="170" y="150" text-anchor="middle">256.9</text>
  <rect x="240" y="27.3"  width="60" height="172.7" rx="4" fill="#2a78d6"/><text class="v" x="270" y="44" text-anchor="middle" style="fill:#fff">1,016.2</text>
  <text class="l" x="70" y="218" text-anchor="middle">Y1</text><text class="l" x="170" y="218" text-anchor="middle">Y2</text><text class="l" x="270" y="218" text-anchor="middle">Y3</text>
  <text class="t" x="380" y="18">EBITDA (₹ lakh)</text>
  <!-- zero line at y=130; scale 0.5 px per lakh -->
  <line class="ax" x1="380" y1="130" x2="710" y2="130"/>
  <rect x="410" y="130" width="60" height="45.4" rx="4" fill="#eb6834"/><text class="v" x="440" y="192" text-anchor="middle">−90.7</text>
  <rect x="510" y="130" width="60" height="62"   rx="4" fill="#eb6834"/><text class="v" x="540" y="208" text-anchor="middle">−124.0</text>
  <rect x="610" y="38.2" width="60" height="91.8" rx="4" fill="#2a78d6"/><text class="v" x="640" y="32" text-anchor="middle">+183.7</text>
  <text class="l" x="440" y="248" text-anchor="middle">Y1</text><text class="l" x="540" y="248" text-anchor="middle">Y2</text><text class="l" x="640" y="248" text-anchor="middle">Y3</text>
</svg>
<figcaption>Planning case from the table above. Blue = positive, orange = negative. The two panels use different scales and should not be compared bar-to-bar.</figcaption>
</figure>

## 6.4 Sensitivity (year-3 EBITDA, ₹ lakh)

| Scenario | Net revenue | EBITDA |
|---|---|---|
| Planning case | 1,016 | **+184** |
| Take rate 15 % instead of 20 % | 863 | +32 |
| Consumer volume 30 % lower (420/day) | 832 | +48 |
| No membership product | 776 | +58 |
| Average job value ₹1,200 instead of ₹1,400 | 929 | +97 |
| Half the B2B volume | 956 | +140 |
| Upside: 750 jobs/day and 30,000 members | 1,289 | +360 |

**Most sensitive levers:** take rate, consumer volume and memberships. Any two adverse cases together push year 3 back
to a loss, which is why the plan keeps fixed costs flexible (shift staff scale with volume) and reviews the model monthly.

## 6.5 Funding plan

| Option | Amount | Covers | When |
|---|---|---|---|
| **Lean pilot (self-funded / friends & family)** | ≈ ₹50 lakh | 6 months of Delhi pilot at year-1 cost levels (≈ ₹58 L fixed less ≈ ₹10 L revenue) | Now |
| **Seed round** | ≈ ₹2.5–3 cr | Years 1–2 cumulative need (≈ ₹2.15 cr) plus about 6 months' buffer | After 3 months of pilot data |
| Grants and schemes | Variable | Startup India Seed Fund Scheme, state startup policies (DPIIT recognition first) | In parallel |

**Use of seed funds (indicative):** people 55 %, partner acquisition and marketing 25 %, technology and AI 10 %,
compliance, insurance and buffer 10 %.

## 6.6 Assumptions to validate in the pilot (first 90 days)

1. Blended job value and service mix (towing vs. on-spot).
2. Partner acceptance of a 20 % commission. Benchmark: aggregators commonly take 15–30 %.
3. CAC by channel (search, SEO, dealers, societies, insurers).
4. Repeat and referral rate at 90 days.
5. Share of online vs. cash payments, and commission recovery days for cash jobs.
6. Willingness to pay for an annual membership (survey plus a ₹1 pre-booking test).
