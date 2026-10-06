# Confusion Log

**Concept:** Confusion Log · **Category:** Language / Education

> Capture confusion moments and cluster them into learning priorities.

## Startup thesis
Learners don't lack resources — they lack a map of what confuses them most. A running log of confusion, auto-clustered by topic and ranked by stuck-ness, turns vague frustration into an ordered study plan.

## Architecture
Single index.html. Vanilla JS + inline Kit fallback (window.Kit; ../../shared/kit.js overrides when present). localStorage persistence (confusion-log-v1). Deterministic keyword-scoring clusterizer: each open confusion is scored against topic keyword sets, grouped, then ranked by avg severity × topic size.

## Magic moment
Hit 'Cluster my confusions' on the 8 preloaded demo entries and get 3 ranked learning priorities with a 'start here' badge and per-cluster study tactics.

## Monetization
Freemium: free personal log; Pro ($6/mo) adds spaced-repetition scheduling per cluster, export to Anki, and tutor-share links.

## Known limitations
Clustering is keyword-based, not semantic — novel topics fall into the closest bucket. No NLP, no backend, no sync across devices.

## Next 3 features
- Semantic clustering via on-device embeddings
- Spaced-repetition reminders per priority
- Shareable study-plan links

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
