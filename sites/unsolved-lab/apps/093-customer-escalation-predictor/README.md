# Escalation Radar
**Concept:** Escalation Radar · **Category:** Companies / Organizations

Score support tickets for escalation and churn risk from live signals.

## Startup thesis
Churn is usually visible in support tickets weeks before it happens; scoring those signals turns support into retention.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
200 tickets scored in one scan; 6 flagged red with exact reasons - sentiment 1/10 + 49h silence + Enterprise account.

## Monetization
$15/agent/mo; integrates with Zendesk/Intercom; ROI pitched on saved accounts.

## Known limitations
Scoring model is heuristic demo logic; real product needs ML trained on the customer's ticket + churn history.

## Next 3 features
- Zendesk/Intercom one-click sync
- Auto-drafted reply suggestions per risk tier
- Churn-save playbook tracking: which interventions worked

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 7 · originality 6 · usefulness 9 · startup 7 · tech 6.
