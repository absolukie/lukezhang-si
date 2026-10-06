# Keymint
**Concept:** Secrets Broker · **Category:** AI Agents / Infrastructure

**One-liner:** Issue narrowly-scoped temporary credentials to agents.

## Startup thesis
Agents with long-lived, over-scoped credentials are a breach waiting to happen. Keymint is the secrets broker for the agent era: mint a credential scoped to one table and one permission set with a short TTL, watch it expire, revoke in one click. Least privilege becomes the default, not a ticket.

## Architecture
Single-file client app. Credentials are generated client-side (opaque km_ tokens), bound to agent + table + permission + purpose, with a hard expiry timestamp. A 500ms countdown loop flips state to expired, redacts the token, and denies further use — the access log records every mint/query/deny. Real expiry enforcement logic.

## Magic moment
The app pre-mints a 60-second demo credential on load — test a query while it is live, then watch it expire, redact itself, and start denying.

## Monetization
Per-issued-credential pricing ($0.01/mint) + team SaaS for policy management; enterprise tier integrates with Vault/KMS as the backing store.

## Known limitations
Tokens are simulated, not backed by a real secrets store; no actual database enforcement; page reload loses issued credentials.

## Next 3 features
1) Real backing stores: HashiCorp Vault dynamic secrets, AWS IAM Roles Anywhere. 2) Policy-as-code: which agents may request which scopes. 3) Break-glass flow with mandatory human approval for prod scopes.
