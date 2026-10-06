# Birds of a Feather — QA Notes (v2026.10.04-01)

## Solver verification (`node test/levels.test.js`)

| Check | Result |
|---|---|
| All 60 Journey levels solvable by quota elimination, solution matches intended homes | **60/60 PASS** |
| 90 consecutive daily seeds (2026-10-04 → 2027-01-01) uniquely solvable | **90/90 PASS** |
| No duplicate words within a level | PASS (fixed: `turkey` was double-picked in L36/L52 — generator now dedupes ambiguous picks by word) |
| Every ambiguous word's alternate flock present in the level | PASS |
| Flock quotas 2–8, feathers 3–5, totals 8–25 cards | PASS |
| Determinism (same level/seed twice → identical) | PASS |
| Teaching progression markers | L1: 0 ambiguous · L6: exactly 1 (orange) · L7: 2 · L15: 2 · L60: 7 ambiguous / 25 cards / 3 feathers |

Quota-elimination = two rules applied to fixpoint: (1) a card with exactly one
viable flock (quota remaining) must go there; (2) a flock whose remaining quota
equals the number of unassigned cards that could fill it must take all of them.
A level ships only if this fully assigns every card to its intended home.

## Headless Chromium playthrough (Playwright, file://)

- Level 1 (?level=1), 390×844: 8 cards dealt, 5 open, 4 flocks render. Solver-driven
  full playthrough → all 8 homed → "Flock complete!" overlay, 3 stars,
  `localStorage bof_progress = {"unlocked":2,"stars":{"1":3}}`. Next → Level 2 loads.
- Wrong-placement path: feather lost, shake + puff + toast, quota unchanged.
- Fail path: 5 wrong moves → "The flock scatters…" overlay → Retry resets to 8 cards.
- Call button: costs 1 feather, pulses the correct nest, toast confirms.
- Screenshots: 390×844 (game, win overlay), 1440×900 (level 8), desktop map screen.
- **Zero console errors** on all runs.

## Bugs found & fixed

1. **Win/fail flow broken by audio typo** — `exponentialRampToValueAtValue`
   (should be `...AtTime`) threw inside `tone()`, and since `sfx('right')` ran
   before the `winLevel()` check, winning never fired; same for the fail path
   (`sfx('wrong')` threw before the feather-zero check). Fixed the typo AND
   wrapped `tone()` in try/catch so audio can never break gameplay again.
2. **Shake animation didn't retrigger** on repeat mistakes — now removes/re-adds
   the class with reflow.
3. **Daily "replay for fun" crashed** (`C.getLevel('daily-fun:…')` threw) —
   fun replays now use their own key branch with no streak/progress writes.
4. **Card overlap** `-42px` hid too much of buried birds → `-30px`.
5. **Version badge overlapped** the action-bar hint → extra bottom padding.

## Not verified (needs human eyes)

- Real-device touch feel (tap rhythm, animation smoothness on a phone GPU).
- WebAudio chirps on iOS Safari (AudioContext unlock behavior).
- `navigator.vibrate` on Android hardware.
- Service worker offline behavior (code is standard cache-first; not run over http).
- Cloudflare Pages deploy — intentionally left to the parent agent.

## Expansion: 200 levels + dev mode (v2026.10.04-02)

Built with GPT-6 Astra via Codex CLI as worker agents (content + dev UI), coordinated by Muse.

### Content — levels 61–200
- 7 new original word pools: Mammals, Metals, Fabrics, Shapes, Furniture, Spices, Stationery (12–16 words each, ≥2 genuine ambiguous links each).
- Difficulty curve: 61–80 gentle restart (t 0.35–0.60, 4 feathers) → 81–120 ramp → 121–160 near-max → 161–200 endgame (25 cards, ~8 ambiguous, three-flock cards, 3 feathers).
- Levels 16–60 and all daily seeds use only the original 24 themes (legacy output preserved by design until the semantic pass below).

### Semantic review (Astra, all 34 pools)
Applied 60+ fixes:
- Removed unfair/stretch words: claw/horn/trunk/tail (Animals), bowl/tailgate/picnic/flight (Food), 22 tasting-adjectives from Drinks (crisp, hazy, zesty…), sail (Vehicles), spider (not an insect), wing (Birds), ivory (Music).
- Unlinked 12 far-fetched ambiguities (ring→Gems, collar→Animals, frost→Desserts, mussel→Body homophone, shell→Food…).
- Merged Footwear→Clothes (dedup shoe/shoes, sock/socks, boot/boots), Sweets→Desserts, folded Fish→Sea. Removed 3 duplicate-concept themes.
- Kept umbrella themes Animals/Food/Sea: they are tutorial-critical (L1–L5) and the Animals/Birds overlap precedent shipped in v1.
- Hand levels 1–15 verified byte-identical after curation; 16–60 + dailies regenerated from curated pools and re-proven.

### Solver verification (`node test/levels.test.js`)
**200/200 levels + 90/90 daily seeds: unique deducible solutions, 0 failures.**
Per-band: 61–80: 20.25c/3.70a · 81–120: 22.77c/5.25a · 121–160: 24.77c/6.28a · 161–200: 25.00c/8.05a (54 three-flock cards). SHA-256 snapshots of 1–60 + dailies re-baselined to curated pools.

### Dev mode (`?dev=1`)
- Developer browser: 200-level grid with lazy card/ambiguity metadata, 14 recent daily seeds, tap to play instantly (no locks).
- Reveal-solution toggle in HUD shows each card's home flock; captions verified against the solver on levels 65/120/199.
- Dev plays use `dev:` keys and never write `bof_progress` / `bof_daily` (verified: localStorage empty after dev win).

### Journey UI 60 → 200
Map renders 200 nodes, home subtitle "of 200", unlock cap 200, `?level=` accepts 1–200, "Journey complete!" panel after level 200.

### Playwright (Chromium, 390×844, http)
16/16 PASS: dev grid (200 buttons), 14 dailies, metadata fill, level jump, reveal correctness ×3, full solver-driven playthrough of L65 (won, 25 moves), no progress writes, 200-node map, ?level=199 boot, zero console errors.

### Gameplay parity vs Solitaire Associations genre
Checked published rules (solitaireassociation.com): word-card tableau with only top cards accessible, four category piles, limited moves, clear-the-board win, ambiguity scaling with difficulty. Our loop matches on all five points; ours is a streamlined original take (no tableau-internal moves, no jokers — feathers + Call button instead). No content copied; all words/categories/art are original.

### Not verified (needs human eyes)
- Real-device touch feel on the 200-node map scroll and dev grid.
- Whether endgame triple-ambiguous levels feel fair to humans (solver proves deducibility, not fun).
- iOS Safari AudioContext unlock for the new levels' SFX (unchanged code path).
