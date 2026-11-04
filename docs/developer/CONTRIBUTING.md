# Contributing

1. **Read first:** [`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md) (conventions §5) and [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
2. **Branch** from `main` (`feat/…`, `fix/…`, `docs/…`). Keep pull requests small and focused.
3. **Before pushing:** `npm run lint && npm test`. If you changed the schema, commit the migration.
4. **Pull request description:** what changed, why, how you tested it, screenshots for UI changes (EN and HI, mobile
   width), and any new settings, env vars or migrations.
5. **Review checklist** (author and reviewer):
   - [ ] Server actions check auth and ownership; inputs validated with Zod
   - [ ] Money in paise; status changes via `canTransition()` + `BookingEvent`
   - [ ] New customer text in both `en.ts` and `hi.ts`; brand not hard-coded
   - [ ] Cache tags updated after writes; notifications deferred
   - [ ] No PII in analytics props or logs; audit log for staff changes
   - [ ] Tests added or updated; docs updated (tracking plan, admin guide, this handbook)
6. **Merging** to `main` deploys to production (Vercel and Render). Merge only after review and green checks.
7. **IP:** by contributing you confirm the work is yours to contribute and is covered by your IP assignment agreement
   with the company.
