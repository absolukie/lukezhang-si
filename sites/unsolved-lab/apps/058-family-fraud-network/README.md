# Fraud Net

**Concept:** Family Fraud Network · **Category:** Consumer Protection / Finance

## One-liner
Coordinate fraud protection among trusted relatives.

## Startup thesis
A family-circle fraud defense net: per-member vulnerability scores, a simulated scam call to Grandma that fires a push alert to all responders, and a 6-step response plan with owners and call scripts tracked to all-clear.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero CDNs, zero network calls, zero API keys. UI built on the shared `window.Kit` contract (`../../shared/kit.js` + `../../shared/kit.css`) with a minimal inline fallback so the app works even before the shared kit lands. Demo data is deterministic via `Kit.rng` seeded generators — no lorem ipsum. State persists in `localStorage` under a per-app namespace.

## Magic moment
Simulate the scam call and the alert fires to the whole family circle with an owned, scripted response plan.

## Monetization
Freemium consumer SaaS: free core analysis/tracking; paid tiers for multi-property / multi-member, PDF exports, attorney/family sharing, and API access for clinics, legal-aid orgs, and banks.

## Known limitations
- Demo data is seeded and fictional; replace with real user data in production.
- Client-side only: no accounts, no cross-device sync, no server validation.
- General-information tool, not professional (legal/financial) advice.

## Next 3 features
1. Real backend sync + shareable links (currently localStorage-only).
2. PDF export of reports, letters, and packages.
3. Integrations: e-sign, bank/plaid verification, telephony alerts where applicable.
