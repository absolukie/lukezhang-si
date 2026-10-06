# After-Loss OS

**Concept:** After Loss Os · **Category:** Consumer Protection / Finance

## One-liner
Handle accounts and paperwork after someone dies.

## Startup thesis
A respectful 90-day executor checklist (26 tasks across 3 phases with plain-language 'why' for each), a document vault tracking 9 key documents by status, and a key-contacts table — progress persisted locally.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero CDNs, zero network calls, zero API keys. UI built on the shared `window.Kit` contract (`../../shared/kit.js` + `../../shared/kit.css`) with a minimal inline fallback so the app works even before the shared kit lands. Demo data is deterministic via `Kit.rng` seeded generators — no lorem ipsum. State persists in `localStorage` under a per-app namespace.

## Magic moment
A calm 90-day path appears: 26 ordered tasks, each with its 'why', plus the document vault showing exactly what's missing.

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
