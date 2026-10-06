# FluentGap

**Concept:** Gap Finder
**One-liner:** Analyzes your chat logs to find grammar you keep avoiding — and shows you the exact moments you needed it.

## Startup thesis
Avoidance is invisible to the learner; surfacing the five moments you dodged the past perfect makes the gap concrete and fixable.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
The analysis reveals you have never once used the past perfect in 200 messages — then replays the 5 moments it would have saved you.

## Monetization
$6/mo with weekly gap reports; tutor marketplace integration.

## Known limitations
- Seeded demo logs; real use needs chat import with user consent.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. WhatsApp/Telegram import with privacy-first on-device parsing
2. Drill generator that replays your own moments as exercises
3. Progress tracking: avoidance rate over time
