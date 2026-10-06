#!/usr/bin/env node
/* UNKNOWN-UNKNOWN ingest — builds data.js from REAL literature.
 *
 * Sources:
 *   - OpenAlex (https://api.openalex.org) — papers, abstracts, citation edges. Free, no key.
 *   - ClinicalTrials.gov API v2 — registered-trial counts per assumption (the "actionability" cross-check).
 *
 * Pipeline:
 *   1. Per-subfield topic queries -> works (select fields only, has_abstract filter).
 *   2. Dedupe by DOI / normalized title; keep top-N per subfield by cited_by_count.
 *   3. Landmark claims: top-cited paper per subfield becomes a claim (title as claim text).
 *      Other papers with high title-token overlap also assert it.
 *   4. Contradictions: abstract matches negation language AND (cites the landmark in-corpus
 *      OR high title overlap) -> contradicts.
 *   5. Assumption links: keyword rules per assumption (rely/test). See METHOD.md.
 *   6. cites edges: referenced_works intersected with corpus OpenAlex IDs (real citation graph).
 *   7. Trials: per-assumption ClinicalTrials.gov totalCount.
 *
 * Heuristic linking is documented honestly in METHOD.md — the gap engine (gaps.js) then
 * computes every gap from the resulting link structure; no gap content is hardcoded.
 *
 * Usage: node tools/ingest.js [--per-sub N] [--out data.js]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MAILTO = "ingest@unknown-unknown.pages.dev";

const args = process.argv.slice(2);
function arg(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}
const PER_SUB = parseInt(arg("--per-sub", "60"), 10);
const OUT = path.join(ROOT, arg("--out", "data.js"));
const CLAIMS_PER_SUB = 7;

const SUBFIELDS = {
  mtor: "mTOR & Nutrient Sensing",
  sen: "Cellular Senescence",
  nad: "NAD+ & Sirtuins",
  met: "Metabolic Drugs",
  diet: "Dietary Restriction",
  mito: "Mitochondria & Mitophagy",
  epi: "Epigenetic Aging",
  repro: "Reprogramming & Stem Cells",
};

const QUERIES = {
  mtor: "rapamycin mTOR aging lifespan",
  sen: "senolytics senescent cells aging",
  nad: "NAD+ nicotinamide riboside aging longevity",
  met: "metformin aging longevity",
  diet: "caloric restriction fasting aging lifespan",
  mito: "mitophagy mitochondrial dysfunction aging",
  epi: "epigenetic clock aging",
  repro: "partial reprogramming aging rejuvenation",
};

/* Assumption link rules. rely/test: paper matches if subfield in list (or any when empty)
 * AND model in list (or any) AND every `all` regex matches AND at least one `any` regex matches.
 * Text searched = title + " " + abstract, lowercased. */
const ASSUMPTIONS = [
  { id: "A01", text: "Lifespan extension in short-lived, inbred mouse strains predicts benefit in humans.",
    trialTerm: "aging biomarker",
    rely: { sub: [], model: ["mouse"], all: [], any: [/\blifespan\b/, /\blongevity\b/, /\bhealthspan\b/] },
    test: { sub: [], model: ["human"], all: [], any: [/\bmous[ei]\b/, /\bmurine\b/, /translat/] } },
  { id: "A02", text: "No essential senescent-cell populations are lost when senescent cells are cleared systemically.",
    trialTerm: "senolytic",
    rely: { sub: ["sen"], model: [], all: [/\bsenescent\b/], any: [/senolytic/, /clearance/, /clearing/, /ablation/, /deplet/] },
    test: { sub: ["sen"], model: [], all: [], any: [/macrophage/, /progenitor/, /off-target/, /essential/, /wound healing/] } },
  { id: "A03", text: "Age-related NAD+ decline is a cause of aging, not a consequence of it.",
    trialTerm: "nicotinamide riboside aging",
    rely: { sub: ["nad"], model: [], all: [], any: [/supplement/, /\bNR\b/, /\bNMN\b/, /nicotinamide/, /NAD\+?/] },
    test: { sub: ["nad"], model: [], all: [], any: [/mendelian randomization/, /causal inference/, /\bcausal\b/] } },
  { id: "A04", text: "Deceleration of an epigenetic clock equals genuine biological rejuvenation.",
    trialTerm: "epigenetic clock",
    rely: { sub: ["epi"], model: [], all: [], any: [/clock/, /epigenetic age/, /methylation age/, /grimage/] },
    test: { sub: ["epi"], model: [], all: [], any: [/\blifespan\b/] } },
  { id: "A05", text: "Chronic mTOR inhibition's longevity benefits outweigh its metabolic and immune costs.",
    trialTerm: "rapamycin aging",
    rely: { sub: ["mtor"], model: [], all: [], any: [/rapamycin/, /everolimus/, /mtor/] },
    test: { sub: ["mtor"], model: [], all: [], any: [/adverse/, /glucose/, /diabet/, /infection/, /immune/, /side effect/] } },
  { id: "A06", text: "Caloric-restriction mechanisms found in rodents apply to humans despite metabolic differences.",
    trialTerm: "caloric restriction aging",
    rely: { sub: ["diet"], model: [], all: [], any: [/caloric restriction/, /calorie restriction/] },
    test: { sub: ["diet"], model: ["human"], all: [], any: [/caloric restriction/, /calorie restriction/] } },
  { id: "A07", text: "In-vitro senescence markers (p16INK4a, SA-β-gal) faithfully identify senescent cells in vivo.",
    trialTerm: "senescence biomarker p16",
    rely: { sub: ["sen"], model: [], all: [], any: [/\bp16\b/, /sa-β-gal/, /sa-beta-gal/, /beta-galactosidase/, /senescence marker/] },
    test: { sub: ["sen"], model: [], all: [], any: [/macrophage/, /specificity/, /false positive/, /not specific/, /not exclusive/] } },
  { id: "A08", text: "Transient partial reprogramming can be made safe — no teratoma or pluripotency risk.",
    trialTerm: "partial reprogramming",
    rely: { sub: ["repro"], model: [], all: [], any: [/reprogramming/, /\bOSK\b/, /\bOSKM\b/, /yamanaka/] },
    test: { sub: ["repro"], model: [], all: [], any: [/teratoma/, /tumo[u]?r/, /safety/, /safe/] } },
  { id: "A09", text: "Healthspan gains in mice imply lifespan gains (and vice versa).",
    trialTerm: "healthspan",
    rely: { sub: [], model: [], all: [], any: [/\bhealthspan\b/] },
    test: { sub: [], model: [], all: [/\bhealthspan\b/], any: [/\blifespan\b/] } },
  { id: "A10", text: "Aging is driven by a targetable program rather than stochastic damage accumulation.",
    trialTerm: "aging mechanism",
    rely: { sub: [], model: [], all: [], any: [/programmed aging/, /aging program/, /quasi-program/] },
    test: { sub: [], model: [], all: [/programmed aging|aging program|quasi-program/], any: [/stochastic/, /damage accumulation/] } },
  { id: "A11", text: "Mouse epigenetic clocks measure the same biology as human epigenetic clocks.",
    trialTerm: "epigenetic clock",
    rely: { sub: ["epi"], model: [], all: [/clock/], any: [/\bmous[ei]\b/, /\bmurine\b/] },
    test: { sub: ["epi"], model: [], all: [/clock/], any: [/ortholog/, /conserved/, /cross-species/, /compar/] } },
  { id: "A12", text: "Metformin's observational longevity signal is not explained by indication bias or confounding.",
    trialTerm: "metformin aging",
    rely: { sub: ["met"], model: ["human"], all: [], any: [/observational/, /cohort/, /associated with/, /retrospective/] },
    test: { sub: ["met"], model: [], all: [], any: [/confound/, /emulat/, /mendelian/, /\bbias\b/, /indication/] } },
  { id: "A13", text: "Mitochondrial dysfunction is upstream of the other hallmarks of aging.",
    trialTerm: "mitophagy",
    rely: { sub: ["mito"], model: [], all: [], any: [/mitochondrial dysfunction/, /mitophagy/] },
    test: { sub: ["mito"], model: [], all: [], any: [/\bcausal\b/, /temporal/, /precede/, /upstream/] } },
  { id: "A14", text: "Senolytic benefits persist after drug clearance — intermittent 'hit-and-run' dosing is sufficient.",
    trialTerm: "senolytic",
    rely: { sub: ["sen"], model: [], all: [/senolytic/], any: [/intermittent/, /periodic/, /single dose/, /hit-and-run/] },
    test: { sub: ["sen"], model: [], all: [], any: [/durability/, /re-accumulat/, /follow-up/, /persist/, /long-term/] } },
  { id: "A15", text: "Periodic fasting produces the same core mechanisms as chronic caloric restriction.",
    trialTerm: "fasting mimicking diet aging",
    rely: { sub: ["diet"], model: [], all: [], any: [/fasting/, /fasting-mimicking/, /time-restricted/] },
    test: { sub: ["diet"], model: [], all: [/fasting|fasting-mimicking|time-restricted/], any: [/caloric restriction/, /calorie restriction/] } },
];

/* Curated blueprints stay hand-written: they are the instrument's study-design lens,
 * not literature data. Carried over verbatim from the demo corpus. */
const BLUEPRINTS = JSON.parse(fs.readFileSync(path.join(__dirname, "blueprints.json"), "utf8"));

const STOP = new Set(("a,an,the,and,or,of,in,on,for,to,with,from,by,as,at,is,are,was,were,be,been,that,this,these,those,it,its,into,between,among,via,vs,versus,new,novel,using,use,used,study,studies,effect,effects,role,review").split(","));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJSON(url, tries = 8) {
  for (let t = 0; t < tries; t++) {
    const res = await fetch(url, { headers: { "User-Agent": "unknown-unknown-search/1.0 (mailto:" + MAILTO + ")" } });
    if (res.status === 429 || res.status >= 500) {
      const ra = parseInt(res.headers.get("retry-after") || "0", 10);
      await sleep(Math.max(ra * 1000, 2500 * (t + 1)));
      continue;
    }
    if (!res.ok) throw new Error("HTTP " + res.status + " for " + url.slice(0, 120));
    return res.json();
  }
  throw new Error("gave up after retries: " + url.slice(0, 120));
}

function abstractOf(w) {
  const inv = w.abstract_inverted_index;
  if (!inv) return "";
  const words = [];
  for (const [word, posns] of Object.entries(inv)) posns.forEach(p => { words[p] = word; });
  return words.join(" ");
}

async function fetchSubfield(key, query) {
  const sel = "id,doi,title,authorships,publication_year,primary_location,abstract_inverted_index,cited_by_count,referenced_works,type";
  const url = "https://api.openalex.org/works?search=" + encodeURIComponent(query) +
    "&filter=from_publication_date:2000-01-01,type:article|review,has_abstract:true" +
    "&select=" + sel + "&per-page=150&mailto=" + encodeURIComponent(MAILTO);
  const data = await fetchJSON(url);
  console.log("  " + key + ": " + data.meta.count + " hits, took " + data.results.length);
  return data.results.map(w => ({
    oa: w.id.replace("https://openalex.org/", ""),
    doi: w.doi || null,
    title: (w.title || "").trim(),
    authors: (w.authorships || []).slice(0, 4).map(a => a.author && a.author.display_name).filter(Boolean),
    year: w.publication_year || null,
    venue: (w.primary_location && w.primary_location.source && w.primary_location.source.display_name) || "preprint",
    abstract: abstractOf(w),
    cited: w.cited_by_count || 0,
    kind: w.type || "article",
    refs: (w.referenced_works || []).map(r => r.replace("https://openalex.org/", "")),
    subfield: key,
  })).filter(p => p.title && p.abstract && p.year);
}

function normTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function tokens(t) {
  return normTitle(t).split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}

const MODEL_RES = [
  ["monkey", /\b(monkey|rhesus|macaque|primate|baboon)\b/],
  ["human", /\b(human|patients?|volunteers?|clinical trial|women|men|elderly|cohort|RCT)\b/],
  ["mouse", /\b(mice|mouse|murine)\b/],
  ["cell", /\b(in vitro|cell line|fibroblasts?|cultured cells?)\b/],
  ["worm", /\b(c\. ?elegans|nematode|drosophila|worm|fly|flies)\b/],
];
function detectModel(p) {
  const text = (p.title + " " + p.abstract).toLowerCase();
  let best = null, bestN = 0;
  for (const [m, re] of MODEL_RES) {
    const n = (text.match(new RegExp(re.source, "g")) || []).length;
    if (n > bestN) { bestN = n; best = m; }
  }
  return best || "multi"; // "multi" = model not resolved from abstract
}

const METHOD_RES = [
  ["lifespan assay", /\blifespan\b/],
  ["randomized trial", /randomi[sz]ed/],
  ["meta-analysis", /meta-analy/],
  ["longitudinal", /longitudinal/],
  ["single-cell profiling", /single-cell|scRNA/],
  ["Mendelian randomization", /mendelian/],
  ["systematic review", /systematic review/],
  ["proteomics", /proteom/],
];
function detectMethods(p) {
  const text = (p.title + " " + p.abstract).toLowerCase();
  const out = [];
  for (const [label, re] of METHOD_RES) if (re.test(text) && out.length < 3) out.push(label);
  return out;
}

function ruleMatch(rule, p) {
  if (rule.sub.length && !rule.sub.includes(p.subfield)) return false;
  if (rule.model.length && !rule.model.includes(p.model)) return false;
  const text = (p.title + " " + p.abstract).toLowerCase();
  if (rule.all.length && !rule.all.every(re => re.test(text))) return false;
  if (rule.any.length && !rule.any.some(re => re.test(text))) return false;
  return true;
}

const NEGATION = /\b(fail(?:ed|s)? to|does not|did not|no (?:significant|evidence|effect|benefit|improvement)|unable to|refute[sd]?|contrary to|negative (?:result|finding|outcome)|lack of|not (?:extend|improve|increase|reduce|associate|prolong))\b/i;

async function trialCount(term) {
  if (!term) return null;
  const url = "https://clinicaltrials.gov/api/v2/studies?query.term=" + encodeURIComponent(term) + "&countTotal=true&pageSize=1&fields=NCTId";
  try {
    const d = await fetchJSON(url);
    return { term, count: d.totalCount || 0, url: "https://clinicaltrials.gov/search?term=" + encodeURIComponent(term) };
  } catch (e) {
    console.log("  trial query failed for '" + term + "': " + e.message);
    return { term, count: null, url: "https://clinicaltrials.gov/search?term=" + encodeURIComponent(term) };
  }
}

function cleanTitle(t) {
  return t.replace(/\s+/g, " ").trim().replace(/[.:\s]+$/, "");
}

async function main() {
  console.log("fetching OpenAlex...");
  let all = [];
  for (const key of Object.keys(QUERIES)) {
    const papers = await fetchSubfield(key, QUERIES[key]);
    all.push(...papers);
    await sleep(2500);
  }
  console.log("raw: " + all.length);

  // dedupe by DOI, then normalized title
  const seen = new Set(), deduped = [];
  for (const p of all) {
    const k = (p.doi || "").toLowerCase() || ("t:" + normTitle(p.title));
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(p);
  }
  console.log("deduped: " + deduped.length);

  // top-N per subfield by citations
  const bySub = {};
  deduped.forEach(p => { (bySub[p.subfield] = bySub[p.subfield] || []).push(p); });
  let corpus = [];
  for (const key of Object.keys(bySub)) {
    bySub[key].sort((a, b) => b.cited - a.cited);
    corpus.push(...bySub[key].slice(0, PER_SUB));
  }
  corpus.forEach(p => { p.model = detectModel(p); p.methods = detectMethods(p); });
  console.log("corpus: " + corpus.length);

  // citation edges within corpus
  const oaToId = {};
  corpus.forEach((p, i) => { p.id = "P" + String(i + 1).padStart(3, "0"); oaToId[p.oa] = p.id; });
  corpus.forEach(p => { p.cites = p.refs.filter(r => oaToId[r]).map(r => oaToId[r]); delete p.refs; });

  // landmark claims: top-cited per subfield — primary research only (reviews make poor claims)
  const CLAIMS = [];
  const claimBySub = {};
  let cn = 0;
  for (const key of Object.keys(bySub)) {
    const pool = corpus.filter(p => p.subfield === key);
    const articles = pool.filter(p => p.kind === "article");
    const top = (articles.length >= 3 ? articles : pool).sort((a, b) => b.cited - a.cited).slice(0, CLAIMS_PER_SUB);
    top.forEach(p => {
      cn++;
      const cid = "C" + String(cn).padStart(3, "0");
      CLAIMS.push({ id: cid, text: cleanTitle(p.title), subfield: key, models: [p.model], origin: p.id });
      (claimBySub[key] = claimBySub[key] || []).push({ cid, paper: p });
    });
  }
  const claimById = {};
  CLAIMS.forEach(c => { claimById[c.id] = c; });

  // paper -> claim links
  const tokCache = {};
  corpus.forEach(p => { tokCache[p.id] = tokens(p.title); });
  corpus.forEach(p => {
    p.asserts = []; p.contradicts = [];
    const cands = claimBySub[p.subfield] || [];
    for (const { cid, paper: origin } of cands) {
      if (p.id === origin.id) { p.asserts.push(cid); continue; }
      const sim = jaccard(tokCache[p.id], tokens(claimById[cid].text));
      if (sim >= 0.55) { p.asserts.push(cid); continue; }
      // contradiction requires a real citation of the landmark: negation language alone is too noisy
      if (NEGATION.test(p.abstract) && p.cites.includes(origin.id)) p.contradicts.push(cid);
    }
  });
  // claim models: union of supporting papers' models
  CLAIMS.forEach(c => {
    const ms = new Set();
    corpus.forEach(p => { if (p.asserts.includes(c.id)) ms.add(p.model); });
    c.models = [...ms];
    delete c.origin;
  });

  // assumption links
  ASSUMPTIONS.forEach(a => {
    a.relyPapers = corpus.filter(p => ruleMatch(a.rely, p)).map(p => p.id);
    a.testPapers = corpus.filter(p => ruleMatch(a.test, p)).map(p => p.id);
  });
  corpus.forEach(p => {
    p.reliesOn = ASSUMPTIONS.filter(a => a.relyPapers.includes(p.id)).map(a => a.id);
    p.tests = ASSUMPTIONS.filter(a => a.testPapers.includes(p.id)).map(a => a.id);
  });

  // trials cross-check
  console.log("fetching ClinicalTrials.gov counts...");
  for (const a of ASSUMPTIONS) {
    a.trials = await trialCount(a.trialTerm);
    console.log("  " + a.id + " '" + a.trialTerm + "': " + (a.trials && a.trials.count));
    await sleep(300);
  }

  // emit
  const date = new Date().toISOString().slice(0, 10);
  const q = s => JSON.stringify(s);
  let out = "/* UNKNOWN-UNKNOWN — REAL corpus, generated by tools/ingest.js on " + date + ".\n" +
    "   " + corpus.length + " papers from OpenAlex (longevity queries across 8 subfields).\n" +
    "   Claims = landmark papers (title as claim text); assumption links = keyword heuristics.\n" +
    "   Method: tools/METHOD.md. All gaps are COMPUTED from these links by gaps.js.\n" +
    "   Regenerate: node tools/ingest.js. Demo corpus preserved in data.demo.js. */\n\n" +
    "const INGESTED_AT = " + q(date) + ";\n\n" +
    "const SUBFIELDS = " + JSON.stringify(SUBFIELDS, null, 2) + ";\n\n" +
    "const ASSUMPTIONS = [\n" + ASSUMPTIONS.map(a => {
      const bp = BLUEPRINTS[a.id];
      return "  { id: " + q(a.id) + ", text: " + q(a.text) + ",\n" +
        "    trials: " + JSON.stringify(a.trials) + ",\n" +
        "    blueprint: " + JSON.stringify(bp, null, 6).replace(/\n/g, "\n    ") + " },";
    }).join("\n") + "\n];\n\n" +
    "const CLAIMS = " + JSON.stringify(CLAIMS.map(({ id, text, subfield, models }) => ({ id, text, subfield, models })), null, 2) + ";\n\n" +
    "/* asserts: claim ids the paper supports · contradicts: claim ids it argues against\n" +
    "   reliesOn: assumption ids the conclusions depend on · tests: assumption ids directly probed */\n" +
    "const PAPERS = [\n" + corpus.map(p => {
      return "  { id: " + q(p.id) + ", title: " + q(p.title) + ",\n" +
        "    authors: " + q(p.authors) + ", year: " + p.year + ", venue: " + q(p.venue) + ", subfield: " + q(p.subfield) + ", model: " + q(p.model) + ",\n" +
        "    citedByCount: " + p.cited + (p.doi ? ", doi: " + q(p.doi.replace(/^https?:\/\/doi.org\//, "")) : "") + ", kind: " + q(p.kind) + ",\n" +
        "    asserts: " + q(p.asserts) + ", contradicts: " + q(p.contradicts) + ", reliesOn: " + q(p.reliesOn) + ", tests: " + q(p.tests) + ",\n" +
        "    methods: " + q(p.methods) + ", cites: " + q(p.cites) + " },";
    }).join("\n") + "\n];\n";

  fs.writeFileSync(OUT, out);
  console.log("wrote " + OUT + " (" + (fs.statSync(OUT).size / 1024).toFixed(0) + " KB)");

  // summary stats
  const nAssert = corpus.filter(p => p.asserts.length).length;
  const nContra = corpus.filter(p => p.contradicts.length).length;
  const nRely = corpus.filter(p => p.reliesOn.length).length;
  const nCites = corpus.reduce((n, p) => n + p.cites.length, 0);
  console.log("links: " + nAssert + " papers assert, " + nContra + " contradict, " + nRely + " relyOn, " + nCites + " cite-edges");
  console.log("claims: " + CLAIMS.length);
}

main().catch(e => { console.error("INGEST FAILED: " + e.message); process.exit(1); });
