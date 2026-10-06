/* UNKNOWN-UNKNOWN — gap engine.
   Derives every gap from the corpus link structure (papers.asserts/contradicts/
   reliesOn/tests/cites). No gap content is hardcoded; change the corpus and the
   feed re-ranks. Node-compatible (no browser globals) so it can be unit-tested. */

function buildIndex() {
  const paperById = {}, claimById = {}, assumpById = {};
  PAPERS.forEach(p => { paperById[p.id] = p; });
  CLAIMS.forEach(c => { claimById[c.id] = c; });
  ASSUMPTIONS.forEach(a => { assumpById[a.id] = a; });

  const claimSupport = {}, claimContra = {};
  CLAIMS.forEach(c => { claimSupport[c.id] = []; claimContra[c.id] = []; });
  const assumeRely = {}, assumeTest = {};
  ASSUMPTIONS.forEach(a => { assumeRely[a.id] = []; assumeTest[a.id] = []; });
  const citedBy = {};
  PAPERS.forEach(p => { citedBy[p.id] = []; });

  PAPERS.forEach(p => {
    (p.asserts || []).forEach(cid => { if (claimSupport[cid]) claimSupport[cid].push(p.id); });
    (p.contradicts || []).forEach(cid => { if (claimContra[cid]) claimContra[cid].push(p.id); });
    (p.reliesOn || []).forEach(aid => { if (assumeRely[aid]) assumeRely[aid].push(p.id); });
    (p.tests || []).forEach(aid => { if (assumeTest[aid]) assumeTest[aid].push(p.id); });
    (p.cites || []).forEach(cid => { if (citedBy[cid]) citedBy[cid].push(p.id); });
  });

  return { paperById, claimById, assumpById, claimSupport, claimContra, assumeRely, assumeTest, citedBy };
}

const GAP_TYPES = {
  assumption:    { label: "UNTESTED ASSUMPTION", color: "#e06c8a" },
  contradiction: { label: "CONTRADICTION",       color: "#e8b64c" },
  replication:   { label: "REPLICATION DEBT",    color: "#59c2d8" },
  missing:       { label: "MISSING EXPERIMENT",  color: "#9d7bea" },
  silence:       { label: "SILENT SUBFIELDS",     color: "#7bc96f" },
};

function computeGaps() {
  const ix = buildIndex();
  const gaps = [];

  /* 1 — assumptions: high reliance, low direct testing */
  ASSUMPTIONS.forEach(a => {
    const rely = ix.assumeRely[a.id].length, test = ix.assumeTest[a.id].length;
    if (!rely) return;
    const raw = rely * Math.log10(1 + rely) / (1 + 2.5 * test);
    const score = Math.min(100, Math.round(30 * raw));
    const t = a.trials;
    const trialNote = t ? (t.count === 0
      ? " Zero registered trials test this premise (ClinicalTrials.gov) — the gap is wide open."
      : t.count ? " " + t.count + " registered trials touch this premise (ClinicalTrials.gov)." : "") : "";
    gaps.push({
      id: "gap-" + a.id, type: "assumption", score,
      title: a.text,
      headline: rely + " paper" + (rely === 1 ? "" : "s") + " rely on this · only " + test + " directly test" + (test === 1 ? "s" : "") + " it",
      summary: "Conclusions across " + rely + " papers depend on a premise that has " +
        (test ? "been probed " + test + "×" : "never been directly tested") + " in this corpus." + trialNote,
      refs: { assumption: a.id, rely: ix.assumeRely[a.id].slice(), test: ix.assumeTest[a.id].slice() },
    });
  });

  /* 2 — contradictions: a claim with both supporting and contradicting papers */
  CLAIMS.forEach(c => {
    const sup = ix.claimSupport[c.id], con = ix.claimContra[c.id];
    if (!sup.length || !con.length) return;
    const papers = sup.concat(con);
    const cites = papers.reduce((n, pid) => n + ix.citedBy[pid].length, 0);
    const score = Math.min(100, Math.round(8 * papers.length + 6 * cites));
    gaps.push({
      id: "gap-contra-" + c.id, type: "contradiction", score,
      title: c.text,
      headline: sup.length + " supporting vs " + con.length + " contradicting · " + cites + " downstream citations",
      summary: "The literature asserts both a claim and its negation. " + cites + " later papers cite into this dispute.",
      refs: { claim: c.id, support: sup.slice(), contra: con.slice() },
    });
  });

  /* 3 — replication debt: claimed once, cited often, never independently replicated */
  CLAIMS.forEach(c => {
    const sup = ix.claimSupport[c.id];
    if (sup.length !== 1) return;
    const cites = ix.citedBy[sup[0]].length;
    if (cites < 3) return;
    gaps.push({
      id: "gap-rep-" + c.id, type: "replication", score: Math.min(100, Math.round(9 * cites)),
      title: c.text,
      headline: "Claimed once · cited " + cites + "× · 0 independent replications",
      summary: "A single study originated this claim, yet " + cites + " papers build on it. The foundation is one experiment deep.",
      refs: { claim: c.id, origin: sup[0], citers: ix.citedBy[sup[0]].slice() },
    });
  });

  /* 4 — missing experiments: important claims never tested in a key model */
  const KEY_MODELS = ["mouse", "human", "monkey", "cell", "worm"];
  const missGaps = [];
  CLAIMS.forEach(c => {
    if (c.models.indexOf("multi") >= 0) return;
    const sup = ix.claimSupport[c.id];
    const cites = sup.reduce((n, pid) => n + ix.citedBy[pid].length, 0);
    const importance = sup.length + cites / 2;
    if (importance < 3) return;
    KEY_MODELS.forEach(m => {
      if (c.models.indexOf(m) >= 0) return;
      missGaps.push({
        id: "gap-miss-" + c.id + "-" + m, type: "missing",
        score: Math.min(100, Math.round(12 * importance)),
        title: c.text,
        headline: "Never tested in " + m + " · tested in " + c.models.join(", "),
        summary: "An influential claim (" + sup.length + " supporting, " + cites + " citations) has no " + m + " evidence in this corpus.",
        refs: { claim: c.id, model: m, support: sup.slice() },
      });
    });
  });
  missGaps.sort((a, b) => b.score - a.score);
  missGaps.slice(0, 12).forEach(g => gaps.push(g)); // keep the feed curated

  /* 5 — silent subfields: subfield pairs with ~no cross-citation */
  const sfIds = Object.keys(SUBFIELDS);
  const cross = {};
  sfIds.forEach(a => { cross[a] = {}; sfIds.forEach(b => { cross[a][b] = 0; }); });
  const sfSize = {};
  sfIds.forEach(s => { sfSize[s] = 0; });
  const silGaps = [];
  PAPERS.forEach(p => { sfSize[p.subfield]++; });
  PAPERS.forEach(p => {
    (p.cites || []).forEach(cid => {
      const q = ix.paperById[cid];
      if (q && q.subfield !== p.subfield) cross[p.subfield][q.subfield]++;
    });
  });
  for (let i = 0; i < sfIds.length; i++) for (let j = i + 1; j < sfIds.length; j++) {
    const a = sfIds[i], b = sfIds[j];
    if (sfSize[a] < 3 || sfSize[b] < 3) continue;
    const c = cross[a][b] + cross[b][a];
    if (c > 1) continue;
    // bigger subfields, more surprising the silence: size-weighted score
    silGaps.push({
      id: "gap-sil-" + a + "-" + b, type: "silence",
      score: Math.min(95, Math.round(40 + 3 * (sfSize[a] + sfSize[b]) - 14 * c)),
      title: SUBFIELDS[a] + " × " + SUBFIELDS[b],
      headline: c === 0 ? "Zero cross-citations between these subfields" : "One cross-citation between these subfields",
      summary: "Two active research areas (" + sfSize[a] + " + " + sfSize[b] + " papers) barely read each other. Shared mechanisms may be hiding in the silence.",
      refs: { subfields: [a, b] },
    });
  }
  silGaps.sort((x, y) => y.score - x.score);
  silGaps.slice(0, 8).forEach(g => gaps.push(g)); // the most surprising silences only

  gaps.sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1));
  return { gaps, ix };
}

/* ---------- missing-experiment generator ---------- */

function paperShort(ix, pid) {
  const p = ix.paperById[pid];
  return p.authors[0] + " " + p.year;
}

function draftExperiment(gap, ix) {
  const T = GAP_TYPES[gap.type];
  const exp = { kind: T.label, title: "", rationale: [], design: {}, why: "" };

  if (gap.type === "assumption") {
    const a = ix.assumpById[gap.refs.assumption], bp = a.blueprint;
    exp.title = "Direct test of " + a.id + ": " + bp.approach.toLowerCase();
    exp.rationale = [
      gap.refs.rely.length + " papers in this corpus depend on this premise.",
      "Only " + gap.refs.test.length + " probe it directly — a reliance-to-evidence ratio of " +
        gap.refs.rely.length + ":" + gap.refs.test.length + ".",
      "Affected claims include: " + affectedClaims(ix, gap.refs.rely).slice(0, 3).join("; ") + ".",
    ];
    exp.design = { Approach: bp.approach, Model: bp.model, Design: bp.design,
      "Primary endpoints": bp.endpoints.join(" · "), Duration: bp.duration, "Cost band": bp.cost };
    exp.why = "If the assumption fails, " + gap.refs.rely.length + " papers' conclusions need re-examination. If it holds, the field gains a load-bearing result.";
  } else if (gap.type === "contradiction") {
    const c = ix.claimById[gap.refs.claim];
    const s = gap.refs.support.map(pid => paperShort(ix, pid)).join(", ");
    const k = gap.refs.contra.map(pid => paperShort(ix, pid)).join(", ");
    exp.title = "Adversarial collaboration: " + c.text.toLowerCase();
    exp.rationale = [
      "Supporting: " + s + ". Contradicting: " + k + ".",
      "Both sides may be right under different conditions — the dispute itself is the finding.",
    ];
    exp.design = {
      Approach: "Pre-registered adversarial collaboration",
      Model: c.models.join(" + ") + " (both original models, harmonized)",
      Design: "Both camps co-design one protocol run in both labs. Factorial design varies the suspected moderators (strain, diet, dose, timing). All analysis pre-registered; raw data shared.",
      "Primary endpoints": "Replication of each original effect under harmonized conditions · moderator interaction tests",
      Duration: "2–3 years", "Cost band": "$2–5M",
    };
    exp.why = "Resolves whether the contradiction is methodological noise or a real biological moderator — either answer redirects the subfield.";
  } else if (gap.type === "replication") {
    const c = ix.claimById[gap.refs.claim];
    exp.title = "Independent replication: " + c.text.toLowerCase();
    exp.rationale = [
      "Originated once (" + paperShort(ix, gap.refs.origin) + "), cited " + gap.refs.citers.length + "× since.",
      "No independent replication exists in this corpus.",
    ];
    exp.design = {
      Approach: "Multi-lab pre-registered replication",
      Model: c.models.join(", "),
      Design: "Three independent labs run the original protocol from a shared, pre-registered recipe. Power set to detect 70% of the original effect size. Results published regardless of outcome.",
      "Primary endpoints": "Original primary outcome · heterogeneity across labs",
      Duration: "18–24 months", "Cost band": "$800K–2M",
    };
    exp.why = "Either cements a load-bearing claim or stops " + gap.refs.citers.length + " papers' worth of downstream work from building on sand.";
  } else if (gap.type === "missing") {
    const c = ix.claimById[gap.refs.claim], m = gap.refs.model;
    exp.title = "First " + m + " test of: " + c.text.toLowerCase();
    exp.rationale = [
      "Claim supported " + gap.refs.support.length + "×, tested only in " + c.models.join(", ") + ".",
      "The " + m + " context is the natural next rung of the evidence ladder.",
    ];
    exp.design = {
      Approach: m === "human" ? "Randomized controlled trial" : m === "monkey" ? "Primate longitudinal study" : "Controlled " + m + " study",
      Model: m,
      Design: m === "human"
        ? "Randomized, double-blind, placebo-controlled (n≈200, 12–24 mo). Primary: functional endpoints, not just biomarkers. Pre-registered."
        : "Match the original protocol's dosing/exposure as closely as the model allows; include both sexes; pre-register primary outcomes.",
      "Primary endpoints": m === "human" ? "Functional outcomes (walk speed, VO2max, frailty) · safety" : "Original effect size in the new model · dose response",
      Duration: m === "human" ? "2–3 years" : "12–18 months", "Cost band": m === "human" ? "$5–12M" : "$500K–2M",
    };
    exp.why = "Closes the most obvious rung missing from the evidence ladder for an influential claim.";
  } else {
    const [a, b] = gap.refs.subfields;
    exp.title = "Bridge study: " + SUBFIELDS[a] + " × " + SUBFIELDS[b];
    exp.rationale = [
      "These subfields have " + (gap.headline.indexOf("Zero") === 0 ? "zero" : "one") + " cross-citations — they are not reading each other.",
      "Shared mechanisms (or shared confounds) may be hiding in the silence.",
    ];
    exp.design = {
      Approach: "Joint-mechanism experiment",
      Model: "mouse + human biomarker panel",
      Design: "One experiment with readouts from BOTH subfields' standard assays (e.g., senescence burden + epigenetic clocks + mitochondrial respiration in the same animals). Co-authored across the divide; each side pre-registers its predicted outcome.",
      "Primary endpoints": "Cross-assay correlation matrix · which subfield's readout moves first",
      Duration: "2 years", "Cost band": "$1.5–3M",
    };
    exp.why = "Either discovers a shared mechanism or establishes genuine independence — both are publishable, field-shaping answers.";
  }
  return exp;
}

function affectedClaims(ix, pids) {
  const out = [];
  pids.forEach(pid => {
    const p = ix.paperById[pid];
    (p.asserts || []).forEach(cid => { if (out.indexOf(cid) < 0) out.push(ix.claimById[cid].text); });
  });
  return out;
}
