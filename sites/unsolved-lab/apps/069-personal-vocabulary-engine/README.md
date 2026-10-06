# WordRoot

**Concept:** MyWords
**One-liner:** Builds your vocabulary deck from your actual life — your job, your hobbies — with spaced repetition.

## Startup thesis
Generic word lists do not stick; words tied to your nursing shifts and your garden get used the same day, which is what makes them stick.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
Answer the quiz and watch the SM-2 scheduler push 'triage' to tomorrow and pull 'perennial' forward — the deck learns you.

## Monetization
$5/mo for unlimited decks + AI-generated example sentences from your life.

## Known limitations
- Spaced-repetition is a simplified SM-2; deck content is seeded demo data.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Import from Kindle highlights, work docs, and chat history
2. Pronunciation scoring per word
3. Shared family decks
