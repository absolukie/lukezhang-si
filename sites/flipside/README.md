# Flipside — true rotational ambigram studio

v2: a **real ambigram generator** using the classic pair-glyph technique
(same principle as makeambigrams.com / Ambimatic).

## How it works

1. **Skeletons** — all 26 lowercase letters defined as minimal geometric
   polylines on a 0–100 × 0–140 grid (`src/ambigram.js`).
2. **Pair table** — self-pairs `o s x z i l h g`; cross-pairs
   `m↔w n↔u d↔p b↔q e↔a h↔y i↔t f↔j`.
3. **Glyph construction** — `glyph(A,B) = skeleton(A) ∪ rot180(skeleton(B))`,
   drawn as thick round-cap strokes. Upright it reads as A; rotated 180°
   the same strokes read as B. The merged-stroke look is the authentic
   ambigram-generator aesthetic.
4. **Word rendering** — position `i` reads `w[i]` upright and `w2[n-1-i]`
   rotated (default `w2 = w`; hetero mode takes two same-length words).
5. **Honesty** — `c k r v` have no rotational partner. Unmappable positions
   are drawn dimmed with a dashed outline and listed exactly; nothing is faked.

## Verified in Node (no browser on this VM)

- `node test.js` — 23 checks: skeleton sanity, i-tittle R-symmetry,
  pair-table rotation consistency (`R(glyph(A,B)) == glyph(B,A)` for all 16 pairs),
  full-word rotation reads for all 13 gallery words, overlay-pivot == flip-pivot
  (v1 overlay-misalignment regression test), SVG sanity per gallery word,
  bad-word honesty.
- `node smoke.js` — 20 checks: DOM-stub app boot, render, flip, overlay,
  glyph tap-select, nudge, hetero mode, gallery, guides, tracking.

## Layout

- `src/ambigram.js` — pure pair-glyph engine (UMD, Node + browser)
- `src/app.js` — DOM wiring (`FlipsideApp.init(doc)`)
- `src/page.html` — page template
- `build.js` — inlines engine+app into single self-contained `dist/index.html`
- `test.js`, `smoke.js` — Node verification

## Deploy

Push `dist/index.html` (+ this README) to `absolukie/flipside` via
`~/workspace/skills/github/bin/gh_push.py --repo flipside --dir <tree>`.
The Cloudflare Pages project auto-redeploys from `main`.

## Honest caveat

The geometry is machine-verified, but no human eye has judged whether the
merged glyphs read *beautifully*. That's the user's call on the live site:
https://flipside-3mr.pages.dev
