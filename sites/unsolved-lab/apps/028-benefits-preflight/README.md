# Preflight
**Concept:** Benefits Preflight · **Category:** Healthcare Administration

**One-liner:** Determine requirements and likely costs before a medical procedure.

## Startup thesis
Nobody checks requirements and price before surgery — then the $4k surprise arrives. Preflight is the pre-op checklist: auth, referral, clearance, in-network facility, and the real estimate.

## Architecture
Vanilla JS. Procedure/facility pickers; facility price multipliers; cost engine (deductible + coinsurance, OON = full price); requirement checklist with mark-done; 'cleared for takeoff' verdict.

## Magic moment
Magic moment: pick knee arthroscopy + the freestanding surgery center and the estimate drops while the checklist turns green — the cheapest safe option is obvious.

## Monetization
Provider pre-registration SaaS (fewer day-of cancellations); payer member-engagement tool.

## Known limitations
Seeded prices and requirements; no real eligibility checks; facility network status is demo data.

## Next 3 features
1. Real-time eligibility + benefits API
2. Facility quality/outcome scores alongside price
3. Calendar integration: book only when checklist is green

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
