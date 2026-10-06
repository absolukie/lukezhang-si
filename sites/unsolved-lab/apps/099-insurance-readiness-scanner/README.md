# ClaimReady
**Concept:** ClaimReady · **Category:** Home / Physical World

Maintain a visual household inventory with ownership evidence and export a claim package.

## Startup thesis
After a disaster, the difference between a fast full payout and a fight is documentation you made before you needed it.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
Room-by-room inventory with receipt evidence flags, one readiness score, and a one-click claim package export the adjuster can actually open.

## Monetization
$6/mo or $60/yr; bundled via insurance agents as a policyholder perk (B2B2C).

## Known limitations
Photos are emoji placeholders; real product stores real photos + PDF receipts in the vault.

## Next 3 features
- Real photo + receipt PDF vault
- Video walkthrough mode: narrate a room, auto-catalog items
- Direct insurer submission formats

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 7 · originality 6 · usefulness 9 · startup 7 · tech 6.
