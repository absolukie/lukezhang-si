# NetCheck
**Concept:** Network Truth · **Category:** Healthcare Administration

**One-liner:** Verify whether providers actually accept particular insurance and new patients.

## Startup thesis
Insurer directories are up to 40% stale — 'in-network' on the website, out-of-network on the bill. NetCheck cross-checks the directory, the office, the medical board, and patient reports.

## Architecture
Vanilla JS. Seeded 4-doctor directory; 4-source cross-check cards with agree/listed/conflict badges; verdict engine; copyable verification summary.

## Magic moment
Magic moment: search 'Okafor' — the directory says 'accepting new patients' but the office check says 'not until February'. The ghost listing is exposed in one screen.

## Monetization
Consumer freemium; employer benefits navigation; API for appointment-booking platforms.

## Known limitations
Directory and phone checks are seeded fiction; no live scraping or calling in the demo.

## Next 3 features
1. Automated directory-vs-reality re-verification sweeps
2. Crowdsourced billing-outcome reports
3. Book-direct integration once verified

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
