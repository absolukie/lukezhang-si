# Gatekeep
**Concept:** Cost Governor · **Category:** AI Agents / Infrastructure

**One-liner:** Enforce token, money, tool-call, time, and action budgets on live agent runs.

## Startup thesis
Agent spend is invisible until the invoice. Gatekeep is the budget layer every agent platform needs: declare caps in dollars, tokens, tool calls, and GPU time, and enforce them while the run is alive. It turns cost from a finance surprise into an engineering control.

## Architecture
Single-file client app. Budgets live in a state object; a 900ms tick loop accrues seeded burn rates; cap breach triggers an enforcement record (policy match → throttle → checkpoint). Tables, KPIs, and the burn-down line render from the same state. No backend — the enforcement engine is real client-side logic.

## Magic moment
The app auto-starts a demo agent run on load; within seconds it slams into the spend cap and gets throttled mid-run — banner, enforcement record, checkpointed state.

## Monetization
Per-seat SaaS for agent teams ($29/seat/mo) + a percentage-of-managed-spend tier for enterprises; policy packs (SOC2 cost controls) as add-ons.

## Known limitations
Simulation uses seeded burn rates, not real provider metering; no multi-org support; policies do not persist beyond the session (localStorage hookup is a stub).

## Next 3 features
1) Live provider webhooks (OpenAI/Anthropic usage APIs) for real metering. 2) Per-team budget allocation with approval flows for over-cap requests. 3) Anomaly alerts: burn-rate spikes paged to Slack before caps hit.
