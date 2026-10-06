# Phrasecraft

**Concept:** Native Ear
**One-liner:** Flags grammatically correct English that no native speaker would say — and teaches the natural version.

## Startup thesis
Learners plateau at 'correct but foreign'; the gap is collocation and register, not grammar, and it is teachable with pattern-level feedback.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
Paste 'I am very much liking it' and get three native rewrites ranked by context, each with the why.

## Monetization
$7/mo for unlimited coaching + pronunciation shadowing; B2B for ESL schools.

## Known limitations
- Pattern engine is rule-based over ~30 hand-built patterns; not a full NLP model.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Voice input with prosody feedback
2. Personal error-pattern memory that re-tests your weak spots
3. Browser extension for real-time writing coaching
