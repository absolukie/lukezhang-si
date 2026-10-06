# BillHawk
**Concept:** Bill Auditor · **Category:** Healthcare Administration

**One-liner:** Identify suspicious, duplicate, incorrect, or disputable charges.

## Startup thesis
Up to 80% of medical bills contain errors, and nobody reads the itemized statement. BillHawk scans line items, flags duplicates and upcodes, and drafts the dispute letter.

## Architecture
Vanilla JS + Kit table. Seeded 9-line $4,200 bill; rule-based flags (duplicate CPT+date, upcode heuristics, hour-count review); dispute list with savings math; letter generator + clipboard.

## Magic moment
Magic moment: the $4,200 bill opens with the duplicate ECG and the upcoded CT already flagged — $705 of likely overbilling highlighted before you read a line.

## Monetization
Contingency (small % of recovered overbilling); consumer $5/bill scan; employer offering.

## Known limitations
Rules are demo heuristics, not a real coding engine; dispute letter is a template, not legal advice; no e-filing.

## Next 3 features
1. CPT knowledge base with real code descriptions
2. Photo/scan import of paper bills
3. Track dispute outcomes and payer response times

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
