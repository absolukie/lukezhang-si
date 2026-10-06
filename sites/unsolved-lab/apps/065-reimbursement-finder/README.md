# Reclaim

**Concept:** Reimbursement Finder
**One-liner:** Scans your transactions and finds money owed to you across employers, insurance, cards, HSA/FSA, travel protection and warranties.

## Startup thesis
Employees leave ~$1,000/yr in unclaimed reimbursements because programs are invisible; matching every transaction against every program's rules finds it automatically.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
Press Scan and watch $612.40 materialize across 4 programs you forgot you had.

## Monetization
15% of recovered funds on the paid tier; free scan, pay on claim.

## Known limitations
- Demo transactions are seeded; real use needs bank/statement import.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Plaid/bank import for live transaction scanning
2. One-click claim filing into employer portals (Navia, WageWorks)
3. Annual open-enrollment optimizer using found reimbursements
