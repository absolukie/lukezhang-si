# WhyDidWe
**Concept:** WhyDidWe · **Category:** Companies / Organizations

Answer 'why did we decide this?' from searchable organizational history, with dissent and outcomes.

## Startup thesis
Institutional knowledge walks out the door with every departure; a searchable decision archive with recorded dissent compounds instead.

## Architecture
Single-file client-side app (`index.html`), vanilla JS, zero network calls. Seeded deterministic demo data via `Kit.rng`. State (checklists, custom entries) persists in `localStorage`. Built against the shared kit contract (`../../shared/kit.js` + `kit.css`); a minimal fallback is inlined so the app works even if shared kit is absent.

## Magic moment
Ask 'why did we choose postgres' and get the 2023 decision - context, options, the dissenter who was half-right, and what actually happened.

## Monetization
Per-seat SaaS for companies 20-500; add-on to Notion/Confluence. $8/user/mo.

## Known limitations
Demo data is seeded fiction; real product needs Slack/Notion/GDocs ingestion and NLP extraction of decisions.

## Next 3 features
- Slack bot: answer 'why did we...' in-channel from the archive
- Decision review reminders: nudge owners to record outcomes 6 months later
- Dissent digest: monthly email of decisions that need revisiting

## QA
Verified with headless Playwright (file://): zero console errors, core interaction clicked, 1280x800 screenshot in `shot.jpg`.
Scores (honest): quality 7 · originality 7 · usefulness 8 · startup 5 · tech 6.
