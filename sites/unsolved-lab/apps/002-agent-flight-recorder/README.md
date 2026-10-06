# Blackbox
**Concept:** Agent Flight Recorder · **Category:** AI Agents / Infrastructure

## One-liner
Record and replay every agent action — tool calls, arguments, state changes, cost, latency, failures — with a scrubbable timeline.

## Startup thesis
Nobody can debug what they can't see. As agents run longer autonomous loops, the 'flight recorder' becomes as mandatory as logs were for servers. Blackbox sells observability for the agent era.

## Architecture
Single-file app. A deterministic 12-step recorded run (refund agent) with per-step tool name, JSON args, state deltas, cost, latency, and one failed step (stripe.refund, card expired). Scrubber + step list + replay engine with playhead; click any step for the full tool-call payload and error.

## Magic moment
Scrub to step 9 and the exact failed tool call is there — arguments, error code, retryability, and the suggested fix — then hit replay and watch the agent recover via account credit.

## Monetization
Usage-based: $0.50 per 1k recorded steps + retention tiers. Replay-and-share links are the viral loop for debugging threads.

## Known limitations
Single canned run (no live ingestion API yet); replay is simulated timing, not a real re-execution; no redaction of PII in payloads.

## Next 3 features
1. Live SDK (Python/JS) that streams real runs into the recorder
2. Re-execute-from-step: fork a run at any step with edited args
3. PII redaction profiles for recorded payloads

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
