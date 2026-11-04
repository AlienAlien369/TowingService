# Product requirements document (PRD) — RoadSaathi

**Owner:** product (founder) · **Status:** v1 built; v1.1 launch scope below · **Last updated:** November 2026

## 1. Vision
Make getting help on the road in India as predictable as booking a cab: **see the price, see the truck, trust the driver,
get a proper invoice.**

## 2. Goals and non-goals

| Goals (next 12 months) | Non-goals (for now) |
|---|---|
| Reliable 24×7 towing and on-spot help across Delhi, then NCR | Owning a truck fleet (we stay asset-light) |
| Median arrival under 35 minutes in active zones | Statutory/police towing of illegally parked vehicles |
| Fair, transparent pricing with GST invoicing | Vehicle repairs and spare-parts retail |
| A partner network operators prefer over listing sites | Insurance products (we partner with insurers, we don't underwrite) |
| B2B fulfilment for fleets, dealers, insurers and RSA companies | Pan-India launch before NCR unit economics are proven |

## 3. Personas

| Persona | Context | Needs | Success looks like |
|---|---|---|---|
| **Priya, 32, car owner, Saket** | Car won't start at 10:30 p.m. after dinner | Someone trustworthy, fast; knows the cost; safe | Truck arrives in 25 min, price as quoted, invoice on email |
| **Rakesh, 45, owns one flatbed, Mayapuri** | Gets 3–4 jobs a day from calls; idle in afternoons | More jobs, fair pay, no chasing payment | 2 extra jobs a day, weekly settlement, good ratings |
| **Anil, fleet owner, 8 trucks** | Runs a small towing company with employed drivers | Keep trucks busy, see which driver did what, GST paperwork | Every job tracked in the portal; company notified on each assignment |
| **Dispatcher on night shift** | Watches open bookings | Know which jobs are stuck, assign manually, call drivers | No job sits unassigned more than 5 minutes |
| **B2B client (insurer / RSA company)** | Needs a Delhi network for its policyholders | API, SLA, tracking link, claim evidence | Jobs submitted by API, status webhooks, monthly invoice |

## 4. Core user journeys (all built)

1. **Book:** choose vehicle → service → pickup (and drop for towing) → see quote → sign in with OTP → confirm → get code and PIN.
2. **Dispatch:** nearest eligible online drivers within the radius receive offers (N per round, timeout) → the first to
   accept is assigned atomically → customer, driver and company are notified.
3. **Fulfil:** driver starts driving → arrives → enters the customer's PIN → job in progress → completes → cash collected
   or online payment → invoice issued and ledger entry written.
4. **Partner onboarding:** apply → admin approves and sets commission → personalised agreement generated → e-sign with OTP → active.
5. **Settle:** ledger shows what each partner owes or is owed → finance settles with a reference.

## 5. v1.1 launch scope (must ship before public launch)

| ID | Requirement | Acceptance criteria | Priority |
|---|---|---|---|
| L1 | **Terms and Privacy acceptance at booking and partner sign-up** | Checkbox (unticked by default) with links; booking or application cannot be submitted without it; store document slug, version, timestamp and IP per user | Must |
| L2 | **Final legal pages** | Lawyer-reviewed Terms, Privacy, Cancellation & Refund, Grievance, Cookie notice; template banner removed | Must |
| L3 | **Grievance officer details** | Name, email, phone and address from Admin → Settings rendered on the grievance page and footer | Must |
| L4 | **Partner KYC documents** | Upload DL, RC, insurance, permit and fitness; admin can view, approve or reject per document; expiry dates stored; partner cannot go online with an expired document | Must |
| L5 | **Analytics consent** | Google Analytics loads only after consent; first-party events contain no PII (already true) | Must |
| L6 | **Production integrations** | DLT SMS live, production SMTP with SPF/DKIM, `EXPOSE_DEV_OTP` off, strong secrets | Must |
| L7 | **Error monitoring and log retention** | Sentry (or similar) alerts on server errors; logs shipped to storage kept 180 days | Must |
| L8 | **Soften e-signature wording** in contract templates (chapter 3) and bump the template version | New version active; old signed contracts unchanged | Must |
| L9 | **Grievance register** | Complaints have status, owner and timestamps; dashboard shows any complaint older than 48 h without acknowledgement | Should |
| L10 | **Refunds for online payments** | Admin issues a full or partial refund through Razorpay; payment status updates; customer emailed | Should (before Razorpay live) |
| L11 | **CI** | Type-check and tests run on every pull request | Should |

## 6. v1.2–v2 scope (post-launch)
Photo condition reports, push notifications, damage-claim workflow, B2B accounts and API, automated payouts, masked
calling, WhatsApp booking, account deletion and data export (DPDP, by May 2027), RSA membership, operator SaaS. See
`docs/business/05-ai-roadmap.md` for AI items.

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Quote < 2 s p95 (includes routing); pages LCP < 2.5 s on 4G mid-range Android |
| Availability | 99.5 % monthly for booking and dispatch; cron delay must not stop dispatch (already self-advancing) |
| Security | OWASP ASVS L1 baseline; role checks on every server action; no PII in analytics |
| Privacy | Data minimisation; retention per `docs/operations/OPERATIONS-SOP.md` §7; DPDP-ready by May 2027 |
| Accessibility | WCAG 2.1 AA on customer flows (contrast, labels, keyboard) |
| Localisation | Every customer string in EN and HI; typed dictionaries enforce parity |
| Money | Integer paise everywhere; totals always equal subtotal + GST (unit-tested) |

## 8. Open product questions
1. Principal vs. marketplace invoicing (decision #2 in the business plan) changes the invoice template and ledger.
2. Should the customer see the driver's phone number, or only masked calling?
3. Cancellation fee: charge online, add it to the partner's next settlement, or waive it during the pilot?
4. Membership design: number of free call-outs, waiting period, vehicles covered.
