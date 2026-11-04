# Operations standard operating procedures (SOPs)

For the 24×7 dispatch and support desk, partner team and finance. Admin screens are described in
[`../ADMIN-GUIDE.md`](../ADMIN-GUIDE.md).

## 1. Desk structure
- **Shifts:** 06:00–14:00, 14:00–22:00, 22:00–06:00, with at least one dispatcher per shift and an on-call ops lead.
- **Tools:** Admin → Dispatch board (always open), Bookings, Partners, Notification log; desk phone; WhatsApp business.
- **Handover:** at the end of each shift, note open jobs, partners offline unexpectedly, and unresolved complaints.

## 2. Dispatch SOP

| Situation | Action | Target |
|---|---|---|
| New booking, offers going out | Watch only; system offers N nearest drivers per round | Assigned < 3 min |
| No acceptance after round 1 | Call the nearest online partner directly; ask them to accept in the app | — |
| `NO_DRIVER_FOUND` | Call partners in neighbouring zones; **manual assign** in the booking; call the customer with an honest ETA | Customer called < 5 min |
| Driver not moving 5 min after assignment | Call driver; if unreachable, reassign (status back to finding driver) | — |
| ETA slipping > 15 min | Proactive call or SMS to the customer | — |
| **Accident recovery** booking | Ask: is anyone injured (direct to **112**)? Is there a police case/FIR? Do police need to release the vehicle? Record answers in booking notes before dispatching | Before dispatch |
| Lockout | Driver must check proof of ownership (RC and ID) before opening | At site |
| Unsafe location (highway shoulder at night, flood) | Advise the customer to move to a safe spot and stay out of the vehicle; prioritise; brief the driver | — |
| Scheduled booking | Released automatically before the slot; confirm with the customer 30 min before | — |

## 3. Partner onboarding and quality
1. **Application review (within 24 h):** check the licence class, RC (body type: recovery vehicle or crane), insurance,
   permit, fitness and PUC validity, PAN/GSTIN, bank/UPI, and police verification for drivers.
2. **Physical check** for the first truck of each partner: equipment (straps, wheel dollies, winch, cones, reflective
   jacket), photos of the truck.
3. **Approve with commission** → agreement is generated and emailed → partner e-signs → **active**.
4. **Training (30 min):** app flow, trip PIN, handling standards (flatbed for luxury, low, AWD, EV and damaged vehicles),
   photos at pickup and drop, conduct, no off-platform solicitation, cash handling and commission remittance.
5. **Quality rules:** rating below 4.0 over 20 jobs → coaching; below 3.5 or a serious complaint → suspension pending
   review; any safety incident → immediate suspension.
6. **Document expiry:** review monthly. Expired insurance or fitness → partner set offline until renewed.

## 4. Customer support and grievance SOP
- **Channels:** phone, email (support address), WhatsApp, contact form (Admin → Leads).
- **Legal timelines (E-Commerce Rules):** **acknowledge every complaint within 48 hours** and **resolve within one month**.
  Our internal target is resolution within 7 days.
- **Register every complaint** (until the grievance register ships, use Admin → Leads with status, plus a shared sheet)
  with booking code, category, owner, received/acknowledged/resolved timestamps and outcome.
- **Categories and owners:** billing/refund → finance; damage → ops lead; driver conduct → partner team;
  privacy/data request → founder (privacy); app bug → engineering.
- **Escalation:** anything unresolved after 7 days goes to the Grievance Officer.

## 5. Damage-claim SOP
1. Customer reports within **24 hours** with photos (per Terms). Open a claim with the booking code.
2. Collect evidence: pickup and drop photos (once photo capture ships), booking timeline and GPS, driver statement.
3. Decide within 7 days: pre-existing / partner liable / shared. Partner pays directly, or through their insurance, or by
   recovery from settlements as the partner agreement allows (clause 5.2).
4. Pay or reject in writing with reasons. Log every claim amount for the risk register (R5).

## 6. Finance SOP
- **Daily:** reconcile Razorpay settlements (when live) with `Payment` rows.
- **Weekly settlement:** Admin → Payouts & ledger; pay partners their net for online jobs; collect commission + GST for
  cash jobs (offset where possible); mark settled with UTR/reference.
- **Credit control:** a partner owing more than the set limit or for longer than 14 days is paused until cleared.
- **Monthly:** export invoices for GST returns; TDS/TCS per the model chosen with the CA; month-end close; bank reconciliation.
- **Refunds:** per the Cancellation & Refund policy (5–7 working days to original method); record the reason.

## 7. Data handling and retention
- Look up customer data only to serve that customer's booking or complaint.
- Never share a customer's phone, address or vehicle details outside the assigned partner and staff.
- Data requests (access, correction, deletion) go to the privacy owner and are answered within the time the
  DPDP Rules set (once in force). Log each request.
- Proposed retention: bookings, invoices and ledger as required for tax records (CA to confirm, typically 8 years);
  notification and system logs 180 days; inactive customer accounts reviewed after 3 years.

## 8. Daily checks (ops lead)
- [ ] Partners online per zone for tonight
- [ ] Yesterday's `NO_DRIVER_FOUND` and cancellations, with reasons
- [ ] Complaints near the 48-hour acknowledgement deadline
- [ ] Partner balances owed > 14 days
- [ ] Notification log failures (SMS/email)
