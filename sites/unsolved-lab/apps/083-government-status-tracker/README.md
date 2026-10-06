# Status Board

**Concept:** Status Board
**One-liner:** Combine status tracking across government processes.
**Startup thesis:** Everyone tracks passports, licenses, permits, and visas in separate portals and spreadsheets. One timeline with predicted completion dates from agency-published windows turns bureaucratic anxiety into a calm checklist.

## Architecture
Single-file client app. Three seeded processes (passport renewal, REAL ID, business permit) each carry stage lists with durations; predicted completion = last confirmed stage date + remaining stage durations, computed deterministically against a fixed "today" (Oct 3, 2026). Expandable process cards, a combined next-events timeline, and a manual "track a new process" form using category duration templates.

## Magic moment
Open the board and see passport + license + permit merged into one timeline: "REAL ID document verification completes ~Oct 15, passport prints ~Oct 28."

## Monetization
Freemium consumer ($4/mo for push alerts + auto-refresh); B2B2C via relocation/HR platforms; white-label for moving companies.

## Known limitations
Predictions use static windows, not live agency APIs; "today" is fixed to Oct 3 2026 for demo determinism. No account linking yet.

## Next 3 features
1. Agency portal connectors (State Dept, DMV) for live stage updates.
2. Push/SMS alerts when a stage actually advances.
3. Document checklist per process with photo upload.
