# FixTrack

**Concept:** Maintenance Escalation Os · **Category:** Housing / Renting

## One-liner
Manage unresolved rental maintenance problems and evidence.

## Startup thesis
A maintenance ticket tracker with day-counters, a 5-stage escalation ladder, and one-click generation of a formal escalation letter citing the exact California Civil Code sections — demoed on a 40-day-old leak past the 30-day repair-and-deduct limit.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero CDNs, zero network calls, zero API keys. UI built on the shared `window.Kit` contract (`../../shared/kit.js` + `../../shared/kit.css`) with a minimal inline fallback so the app works even before the shared kit lands. Demo data is deterministic via `Kit.rng` seeded generators — no lorem ipsum. State persists in `localStorage` under a per-app namespace.

## Magic moment
The 40-day leak is already past California's 30-day limit — one click generates the formal escalation letter citing the exact statutes.

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
