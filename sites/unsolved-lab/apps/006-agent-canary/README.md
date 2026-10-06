# Canary
**Concept:** Agent Canary · **Category:** AI Agents / Infrastructure

## One-liner
Plant honeytoken secrets where no legitimate agent should look; get an instant alert with a full trace the moment one is touched.

## Startup thesis
You can't review every agent action, but you can booby-trap the things it must never touch. Canaries turn secret-sprawl from an invisible risk into a tripwire — cheap to plant, impossible for a snooping agent to avoid.

## Architecture
Single-file app. Four planted honeytokens (AWS key, Stripe key, DB password, GitHub PAT) with armed/tripped states; a live access feed; tripping a canary fires a pulsing alert modal with the token, syscall-level trace, and triage actions; every trip persists as an incident with a rotate/isolate/notify checklist and a copyable incident report (localStorage); planting new canaries; deterministic demo trip on load (once, no dupes on reload); low-frequency scan heartbeat keeps the feed live.

## Magic moment
Seven hundred milliseconds after load, research-agent reads /etc/secrets/aws.env and the alarm fires — token value, reader identity, source file, and the exact syscall, with one-click key rotation.

## Monetization
Per-canary-per-month fleet pricing for enterprises + incident-response integrations (PagerDuty/Slack). Land with security teams, expand to every agent deployment.

## Known limitations
Simulated filesystem (no real file-watching agent yet); honeytokens are clearly fake strings; no SIEM export.

## Next 3 features
1. Real eBPF/file-watch daemon that plants and monitors canaries on servers
2. Webhook/SIEM push for every trip (incident report is already copyable as JSON-ready text)
3. Decoy documents and database rows, not just keys

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
