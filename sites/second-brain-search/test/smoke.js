/* Headless smoke test for second-brain-search — stub DOM, drive real code.
   Data-driven: works against whatever corpus tools/build-corpus.py generated. */
const fs = require("fs");
const vm = require("vm");
const path = __dirname + "/../";

let failures = 0;
function ok(c, label) { console.log((c ? "PASS " : "FAIL ") + label); if (!c) failures++; }

function makeCtx() {
  const f = () => function () {};
  const el = (tag) => ({
    tagName: tag, children: [], style: {}, _attr: {}, _ls: {}, _html: "", textContent: "", value: "",
    classList: { _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, force) { if (force === undefined) force = !this._s.has(c); force ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); } },
    addEventListener(t, fn) { (this._ls[t] = this._ls[t] || []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    querySelectorAll(sel) { const m = sel.match(/^[a-z]+/i); return m ? this.children.filter(c => (c.tagName || "").toLowerCase() === m[0].toLowerCase()) : []; },
    set innerHTML(v) { this._html = String(v); this.children = []; },
    get innerHTML() { return this._html; },
    getAttribute(a) { return this._attr[a]; },
    setAttribute(a, v) { this._attr[a] = v; },
    getContext() { return new Proxy({}, { get: (t, p) => (typeof p === "string" ? f() : undefined), set: () => true }); },
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    clientWidth: 300, title: "", click: f(), focus: f(),
  });
  const byId = {};
  const document = {
    _el: el,
    getElementById(id) { return byId[id] || (byId[id] = el("div")); },
    createElement(t) { return el(t); },
    querySelectorAll() { return []; },
    addEventListener: f(), activeElement: null,
  };
  const sandbox = {
    console, Math, JSON, Date, Array, Object, String, Number, RegExp, Error, Set, Map,
    performance: require("perf_hooks").performance,
    document,
    addEventListener: f(), devicePixelRatio: 1,
    setTimeout, clearTimeout,
  };
  sandbox.window = sandbox; // browser semantics: window === globalThis
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const f of ["data.js", "ir.js", "app.js"])
    vm.runInContext(fs.readFileSync(path + f, "utf8"), sandbox, { filename: f });
  return { sandbox, byId, document };
}

const { sandbox, byId } = makeCtx();
const IR = sandbox.window.IR || sandbox.IR;
const CORPUS = sandbox.window.CORPUS;
ok(!!IR && CORPUS && CORPUS.length > 20, "IR engine loaded over real corpus (" + (CORPUS ? CORPUS.length : 0) + " docs)");
ok(!!sandbox.window.CORPUS_META, "corpus metadata present (builtAt/sources/examples)");
const nEmail = CORPUS.filter(d => d.type === "email").length;
const nCal = CORPUS.filter(d => d.type === "calendar").length;
ok(nEmail > 0 && nCal > 0, "corpus has real email + calendar docs (" + nEmail + " email, " + nCal + " cal)");

// pick the most frequent content term as a guaranteed-hit query
const freq = {};
CORPUS.forEach(d => IR.tokenize(d.title + " " + d.body).forEach(t => { if (t.length > 3) freq[t] = (freq[t] || 0) + 1; }));
const QUERY = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
ok(!!QUERY && freq[QUERY] >= 2, "query term '" + QUERY + "' hits " + freq[QUERY] + " docs");

// simulate a search: set input, click GO
const q = byId["q"], go = byId["go"];
q.value = QUERY;
(go._ls.click || []).forEach(fn => fn());
const html = byId["results"].innerHTML;
ok(html.includes("BM25") && html.includes("FINAL"), "results show signal bars");
ok(byId["pipeline"].innerHTML.includes("RERANK"), "pipeline strip rendered");
ok((byId["q"].placeholder || "").includes(String(CORPUS.length)), "placeholder shows live doc count");
ok((byId["examples"].children || []).length > 0, "example queries rendered from corpus metadata");

// keyword-only mode: every result must match exact terms
let r = sandbox.IR.search(QUERY, { mode: "keyword", alpha: 0.5 });
ok(r.results.length > 0 && r.results.every(x => x.bm25n > 0), "keyword mode: exact-term hits only (" + r.results.length + ")");

// semantic mode: latent similarity finds docs
r = sandbox.IR.search(QUERY, { mode: "semantic", alpha: 0.5 });
ok(r.results.length > 0 && r.results.some(x => x.semn > 0), "semantic mode returns latent matches (" + r.results.length + ")");

// hybrid
r = sandbox.IR.search(QUERY, { mode: "hybrid", alpha: 0.5 });
ok(r.results.length > 0, "hybrid mode returns results (" + r.results.length + ")");

// ask mode
const ask = sandbox.IR.ask(QUERY, r.results);
ok(ask.sentences.length >= 1 && ask.sources.length >= 1, "extractive ask returns cited sentences (" + ask.sentences.length + ")");

// histogram rendered: one bar per corpus month
const months = new Set(CORPUS.map(d => d.date.slice(0, 7))).size;
ok(byId["hist"].children.length === months, "histogram bars rendered (" + byId["hist"].children.length + " = " + months + " months)");

// empty query -> empty state
q.value = "";
(go._ls.click || []).forEach(fn => fn());
ok(byId["results"].innerHTML.includes("THE CORPUS IS INDEXED"), "empty query shows corpus overview");

// nonsense query
q.value = "zxqwv blorpt";
(go._ls.click || []).forEach(fn => fn());
ok(byId["results"].innerHTML.includes("no results"), "gibberish query shows no-results state");

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL SMOKE CHECKS PASSED");
process.exit(failures ? 1 : 0);
