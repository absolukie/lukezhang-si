# Rootwise

**Concept:** Prereq Map
**One-liner:** Maps the prerequisite tree of anything you want to understand — and shows you exactly where your knowledge stops.

## Startup thesis
People bounce off hard topics because they start in the middle; a dependency tree turns 'understand transformers' into an ordered, finishable path.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
Mark 'matrix multiplication' as known and watch the whole tree re-light: your frontier is now just 3 nodes.

## Monetization
$8/mo for unlimited maps + guided lessons per node; classroom tier.

## Known limitations
- Trees are curated by the app; marking known/unknown is self-reported.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Auto-generated trees for any topic via LLM
2. Diagnostic quizzes that verify 'known' claims
3. Study-plan export to calendar
