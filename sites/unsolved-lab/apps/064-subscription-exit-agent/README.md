# Exit Ramp

**Concept:** Exit Agent
**One-liner:** Navigates hostile cancellation flows with retention-script counters and a tamper-proof evidence vault.

## Startup thesis
Companies engineer cancellation to be painful; a co-pilot that predicts each retention tactic and logs legally-admissible proof flips the power balance.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
The agent hears 'we can offer you 2 months free' and instantly hands you the exact counter-line plus a one-tap evidence capture.

## Monetization
$3 per completed cancellation or $8/mo unlimited; B2B API for banks' subscription-management features.

## Known limitations
- Demo scenario is simulated; script counters are playbooks, not legal counsel.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Live call mode: real-time transcription with tactic detection
2. Certified-mail generator for cancellations that require written notice
3. Regulatory complaint auto-filing (FTC/state AG) when companies refuse
