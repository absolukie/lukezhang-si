# regress
**Concept:** Regression CI · **Category:** AI Agents / Infrastructure

## One-liner
Continuously test agents across a matrix of models, prompts, tools, and environments — and block rollouts on regressions.

## Startup thesis
Agents regress silently when the model underneath changes. Someone has to be the CI layer that pins behavior across model versions — regress runs the matrix on every commit and says 'ship' or 'stop'.

## Architecture
Single-file app. 3-model x 4-prompt matrix with baseline scores; animated run fills cells with scores and deltas vs baseline; a planted regression (atlas-4.1 x DB cleanup plan: 9.2 to 6.1) triggers a blocking alert with evidence and a plan diff; click any cell for latency/cost/detail; pipeline config modal.

## Magic moment
The matrix auto-runs on load and one cell glows red: atlas-4.1 dropped 3.1 points on DB cleanup plans because it now proposes DROP DATABASE without a snapshot check. Inspect, block the rollout, file the ticket.

## Monetization
Per-matrix-run CI pricing (like CircleCI for agents) + enterprise for private model endpoints and custom thresholds.

## Known limitations
Scores are fixtures with deterministic jitter, not live model calls; no real model API integration yet; single threshold for all cells.

## Next 3 features
1. Live model endpoints (OpenAI/Anthropic/self-hosted) as matrix dimensions
2. Per-cell thresholds and statistical significance testing
3. GitHub Action that comments the matrix on every PR

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
