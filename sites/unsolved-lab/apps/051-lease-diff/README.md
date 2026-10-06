# Lease Diff

**Concept:** Lease Diff · **Category:** Housing / Renting

## One-liner
Intelligently compare leases and highlight important changes.

## Startup thesis
A side-by-side lease comparison engine that diffs every clause of a renewal against the current lease, ranks 4 flagged changes worst-first, calls out the binding-arbitration dealbreaker, and drafts tenant counter talking points.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero CDNs, zero network calls, zero API keys. UI built on the shared `window.Kit` contract (`../../shared/kit.js` + `../../shared/kit.css`) with a minimal inline fallback so the app works even before the shared kit lands. Demo data is deterministic via `Kit.rng` seeded generators — no lorem ipsum. State persists in `localStorage` under a per-app namespace.

## Magic moment
Open the app and the renewal is already being diffed — seconds later the 4 changes land worst-first with the binding-arbitration dealbreaker stamped in red.

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
