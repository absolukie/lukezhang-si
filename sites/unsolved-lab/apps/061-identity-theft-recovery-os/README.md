# Shieldline Recovery

**Concept:** ID Recovery OS
**One-liner:** A personalized step-by-step recovery workflow after identity theft, spanning credit bureaus, IRS, DMV and SSA.

## Startup thesis
Identity-theft victims face 100+ hours of fragmented phone calls; a single guided OS that sequences every bureau, agency and affidavit in the right order turns panic into a finishable checklist.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
Watch the recovery score climb live as you check off the FTC affidavit — the plan re-sequences itself around what you have done.

## Monetization
Freemium: free recovery plan; $9/mo Concierge adds auto-filled dispute letters, deadline watchdog texts, and dark-web re-scan alerts.

## Known limitations
- Demo data only — real filings must be submitted by the victim; no live bureau/IRS API integration.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Real agency API submission (FTC IdentityTheft.gov, bureau freezes) via credentialed flows
2. Deadline watchdog with SMS/email reminders before dispute windows close
3. Household mode: one plan covering spouse + kids' identities
