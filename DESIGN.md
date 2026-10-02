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
- `blog/fastapi/index.html` (2026-10-01) — "FastAPI, explained": type hints in,
  validated API out; Starlette + Pydantic; what it's for (ML serving,
  microservices, app backends, webhooks) and not for. One Mermaid sequence
  diagram of a request lifecycle (validated with mermaid.parse before ship).
- `blog/green-line-meme/index.html` (2026-10-01) — "The green line meme,
  explained": Autism Capital's "He knows about the green lines" quote-tweet of
  the Elon/Karoline Leavitt clip; the video artifact as the joke; three layers
  of why it's funny; artifact-spotting as a meme genre. Text-only, no diagram.
- `polish/index.html` (2026-10-01) — interactive essay "No purple gradients"
  after Des Traynor's anti-vibe-coding tweet: vibe-coded↔polished toggle lab,
  01 Sound (Web Audio synth engine, Cuelume-style), 02 Motion
  (Transitions.dev-style demos), 03 UI (shadcn-style gallery). All sounds
  synthesized live; no audio files.
- `atlas/index.html` (2026-10-01) — "Atlas": infinite zoomable canvas of the
  Liverpool Rummy architecture (after Robin Ebers' zoom-canvas tweet).
  SVG pan/zoom (drag, wheel-to-cursor, pinch, dblclick, keyboard) with 4
  semantic-zoom levels: titles → one-liners → bullets → mono fine print
  (real details: Room DO, TURN_MS=90000, {t:...} frames, /ws, deploy flow).
  Side index flies to nodes; click a card to dive to L4. Dark canvas,
  light cards, blue hot-path connectors. Build badge v2026.10.01.
- `atlas/index.html` v2 (2026-10-01) — rebuilt as a true hierarchical graph:
  1,885 generated nodes (12 subsystems → 144 modules → 1728 leaves) on a
  canvas renderer. Zoomed out only ~12 nodes show; zooming into a node
  unfolds its 12 children + new cross-link edges. Node positions are a pure
  function of path (deterministic seeded layout), so the tree is never fully
  built. Breadcrumb, live visible/total counter, subsystem jump index.
  Honest label: generated demo graph. Build badge v2026.10.01b.
- `atlas/index.html` v3 (2026-10-01) — org-chart rebuild per feedback: Acme Inc,
  12 VPs -> 9-13 directors -> 11-17 reports = 2,033 generated people. People are
  colored initial-avatars by department; zooming into anyone unfolds their
  team with reporting lines + cross-team 'works with' edges. Perf fixes: each
  element drawn exactly once per frame (the old build stroked boundary rings
  once per visible node), redraws coalesced to one per animation frame.
  Breadcrumb, live visible/total counter, VP jump index. v2026.10.01c.
- `atlas/index.html` v4 (2026-10-01) — pyramid rebuild: Meridian, a fictional
  fintech. CEO -> 12 departments (Brokerage, Crypto, Operations, ...) ->
  7-10 teams each -> 14-21 people each = 1,904 generated people. Classic
  top-down tidy-tree layout; collapsed subtrees take one card of width.
  Click a card to unfold/collapse its subtree (pinned); deep zoom
  auto-unfolds too. Elbow reporting lines, dept color accents, breadcrumb,
  live counter, department jump index. v2026.10.01d.
- `atlas/index.html` v5 (2026-10-02) — bugfixes: tap-to-collapse now eases the
  camera just below the level's auto-unfold threshold so auto-unfold can't
  instantly re-open it; zooming now anchors the card under the cursor when
  the layout reshapes, so you never get stranded on a blank canvas.
  v2026.10.01e.
- `atlas/index.html` v6 (2026-10-02) — zoom anchoring rework: the anchor is now
  the deepest expanded branch containing the focal point (gaps between cards
  still belong to a branch), so zooming out from deep can no longer strand
  the camera on a blank canvas; the surviving branch stays glued to the
  focal point as the pyramid reshapes. Layout now stores subtree x-bounds.
- `atlas/index.html` v7 (2026-10-02) — static-pyramid rebuild per feedback:
  full 4-tier pyramid always laid out (CEO -> 12 depts -> ~102 teams ->
  1,787 people as a dot sea), segment layout, pure semantic zoom
  (dots -> blocks -> cards -> opened team grids). Click only selects
  (no camera flight); layout never reshapes so the stranded-camera bug
  class is gone. v2026.10.02a.
