# DisputeForge

**Concept:** Chargeback Builder
**One-liner:** Turns a bogus charge into a complete dispute package: evidence timeline, reason-code picker, and a bank-ready letter.

## Startup thesis
Chargeback win rates double with organized evidence, but nobody keeps it; auto-assembling the timeline and writing the letter in the bank's own language is the unlock.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
One click turns the evidence timeline into a signed dispute letter with the correct Visa/Mastercard reason code filled in.

## Monetization
Free for 1 dispute/mo; $6/mo unlimited + bank-specific letter templates and deadline tracking.

## Known limitations
- Demo data only; letter text is a template, not legal advice.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Card-network reason-code auto-detect from transaction text
2. Evidence capture via photo upload + OCR of receipts
3. Win-rate analytics by merchant category
