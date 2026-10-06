/* Second Brain — IR engine.
   Real retrieval, in-browser: BM25 keyword scoring, LSA semantic search via
   truncated SVD (power iteration + deflation on the doc-doc Gram matrix),
   hybrid blending, and a second-pass reranker (coverage + proximity + entities).
   No backend, no embeddings API — the math runs here. */
(function () {
"use strict";

var STOP = new Set(("a,an,the,and,or,but,if,then,else,for,to,of,in,on,at,by,with,from,as,is,are,was,were,be,been,being,have,has,had,do,does,did,will,would,can,could,should,may,might,must,shall,i,me,my,we,our,you,your,he,she,it,they,them,his,her,its,their,this,that,these,those,not,no,yes,so,very,just,about,into,over,after,before,between,through,during,up,down,out,off,again,once,here,there,when,where,which,who,whom,how,all,any,both,each,few,more,most,other,some,such,only,own,same,than,too,also,per,via,within,without").split(","));

function stem(w) {
  if (w.length <= 3) return w;
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (/(sses|shes|ches|xes|zes)$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("ly")) w = w.slice(0, -2);
  if (/(tion|sion)$/.test(w) && w.length > 6) w = w.slice(0, -4) + "t";
  return w;
}
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter(function (t) { return t && !STOP.has(t); }).map(stem);
}
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
}

/* ---------------- index ---------------- */
var docs = window.CORPUS;
var N = docs.length;
var t0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
var docTokens = docs.map(function (d) { return tokenize(d.title + " " + d.body); });
var vocab = new Map(), df = new Map();
docTokens.forEach(function (toks) {
  var seen = new Set();
  toks.forEach(function (t) {
    if (!vocab.has(t)) vocab.set(t, vocab.size);
    if (!seen.has(t)) { seen.add(t); df.set(t, (df.get(t) || 0) + 1); }
  });
});
var V = vocab.size;
var idf = new Map();
vocab.forEach(function (idx, t) {
  var dfi = df.get(t) || 1;
  idf.set(t, Math.log((N - dfi + 0.5) / (dfi + 0.5)) + 1);
});
var tf = docTokens.map(function (toks) {
  var m = new Map();
  toks.forEach(function (t) { m.set(t, (m.get(t) || 0) + 1); });
  return m;
});
var docLen = docTokens.map(function (t) { return t.length; });
var avgdl = docLen.reduce(function (a, b) { return a + b; }, 0) / N;

/* doc tf-idf vectors (sparse, keyed by term idx) — the X matrix, terms x docs */
var docTfidf = tf.map(function (m) {
  var v = new Map();
  m.forEach(function (c, t) { v.set(vocab.get(t), (1 + Math.log(c)) * idf.get(t)); });
  return v;
});

function bm25(qTerms, di) {
  var k1 = 1.2, b = 0.75, s = 0, dl = docLen[di], m = tf[di];
  for (var i = 0; i < qTerms.length; i++) {
    var t = qTerms[i], f = m.get(t) || 0;
    if (!f) continue;
    s += (idf.get(t) || 0) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * dl / avgdl));
  }
  return s;
}

/* ---------------- LSA: truncated SVD of the doc-doc Gram matrix ---------------- */
function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
function topEigs(G, k, iters) {
  var n = G.length, A = G.map(function (r) { return r.slice(); });
  var vecs = [], vals = [], seed = 42;
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  for (var c = 0; c < k; c++) {
    var v = new Array(n), i, j, it, p, u;
    for (i = 0; i < n; i++) v[i] = rand() - 0.5;
    var norm = Math.hypot.apply(null, v); for (i = 0; i < n; i++) v[i] /= norm;
    for (it = 0; it < iters; it++) {
      var w = new Array(n).fill(0);
      for (i = 0; i < n; i++) { var s = 0, row = A[i]; for (j = 0; j < n; j++) s += row[j] * v[j]; w[i] = s; }
      for (p = 0; p < 2; p++) for (u = 0; u < vecs.length; u++) {
        var d = dot(w, vecs[u]);
        for (i = 0; i < n; i++) w[i] -= d * vecs[u][i];
      }
      norm = Math.hypot.apply(null, w);
      if (norm < 1e-12) break;
      for (i = 0; i < n; i++) v[i] = w[i] / norm;
    }
    var Av = new Array(n).fill(0);
    for (i = 0; i < n; i++) { var s2 = 0; for (j = 0; j < n; j++) s2 += A[i][j] * v[j]; Av[i] = s2; }
    var lambda = dot(v, Av);
    if (lambda < 1e-9) break;
    vecs.push(v); vals.push(lambda);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) A[i][j] -= lambda * v[i] * v[j];
  }
  return { vecs: vecs, vals: vals };
}

var K = 32, eig = null, docLatent = [];
(function buildLSA() {
  var G = new Array(N);
  for (var g = 0; g < N; g++) G[g] = new Array(N).fill(0);
  for (var i = 0; i < N; i++) {
    for (var j = i; j < N; j++) {
      var a = docTfidf[i], b = docTfidf[j], s = 0;
      if (a.size > b.size) { var t = a; a = b; b = t; }
      a.forEach(function (w, ti) { var w2 = b.get(ti); if (w2) s += w * w2; });
      G[i][j] = G[j][i] = s;
    }
  }
  eig = topEigs(G, K, 250);
  K = eig.vals.length;
  for (var d = 0; d < N; d++) {
    var vec = new Array(K);
    for (var k = 0; k < K; k++) vec[k] = Math.sqrt(eig.vals[k]) * eig.vecs[k][d];
    docLatent.push(vec);
  }
})();

/* fold a query into latent space: q_lat = q^T X V Σ^-2 */
function queryLatent(qTerms) {
  var qtf = new Map();
  qTerms.forEach(function (t) { qtf.set(t, (qtf.get(t) || 0) + 1); });
  var qv = new Map();
  qtf.forEach(function (c, t) {
    if (vocab.has(t)) qv.set(vocab.get(t), (1 + Math.log(c)) * idf.get(t));
  });
  var out = new Array(K).fill(0);
  if (!qv.size || !K) return out;
  for (var k = 0; k < K; k++) {
    var s = 0, vk = eig.vecs[k];
    qv.forEach(function (w, ti) {
      var xv = 0;
      for (var i = 0; i < N; i++) { var dvi = docTfidf[i].get(ti); if (dvi) xv += dvi * vk[i]; }
      s += w * xv;
    });
    out[k] = s / eig.vals[k];
  }
  return out;
}
function cosine(a, b) {
  var d = dot(a, b), na = Math.hypot.apply(null, a), nb = Math.hypot.apply(null, b);
  if (na < 1e-12 || nb < 1e-12) return 0;
  return d / (na * nb);
}

/* ---------------- rerank helpers ---------------- */
function minWindow(lists) {
  var k = lists.length, ptr = new Array(k).fill(0), best = Infinity;
  for (;;) {
    var mn = Infinity, mx = -Infinity, mi = -1;
    for (var i = 0; i < k; i++) { var p = lists[i][ptr[i]]; if (p < mn) { mn = p; mi = i; } if (p > mx) mx = p; }
    if (mx - mn < best) best = mx - mn;
    if (++ptr[mi] >= lists[mi].length) break;
  }
  return best;
}
function docEntities(d) {
  var e = d.entities || {}, out = [];
  ["people", "projects", "topics"].forEach(function (k) { (e[k] || []).forEach(function (x) { out.push(x); }); });
  return out;
}

/* ---------------- search ---------------- */
function search(query, opts) {
  opts = opts || {};
  var mode = opts.mode || "hybrid", alpha = (opts.alpha == null ? 0.5 : opts.alpha);
  var qTerms = tokenize(query);
  var tStart = (typeof performance !== "undefined" ? performance.now() : Date.now());
  if (!qTerms.length) return { results: [], qTerms: qTerms, ms: 0, stage1: [] };
  var ql = queryLatent(qTerms);
  var scored = [];
  for (var di = 0; di < N; di++) {
    scored.push({ doc: docs[di], di: di, bm25: bm25(qTerms, di), sem: cosine(ql, docLatent[di]) });
  }
  var maxB = 1e-9, maxS = 1e-9, i;
  for (i = 0; i < scored.length; i++) {
    if (scored[i].bm25 > maxB) maxB = scored[i].bm25;
    var sp = Math.max(0, scored[i].sem);
    if (sp > maxS) maxS = sp;
  }
  for (i = 0; i < scored.length; i++) {
    var r = scored[i];
    r.bm25n = r.bm25 / maxB;
    r.semn = Math.max(0, r.sem) / maxS;
    r.hybrid = (1 - alpha) * r.bm25n + alpha * r.semn;
  }
  function stage1score(r) { return mode === "keyword" ? r.bm25n : mode === "semantic" ? r.semn : r.hybrid; }
  var pool = scored.filter(function (r) { return stage1score(r) > 0; });
  pool.sort(function (a, b) { return stage1score(b) - stage1score(a); });
  var stage1 = pool.slice(0, 25);
  var s1rank = {};
  stage1.forEach(function (r, i) { s1rank[r.di] = i + 1; });
  var maxS1 = Math.max.apply(null, stage1.map(stage1score).concat([1e-9]));
  var qlow = query.toLowerCase();
  var reranked = stage1.map(function (r) {
    var toks = docTokens[r.di];
    var present = qTerms.filter(function (t) { return toks.indexOf(t) >= 0; });
    var coverage = present.length / qTerms.length;
    var lists = present.map(function (t) {
      var ps = []; toks.forEach(function (x, xi) { if (x === t) ps.push(xi); }); return ps;
    }).filter(function (l) { return l.length; });
    var prox = lists.length ? 1 / (1 + minWindow(lists) / 20) : 0;
    var ent = 0;
    docEntities(r.doc).forEach(function (e) {
      var first = e.toLowerCase().split(" ")[0];
      if (first.length > 2 && qlow.indexOf(first) >= 0) ent = 1;
    });
    r.coverage = coverage; r.proximity = prox; r.entBoost = ent;
    r.final = 0.6 * (stage1score(r) / maxS1) + 0.2 * coverage + 0.15 * coverage * prox + 0.1 * ent;
    r.move = s1rank[r.di];
    return r;
  });
  reranked.sort(function (a, b) { return b.final - a.final; });
  reranked.forEach(function (r, i) { r.rank = i + 1; r.move = r.move - r.rank; });
  var ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - tStart;
  return { results: reranked.slice(0, 10), qTerms: qTerms, ms: ms, stage1count: stage1.length, mode: mode, alpha: alpha };
}

/* ---------------- extractive Ask ---------------- */
function ask(query, results) {
  var qTerms = tokenize(query), picks = [], perDoc = {};
  results.slice(0, 6).forEach(function (r) {
    splitSentences(r.doc.title + ". " + r.doc.body).forEach(function (s) {
      var st = tokenize(s);
      if (!st.length) return;
      var ov = st.filter(function (t) { return qTerms.indexOf(t) >= 0; }).length;
      if (ov > 0) picks.push({ s: s, score: ov / Math.sqrt(st.length), doc: r.doc });
    });
  });
  picks.sort(function (a, b) { return b.score - a.score; });
  var out = [];
  for (var i = 0; i < picks.length && out.length < 4; i++) {
    var p = picks[i], id = p.doc.id;
    perDoc[id] = (perDoc[id] || 0) + 1;
    if (perDoc[id] > 2) continue;
    if (out.some(function (o) { return o.s === p.s; })) continue;
    out.push(p);
  }
  var ents = {};
  out.forEach(function (p) { docEntities(p.doc).forEach(function (e) { ents[e] = (ents[e] || 0) + 1; }); });
  var topEnts = Object.keys(ents).sort(function (a, b) { return ents[b] - ents[a]; }).slice(0, 5);
  return { sentences: out, entities: topEnts, sources: out.map(function (p) { return p.doc; })
    .filter(function (d, i, a) { return a.indexOf(d) === i; }) };
}

var t1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
window.IR = {
  search: search, ask: ask, tokenize: tokenize, docEntities: docEntities,
  stats: { docs: N, terms: V, dims: K, indexMs: Math.round(t1 - t0) }
};
})();
