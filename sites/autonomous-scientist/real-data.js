/* Autonomous Scientist — live evidence clients + evidence-map model.
   Papers: OpenAlex (https://api.openalex.org) — free, no key.
   Trials: ClinicalTrials.gov API v2 — free, no key.
   No DOM dependencies (localStorage access is guarded) so this file is
   importable from the node smoke test. */
"use strict";
const RealData = (() => {
  const OA = "https://api.openalex.org/works";
  const CT = "https://clinicaltrials.gov/api/v2/studies";
  const CACHE_TTL = 24 * 3600 * 1000; // 24h

  const hasLS = () => typeof localStorage !== "undefined";
  const cacheKey = q => {
    let h = 7;
    const s = String(q).toLowerCase().trim();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return "asci_v1_" + (h >>> 0).toString(36);
  };
  function readCache(q){
    if (!hasLS()) return null;
    try {
      const raw = localStorage.getItem(cacheKey(q));
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (Date.now() - o.ts > CACHE_TTL) return null;
      return o.data;
    } catch (e){ return null; }
  }
  function writeCache(q, data){
    if (!hasLS()) return;
    try { localStorage.setItem(cacheKey(q), JSON.stringify({ ts: Date.now(), data })); }
    catch (e){ /* quota — ignore */ }
  }

  /* OpenAlex returns abstracts as an inverted index {word:[positions]}. */
  function reconstructAbstract(ii){
    if (!ii) return "";
    const pos = {};
    for (const w in ii){ const idxs = ii[w] || []; for (const i of idxs) pos[i] = w; }
    const keys = Object.keys(pos).map(Number).sort((a,b) => a - b);
    return keys.map(k => pos[k]).join(" ");
  }

  /* Heuristic design classification from title+abstract. Disclosed in the UI
     as heuristic — the machine does not read full text. */
  function classifyDesign(title, abstract){
    const t = ((title || "") + " " + (abstract || "")).toLowerCase();
    if (/meta.analysis|meta analysis/.test(t)) return "META-ANALYSIS";
    if (/systematic review/.test(t)) return "SYS REVIEW";
    if (/randomi[sz]ed|randomised controlled|randomized controlled|\brct\b/.test(t)) return "RCT";
    if (/\btrial\b/.test(t)) return "TRIAL";
    if (/cohort|longitudinal|cross.sectional|prospective study|retrospective|observational|epidemiolog/.test(t)) return "OBSERVATIONAL";
    if (/mechanism|pathway|in vitro|in vivo|murine|\bmouse\b|\bmice\b|\brat\b|knockout|cell line/.test(t)) return "MECHANISTIC";
    if (/protocol\b/.test(t)) return "PROTOCOL";
    return "STUDY";
  }

  function citeName(authorships){
    if (!authorships || !authorships.length) return "Unknown";
    const full = (authorships[0].author && authorships[0].author.display_name) || "Unknown";
    const fam = full.trim().split(/\s+/).slice(-1)[0] || full;
    return authorships.length > 1 ? fam + " et al." : fam;
  }

  function snippet(abs, n){
    const s = (abs || "").replace(/\s+/g, " ").trim();
    if (!s) return "(no abstract indexed in OpenAlex)";
    return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
  }

  async function fetchJSON(url, label){
    // one retry on 429 (shared-IP rate limits) with a short backoff
    for (let attempt = 0; attempt < 2; attempt++){
      const r = await fetch(url);
      if (r.ok) return r.json();
      if (r.status === 429 && attempt === 0){ await new Promise(res => setTimeout(res, 1500)); continue; }
      throw new Error(label + " HTTP " + r.status);
    }
  }

  async function fetchPapers(query, n){
    n = n || 10;
    const url = OA + "?search=" + encodeURIComponent(query) + "&per-page=" + n +
      "&select=id,doi,title,publication_year,authorships,primary_location,cited_by_count,type,abstract_inverted_index";
    const d = await fetchJSON(url, "OpenAlex");
    return (d.results || []).map((w, i) => {
      const abs = reconstructAbstract(w.abstract_inverted_index);
      const venue = (w.primary_location && w.primary_location.source && w.primary_location.source.display_name) || w.type || "work";
      return {
        id: "R" + (i + 1),
        title: w.title || "(untitled)",
        cite: citeName(w.authorships),
        year: w.publication_year || "—",
        venue: venue,
        design: classifyDesign(w.title, abs),
        citedBy: w.cited_by_count || 0,
        finding: snippet(abs, 320),
        doi: w.doi || null,
        url: w.id || null
      };
    });
  }

  async function fetchTrials(query, n){
    n = n || 10;
    const url = CT + "?query.term=" + encodeURIComponent(query) + "&pageSize=" + n + "&format=json";
    const d = await fetchJSON(url, "ClinicalTrials.gov");
    return (d.studies || []).map(s => {
      const p = s.protocolSection || {};
      const idm = p.identificationModule || {};
      const sm = p.statusModule || {};
      const dm = p.designModule || {};
      const enr = p.enrollmentInfo || {};
      const desc = p.descriptionModule || {};
      return {
        nctId: idm.nctId || "?",
        title: idm.briefTitle || idm.officialTitle || "(untitled)",
        status: sm.overallStatus || "UNKNOWN",
        enrollment: enr.count || 0,
        phase: (dm.phases && dm.phases.length ? dm.phases.join("/") : "—"),
        studyType: dm.studyType || "—",
        summary: snippet(desc.briefSummary, 300)
      };
    });
  }

  /* Papers + trials for a question. Falls back to cache on network failure;
     throws only if there is neither network nor cache. */
  async function fetchCycle(query){
    const cached = readCache(query);
    try {
      const [papers, trials] = await Promise.all([fetchPapers(query), fetchTrials(query)]);
      const data = { papers, trials };
      writeCache(query, data);
      return { papers, trials, fromCache: false };
    } catch (e) {
      if (cached) return { papers: cached.papers, trials: cached.trials, fromCache: true };
      throw e;
    }
  }

  /* ============ evidence-map model (no DOM) ============ */
  const TODAY = new Date().toISOString().slice(0, 10);
  function r2(x){ return Math.round(x * 100) / 100; }
  function fmtInt(n){ return (+n || 0).toLocaleString("en-US"); }
  function designCounts(papers){
    const d = {};
    papers.forEach(p => { d[p.design] = (d[p.design] || 0) + 1; });
    return d;
  }

  /* Turns live OpenAlex papers + ClinicalTrials.gov records into the cycle
     object the stage renderers consume. Nothing is fabricated:
     - stances (supports/contradicts) are never inferred
     - no trial is "run"; the protocol is proposed only
     - design labels are keyword heuristics, disclosed as such */
  function buildCycle(question, papers, trials){
    const q = String(question).trim();
    const P = papers.slice(0, 8);
    const T = trials.slice(0, 10);
    const dc = designCounts(P);
    const nMeta = (dc["META-ANALYSIS"] || 0) + (dc["SYS REVIEW"] || 0);
    const nRCT = dc["RCT"] || 0;
    const nTrial = nRCT + (dc["TRIAL"] || 0);
    const designList = Object.entries(dc).map(([k,v]) => `${v}× ${k.toLowerCase()}`).join(", ") || "no hits";
    const newest = P.slice().sort((a,b) => (+b.year || 0) - (+a.year || 0))[0];
    const mostCited = P.slice().sort((a,b) => b.citedBy - a.citedBy)[0];
    const completed = T.filter(t => t.status === "COMPLETED");
    const recruiting = T.filter(t => /RECRUITING/.test(t.status));
    const totalEnroll = T.reduce((a,t) => a + (+t.enrollment || 0), 0);
    const regNCTs = T.slice(0,4).map(t => t.nctId).join(", ");

    const synthesis = [
      `Top OpenAlex hits for this query: ${designList} — ranked by relevance, not screened by hand.`,
      mostCited ? `Most-cited hit: “${mostCited.title}” (${mostCited.cite}, ${mostCited.year}) — ${fmtInt(mostCited.citedBy)} citations.` : "No papers retrieved.",
      newest ? `Newest hit: ${newest.year} (${newest.cite}). Oldest in the pull: ${P.map(p=>+p.year).filter(y=>y>0).sort((a,b)=>a-b)[0] || "—"}.` : "",
      T.length
        ? `ClinicalTrials.gov: ${T.length} registered trial${T.length>1?"s":""} — ${completed.length} completed, ${recruiting.length} recruiting, ${fmtInt(totalEnroll)} total target enrollment.`
        : "ClinicalTrials.gov: zero registered trials matched this query — itself a finding.",
      "Stance is not machine-readable from metadata: the map classifies study designs, never verdicts. No claim below says the literature “supports” the effect."
    ].filter(Boolean);

    /* Priors from the evidence mix (documented formula):
       H1 (causal): 0.40 + 0.10 if ≥1 meta-analysis/sys-review + 0.05 if ≥1 RCT
       H2 (confound): 0.35 flat
       H3 (insufficient): 0.25 + 0.10 if fewer than 4 papers …normalized to 1 */
    let p1 = 0.40 + (nMeta > 0 ? 0.10 : 0) + (nRCT > 0 ? 0.05 : 0);
    let p2 = 0.35;
    let p3 = 0.25 + (P.length < 4 ? 0.10 : 0);
    const psum = p1 + p2 + p3; p1/=psum; p2/=psum; p3/=psum;
    const hypotheses = [
      { id:"H1", label:"Causal account",
        text:`The effect implied by “${q}” is real and causal — the mechanism genuinely moves the outcome.`,
        mechanism:`backed by ${nMeta} synthesis hit${nMeta===1?"":"s"} and ${nTrial} trial hit${nTrial===1?"":"s"} in the top results`,
        prior:r2(p1), posterior:r2(p1) },
      { id:"H2", label:"Confound account",
        text:"Observed associations are driven by confounding, reverse causation, or measurement choices — not the hypothesized mechanism.",
        mechanism:"residual confounding · healthy-user bias · publication bias",
        prior:r2(p2), posterior:r2(p2) },
      { id:"H3", label:"Insufficient evidence",
        text:"The retrieved evidence is too thin or too heterogeneous to support a conclusion either way.",
        mechanism:"—",
        prior:r2(p3), posterior:r2(p3) },
    ];

    const datasets = T.map(t => ({
      name:`${t.nctId} — ${t.title.length > 90 ? t.title.slice(0,90)+"…" : t.title}`,
      n: t.enrollment ? fmtInt(t.enrollment) + " target" : "n/a",
      vars:`${t.studyType} · ${t.phase !== "—" ? t.phase : "phase n/a"} · ${t.status.toLowerCase().replace(/_/g," ")}`,
      use: t.summary ? t.summary : "No summary posted on the registry record."
    }));

    const experiment = {
      id:"E1",
      title:`Proposed preregistered trial for: “${q.length > 70 ? q.slice(0,70)+"…" : q}”`,
      design: T.length
        ? `Parallel-group design modeled on the retrieved registry records (${regNCTs}). Population, duration and dosing finalized at preregistration; ${completed.length} completed precedent trial${completed.length===1?"":"s"} inform the power analysis.`
        : "Parallel-group design. No registry precedents were retrieved for this query, so design parameters would be set from the literature hits above.",
      outcome:"Primary outcome to be declared at preregistration — single planned test, analysis plan frozen before data collection.",
      prereg:"REQUIRED before running: one primary outcome, one planned test, predeclared handling of missing data. This trial has not been run.",
      arms:[],
      proposed:true,
      flaws:[
        "Abstract-level evidence only — full texts were not read.",
        "One search query deep — alternative phrasings may return a different corpus.",
        "No effect sizes or sample sizes available from OpenAlex metadata.",
        "Registry records describe intentions; completed-trial results were not pulled."
      ]
    };

    const ne = newest ? {
      tag:"MOST RECENT HIT · fresh evidence",
      cite:`${newest.cite} ${newest.year} — “${newest.title.length > 80 ? newest.title.slice(0,80)+"…" : newest.title}”`,
      finding: newest.finding,
      note:"Belief revised: the freshest record moves the posteriors slightly — the machine updates, it does not ignore.",
      recentDesign: newest.design,
      recentYear: +newest.year || 0
    } : { tag:"NO NEW EVIDENCE", cite:"—", finding:"No papers were retrieved, so there is nothing fresh to revise on.", note:"", recentDesign:"", recentYear:0 };
    // transparent update rule: +0.06 H3→H1 if the newest hit is a meta-analysis or RCT;
    // +0.04 H1→H3 if the newest hit is over 10 years old (stale map).
    let u1 = p1, u2 = p2, u3 = p3;
    if (ne.recentDesign === "META-ANALYSIS" || ne.recentDesign === "RCT"){ u1 += 0.06; u3 -= 0.06; }
    else if (ne.recentYear && ne.recentYear < (+TODAY.slice(0,4)) - 10){ u1 -= 0.04; u3 += 0.04; }
    ne.updates = [
      { hyp:"H1", from:r2(p1), to:r2(u1) },
      { hyp:"H2", from:r2(p2), to:r2(u2) },
      { hyp:"H3", from:r2(p3), to:r2(u3) },
    ];
    hypotheses[0].posterior = r2(u1); hypotheses[1].posterior = r2(u2); hypotheses[2].posterior = r2(u3);

    const distinctDesigns = Object.keys(dc).length;
    const review = [
      { name:"Dr. Mara Voss", role:"METHODOLOGIST", avatar:"🔬", objections:[
        { target:"Search depth",
          attack:`Your entire literature is one OpenAlex query — “${q}” — ranked by an opaque relevance score. Change two words, get a different corpus. You haven't screened a literature; you've screenshotted a search.`,
          reply:"Conceded in full. Every claim is scoped to “top hits for this query” — the report never says “the literature shows”. Search-dependence is listed as an open question.",
          verdict:"conceded", consequence:"All claims scoped to the retrieved pull; re-running with alternative queries added as an open question." },
        { target:"No effect sizes",
          attack:"OpenAlex hands you titles, abstracts and citation counts — no sample sizes, no effect sizes, no preregistration flags. You ranked by relevance, not by quality, and your “design” labels are keyword heuristics.",
          reply:"True, and disclosed. The heuristic is documented in Methods and every design tag is presented as a heuristic. Claim strengths are capped — nothing here asserts a direction or size of effect.",
          verdict:"conceded", consequence:"Claim strengths capped at moderate; no claim asserts direction or magnitude." },
        distinctDesigns >= 4
          ? { target:"Heterogeneity",
              attack:`Your pull mixes ${distinctDesigns} different study designs (${designList}). You're synthesizing across designs that answer different questions — a meta-analysis and a mouse mechanism study are not the same kind of evidence.`,
              reply:"Fair. The map presents the mix as a mix; it does not pool them. The heterogeneity is the finding, not a bug to average away.",
              verdict:"conceded", consequence:"Report presents design mix explicitly instead of a single pooled verdict." }
          : { target:"Thin corpus",
              attack:`${P.length} papers. That's not a literature, that's a reading list. H3 — insufficient evidence — should be doing more work in your posteriors.`,
              reply:"Agreed — and the prior formula already pushes weight to H3 when the pull is thin. The report's headline is the map's thinness, not a verdict.",
              verdict:"conceded", consequence:"H3 prior raised for thin pulls; report leads with corpus limits." },
      ]},
      { name:"Dr. Theo Lindqvist", role:"SKEPTIC", avatar:"🦉", objections:[
        { target:"Stance unknown",
          attack:"You classified designs, not conclusions. For all the machine knows, every RCT in your pull was null. Design ≠ verdict — and your hypothesis posteriors quietly assume otherwise.",
          reply:"The posteriors assume nothing about direction — H1's prior comes from the existence of synthesis-level work, not from its conclusions. But you're right that a reader could misread it, so the report states the gap explicitly.",
          verdict:"conceded", consequence:"Report states plainly: conclusions were not read; stance extraction is an open question." },
        { target:"Abstract-only",
          attack:"You read abstracts, not papers. Abstracts are advertisements — spin lives in the abstract, methods live in the full text you never opened.",
          reply:"Conceded. Every finding quoted is labeled abstract-level. Full-text stance extraction is beyond what metadata allows.",
          verdict:"conceded", consequence:"All findings flagged as abstract-level in the report." },
        T.length === 0
          ? { target:"Empty registry",
              attack:"Zero registered trials matched. Either the question is untestable as posed, or nobody has tried — both are findings, and neither is evidence for the effect.",
              reply:"Exactly right, and the map says so: the empty registry is presented as a gap, not as support. It becomes the first open question.",
              verdict:"conceded", consequence:"“Register a first trial” added as the top open question." }
          : completed.length === 0
          ? { target:"Intentions, not results",
              attack:`${T.length} registry records, zero completed. You're mapping intentions, not results — a trial that never finishes is not evidence.`,
              reply:"Conceded. The registry stage counts designs and enrollment targets; it claims nothing about outcomes. Pulling posted results for completed records is an open question.",
              verdict:"conceded", consequence:"Report distinguishes registered intent from completed evidence." }
          : { target:"Registry ≠ results",
              attack:`${completed.length} completed trial${completed.length===1?"":"s"} — but you didn't pull their posted results. Completion is not a finding.`,
              reply:"Fair hit. The registry pull covers design and enrollment; outcome extraction from posted results is the documented next step, listed as an open question.",
              verdict:"conceded", consequence:"Posted-results extraction added as an open question." },
      ]},
    ];

    const claimStrength = nMeta > 0 ? "moderate" : "weak";
    const trialClaimStrength = T.length >= 3 ? "moderate" : "weak";
    const claims = {
      c1:{ strength:claimStrength, prov: P.slice(0,3).map(p => ({ kind:"paper", ref:p.id, text:`${p.cite} ${p.year} — ${p.design.toLowerCase()}, cited by ${fmtInt(p.citedBy)}` })) },
      c2:{ strength:"moderate", prov: mostCited ? [{ kind:"paper", ref:mostCited.id, text:`“${mostCited.title}” — ${fmtInt(mostCited.citedBy)} citations, ${mostCited.venue} ${mostCited.year}` }] : [] },
      c3:{ strength:trialClaimStrength, prov: T.slice(0,3).map(t => ({ kind:"trial", ref:t.nctId, text:`${t.status.toLowerCase().replace(/_/g," ")} · target n=${fmtInt(t.enrollment)} · ${t.studyType.toLowerCase()}` })) },
      c4:{ strength:"strong", prov:[ { kind:"review", ref:"Lindqvist · stance", text:"Conceded: designs classified, conclusions not read" } ]},
      c5:{ strength:"strong", prov:[ { kind:"method", ref:"classifier", text:"Design labels are keyword heuristics on title+abstract — documented, not hidden" } ]},
      c6:{ strength:"strong", prov:[ { kind:"method", ref:"E1", text:"Protocol proposed only — no data collected, no results simulated" } ]},
      c7:{ strength: ne.recentDesign==="META-ANALYSIS"||ne.recentDesign==="RCT" ? "moderate" : "weak",
            prov: newest ? [{ kind:"paper", ref:newest.id, text:`Most recent hit: ${newest.cite} ${newest.year} (${newest.design.toLowerCase()})` }] : [] },
    };
    const largest = T.slice().sort((a,b)=>(b.enrollment||0)-(a.enrollment||0))[0];
    const report = {
      verdict:"LIVE EVIDENCE MAP",
      abstract:`We asked [[“${q}”|c1]]. A live OpenAlex search returned ${P.length} top hits (${designList}); [[the most-cited, “${mostCited ? mostCited.title : "—"}”, has ${mostCited ? fmtInt(mostCited.citedBy) : 0} citations|c2]]. ClinicalTrials.gov lists [[${T.length} registered trial${T.length===1?"":"s"} (${completed.length} completed, ${fmtInt(totalEnroll)} total target enrollment)|c3]]. [[Stance was never inferred — designs were classified, conclusions were not read|c4]] — and [[design labels are keyword heuristics, disclosed as such|c5]]. [[No trial was run here; the protocol is proposed, not executed|c6]]. Conclusion: [[this is a map of what exists to be read, not a verdict on what is true|c4]].`,
      sections:[
        { h:"Background", body:`The question: “${q}”. Retrieved ${P.length} papers spanning ${designList}. ${mostCited ? `The most-cited record is ${mostCited.cite} (${mostCited.year}), ${fmtInt(mostCited.citedBy)} citations — citations reward age and review-ness, not truth.` : ""} ${newest ? `The freshest record is from ${newest.year}.` : ""}` },
        { h:"Methods", body:`Query executed live against OpenAlex (papers, ranked by relevance) and ClinicalTrials.gov (registry), ${TODAY}; results cached 24h in-browser. [[Design labels come from a keyword heuristic over titles and abstracts — the machine did not read full text|c5]]. Hypotheses carry explicit priors set by the evidence mix (H1 gains when synthesis-level work exists; H3 gains when the pull is thin). The “new evidence” is the most recent hit; belief updates follow a fixed rule, documented above. [[Outcome extraction and stance detection are out of scope for metadata — listed as open questions|c4]].` },
        { h:"Results", body:`Papers: ${designList}. Trials: ${T.length} registered — ${completed.length} completed, ${recruiting.length} recruiting${T.length?`, target enrollment ${fmtInt(totalEnroll)}`:"." } ${largest ? `Largest: ${largest.nctId} (n=${fmtInt(largest.enrollment)} target).` : "The empty registry is itself the finding: an untested question."}` },
        { h:"Discussion", body:`What the map licenses: a reading list ordered by relevance, a registry inventory, and an honest accounting of what's missing. What it does not license: any claim about whether “${q.length > 60 ? q.slice(0,60)+"…" : q}” is true. The posteriors moved ${ne.recentDesign ? `on the ${ne.recentDesign.toLowerCase()} from ${ne.recentYear}` : "barely — thin evidence updates beliefs thinly"}. The strongest conclusion available is procedural: read the ${nMeta ? "syntheses" : "top hits"} first, then check the registry.` },
        { h:"Limitations", body:`[[Abstract-level only|c5]]; [[one query deep|c4]]; [[no effect sizes, no sample sizes, no preregistration flags in the metadata|c5]]; [[registry records describe intent, and posted results were not pulled|c6]]; [[the proposed trial ${experiment.id} is a draft — running it is future work|c6]].` },
      ],
      claims,
      references: P.map(p => ({ text:`${p.id} — ${p.cite} (${p.year}). ${p.title} ${p.venue}.`, doi:p.doi, url:p.url }))
    };

    return {
      id:"live", title:q, field:"LIVE LITERATURE · OPENALEX + CLINICALTRIALS.GOV", icon:"🔬",
      blurb:"Evidence map generated at runtime from real records.",
      meta:[["papers", P.length + " hits"], ["trials", T.length + " registered"], ["retrieved", TODAY]],
      papers:P, synthesis, hypotheses, datasets, experiment, newEvidence:ne, review, report,
      trials:T, fromCache:false
    };
  }

  function openQuestions(cyc){
    const out = [
      "Re-run with alternative phrasings — test how search-dependent this map is",
      "Full-text stance extraction: which top hits actually support the hypothesis?",
      `Run the proposed preregistered trial ${cyc.experiment.id}`,
    ];
    const completed = (cyc.trials||[]).filter(t => t.status === "COMPLETED");
    if (completed.length) out.push(`Pull posted results for ${completed.slice(0,3).map(t=>t.nctId).join(", ")}`);
    else out.push("Register a first trial — the registry came back empty for this query");
    return out;
  }

  return { fetchCycle, fetchPapers, fetchTrials, classifyDesign, reconstructAbstract, citeName, snippet,
           buildCycle, openQuestions, fmtInt };
})();
if (typeof module !== "undefined" && module.exports) module.exports = RealData;
