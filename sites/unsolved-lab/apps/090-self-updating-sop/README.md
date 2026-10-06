# Living SOP

**Concept:** Living SOP
**One-liner:** Detect when actual operations diverge from documented processes.
**Startup thesis:** SOPs rot the day after they're written. Diffing the documented process against actual execution history (CI/CD, tickets) and proposing updates turns tribal knowledge into a living document — with humans approving every change.

## Architecture
Single-file client app. 8-step documented deploy SOP vs. 20 seeded deploys, each recording per-step conformance (as-documented / reordered / skipped). A detector flags steps with >30% non-conformance: QA checklist skipped 14/20, DB backup reordered 9/20, rollback-doc update skipped 12/20. Accept writes the new wording into the SOP (persisted in localStorage with a change log); dismiss keeps the documented text.

## Magic moment
Three divergence cards appear with deploy-ID evidence — hit "Accept all 3" and watch the SOP rewrite itself to describe what the team actually does.

## Monetization
$149/mo per team for CI/CD-connected drift detection; compliance tier with audit trails; API for GRC platforms.

## Known limitations
Demo deploy history is seeded; production ingests real pipeline data. Detector thresholds are fixed heuristics.

## Next 3 features
1. Live CI/CD + incident connectors (GitHub Actions, PagerDuty).
2. Auto-drafted SOP update PRs for review.
3. Compliance mapping (SOC 2 change-management evidence).
