/* Node verification for the Flipside v2 pair-glyph engine. */
'use strict';
const A = require('./src/ambigram.js');

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('FAIL:', name, extra || ''); }
}
function ptKey(p) { return Math.round(p[0] * 1e6) + ',' + Math.round(p[1] * 1e6); }
function strokeSet(strokes) {
  // order-insensitive set of points (rounded) — structural equality
  const s = new Set();
  strokes.forEach(st => st.forEach(p => s.add(ptKey(p))));
  return s;
}
function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const k of a) if (!b.has(k)) return false;
  return true;
}

/* 1. skeleton sanity ------------------------------------------------------ */
const letters = 'abcdefghijklmnopqrstuvwxyz';
ok(Object.keys(A.SKELETONS).length === 26, 'skeleton count is 26');
let skelOk = true, skelMsg = '';
for (const ch of letters) {
  const sk = A.SKELETONS[ch];
  if (!sk || !sk.length) { skelOk = false; skelMsg = ch + ' empty'; break; }
  for (const st of sk) {
    if (!st || st.length < 2) { skelOk = false; skelMsg = ch + ' stroke<2pts'; break; }
    for (const p of st) {
      if (!isFinite(p[0]) || !isFinite(p[1]) || p[0] < -30 || p[0] > 130 || p[1] < -30 || p[1] > 170) {
        skelOk = false; skelMsg = ch + ' bad coord ' + p; break;
      }
    }
  }
}
ok(skelOk, 'all skeletons sane', skelMsg);

/* i/i tittle symmetry: top tittle R-maps exactly onto bottom tittle */
(function () {
  const tits = A.SKELETONS.i.slice(1); // two diamond strokes
  ok(tits.length === 2, 'i has two tittles');
  ok(setsEqual(strokeSet([tits[0]]), strokeSet([A.rStroke(tits[1])])), 'i tittles are R-pairs');
  ok(setsEqual(strokeSet([tits[1]]), strokeSet([A.rStroke(tits[0])])), 'i tittles R-symmetric');
})();

/* 2. pair table: R(glyph(A,B)) structurally equals glyph(B,A) ---------------- */
let pairOk = true, pairMsg = '';
for (const [P, Q] of A.PAIRS) {
  const gAB = A.glyphStrokes(P, Q);
  const gBA = A.glyphStrokes(Q, P);
  if (!gAB.ok || !gBA.ok) { pairOk = false; pairMsg = P + ',' + Q + ' lookup failed'; break; }
  if (!setsEqual(strokeSet(A.rStrokes(gAB.strokes)), strokeSet(gBA.strokes))) {
    pairOk = false; pairMsg = P + ',' + Q + ' rotation mismatch'; break;
  }
  if (!gAB.strokes.length) { pairOk = false; pairMsg = P + ',' + Q + ' empty'; break; }
}
ok(pairOk, 'pair table rotation-consistent for all ' + A.PAIRS.length + ' pairs', pairMsg);

/* unmappable letters honestly reported */
for (const ch of ['c', 'k', 'r', 'v']) {
  ok(!A.lookupPair(ch, ch), ch + ' has no self pair');
  ok(!A.lookupPair('a', ch), 'a>' + ch + ' unmappable');
}
ok(A.lookupPair('m', 'w') && !A.lookupPair('m', 'w').reversed, 'm>w canonical');
ok(A.lookupPair('w', 'm').reversed, 'w>m reversed');

/* 3. gallery words: full word rotation reads the expected word ---------------- */
const GALLERY = [
  { w: 'swims' }, { w: 'suns' }, { w: 'pod' }, { w: 'dollop' }, { w: 'yeah' },
  { w: 'passed' }, { w: 'sos' }, { w: 'dip' }, { w: 'mow' }, { w: 'lol' },
  { w: 'wow', w2: 'mom' }, { w: 'pip', w2: 'did' }, { w: 'uns', w2: 'sun' },
];
function wordPtKey(p) { return ptKey(p); }
function rotWordPt(p, W) { return [W - p[0], 140 - p[1]]; }
let galOk = true, galMsg = '';
for (const g of GALLERY) {
  const w2 = g.w2 || g.w;
  if (g.w2 && g.w2.length !== g.w.length) { galOk = false; galMsg = g.w + ' hetero length'; break; }
  const lay = A.layoutWord(g.w, w2);
  if (!lay.ok) { galOk = false; galMsg = g.w + ' issues: ' + JSON.stringify(lay.issues); break; }
  // rotate every stroke point 180 about word center; group by resulting glyph index
  const n = lay.n, W = lay.width, cw = 100 + lay.tracking;
  const rotated = A.wordStrokes(lay).map(s => ({
    glyph: s.glyph,
    pts: s.pts.map(p => rotWordPt(p, W)),
  }));
  for (let j = 0; j < n; j++) {
    const i = n - 1 - j; // source position
    const got = new Set();
    rotated.filter(s => s.glyph === i).forEach(s => s.pts.forEach(p => got.add(wordPtKey(p))));
    const exp = A.glyphStrokes(w2[j], g.w[n - 1 - j]);
    const want = new Set();
    exp.strokes.forEach(st => st.forEach((p, k) => want.add(wordPtKey([p[0] + j * cw, p[1]]))));
    if (!setsEqual(got, want)) { galOk = false; galMsg = g.w + ' pos ' + j; break; }
  }
  if (!galOk) break;
}
ok(galOk, 'all ' + GALLERY.length + ' gallery words rotate to expected reading', galMsg);

/* 4. overlay pivot == flip pivot (v1 regression): for self-pair word, rotated
 *    overlay strokes coincide with base strokes */
(function () {
  const lay = A.layoutWord('sos', 'sos');
  const piv = A.wordPivot(lay);
  const base = A.wordStrokes(lay);
  const over = base.map(s => ({ pts: s.pts.map(p => [2 * piv[0] - p[0], 2 * piv[1] - p[1]]) }));
  const bset = new Set(), oset = new Set();
  base.forEach(s => s.pts.forEach(p => bset.add(ptKey(p))));
  over.forEach(s => s.pts.forEach(p => oset.add(ptKey(p))));
  ok(setsEqual(bset, oset), 'overlay rotated strokes coincide with base (self-pair word)');
  // and the pivot used by renderWordSVG is wordPivot
  const svg = A.renderWordSVG(lay, { overlay: { on: true, opacity: 40 } });
  ok(svg.includes('rotate(180 ' + (Math.round(piv[0] * 10) / 10) + ' 70)'), 'svg overlay uses wordPivot');
})();

/* 5. SVG sanity for every gallery word */
let svgOk = true, svgMsg = '';
for (const g of GALLERY) {
  const lay = A.layoutWord(g.w, g.w2 || g.w);
  const svg = A.renderWordSVG(lay, { overlay: { on: true, opacity: 40 },
    guides: { center: true, pivot: true, grid: true } });
  if (!svg.includes('<svg') || !svg.includes('<path d="M') || svg.includes('NaN') ||
      !svg.includes('viewBox="0 0 ' + Math.round(lay.width * 10) / 10 + ' 140"')) {
    svgOk = false; svgMsg = g.w; break;
  }
  const paths = (svg.match(/<path /g) || []).length;
  const minPaths = lay.glyphs.reduce((a, gl) => a + gl.strokes.length, 0);
  if (paths < minPaths) { svgOk = false; svgMsg = g.w + ' path count ' + paths + '<' + minPaths; break; }
}
ok(svgOk, 'svg sane for all gallery words', svgMsg);

/* 6. bad-word honesty: unmappable positions flagged, mappable still render */
(function () {
  const lay = A.layoutWord('crack', 'crack');
  ok(!lay.ok && lay.issues.length > 0, 'crack flagged unmappable');
  const badIdx = lay.issues.map(x => x.index);
  ok(badIdx.includes(0) && badIdx.includes(2), 'crack: c,r flagged, got ' + JSON.stringify(lay.issues));
  const lay2 = A.layoutWord('swims', 'swims');
  ok(lay2.ok && lay2.issues.length === 0, 'swims fully mappable');
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
