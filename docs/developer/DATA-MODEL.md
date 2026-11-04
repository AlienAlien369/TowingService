# Data model

Source of truth: [`prisma/schema.prisma`](../../prisma/schema.prisma) (29 models). Each block is owned by one module, and
other modules reach it only through that module's service functions.

## Entity overview

```
User ─┬─< Session                         (auth)
      ├─< Booking >── VehicleType, Service  (bookings / catalog)
      ├── Driver ─┬─< Truck                 (providers)
      │           ├─< DispatchOffer >── Booking   (dispatch)
      │           ├─< ProviderContract >── ContractTemplate
      │           └─< LedgerEntry
      └─< Company ─┬─< Driver, Truck, ProviderContract, LedgerEntry
Booking ─┬─< BookingEvent (audit trail of every status change)
         ├─< Payment, ── Invoice (1:1), ── Review (1:1), ── LedgerEntry (1:1)
VehicleType ×── Service via RateCard (unique pair)
```

## Tables by module

| Module | Model | Purpose | Key fields / rules |
|---|---|---|---|
| auth | `User` | Anyone who signs in | `email` and `phone` unique; `role` ∈ CUSTOMER, DRIVER, COMPANY_OWNER, DISPATCHER, ADMIN, SUPER_ADMIN; `isActive` |
| auth | `Session` | Server-side session | Only `tokenHash` (SHA-256 of token + secret) is stored; 30-day expiry; IP and user agent |
| auth | `OtpChallenge` | One-time codes | `codeHash`, `attempts`, `expiresAt`, `consumedAt`; per identifier + IP |
| shared | `RateLimit` | Fixed-window counters | Atomic upsert in `shared/lib/guard.ts` |
| settings | `SiteSetting` | One JSON row per group | Keys: brand, contact, business, pricing, dispatch, payments, maps, notifications, seo |
| content | `Page` | Legal/info pages | `title`/`body` are `{en, hi}` markdown with placeholders; `version`; `isPublished` |
| content | `Faq`, `Testimonial`, `Area`, `Lead` | Site content, service areas, inbound leads | `Area.status` ACTIVE / COMING_SOON with lat/lng/radius |
| catalog | `VehicleType`, `Service`, `RateCard` | What can be booked and what it costs | Money in **paise**; `RateCard` unique on (vehicleType, service); `Service.requiresDrop` |
| providers | `Company` | Fleet partner | Status PENDING → APPROVED → ACTIVE (or REJECTED / SUSPENDED); `commissionBp` override; bank/UPI |
| providers | `Driver` | Independent or company driver | `companyId` null = independent; `isOnline`, `lastLat/lastLng/lastSeenAt`; rating aggregates |
| providers | `Truck` | Recovery vehicle | `registrationNo` unique; `kind`; insurance/permit/fitness expiry dates |
| providers | `ContractTemplate` | Agreement text per party type | Unique (party, version); new terms = new version |
| providers | `ProviderContract` | A partner's personalised agreement | `renderedBody` is an **immutable snapshot**; signature name, time, IP, method |
| bookings | `Booking` | A job | `code` unique; `fare` JSON snapshot; `subtotal`, `gstAmount`, `total` in paise; `startPin`; status machine |
| bookings | `BookingEvent` | Timeline | Every transition, with actor type/id and optional lat/lng |
| bookings | `Review` | 1–5 rating + comment | One per booking |
| dispatch | `DispatchOffer` | Offer to a driver | PENDING → ACCEPTED / DECLINED / EXPIRED / CANCELLED; round; distance; expiry |
| payments | `Payment` | Cash or Razorpay record | `providerOrderId`, `providerPaymentId`, raw payload |
| invoicing | `Invoice`, `InvoiceCounter` | GST tax invoice, FY sequence | Seller and buyer **snapshots**; SAC; place of supply; CGST/SGST/IGST |
| invoicing | `LedgerEntry` | Money owed per completed job | gross, commission, net (paise); payee driver or company; PENDING → SETTLED with reference |
| notifications | `NotificationLog` | Every email/SMS attempt | Status, provider, error; OTPs redacted |
| platform | `AuditLog` | Who changed what | actor, action, entity, meta, IP |
| analytics | `AnalyticsEvent` | First-party product events | No PII in `props` (see tracking plan) |

## Invariants worth knowing
- `Booking.total = subtotal + gstAmount`, always (enforced by the pricing engine and its tests).
- Commission is computed on the **taxable value** (`subtotal`), using driver → company → platform-default basis points.
- An invoice and ledger entry are created exactly once, at completion (`bookingId` is unique on both).
- Signed contracts never change. Template edits create a new version.
- Seller details on an invoice are a snapshot, so later changes to business settings never alter issued invoices.

## Personal data map (for privacy and DPDP)

| Data | Where | Who sees it | Retention (proposed, confirm with counsel) |
|---|---|---|---|
| Name, email, phone | `User`, `Booking.contact*`, `Lead` | Customer, assigned partner (booking contact), staff | Account life + 3 years; bookings per tax record rules |
| Pickup/drop addresses and coordinates | `Booking` | Assigned partner, staff | With the booking record |
| Driver live location | `Driver.lastLat/lastLng` (latest only), `BookingEvent` lat/lng | Customer during an active job, staff | Latest point only; event points with the booking |
| Partner KYC (licence no., PAN, GSTIN, address) | `Driver`, `Company` | Staff | Partnership + 8 years (tax) |
| Bank/UPI details | `Driver`, `Company` | Staff (finance) | Partnership + 8 years; restrict access |
| IP addresses, user agents | `Session`, `OtpChallenge`, `AuditLog`, `ProviderContract` | Staff (security) | Sessions until expiry; logs 180 days (CERT-In); contract signature with the contract |
| Payment identifiers | `Payment` | Staff (finance) | Per tax record rules |
| Message content | `NotificationLog` | Staff (support) | 180 days |
