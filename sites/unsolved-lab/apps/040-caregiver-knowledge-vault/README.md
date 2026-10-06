# Lorebook

**Concept:** Knowledge Vault  
**Category:** Aging / Caregiving

**One-liner:** A searchable vault of the unwritten things one caregiver knows — so care survives turnover.

## Startup thesis
Every family has a Rosa — the caregiver who knows that pills go in applesauce. When she leaves, the knowledge leaves. A shared, searchable vault of lived facts preserves care quality across caregiver turnover. Sold to home-care agencies as retention + quality infrastructure.

## Architecture
Single `index.html`. 30 seeded facts with category/witness/date metadata; live search with match highlighting; category chips with counts; user additions persist via `Kit.store`; deterministic fact-of-the-day via `Kit.rng`.

## Magic moment
Search "cat" — Miso the foot-warmer surfaces instantly, highlighted, with who logged it.

## Monetization
$6/mo family; $199/mo agency (vault per client, turnover-proofing reports, new-hire onboarding packs).

## Known limitations
Fictional demo content; no photo/voice capture; no multi-family sharing controls.

## Next 3 features
1. Voice-note capture ("tell Lorebook while you work").
2. New-caregiver digest: "read these 10 first."
3. Contradiction flagging ("two people logged different pill routines").

