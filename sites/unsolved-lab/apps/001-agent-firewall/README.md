# Gatekeep
**Concept:** Agent Firewall · **Category:** AI Agents / Infrastructure

## One-liner
A permissions layer that intercepts every agent action — read, write, buy, delete, send, execute — and enforces policy before side effects happen.

## Startup thesis
As agents get real tool access, the enterprise question stops being 'what can it do' and starts being 'what is it allowed to do'. Gatekeep is the policy enforcement point every agent platform will need, sold as infrastructure, not a feature.

## Architecture
Single-file app. A client-side policy engine (7 rules: caps, new-payee holds, prod-delete bans, secret-read bans, external-send review, bulk-delete caps, exec allowlists) evaluates each action request; verdicts are allow/deny/quarantine. Quarantined actions wait in a human review queue. Seeded RNG generates the demo traffic.

## Magic moment
On load, an agent tries to wire $8,000 to a 4-day-old payee. The gate intercepts it mid-flight, shows the exact rules that fired (R-101 wire-transfer-cap, R-102 new-payee-hold), and you allow, deny, or quarantine with one click.

## Monetization
Per-agent-seat SaaS ($15/agent/mo) + enterprise policy packs (SOC2/HIPAA templates). The quarantine review queue is the wedge into security teams.

## Known limitations
Demo policies are illustrative, not legal advice; no real enforcement against actual tools (this is the control plane UI); single-user, no team roles or audit export yet.

## Next 3 features
1. Real policy-as-code import (OPA/Rego) so teams bring their own rules
2. Slack/Teams approval buttons for quarantined actions
3. Anomaly detection: flag actions that deviate from an agent's baseline

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
