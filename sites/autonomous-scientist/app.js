/* Autonomous Scientist — stage engine, charts, tree, review, provenance.
   REAL-DATA BUILD: papers come live from OpenAlex, trials from ClinicalTrials.gov.
   buildCycle() turns those records into the evidence map below. Nothing is
   fabricated: stances are never inferred, no trial is "run", designs are
   heuristically classified and labeled as such. */
"use strict";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

const STAGES = [
  { id:"lit",    n:1, label:"Literature review",  icon:"📚" },
  { id:"hyp",    n:2, label:"Hypotheses",         icon:"🔮" },
  { id:"data",   n:3, label:"Trials registry",    icon:"🗄️" },
  { id:"design", n:4, label:"Experiment design",  icon:"🧪" },
  { id:"run",    n:5, label:"Registry evidence",  icon:"📊" },
  { id:"new",    n:6, label:"New evidence",       icon:"📡" },
  { id:"review", n:7, label:"Adversarial review", icon:"⚔️" },
  { id:"report", n:8, label:"Evidence map",       icon:"📜" },
];
const LOGS = {
  lit:"live pull: OpenAlex top hits · ranked by relevance · designs classified heuristically",
  hyp:"3 competing hypotheses formed · priors set by evidence mix, not vibes",
  data:"live pull: ClinicalTrials.gov registry records · real designs, real enrollment",
  design:"drafting a preregistered protocol… modeled on retrieved trials · NOT run — proposed only",
  run:"aggregating registry records — counting, not simulating",
  new:"checking the most recent hit — revising beliefs, not ignoring it",
  review:"2 reviewers assigned · instructed to attack, not to praise",
  report:"evidence map compiled · every claim carries its provenance · nothing fabricated",
};

const S = { q:null, stage:0, running:false, token:0, qtext:"" };

/* ---------- question picker ---------- */
function renderQuestions(){
  $("q-cards").innerHTML = DB.questions.map((q,i) =>
    `<button class="qcard" data-i="${i}">
       <div class="qf">${esc(q.field)}</div>
       <div class="qt">${q.icon} ${esc(q.title)}</div>
       <div class="qb">${esc(q.blurb)}</div>
       <div class="qmeta">${q.meta.map(m=>`<span>${esc(m[1])}</span>`).join("")}</div>
     </button>`).join("");
  $("q-cards").querySelectorAll(".qcard").forEach(c => c.addEventListener("click", () => {
    $("q-cards").querySelectorAll(".qcard").forEach(x => x.classList.remove("sel"));
    c.classList.add("sel");
    $("q-input").value = DB.questions[+c.dataset.i].title;
    syncRunBtn();
  }));
  $("q-input").addEventListener("input", () => {
    $("q-cards").querySelectorAll(".qcard").forEach(x => x.classList.remove("sel"));
    syncRunBtn();
  });
  $("q-input").addEventListener("keydown", e => { if (e.key === "Enter") $("run-btn").click(); });
}
function syncRunBtn(){
  const ready = $("q-input").value.trim().length > 0 && !S.running;
  $("run-btn").disabled = !ready;
  $("run-btn").textContent = ready ? "▶ Map the evidence" : "Type a question to begin";
}
$("run-btn").addEventListener("click", async () => {
  const qtext = $("q-input").value.trim();
  if (!qtext || S.running) return;
  S.running = true; S.qtext = qtext; S.token++;
  $("run-btn").disabled = true;
  $("run-btn").textContent = "⏳ querying OpenAlex + ClinicalTrials.gov…";
  $("q-err").style.display = "none";
  try {
    const { papers, trials, fromCache } = await RealData.fetchCycle(qtext);
    if (!papers.length && !trials.length) throw new Error("empty");
    S.q = RealData.buildCycle(qtext, papers, trials);
    S.q.fromCache = fromCache;
    $("q-field").textContent = S.q.field;
    $("q-title").textContent = S.q.icon + " " + (qtext.length > 90 ? qtext.slice(0,90) + "…" : qtext);
    $("stage-question").classList.remove("active");
    $("stage-cycle").classList.add("active");
    runCycle();
  } catch(e){
    S.running = false;
    const err = $("q-err");
    err.style.display = "block";
    err.innerHTML = `⚠️ Couldn't reach the literature APIs and no cached results exist for this query. Check your connection and <button class="btn small" id="retry-btn" style="margin-left:8px">try again</button>`;
    $("retry-btn").addEventListener("click", () => $("run-btn").click());
    syncRunBtn();
  }
});
$("replay-btn").addEventListener("click", () => {
  S.token++; S.running = false; S.q = null; S.stage = 0;
  $("stage-cycle").classList.remove("active"); $("stage-question").classList.add("active");
  $("q-input").value = "";
  renderQuestions(); syncRunBtn();
});

/* ---------- rail + log ---------- */
function renderRail(){
  $("stage-rail").innerHTML = STAGES.map((s,i) => {
    const cls = i < S.stage ? "done" : i === S.stage ? "active" : "locked";
    return `<button class="pill ${cls}" data-s="${i}"><span class="n">${i < S.stage ? "✓" : s.n}</span>${s.icon} ${s.label}</button>`;
  }).join("");
  $("stage-rail").querySelectorAll(".pill").forEach(p => p.addEventListener("click", () => {
    if (S.running || !S.q) return;
    const i = +p.dataset.s;
    if (i <= S.stage){ S.stage = i; renderRail(); renderStage(i, false); logLine(i); renderTree(); }
  }));
}
function logLine(i){
  let extra = "";
  if (S.q){
    if (STAGES[i].id === "lit") extra = ` · ${S.q.papers.length} hits${S.q.fromCache ? " (cached)" : ""}`;
    if (STAGES[i].id === "data") extra = ` · ${S.q.trials.length} records`;
  }
  $("log").innerHTML = `<span class="prompt">scientist@lab:~$</span> ${LOGS[STAGES[i].id]}${extra}`;
}

/* ---------- claim rich text ---------- */
function rich(text){
  return esc(text).replace(/\[\[([\s\S]*?)\|([a-z0-9]+)\]\]/g,
    (m, t, c) => {
      const cl = S.q && S.q.report.claims[c];
      const weak = cl && cl.strength === "weak" ? " weak" : "";
      return `<button class="claim${weak}" data-c="${c}">${t}</button>`;
    });
}
$("stage-body").addEventListener("click", e => {
  const b = e.target.closest(".claim");
  if (b && S.q) openClaim(S.q, b.dataset.c, b.textContent);
});

/* ---------- canvas charts ---------- */
function setupCanvas(cv){
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  return [ctx, w, h];
}
function barChart(cv, arms, opt, prog){
  const [ctx, W, H] = setupCanvas(cv);
  const padL = 44, padB = 44, padT = 26, padR = 12;
  const maxV = Math.max(...arms.map(a => a.mean + a.sd), 1) * 1.18;
  const bw = Math.min(90, (W - padL - padR) / arms.length * 0.52);
  ctx.clearRect(0,0,W,H);
  ctx.font = "11px ui-monospace,monospace"; ctx.fillStyle = "#8b96ad";
  for (let g = 0; g <= 4; g++){
    const v = maxV * g / 4, y = padT + (H - padT - padB) * (1 - g/4);
    ctx.strokeStyle = "#1c2438"; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(v >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(v < 10 ? 1 : 0), 6, y + 4);
  }
  const colors = ["#3b4a6b", "#4fd1c5"];
  arms.forEach((a, i) => {
    const cx = padL + (W - padL - padR) * ((i + 0.5) / arms.length);
    const bh = (H - padT - padB) * (a.mean / maxV) * prog;
    const y0 = H - padB, y1 = y0 - bh;
    ctx.fillStyle = colors[i % 2];
    if (ctx.roundRect){ ctx.beginPath(); ctx.roundRect(cx - bw/2, y1, bw, Math.max(bh,1), 7); ctx.fill(); }
    else ctx.fillRect(cx - bw/2, y1, bw, Math.max(bh,1));
    if (prog > 0.95){
      ctx.fillStyle = "#e8ecf4"; ctx.font = "bold 12px ui-monospace,monospace"; ctx.textAlign = "center";
      ctx.fillText("n=" + RealData.fmtInt(a.n), cx, y0 + 16); ctx.textAlign = "left";
    }
    ctx.fillStyle = "#8b96ad"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(String(a.name).slice(0, 14), cx, H - 10); ctx.textAlign = "left";
  });
  if (opt && opt.title){ ctx.fillStyle = "#e8ecf4"; ctx.font = "bold 13px sans-serif"; ctx.fillText(opt.title, padL, 16); }
}
function priorChart(cv, hyps, prog){
  const [ctx, W, H] = setupCanvas(cv);
  const padL = 120, padB = 30, padT = 26, padR = 16;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#e8ecf4"; ctx.font = "bold 13px sans-serif";
  ctx.fillText("Beliefs: prior → posterior", padL, 16);
  const rowH = (H - padT - padB) / hyps.length;
  hyps.forEach((h, i) => {
    const y = padT + rowH * i + rowH/2;
    ctx.fillStyle = "#8b96ad"; ctx.font = "12px sans-serif";
    ctx.fillText(h.id + " " + h.label.slice(0, 18), 8, y + 4);
    const bw = W - padL - padR;
    ctx.fillStyle = "#232c42"; ctx.fillRect(padL, y - 9, bw, 18);
    ctx.fillStyle = "#d8a94e";
    ctx.fillRect(padL, y - 9, bw * h.prior * prog, 8);
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(padL, y + 1, bw * h.posterior * prog, 8);
    ctx.fillStyle = "#8b96ad"; ctx.font = "11px ui-monospace,monospace";
    ctx.fillText(Math.round(h.prior*100) + "% → " + Math.round(h.posterior*100) + "%", padL + bw + 4, y + 4);
  });
  ctx.fillStyle = "#d8a94e"; ctx.font = "11px sans-serif"; ctx.fillText("■ prior", padL, H - 8);
  ctx.fillStyle = "#a78bfa"; ctx.fillText("■ posterior", padL + 70, H - 8);
}
function animateChart(draw){
  const t0 = performance.now(), dur = 1100;
  function fr(t){
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    draw(e);
    if (p < 1) requestAnimationFrame(fr);
  }
  requestAnimationFrame(fr);
}

/* ---------- stage renderers ---------- */
function stageHTML(i){
  const q = S.q, id = STAGES[i].id;
  if (id === "lit") return `
    <div class="card"><h4>📚 Live literature — OpenAlex</h4>
      <div class="kv"><dt>Corpus</dt><dd>top <b>${q.papers.length}</b> hits by relevance${q.fromCache ? ' <span class="tag ctx">cached 24h</span>' : ""}</dd>
      <dt>Classification</dt><dd>design labels are <b>keyword heuristics</b> over title + abstract — the machine did not read full text</dd>
      <dt>Stance</dt><dd>supports / contradicts is <b>not</b> machine-readable from metadata — never claimed</dd></div></div>
    <div class="papers">${q.papers.map(p => `
      <div class="paper">
        <div class="cite">${p.id} · ${esc(p.cite)} <span class="tag dsg">${esc(p.design)}</span></div>
        <div class="meta">${esc(String(p.year))} · ${esc(p.venue)} · cited by ${RealData.fmtInt(p.citedBy)}</div>
        <div class="find"><b>${esc(p.title)}</b></div>
        <div class="find" style="margin-top:6px;color:var(--mut)">${esc(p.finding)}</div>
        <div class="eff">${p.doi ? `<a class="doilink" href="${esc(p.doi)}" target="_blank" rel="noopener">doi ↗</a>` : ""}${p.url ? ` <a class="doilink" href="${esc(p.url)}" target="_blank" rel="noopener">openalex ↗</a>` : ""}</div>
      </div>`).join("")}</div>
    <div class="card"><h4>🧠 Synthesis — what the pull contains</h4>
      ${q.synthesis.map(s => `<p style="margin:8px 0;font-size:14.5px">• ${esc(s)}</p>`).join("")}</div>`;

  if (id === "hyp") return `
    <div class="card"><h4>🔮 Three competing hypotheses — with priors, not vibes</h4>
      <p style="color:var(--mut);font-size:13.5px;margin:0">Priors come from the evidence mix: H1 gains when synthesis-level work exists, H3 gains when the pull is thin. The formula is documented in the report's Methods.</p></div>
    ${q.hypotheses.map(h => `
      <div class="card hyp"><span class="tag hyp">${h.id}</span>
        <h4>${esc(h.label)}</h4><p style="margin:6px 0;font-size:14px">${esc(h.text)}</p>
        <div class="kv"><dt>Basis</dt><dd>${esc(h.mechanism)}</dd></div>
        <div class="priorbar"><div class="post" style="width:${Math.round(h.posterior*100)}%"></div>
          <div class="prior" style="left:${Math.round(h.prior*100)}%"></div></div>
        <div class="priorlbl">prior <b>${Math.round(h.prior*100)}%</b> <span style="color:var(--dim)">(gold tick)</span> → posterior <b>${Math.round(h.posterior*100)}%</b> <span style="color:var(--dim)">(after evidence)</span></div>
      </div>`).join("")}`;

  if (id === "data"){
    if (!q.trials.length) return `
      <div class="card"><h4>🗄️ Trials registry — ClinicalTrials.gov</h4>
        <p style="color:var(--mut);font-size:14px;margin:0">Zero registered trials matched this query. An empty registry is itself a finding: either the question is untestable as posed, or nobody has tried.</p></div>`;
    return `
    <div class="card"><h4>🗄️ Registered trials — ClinicalTrials.gov (real records)</h4>
      <p style="color:var(--mut);font-size:13.5px;margin:0">${q.trials.length} records retrieved · statuses and enrollment as posted by sponsors</p></div>
    ${q.datasets.map(d => `<div class="card"><h4>${esc(d.name)}</h4>
      <div class="kv"><dt>Enrollment</dt><dd>${esc(d.n)}</dd><dt>Record</dt><dd>${esc(d.vars)}</dd><dt>Summary</dt><dd>${esc(d.use)}</dd></div></div>`).join("")}`;
  }

  if (id === "design") return `
    <div class="card"><h4>🧪 Experiment ${q.experiment.id} — ${esc(q.experiment.title)}</h4>
      <div class="kv"><dt>Design</dt><dd>${esc(q.experiment.design)}</dd>
      <dt>Outcome</dt><dd>${esc(q.experiment.outcome)}</dd>
      <dt>Preregistration</dt><dd>${esc(q.experiment.prereg)}</dd></div>
      <p style="color:var(--amber);font-size:13.5px">⚠️ Proposed only — this trial has not been run. The scientist drafts protocols; it does not fabricate results.</p>
      <p style="color:var(--mut);font-size:13px">Known weaknesses, logged honestly before anything runs: ${q.experiment.flaws.map(esc).join(" · ")}</p></div>`;

  if (id === "run"){
    const T = q.trials.slice().sort((a,b) => (b.enrollment||0) - (a.enrollment||0)).slice(0, 8);
    if (!T.length || !T.some(t => t.enrollment > 0)) return `
      <div class="card"><h4>📊 Registry evidence</h4>
        <p style="color:var(--mut);font-size:14px;margin:0">No enrollment figures to aggregate — the registry pull for this query is empty or unenrolled. Counting, not simulating: there is nothing to count.</p></div>`;
    const arms = T.map(t => ({ name: t.nctId.replace(/^NCT0*/, ""), mean: t.enrollment || 0, sd: 0, n: t.enrollment || 0 }));
    const total = T.reduce((a,t) => a + (t.enrollment||0), 0);
    const comp = q.trials.filter(t => t.status === "COMPLETED").length;
    return `
    <div class="card"><h4>📊 Aggregating ${q.trials.length} registry records…</h4>
      <div id="runprog" class="priorbar"><div class="post" style="width:0%"></div></div>
      <div id="runlbl" class="priorlbl">pulling trial records…</div></div>
    <div class="chart-wrap"><canvas id="ch-main"></canvas>
      <div class="chart-cap">Target enrollment by trial (ClinicalTrials.gov) · as posted by sponsors, not outcomes</div></div>
    <div class="statline">
      <span class="stat">total target enrollment <b>${RealData.fmtInt(total)}</b></span>
      <span class="stat">completed <b>${comp}</b> / ${q.trials.length}</span>
      <span class="stat">no results simulated</span>
    </div>
    <div id="run-arms" data-arms='${esc(JSON.stringify(arms))}' style="display:none"></div>`;
  }

  if (id === "new"){ const ne = q.newEvidence; return `
    <div class="newsev"><div class="nh">📡 ${esc(ne.tag)}</div>
      <p style="margin:8px 0"><b>${esc(ne.cite)}</b></p>
      <p style="margin:8px 0;font-size:14px">${esc(ne.finding)}</p>
      <p style="color:var(--mut);font-size:13.5px;margin:0">${esc(ne.note)}</p></div>
    <div class="chart-wrap"><canvas id="ch-prior"></canvas>
      <div class="chart-cap">The scientist revises its beliefs instead of ignoring inconvenient evidence.</div></div>`; }

  if (id === "review") return `<div id="rev-list"></div>
    <div class="card"><h4>⚔️ Review protocol</h4>
      <p style="color:var(--mut);font-size:13.5px;margin:0">Two reviewers, instructed to attack methods, statistics, and interpretation. Objections are computed from real gaps in this evidence pull — thin corpus, abstract-only reads, un-inferred stances. Watch for the amber <b>CONCEDED</b> badges: that's the system being honest.</p></div>`;

  if (id === "report"){ const r = q.report; return `
    <div class="report">
      <div class="rmeta">${esc(q.field)} · retrieved ${esc(TODAY)}${q.fromCache ? " · from 24h cache" : ""}</div>
      <h2>Evidence map: ${esc(q.title.length > 80 ? q.title.slice(0,80)+"…" : q.title)}</h2>
      <div class="rmeta">Autonomous Scientist · corresponding author: the machine · no trial was run</div>
      <div><span class="stamp">✓ ${esc(r.verdict)}</span></div>
      <h3>Abstract</h3><div class="abstract">${rich(r.abstract)}</div>
      ${r.sections.map(s => `<h3>${esc(s.h)}</h3><p>${rich(s.body)}</p>`).join("")}
      <h3>References</h3><ol class="refs">${r.references.map(x => `<li>${esc(x.text)}${x.doi ? ` <a href="${esc(x.doi)}" target="_blank" rel="noopener">doi ↗</a>` : ""}</li>`).join("")}</ol>
      <div class="strength-note">💡 <b>Tap any highlighted claim</b> to inspect its provenance — the exact papers, registry records, and reviewer exchanges behind it. Amber-underlined claims are weak: thin or indirect evidence.</div>
    </div>`; }
  return "";
}

async function renderStage(i, animate){
  const body = $("stage-body"), tok = S.token, id = STAGES[i].id, q = S.q;
  body.innerHTML = stageHTML(i);

  if (id === "run" && animate){
    const armsEl = $("run-arms");
    const steps = ["pulling trial records…", "reading enrollment figures…", "tallying statuses…", "aggregating…"];
    for (const s of steps){
      if (tok !== S.token) return;
      const lbl = $("runlbl"); if (!lbl) break;
      lbl.textContent = s;
      $("runprog").firstElementChild.style.width = ((steps.indexOf(s) + 1) / steps.length * 100) + "%";
      await sleep(550);
    }
    const cv = $("ch-main");
    if (cv && armsEl && tok === S.token){
      const arms = JSON.parse(armsEl.dataset.arms);
      animateChart(p => barChart(cv, arms, { title:"Target enrollment by trial" }, p));
    }
  } else if (id === "run"){
    const armsEl = $("run-arms"), cv = $("ch-main");
    if (armsEl && cv) animateChart(p => barChart(cv, JSON.parse(armsEl.dataset.arms), { title:"Target enrollment by trial" }, p));
  }
  if (id === "new"){
    const cv = $("ch-prior");
    if (animate){ await sleep(900); if (tok !== S.token || !$("ch-prior")) return; }
    if (cv) animateChart(p => priorChart(cv, q.hypotheses, p));
  }
  if (id === "review" && animate) await playReview(q, tok);
  else if (id === "review") renderReviewFull(q);
  renderTree();
}

async function playReview(q, tok){
  const list = $("rev-list");
  for (const rv of q.review){
    if (tok !== S.token) return;
    const box = document.createElement("div");
    box.className = "reviewer";
    box.innerHTML = `<div class="rev-head"><div class="avatar">${rv.avatar}</div>
      <div><div class="rn">${esc(rv.name)}</div><div class="rr">${esc(rv.role)}</div></div></div><div class="obs"></div>`;
    list.appendChild(box);
    const obs = box.querySelector(".obs");
    for (const o of rv.objections){
      if (tok !== S.token) return;
      const el = document.createElement("div");
      el.className = "objection";
      el.innerHTML = `<span class="tag ${o.verdict === "conceded" ? "con" : "sup"}">${esc(o.target)}</span>
        <div class="atk"><div class="who">⚔️ OBJECTION</div><p style="margin:6px 0">${esc(o.attack)}</p></div>`;
      obs.appendChild(el);
      $("log").innerHTML = `<span class="prompt">reviewer:~$</span> ${esc(rv.name)} attacks: ${esc(o.target.toLowerCase())}…`;
      await sleep(1600);
      if (tok !== S.token) return;
      el.insertAdjacentHTML("beforeend",
        `<div class="rpl"><div class="who">🔬 SCIENTIST RESPONDS</div><p style="margin:6px 0">${esc(o.reply)}</p></div>
         <span class="verdict ${o.verdict}">${o.verdict === "conceded" ? "⚠ CONCEDED" : "✓ REBUTTED"}</span>
         ${o.consequence ? `<div class="conseq">→ ${esc(o.consequence)}</div>` : ""}`);
      $("log").innerHTML = `<span class="prompt">scientist@lab:~$</span> ${o.verdict === "conceded" ? "conceding — map downgraded accordingly" : "rebuttal holds — claim stands"}`;
      await sleep(1400);
    }
  }
  $("log").innerHTML = `<span class="prompt">editor:~$</span> review complete · ${q.review.reduce((a,r)=>a+r.objections.filter(o=>o.verdict==="conceded").length,0)} concessions · map: ${esc(q.report.verdict)}`;
}
function renderReviewFull(q){
  $("rev-list").innerHTML = q.review.map(rv => `
    <div class="reviewer"><div class="rev-head"><div class="avatar">${rv.avatar}</div>
      <div><div class="rn">${esc(rv.name)}</div><div class="rr">${esc(rv.role)}</div></div></div>
      ${rv.objections.map(o => `
        <div class="objection"><span class="tag ${o.verdict === "conceded" ? "con" : "ctx"}">${esc(o.target)}</span>
          <div class="atk"><div class="who">⚔️ OBJECTION</div><p style="margin:6px 0">${esc(o.attack)}</p></div>
          <div class="rpl"><div class="who">🔬 SCIENTIST RESPONDS</div><p style="margin:6px 0">${esc(o.reply)}</p></div>
          <span class="verdict ${o.verdict}">${o.verdict === "conceded" ? "⚠ CONCEDED" : "✓ REBUTTED"}</span>
          ${o.consequence ? `<div class="conseq">→ ${esc(o.consequence)}</div>` : ""}</div>`).join("")}
    </div>`).join("");
}

/* ---------- research tree ---------- */
function buildTree(q, upto){
  const kids = [];
  if (upto >= 0) kids.push({ icon:"📚", cls:"", label:`Literature — ${q.papers.length} OpenAlex hits`,
    detail:"ranked by relevance · designs heuristically classified · abstracts only",
    kids: q.papers.map(p => ({ icon:"📄", cls:"t-ev",
      label:`${p.id} · ${p.cite} ${p.year}`, detail:`${p.design} · cited by ${RealData.fmtInt(p.citedBy)} — ${p.title.slice(0,80)}`, kids:[] })) });
  if (upto >= 1) q.hypotheses.forEach(h => kids.push({
    icon:"🔮", cls:"t-hyp",
    label:`${h.id} · ${h.label} — prior ${Math.round(h.prior*100)}% → ${Math.round(h.posterior*100)}%`,
    detail: h.text, kids: [] }));
  if (upto >= 2) kids.push({ icon:"🗄️", cls:"t-exp",
    label:`Registry — ${q.trials.length} ClinicalTrials.gov records`,
    detail: q.trials.length ? q.trials.slice(0,3).map(t => `${t.nctId} (${t.status.toLowerCase()})`).join(" · ") : "empty registry — a finding in itself",
    kids: [] });
  if (upto >= 3) kids.push({ icon:"🧪", cls:"t-exp",
    label:`${q.experiment.id} · proposed protocol`,
    detail:"preregistration required · NOT run — no results fabricated",
    kids:[{ icon:"⏳", cls:"t-open", label:"Not run — no results invented",
      detail:"the scientist proposes; it does not fabricate data", kids:[] }] });
  if (upto >= 4){
    const T = q.trials.slice().sort((a,b) => (b.enrollment||0)-(a.enrollment||0));
    const tot = T.reduce((a,t) => a + (t.enrollment||0), 0);
    kids.push({ icon:"📊", cls:"t-exp",
      label:`Registry evidence — ${RealData.fmtInt(tot)} target enrollment across ${q.trials.length} records`,
      detail: T.length ? "largest: " + T.slice(0,3).map(t => `${t.nctId} (n=${RealData.fmtInt(t.enrollment)})`).join(", ") : "nothing to aggregate",
      kids:[] });
  }
  if (upto >= 5){ const ne = q.newEvidence; kids.push({ icon:"📡", cls:"t-open",
    label:`New evidence: ${ne.cite}`, detail:`${(ne.finding||"").slice(0,110)}… Beliefs revised.`, kids:[] }); }
  if (upto >= 6){ const nConc = q.review.reduce((a,r)=>a+r.objections.filter(o=>o.verdict==="conceded").length,0);
    kids.push({ icon:"⚔️", cls:"t-rev", label:`Adversarial review — ${nConc} concessions`,
      detail: q.review.map(r => r.name + " (" + r.role + ")").join(" · "),
      kids: q.review.flatMap(r => r.objections.map(o => ({
        icon: o.verdict === "conceded" ? "⚠️" : "✓", cls: o.verdict === "conceded" ? "t-open" : "t-ev",
        label:`${o.target} — ${o.verdict}`, detail:o.consequence || (o.reply.slice(0,90)+"…"), kids:[] }))) }); }
  if (upto >= 7){
    const concKids = Object.entries(q.report.claims)
      .filter(([id,c]) => c.strength !== "weak")
      .slice(0,4).map(([id,c]) => ({ icon:"📜", cls:"t-conc", label:`${id} · ${c.strength}`, detail:c.prov.map(p=>p.ref).join(" + "), kids:[] }));
    RealData.openQuestions(q).forEach(o => concKids.push({ icon:"❓", cls:"t-open", label:"Open: "+o, detail:"unresolved — future work", kids:[] }));
    kids.push({ icon:"📜", cls:"t-conc", label:`Evidence map — ${q.report.verdict}`, detail:"every claim carries provenance", kids: concKids });
  }
  return { icon: q.icon, cls:"t-q", label: q.title.length > 90 ? q.title.slice(0,90)+"…" : q.title, detail: q.field, kids };
}
function treeHTML(n){
  return `<div class="tnode ${n.cls}"><div class="trow"><span class="tico">${n.icon}</span>
    <span class="tt"><span class="tl">${esc(n.label)}</span><br><span class="td">${esc(n.detail)}</span></span></div>
    ${n.kids.length ? `<div class="tkids">${n.kids.map(treeHTML).join("")}</div>` : ""}</div>`;
}
function renderTree(){
  if (!S.q) return;
  $("tree-body").innerHTML = treeHTML(buildTree(S.q, S.stage));
}

/* ---------- claim sheet ---------- */
const KIND_LABEL = { paper:"📄 PAPER", trial:"🧪 TRIAL", review:"⚔️ REVIEW", method:"⚙️ METHOD",
  experiment:"🧪 EXPERIMENT", preprint:"📡 PREPRINT" };
function openClaim(q, cid, text){
  const c = q.report.claims[cid];
  if (!c) return;
  const badge = $("claim-strength");
  badge.className = "badge " + c.strength;
  badge.textContent = c.strength.toUpperCase() + " CLAIM";
  $("claim-text").textContent = "“" + text + "”";
  $("claim-prov").innerHTML = c.prov.map(p => {
    const kind = KIND_LABEL[p.kind] || String(p.kind).toUpperCase();
    return `<li><div class="pk">${kind} · ${esc(p.ref)}</div><div>${esc(p.text)}</div></li>`;
  }).join("");
  $("claim-sheet").classList.add("open");
  $("sheet-scrim").classList.add("on");
  $("claim-sheet").setAttribute("aria-hidden","false");
}
function closeClaim(){
  $("claim-sheet").classList.remove("open"); $("sheet-scrim").classList.remove("on");
  $("claim-sheet").setAttribute("aria-hidden","true");
}
$("claim-close").addEventListener("click", closeClaim);
$("sheet-scrim").addEventListener("click", closeClaim);

/* ---------- drawer ---------- */
function openDrawer(){ $("tree-drawer").classList.add("open"); $("drawer-scrim").classList.add("on"); $("tree-drawer").setAttribute("aria-hidden","false"); renderTree(); }
function closeDrawer(){ $("tree-drawer").classList.remove("open"); $("drawer-scrim").classList.remove("on"); $("tree-drawer").setAttribute("aria-hidden","true"); }
$("tree-toggle").addEventListener("click", openDrawer);
$("tree-close").addEventListener("click", closeDrawer);
$("drawer-scrim").addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape"){ closeClaim(); closeDrawer(); } });

/* ---------- main loop ---------- */
const DELAYS = { lit:2400, hyp:2600, data:2000, design:2400, run:4200, new:3400, review:1000, report:1600 };
async function runCycle(){
  const tok = ++S.token;
  S.running = true; S.stage = 0;
  renderRail();
  for (let i = 0; i < STAGES.length; i++){
    if (tok !== S.token) return;
    S.stage = i; renderRail(); logLine(i);
    const id = STAGES[i].id;
    if (id === "review"){ await renderStage(i, true); }
    else { await renderStage(i, true); await sleep(DELAYS[id]); }
    if (tok !== S.token) return;
  }
  S.running = false;
  renderRail();
  syncRunBtn();
}

renderQuestions();
syncRunBtn();
