# lukezhang.si — cute cat

A single full-screen page: one cute chibi cat on a warm dark background.
No text content, no navigation. The cat is the whole site.

## The cat (sprite-frame rebuild 2026-09-30, v2026.09.30-19.55)

The hand-drawn SVG cat was rejected as "obviously shapes" (2026-09-30).
Replaced with AI-painted sprite frames in a bold-outline cartoon style
(thick dark outlines, flat cel colors, huge glossy eyes) — the user picked
opt6e from a 10-option lineup, then picked the bicolor wave variant.

Frames live in `frames/` (1600×1600 PNGs, dark warm radial bg baked in):
- `idle.png` — both paws down, sweet neutral (base frame)
- `blink.png` — eyes closed, mid-blink
- `swatL.png` — left paw raised high in a playful swat
- `swatR.png` — right paw raised high (the winning opt6e artwork)
- `happy.png` — closed happy eyes, open smile, paws lifted in delight

## Interactions

- **Paw at the cursor** — when the pointer moves to the left/right of the cat,
  it swaps to the matching swat frame (hysteresis band + 120ms cooldown so it
  never flickers). Whole cat also leans/rotates smoothly toward the cursor.
- **Tap / click** — happy frame + squash-and-stretch + "mew!" bubble +
  six floating hearts. One tap, always. 850ms celebration lockout.
- **Idle life** — breathing bob (rAF sine), blink every ~3–6s, blink only fires
  while idle.
- **No zoom on rapid taps** — `touch-action: manipulation` on the cat,
  viewport locked.

Note: pupils are painted into the frames, so true pupil tracking is gone —
the cat reacts with whole-frame swaps (swat side, lean, blink, happy) instead.

## Implementation notes

- `index.html` + `frames/*.png` served as static assets by the Cloudflare
  Worker (repo = absolukie/lukezhang-si, Workers Builds on push).
- All frames preloaded on page load so swaps are instant.
- One rAF loop drives: swat-zone evaluation, lean lerp, breathing bob.
- Visible build badge bottom-right (`vYYYY.MM.DD-HH.MM`).
