# Admin guide — what you can change without touching code

Sign in at `/en/admin` with the `ADMIN_EMAIL` address (emailed one-time code). The super admin can add **Dispatchers** (operations only) and **Admins** under *Users & staff*.

| I want to… | Where |
|---|---|
| Rename the brand, change logo/colors, tagline, social links | Settings → **Brand** (updates site, emails, invoices, SMS, contracts, favicon, PWA name instantly) |
| Change phone numbers, emergency number, email, office address, hours | Settings → **Contact & address** |
| Set GSTIN, PAN, SAC code, GST %, invoice/booking prefixes | Settings → **Business, GST & invoicing** |
| Change night/surge multipliers, cancellation fee, default commission | Settings → **Pricing rules** |
| Tune dispatch radius, offers per round, timeouts, scheduling | Settings → **Dispatch** |
| Turn Razorpay on/off ("coming soon" ↔ test ↔ live), cash payments | Settings → **Payments** |
| Switch OpenStreetMap ↔ Google Maps, map tiles, default centre | Settings → **Maps** |
| Choose who gets emails/SMS, ops alert address | Settings → **Notifications** |
| Add/remove a service or vehicle type, edit text in English + Hindi | Catalog → **Services / Vehicle types** |
| Change prices | Catalog → **Rate cards** (₹ per vehicle × service: base, included km, per km, minimum) |
| Add a locality or an NCR city (active vs coming soon, radius) | Content → **Service areas** |
| Edit FAQs, testimonials | Content → **FAQs / Testimonials** |
| Edit Terms, Privacy, Cancellation, Grievance, partner overview | Content → **Legal pages** (Markdown, EN + HI, placeholders like `{{brand}}`) |
| Edit the partner agreement text (driver / fleet company) | Content → **Contract templates** (bump the version for new terms; old signed copies stay unchanged) |
| Approve / reject partner applications, set commission, suspend | **Partners** |
| Manually assign a driver / cancel / retry dispatch | **Bookings → open booking**, or the **Dispatch board** |
| Settle partner payouts | **Payouts & ledger** (select entries → enter UTR/reference → mark settled) |
| See who changed what | **Audit log**; emails/SMS sent → **Notification log** |

## Partner onboarding (what happens)
1. Partner applies at `/en/partner` → appears under **Partners** as *Pending*.
2. You review, set commission %, click **Approve & send agreement** → the personalised agreement is generated from the active template and emailed.
3. Partner signs in the driver app / partner portal, reads the agreement, types their name and confirms with an emailed code → account becomes **Active**.
4. Companies add their own drivers and trucks; when a booking is assigned to a company's driver, **both the driver and the company are emailed**.

## Money flow cheat-sheet
- Customer pays total = taxable fare + 18% GST (editable).
- Platform commission = % of the **taxable fare** (per-partner override → company → default).
- *Cash jobs:* provider keeps the cash and owes you commission + GST collected (shown as "Providers owe platform").
- *Online jobs (Razorpay):* you hold the money and owe the provider's net (shown as "Platform owes providers").
