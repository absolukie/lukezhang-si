# Ledger — Decision Ledger

**One-liner:** Document important care decisions and reasoning.

## Startup thesis
Families re-litigate the same painful decisions because reasoning was never written down. A decision ledger — weighted criteria, recorded stances, discussion log — becomes the system of record; expand to estate, medical, and financial decisions.

## Architecture
Single index.html. Three tabs: weighted multi-criteria scoring (sliders renormalize to 100, options re-rank live), decider stances with tally, and an append-only discussion timeline. Record/lock decision; copyable text summary export. localStorage persistence.

## Magic moment
Drag the 'Safety' weight up and watch Sunrise Assisted Living overtake 'stay at home' live — the trade-off made visible.

## Monetization
Free for one decision; $6/mo for unlimited ledgers, PDF exports, and advisor (geriatrician/attorney) collaboration seats.

## Known limitations
Scores are seeded estimates, not professional assessments; no e-signature for formal consent; single decision preloaded.

## Next 3 features
1. Multi-decision workspace with search across ledgers
2. Formal consent capture (e-signature per decider)
3. Advisor mode: geriatricians/lawyers attach assessments
