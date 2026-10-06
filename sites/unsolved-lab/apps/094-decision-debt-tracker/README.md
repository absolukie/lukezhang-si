# Decision Debt
**Concept:** Decision Debt · **Category:** Companies / Organizations

Find temporary decisions and workarounds that accidentally became permanent, with interest costs.

## Startup thesis
'Temporary' workarounds are the highest-interest debt a company carries because nobody tracks them; pricing the interest creates payoff urgency.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
14 'temporary' hacks, the oldest from 2019, each with monthly eng-hour interest and lifetime cost - e.g. the hardcoded tax table cost $57k and counting.

## Monetization
$10/eng/mo; sold to CTOs as the 'tech debt ledger with teeth'.

## Known limitations
Interest figures are estimates; real product calibrates from incident + time-tracking data.

## Next 3 features
- Auto-detect TODO/FIXME/flag debt from repos
- Interest auto-calibration from incident tags
- Payoff sprint planner: highest-ROI debts first

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 8 · originality 8 · usefulness 8 · startup 6 · tech 6.
