# Chapter 3 — Legal and regulatory map

**Scope:** what Indian law asks of a towing and roadside-assistance platform that (a) sells to consumers online, (b) works
with independent tow operators and fleet companies, (c) handles personal and location data, and (d) collects money
and issues GST invoices. Status is as of November 2026.

> **Not legal advice.** This is a research map to brief a Delhi startup lawyer and a chartered accountant, who must
> confirm every row before launch. Items marked **⚠ confirm** are open questions where the answer depends on facts
> or on rules not yet notified.

## 3.1 Summary — what is mandatory before the first paying customer

| # | Requirement | Law | Status in product | Owner |
|---|---|---|---|---|
| 1 | Incorporated entity (private limited recommended) | Companies Act 2013; Consumer Protection (E-Commerce) Rules 2020, Rule 4(1)(a) | Entity details are admin settings (placeholders today) | Founder + lawyer |
| 2 | Legal name, address, contact details and **named Grievance Officer** on the website; acknowledge complaints within 48 h, resolve within 1 month | E-Commerce Rules 2020, Rules 4 & 5; IT (Intermediary) Rules 2021 | Grievance page exists; officer name field missing | Founder |
| 3 | Privacy Policy that matches real data practices | IT Act s.43A + SPDI Rules 2011; DPDP Act 2023 (phased) | Template exists; needs subprocessors, retention, cookie section | Lawyer + eng |
| 4 | Terms of Service, Cancellation & Refund policy shown **before** payment; no dark patterns | Consumer Protection Act 2019; E-Commerce Rules; Dark Patterns Guidelines 2023 | Templates exist; acceptance is not recorded yet | Lawyer + eng |
| 5 | GST registration, tax invoices, returns | CGST/IGST Acts | Invoicing built (SAC, CGST/SGST/IGST split, FY numbering) | CA |
| 6 | DLT registration for SMS (sender ID + templates) | TRAI TCCCPR 2018 | MSG91 adapter ready; DLT pending | Ops |
| 7 | Partner agreements (driver, fleet) | Indian Contract Act 1872; IT Act s.10A | Templates + e-sign flow built | Lawyer |
| 8 | Partner vehicle and driver compliance checks | Motor Vehicles Act 1988; CMVR 1989 | Licence number field only; **document upload/verification missing** | Ops + eng |
| 9 | Security practices, 180-day logs, 6-hour incident reporting | CERT-In Directions (28 Apr 2022); SPDI Rules | Audit log exists; log-retention policy and incident plan to be written (see `docs/operations/INCIDENT-RESPONSE.md`) | Eng |

## 3.2 Detailed map

### A. Company, e-commerce and consumer protection
- **Consumer Protection (E-Commerce) Rules 2020.** These apply to entities selling goods *or services* over a
  digital network. Covered entities must be a Companies Act company (or a specified foreign entity). They must display
  legal name, address, customer-care and grievance-officer details, show the total price including taxes before
  purchase, and handle complaints within the set timelines. The research you supplied notes amendments notified in
  September 2026 that take effect on **1 January 2027**, adding more disclosure and dark-pattern duties.
  **⚠ confirm** the final amended text with counsel.
- **Guidelines for Prevention and Regulation of Dark Patterns, 2023.** No false urgency, drip pricing, forced
  sign-up, hidden subscription or confusing cancellation. *Product impact:* our night/surge surcharge is shown in the
  quote breakdown, which is good. The offer countdown is for drivers, not customers. Keep surge capped and visible.
- **Unfair contract terms.** The Consumer Protection Act 2019 lets consumer commissions strike down one-sided
  terms. A liability cap "limited to the fare" may not survive negligent damage to a car worth lakhs. Pair it
  with a real claims process and insurance (chapter 4, risk R5).

### B. Information technology and data protection
- **IT Act 2000, s.43A and SPDI Rules 2011.** Covered businesses must publish a privacy policy and keep "reasonable
  security practices", documented in an information-security programme. ISO 27001 is one way to show this, but it is
  not mandatory. *Sensitive data we hold:* bank details and UPI IDs of partners, and passwords (none; we use OTPs).
- **IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021.** Relevant to the extent the platform is
  an intermediary (user reviews, partner listings): publish rules and a user agreement, and name a grievance officer.
- **Digital Personal Data Protection Act 2023 and DPDP Rules 2025.** These come into force in phases. Under the
  commencement notification, the main notice, consent, security, breach-notification, children's-data and
  data-principal-rights duties apply from about **13 May 2027**. *Product impact (build before then):*
  itemised consent notice at booking and partner sign-up; consent records; withdrawal; **account deletion and data
  export** (missing today); retention schedule (e.g. booking data kept for the GST record period, analytics with no PII,
  as the tracking plan already requires); processor contracts with subprocessors (email, SMS, maps, Firebase, Razorpay,
  hosting); breach notification to the Data Protection Board and affected users.
- **Location data.** Drivers share continuous GPS while online. The partner agreement already covers this (clause 7.2).
  The privacy policy must say how long location history is kept. Today only the last point is stored on `Driver`;
  `BookingEvent` stores lat/lng at status changes.
- **CERT-In Directions 2022.** Report specified cyber incidents to CERT-In **within 6 hours** of noticing them. Keep
  ICT logs for a **rolling 180 days** (within Indian jurisdiction per the directions; see CERT-In FAQ on clarifications).
  Name a point of contact. *Product impact:* Vercel/Render logs are short-lived by default, so add a log drain to
  storage you control.
- **Electronic signatures. ⚠ important.** The current partner agreement says that typing a name plus an email OTP
  "constitutes a valid electronic signature under the IT Act 2000". Under the IT Act, a legally defined *electronic
  signature* means the methods notified in the Second Schedule (for example Aadhaar eSign or a digital signature
  certificate). A typed name with OTP is better described as an **electronically formed contract** (s.10A IT Act plus the
  Indian Contract Act), backed by our audit trail of time, IP and OTP. **Recommendation:** soften that sentence now, and
  offer Aadhaar eSign (via an ASP such as Leegality, Digio or Signzy) for fleet-company agreements.

### C. Tax
- **GST registration.** Registration is compulsory above the threshold (₹20 lakh aggregate turnover for services in
  most states), and may be compulsory regardless of turnover for some e-commerce arrangements. **⚠ confirm with CA.**
  Rate: the product defaults to **18 % under SAC 996799** (other supporting services to transport). The CA must confirm
  the SAC and rate per service (towing, on-spot repair and fuel delivery may differ).
- **Who supplies the customer?** This is the most important tax question:
  - *Platform as principal* (current code: platform issues the invoice on the full fare). The platform charges GST to the
    customer on the full value. Partners supply *to the platform*, and their own GST registration and reverse-charge
    questions follow. The platform deducts **TDS under s.194C** when paying partners above the thresholds.
  - *Platform as e-commerce operator (marketplace)*. Partners are the suppliers. The platform collects **GST TCS under
    s.52 CGST** (0.5 % CGST + 0.5 % SGST, or 1 % IGST) and deducts **income-tax TDS under s.194-O at 0.1 %**
    (rate from 1 Oct 2024). Towing is **not** currently a s.9(5) service, where the operator itself pays the GST.
  - The choice changes invoices, ledger and returns. The code supports the principal model today, and the ledger
    already separates gross, commission and net per job.
- **Cash jobs.** Partners collect the full fare including GST, and the platform recovers commission plus GST through
  settlements (already modelled in the ledger as "providers owe platform"). This needs a clear recovery process and
  credit limits (chapter 4, risk R4).

### D. Transport and vehicles
- **Motor Vehicles Act 1988 and Central Motor Vehicles Rules 1989.** Tow and recovery trucks must be registered in the
  correct body type ("breakdown van / recovery vehicle" or "crane-mounted vehicle", per the CMVR vehicle-type
  notifications). They need valid fitness, permit (where applicable), insurance and PUC, and drivers need a licence
  of the right class. *Product impact:* the `Truck` table already has insurance, permit and fitness expiry fields. Add
  document upload, verification and expiry alerts before scale.
- **Motor Vehicle Aggregator Guidelines 2025 (MoRTH, 1 July 2025).** These are written for **passenger** transport
  aggregators: state licence, ₹5 lakh fee, driver training, AIS-140 trackers, and fare caps up to 2× base at peak. Towing
  is not passenger transport, so they probably do not apply directly. States adopt them through their own rules,
  though, and the surge-cap principle is a useful benchmark. **⚠ confirm** with counsel and watch Delhi Transport
  Department notifications.
- **Accident vehicles and police.** Vehicles in accidents with an FIR or medico-legal case may need police release before
  removal. Operations must check before dispatching **accident recovery** (SOP in `docs/operations/OPERATIONS-SOP.md`).
- **Statutory towing.** Towing illegally parked vehicles is done by Delhi Traffic Police contractors under separate
  rules. It is a different market, and we must not imply any police authority.

### E. Labour and gig workers
- **Code on Social Security 2020.** Came into force on **21 November 2025** together with the other labour codes. It
  defines gig workers, platform workers and aggregators. Aggregators will contribute **1–2 % of annual turnover, capped at
  5 % of amounts paid to gig/platform workers**, to a social security fund. **The rate and start date are not yet
  notified.** Budget for 1 % of turnover from year 2 (chapter 6). Whether a tow-truck *business owner* (rather than a
  driver) counts as a "platform worker" is a **⚠ confirm** item.
- **State gig-worker laws** (Rajasthan 2023, Karnataka 2025 and others) add registration and welfare-fee duties where we
  operate. Track this before expanding beyond Delhi.
- **Own employees.** EPF/ESI once headcount thresholds are crossed. An internal POSH committee once there are 10+
  employees. Delhi Shops & Establishments registration for the office.

### F. Payments
- **RBI Payment Aggregator directions.** Use a licensed PA (Razorpay). If the platform collects money on partners'
  behalf and pays them out, use the PA's split or settlement product (e.g. Razorpay Route) rather than pooling funds in
  our current account. **⚠ confirm** under the final principal/marketplace model.
- **Refunds.** Commit to refund timelines in the Cancellation & Refund policy (5–7 working days today) and keep them.

### G. Insurance
- Partners must carry vehicle insurance and should carry **goods-in-transit / goods-in-custody** cover for customer vehicles.
- The platform should buy **commercial general liability** and **cyber** cover once live, and consider platform-level
  goods-in-tow cover from year 2.
- **RSA memberships are not insurance** if sold as a prepaid service contract (call-outs included). Do not describe
  them as insurance or promise indemnity, which would bring them under IRDAI. **⚠ confirm** the membership terms with counsel.

### H. Intellectual property
- **Trademark search and filing** for the brand (Form TM-A, Class 39 transport/towing, Class 9/42 software).
  Fee: ₹4,500 per class for startups/small entities online.
- **Code ownership:** written IP assignment from every contributor (founders, employees, contractors), as required by
  Copyright Act s.19.
- **Open-source licences:** all dependencies are permissive (MIT/Apache/BSD/ISC). OpenStreetMap data and tiles need
  attribution under ODbL, which Leaflet shows by default. Public OSM tiles, Nominatim and OSRM are fair-use only, so move
  to a paid or self-hosted provider before real traffic.

## 3.3 Compliance calendar

| When | Item |
|---|---|
| Before launch | Rows 1–9 of §3.1; insurance; trademark search; soften e-signature wording |
| Monthly / quarterly | GST returns (GSTR-1, GSTR-3B); TDS returns (quarterly); grievance register review |
| 1 Jan 2027 | E-Commerce Rules amendments take effect, so review the checkout, cancellation and pricing displays |
| By 13 May 2027 | DPDP core obligations: consent manager readiness, deletion/export, breach process, processor contracts |
| On notification | Social-security fund contribution start date; any Delhi aggregator rules |
| Annually | ROC filings (AOC-4, MGT-7), income-tax return, statutory audit, policy review, security review |
