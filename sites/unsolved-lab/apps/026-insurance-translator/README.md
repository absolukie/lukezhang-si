# PlainCover
**Concept:** Coverage Translator · **Category:** Healthcare Administration

**One-liner:** Explain insurance coverage and expected costs in plain English.

## Startup thesis
'What will my MRI cost?' gets a shrug from every insurer portal. PlainCover shows the deductible → coinsurance → OOP-max math step by step, with sliders for your actual plan numbers.

## Architecture
Vanilla JS. Plan-parameter sliders; procedure price table; step-by-step cost engine (deductible, coinsurance, OOP-max cap, auth gate, OON multiplier); savings tips.

## Magic moment
Magic moment: the $1,842-style answer appears as a big number with every dollar traced — 'the first $1,850 comes from you (deductible)' — no black box.

## Monetization
Employer benefits-navigation add-on; broker white-label; affiliate for HSA providers.

## Known limitations
Prices are estimates from a seeded table, not real negotiated rates; no eligibility/prior-auth API.

## Next 3 features
1. Real negotiated-rate data (CMS transparency files)
2. Plan-card photo import to auto-fill parameters
3. Side-by-side facility price comparison

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
