# Tracking plan

First-party product analytics, stored in Postgres (`AnalyticsEvent`) and read by **Admin → Analytics**.
Code: `src/modules/analytics/track.ts` (catalogue + server helper), `src/app/api/event/route.ts` (browser beacon), `src/shared/client/track.tsx` (client helper).

```yaml
meta:
  product: RoadSaathi (name is configurable)
  version: 1
  destinations: [postgres-first-party]      # add a CDP later by forwarding from trackServer()
  naming: snake_case, object_action          # events: booking_submitted, partner_apply_started
  pii_policy: none-in-events                 # no names/phones/emails/addresses in event props. user_id only.
  internal_user_policy: exclude-staff        # DISPATCHER/ADMIN/SUPER_ADMIN beacons are dropped server-side
```

## Principles
- **Minimal.** Every event answers a funnel, revenue or ops question. No page-view spam (`page_view` is reserved, not auto-fired).
- **Properties over events** for variants (`booking_completed.payment_method`, not `booking_completed_cash`).
- **Business truth is server-side** (booking, payment, review, contract). Browser events only for intent and CTA clicks.
- **Never** put PII or free text in `props`. Money is integer paise, distance is km.

## Events

| Event | Fired from | When | Properties (all optional unless noted) |
|---|---|---|---|
| `cta_call_click` | browser | Any tap on a call-now link | `where`: topbar, hero, footer, action-bar, contact, mobile-menu, final |
| `cta_whatsapp_click` | browser | WhatsApp CTA tap | – |
| `language_changed` | browser | EN/हिं toggle | `to`: en, hi |
| `booking_started` | browser | Booking wizard opens | `vehicle`, `service` (slugs from deep links) |
| `booking_step_completed` | browser | Each wizard step passed | `step`: 0–2 |
| `quote_viewed` | server | Fare quote returned | `service`, `total` (paise) |
| `otp_requested` | server | Any OTP sent | `channel`: EMAIL, SMS |
| `login_success` | server | OTP verified | `isNew`, `role` |
| `booking_submitted` | server | Booking created | `code`, `payOnline` |
| `booking_cancelled` | server | Customer cancels | `bookingId` |
| `booking_completed` | server | Driver completes job | `payment_method`, `total`, `distance_km`, `service_id`, `has_company` |
| `payment_succeeded` | server | Razorpay capture verified | `method`, `amount` |
| `review_submitted` | server | Customer rates driver | `rating` 1–5 |
| `job_accepted` | server | Driver accepts offer | `independent` |
| `partner_apply_started` | browser | Partner form opened | `type`: DRIVER, COMPANY |
| `partner_apply_submitted` | server | Application saved | `type` |
| `contract_signed` | server | Agreement e-signed | `contractId` |
| `coming_soon_lead` | server | “Notify me” for NCR areas | `kind`, `area` |
| `razorpay_interest_clicked` | browser | Tap on the disabled “Pay online” card | – (demand signal for enabling Razorpay) |

## Funnels & KPIs (Admin → Analytics)
1. **Booking funnel:** `booking_started → quote_viewed → booking_submitted → booking_completed`.
2. **Supply funnel:** `partner_apply_submitted → contract_signed` (+ approval time from audit log).
3. **Emergency intent:** `cta_call_click` by `where` — tells you which surface drives calls.
4. **Payment demand:** `razorpay_interest_clicked` ÷ `booking_submitted` decides when to flip Razorpay from *coming soon*.
5. **Geo demand:** `coming_soon_lead` by `area` ranks the next NCR launch.

Operational metrics (time-to-assign, offer acceptance rate, cancellations, ratings) are computed from the transactional tables (`Booking`, `BookingEvent`, `DispatchOffer`, `Review`), not from events.

## Entity traits (stored on the transactional tables, not sent as events)
- **User:** `role`, `locale`, `createdAt`. **Driver:** `status`, `companyId` (independent vs fleet), `ratingAvg`, `ratingCount`. **Company:** `status`, `commissionBp`.
- Snapshot counts (online drivers, open bookings) are queried live; no scheduled sync needed at this scale.

## Delta / backlog (intentionally *not* instrumented yet)
| Candidate | Why deferred |
|---|---|
| `page_view` auto-tracking | Volume with little signal; add only when running paid acquisition (then forward to GA via `googleAnalyticsId`). |
| `offer_declined`, `offer_expired` | Already in `DispatchOffer` rows. |
| Forwarding to a CDP / PostHog / Amplitude | Add inside `trackServer()` and `/api/event`; keep event names unchanged. |
| Naming migration to `object.action` | Pre-launch rename is cheap if you prefer dotted names; do it once, in `EVENTS`. |
