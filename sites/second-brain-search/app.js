/* Second Brain — UI: search console, pipeline viz, results with signal bars,
   extractive Ask, temporal histogram, entity knowledge graph. */
(function () {
"use strict";
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

var state = { q: "", mode: "hybrid", alpha: 0.5, ask: false, types: new Set(), month: null, last: null };
var TYPES = ["note", "email", "calendar", "bookmark", "file"];

var MODEDESC = {
  keyword: "BM25 · exact-term scoring over an inverted index (k1=1.2, b=0.75)",
  semantic: "LSA · 32-dim truncated SVD of the tf-idf matrix, cosine in latent space — computed in your browser",
  hybrid: "α · semantic + (1 − α) · keyword, min-max normalized per signal"
};

/* ---------- header stats ---------- */
$("hdr-stats").innerHTML =
  "<span><b>" + IR.stats.docs + "</b> docs</span>" +
  "<span><b>" + IR.stats.terms.toLocaleString() + "</b> terms</span>" +
  "<span><b>" + IR.stats.dims + "</b> latent dims</span>" +
  "<span>indexed in <b>" + IR.stats.indexMs + "ms</b></span>";
$("foot").textContent = "second/brain v2 · BM25 + in-browser LSA + hybrid + rerank over YOUR Gmail + Google Calendar — real mail, real events, real math (32-dim truncated SVD at load, no embeddings API). Rebuild the corpus anytime: python3 tools/build-corpus.py";

/* ---------- dynamic placeholder + example queries from corpus metadata ---------- */
(function () {
  var meta = window.CORPUS_META || {};
  $("q").placeholder = "Search " + IR.stats.docs + " documents — your mail + calendar";
  var box = $("examples");
  var qs = (meta.examples && meta.examples.length ? meta.examples : ["meeting", "receipt", "flight"]);
  qs.forEach(function (t) {
    var b = document.createElement("button");
    b.setAttribute("data-q", t);
    b.textContent = t;
    box.appendChild(b);
  });
  Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () { $("q").value = b.getAttribute("data-q"); runSearch(); });
  });
})();

/* ---------- controls ---------- */
function setMode(m) {
  state.mode = m;
  Array.prototype.forEach.call($("modeseg").children, function (b) {
    b.classList.toggle("on", b.getAttribute("data-mode") === m);
  });
  $("modedesc").textContent = MODEDESC[m];
  if (state.q) runSearch();
}
Array.prototype.forEach.call($("modeseg").children, function (b) {
  b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
});
$("modedesc").textContent = MODEDESC.hybrid;
$("alpha").addEventListener("input", function () {
  state.alpha = $("alpha").value / 100;
  $("alphav").textContent = state.alpha.toFixed(2);
  if (state.q) runSearch();
});
$("asktgl").addEventListener("click", function () {
  state.ask = !state.ask;
  $("asktgl").classList.toggle("on", state.ask);
  render();
});
function runSearch() {
  state.q = $("q").value.trim();
  state.month = null;
  if (!state.q) { state.last = null; render(); return; }
  state.last = IR.search(state.q, { mode: state.mode, alpha: state.alpha });
  render();
}
$("go").addEventListener("click", runSearch);
$("q").addEventListener("keydown", function (e) { if (e.key === "Enter") runSearch(); });
document.addEventListener("keydown", function (e) {
  if (e.key === "/" && document.activeElement !== $("q")) { e.preventDefault(); $("q").focus(); }
});

/* ---------- type filter chips ---------- */
TYPES.forEach(function (t) {
  var b = document.createElement("button");
  b.className = "fchip on"; b.textContent = t; b.setAttribute("data-t", t);
  b.addEventListener("click", function () {
    if (state.types.has(t)) { state.types.delete(t); b.classList.remove("on"); }
    else { state.types.add(t); b.classList.add("on"); }
    render();
  });
  $("typechips").appendChild(b);
});

/* ---------- filtering ---------- */
function filteredResults() {
  if (!state.last) return [];
  return state.last.results.filter(function (r) {
    if (state.types.size && !state.types.has(r.doc.type)) return false;
    if (state.month && r.doc.date.slice(0, 7) !== state.month) return false;
    return true;
  });
}

/* ---------- snippets ---------- */
function snippetHTML(doc, qTerms) {
  var qset = {};
  qTerms.forEach(function (t) { qset[t] = 1; });
  var words = doc.body.split(/\s+/), hits = [];
  words.forEach(function (w, i) {
    var st = IR.tokenize(w);
    if (st.some(function (t) { return qset[t]; })) hits.push(i);
  });
  var start = 0, end = words.length;
  if (hits.length) { start = Math.max(0, hits[0] - 8); end = Math.min(words.length, hits[hits.length - 1] + 14); }
  else end = Math.min(words.length, 30);
  var out = [];
  for (var i = start; i < end; i++) {
    var w = words[i], st = IR.tokenize(w);
    out.push(st.some(function (t) { return qset[t]; }) ? "<mark>" + esc(w) + "</mark>" : esc(w));
  }
  return (start > 0 ? "… " : "") + out.join(" ") + (end < words.length ? " …" : "");
}

/* ---------- results ---------- */
function barRow(label, val, color) {
  return '<div class="bl">' + label + '</div><div class="bt"><div class="bf" style="width:' +
    Math.round(val * 100) + '%;background:' + color + '"></div></div>' +
    '<div class="bv">' + val.toFixed(2) + '</div>';
}
function moveBadge(m) {
  if (m > 0) return '<span class="move up">↑' + m + '</span>';
  if (m < 0) return '<span class="move dn">↓' + (-m) + '</span>';
  return '<span class="move eq">–</span>';
}
function renderResults(list, qTerms) {
  if (!list.length) {
    return '<div class="empty"><h2>no results</h2>Nothing in the corpus matches.<br>' +
      '<span style="font-size:13px">Tip: switch to HYBRID or SEMANTIC — latent similarity finds docs with none of the exact words.</span></div>';
  }
  return list.map(function (r) {
    var d = r.doc;
    var docToks = IR.tokenize(d.title + " " + d.body);
    var matched = qTerms.filter(function (t, i) { return qTerms.indexOf(t) === i && docToks.indexOf(t) >= 0; });
    var ents = IR.docEntities(d);
    return '<div class="result">' +
      '<div class="top"><span class="rank">#' + r.rank + '</span>' + moveBadge(r.move) +
      '<span class="rtype ' + d.type + '">' + d.type.toUpperCase() + '</span>' +
      '<span class="rdate">' + esc(d.date) + '</span></div>' +
      '<div class="rtitle">' + esc(d.title) + '</div>' +
      '<div class="snip">' + snippetHTML(d, qTerms) + '</div>' +
      '<div class="bars">' +
      barRow("BM25", r.bm25n, "var(--teal)") +
      barRow("SEM", r.semn, "var(--amber)") +
      barRow("HYB", r.hybrid, "var(--violet)") +
      barRow("FINAL", Math.min(1, r.final), "var(--white)") +
      '</div>' +
      '<div class="tags">' +
      matched.map(function (t) { return '<span class="tag mt">' + esc(t) + '</span>'; }).join("") +
      ents.map(function (e) { return '<span class="tag ent" data-ent="' + esc(e) + '">' + esc(e) + '</span>'; }).join("") +
      '</div></div>';
  }).join("");
}

/* ---------- ask ---------- */
function renderAsk(list) {
  if (!state.ask || !list.length) return "";
  var a = IR.ask(state.q, list);
  if (!a.sentences.length) return "";
  var items = a.sentences.map(function (p) {
    var rk = list.filter(function (r) { return r.doc.id === p.doc.id; })[0];
    return "<li>" + esc(p.s) + "<cite>[" + (rk ? rk.rank : "?") + "] " + esc(p.doc.title.slice(0, 34)) + "</cite></li>";
  }).join("");
  return '<div class="askcard"><h3>ASK — EXTRACTIVE ANSWER</h3><ul style="margin:0;padding-left:20px">' + items + "</ul>" +
    '<div class="src">key entities: ' + a.entities.map(esc).join(" · ") + "<br>sources: " +
    a.sources.map(function (d) { return esc(d.id); }).join(", ") + "</div></div>";
}

/* ---------- pipeline ---------- */
function renderPipeline() {
  var p = $("pipeline");
  if (!state.last) { p.style.display = "none"; return; }
  p.style.display = "flex";
  var L = state.last, n = filteredResults().length;
  p.innerHTML =
    stage("STAGE 0", "CORPUS", IR.stats.docs + " docs · " + IR.stats.terms.toLocaleString() + " terms") +
    '<div class="stage arrow">→</div>' +
    stage("STAGE 1", "RETRIEVAL", "top 25 by " + L.mode.toUpperCase() + "<br>" + L.ms.toFixed(1) + " ms") +
    '<div class="stage arrow">→</div>' +
    stage("STAGE 2", "RERANK", "coverage + proximity<br>+ entity match") +
    '<div class="stage arrow">→</div>' +
    stage("FINAL", n + " RESULTS", (state.types.size || state.month) ? "filters applied" : "no filters");
  function stage(k, v, s) {
    return '<div class="stage"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="s">' + s + '</div></div>';
  }
}

/* ---------- histogram ---------- */
function allMonths() {
  var seen = {}, arr = [];
  window.CORPUS.forEach(function (d) {
    var m = d.date.slice(0, 7);
    if (!seen[m]) { seen[m] = 1; arr.push(m); }
  });
  return arr.sort();
}
var MONTHS = allMonths();
function renderHist(list) {
  var counts = {};
  MONTHS.forEach(function (m) { counts[m] = 0; });
  list.forEach(function (r) { counts[r.doc.date.slice(0, 7)]++; });
  var max = Math.max.apply(null, MONTHS.map(function (m) { return counts[m]; }).concat([1]));
  var h = $("hist"); h.innerHTML = "";
  MONTHS.forEach(function (m) {
    var b = document.createElement("div");
    b.className = "hb" + (counts[m] ? " hot" : "") + (state.month === m ? " sel" : "");
    b.style.height = Math.max(4, Math.round(counts[m] / max * 82)) + "px";
    b.title = m + ": " + counts[m];
    b.addEventListener("click", function () {
      state.month = (state.month === m) ? null : m;
      render();
    });
    h.appendChild(b);
  });
  $("hmin").textContent = MONTHS[0];
  $("hmax").textContent = MONTHS[MONTHS.length - 1];
  $("hcur").textContent = state.month ? "▸ " + state.month + " (click bar to clear)" : list.length + " docs";
}

/* ---------- entity graph ---------- */
var GNODES = [], GEDGES = [];
(function buildGraph() {
  var entDocs = {}, entCat = {};
  window.CORPUS.forEach(function (d) {
    IR.docEntities(d).forEach(function (e) {
      (entDocs[e] = entDocs[e] || new Set()).add(d.id);
    });
    (d.entities.people || []).forEach(function (e) { entCat[e] = entCat[e] || "people"; });
    (d.entities.projects || []).forEach(function (e) { entCat[e] = entCat[e] || "projects"; });
    (d.entities.topics || []).forEach(function (e) { entCat[e] = entCat[e] || "topics"; });
  });
  var names = Object.keys(entDocs).filter(function (e) { return entDocs[e].size >= 2; })
    .sort(function (a, b) { return entDocs[b].size - entDocs[a].size; }).slice(0, 34);
  var idx = {};
  names.forEach(function (e, i) { idx[e] = i; });
  GNODES = names.map(function (e, i) {
    var a = (i / names.length) * Math.PI * 2;
    return { name: e, cat: entCat[e] || "topics", n: entDocs[e].size, x: Math.cos(a), y: Math.sin(a), vx: 0, vy: 0 };
  });
  var ecount = {};
  window.CORPUS.forEach(function (d) {
    var es = IR.docEntities(d).filter(function (e) { return idx[e] !== undefined; });
    for (var i = 0; i < es.length; i++) for (var j = i + 1; j < es.length; j++) {
      var k = idx[es[i]] + ":" + idx[es[j]];
      ecount[k] = (ecount[k] || 0) + 1;
    }
  });
  GEDGES = Object.keys(ecount).map(function (k) {
    var p = k.split(":");
    return { a: +p[0], b: +p[1], w: ecount[k] };
  }).sort(function (a, b) { return b.w - a.w; }).slice(0, 70);
  /* force layout */
  for (var it = 0; it < 500; it++) {
    for (var i = 0; i < GNODES.length; i++) {
      var A = GNODES[i];
      for (var j = 0; j < GNODES.length; j++) {
        if (i === j) continue;
        var B = GNODES[j], dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
        var f = 0.02 / d2;
        A.vx += dx / d * f; A.vy += dy / d * f;
      }
      A.vx += -A.x * 0.02; A.vy += -A.y * 0.02;
    }
    GEDGES.forEach(function (e) {
      var A = GNODES[e.a], B = GNODES[e.b];
      var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.01, want = 0.55;
      var f = (d - want) * 0.03 * Math.min(2, e.w);
      A.vx += dx / d * f; A.vy += dy / d * f; B.vx -= dx / d * f; B.vy -= dy / d * f;
    });
    GNODES.forEach(function (A) { A.x += A.vx; A.y += A.vy; A.vx *= 0.85; A.vy *= 0.85; });
  }
})();
var CATC = { people: "#2dd4bf", projects: "#a78bfa", topics: "#f0b429" };
function drawGraph(hover) {
  var cv = $("graph"), ctx = cv.getContext("2d");
  var W = cv.clientWidth, H = 300, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
  var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 34;
  function P(n) { return [cx + n.x * R, cy + n.y * R]; }
  ctx.clearRect(0, 0, W, H);
  GEDGES.forEach(function (e) {
    var a = P(GNODES[e.a]), b = P(GNODES[e.b]);
    ctx.strokeStyle = "rgba(125,138,150," + Math.min(0.5, 0.08 + e.w * 0.08) + ")";
    ctx.lineWidth = Math.min(3, e.w * 0.7);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  });
  GNODES.forEach(function (n, i) {
    var p = P(n), r = 5 + Math.sqrt(n.n) * 3.2;
    n._px = p[0]; n._py = p[1]; n._r = r;
    ctx.fillStyle = CATC[n.cat];
    ctx.globalAlpha = (hover === undefined || hover === i) ? 1 : 0.35;
    ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    if (n.n >= 4 || hover === i) {
      ctx.fillStyle = hover === i ? "#f2f5f7" : "#7f8b97";
      ctx.font = "10px ui-monospace,monospace";
      ctx.textAlign = "center";
      ctx.fillText(n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name, p[0], p[1] + r + 11);
    }
  });
}
var gHover = -1, gDrag = -1;
function gPos(ev) {
  var r = $("graph").getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}
function gNodeAt(x, y) {
  for (var i = GNODES.length - 1; i >= 0; i--) {
    var n = GNODES[i];
    if (Math.hypot(n._px - x, n._py - y) < n._r + 6) return i;
  }
  return -1;
}
$("graph").addEventListener("mousemove", function (ev) {
  var p = gPos(ev), i = gNodeAt(p[0], p[1]);
  if (gDrag >= 0 && i !== gDrag) { /* dragging */ }
  if (i !== gHover) { gHover = i; drawGraph(i); }
  $("graph").style.cursor = i >= 0 ? "pointer" : "default";
  if (gDrag >= 0) {
    var W = $("graph").clientWidth, R = Math.min(W, 300) / 2 - 34;
    var n = GNODES[gDrag];
    n.x = (p[0] - W / 2) / R; n.y = (p[1] - 150) / R;
    drawGraph(gHover);
  }
});
$("graph").addEventListener("mouseleave", function () { gHover = -1; gDrag = -1; drawGraph(); });
$("graph").addEventListener("mousedown", function (ev) {
  var p = gPos(ev), i = gNodeAt(p[0], p[1]);
  if (i >= 0) gDrag = i;
});
$("graph").addEventListener("mouseup", function (ev) {
  var wasDrag = gDrag; gDrag = -1;
  var p = gPos(ev), i = gNodeAt(p[0], p[1]);
  if (i >= 0 && i === wasDrag) { $("q").value = GNODES[i].name; runSearch(); }
  drawGraph(gHover);
});
$("graph").addEventListener("touchstart", function (ev) {
  var t = ev.changedTouches[0], p = gPos(t), i = gNodeAt(p[0], p[1]);
  if (i >= 0) { ev.preventDefault(); $("q").value = GNODES[i].name; runSearch(); }
}, { passive: false });
window.addEventListener("resize", function () { drawGraph(); });

/* ---------- empty state ---------- */
function renderEmpty() {
  var byType = {};
  TYPES.forEach(function (t) { byType[t] = 0; });
  window.CORPUS.forEach(function (d) { byType[d.type] = (byType[d.type] || 0) + 1; });
  var entCount = {};
  window.CORPUS.forEach(function (d) {
    IR.docEntities(d).forEach(function (e) { entCount[e] = (entCount[e] || 0) + 1; });
  });
  var top = Object.keys(entCount).sort(function (a, b) { return entCount[b] - entCount[a]; }).slice(0, 10);
  $("results").innerHTML =
    '<div class="empty"><h2>THE CORPUS IS INDEXED</h2>' +
    TYPES.map(function (t) { return byType[t] + " " + t + "s"; }).join(" · ") +
    '<div style="margin:14px 0 6px;font-size:13px">top entities</div>' +
    '<div class="tags" style="justify-content:center">' +
    top.map(function (e) { return '<span class="tag ent" data-ent="' + esc(e) + '">' + esc(e) + " ×" + entCount[e] + "</span>"; }).join("") +
    '</div><div class="big">type a query above — or tap an entity —<br>every result shows exactly why it matched</div></div>';
  renderHist([]);
}

/* ---------- master render ---------- */
function render() {
  renderPipeline();
  if (!state.last) { renderEmpty(); drawGraph(); return; }
  var list = filteredResults();
  $("results").innerHTML = renderAsk(list) + renderResults(list, state.last.qTerms);
  Array.prototype.forEach.call(document.querySelectorAll(".tag.ent"), function (el) {
    el.addEventListener("click", function () { $("q").value = el.getAttribute("data-ent"); runSearch(); });
  });
  renderHist(state.last.results.filter(function (r) {
    return !(state.types.size && !state.types.has(r.doc.type));
  }));
  drawGraph();
}

render();
})();
