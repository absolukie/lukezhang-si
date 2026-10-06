# Lineage
**Concept:** Provenance Graph · **Category:** AI Agents / Infrastructure

**One-liner:** Visualize exactly which sources, models, tools, and agents contributed to an output.

## Startup thesis
AI answers are only as trustworthy as their ingredients. Lineage makes provenance a first-class object: every output carries its full graph of models, tools, and sources — so "why did it say that?" is always one click away. This is the missing audit layer for agentic products.

## Architecture
Single-file client app. A fixed provenance graph (10 nodes: answer, 2 models, 3 tools, 4 sources, 9 edges) renders as SVG via the Kit graph primitive; clicking nodes or chips drives an inspector panel; a contribution ledger table lists every ingredient with confidence. All data is realistic seeded demo content.

## Magic moment
Click any node — a model, a tool, a source URL — and the inspector shows exactly what it contributed, down to token counts, arg hashes, and fetched excerpts.

## Monetization
API/SDK for agent frameworks ($49/mo) that auto-attaches provenance to outputs; compliance tier (SOC2/AI Act) with immutable provenance logs.

## Known limitations
Demo graph is static seeded content; not wired to a live agent runtime; no cryptographic attestation of the ledger yet.

## Next 3 features
1) Live capture SDK for LangGraph/CrewAI runs. 2) Signed provenance receipts (hash-chained ledger). 3) Diff view: how the graph changed between answer revisions.
