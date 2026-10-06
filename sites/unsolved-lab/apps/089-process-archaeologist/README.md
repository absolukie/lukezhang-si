# Process Dig

**Concept:** Process Dig
**One-liner:** Reconstruct undocumented business processes from company activity.
**Startup thesis:** The wiki says how work should happen; tickets, PRs, and deploys show how it does. Reconstructing the real process from activity artifacts exposes the gap — and the gap is where the risk (and the fix) lives.

## Architecture
Single-file client app. 32 seeded activity artifacts (tickets, PRs, deploys, docs, one incident) feed a reconstruction of "how we actually ship" in 7 steps, each with confidence % and clickable evidence chips that filter the feed. A mode toggle flips to the documented wiki version, surfacing 3 divergences (2 reviewers → 1; full QA → 5-min smoke; continuous deploy → Thursday 2 PM batch).

## Magic moment
Hit "Show me the biggest divergence" and watch the wiki's "two approvals, full QA, deploy anytime" collapse against the feed: one approver, a 5-minute smoke, Thursday at 2 PM.

## Monetization
$499/audit for teams; continuous monitoring at $99/mo; integrations for Jira/GitHub/Slack activity ingestion.

## Known limitations
Demo artifacts are hand-seeded; production needs real API ingestion and NLP over free-text notes. Confidence scores are heuristic.

## Next 3 features
1. Live connectors (Jira, GitHub, Linear, Slack).
2. Drift alerts when this week's behavior breaks the pattern.
3. One-click "update the wiki" PR from divergences.
