# Adulting 101

**Concept:** Adulting 101 · **Category:** Language / Education

> Teach practical adult skills often missing from formal education.

## Startup thesis
Schools don't teach pay stubs, leases, or credit scores — so young adults learn by expensive mistake. Interactive lessons built around real documents (tap any line, get the plain-English why + what to do) close that gap in minutes.

## Architecture
Single index.html. Vanilla JS + Kit fallback. Tabbed modules/learn-lab/quiz. Pay-stub lab: 11 clickable stub lines, each with explanation + actionable tip; progress persisted in localStorage; 4-question quiz with explanations gates the 'graduation' state.

## Magic moment
Open the pay-stub lab and tap 'Social Security (OASDI)' — the line highlights and a card explains the 6.2%, the wage cap, and the hidden employer match.

## Monetization
Freemium consumer app; B2B2C via employers/colleges onboarding young hires ($4/seat/mo); sponsored modules (banks, insurers) clearly labeled.

## Known limitations
Only the pay-stub module is fully built; 5 other modules are locked placeholders. Tax numbers are illustrative US/CA 2025-26, not advice.

## Next 3 features
- Build the 5 locked modules (credit, lease, taxes, insurance, negotiating)
- Document upload: parse the user's real pay stub
- Spanish + simplified-Chinese localizations

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
