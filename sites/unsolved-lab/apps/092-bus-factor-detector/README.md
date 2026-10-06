# Bus Factor
**Concept:** Bus Factor · **Category:** Companies / Organizations

Identify critical workflows understood by too few people, with mitigation plans.

## Startup thesis
Every company has single points of failure it can't see; making them visible makes them fixable before the bus arrives.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
The org map shows payroll understood by exactly 1 person - click it and get a 5-step mitigation plan with checkable progress.

## Monetization
Team plan $12/user/mo; enterprise: HRIS + repo + runbook integrations.

## Known limitations
Ownership data is self-reported in the demo; real product infers from git, calendars, and incident history.

## Next 3 features
- Auto-infer ownership from git blame + on-call history
- Mitigation plan assignment to managers with due dates
- Quarterly bus-factor trend report for leadership

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 7 · originality 6 · usefulness 8 · startup 6 · tech 6.
