# ChartCheck
**Concept:** Record Diff · **Category:** Healthcare Administration

**One-liner:** Find contradictions between medical systems.

## Startup thesis
When two charts disagree about your meds, nobody tells you — you find out at the pharmacy. ChartCheck diffs two providers' records field-by-field with severity ratings and builds a merged record from your picks.

## Architecture
Vanilla JS. Seeded A/B chart rows; severity badges; per-row keep-A/keep-B; live merged-record preview; copy-to-clipboard export.

## Magic moment
Magic moment: the Lisinopril 10mg vs 20mg row renders side-by-side in blue vs red with a HIGH badge — the contradiction is unmissable.

## Monetization
Consumer freemium; pharmacy/PBM partnership (catch discrepancies at fill time).

## Known limitations
Seeded demo data only; no semantic matching of free-text notes; export is clipboard text, not CCD/FHIR.

## Next 3 features
1. Fuzzy matching across differently-worded fields
2. Third-source tiebreaker (pharmacy fill history)
3. Push alerts when a new sync introduces a contradiction

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
