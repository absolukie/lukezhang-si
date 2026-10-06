# SayWhat

**Concept:** Culture Lens
**One-liner:** Decodes what a phrase really signals across cultures — the subtext layer of language.

## Startup thesis
Most cross-cultural friction is not vocabulary, it is implicature; making the hidden social meaning explicit prevents the misunderstandings nobody can name.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`. Meeting-prep mode scans pasted agendas for library phrases (case-insensitive, ellipsis-tolerant) and decodes each hit for the cultures selected on the call, with a copyable text briefing.

## Magic moment
Pick 'Let's circle back' and see three cultures read it three different ways — with what to say instead.

## Monetization
$10/mo for professionals working across cultures; team workshops tier.

## Known limitations
- Decodings are curated generalizations — real cultures vary by person and context.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. 100+ phrase library with regional variants
2. Scan any text source: Slack threads, email drafts, calendar invites
3. Reverse mode: encode your intent for a target culture
