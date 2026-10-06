# Dryrun
**Concept:** Action Simulator · **Category:** AI Agents / Infrastructure

## One-liner
Simulate downstream effects before allowing consequential agent actions — dry-run the blast radius, then approve or deny.

## Startup thesis
Agents will propose destructive actions constantly; humans can't review each one deeply. Dryrun compresses review into a single number — what breaks — making human approval fast enough to keep up with agents.

## Architecture
Single-file app. Deterministic 400-resource inventory with a dependency model; a 5-phase simulated analysis (ARN resolution, dependency graph, CloudTrail history, policy checks, blast-radius scoring) with progress; results split safe vs in-use with referenced-by evidence; scoped approval (398 safe, 2 excluded) or full deny.

## Magic moment
The agent wants to delete 400 'stale' resources. The dry-run finds 2 that are secretly load-bearing — an RDS snapshot feeding the prod analytics pipeline and an EIP on the prod NAT gateway — and approval auto-excludes them.

## Monetization
Per-simulation pricing for agent platforms + enterprise tier with live cloud-inventory connectors (AWS/GCP/Azure).

## Known limitations
Inventory and dependencies are simulated fixtures; no live cloud API connectors yet; approval is a demo confirmation.

## Next 3 features
1. Live AWS/GCP/Azure inventory + dependency graph connectors
2. Terraform-plan style diffs for proposed infrastructure changes
3. Auto-approval policies for low-risk simulation results

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
