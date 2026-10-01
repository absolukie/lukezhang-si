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

## Transparent cutout build (2026-09-30)

User: "it's weird that it's a square background. Can it be just the cat or no."
The painted radial bg in each frame read as a visible square, so all five
frames were cut out to true transparency:

- `cat-frames/bg_remove.py` — region-growing background removal: seeds are
  dark border pixels, fill spreads only through locally-continuous color
  (handles the smooth radial gradient) and stops dead at the cat's dark
  outlines. Mask is pulled back 3px from edges + feathered, so no halo.
- The image model could NOT produce real alpha (asked for transparent PNG,
  returned RGB on white) — programmatic cutout was the reliable route.
- Deployed `frames/*.png` are now genuine RGBA PNGs (not WebP-bytes).
- The page keeps its warm radial-gradient body bg; a soft CSS `#glow` div
  (pure radial, no square edges) sits behind the cat plus a
  `drop-shadow()` on the sprite to ground it.

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

## Blog (2026-10-01)

User asked for a blog section on the site. Kept minimal and warm-dark to match
the cat page. The cat remains the homepage star; a faint `blog` link sits
bottom-left, mirroring the version badge bottom-right.

- `blog/index.html` — post listing.
- `blog/kill-localhost-oauth/index.html` — "Kill the localhost redirect": explains
  @thdxr's 2026-09-30 post begging devs to drop the RFC 8252 loopback-redirect
  OAuth flow for the RFC 8628 device-code (polling) flow. Two Mermaid sequence
  diagrams: the brittle localhost flow (with the SSH breakage noted) and the
  clean device-code flow.
- `blog/tailscale/index.html` — "Tailscale, explained": mesh VPN on WireGuard,
  control plane vs data plane, NAT traversal + DERP fallback, MagicDNS, and the
  greatest-hits feature list. One Mermaid flowchart.
- Diagrams render client-side via Mermaid 10 CDN with a warm-dark theme config.
- Routing note: the Worker serves `/blog/` only if it resolves directory index
  files — verified live after deploy (falls back to explicit `/blog/index.html`
  links if not).
- `blog/two-brains/index.html` (2026-10-01) — "Your brain is two organs": the
  enteric nervous system as the "second brain" (~500M neurons, autonomous
  digestion, vagus nerve mostly gut→brain, gut serotonin/dopamine, hedged
  microbiome note). One Mermaid flowchart of the gut-brain axis.
- 2026-10-01 fix: Diagram 1 in kill-localhost-oauth failed to render —
  `participant Loop` is a reserved keyword in Mermaid sequence diagrams
  (`loop...end` blocks). Renamed to `Srv`. Lesson: validate every Mermaid
  block with `mermaid.parse` (node) before shipping.
