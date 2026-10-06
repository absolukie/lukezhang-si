/* ambigram.js — true rotational ambigram pair-glyph engine (v2).
 * Pure logic, no DOM. UMD: works in Node (module.exports) and browsers (window.Ambigram).
 *
 * Grid: x 0..100, y 0..140 per glyph. Zones (symmetric about y=70):
 *   ascender top 20, x-height top 45, baseline 95, descender bottom 120.
 * R = 180-degree rotation about glyph center (50,70): (x,y) -> (100-x, 140-y).
 *
 * Pair-glyph construction: glyph(A,B) = skeleton(A) UNION R(skeleton(B)).
 * Upright it reads as A; rotated 180 it reads as B. The merged-stroke look
 * is the authentic ambigram-generator aesthetic (cf. makeambigrams.com).
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Ambigram = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GW = 100, GH = 140, CX = 50, CY = 70;
  var TRACKING = 30;      // default space between glyph cells
  var STROKE_W = 14;      // stroke width in glyph units

  function Rx(x) { return GW - x; }
  function Ry(y) { return GH - y; }
  function rPt(p) { return [Rx(p[0]), Ry(p[1])]; }
  function rStroke(st) { return st.map(rPt); }          // new array, no mutation
  function rStrokes(strokes) { return strokes.map(rStroke); }

  function dia(cx, cy, r) {                            // closed diamond polyline
    return [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy], [cx, cy - r]];
  }
  function ellipse(cx, cy, rx, ry, n) {
    var pts = [], i, a;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    pts.push(pts[0].slice());
    return pts;
  }

  /* ---------------- skeletons: letter -> array of strokes -> array of [x,y] ---- */
  var S = {};
  S.a = [[[66,45],[66,95]], [[66,67],[48,59],[30,69],[30,87],[46,95],[66,89]]];
  S.b = [[[34,20],[34,95]], [[34,63],[50,53],[64,63],[64,85],[50,95],[34,87]]];
  S.c = [[[68,53],[48,45],[30,57],[30,83],[48,95],[68,87]]];
  S.d = [[[66,20],[66,95]], [[66,63],[50,53],[36,63],[36,85],[50,95],[66,87]]];
  S.e = [[[68,55],[46,47],[30,59],[30,81],[48,93],[68,85]], [[34,71],[62,71]]];
  S.f = [[[55,28],[55,95]], [[36,55],[68,55]], [[55,28],[44,34]]];
  S.g = [[[30,57],[30,83],[50,93],[70,83],[70,57],[50,47],[30,57]], [[62,81],[62,120],[44,120]]];
  S.h = [[[32,20],[32,95]], [[32,57],[46,47],[60,57],[60,95]]];
  S.i = [[[50,47],[50,95]], dia(50,28,7), rStroke(dia(50,28,7))];
  S.j = [[[56,47],[56,105],[48,118],[34,118]], dia(56,28,7)];
  S.k = [[[32,20],[32,95]], [[62,47],[40,67],[34,73]], [[46,65],[64,95]]];
  S.l = [[[50,20],[50,95]], [[50,95],[64,95]]];
  S.m = [[[22,95],[22,47],[36,47],[50,61],[64,47],[78,47],[78,95]]];
  S.n = [[[28,95],[28,47],[44,47],[60,61],[60,95]]];
  S.o = [ellipse(50,70,28,25,14)];
  S.p = [[[34,45],[34,120]], [[34,63],[50,53],[64,63],[64,85],[50,95],[34,87]]];
  S.q = [[[66,45],[66,120]], [[66,63],[50,53],[36,63],[36,85],[50,95],[66,87]]];
  S.r = [[[32,47],[32,95]], [[32,57],[48,47],[60,55]]];
  S.s = [[[70,49],[44,49],[32,61],[50,70],[68,79],[56,91],[30,91]]];
  S.t = [[[50,28],[50,95]], [[32,53],[68,53]]];
  S.u = [[[28,47],[28,81],[42,95],[58,95],[72,81],[72,47]]];
  S.v = [[[28,47],[50,95],[72,47]]];
  S.w = [[[20,47],[32,95],[50,61],[68,95],[80,47]]];
  S.x = [[[32,47],[68,95]], [[68,47],[32,95]]];
  S.y = [[[26,47],[48,89],[40,120]], [[70,47],[48,89]]];
  S.z = [[[30,47],[70,47],[30,93],[70,93]]];

  /* ---------------- rotational pair table (canonical ordered pairs) ------------ */
  var PAIRS = [
    ['o','o'],['s','s'],['x','x'],['z','z'],['i','i'],['l','l'],['h','h'],['g','g'],
    ['m','w'],['n','u'],['d','p'],['b','q'],['e','a'],['h','y'],['i','t'],['f','j']
  ];
  var pairIndex = {};
  PAIRS.forEach(function (pr) {
    pairIndex[pr[0] + '>' + pr[1]] = { A: pr[0], B: pr[1], reversed: false };
    if (pr[0] !== pr[1]) pairIndex[pr[1] + '>' + pr[0]] = { A: pr[0], B: pr[1], reversed: true };
  });
  function lookupPair(a, b) { return pairIndex[a + '>' + b] || null; }

  /* glyph(A,B): strokes reading A upright, B rotated 180. */
  function glyphStrokes(a, b) {
    var e = lookupPair(a, b);
    if (!e) {
      // honest fallback: upright skeleton only, flagged unmappable
      return { strokes: S[a] ? S[a].map(function (st) { return st.slice(); }) : [],
               ok: false, upright: a, rotated: b };
    }
    var base = S[e.A].concat(rStrokes(S[e.B]));
    if (e.reversed) base = rStrokes(base);
    return { strokes: base, ok: true, upright: a, rotated: b,
             canonical: [e.A, e.B], reversed: e.reversed };
  }

  /* ---------------- word layout ------------------------------------------------ */
  function layoutWord(w, w2, tracking) {
    w = (w || '').toLowerCase();
    w2 = (w2 == null ? w : (w2 || '')).toLowerCase();
    var t = (tracking == null ? TRACKING : tracking);
    var n = w.length, glyphs = [], issues = [], i, a, b, g;
    for (i = 0; i < n; i++) {
      a = w[i];
      b = w2[n - 1 - i] || '';
      g = glyphStrokes(a, b);
      if (!g.ok) issues.push({ index: i, upright: a, rotated: b });
      glyphs.push({ index: i, upright: a, rotated: b, strokes: g.strokes,
                    ok: g.ok, dx: i * (GW + t) });
    }
    return { word: w, word2: w2, n: n, tracking: t, glyphs: glyphs,
             issues: issues, width: n * GW + Math.max(0, n - 1) * t, ok: issues.length === 0 };
  }

  function wordPivot(layout) { return [layout.width / 2, CY]; }

  /* flat stroke list with glyph offsets applied: [{pts:[[x,y]..], glyph:i}] */
  function wordStrokes(layout) {
    var out = [];
    layout.glyphs.forEach(function (gl, i) {
      gl.strokes.forEach(function (st) {
        out.push({ glyph: i, pts: st.map(function (p) { return [p[0] + gl.dx, p[1]]; }) });
      });
    });
    return out;
  }

  /* ---------------- SVG rendering (pure string building — testable) ------------ */
  function r1(v) { return Math.round(v * 10) / 10; }
  function strokeToD(st) {
    return 'M' + st.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]); }).join('L');
  }

  function renderWordSVG(layout, opts) {
    opts = opts || {};
    var ink = opts.ink || '#f2f0ea';
    var dimInk = opts.dimInk || 'rgba(242,240,234,.38)';
    var sw = opts.strokeWidth || STROKE_W;
    var nudge = opts.nudge || {};
    var selected = (opts.selected == null ? -1 : opts.selected);
    var showBad = opts.markBad !== false;
    var W = layout.width, H = GH;
    var piv = wordPivot(layout);

    function glyphInner(gl) {
      var nd = nudge[gl.index] || { dx: 0, dy: 0, rot: 0 };
      var tr = 'translate(' + r1(gl.dx + nd.dx) + ' ' + r1(nd.dy) + ')';
      if (nd.rot) tr += ' rotate(' + r1(nd.rot) + ' ' + CX + ' ' + CY + ')';
      var color = gl.ok ? ink : dimInk;
      var s = '<g class="glyph" data-i="' + gl.index + '" transform="' + tr + '">';
      if (!gl.ok && showBad) {
        s += '<rect x="6" y="6" width="' + (GW - 12) + '" height="' + (GH - 12) +
             '" rx="12" fill="none" stroke="#ff6b6b" stroke-width="2.5" stroke-dasharray="8 7" opacity="0.9"/>';
      }
      s += '<g fill="none" stroke="' + color + '" stroke-width="' + sw +
           '" stroke-linecap="round" stroke-linejoin="round">';
      gl.strokes.forEach(function (st) { s += '<path d="' + strokeToD(st) + '"/>'; });
      s += '</g></g>';
      return s;
    }

    var inner = layout.glyphs.map(glyphInner).join('');

    // overlay: the SAME word group, rotated 180 about the SAME pivot the flip uses
    var overlay = '';
    if (opts.overlay && opts.overlay.on) {
      var op = (opts.overlay.opacity == null ? 45 : opts.overlay.opacity);
      overlay = '<g id="overlayLayer" transform="rotate(180 ' + r1(piv[0]) + ' ' + r1(piv[1]) +
                ')" opacity="' + (op / 100) + '">' + inner + '</g>';
    }

    // guides
    var guides = '';
    if (opts.guides) {
      var gc = 'rgba(215,255,62,.35)';
      if (opts.guides.grid) {
        var gs = '';
        for (var gx = 0; gx <= W; gx += 20) gs += 'M' + gx + ' 0L' + gx + ' ' + H;
        for (var gy = 0; gy <= H; gy += 20) gs += 'M0 ' + gy + 'L' + W + ' ' + gy;
        guides += '<path d="' + gs + '" stroke="rgba(255,255,255,.06)" stroke-width="1" fill="none"/>';
      }
      if (opts.guides.center) {
        guides += '<path d="M' + r1(piv[0]) + ' 0L' + r1(piv[0]) + ' ' + H +
                  'M0 ' + CY + 'L' + W + ' ' + CY + '" stroke="' + gc +
                  '" stroke-width="1.5" stroke-dasharray="7 6" fill="none"/>';
      }
      if (opts.guides.pivot) {
        guides += '<circle cx="' + r1(piv[0]) + '" cy="' + CY + '" r="9" fill="none" stroke="' + gc +
                  '" stroke-width="2"/><path d="M' + r1(piv[0] - 15) + ' ' + CY + 'L' + r1(piv[0] + 15) +
                  ' ' + CY + 'M' + r1(piv[0]) + ' ' + (CY - 15) + 'L' + r1(piv[0]) + ' ' + (CY + 15) +
                  '" stroke="' + gc + '" stroke-width="2" fill="none"/>';
      }
    }

    var sel = '';
    if (selected >= 0 && selected < layout.n) {
      var gx0 = selected * (GW + layout.tracking);
      sel = '<rect x="' + (gx0 + 2) + '" y="2" width="' + (GW - 4) + '" height="' + (GH - 4) +
            '" rx="12" fill="none" stroke="#d7ff3e" stroke-width="2.5" stroke-dasharray="10 7" opacity="0.85"/>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + r1(W) + ' ' + H +
           '" role="img" aria-label="ambigram of ' + layout.word + '">' +
           '<g id="wordBase">' + inner + '</g>' + overlay + guides + sel + '</svg>';
  }

  return {
    GW: GW, GH: GH, CX: CX, CY: CY, TRACKING: TRACKING, STROKE_W: STROKE_W,
    SKELETONS: S, PAIRS: PAIRS,
    lookupPair: lookupPair, glyphStrokes: glyphStrokes,
    layoutWord: layoutWord, wordPivot: wordPivot, wordStrokes: wordStrokes,
    rPt: rPt, rStroke: rStroke, rStrokes: rStrokes,
    strokeToD: strokeToD, renderWordSVG: renderWordSVG
  };
});
