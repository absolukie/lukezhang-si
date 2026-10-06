# Fix or Nix
**Concept:** Fix or Nix · **Category:** Home / Physical World

Determine whether something should economically be repaired or replaced, with break-even math.

## Startup thesis
Repair-vs-replace decisions are made on vibes and sunk-cost fallacy; cost-per-year-of-life math makes the answer obvious in 30 seconds.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
The 8-year-old washer demo: $320 repair vs $700 replace resolves to a verdict with a break-even slider and 5-year savings figure.

## Monetization
Free tool with affiliate links to replacement products + repair services; pro version for property managers.

## Known limitations
Lifespan and failure-risk curves are simplified; real product uses model-specific reliability data.

## Next 3 features
- Model lookup: type 'LG WM3900HWA', get real lifespan curves
- Local repair quote comparison
- Carbon-footprint view: repair usually wins

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 7 · originality 6 · usefulness 9 · startup 6 · tech 6.
