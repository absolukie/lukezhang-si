# HomeTwin
**Concept:** HomeTwin · **Category:** Home / Physical World

Searchable home database: appliances, breakers, repairs, warranties, measurements, receipts, filters, paint colors, shutoffs.

## Startup thesis
Every homeowner re-discovers the same facts (filter size? water shutoff? paint color?) because the house has no memory; a searchable twin ends the re-discovery.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
Ask 'where is the water shutoff' and get the exact location, how-to, last-tested date - the answer that normally takes 20 minutes of searching.

## Monetization
Freemium; $4/mo for receipt OCR, warranty expiry alerts, and home-value tracking; partnerships with insurers.

## Known limitations
Demo catalog is seeded; real product needs photo/voice capture and receipt OCR onboarding.

## Next 3 features
- Phone camera capture: snap an appliance, auto-identify model
- Warranty expiry push alerts
- Maintenance schedule auto-generated from catalog

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 8 · originality 7 · usefulness 9 · startup 6 · tech 6.
