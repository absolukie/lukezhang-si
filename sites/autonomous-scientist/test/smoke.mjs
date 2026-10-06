/* Autonomous Scientist — smoke test.
   Hits the REAL OpenAlex + ClinicalTrials.gov APIs with a real query and
   asserts the evidence pipeline returns genuine records and builds a valid,
   fabrication-free cycle. Run: node test/smoke.mjs */
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const RealData = require("../real-data.js");

let pass = 0;
const ok = (cond, msg) => { assert(cond, msg); pass++; console.log("  ✓", msg); };

console.log("— unit: classifier —");
ok(RealData.classifyDesign("A meta-analysis of sleep", "") === "META-ANALYSIS", "meta-analysis detected");
ok(RealData.classifyDesign("Systematic review of light", "") === "SYS REVIEW", "systematic review detected");
ok(RealData.classifyDesign("A randomized controlled trial", "") === "RCT", "RCT detected");
ok(RealData.classifyDesign("Cohort study of napping", "") === "OBSERVATIONAL", "observational detected");
ok(RealData.classifyDesign("Mechanism of melatonin in mice", "") === "MECHANISTIC", "mechanistic detected");
ok(RealData.classifyDesign("Notes on rest", "") === "STUDY", "fallback STUDY");

console.log("— unit: abstract + cite —");
ok(RealData.reconstructAbstract({ hello: [0], world: [1] }) === "hello world", "inverted index reconstructed");
ok(RealData.citeName([{ author: { display_name: "Ada Lovelace" } }, { author: { display_name: "B Ob" } }]) === "Lovelace et al.", "et al. citation");
ok(RealData.snippet("  a  b  ", 100) === "a b", "snippet trims whitespace");

console.log("— live: fetchCycle('morning sunlight sleep') —");
const { papers, trials } = await RealData.fetchCycle("morning sunlight sleep");
ok(Array.isArray(papers) && papers.length >= 3, `got ${papers.length} real papers (>=3)`);
for (const p of papers.slice(0, 5)) {
  ok(p.title && p.title !== "(untitled)", `paper has title: ${p.title.slice(0, 50)}…`);
  ok(p.cite && p.year, `paper has cite+year: ${p.cite} ${p.year}`);
  ok(p.finding && p.finding.length > 10, "paper has abstract-derived finding");
  ok(["META-ANALYSIS","SYS REVIEW","RCT","TRIAL","OBSERVATIONAL","MECHANISTIC","PROTOCOL","STUDY"].includes(p.design), `design in known set: ${p.design}`);
}
ok(papers.some(p => p.doi), "at least one paper has a real DOI");
ok(Array.isArray(trials), `trials is an array (${trials.length} records)`);

console.log("— live: buildCycle honesty —");
const cyc = RealData.buildCycle("morning sunlight sleep", papers, trials);
ok(cyc.papers.length > 0 && cyc.synthesis.length >= 3, "synthesis bullets computed");
ok(cyc.hypotheses.length === 3, "3 hypotheses");
const psum = cyc.hypotheses.reduce((a, h) => a + h.prior, 0);
ok(Math.abs(psum - 1) < 0.02, `priors sum to ~1 (${psum.toFixed(3)})`);
ok(cyc.experiment.proposed === true, "experiment is proposed-only, never 'run'");
ok(cyc.newEvidence && cyc.newEvidence.cite, "new-evidence record present");
ok(cyc.review.length === 2 && cyc.review.every(r => r.objections.length === 3), "2 reviewers × 3 objections");
ok(cyc.review.every(r => r.objections.every(o => o.attack && o.reply && o.verdict)), "objections have attack/reply/verdict");
ok(cyc.report.claims.c1 && cyc.report.references.length > 0, "claims + real references");
ok(cyc.report.references.every(r => r.text.includes("doi") || r.text.length > 20), "references look real");
const blob = JSON.stringify(cyc);
for (const fabricated of ["d=0.42", "p=0.018", "n=120", "Harrison et al.", "Reyes et al. 2026"]) {
  ok(!blob.includes(fabricated), `no fabricated residue: "${fabricated}"`);
}
const oq = RealData.openQuestions(cyc);
ok(oq.length >= 4, `open questions generated (${oq.length})`);

console.log(`\nSMOKE OK — ${pass} assertions passed`);
