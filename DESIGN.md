# ELSEWHERE — Design Doc: Four Emotions

> The emotions are design drivers only. They never appear on the site.
> Each world must make the visitor *feel* its emotion through motion, scale,
> color, and rhythm — not through words.

---

## v2 redesign — locked 2026-09-30 ("back to the drawing board")

Luke's verdict on v1: nebula fine but motion unreadable; the ecstasy act and
the android-looking giant failed; awe was good but the transition into it was
abrupt and Saturn sat dead-center; yearning felt like nothing; some names bad.

**Locked act names: ASCEND · TEMPEST · BEHOLD · LAMENT.**

| # | Act | What changed in v2 |
|---|-----|--------------------|
| I | **ASCEND** | Nebula kept. Speed made unmistakable: hyperspace streaks now breathe at cruise (not only on hold), FOV widens with haste, skip punches the lens. |
| II | **TEMPEST** | Tesseract **cut entirely**. The act belongs to the giant: it strides beside the camera through an ember storm, one vast footstep every ~1.15 s — every beat fires a shockwave ring and shudders the camera. Lightning flickers deep in the storm. |
| III | **BEHOLD** | Passages lengthened 4 s → 7 s; the incoming act now animates during the blend (its `update()` runs with `actT=0` before the current act's). Saturn pushed far off to the side (x+620, z-700, 1.35× scale, deeper tilt) — no longer centered. The giant stands revealed on the ridge, violet-rimmed. |
| IV | **LAMENT** | Rebuilt to ache: cold slanted rain, thicker fog, fallen monoliths, camera slowed to 0.55× cruise, the giant walking away with legs in the fog — then it stops and kneels. The 3-light choice is unchanged (gaze 2 s / touch; drift defaults to the Offering; choice tints the next loop's Act I). For the Look ending the giant now lifts its head and its eyes ignite violet. |

**The giant v2 — a robed colossus, not a robot.** ~1150 units tall (≈3× v1).
Realistic human anatomy: lathe-turned torso (hips→shoulders), capsule arms
with elbow pivots and sphere hands, capsule legs with hip + knee pivots and
feet, sphere head with a hood shadowing the face, and a heavy lathe-draped
cloak with noise-folded cloth. Two rim materials (cold cloak, warm skin);
rim color shifts per act (blue → ember → violet → gold). It looms through fog
at 0.45× the world's fog density — fog that would swallow anything smaller.
Gait: hip sway, counter-swinging arms, knee bend, two footfalls per cycle with
`stepPulse` the camera and shockwaves answer to; kneel pose bends knees deeply
and bows the head.

**Giant life + detail pass (2026-09-30, after "lifeless / not detailed enough"
feedback):** the shader now has cloth-fold ribbing, a vertical height
gradient, and a per-act underlight (`setUnder(hex, k)` — ember orange from
below in Tempest, cold blue in Lament); regalia added (waist sash + knot,
shoulder pauldrons, forearm bands); the cloak sways a half-beat behind the
body. Tempest stride is now a smooth weight transfer (sin phase per beat, not
a binary snap) with torso counter-turn, shoulder roll, head bob and dip;
every footstep lands: camera-facing shockwave ring (260 maxR), dust-burst
puffs at the planted foot, a camera thump + roll kick. Tempest also gets
visible lightning bolts (sky-flash lerp 0.12→0.30) and a scrolling
ember-flecked ground texture so the march has a motion cue at its feet.
Lament rain is now slanted streak-drops (LineSegments), not points.

**Speed language (global):** streaks always visible (opacity 0.16 at cruise,
340 streaks, 120 u/s base flow), 260 near-field rush motes streaming past the
camera in every act, FOV 62→76+ with haste, skip punches +22 FOV, gentle
perpetual camera bob. The worlds mostly travel with the camera, so the speed
sensation lives in these camera-attached systems plus per-act streaming
(embers, ground texture, rain, terrain offset). The ignition whiteout between
Ascend and Tempest is a ~3s pulse at the passage start, never a 9s wash.

**Framing spec (corrected 2026-09-30 after rendered QA — the earlier
"~1000 units fits" math was wrong: at 1000 units the 1150-tall figure spans
59° of the 62° frame, i.e. it fills the screen edge-to-edge):** aim for the
figure to span ~40–47° so it reads as a figure in a world with headroom.
Ascend parks it (x+180, z−1230), rim 0.55 — a dim but genuinely visible shape
in the cloud; Tempest marches it at (x+1050, z−1050) (~1485 out, ~42° tall)
with the camera's gaze locked at its chest (ly=520, not 320) and the giant
slowly pulling ahead (+5 u/s travel); Behold stands it at (x−380, z−1250)
(~17° left of center, ~47° tall) with the camera tipped up 20°, Saturn pushed
to (x+380, z−1150) at 1.0 scale — a distant ringed world, ~11° across;
Lament walks it away at (x+130, z−640→760) through heavy fog, then it glides
to (x−30, z−500) and kneels while the choice camera rises to y=40 aiming at
(x−30, 300, z−500): bowed head just inside the top of frame, violet choice
eyes and white light in frame, gold hand below (found by looking down).
The cloak lathe needed `DoubleSide` (its winding made
it invisible from outside, leaving bare "android" legs). Bloom threshold
0.12 → 0.5 fixed the full-screen white wash.

---

## WORLD I — RAPTURE

**What rapture is:** being seized and carried away. The self dissolves into
something larger and unbearably beautiful. It is *passive* — something takes
you. Upward motion, saturating light, surrender.

**What builds it:** slow ascension, light that grows until it swallows the
frame, vast soft luminous space with no hard edges, things opening toward you,
breath-slow rhythm, warm gold/white/rose.

### Animation concepts
1. **Ascension** — the camera rises slowly through strata of luminous cloud,
   each layer brighter and warmer than the last, god-rays from above. The
   feeling of being lifted. *(Evolves the current nebula: add vertical lift
   and a brightening core.)*
2. **The Bloom** — a colossal lotus/mandala of light-petals light-years wide
   opens as you approach; petals are streaming particles unfolding in slow
   motion.
3. **Whiteout** — you drift toward an intensifying glow until the screen is
   nearly all light, hold at the edge of dissolution, then it exhales back.
4. **Pillars of Dawn** — kilometer-tall columns of light rise past the camera
   like organ pipes; you drift upward between them.
5. **The Embrace** — the touch-vortex becomes the point: touching gathers the
   cloud into a warm swirling heart that pulls the camera gently inward.
6. **Choir** — rings of light expand outward in slow rhythm and the camera
   passes through each one, like moving through sound made visible.

### Name candidates
ASCENSION · SERAPH · LUMEN · THE BLOOM · HALO · ELYSIAN

---

## WORLD II — ECSTASY

**What ecstasy is:** peak-intensity joy. Unlike rapture (being lifted), ecstasy
is *active* — pulse, rhythm, climax. The body wants to move. Build and release.

**What builds it:** a felt beat (visual rhythm around 120bpm), saturated
shifting color, acceleration and rush, build-then-drop structure,
kaleidoscopic symmetry that overwhelms pattern recognition.

### Animation concepts
1. **The Pulse** — the hypercube becomes a heart: everything scales and
   flashes on a beat, shockwave rings on every pulse, camera weaves through
   the shockwaves.
2. **Kaleidoscope Tunnel** — a mirrored geometric tunnel spins and accelerates,
   colors cycling faster and faster → white flash → release into calm, then it
   builds again.
3. **Nova Rain** — endless particle fireworks erupt around the camera in
   rhythm, each burst a chord of color.
4. **The Drop** — the 24-second visit is scored like music: ~16s build (tunnel
   narrows, speed and saturation rise) → ~8s release (burst into an open
   luminous field, slow drift). Then warp.
5. **Crystal Choir** — a field of crystal pillars bouncing light in traveling
   waves; the camera skims the wave crests as they roll past.
6. **Chromatic Storm** — ribbons of pure saturated color whip past the camera;
   you're inside the storm, with occasional calm eyes at the center.

### Name candidates
PULSE · EUPHORIA · THRUM · IGNITION · FERVOR · KINESIS

---

## WORLD III — AWE

**What awe is:** perceived vastness that makes the self feel small. Wonder
mixed with a little fear — the sublime. It gives people chills.

**What builds it:** immense scale that dwarfs the viewer, slow inevitable
motion (planets, glaciers), deep time (ancient, eroded, eternal things),
looking UP, stillness contrasted with immensity.

### Animation concepts
1. **The Looming** *(current direction, pushed)* — Saturn grows until it fills
   half the sky; you fly toward it and never arrive; the mountains crawl below
   like insects. Slow planetary rotation, ring shadows sweeping the terrain.
2. **Deep Time** — flight over continent-scale ruins: broken arches kilometers
   wide, half-buried colossi, everything eroded and silent.
3. **Cathedral Canyon** — between cliffs a kilometer high, shafts of light
   falling from an unseen sky; the camera is tiny.
4. **The Eye** — a planet-scale storm turning slowly below you, lightning
   flickering deep in its clouds.
5. **Tide of Worlds** — moons and planets rise in sequence on the horizon,
   each one bigger than the last.
6. **The Waterfall** — a falls of light wider than the horizon pouring from
   the sky into glowing mist.

### Name candidates
TITAN · COLOSSUS · THE VAST · LEVIATHAN · MAJESTY · SUBLIME

---

## WORLD IV — YEARNING

**What yearning is:** desire for the absent. Sweet melancholy. Reaching for
something just out of grasp — the ache is the point.

**What builds it:** distance that never closes, a single warm point in cool
darkness, things receding, empty spaces that imply people, dusk/twilight
palette (day ending = loss), slow cyclical motion, solitary figures.

### Animation concepts
1. **The Distant Light** — one warm light on the horizon; you drift toward it
   and it never gets closer. Cool dark world, faint grid fading into fog.
2. **The Figure** — a lone distant silhouette (a walker? a ship? a bird) always
   ahead at the same distance, moving when you move, never nearer.
3. **Tide** — slow luminous waves wash toward you and recede, each one carrying
   motes of light away. Cyclical, gentle loss.
4. **The Empty City** — drift through vast quiet architecture; thousands of lit
   windows, no one home; fog between the towers.
5. **Embers Away** — small lights detach near the camera and drift away into
   the dark one by one, like messages sent and never answered.
6. **Dusk** — the world is in permanent sunset: long shadows, amber and violet,
   everything slow. Nothing happens fast.

### Name candidates
SAUDADE · HIRAETH · DUSK · THE DISTANCE · LONGING · FERNWEH

---

## Recommended picks (to react to)

| # | Emotion  | Concept             | Name      | Why                                            |
|---|----------|---------------------|-----------|------------------------------------------------|
| I | rapture  | Ascension           | ASCENSION | Evolves what he already loves (nebula+touch);  |
|   |          |                     |           | lift + brightening core = being taken          |
| II| ecstasy  | The Drop            | PULSE     | Gives the 24s visit a musical arc; the warp    |
|   |          |                     |           | becomes the release                            |
| III| awe     | The Looming         | TITAN     | Saturn already looms — push it until it's      |
|   |          |                     |           | half the sky                                   |
| IV| yearning | The Distant Light   | SAUDADE   | Simplest, strongest: one warm light that never |
|   |          |                     |           | gets closer; the grid becomes the void around it|

*SAUDADE* (Portuguese: the presence of absence) and *HIRAETH* (Welsh:
homesickness for a home you cannot return to) are the two best yearning-words
in any language — worth considering even if the final name is English.

---

## Transitions: one continuous voyage

**Decision: the four worlds are not four scenes — they are four regions of one
unbroken forward flight.** The camera never cuts. It flies forward for ~2
minutes per loop, and the universe morphs around it. Tap = surge forward
(fast-forward through the current region), not a scene change.

**Why this is right:** the brief was always "travelling to a different world."
Warp-cuts feel like switching channels; continuous flight feels like a journey.
And the emotion order turns out to be an arc: rapture (being taken up) →
ecstasy (peak intensity) → awe (the vast comedown) → yearning (quiet
melancholic landing). Dawn → blaze → sublime → dusk.

**The loop closes:** the distant light of yearning that never gets closer —
flown into, it whiteouts and you are reborn inside the nebula's bright heart.
An ouroboros. The unreachable light IS rapture's bloom.

### The four passages (transitions are flown, not cut)
1. **Rapture → Ecstasy: IGNITION.** You fly *into* the nebula's bright heart.
   The whiteout is the drop — you burst out the other side into pulsing
   geometric space at full intensity.
2. **Ecstasy → Awe: THE COMEDOWN.** The final pulse blows the geometry apart
   into light-streaks; they fall behind you; silence; open space — and Saturn
   rises over the horizon, impossibly large.
3. **Awe → Yearning: THE DIMMING.** You climb away from the mountains; Saturn
   sinks behind you; the sky darkens by degrees until one warm light remains.
4. **Yearning → Rapture: SURRENDER.** You give up chasing and fly *into* the
   distant light — whiteout — and open your eyes inside the cloud.

### Implementation notes
- Worlds are zones along the flight axis; fog color, sky, and lighting
  crossfade between zones as the camera approaches a boundary.
- Each zone's content recycles within its zone; visibility toggles by camera
  position (cheap distance checks), so only nearby work renders.
- Region labels + progress dots remain, now tracking position along the voyage.
- Surge (tap) accelerates the camera rather than cutting the scene; the
  hyperspace streaks become a speed effect inside the continuous world.

---

## The four acts (2:00 loop, ~30s each at cruise speed)

### Interaction model
- **Drag** — look around (clamped; never faces the void).
- **Pinch** — zoom in/out.
- **Hold (press and hold still)** — the voyage accelerates; the world rushes
  past. Release to return to cruise.
- **Tap** — skip ahead a few seconds of flight with a quick streak-burst.
  Distinct from hold: tap = skip, hold = fast cruise.

### The choice (climax selection)
At the climax there are no buttons, no UI. The choice is made the way choices
are made in a world: with attention.
- In Act IV's final passage, time dilates — the flight slows, the fog stills.
  Three lights resolve in space: the giant's **open hand** below (the
  Offering), its **eyes** above (the Look), the **pure light** ahead (the
  Becoming). Each pulses gently, inviting — no labels, no hints.
- **You choose by looking.** Drag to turn toward one and hold your gaze on it
  (~2 seconds), or reach out and touch it directly. The world reads your
  attention and flies you to it. Intention, not interface.
- **Not choosing is also a choice.** If the moment passes, the world decides
  for you — the giant kneels and offers (default: the Offering). Surrender as
  the fallback is poetically correct.
- **The choice echoes.** Each ending tints the next loop's Act I: the
  Offering leaves the cloud warm gold; the Look leaves it violet and watchful;
  the Becoming leaves it white and weightless. Your decision changes the
  world you wake up in.

### ACT I — RAPTURE · "Ascension" (0:00–0:30)
Open on darkness. The cloud resolves around you — the nebula, but the camera
is *rising* through it, not just drifting. Luminous strata pass below like
dawn breaking under you; each layer is brighter and warmer than the last.
Touch still stirs the vortex — now it reads as the cloud responding to being
touched, gathering into a warm swirling heart ahead of you: a white-gold core
that grows as the act builds.
**→ IGNITION (transition):** you fly *into* the heart. The screen goes
white-gold; the nebula streaks past the camera — and the whiteout *is* the
drop into Act II. No cut; you burst out the other side.

### ACT II — ECSTASY · "Pulse" (0:30–1:00)
You erupt from the whiteout into pulsing geometric space at full intensity.
Crystalline forms beat at ~120bpm; every beat fires a shockwave ring and the
camera weaves through them. Color cycles saturated — teal, magenta, gold.
Across the act the tempo and density ramp: more forms, tighter weaves, harder
beats. Holding here is flying *through* the pulse-field at speed.
**→ THE COMEDOWN (transition):** the final beat is enormous — a shockwave that
blows the geometry apart into light-streaks. They fall behind you. Sudden
silence, sudden stillness, darkness — and then Saturn rises over the horizon,
impossibly large. The loudest moment becomes the quietest.

### ACT III — AWE · "Titan" (1:00–1:30)
Black sky, stars, and Saturn filling a third of the heavens, rings catching
the light, rotating with glacial slowness. The camera descends toward mountain
ridges crawling far below and flies low over glowing crests while ring-shadows
sweep the terrain. Everything here moves *slow* — the contrast with Act II's
frenzy is what makes it awesome. Scale does the work: you are tiny.
**→ THE DIMMING (transition):** the camera climbs. The mountains fall away
below; Saturn sinks behind you; the sky darkens by degrees; the stars thin
out — until one warm light remains, alone ahead.

### ACT IV — YEARNING · "Saudade" (1:30–2:00)
Dark void. Faint grid or drifting motes. The distant light, always the same
distance no matter how you fly. The slowest pace of the loop — after awe's
vastness, this is intimacy: one light, endless dark. Touching gathers motes
toward it, but it never nears. Optionally, a lone silhouette crosses far ahead
mid-act — there, then gone.
**→ SURRENDER (transition):** in the final seconds the chase ends — not by
arriving, but by giving in. The camera drifts *into* the light; whiteout; and
you open your eyes inside the cloud. The unreachable light was rapture's heart
all along. The loop closes.
