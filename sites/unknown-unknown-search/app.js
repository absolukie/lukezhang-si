/* UNKNOWN-UNKNOWN — app shell: gap feed, contradictions, graph, papers, study lab. */

let DATA = null;
const S = { view: "gaps", q: "", typeF: "all", sfF: "all", modelF: "all", yearF: "all", claimF: null, hlPaper: null, labGap: null };
const expanded = {};

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function $(id) { return document.getElementById(id); }
function paperById(pid) { return DATA.ix.paperById[pid]; }
function claimById(cid) { return DATA.ix.claimById[cid]; }
function assumpById(aid) { return DATA.ix.assumpById[aid]; }

function paperLine(pid) {
  const p = paperById(pid);
  return '<button class="plink" data-paper="' + pid + '"><span class="mono">' + pid + '</span> ' +
    esc(p.authors[0]) + " <span class='dim'>" + p.year + "</span> — " + esc(p.title) + "</button>";
}

function gapSubfields(g) {
  const r = g.refs;
  if (g.type === "assumption") {
    const s = {};
    r.rely.concat(r.test).forEach(pid => { s[paperById(pid).subfield] = 1; });
    return Object.keys(s);
  }
  if (g.type === "silence") return r.subfields.slice();
  if (r.claim) return [claimById(r.claim).subfield];
  return [];
}

function gapCard(g) {
  const T = GAP_TYPES[g.type];
  const open = !!expanded[g.id];
  const sev = g.score >= 75 ? "hi" : g.score >= 45 ? "med" : "lo";
  let body = "";
  if (open) {
    const r = g.refs;
    if (g.type === "assumption") {
      const a = assumpById(r.assumption), t = a.trials;
      const trialHtml = t
        ? '<a class="trials" href="' + t.url + '" target="_blank" rel="noopener">🔬 ' +
          (t.count === null ? 'ClinicalTrials.gov: “' + esc(t.term) + '”'
           : t.count === 0 ? 'Zero registered trials test this premise'
           : t.count.toLocaleString() + ' registered trial' + (t.count === 1 ? '' : 's') + ' touch this premise') +
          ' ↗</a>' : '';
      body = '<div class="cols"><div><div class="colh">RELIES ON · ' + r.rely.length + '</div>' +
        r.rely.map(paperLine).join("") + '</div><div><div class="colh">DIRECTLY TESTS · ' + r.test.length + '</div>' +
        (r.test.length ? r.test.map(paperLine).join("") : '<div class="none">∅ — nothing in this corpus tests it</div>') + "</div></div>" +
        trialHtml;
    } else if (g.type === "contradiction") {
      body = '<div class="cols"><div><div class="colh for">SUPPORTS · ' + r.support.length + '</div>' +
        r.support.map(paperLine).join("") + '</div><div><div class="colh against">CONTRADICTS · ' + r.contra.length + '</div>' +
        r.contra.map(paperLine).join("") + "</div></div>";
    } else if (g.type === "replication") {
      body = '<div class="cols"><div><div class="colh">ORIGIN</div>' + paperLine(r.origin) + '</div><div><div class="colh">BUILDS ON IT · ' + r.citers.length + '</div>' +
        r.citers.map(paperLine).join("") + "</div></div>";
    } else if (g.type === "missing") {
      body = '<div class="cols"><div><div class="colh">PROPOSED MODEL</div><div class="modelbig">' + r.model + '</div></div>' +
        '<div><div class="colh">CURRENT SUPPORT · ' + r.support.length + '</div>' + r.support.map(paperLine).join("") + "</div></div>";
    } else {
      const pa = PAPERS.filter(p => p.subfield === r.subfields[0]).slice(0, 5);
      const pb = PAPERS.filter(p => p.subfield === r.subfields[1]).slice(0, 5);
      body = '<div class="cols"><div><div class="colh">' + esc(SUBFIELDS[r.subfields[0]]) + '</div>' + pa.map(p => paperLine(p.id)).join("") +
        '</div><div><div class="colh">' + esc(SUBFIELDS[r.subfields[1]]) + '</div>' + pb.map(p => paperLine(p.id)).join("") + "</div></div>";
    }
    body += '<button class="btn draft" data-draft="' + g.id + '">Draft the missing study →</button>';
  }
  return '<article class="gap" data-gap="' + g.id + '">' +
    '<button class="gaphead" data-toggle="' + g.id + '">' +
    '<span class="sev ' + sev + '"><i style="width:' + g.score + '%"></i></span>' +
    '<span class="gmain"><span class="gtype" style="color:' + T.color + '">' + T.label + '</span>' +
    '<span class="gtitle">' + esc(g.title) + '</span>' +
    '<span class="ghead">' + esc(g.headline) + '</span></span>' +
    '<span class="gexp">' + (open ? "−" : "+") + '</span></button>' +
    (open ? '<div class="gbody"><p class="gsum">' + esc(g.summary) + '</p>' + body + '</div>' : '') +
    "</article>";
}

/* ---------------- views ---------------- */

function renderGaps(el) {
  let gaps = DATA.gaps.filter(g => S.typeF === "all" || g.type === S.typeF);
  if (S.sfF !== "all") gaps = gaps.filter(g => gapSubfields(g).indexOf(S.sfF) >= 0);
  if (S.claimF) gaps = gaps.filter(g => g.refs.claim === S.claimF);
  const types = ["all"].concat(Object.keys(GAP_TYPES));
  el.innerHTML =
    '<div class="toolbar">' +
    types.map(t => '<button class="chip' + (S.typeF === t ? " on" : "") + '" data-typef="' + t + '">' +
      (t === "all" ? "All gaps" : GAP_TYPES[t].label) + "</button>").join("") +
    '<select id="sff" class="sel"><option value="all">All subfields</option>' +
    Object.keys(SUBFIELDS).map(s => '<option value="' + s + '"' + (S.sfF === s ? " selected" : "") + ">" + SUBFIELDS[s] + "</option>").join("") +
    "</select>" +
    (S.claimF ? '<button class="chip on" data-clearclaim="1">claim ' + S.claimF + " ✕</button>" : "") +
    "</div>" +
    '<div class="count">' + gaps.length + " gaps ranked by computed severity</div>" +
    '<div class="feed">' + gaps.map(gapCard).join("") + "</div>";
  $("sff").addEventListener("change", e => { S.sfF = e.target.value; render(); });
}

function renderContra(el) {
  const gs = DATA.gaps.filter(g => g.type === "contradiction");
  el.innerHTML = '<div class="count">' + gs.length + " direct contradictions in the corpus</div>" +
    gs.map(g => {
      const r = g.refs;
      return '<article class="gap"><div class="gmain pad"><span class="gtype" style="color:' + GAP_TYPES.contradiction.color + '">CONTRADICTION</span>' +
        '<span class="gtitle">“' + esc(g.title) + '”</span><span class="ghead">' + esc(g.headline) + '</span></div>' +
        '<div class="gbody"><div class="cols"><div><div class="colh for">FOR</div>' + r.support.map(paperLine).join("") +
        '</div><div><div class="colh against">AGAINST</div>' + r.contra.map(paperLine).join("") + "</div></div>" +
        '<button class="btn draft" data-draft="' + g.id + '">Draft the adversarial study →</button></div></article>';
    }).join("");
}

let KG = null;
function renderGraph(el) {
  el.innerHTML =
    '<div class="toolbar">' +
    '<button class="chip on" data-layer="paper">papers</button>' +
    '<button class="chip on" data-layer="claim">claims</button>' +
    '<button class="chip on" data-layer="assumption">assumptions</button>' +
    '<button class="chip on" data-layer="cites">citation edges</button>' +
    '<span class="sp"></span>' +
    '<button class="chip" id="gz-out">−</button><button class="chip" id="gz-in">+</button>' +
    '<button class="chip" id="gz-reset">reset</button></div>' +
    '<div class="graphwrap"><canvas id="kg"></canvas><div id="gdetail" class="gdetail"><div class="dim">Click a node to inspect it. Drag to rearrange.</div></div></div>' +
    '<div class="legend"><span><i class="dot" style="background:#59c2d8"></i>paper</span>' +
    '<span><i class="dia" style="background:#e8b64c"></i>claim</span>' +
    '<span><i class="hex" style="background:#e06c8a"></i>assumption</span>' +
    '<span><i class="ln" style="background:#e8b64c"></i>asserts</span>' +
    '<span><i class="ln" style="background:#e26d5a"></i>contradicts</span>' +
    '<span><i class="ln dash" style="background:#e06c8a"></i>relies on</span>' +
    '<span><i class="ln" style="background:#7bc96f"></i>tests</span></div>';
  KG = KnowledgeGraph($("kg"), DATA.ix, showNodeDetail);
  el.querySelectorAll("[data-layer]").forEach(b => b.addEventListener("click", () => {
    b.classList.toggle("on");
    KG.setLayer(b.dataset.layer, b.classList.contains("on"));
  }));
  $("gz-in").addEventListener("click", () => KG.zoom(1.25));
  $("gz-out").addEventListener("click", () => KG.zoom(0.8));
  $("gz-reset").addEventListener("click", () => KG.reset());
}

function showNodeDetail(n) {
  const d = $("gdetail");
  if (!n) { d.innerHTML = '<div class="dim">Click a node to inspect it. Drag to rearrange.</div>'; return; }
  let h = "";
  if (n.kind === "paper") {
    const p = n.paper, ix = DATA.ix;
    h = '<div class="mono dim">' + p.id + " · " + p.year + " · " + esc(p.venue) + '</div>' +
      '<div class="ptitle">' + esc(p.title) + '</div><div class="dim">' + p.authors.map(esc).join(", ") + '</div>' +
      '<div class="tags"><span class="tag">' + esc(SUBFIELDS[p.subfield]) + '</span><span class="tag">' + p.model + '</span>' +
      '<span class="tag">' + ix.citedBy[p.id].length + ' citations</span></div>' +
      (p.asserts.length ? '<div class="colh">ASSERTS</div>' + p.asserts.map(c => '<div class="ctext">' + esc(claimById(c).text) + "</div>").join("") : "") +
      (p.contradicts.length ? '<div class="colh against">CONTRADICTS</div>' + p.contradicts.map(c => '<div class="ctext">' + esc(claimById(c).text) + "</div>").join("") : "") +
      (p.reliesOn.length ? '<div class="colh">RELIES ON</div>' + p.reliesOn.map(a => '<button class="plink" data-assump="' + a + '">' + esc(assumpById(a).text) + "</button>").join("") : "");
  } else if (n.kind === "claim") {
    const c = n.claim, ix = DATA.ix;
    h = '<div class="mono dim">' + c.id + " · claim · " + esc(SUBFIELDS[c.subfield]) + '</div>' +
      '<div class="ptitle">“' + esc(c.text) + '”</div>' +
      '<div class="colh for">SUPPORTS · ' + ix.claimSupport[c.id].length + '</div>' + ix.claimSupport[c.id].map(paperLine).join("") +
      (ix.claimContra[c.id].length ? '<div class="colh against">CONTRADICTS · ' + ix.claimContra[c.id].length + '</div>' + ix.claimContra[c.id].map(paperLine).join("") : "") +
      '<button class="btn draft" data-claimf="' + c.id + '">Show gaps on this claim →</button>';
  } else {
    const a = n.assump, ix = DATA.ix;
    h = '<div class="mono dim">' + a.id + " · assumption</div>" +
      '<div class="ptitle">' + esc(a.text) + '</div>' +
      '<div class="colh">RELIED ON BY · ' + ix.assumeRely[a.id].length + '</div>' + ix.assumeRely[a.id].map(paperLine).join("") +
      '<div class="colh">TESTED BY · ' + ix.assumeTest[a.id].length + '</div>' +
      (ix.assumeTest[a.id].length ? ix.assumeTest[a.id].map(paperLine).join("") : '<div class="none">∅</div>') +
      '<button class="btn draft" data-gaplink="gap-' + a.id + '">Open the gap card →</button>';
  }
  d.innerHTML = h;
}

function paperFullCard(p) {
  const ix = DATA.ix;
  const open = S.hlPaper === p.id;
  let h = '<article class="paper' + (open ? " open" : "") + '" data-paper="' + p.id + '">' +
    '<button class="gaphead" data-ptoggle="' + p.id + '"><span class="gmain">' +
    '<span class="ptitle">' + esc(p.title) + '</span>' +
    '<span class="ghead">' + p.authors.map(esc).join(", ") + ' · <span class="mono">' + p.venue + " " + p.year + "</span></span>" +
    '<span class="tags"><span class="tag">' + esc(SUBFIELDS[p.subfield]) + '</span><span class="tag">' + p.model + "</span>" +
    (p.citedByCount ? '<span class="tag">cited ' + p.citedByCount.toLocaleString() + '×</span>' : "") +
    '<span class="tag">' + ix.citedBy[p.id].length + " cited-by</span></span>" +
    '</span><span class="gexp">' + (open ? "−" : "+") + "</span></button>";
  if (open) {
    h += '<div class="gbody">' +
      (p.doi ? '<a class="dlink" href="https://doi.org/' + esc(p.doi) + '" target="_blank" rel="noopener">doi.org/' + esc(p.doi) + ' ↗</a>' : "") +
      (p.asserts.length ? '<div class="colh">ASSERTS</div>' + p.asserts.map(c => '<div class="ctext">' + esc(claimById(c).text) + "</div>").join("") : "") +
      (p.contradicts.length ? '<div class="colh against">CONTRADICTS</div>' + p.contradicts.map(c => '<div class="ctext">' + esc(claimById(c).text) + "</div>").join("") : "") +
      (p.reliesOn.length ? '<div class="colh">RELIES ON</div>' + p.reliesOn.map(a => '<div class="ctext dim2">[' + a + "] " + esc(assumpById(a).text) + "</div>").join("") : "") +
      (p.tests.length ? '<div class="colh">TESTS</div>' + p.tests.map(a => '<div class="ctext dim2">[' + a + "] " + esc(assumpById(a).text) + "</div>").join("") : "") +
      '<div class="colh">METHODS</div><div class="dim">' + p.methods.map(esc).join(" · ") + "</div>" +
      (ix.citedBy[p.id].length ? '<div class="colh">CITED BY</div>' + ix.citedBy[p.id].map(paperLine).join("") : "") +
      "</div>";
  }
  return h + "</article>";
}

function renderPapers(el) {
  const years = [...new Set(PAPERS.map(p => p.year))].sort((a, b) => a - b);
  let list = PAPERS.filter(p =>
    (S.sfF === "all" || p.subfield === S.sfF) &&
    (S.modelF === "all" || p.model === S.modelF) &&
    (S.yearF === "all" || p.year >= +S.yearF) &&
    (!S.q || (p.title + " " + p.authors.join(" ") + " " + p.venue).toLowerCase().includes(S.q.toLowerCase())));
  list.sort((a, b) => b.year - a.year);
  el.innerHTML =
    '<div class="toolbar"><input id="pq" class="search" placeholder="Search papers…" value="' + esc(S.q) + '">' +
    '<select id="pmodel" class="sel"><option value="all">All models</option>' +
    ["mouse", "human", "monkey", "cell", "worm", "multi"].map(m => '<option' + (S.modelF === m ? " selected" : "") + ">" + m + "</option>").join("") +
    '</select><select id="pyear" class="sel"><option value="all">All years</option>' +
    years.filter((y, i) => i % 3 === 0).map(y => '<option value="' + y + '"' + (S.yearF == y ? " selected" : "") + ">≥ " + y + "</option>").join("") +
    "</select>" +
    '<select id="psf" class="sel"><option value="all">All subfields</option>' +
    Object.keys(SUBFIELDS).map(s => '<option value="' + s + '"' + (S.sfF === s ? " selected" : "") + ">" + SUBFIELDS[s] + "</option>").join("") +
    "</select></div>" +
    '<div class="count">' + list.length + " of " + PAPERS.length + " papers</div>" +
    '<div class="feed">' + list.map(paperFullCard).join("") + "</div>";
  $("pq").addEventListener("input", e => { S.q = e.target.value; renderPapers($("view")); wireGlobal(); });
  $("pmodel").addEventListener("change", e => { S.modelF = e.target.value; render(); });
  $("pyear").addEventListener("change", e => { S.yearF = e.target.value; render(); });
  $("psf").addEventListener("change", e => { S.sfF = e.target.value; render(); });
}

function renderLab(el) {
  if (!S.labGap) S.labGap = DATA.gaps[0].id;
  const g = DATA.gaps.find(x => x.id === S.labGap) || DATA.gaps[0];
  const exp = draftExperiment(g, DATA.ix);
  const T = GAP_TYPES[g.type];
  el.innerHTML =
    '<div class="toolbar"><select id="labg" class="sel grow">' +
    DATA.gaps.map(x => '<option value="' + x.id + '"' + (x.id === g.id ? " selected" : "") + ">[" + x.score + "] " + esc(x.title.slice(0, 72)) + "</option>").join("") +
    '</select><button class="btn" id="copybrief">Copy brief</button></div>' +
    '<article class="protocol"><div class="gtype" style="color:' + T.color + '">' + T.label + ' → STUDY PROTOCOL</div>' +
    '<h2>' + esc(exp.title) + '</h2>' +
    '<h3>Rationale</h3><ul>' + exp.rationale.map(r => "<li>" + esc(r) + "</li>").join("") + "</ul>" +
    '<h3>Design</h3><dl>' + Object.keys(exp.design).map(k => "<dt>" + esc(k) + "</dt><dd>" + esc(exp.design[k]) + "</dd>").join("") + "</dl>" +
    '<h3>Why it matters</h3><p>' + esc(exp.why) + "</p></article>";
  $("labg").addEventListener("change", e => { S.labGap = e.target.value; render(); });
  $("copybrief").addEventListener("click", () => {
    const t = exp.title + "\n\nRATIONALE\n" + exp.rationale.map(r => "- " + r).join("\n") +
      "\n\nDESIGN\n" + Object.keys(exp.design).map(k => k + ": " + exp.design[k]).join("\n") +
      "\n\nWHY IT MATTERS\n" + exp.why;
    navigator.clipboard.writeText(t).then(() => { $("copybrief").textContent = "Copied ✓"; setTimeout(() => $("copybrief").textContent = "Copy brief", 1500); });
  });
}

function renderSearch(el) {
  const q = S.q.toLowerCase();
  const ps = PAPERS.filter(p => (p.title + " " + p.authors.join(" ")).toLowerCase().includes(q));
  const cs = CLAIMS.filter(c => c.text.toLowerCase().includes(q));
  const as = ASSUMPTIONS.filter(a => (a.id + " " + a.text).toLowerCase().includes(q));
  el.innerHTML = '<div class="count">“' + esc(S.q) + "” — " + ps.length + " papers · " + cs.length + " claims · " + as.length + " assumptions</div>" +
    (ps.length ? '<div class="colh">PAPERS</div><div class="feed">' + ps.map(paperFullCard).join("") + "</div>" : "") +
    (cs.length ? '<div class="colh">CLAIMS</div>' + cs.map(c => '<div class="ctext big">' + esc(c.text) + ' <button class="plink" data-claimf="' + c.id + '">gaps →</button></div>').join("") : "") +
    (as.length ? '<div class="colh">ASSUMPTIONS</div>' + as.map(a => '<div class="ctext big">[' + a.id + "] " + esc(a.text) + ' <button class="plink" data-gaplink="gap-' + a.id + '">gap →</button></div>').join("") : "") +
    (!ps.length && !cs.length && !as.length ? '<div class="empty">Nothing in the corpus matches. Try “senolytic”, “NAD”, “monkey”, “A01”…</div>' : "");
}

/* ---------------- shell ---------------- */

function render() {
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.view === S.view));
  const el = $("view");
  KG = null;
  if (S.view === "gaps") renderGaps(el);
  else if (S.view === "contra") renderContra(el);
  else if (S.view === "graph") renderGraph(el);
  else if (S.view === "papers") renderPapers(el);
  else if (S.view === "lab") renderLab(el);
  else if (S.view === "search") renderSearch(el);
  wireGlobal();
  el.scrollTop = 0; window.scrollTo(0, 0);
}

function wireGlobal() {
  document.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
    expanded[b.dataset.toggle] = !expanded[b.dataset.toggle]; render();
  });
  document.querySelectorAll("[data-ptoggle]").forEach(b => b.onclick = () => {
    S.hlPaper = S.hlPaper === b.dataset.ptoggle ? null : b.dataset.ptoggle; render();
  });
  document.querySelectorAll("[data-typef]").forEach(b => b.onclick = () => { S.typeF = b.dataset.typef; S.claimF = null; render(); });
  document.querySelectorAll("[data-paper]").forEach(b => b.onclick = () => {
    S.hlPaper = b.dataset.paper; S.view = "papers"; S.q = ""; render();
  });
  document.querySelectorAll("[data-draft]").forEach(b => b.onclick = e => {
    e.stopPropagation(); S.labGap = b.dataset.draft; S.view = "lab"; render();
  });
  document.querySelectorAll("[data-claimf]").forEach(b => b.onclick = () => {
    S.claimF = b.dataset.claimf; S.typeF = "all"; S.view = "gaps"; render();
  });
  document.querySelectorAll("[data-gaplink]").forEach(b => b.onclick = () => {
    expanded[b.dataset.gaplink] = true; S.view = "gaps"; S.typeF = "all"; S.claimF = null; render();
  });
  document.querySelectorAll("[data-clearclaim]").forEach(b => b.onclick = () => { S.claimF = null; render(); });
  document.querySelectorAll("[data-assump]").forEach(b => b.onclick = () => {
    expanded["gap-" + b.dataset.assump] = true; S.view = "gaps"; S.typeF = "assumption"; render();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  DATA = computeGaps();
  const n = DATA.gaps.length;
  $("stats").innerHTML = PAPERS.length + " papers · " + CLAIMS.length + " claims · " +
    ASSUMPTIONS.length + " assumptions · <b>" + n + " gaps found</b>";
  $("foot").innerHTML =
    "Real corpus: <b>" + PAPERS.length + " papers</b> via OpenAlex · ingested " + INGESTED_AT +
    " · " + CLAIMS.length + " landmark claims · trial cross-checks via ClinicalTrials.gov.<br>" +
    "Every gap is <b>computed</b> from the corpus link graph by <span class='mono'>gaps.js</span>; change the data and the feed re-ranks.<br>" +
    "Not a literature search — a search for what the literature is missing.";
  document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
    S.view = b.dataset.view; if (S.view !== "search") S.q = $("q").value;
    render();
  });
  let deb = null;
  $("q").addEventListener("input", e => {
    clearTimeout(deb);
    deb = setTimeout(() => {
      S.q = e.target.value.trim();
      S.view = S.q ? "search" : "gaps";
      render();
      const qq = $("q"); qq.focus();
      qq.setSelectionRange(qq.value.length, qq.value.length);
    }, 220);
  });
  render();
});
