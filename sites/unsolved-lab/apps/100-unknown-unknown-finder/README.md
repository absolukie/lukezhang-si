# Blindspot
**Concept:** Blindspot · **Category:** Home / Physical World

Analyze connected life data and identify important things you never thought to ask about.

## Startup thesis
The most expensive risks are the ones you never thought to ask about; pattern-matching a life against thousands of post-mortems surfaces them.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
One scan reveals five overlooked risks - password-manager emergency access, domain on an expiring card, no offline backup - each with evidence and a fix checklist.

## Monetization
Freemium scan; $8/mo continuous monitoring with alerts; affiliate on password managers, backup drives.

## Known limitations
Demo uses a fictional profile; real product connects accounts via OAuth and analyzes locally.

## Next 3 features
- Real OAuth connections (Google, Apple, domain registrars)
- Continuous monitoring with change alerts
- Family/household shared blindspot view

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 8 · originality 9 · usefulness 8 · startup 7 · tech 6.
