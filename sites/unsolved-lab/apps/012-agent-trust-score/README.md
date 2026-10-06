# Trustline
**Concept:** Trust Score · **Category:** AI Agents / Infrastructure

**One-liner:** Score agent reliability from failures, interventions, unauthorized behavior, and outcomes.

## Startup thesis
As agent fleets grow, "which agents can I trust?" becomes the central ops question. Trustline is the credit score for AI agents: continuous scoring from failures, human interventions, and unauthorized behavior, with tunable weights and one-click quarantine. Trust becomes measurable, comparable, and enforceable.

## Architecture
Single-file client app. Seeded fleet of 10 agents with deterministic incident histories (Kit.rng). Score = weighted reliability/oversight/safety/experience model recomputed live when weights change. Leaderboard table, donut breakdowns, and incident timelines all render from one scored state.

## Magic moment
Drag a weight slider and the whole leaderboard re-sorts live; click any agent for a full score breakdown and its incident rap sheet.

## Monetization
SaaS per-agent pricing ($5/agent/mo) for fleet operators; enterprise tier with audit exports and custom scoring models for regulated industries.

## Known limitations
Demo data is seeded, not from live telemetry; weight changes do not persist; no real quarantine enforcement against tool APIs.

## Next 3 features
1) Live ingestion from agent run logs (OpenTelemetry spans). 2) Drift alerts when an agent's score drops >10 pts in a day. 3) Team-level trust rollups and SLA-style trust contracts.
