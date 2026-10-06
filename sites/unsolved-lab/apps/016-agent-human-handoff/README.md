# Relay
**Concept:** Handoff Protocol · **Category:** AI Agents / Infrastructure

**One-liner:** Intelligently transfer failing or uncertain AI workflows to humans.

## Startup thesis
Agents fail most dangerously when they fail confidently — or stall silently when uncertain. Relay is the handoff protocol for the agent era: confidence-gated escalation that packages full context (transcript, state, tool log, suggested actions) so a human can take over in seconds, and the agent can learn from the resolution.

## Architecture
Single-file client app. A scripted live session ticks every 1.7s with a declining confidence trace; crossing the 40% threshold triggers handoff packaging into a human queue. Accept / retry / full-context actions mutate the queue and session state. All client-side, seeded demo.

## Magic moment
Watch the confidence meter bleed from 96% to 31% as the agent hits conflicting policies — then a fully-packaged handoff card lands in the human queue with tools used and suggested actions.

## Monetization
Per-handoff pricing ($0.25/handoff) for support automation; team SaaS with SLA routing and on-call integrations; the "agent learns from resolution" loop as the enterprise upsell.

## Known limitations
Session is scripted demo content, not a live agent; confidence is simulated; no real ticketing/CRM integration.

## Next 3 features
1) Real confidence signals from model logprobs + verifier agents. 2) Routing rules: skill-based assignment, SLA escalation. 3) Closed-loop learning: resolutions feed back into agent prompts.
