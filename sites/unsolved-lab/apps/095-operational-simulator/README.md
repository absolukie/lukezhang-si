# WhatIf Ops
**Concept:** WhatIf Ops · **Category:** Companies / Organizations

Model what fails if an employee, service, integration, vendor, or resource disappears.

## Startup thesis
Disaster recovery plans are written but never felt; an interactive blast-radius simulator makes resilience planning visceral and actionable.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
Click 'Auth0 goes down' and watch the blast radius: SEVERE, 18,400 customers, $92k/day at risk, hour-by-hour cascade with open mitigation gaps flagged.

## Monetization
$20/user/mo ops tier; enterprise tabletop-exercise module.

## Known limitations
Dependency graph is curated demo data; real product discovers deps from architecture + vendor contracts.

## Next 3 features
- Live dependency discovery from cloud infra
- Scheduled game-day simulations with scoring
- Vendor SLA breach cost modeling

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 8 · originality 7 · usefulness 9 · startup 7 · tech 7.
