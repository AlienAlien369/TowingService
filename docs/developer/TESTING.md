# Testing strategy

## Today
- **Unit tests (Vitest, 29 tests):** pricing engine (`modules/pricing/engine.test.ts`), booking state machine
  (`modules/bookings/state.test.ts`), utilities (`shared/lib/utils.test.ts`). Run with `npm test`.
- **Type safety:** `npm run lint` (`tsc --noEmit`), including Hindi/English dictionary parity.

## Target test pyramid

| Layer | What | Tooling | Priority |
|---|---|---|---|
| Unit | Pure logic: pricing, state machine, commission/ledger maths, invoice numbering, GST split, templating | Vitest | Keep at 100 % of pure modules |
| Integration | Module services against a real Postgres: `createBooking` → `startDispatch` → `acceptOffer` (incl. race) → `driverAdvance` → invoice + ledger; partner apply → approve → sign | Vitest + disposable DB (Docker or Neon branch) | **High, next** |
| Authorisation | Every server action rejects the wrong role and someone else's resource | Vitest integration | **High** |
| End-to-end | Customer booking, driver app loop, admin settings change, in EN and HI, on a mobile viewport | Playwright (Chromium is available in CI images) | Medium |
| Non-functional | Load (50 concurrent bookings, 200 online drivers polling), accessibility (axe), security (DAST) | k6 / Artillery, axe, ZAP/StackHawk | Before launch |

## Rules
1. Every bug fix comes with a test that fails before the fix.
2. Money tests assert exact paise, never approximate values.
3. Time-dependent logic (night surcharge, offer expiry) takes `at: Date` as input, as `computeQuote` already does.
4. Never call real SMS, email or payment providers in tests. Use `SMS_PROVIDER=mock` and Mailpit.

## Pre-launch manual test script (abridged)
1. Book each service for car and two-wheeler, day and night; compare the quote with the rate card by hand.
2. Cancel at each status; check the fee display and status history.
3. Two drivers accept the same offer simultaneously; only one is assigned.
4. Wrong PIN is rejected; right PIN starts the job.
5. Complete with cash; check the invoice (GSTIN, SAC, CGST/SGST split, FY number) and the ledger entry.
6. Partner applies → approve → receives email → e-signs → becomes active → company driver gets jobs; company is emailed.
7. Change brand name in settings; check site, emails, invoice and manifest update.
8. Switch language to Hindi on every customer page; no English fallbacks in UI chrome.
