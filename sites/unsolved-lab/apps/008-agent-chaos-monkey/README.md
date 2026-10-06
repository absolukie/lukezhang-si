# Gremlin
**Concept:** Chaos Monkey · **Category:** AI Agents / Infrastructure

## One-liner
Adversarially test agents with broken APIs, latency spikes, revoked permissions, prompt injections, and malformed payloads.

## Startup thesis
Agents fail in ways unit tests never cover — they retry forever, hallucinate through errors, obey injected instructions. Gremlin is chaos engineering for the agent stack: prove graceful degradation before production does it for you.

## Architecture
Single-file app. Five scripted chaos scenarios (API 500 with idempotent retry, 8s latency spike with deadline, mid-run permission revocation, prompt injection via gateway, truncated JSON) run against a simulated agent with a live timestamped log; each scenario is scored pass/fail with the reasoning; auto-runs on load.

## Magic moment
Watch the agent handle a 500 and a prompt injection gracefully — then crash on truncated JSON with an unhandled SyntaxError. The scorecard names the exact bug to fix.

## Monetization
Seat-based for agent teams + CI integration: chaos suite runs on every agent deploy, failures block rollout.

## Known limitations
Agent behavior is scripted, not a live agent under test; scenarios are fixed, not composable; no latency/fault injection into real HTTP calls yet.

## Next 3 features
1. Live proxy mode: inject faults into real agent tool traffic
2. Composable scenario builder (chain faults, set probabilities)
3. Bring-your-own-agent harness (LangChain/CrewAI adapters)

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
