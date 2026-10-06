/* node test: gap engine.
 * Part 1 — deterministic engine behavior, pinned to the frozen demo corpus (data.demo.js).
 * Part 2 — structural sanity of the REAL ingested corpus (data.js): every link resolves,
 *          gaps are computed and ranked, assumptions carry trial cross-checks. */
const fs = require("fs"), vm = require("vm");
const ROOT = __dirname + "/../";

function loadContext(files) {
  const ctx = {};
  vm.createContext(ctx);
  const src = files.map(f => fs.readFileSync(ROOT + f, "utf8")).join("\n") +
    "\n;globalThis.__T = { computeGaps, draftExperiment, GAP_TYPES, PAPERS, CLAIMS, ASSUMPTIONS, SUBFIELDS };";
  vm.runInContext(src, ctx, { filename: files.join("+") });
  return ctx.__T;
}

let fail = 0;
function ok(c, label) { console.log((c ? "PASS " : "FAIL ") + label); if (!c) fail++; }

/* ---------- Part 1: engine vs demo corpus ---------- */
console.log("--- engine (demo corpus) ---");
{
  const T = loadContext(["data.demo.js", "gaps.js"]);
  const gap = id => T.computeGaps().gaps.find(g => g.id === id);
  const r = T.computeGaps();
  ok(r.gaps.length >= 25, "finds 25+ gaps, got " + r.gaps.length);
  ok(r.gaps[0].score >= r.gaps[r.gaps.length - 1].score, "gaps sorted desc by score");

  const a01 = gap("gap-A01");
  ok(!!a01 && a01.type === "assumption", "A01 gap exists");
  ok(a01.refs.rely.length === 11 && a01.refs.test.length === 0, "A01: 11 rely, 0 test (got " + a01.refs.rely.length + "/" + a01.refs.test.length + ")");
  ok(a01.score >= 90, "A01 is top-severity, got " + a01.score);
  ok(r.gaps[0].id === "gap-A01", "A01 is the #1 gap");

  const a02 = gap("gap-A02");
  ok(a02.refs.rely.length === 4 && a02.refs.test.length === 0, "A02: 4 rely, 0 test");

  const contra = gap("gap-contra-C12");
  ok(!!contra && contra.type === "contradiction", "WNPRC vs NIA contradiction found");
  ok(contra.refs.support.indexOf("P22") >= 0 && contra.refs.contra.indexOf("P23") >= 0, "contradiction pairs P22 vs P23");

  const rep = r.gaps.find(g => g.type === "replication");
  ok(!!rep, "at least one replication-debt gap");

  const miss = r.gaps.find(g => g.type === "missing" && g.refs.claim === "C01" && g.refs.model === "human");
  ok(!!miss, "missing experiment: C01 never tested in human");

  const sil = r.gaps.find(g => g.type === "silence");
  ok(!!sil, "at least one silent-subfields gap");

  const exp = T.draftExperiment(a01, r.ix);
  ok(exp.title.length > 10 && exp.design.Design.length > 40, "experiment draft has real content");
  ok(exp.design["Cost band"] && exp.design.Duration, "experiment draft has cost + duration");
  const exp2 = T.draftExperiment(contra, r.ix);
  ok(exp2.design.Approach.toLowerCase().indexOf("adversarial") >= 0, "contradiction -> adversarial collaboration design");
}

/* ---------- Part 2: real corpus ---------- */
console.log("--- real corpus (data.js) ---");
{
  const T = loadContext(["data.js", "gaps.js"]);
  ok(T.PAPERS.length >= 150, "real corpus has 150+ papers, got " + T.PAPERS.length);
  ok(T.CLAIMS.length >= 20, "real corpus has 20+ claims, got " + T.CLAIMS.length);
  ok(T.ASSUMPTIONS.length === 15, "15 assumptions kept, got " + T.ASSUMPTIONS.length);

  const pids = new Set(T.PAPERS.map(p => p.id));
  ok(pids.size === T.PAPERS.length, "paper ids unique");
  const cids = new Set(T.CLAIMS.map(c => c.id));
  const aids = new Set(T.ASSUMPTIONS.map(a => a.id));
  let dangling = 0, empty = 0;
  T.PAPERS.forEach(p => {
    if (!p.title || !p.authors.length || !p.year) empty++;
    ["asserts", "contradicts"].forEach(k => (p[k] || []).forEach(c => { if (!cids.has(c)) dangling++; }));
    ["reliesOn", "tests"].forEach(k => (p[k] || []).forEach(a => { if (!aids.has(a)) dangling++; }));
    (p.cites || []).forEach(q => { if (!pids.has(q)) dangling++; });
  });
  ok(empty === 0, "every paper has title/authors/year");
  ok(dangling === 0, "no dangling links, got " + dangling);

  ok(T.ASSUMPTIONS.every(a => a.trials && typeof a.trials.term === "string"), "every assumption has a trial cross-check");
  ok(T.ASSUMPTIONS.every(a => a.blueprint && a.blueprint.design), "every assumption keeps its study blueprint");

  const r = T.computeGaps();
  ok(r.gaps.length >= 20, "real corpus yields 20+ gaps, got " + r.gaps.length);
  ok(r.gaps[0].score >= r.gaps[r.gaps.length - 1].score, "real gaps sorted desc by score");
  const agaps = r.gaps.filter(g => g.type === "assumption");
  ok(agaps.length >= 8, "8+ untested-assumption gaps, got " + agaps.length);
  const cgaps = r.gaps.filter(g => g.type === "contradiction");
  ok(cgaps.length >= 1, "at least one contradiction gap, got " + cgaps.length);
  const top = r.gaps[0];
  ok(top.score >= 50, "top gap is high-severity, got " + top.score + " (" + top.id + ")");
  const withTrials = agaps.filter(g => /ClinicalTrials\.gov/.test(g.summary)).length;
  ok(withTrials === agaps.length, "every assumption gap carries the trial cross-check (" + withTrials + "/" + agaps.length + ")");

  const exp = T.draftExperiment(top, r.ix);
  ok(exp.title.length > 10 && exp.design["Cost band"], "study-lab draft works on real gaps");
}

console.log(fail ? "\n" + fail + " FAILURES" : "\nALL GAP TESTS PASSED");
process.exit(fail ? 1 : 0);
