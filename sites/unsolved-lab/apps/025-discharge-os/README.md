# Homeward
**Concept:** Discharge OS · **Category:** Healthcare Administration

**One-liner:** Turn hospital discharge paperwork into a clear recovery plan.

## Startup thesis
Discharge papers are written for liability, not humans. Homeward parses them into a plain-English plan: what happened, red flags, follow-ups, and a tappable med schedule.

## Architecture
Vanilla JS. Regex-based section parser (meds, follow-ups, return precautions); med-taken checkboxes persisted to localStorage; red-flag explainer modals; copy-as-text plan export.

## Magic moment
Magic moment: paste the papers, hit one button, and a plain-English plan appears — 'The heart tests came back normal' instead of 'rule-out MI, negative workup'.

## Monetization
Hospital discharge-planning SaaS (reduces readmissions = real dollars); consumer freemium.

## Known limitations
Parser is regex-based and tuned to the demo format; not medical advice; no real hospital integration.

## Next 3 features
1. Photo/scan import via OCR
2. Caregiver shared view with task assignments
3. Readmission-risk scoring from discharge features

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
