# DeltaScope
**Concept:** Permission Diff · **Category:** AI Agents / Infrastructure

## One-liner
Show exactly what new permissions an agent gains after an update — added, removed, risky — before you approve it.

## Startup thesis
Agent auto-updates are the new supply-chain attack surface: a 'minor update' can quietly add prod DB writes. DeltaScope is the Dependabot-for-agent-permissions — diff, risk-score, and gate every update.

## Architecture
Single-file app. Versioned permission manifests (v2.2/v2.3/v2.4) are diffed into added/removed/unchanged rows with per-permission risk metadata and vendor justifications; risk scoring sums added-permission risk; expandable rows with approve / approve-with-restriction / block decisions persisted per version pair in localStorage; a deploy-gate banner computes the verdict (DEPLOY BLOCKED / PENDING REVIEW / PASS WITH RESTRICTIONS / READY TO APPROVE) from those decisions; version-pair switcher.

## Magic moment
v2.3 to v2.4 opens with three new permissions already flagged red — secrets.read, db.write.prod, billing.refund — each with a plain-English explanation of why the vendor's justification doesn't hold up.

## Monetization
Freemium for open-source agent manifests; team/enterprise for private registries + policy gates that block risky updates in CI.

## Known limitations
Manifests are hand-authored fixtures; no live registry integration yet; risk scores are heuristic, not learned.

## Next 3 features
1. Live manifest fetching from agent registries (auto-diff on release)
2. CI webhook: push the gate verdict (BLOCKED/PASS) to the agent registry so CI can fail on blocked updates
3. Crowdsourced risk annotations from the community

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
