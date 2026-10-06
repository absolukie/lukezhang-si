# Scopekey
**Concept:** Agent Identity · **Category:** AI Agents / Infrastructure

## One-liner
Delegated identities for agents: scoped, repo-bound, short-lived credentials with a full allow/deny usage log.

## Startup thesis
Agents using human credentials is the next big breach vector. Scopekey does for agents what OAuth scopes did for apps — least-privilege, expiring, auditable — and becomes the identity layer every agent platform plugs into.

## Architecture
Single-file app. Credential issuance form (agent name, repo binding, scope checkboxes, expiry) mints scoped tokens; a policy check runs per simulated call; usage log records allows and denials with reasons; expiry countdown bars; localStorage persistence of issued credentials.

## Magic moment
The preloaded deploy-bot credential (repo.read on acme/web, 8h expiry) tries to deploy to prod and read Stripe keys — both denied on screen with the exact missing scope cited.

## Monetization
Per-credential-issuance + enterprise SSO/SCIM directory sync. Identity is sticky: once agents mint through you, you own the audit trail.

## Known limitations
Tokens are demo strings, not cryptographically verifiable (no JWT/signing yet); persistence is localStorage only; no rotation webhooks.

## Next 3 features
1. Real signed JWTs with a verification endpoint
2. Auto-rotation and revocation webhooks to providers
3. Team workspaces with approval workflows for scope grants

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
