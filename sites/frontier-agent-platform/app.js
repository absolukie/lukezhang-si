/* Frontier Agent Platform — simulated mission control. No real backend; all runs are simulated client-side. */
"use strict";
/* ---------------- utils ---------------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rand = (a,b) => a + Math.random()*(b-a);
const randi = (a,b) => Math.floor(rand(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const ts = () => { const d=new Date(); return d.toTimeString().slice(0,8)+"."+String(d.getMilliseconds()).padStart(3,"0"); };
const fmt$ = n => "$"+n.toFixed(4);
const fmtN = n => n.toLocaleString("en-US");

/* ---------------- platform data ----------------
   MODELS is REAL data: live catalog + pricing from OpenRouter, benchmark
   scores from the Artificial Analysis Intelligence Index. A dated snapshot
   ships in models.json; the app refreshes prices live (no key needed) and
   caches the merged result in localStorage. The run traces / latencies /
   eval scores remain an honest client-side simulation of the control plane. */
let MODELS = {};            // real model id -> {id,name,vendor,priceIn,priceOut,context,aa_index,tier,use}
let TIER_DEFAULT = {};      // ultra|pro|lite -> real model id
let MODELS_META = { source:"snapshot", snapshot_date:null, refreshed_at:null };
const SIM_P50 = { ultra:1800, pro:900, lite:320 }; // simulated latency only — illustrative, not measured
const tierModel = tier => MODELS[TIER_DEFAULT[tier]] || null;
const modelName = tier => { const m = tierModel(tier); return m ? m.name : tier; };
const ROUTER_POLICY = () =>
  `cost-aware routing · planner → ${modelName("ultra")} · tool-arg construction → ${modelName("pro")} · parse/summarize → ${modelName("lite")} · retries escalate one tier`;

async function loadModels(){
  // 1) shipped snapshot (always available, dated + sourced)
  try {
    const snap = await (await fetch("models.json")).json();
    applySnapshot(snap, "snapshot");
  } catch(e){ console.warn("snapshot load failed", e); }
  // 2) cached live refresh
  try {
    const cached = JSON.parse(localStorage.getItem("frontier-models-cache") || "null");
    if (cached && cached.models) applySnapshot(cached, "cache");
  } catch(e){}
  // 3) live refresh from OpenRouter (keyless) — updates prices only, keeps AA scores
  refreshPrices(true);
  renderModels();
}
function applySnapshot(snap, source){
  if (!snap || !Array.isArray(snap.models) || !snap.models.length) return;
  MODELS = {};
  snap.models.forEach(m => { MODELS[m.id] = m; });
  if (snap.tier_default) TIER_DEFAULT = snap.tier_default;
  if (snap.meta){
    MODELS_META = Object.assign({}, MODELS_META, {
      source, snapshot_date: snap.meta.snapshot_date || MODELS_META.snapshot_date,
      pricing_source: snap.meta.pricing_source, benchmark_source: snap.meta.benchmark_source,
    });
  }
}
async function refreshPrices(silent){
  const btn = $("refresh-prices");
  if (btn) btn.disabled = true;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error("http " + res.status);
    const data = await res.json();
    const live = {};
    (data.data || []).forEach(m => {
      const pin = parseFloat(m.pricing && m.pricing.prompt), pout = parseFloat(m.pricing && m.pricing.completion);
      if (isFinite(pin) && isFinite(pout) && pin >= 0 && pout >= 0)
        live[m.id] = { priceIn: pin*1e6, priceOut: pout*1e6, context: m.context_length };
    });
    let updated = 0;
    Object.keys(MODELS).forEach(id => {
      if (live[id]){ MODELS[id].priceIn = live[id].priceIn; MODELS[id].priceOut = live[id].priceOut;
        if (live[id].context) MODELS[id].context = live[id].context; updated++; }
    });
    MODELS_META.source = "live"; MODELS_META.refreshed_at = new Date().toISOString();
    try {
      localStorage.setItem("frontier-models-cache", JSON.stringify({
        meta:{ snapshot_date: MODELS_META.snapshot_date, pricing_source: MODELS_META.pricing_source,
               benchmark_source: MODELS_META.benchmark_source },
        tier_default: TIER_DEFAULT, models: Object.values(MODELS) }));
    } catch(e){}
    if (!silent) toast(`Live prices refreshed — ${updated}/${Object.keys(MODELS).length} models updated`);
  } catch(e){
    if (!silent) toast("Live refresh failed — showing " + (MODELS_META.source === "live" ? "cached" : "snapshot") + " prices");
  }
  if (btn) btn.disabled = false;
  renderModels();
}

const TOOLS = [
  {name:"web_search",     desc:"Search the web, return ranked snippets", perm:"read", calls:0, ms:0, recent:[]},
  {name:"http_fetch",     desc:"GET a URL, return status + body", perm:"read", calls:0, ms:0, recent:[]},
  {name:"sql_query",      desc:"Read-only queries against the warehouse", perm:"read", calls:0, ms:0, recent:[]},
  {name:"vector_search",  desc:"Semantic recall over agent long-term memory", perm:"read", calls:0, ms:0, recent:[]},
  {name:"memory_write",   desc:"Persist a fact to long-term memory", perm:"write", calls:0, ms:0, recent:[]},
  {name:"file_write",     desc:"Write a file to the agent workspace", perm:"write", calls:0, ms:0, recent:[]},
  {name:"code_exec",      desc:"Run code in a sandboxed container", perm:"write", calls:0, ms:0, recent:[]},
  {name:"subagent_spawn", desc:"Delegate a subtask to an ephemeral sub-agent", perm:"write", calls:0, ms:0, recent:[]},
  {name:"notify_slack",   desc:"Post a message to a Slack channel", perm:"write", calls:0, ms:0, recent:[]},
  {name:"send_email",     desc:"Send email to humans — requires approval", perm:"destructive", calls:0, ms:0, recent:[]},
  {name:"deploy_service", desc:"Roll out a service — requires approval", perm:"destructive", calls:0, ms:0, recent:[]},
  {name:"db_delete",      desc:"Delete records — requires approval", perm:"destructive", calls:0, ms:0, recent:[]},
];

const AGENTS = [
  {id:"forge",    name:"forge-01",    role:"Build & Deploy",      color:"var(--amber)",  model:"pro"},
  {id:"atlas",    name:"atlas-02",    role:"Research & Analysis",  color:"var(--teal)",   model:"pro"},
  {id:"sentinel", name:"sentinel-03", role:"Data & Monitoring",    color:"var(--violet)", model:"pro"},
];

const SUGGESTED = [
  "Deploy checkout service v2.4 to production",
  "Research EV battery suppliers and draft a comparison report",
  "Analyze Q3 sales data and flag anomalies",
  "Migrate the user-avatars bucket to the new region",
];

/* task templates → plans. steps: {t, tool, model, detail, result, approval?, failOnce?, delegate?} */
function planFor(text){
  const t = text.toLowerCase();
  if (/deploy|release|ship|roll ?out/.test(t)) return {kind:"deploy", steps:[
    {t:"Analyze rollout plan", tool:"vector_search", model:"pro", detail:"recall prior deploy runbooks",
     result:"→ 3 memories recalled (sim 0.91, 0.87, 0.82)"},
    {t:"Run test suite", tool:"code_exec", model:"pro", detail:"pytest -x -q",
     result:"→ 142 passed, 0 failed · 6.1s"},
    {t:"Build container image", tool:"code_exec", model:"lite", detail:"docker build checkout:v2.4",
     result:"→ image ready · 214 MB · 11s"},
    {t:"Deploy to staging", tool:"deploy_service", model:"pro", detail:"env=staging", failOnce:true,
     result:"→ rollout 100% · 4/4 healthy · 31s"},
    {t:"Smoke-test staging", tool:"http_fetch", model:"lite", detail:"GET /health ×14",
     result:"→ 200 OK ×14 · p99 88ms"},
    {t:"Deploy to production", tool:"deploy_service", model:"ultra", detail:"env=production · canary 5%→100%",
     approval:{action:"deploy_service(production)", risk:"User-facing traffic · 12 pods · rollback window 10 min"},
     result:"→ canary 5% → 100% · 12/12 healthy · 48s"},
    {t:"Record rollout notes", tool:"memory_write", model:"lite", detail:"store canary timings",
     mem:"canary 5%→100% took 48s on checkout v2.4"},
  ]};
  if (/research|supplier|battery|report|compar/.test(t)) return {kind:"research", steps:[
    {t:"Recall prior research", tool:"vector_search", model:"pro", detail:"supplier dossiers in memory",
     result:"→ 2 memories recalled (sim 0.89, 0.84)"},
    {t:"Search supplier landscape", tool:"web_search", model:"lite", detail:"“EV battery suppliers 2026 market share”",
     result:"→ 8 results · top: “CATL holds 37% share” · 412ms"},
    {t:"Search financials", tool:"web_search", model:"lite", detail:"“CATL BYD Q2 2026 earnings”",
     result:"→ 8 results · 388ms"},
    {t:"Delegate deep summarization", tool:"subagent_spawn", model:"pro", delegate:true, detail:"summarize 8 sources",
     result:"→ 6-page brief · 4 key findings"},
    {t:"Draft comparison report", tool:"file_write", model:"pro", detail:"/reports/ev-battery.md",
     result:"→ wrote /reports/ev-battery.md (4.1 KB)"},
    {t:"Send report to requester", tool:"send_email", model:"lite", detail:"to: exec-team (6 people)",
     approval:{action:"send_email(exec-team)", risk:"External recipients · 6 people · includes cost tables"},
     result:"→ queued · 6 recipients"},
  ]};
  if (/data|analy|sales|anomal|metric|q3/.test(t)) return {kind:"data", steps:[
    {t:"Recall metric definitions", tool:"vector_search", model:"pro", detail:"Q3 revenue metric glossary",
     result:"→ 3 memories recalled (sim 0.93, 0.88, 0.81)"},
    {t:"Query sales warehouse", tool:"sql_query", model:"pro", detail:"SELECT region, SUM(revenue) … GROUP BY region",
     result:"→ 1,204 rows · 231ms"},
    {t:"Run anomaly detection", tool:"code_exec", model:"pro", detail:"isolation_forest.py --contamination 0.02", failOnce:true,
     result:"→ 7 anomalies flagged · top: EU-West −18% WoW"},
    {t:"Draft findings memo", tool:"file_write", model:"pro", detail:"/reports/q3-anomalies.md",
     result:"→ wrote /reports/q3-anomalies.md (2.8 KB)"},
    {t:"Share with finance leads", tool:"send_email", model:"lite", detail:"to: finance-leads (4 people)",
     approval:{action:"send_email(finance-leads)", risk:"Pre-earnings · confidential numbers"},
     result:"→ queued · 4 recipients"},
  ]};
  return {kind:"general", steps:[
    {t:"Break down the request", tool:"vector_search", model:"ultra", detail:"planner pass · decompose into subtasks",
     result:"→ plan: 5 steps · est. cost $0.31"},
    {t:"Gather context", tool:"web_search", model:"lite", detail:"background lookup", failOnce:true,
     result:"→ 6 results · 401ms"},
    {t:"Execute core work", tool:"code_exec", model:"pro", detail:"sandboxed run",
     result:"→ exit 0 · 2.4s"},
    {t:"Write up results", tool:"file_write", model:"pro", detail:"/reports/output.md",
     result:"→ wrote /reports/output.md (3.3 KB)"},
    {t:"Notify requester", tool:"notify_slack", model:"lite", detail:"#general (340 members)",
     approval:{action:"notify_slack(#general)", risk:"Broadcast to 340 members"},
     result:"→ posted #general"},
  ]};
}

/* ---------------- runtime state ---------------- */
function freshAgent(rt){ return Object.assign({cfg:rt, status:"idle", task:null, kind:null, plan:[], stepIdx:-1,
  trace:[], stick:true, approval:null, queue:[], mem:[], runId:0,
  stats:{startedAt:0, cost:0, tokens:0, calls:0, retries:0, approvals:0}}, {}); }
const S = {
  agents:{}, selected:"forge", tab:"control", chaos:false,
  ledger:[],            // model calls {t, model, agent, tokIn, tokOut, ms, cost}
  evals:[], sessionCost:0,
};
AGENTS.forEach(a => S.agents[a.id] = freshAgent(a));
try {
  const saved = JSON.parse(localStorage.getItem("frontier-evals")||"[]");
  if (Array.isArray(saved)) S.evals = saved.slice(0,20);
} catch(e){}

/* ---------------- trace ---------------- */
function log(agentId, tag, msg, sub){
  const ag = S.agents[agentId];
  ag.trace.push({t:ts(), tag, msg, sub:!!sub});
  if (ag.trace.length > 300) ag.trace.splice(0, ag.trace.length-300);
  renderTrace(agentId);
}
function modelCall(agentId, modelKey, stepTitle){
  const m = tierModel(modelKey);
  const label = m ? m.name : modelKey;
  const priceIn = m ? m.priceIn : 0, priceOut = m ? m.priceOut : 0;
  const tokIn = randi(400, 2400), tokOut = randi(80, 700);
  const ms = Math.round((SIM_P50[modelKey] || 900) * rand(0.7, 1.6)); // simulated latency
  const cost = tokIn/1e6*priceIn + tokOut/1e6*priceOut;               // REAL pricing
  S.ledger.push({t:Date.now(), model:modelKey, agent:agentId, tokIn, tokOut, ms, cost});
  if (S.ledger.length > 200) S.ledger.shift();
  const ag = S.agents[agentId];
  ag.stats.calls++; ag.stats.tokens += tokIn+tokOut; ag.stats.cost += cost; S.sessionCost += cost;
  log(agentId, "model", `${label} · ${fmtN(tokIn)} in / ${fmtN(tokOut)} out · ${ms}ms (sim) · ${fmt$(cost)}`);
  renderHeader();
}

/* ---------------- executor ---------------- */
async function runLoop(agentId){
  const ag = S.agents[agentId];
  while (ag.queue.length){
    const task = ag.queue.shift();
    await runTask(agentId, task);
  }
  ag.status = "idle"; ag.task = null;
  render();
}
async function runTask(agentId, taskText){
  const ag = S.agents[agentId];
  ag.runId++;
  ag.status = "working";
  ag.task = taskText.length > 90 ? taskText.slice(0,90)+"…" : taskText;
  const plan = planFor(taskText);
  ag.kind = plan.kind;
  ag.plan = plan.steps.map(s => Object.assign({}, s, {st:"wait", dur:null, failLeft:(s.failOnce|| (S.chaos && Math.random()<0.5)) ? (S.chaos?2:1) : 0}));
  ag.stepIdx = -1;
  ag.stats = {startedAt:Date.now(), cost:0, tokens:0, calls:0, retries:0, approvals:0};
  ag.trace = [];
  render();
  log(agentId, "plan", `planner → ${ag.plan.length} steps · kind=${ag.kind} · budget $0.50`);
  await sleep(700);
  log(agentId, "mem", `recalled ${randi(2,4)} relevant memories (vector_search)`, false);
  await sleep(500);
  for (let i=0;i<ag.plan.length;i++){
    ag.stepIdx = i;
    const st = ag.plan[i];
    st.st = "run"; renderSteps(agentId);
    log(agentId, "plan", `step ${i+1}/${ag.plan.length} — ${st.t}`);
    await sleep(rand(500,900));
    modelCall(agentId, st.model, st);
    await sleep(rand(400,800));
    if (st.approval){
      st.st = "wait-appr"; renderSteps(agentId); renderFleet();
      const ok = await requestApproval(agentId, st);
      ag.stats.approvals++;
      if (ok){
        log(agentId, "appr", `approved by operator — ${st.approval.action}`);
        st.st = "run"; renderSteps(agentId);
        await execTool(agentId, st);
      } else {
        log(agentId, "appr", `rejected by operator — replanning around “${st.t}”`);
        st.st = "skip"; renderSteps(agentId);
        await sleep(600);
        log(agentId, "plan", `replan: scoped to non-destructive alternative ✓`);
        continue;
      }
    } else {
      await execTool(agentId, st);
    }
    if (st.st === "run"){ st.st = "done"; st.dur = ((Date.now()-ag.stats.startedAt)/1000); }
    renderSteps(agentId);
    await sleep(rand(300,600));
  }
  finishRun(agentId);
}
async function execTool(agentId, st){
  const ag = S.agents[agentId];
  log(agentId, "tool", `${st.tool}(${st.detail||""})`);
  const tool = TOOLS.find(x=>x.name===st.tool);
  while (st.failLeft > 0){
    st.failLeft--; ag.stats.retries++;
    st.st = "retry"; renderSteps(agentId);
    await sleep(rand(700,1100));
    log(agentId, "err", `${st.tool} failed: ${pick(["upstream timeout (30s)","429 rate limited","connection reset","sandbox OOM"])}`);
    const backoff = randi(1,3);
    log(agentId, "warn", `retry ${ag.stats.retries} · backoff ${backoff}s · escalating model tier`);
    await sleep(backoff*700);
    st.st = "run"; renderSteps(agentId);
    modelCall(agentId, st.model === "lite" ? "pro" : "ultra", st);
    await sleep(500);
  }
  const ms = Math.round(rand(180, 900));
  if (tool){ tool.calls++; tool.ms += ms; tool.recent.unshift(`${ts().slice(0,8)} · ${st.detail||"ok"}`); tool.recent = tool.recent.slice(0,4); }
  await sleep(rand(500,900));
  if (st.delegate){
    log(agentId, "del", `spawning sub-agent ${ag.cfg.id}-sub-${randi(3,9)} (${st.detail})`);
    await sleep(600);
    log(agentId, "del", `sub-agent: summarizing 8 sources…`, true);
    await sleep(900);
    log(agentId, "del", `sub-agent: cross-checking claims…`, true);
    await sleep(800);
    log(agentId, "del", `sub-agent done · 4.2s · returned brief`, false);
  }
  log(agentId, "ok", st.result || `→ done · ${ms}ms`);
  if (st.mem){
    ag.mem.unshift(st.mem); ag.mem = ag.mem.slice(0,8);
    log(agentId, "mem", `stored long-term: “${st.mem}”`);
    renderMem(agentId);
  }
}
function requestApproval(agentId, st){
  const ag = S.agents[agentId];
  return new Promise(resolve => {
    ag.approval = {step:st, resolve};
    ag.status = "waiting";
    S.selected = agentId; // bring the waiting agent into view — the gate needs a human now
    log(agentId, "appr", `⚠ approval required — ${st.approval.action} (run paused, state persisted)`);
    render(); renderFleet();
  });
}
function resolveApproval(agentId, ok){
  const ag = S.agents[agentId];
  if (!ag.approval) return;
  const r = ag.approval.resolve;
  ag.approval = null;
  ag.status = "working";
  r(ok);
}
function finishRun(agentId){
  const ag = S.agents[agentId];
  const secs = Math.round((Date.now()-ag.stats.startedAt)/1000);
  log(agentId, "ok", `run complete · ${ag.plan.filter(s=>s.st==="done").length}/${ag.plan.length} steps · ${secs}s · ${fmt$(ag.stats.cost)}`);
  const skipped = ag.plan.filter(s=>s.st==="skip").length;
  const ev = {
    id:"run-"+Date.now().toString(36), agent:ag.cfg.name, task:ag.task, kind:ag.kind,
    secs, cost:ag.stats.cost, tokens:ag.stats.tokens, calls:ag.stats.calls,
    retries:ag.stats.retries, approvals:ag.stats.approvals, skipped,
    scores:{
      plan: Math.round(rand(93,99)),
      tools: Math.max(68, Math.round(100 - ag.stats.retries*9)),
      cost: Math.max(70, Math.round(100 - ag.stats.cost*90)),
      safety: 100,
    },
    at:new Date().toLocaleString(),
  };
  ev.scores.overall = Math.round(ev.scores.plan*0.3+ev.scores.tools*0.3+ev.scores.cost*0.2+ev.scores.safety*0.2);
  S.evals.unshift(ev); S.evals = S.evals.slice(0,20);
  try { localStorage.setItem("frontier-evals", JSON.stringify(S.evals)); } catch(e){}
  ag.status = ag.queue.length ? "queued" : "idle";
  render();
}

/* ---------------- rendering ---------------- */
const STATUS_TXT = {idle:"idle", working:"working", waiting:"needs approval", queued:"queued"};
function render(){ renderHeader(); renderFleet(); renderDetail(); renderModels(); renderTools(); renderEvals(); }
function renderHeader(){
  $("cost-meter").textContent = fmt$(S.sessionCost);
  const active = Object.values(S.agents).filter(a=>a.status==="working"||a.status==="waiting").length;
  $("active-runs").textContent = active;
  const cb = $("chaos-btn");
  cb.textContent = "chaos · " + (S.chaos ? "on" : "off");
  cb.classList.toggle("on", S.chaos);
  $("eval-count").textContent = S.evals.length ? S.evals.length : "";
}
function renderFleet(){
  const el = $("fleet");
  el.innerHTML = `<div class="fleet-h">Fleet · ${AGENTS.length} agents</div>` + AGENTS.map(a=>{
    const ag = S.agents[a.id];
    const done = ag.plan.filter(s=>s.st==="done").length, total = ag.plan.length;
    const pct = total ? Math.round(done/total*100) : 0;
    return `<div class="acard ${S.selected===a.id?"sel":""}" data-act="select-agent" data-id="${a.id}">
      <div class="arow"><span class="adot ${ag.status}"></span>
        <div><div class="aname">${a.name}</div><div class="arole">${a.role}</div></div>
        <span class="astatus ${ag.status}">${STATUS_TXT[ag.status]}</span></div>
      ${ag.task?`<div class="atask">▸ ${esc(ag.task)}</div><div class="aprog"><i style="width:${pct}%;--ac:${a.color}"></i></div>`:`<div class="atask">— idle —</div>`}
      ${ag.status==="waiting"?`<div class="aneed">⚠ approval needed</div>`:""}
      ${ag.queue.length?`<div class="atask" style="color:var(--blue)">+${ag.queue.length} queued</div>`:""}
    </div>`;
  }).join("");
}
function renderDetail(){
  const v = $("view-control");
  const ag = S.agents[S.selected], a = ag.cfg;
  const secs = ag.stats.startedAt ? Math.round((Date.now()-ag.stats.startedAt)/1000) : 0;
  v.innerHTML = `
    <div class="dhead">
      <div><h2>${a.name}</h2><div class="role">${a.role} · ${modelName(a.model)}</div></div>
      <span class="pill ${ag.status}">${STATUS_TXT[ag.status]}</span>
      <div class="dstats">
        <div class="dstat"><span class="l">elapsed</span><span class="v">${secs}s</span></div>
        <div class="dstat"><span class="l">run cost</span><span class="v">${fmt$(ag.stats.cost)}</span></div>
        <div class="dstat"><span class="l">tokens</span><span class="v">${fmtN(ag.stats.tokens)}</span></div>
        <div class="dstat"><span class="l">retries</span><span class="v">${ag.stats.retries}</span></div>
      </div>
      ${ag.task?`<div class="dtask" style="--ac:${a.color}"><span class="tl">current task</span>${esc(ag.task)}</div>`:""}
    </div>
    ${ag.approval ? approvalHTML(ag) : ""}
    <div class="dgrid">
      <div>
        <div class="panel"><div class="panel-h"><span>Plan</span><span class="mono" style="color:var(--dim)">${ag.plan.filter(s=>s.st==="done").length}/${ag.plan.length}</span></div>
          <div class="steps" id="steps-${a.id}">${stepsHTML(ag)}</div></div>
        <div class="panel" style="margin-top:14px"><div class="panel-h"><span>Long-term memory</span><span class="mono" style="color:var(--dim)">${ag.mem.length} facts</span></div>
          <div class="memlist" id="mem-${a.id}">${memHTML(ag)}</div></div>
      </div>
      <div class="panel"><div class="panel-h"><span>Live trace</span><span class="mono" style="color:var(--dim)">streaming</span></div>
        <div class="trace" id="trace-${a.id}">${traceHTML(ag)}</div></div>
    </div>`;
  const tr = $("trace-"+a.id);
  if (tr && ag.stick) tr.scrollTop = tr.scrollHeight;
  tr.onscroll = () => { ag.stick = tr.scrollHeight - tr.scrollTop - tr.clientHeight < 40; };
  const ap = $("appr-ok");
  if (ap){ ap.onclick = ()=>resolveApproval(a.id, true); $("appr-no").onclick = ()=>resolveApproval(a.id, false); }
}
function approvalHTML(ag){
  const st = ag.approval.step;
  return `<div class="appr-card">
    <div class="ah">⚠ Human approval required</div>
    <div class="ar">${esc(st.approval.risk)} · run paused, state persisted — nothing executes until you decide.</div>
    <code>${esc(st.tool)}(${esc(st.detail||"")})</code>
    <div class="appr-btns">
      <button class="btn-ok" id="appr-ok">Approve</button>
      <button class="btn-no" id="appr-no">Reject</button>
    </div></div>`;
}
function stepsHTML(ag){
  if (!ag.plan.length) return `<div class="tempty">no active plan — assign a task to begin</div>`;
  const icons = {wait:"", run:"◌", done:"✓", retry:"↻", "wait-appr":"⚠", skip:"✕"};
  return ag.plan.map((s,i)=>{
    const cls = s.st==="wait"?"":("st-"+s.st);
    return `<div class="step ${cls}">
      <div class="sicon">${icons[s.st]||""}</div>
      <div style="flex:1;min-width:0"><div class="stitle">${i+1}. ${esc(s.t)}</div>
        <div class="smeta"><span class="tag tool">${s.tool}</span><span class="tag model">${modelName(s.model)}</span>
        ${s.approval?`<span class="tag appr">approval</span>`:""}</div></div>
      ${s.dur?`<span class="sdur">${s.dur.toFixed(0)}s</span>`:""}
    </div>`;
  }).join("");
}
function traceHTML(ag){
  if (!ag.trace.length) return `<div class="tempty">trace idle — assign a task and watch the agent think</div>`;
  return ag.trace.map(l=>`<div class="tl${l.sub?" sub":""}"><span class="ts">${l.t}</span><span class="ttag ${l.tag}">${l.tag}</span><span>${esc(l.msg)}</span></div>`).join("");
}
function memHTML(ag){
  if (!ag.mem.length) return `<div class="tempty" style="padding:12px">nothing stored yet</div>`;
  return ag.mem.map(m=>`<div class="mem"><b>◆</b> ${esc(m)}</div>`).join("");
}
/* targeted updates (avoid full re-render churn during streaming) */
function renderSteps(agentId){
  const el = $("steps-"+agentId);
  if (el && S.selected===agentId) el.innerHTML = stepsHTML(S.agents[agentId]);
  renderFleet();
}
function renderTrace(agentId){
  const el = $("trace-"+agentId);
  if (el && S.selected===agentId){
    el.innerHTML = traceHTML(S.agents[agentId]);
    if (S.agents[agentId].stick) el.scrollTop = el.scrollHeight;
  }
  renderModelsLite();
}
function renderMem(agentId){
  const el = $("mem-"+agentId);
  if (el && S.selected===agentId) el.innerHTML = memHTML(S.agents[agentId]);
}

/* ---------------- models view ---------------- */
function modelSourceLine(){
  const m = MODELS_META;
  const bits = [];
  if (m.snapshot_date) bits.push("pricing snapshot " + m.snapshot_date);
  if (m.source === "live" && m.refreshed_at)
    bits.push("live refresh " + new Date(m.refreshed_at).toLocaleString());
  else if (m.source === "cache") bits.push("cached live prices");
  return bits.join(" · ") || "loading…";
}
function renderModels(){
  const v = $("view-models");
  const ids = Object.keys(MODELS);
  if (!ids.length){
    v.innerHTML = `<div class="empty">Loading live model catalog…</div>`;
    return;
  }
  const maxAA = Math.max(1, ...ids.map(id => MODELS[id].aa_index || 0));
  const cards = ids.map(id => {
    const m = MODELS[id];
    const calls = S.ledger.filter(l => tierModel(l.model) && tierModel(l.model).id === id);
    const cost = calls.reduce((s,l)=>s+l.cost,0);
    const toks = calls.reduce((s,l)=>s+l.tokIn+l.tokOut,0);
    const tierCls = m.tier === "ultra" ? "var(--amber)" : m.tier === "pro" ? "var(--teal)" : "var(--violet)";
    const aaBar = m.aa_index != null
      ? `<div class="mrow"><span>AA intelligence</span><b>${m.aa_index.toFixed(1)}</b></div>
         <div class="aabar"><i style="width:${Math.round(m.aa_index/maxAA*100)}%"></i></div>`
      : `<div class="mrow"><span>AA intelligence</span><b style="color:var(--dim)">n/a</b></div>`;
    const ctx = m.context ? (m.context >= 1e6 ? (m.context/1e6)+"M" : Math.round(m.context/1e3)+"k") : "—";
    return `<div class="mcard">
      <div class="mn">${esc(m.name)} <span class="tierdot" style="background:${tierCls}" title="${m.tier} tier"></span></div>
      <div class="mp">$${m.priceIn}/$${m.priceOut} per 1M · ctx ${ctx}<br>${esc(m.use)}</div>
      ${aaBar}
      <div class="mrow"><span>calls</span><b>${calls.length}</b></div>
      <div class="mrow"><span>tokens</span><b>${fmtN(toks)}</b></div>
      <div class="mrow"><span>cost</span><b>${fmt$(cost)}</b></div></div>`;
  }).join("");
  const recent = S.ledger.slice(-40).reverse();
  const min1 = S.ledger.filter(l=>Date.now()-l.t<60000);
  const rpm = Math.min(60, min1.length), pct = Math.round(rpm/60*100);
  v.innerHTML = `
    <div class="panel" style="margin-bottom:14px"><div class="panel-h"><span>Router policy</span>
      <button class="chipbtn" id="refresh-prices" data-act="refresh-prices">↻ refresh live prices</button></div>
      <div style="padding:12px 16px;font-size:13px;color:var(--mut);font-family:var(--mono)">${esc(ROUTER_POLICY())}</div>
      <div class="src-line">prices: OpenRouter (live, no key) · benchmarks: Artificial Analysis Intelligence Index · ${esc(modelSourceLine())}</div></div>
    <div class="mgrid">${cards}</div>
    <div class="dgrid" style="grid-template-columns:1fr 1fr">
      <div class="panel"><div class="panel-h"><span>Rate limit</span><span class="mono" style="color:var(--dim)">${rpm}/60 rpm</span></div>
        <div style="padding:14px 16px"><div class="rlbar"><i style="width:${pct}%"></i></div>
        <div class="rl-l">token bucket · refills 1/s · bursts to 120 (simulated)</div></div></div>
      <div class="panel"><div class="panel-h"><span>Recent model calls</span></div>
        <div class="trace loglist" style="height:220px">${recent.length?recent.map(l=>{
          const tm = tierModel(l.model);
          return `<div class="tl"><span class="ts">${new Date(l.t).toTimeString().slice(0,8)}</span><span class="ttag model">${esc(tm?tm.name:l.model)}</span><span>${l.agent} · ${fmtN(l.tokIn+l.tokOut)} tok · ${l.ms}ms (sim) · ${fmt$(l.cost)}</span></div>`;
        }).join(""):`<div class="tempty">no calls yet</div>`}</div></div>
    </div>`;
  const rp = $("refresh-prices");
  if (rp) rp.onclick = () => refreshPrices(false);
}
function renderModelsLite(){ if (S.tab==="models") renderModels(); }

/* ---------------- tools view ---------------- */
function renderTools(){
  const v = $("view-tools");
  v.innerHTML = `<div class="tgrid">` + TOOLS.map((t,i)=>{
    const avg = t.calls ? Math.round(t.ms/t.calls) : 0;
    return `<div class="toolc" data-act="tool" data-i="${i}">
      <div class="tn">${t.name}<span class="perm ${t.perm}">${t.perm}</span></div>
      <div class="toold">${t.desc}</div>
      <div class="toolm"><span>${t.calls} calls</span><span>${avg?("avg "+avg+"ms"):"—"}</span></div>
      ${t._open?`<div class="toolcalls">${t.recent.length?t.recent.map(r=>`<span>· ${esc(r)}</span>`).join(""):"<span>no calls yet</span>"}</div>`:""}
    </div>`;
  }).join("") + `</div>
  <div class="empty" style="padding:20px">destructive tools (red) always pause for human approval — enforced by the policy engine, not the agent.</div>`;
}

/* ---------------- evals view ---------------- */
function renderEvals(){
  const v = $("view-evals");
  if (!S.evals.length){ v.innerHTML = `<div class="empty">No completed runs yet.<br>Assign a task — every run is scored on plan quality, tool efficiency, cost and safety.</div>`; return; }
  v.innerHTML = S.evals.map(e=>{
    const bars = [["Plan quality",e.scores.plan],["Tool efficiency",e.scores.tools],["Cost efficiency",e.scores.cost],["Safety",e.scores.safety]];
    return `<div class="eval"><div class="eh">
      <div><div class="et">${esc(e.task)}</div><div class="ea">${e.agent} · ${e.kind} · ${e.secs}s · ${fmt$(e.cost)} · ${fmtN(e.tokens)} tok · ${e.retries} retries · ${e.approvals} approvals${e.skipped?` · ${e.skipped} skipped (rejected)`:""}<br>${esc(e.at)}</div></div>
      <div class="escore">${e.scores.overall}</div></div>
      <div class="ebars">${bars.map(([l,s])=>`<div class="ebar"><div class="bl"><span>${l}</span><b>${s}</b></div><div class="bt"><i style="width:${s}%"></i></div></div>`).join("")}</div>
    </div>`;
  }).join("");
}

/* ---------------- modal / toast / events ---------------- */
let modalAgent = "forge";
function openModal(){
  $("suggest-chips").innerHTML = SUGGESTED.map(s=>`<button data-act="suggest" data-s="${esc(s)}">${esc(s)}</button>`).join("");
  renderAgentPick();
  $("task-input").value = "";
  $("task-modal").hidden = false;
  setTimeout(()=>$("task-input").focus(), 50);
}
function renderAgentPick(){
  $("agent-pick").innerHTML = AGENTS.map(a=>{
    const ag = S.agents[a.id];
    const busy = ag.status==="working"||ag.status==="waiting";
    return `<button data-act="pick-agent" data-id="${a.id}" class="${modalAgent===a.id?"on":""}" ${busy&&ag.queue.length>=2?"disabled":""}>
      ${a.name}<span class="sub">${busy?"busy"+(ag.queue.length?" · "+ag.queue.length+" queued":"")+" — will queue":"idle"}</span></button>`;
  }).join("");
}
function toast(msg){
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(t._h); t._h = setTimeout(()=>t.hidden=true, 2600);
}
document.addEventListener("click", e=>{
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act==="tab"){
    S.tab = el.dataset.tab;
    document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on", b===el));
    ["control","models","tools","evals"].forEach(t=>$("view-"+t).hidden = t!==S.tab);
    render();
  }
  else if (act==="select-agent"){ S.selected = el.dataset.id; renderFleet(); renderDetail(); }
  else if (act==="new-task"){ openModal(); }
  else if (act==="close-modal"){ $("task-modal").hidden = true; }
  else if (act==="suggest"){ $("task-input").value = el.dataset.s; }
  else if (act==="pick-agent"){ modalAgent = el.dataset.id; renderAgentPick(); }
  else if (act==="assign-task"){
    const txt = $("task-input").value.trim();
    if (!txt){ toast("Describe the task first"); return; }
    const ag = S.agents[modalAgent];
    ag.queue.push(txt);
    $("task-modal").hidden = true;
    toast(`Task assigned to ${ag.cfg.name}${ag.status==="working"||ag.status==="waiting"?" — queued":""}`);
    S.selected = modalAgent;
    if (ag.status==="idle") runLoop(modalAgent);
    render();
  }
  else if (act==="chaos"){ S.chaos = !S.chaos; renderHeader(); toast(S.chaos?"chaos on — expect tool failures & retries":"chaos off"); }
  else if (act==="tool"){ const t = TOOLS[+el.dataset.i]; t._open = !t._open; renderTools(); }
});
$("task-modal").addEventListener("click", e=>{ if (e.target===$("task-modal")) $("task-modal").hidden = true; });

/* ---------------- boot ---------------- */
render();                       // skeleton immediately
loadModels().then(()=>{ render(); });  // real catalog, then full render
setTimeout(()=>{ S.agents.forge.queue.push("Deploy checkout service v2.4 to production"); S.selected="forge"; runLoop("forge"); }, 1200);
setTimeout(()=>{ S.agents.atlas.queue.push("Research EV battery suppliers and draft a comparison report"); runLoop("atlas"); }, 5200);
