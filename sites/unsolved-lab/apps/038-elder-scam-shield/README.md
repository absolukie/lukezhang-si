# ScamShield

**Concept:** Scam Shield  
**Category:** Aging / Caregiving

**One-liner:** Paste any suspicious call, text or email — get a verdict with red flags explained in plain words.

## Startup thesis
Seniors lose $3B+/year to scams that follow recognizable scripts. A dead-simple "paste it, get a verdict in plain words" tool — distributed via families and senior centers — becomes the trusted verification layer for an at-risk population.

## Architecture
Single `index.html`, fully on-device. A pattern library of scam regexes scores messages; 3+ hits = scam verdict; each hit carries a plain-words explanation and the verdict maps to concrete next steps.

## Magic moment
It opens with the "grandson in jail" text already analyzed — red flags explained like a patient friend would.

## Monetization
Free for families; $199/mo per senior-living community (staff dashboard, resident reports); carrier/bank API licensing.

## Known limitations
Pattern-based, not ML — novel scripts can slip through; no real call-screening integration; English only.

## Next 3 features
1. On-device ML classifier trained on reported scams.
2. Live call screening ("is this caller legit?").
3. Family alert: notify an adult child when a parent checks a high-risk message.

