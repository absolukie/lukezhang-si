# Resilience OS
**Concept:** Resilience OS · **Category:** Home / Physical World

Earthquake, wildfire, outage, evacuation, insurance, pet, document, and supply planning for a household.

## Startup thesis
Household emergency prep lives in scattered PDFs nobody reads; one living page the family can follow at 2am is worth more than a binder.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
A Menlo Park household plan opens with a live readiness % - check off go-bag items and watch it climb; evacuation routes, contacts, and the uninsured quake-rider gap all in one place.

## Monetization
Freemium: free plan, $5/mo family with reminders + insurance review; affiliate revenue on supplies.

## Known limitations
Routes and contacts are demo data for the fictional address; real product geocodes the user's home and pulls local hazard data.

## Next 3 features
- Address-based hazard auto-fill (USGS quake, CalFire zones)
- Expiry reminders: water rotation, detector batteries, insurance renewal
- Family sharing: multi-member checklists

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 8 · originality 6 · usefulness 9 · startup 6 · tech 6.
