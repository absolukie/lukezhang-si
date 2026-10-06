/* Solver + structure test for Birds of a Feather content.
 * Proves every level (1-200) and a sample of daily seeds has a unique
 * solution deducible by quota elimination, and that level structure
 * invariants hold. Run: node test/levels.test.js
 */
'use strict';
const started = Date.now();
const C = require('../content.js');
const crypto = require('crypto');

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.error('FAIL:', msg); }
}

function ambiguousCount(lv) {
  let n = 0;
  lv.flocks.forEach(f => f.cards.forEach(c => { if (c.cands.length > 1) n++; }));
  return n;
}

function checkLevel(lv, tag) {
  // --- structure invariants ---
  const names = lv.flocks.map(f => f.name);
  check(lv.flocks.length === 4, tag + ': must have 4 flocks');
  check(new Set(names).size === 4, tag + ': flock names must be distinct');
  check(lv.feathers >= 3 && lv.feathers <= 5, tag + ': feathers ' + lv.feathers);
  const seen = {};
  let total = 0;
  lv.flocks.forEach(f => {
    check(f.cards.length >= 2 && f.cards.length <= 8,
      tag + ': flock ' + f.name + ' quota ' + f.cards.length);
    total += f.cards.length;
    f.cards.forEach(c => {
      check(!seen[c.w], tag + ': duplicate word ' + c.w);
      seen[c.w] = true;
      check(c.cands.indexOf(f.name) !== -1, tag + ': ' + c.w + ' cands missing home');
      check(c.cands.length >= 1 && c.cands.length <= 3 &&
        new Set(c.cands).size === c.cands.length, tag + ': invalid candidates for ' + c.w);
      c.cands.forEach(cn => check(names.indexOf(cn) !== -1,
        tag + ': ' + c.w + ' alternate flock ' + cn + ' not in level'));
      if (c.cands.length > 1) {
        const entry = C.POOLS[f.name].find(e => Array.isArray(e) && e[0] === c.w);
        // Hand-authored levels stand alone; only verify pool consistency when
        // the word is still in the pool (pools are curated independently).
        check(!entry || JSON.stringify(c.cands) === JSON.stringify([f.name].concat(entry[1])),
          tag + ': ' + c.w + ' must retain all pool alternates');
      }
    });
  });
  check(total >= 8 && total <= 25, tag + ': total cards ' + total);
  // --- solver: unique deducible solution matching intended homes ---
  const s = C.solveLevel(lv);
  check(s.ok, tag + ': solver failed: ' + (s.reason || '') + ' ' + (s.unassigned || []).join(','));
  if (s.ok) check(s.mismatched.length === 0, tag + ': mismatched: ' + s.mismatched.join(','));
  return total;
}

// New pools must add original vocabulary without duplicating any earlier entry.
check(C.THEME_NAMES.length === 31, 'must have 24 original pools plus 7 new pools');
const poolWords = new Set();
C.THEME_NAMES.forEach((theme, index) => {
  const pool = C.POOLS[theme];
  if (index >= 24) {
    check(pool.length >= 12 && pool.length <= 18, theme + ': pool size ' + pool.length);
    check(pool.filter(Array.isArray).length >= 2, theme + ': needs at least two ambiguous words');
  }
  pool.forEach(entry => {
    const word = typeof entry === 'string' ? entry : entry[0];
    if (index >= 24) {
      check(/^[a-z]+$/.test(word), theme + ': word must be single and lowercase: ' + word);
      check(!poolWords.has(word), theme + ': duplicate pool word ' + word);
      if (Array.isArray(entry)) {
        const also = [].concat(entry[1]);
        check(also.length >= 1 && also.length <= 2 && new Set(also).size === also.length,
          theme + ': invalid alternates for ' + word);
        also.forEach(other => check(other !== theme && C.THEME_NAMES.includes(other),
          theme + ': invalid alternate ' + other + ' for ' + word));
      }
    }
    poolWords.add(word);
  });
});

const bands = [[61, 80], [81, 120], [121, 160], [161, 200]].map(([lo, hi]) =>
  ({ lo, hi, cards: 0, ambiguous: 0, feathers: new Set() }));
const legacyLevels = [];
const newThemesSeen = new Set();
let endgameTriples = 0;
for (let n = 1; n <= 200; n++) {
  const lv = C.getLevel(n);
  const tag = 'level ' + n + ' (' + lv.name + ')';
  const total = checkLevel(lv, tag);
  check(JSON.stringify(lv) === JSON.stringify(C.getLevel(n)), tag + ': not deterministic');
  if (n <= 60) legacyLevels.push(lv);
  if (n >= 61) {
    const band = bands.find(b => n >= b.lo && n <= b.hi);
    band.cards += total;
    band.ambiguous += ambiguousCount(lv);
    band.feathers.add(lv.feathers);
    const t2 = n <= 80 ? 0.35 + (n - 61) / 19 * 0.25 :
      n <= 120 ? 0.60 + (n - 81) / 39 * 0.30 :
      n <= 160 ? 0.90 + (n - 121) / 39 * 0.20 : 1.10 + (n - 161) / 39 * 0.40;
    check(total === Math.min(25, Math.round(16 + t2 * 9)), tag + ': wrong card target');
    check(lv.feathers === (n <= 80 ? 4 : 3), tag + ': wrong feathers for band');
    check(ambiguousCount(lv) <= Math.round(1 + t2 * 6), tag + ': exceeded ambiguous budget');
    const triples = C.allCards(lv).filter(c => c.cands.length === 3).length;
    const tripleTarget = t2 > 1.1 ? 1 + Math.round((t2 - 1.1) * 3) : 0;
    check(triples <= tripleTarget, tag + ': exceeded triple budget');
    endgameTriples += triples;
    lv.flocks.forEach(f => { if (C.THEME_NAMES.indexOf(f.name) >= 24) newThemesSeen.add(f.name); });
  }
  if (n === 1) console.log('L1 :', total, 'cards,', ambiguousCount(lv), 'ambiguous,', lv.feathers, 'feathers');
  if (n === 15) console.log('L15:', total, 'cards,', ambiguousCount(lv), 'ambiguous,', lv.feathers, 'feathers');
  if (n === 60) console.log('L60:', total, 'cards,', ambiguousCount(lv), 'ambiguous,', lv.feathers, 'feathers');
}
check(endgameTriples > 0, 'endgame must actually include three-flock cards');
check(newThemesSeen.size === 7, 'campaign must feature all seven new themes');

// teaching progression markers on hand levels
const l1 = C.getLevel(1), l6 = C.getLevel(6), l7 = C.getLevel(7);
check(ambiguousCount(l1) === 0, 'L1 should have zero ambiguous words');
check(ambiguousCount(l6) === 1, 'L6 should introduce exactly one ambiguous word');
check(ambiguousCount(l7) === 2, 'L7 should have two ambiguous words');

// daily seeds: 90 consecutive days
let dailyAmb = 0;
const dailyLevels = [];
for (let d = 0; d < 90; d++) {
  const dt = new Date(Date.UTC(2026, 9, 4 + d));
  const ds = dt.toISOString().slice(0, 10);
  const lv = C.dailyLevel(ds);
  checkLevel(lv, 'daily ' + ds);
  check(JSON.stringify(lv) === JSON.stringify(C.dailyLevel(ds)), 'daily ' + ds + ' not deterministic');
  dailyLevels.push(lv);
  dailyAmb += ambiguousCount(lv);
}
console.log('daily sample: 90 seeds, avg ambiguous', (dailyAmb / 90).toFixed(2));

// determinism: same level twice must be identical
const a = JSON.stringify(C.getLevel(42)), b = JSON.stringify(C.getLevel(42));
check(a === b, 'level 42 not deterministic');
const da = JSON.stringify(C.dailyLevel('2026-10-04')), db = JSON.stringify(C.dailyLevel('2026-10-04'));
check(da === db, 'daily seed not deterministic');

// SHA-256 snapshots captured after the 2026-10-04 semantic-review pool curation
// (10 new themes added; Footwear merged into Clothes, Sweets into Desserts,
// Fish folded into Sea; unfair/stretch words removed from legacy pools).
// Hand levels 1-15 are byte-identical to the original engine.
function digest(levels) {
  return crypto.createHash('sha256').update(JSON.stringify(levels)).digest('hex');
}
check(digest(legacyLevels) === '682d404a51dee86318e56d3dcf6ec6b8493c6df1f825ec7e32a0285fcdd496dd',
  'levels 1-60 changed from original output');
check(digest(dailyLevels) === 'c1eec0b45d0791fb2d90d6c3426a5b8292990ad09adb3419086c79f506544467',
  'daily sample changed from original output');

// par.js: A*-proved optima (tools/prove-par.js). The cert digest pins the
// exact content.js the optima were proved against — any content.js edit
// (even an additive one) forces re-running tools/prove-par.js.
global.window = {};
require('../par.js');
const fs = require('fs');
const path = require('path');
const contentDigest = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(__dirname, '..', 'content.js')))
  .digest('hex');
check(window.BoFParCert && window.BoFParCert.digest === contentDigest,
  'par.js cert digest ' + (window.BoFParCert && window.BoFParCert.digest) +
  ' does not match content.js ' + contentDigest + ' — re-run node tools/prove-par.js');
for (let n = 1; n <= 200; n++) {
  const N = C.allCards(C.getLevel(n)).length;
  const expected = N + Math.max(0, N - 15);
  check(window.BoFPar[n] === expected,
    'par for level ' + n + ': got ' + window.BoFPar[n] + ', expected ' + expected);
}
// parFor must serve the proved optima for campaign levels and the
// closed form elsewhere.
const savedPar = global.window.BoFPar;
check(C.parFor(C.getLevel(7), 7) === savedPar[7],
  'parFor must return window.BoFPar[id] for levels 1-200');
global.window = {};
check(C.parFor(C.getLevel(7), 7) === C.allCards(C.getLevel(7)).length,
  'parFor falls back to closed form without window.BoFPar');
check(C.parFor(C.dailyLevel('2026-10-04'), 'daily:2026-10-04') ===
  C.allCards(C.dailyLevel('2026-10-04')).length + Math.max(0, C.allCards(C.dailyLevel('2026-10-04')).length - 15),
  'parFor closed form for daily levels');

bands.forEach((band, index) => {
  const count = band.hi - band.lo + 1;
  const avgCards = band.cards / count;
  const avgAmbiguous = band.ambiguous / count;
  if (index > 0) {
    const prev = bands[index - 1], prevCount = prev.hi - prev.lo + 1;
    check(avgCards > prev.cards / prevCount, 'average cards must increase at band ' + band.lo);
    check(avgAmbiguous > prev.ambiguous / prevCount, 'average ambiguity must increase at band ' + band.lo);
  }
  console.log('L' + band.lo + '-' + band.hi + ': avg cards ' + avgCards.toFixed(2) +
    ', avg ambiguous ' + avgAmbiguous.toFixed(2) + ', feathers ' + [...band.feathers].join('/'));
});
console.log('Endgame three-flock cards:', endgameTriples);
console.log('Total runtime:', ((Date.now() - started) / 1000).toFixed(3) + 's');
if (failures) { console.error('\n' + failures + ' FAILURES'); process.exit(1); }
console.log('\nAll 200 levels + 90 daily seeds: unique deducible solutions. PASS (0 failures)');
