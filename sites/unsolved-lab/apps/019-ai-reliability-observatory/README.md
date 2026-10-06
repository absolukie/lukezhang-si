# Watchtower
**Concept:** Reliability Observatory · **Category:** AI Agents / Infrastructure

**One-liner:** Sentry/Datadog for AI agents and workflows.

## Startup thesis
Agent failures are opaque: "the run failed" with no stack trace, no owner, no trend. Watchtower brings Sentry/Datadog-grade observability to AI workflows — live incident feed, per-model error rates, and every incident ships with an agent-step stack trace so the fix starts at the failing step, not at a blank page.

## Architecture
Single-file client app. Seeded incident generator (Kit.rng) produces incidents with multi-step agent traces; a live interval injects new incidents into the feed; per-model error-rate series render as a line chart; selecting an incident shows its color-coded stack trace with acknowledge/resolve actions. All state client-side.

## Magic moment
The incident feed is live — new incidents roll in with a toast while you read; click any one for its full agent-step stack trace.

## Monetization
Per-event pricing like Sentry ($26/mo for 50k events) + per-seat for the dashboard; enterprise tier with PagerDuty/Slack routing and 1-year retention.

## Known limitations
Incidents are seeded simulation, not from a live runtime; no real alerting integrations; retention is session-only.

## Next 3 features
1) OpenTelemetry ingestion SDK for LangGraph/CrewAI/AutoGen. 2) Alert routing: PagerDuty, Slack, on-call schedules. 3) Flaky-run correlation: link repeat incidents to the same root cause.
