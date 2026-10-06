# Domino

**Concept:** Domino
**One-liner:** Determine everything affected by major life changes.
**Startup thesis:** Moving states, new babies, new jobs — each triggers 10–30 admin tasks scattered across agencies nobody lists in one place. A dependency engine that enumerates them with deadlines is the checklist people forward to friends.

## Architecture
Single-file client app. Five life-change knowledge bases (Texas move: 31 items / 8 categories; baby, job, marriage, retirement: 9–12 items each). Items carry why-it-matters, effort size, and deadline. Dependency graph (center node → category nodes, clickable to filter) plus grouped checklist with progress bar; completion persists in localStorage.

## Magic moment
Pick "Moving to Texas" and watch 31 dominoes fan out — including the easy-to-miss ones: Form 8822 for the IRS, TxTag for toll roads, the 90-day license deadline.

## Monetization
Free consumer checklist; $12/mo "Domino Plus" with deadline reminders and document vault; B2B for relocation companies and HR onboarding.

## Known limitations
Knowledge base is hand-written and US-centric; deadlines are generic, not county-specific. No reminder notifications in this build.

## Next 3 features
1. Deadline engine with SMS/email nudges tied to your move date.
2. County-level localization (DMV fees, voter deadlines).
3. Shareable household plan — assign tasks to a partner.
