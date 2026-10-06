# VisitReady

**Concept:** Brief Builder  
**Category:** Healthcare Administration

**One-liner:** Turn two weeks of symptom logs into a one-page pre-appointment brief your doctor will actually read.

## Startup thesis
Doctors get 15 minutes; patients bring shoeboxes of symptoms. A generated one-page brief — trends, worst episodes, med changes, ranked questions — makes every visit 3x more productive. Sold to chronic-care programs and as a portal add-on.

## Architecture
Single `index.html`. Seeded 14-day symptom log (deterministic via `Kit.rng`); `Kit.timeline` renders the log; `Kit.line` draws the severity trend; the brief generator aggregates top concerns, worst episode, med changes and checked questions into a print-ready page.

## Magic moment
Open **Generated brief**, hit **Generate brief** — two weeks of messy logs become a crisp one-pager with a trend chart.

## Monetization
$6/mo consumer; $2k/mo per clinic for portal integration + pre-visit brief delivery.

## Known limitations
Fictional demo data; trend math is simple averaging; print CSS is basic.

## Next 3 features
1. Import from Apple Health / BP cuffs automatically.
2. Doctor-side annotation ("addressed / follow up").
3. Multi-condition brief templates (diabetes, CHF, COPD).

