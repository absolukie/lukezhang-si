# Evidence Vault

**Concept:** Renter Evidence Vault · **Category:** Housing / Renting

## One-liner
Organize move-in condition, repairs, payments, landlord communication.

## Startup thesis
A timestamped, hash-logged evidence vault (move-in photos, repairs, payments, comms) with one-tap auto-assembly of a deposit-dispute package: evidence timeline plus an auto-drafted CA §1950.5 demand letter.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero CDNs, zero network calls, zero API keys. UI built on the shared `window.Kit` contract (`../../shared/kit.js` + `../../shared/kit.css`) with a minimal inline fallback so the app works even before the shared kit lands. Demo data is deterministic via `Kit.rng` seeded generators — no lorem ipsum. State persists in `localStorage` under a per-app namespace.

## Magic moment
Hit “Auto-assemble dispute package” and watch the vault gather, verify, and timeline the evidence, then draft the demand letter for you.

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
