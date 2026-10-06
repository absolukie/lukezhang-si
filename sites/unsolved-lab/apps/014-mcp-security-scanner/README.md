# MCPatrol
**Concept:** MCP Scanner · **Category:** AI Agents / Infrastructure

**One-liner:** Analyze MCP servers and tools for security risks and excessive capabilities.

## Startup thesis
MCP servers hand agents real capabilities — file deletion, shell exec, network egress — with almost no review. MCPatrol is the Snyk for MCP: paste a manifest, get a threat model with severity-ranked findings and concrete fixes before an agent ever touches the server.

## Architecture
Single-file client app. A rule engine of regex+schema heuristics tests each tool against 6 risk rules (destructive, exec, exfil, secrets, unscoped write, traversal). Findings feed a weighted 0–100 risk score, a capability inventory, and fix recommendations. Fully offline.

## Magic moment
Auto-scans the preloaded filesystem-plus manifest on load and flags delete_recursive as a critical rm-rf-shaped destructive capability.

## Monetization
Free single scans; team tier ($19/seat/mo) with CI gating that blocks PRs adding risky tools; enterprise registry that only allows signed, scanned servers.

## Known limitations
Heuristic rules, not taint analysis — clever naming can evade detection; no live probing of the server; manifest must be pasted manually.

## Next 3 features
1) Live server probing over SSE to verify declared vs actual tools. 2) Auto-generated least-privilege wrapper configs. 3) Registry of scanned servers with signed risk badges.
