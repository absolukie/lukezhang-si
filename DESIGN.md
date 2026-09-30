# lukezhang.si — cute cat

A single full-screen page: one cute chibi cat on a warm dark background.
No text content, no navigation. The cat is the whole site.

## The cat (redrawn 2026-09-30, v2026.09.30-12.00)

Baby-schema / kawaii proportions, drawn from Mofusand-style references:
- Head ~70% of the figure — one big round cream circle.
- Huge round low-set eyes (near-circular whites, big glossy pupils with double highlights).
- Tiny clustered nose + ω mouth, blush on the cheeks.
- Small chubby body, round toe-bean paws, plump comma tail with orange tip.
- Soft calico head patch (feathered edge via blur, clipped to head).
- Short rounded ears with pink inners.
- No whiskers, no harsh black linework — thin warm-tan outlines only.

## Interactions

- **Eye + head tracking** — pupils and head tilt follow the pointer (rAF loop).
- **Paw at the cursor** — when the pointer comes within ~62% of stage width,
  the nearer paw lifts and swipes toward the pointer direction (CSS keyframes
  on `.paw.swat`, aim via `--aim`/`--aim2` custom props), plus a happy hop.
  Cooldown 1.1s; a safety timeout clears the swat state so it can never stick.
- **Tap / click** — squash-and-stretch pounce, a speech bubble
  (mew!/mrrp!/prrp?/mew mew!/mrow!), three floating hearts.
- **Idle life** — breathing, blinking (whole eye, so pupils blink too),
  tail sway, ear twitches, occasional idle mew bubble.
- **No zoom on rapid taps** — `touch-action: manipulation`, viewport locked.

## Implementation notes

- Single `index.html`, inline SVG + CSS + JS. No frameworks, no assets.
- Swat/hop/squash use CSS keyframe classes (not WAAPI): the same machinery
  as the tail/ears/blink, which is proven to render on these SVG nodes.
- `transform-box: fill-box` on all animated SVG groups.
- Visible build badge bottom-left (`vYYYY.MM.DD-HH.MM`).
