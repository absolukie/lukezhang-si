# ScamProof

**Concept:** Scamproof · **Category:** Consumer Protection / Finance

## One-liner
Analyze suspicious numbers, emails, texts, URLs, QR codes, invoices, messages.

## Startup thesis
A client-side scam analyzer running 9 heuristic rule families (spoofed links, urgency, threats, credential requests, sender spoofing…) over pasted messages, producing a 0–100 risk verdict with each tell highlighted inline and tappable to its explanation.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero CDNs, zero network calls, zero API keys. UI built on the shared `window.Kit` contract (`../../shared/kit.js` + `../../shared/kit.css`) with a minimal inline fallback so the app works even before the shared kit lands. Demo data is deterministic via `Kit.rng` seeded generators — no lorem ipsum. State persists in `localStorage` under a per-app namespace.

## Magic moment
Paste the fake bank SMS and hit Analyze — the verdict lands with all 5 tells highlighted right in the message.

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
