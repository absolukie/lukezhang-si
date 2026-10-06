# OneChart
**Concept:** Medical Timeline · **Category:** Healthcare Administration

**One-liner:** Merge fragmented health records into one understandable chronological history.

## Startup thesis
Patients see 4+ providers who never talk to each other. OneChart merges their records into a single timeline and flags contradictions instead of silently picking one.

## Architecture
Vanilla JS + Kit tabs/timeline. Seeded events from 4 fictional providers; client-side merge-sort by date; conflict list with keep-A/keep-B resolution and audit trail.

## Magic moment
Magic moment: 12 events from 4 providers land in one scrollable timeline, and the two conflicts (drug dose, allergy) are flagged in red with a one-tap resolution.

## Monetization
Freemium consumer ($6/mo for record sync); employer wellness bundles; provider white-label.

## Known limitations
Records are seeded fiction; no real provider connections; conflict resolution is manual.

## Next 3 features
1. FHIR-based provider connections (patient-authorized)
2. NLP import of uploaded PDFs/photos of records
3. Shareable doctor-visit summary (one-page PDF)

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
