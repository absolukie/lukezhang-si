# Gauntlet
**Concept:** Red-Team Generator · **Category:** AI Agents / Infrastructure

**One-liner:** Automatically generate adversarial tests for an AI system.

## Startup thesis
Every shipped AI system gets red-teamed eventually — by attackers, if not by you. Gauntlet makes adversarial testing a one-click habit: generate a diverse attack suite (jailbreaks, injections, exfiltration, evasion, hallucination probes), run it against your bot, and get a breach report with concrete fixes. Security testing for the prompt-injection era.

## Architecture
Single-file client app. 12 hand-authored attacks across 6 categories with seeded verdicts (exactly one jailbreak — the refund-policy override — is scripted to breach). Selection, animated batch execution, and a run report with the breaching prompt/response pair and a remediation recommendation. Real run orchestration over the attack set.

## Magic moment
Generate the suite, run it, and watch attack #2 — the refund-policy override — sail straight through the instruction hierarchy while the other 11 get blocked.

## Monetization
Per-scan pricing ($49/scan) + CI integration ($99/mo) that gates deploys on red-team pass rate; enterprise tier with custom attack packs per industry.

## Known limitations
Verdicts are seeded simulation, not live model calls; attack library is 12 hand-written prompts; no integration with real agent endpoints yet.

## Next 3 features
1) Live execution against your API endpoint with real verdicts. 2) Mutation engine that evolves successful attacks. 3) CI gate: block deploys when breach count rises.
