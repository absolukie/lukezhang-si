# AuthAssemble
**Concept:** Prior-Auth Compiler · **Category:** Healthcare Administration

**One-liner:** Construct prior-authorization submissions from patient records and payer requirements.

## Startup thesis
Prior-auth denials are usually paperwork failures, not medical ones. AuthAssemble compiles the packet like code: pull the payer's requirement set, diff it against the chart, flag the missing pieces, and emit a submittable packet with a reference number.

## Architecture
Vanilla JS + Kit fallback. Seeded procedure/payer/requirement tables; chart state in memory; packet rendered as a printable checklist with reference ID.

## Magic moment
Magic moment: one click compiles the packet and the two missing documents glow red — the user instantly sees the exact gap between chart and payer.

## Monetization
SaaS per-provider-seat ($49/mo per practice); payer API integrations; denial-appeal letter upsell.

## Known limitations
Demo chart is hardcoded; no real EHR or payer integration; packet is a checklist, not a real 278/FAX submission.

## Next 3 features
1. EHR read via FHIR (pull chart automatically)
2. Payer requirement database kept current per payer/plan
3. Denial-appeal mode: compile the appeal packet from the denial reason codes

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
