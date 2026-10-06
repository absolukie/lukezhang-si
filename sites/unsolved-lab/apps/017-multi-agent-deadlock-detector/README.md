# Deadbolt
**Concept:** Deadlock Detector · **Category:** AI Agents / Infrastructure

**One-liner:** Detect loops, duplication, disagreement, and deadlocks between agents.

## Startup thesis
Multi-agent systems fail in social ways: loops, duplicated work, and entrenched disagreement that burns tokens while converging on nothing. Deadbolt is the conflict radar for agent swarms — it fingerprints repetition, classifies the deadlock pattern, and proposes a concrete tiebreak (arbiter, vote, source hierarchy).

## Architecture
Single-file client app. A scripted two-agent debate ticks on an interval; the analyzer computes normalized signature fingerprints per turn and counts repetitions ≥3 as a loop, plus value-disagreement detection on the disputed amounts. Tiebreak application injects an arbiter ruling and halts the loop. Real detection logic on live message state.

## Magic moment
The debate auto-starts; within seconds both agents are restating fixed positions — hit Analyze and Deadbolt fingerprints the loop and proposes the arbiter tiebreak.

## Monetization
Per-seat SaaS for agent-platform teams ($29/seat/mo); usage-based deadlock-prevention API for frameworks (LangGraph/CrewAI plugin); enterprise audit of multi-agent incidents.

## Known limitations
Demo debate is scripted; signature matching is keyword-normalized, not semantic; arbiter is simulated.

## Next 3 features
1) Embedding-based semantic loop detection. 2) Framework plugins that auto-inject tiebreaks into live swarms. 3) Deadlock post-mortems with token-cost attribution.
