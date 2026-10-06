/* Personal Digital Twin — a prediction machine about you.
   Model: 8 latent traits in [-1,1], learned by running average over the
   trait-loadings of choices you actually make. Predictions use a
   temperature-scaled softmax over trait-weighted option scores.
   Scoring: multi-class Brier score. All transparent, all in this file. */
"use strict";

/* ---------- traits ---------- */
const TRAITS = {
  novelty:      { name: "Novelty seeking", lo: "familiar comforts", hi: "new experiences" },
  value:        { name: "Value focus",     lo: "premium is fine",   hi: "price sharp" },
  comfort:      { name: "Comfort first",   lo: "rough it",          hi: "comfort matters" },
  risk:         { name: "Risk appetite",   lo: "play it safe",      hi: "bold bets" },
  social:       { name: "Social battery",  lo: "solo recharge",     hi: "with people" },
  pace:         { name: "Decisiveness",    lo: "deliberate",        hi: "fast mover" },
  loyalty:      { name: "Loyalty",         lo: "switch freely",      hi: "stick with favorites" },
  spontaneity:  { name: "Spontaneity",     lo: "planner",           hi: "spur-of-moment" },
};
const DOMAINS = ["career","purchases","travel","food","entertainment","tech","projects"];

/* ---------- onboarding quiz: 12 forced choices ---------- */
const QUIZ = [
  { d:"purchases", q:"Grocery run: store brand, or the name brand you trust?",
    a:["Store brand","Name brand"], load:[{value:.7,loyalty:-.3},{value:-.5,loyalty:.6}] },
  { d:"food", q:"Breakfast: the same thing every day, or mix it up?",
    a:["Same thing","Mix it up"], load:[{novelty:-.6,comfort:.3},{novelty:.6}] },
  { d:"travel", q:"Hotel: the cheapest decent option, or the nicest you can justify?",
    a:["Cheapest decent","Nicest justified"], load:[{value:.7,comfort:-.4},{value:-.5,comfort:.7}] },
  { d:"entertainment", q:"Saturday: host friends, or recharge alone?",
    a:["Host friends","Recharge alone"], load:[{social:.8},{social:-.8,comfort:.3}] },
  { d:"tech", q:"New app: keep the defaults, or customize everything?",
    a:["Defaults","Customize all"], load:[{novelty:-.4,pace:.3},{novelty:.5,pace:-.3}] },
  { d:"career", q:"At work: volunteer for the ambiguous project, or the well-defined one?",
    a:["Ambiguous","Well-defined"], load:[{risk:.7,novelty:.4},{risk:-.6,comfort:.3}] },
  { d:"purchases", q:"Sale ends tonight: buy now, or sleep on it?",
    a:["Buy now","Sleep on it"], load:[{pace:.7,spontaneity:.5},{pace:-.6,value:.3}] },
  { d:"projects", q:"Side-project idea at 11pm: start tonight, or add it to the list?",
    a:["Start tonight","Add to the list"], load:[{spontaneity:.8,pace:.5},{spontaneity:-.6,pace:-.4}] },
  { d:"food", q:"New restaurant: order the weird special, or the safe favorite?",
    a:["Weird special","Safe favorite"], load:[{novelty:.7,risk:.3},{novelty:-.6,loyalty:.4}] },
  { d:"travel", q:"Itinerary: packed with sights, or one neighborhood, slowly?",
    a:["Packed","One neighborhood"], load:[{pace:.5,novelty:.3},{pace:-.5,comfort:.4}] },
  { d:"entertainment", q:"Movie night: the latest blockbuster, or an obscure indie film?",
    a:["Blockbuster","Indie film"], load:[{novelty:-.3,loyalty:.3},{novelty:.6,social:-.2}] },
  { d:"career", q:"Raise time: ask aggressively, or wait to be recognized?",
    a:["Ask","Wait"], load:[{risk:.6,pace:.4},{risk:-.5,loyalty:.3}] },
];

/* ---------- prediction bank: 21 scenarios, 3 per domain ---------- */
const BANK = [
  { id:"c1", d:"career", q:"A recruiter pings you about a Staff Backend role at a frontier AI lab. Interview prep would eat your weekends for a month.",
    a:["Go for it","Pass, focus on current work"], load:[{risk:.6,pace:.5,novelty:.3},{risk:-.5,pace:-.4,comfort:.3}] },
  { id:"c2", d:"career", q:"Your manager offers: lead a high-visibility migration (promo fast-track, on-call pain) or keep your calm, well-scoped project.",
    a:["Take the migration","Keep the calm project"], load:[{risk:.7,comfort:-.4,pace:.3},{risk:-.4,comfort:.6,pace:-.3}] },
  { id:"c3", d:"career", q:"A friend wants you to co-found a dev-tools startup. 50% pay cut, real equity.",
    a:["Join as co-founder","Stay employed"], load:[{risk:.9,novelty:.5,value:-.4},{risk:-.7,value:.5,comfort:.3}] },
  { id:"p1", d:"purchases", q:"Your phone is 3 years old. New model: better camera, same look.",
    a:["Upgrade now","Wait another year"], load:[{novelty:.5,value:-.5,loyalty:.4},{value:.6,novelty:-.4}] },
  { id:"p2", d:"purchases", q:"Two headphones: the $349 flagship with great reviews, or the $129 pair that's 90% as good?",
    a:["Flagship","The $129 pair"], load:[{value:-.7,comfort:.4},{value:.8}] },
  { id:"p3", d:"purchases", q:"A course you want is $199 today, or free via the library in 3 weeks.",
    a:["Buy it now","Wait for free"], load:[{pace:.6,value:-.4,spontaneity:.4},{value:.6,pace:-.5}] },
  { id:"t1", d:"travel", q:"One week off: Kyoto (been before, loved it) or Patagonia (totally new)?",
    a:["Kyoto again","Patagonia"], load:[{novelty:-.7,loyalty:.4,comfort:.3},{novelty:.8,risk:.3,comfort:-.3}] },
  { id:"t2", d:"travel", q:"Flight deal: $400 red-eye with a layover, or $750 direct, daytime?",
    a:["Red-eye, save $350","Direct flight"], load:[{value:.7,comfort:-.5},{value:-.5,comfort:.7}] },
  { id:"t3", d:"travel", q:"Weekend trip: plan every hour in advance, or book the flight and wing it?",
    a:["Plan it all","Wing it"], load:[{spontaneity:-.7,pace:-.2},{spontaneity:.8}] },
  { id:"f1", d:"food", q:"Date night: the amazing ramen spot you love, or the new tasting menu everyone's talking about?",
    a:["Ramen spot","Tasting menu"], load:[{novelty:-.6,loyalty:.5,value:.3},{novelty:.7,value:-.5}] },
  { id:"f2", d:"food", q:"Lunch: the $18 salad near the office, or the $9 banh mi, 10-minute walk?",
    a:["$18 salad","Banh mi"], load:[{comfort:.5,value:-.5},{value:.7,comfort:-.3}] },
  { id:"f3", d:"food", q:"Cooking tonight: a new complex recipe, or your reliable 20-minute staple?",
    a:["New recipe","Reliable staple"], load:[{novelty:.6,pace:-.3},{novelty:-.5,comfort:.4}] },
  { id:"e1", d:"entertainment", q:"Friday night: concert tickets ($90, great band) or movie night at home?",
    a:["Concert","Movie at home"], load:[{social:.6,value:-.4,spontaneity:.3},{social:-.5,comfort:.5,value:.4}] },
  { id:"e2", d:"entertainment", q:"New game everyone loves: the 60-hour RPG, or quick roguelike runs?",
    a:["60-hour RPG","Roguelike"], load:[{novelty:.3,pace:-.5,loyalty:.3},{pace:.5,novelty:.2}] },
  { id:"e3", d:"entertainment", q:"A friend invites you to a party where you know nobody.",
    a:["Go","Skip"], load:[{social:.8,risk:.3,novelty:.3},{social:-.7,comfort:.3}] },
  { id:"h1", d:"tech", q:"Side project needs a backend: the boring battle-tested stack, or the shiny new framework?",
    a:["Boring stack","Shiny framework"], load:[{risk:-.6,novelty:-.5},{novelty:.7,risk:.4}] },
  { id:"h2", d:"tech", q:"New AI coding tool: $20/mo, big productivity claims.",
    a:["Subscribe","Stick with current setup"], load:[{novelty:.5,value:-.3,pace:.4},{loyalty:.5,value:.4,novelty:-.3}] },
  { id:"h3", d:"tech", q:"Weekend: rebuild your homelab properly, or finally write docs for your project?",
    a:["Rebuild homelab","Write docs"], load:[{novelty:.4,spontaneity:.3},{pace:-.5,comfort:.2}] },
  { id:"j1", d:"projects", q:"Side project is 80% done but boring now. A new idea is exciting.",
    a:["Finish the 80%","Chase the new idea"], load:[{pace:-.3,loyalty:.5,risk:-.3},{novelty:.7,spontaneity:.5}] },
  { id:"j2", d:"projects", q:"Open-source your project (feedback + maintenance burden) or keep it private?",
    a:["Open source it","Keep private"], load:[{social:.5,risk:.4},{risk:-.4,comfort:.3}] },
  { id:"j3", d:"projects", q:"Learn in public (post progress weekly) or build quietly until launch?",
    a:["Learn in public","Build quietly"], load:[{social:.6,risk:.3},{social:-.5,pace:-.2}] },
];

/* ---------- counterfactuals: commit now, resolve later ---------- */
const CFS = [
  { id:"cf1", d:"career", q:"Two offers land tomorrow: Staff Engineer at a frontier AI lab, or founding engineer at a 12-person startup. Which would you take?",
    a:["The AI lab","The startup"], load:[{risk:-.6,comfort:.4,value:.4},{risk:.8,novelty:.5,pace:.4}] },
  { id:"cf2", d:"projects", q:"Will you ship a v1 of a side project within the next 6 weeks?",
    a:["Yes, shipped","No, still in progress"], load:[{pace:.5,risk:.2,spontaneity:.3},{pace:-.5,comfort:.2}] },
  { id:"cf3", d:"travel", q:"Your next big trip: somewhere you've never been, or a favorite worth repeating?",
    a:["Somewhere new","A favorite, again"], load:[{novelty:.8,risk:.2},{novelty:-.7,loyalty:.4}] },
];

/* ---------- state ---------- */
const LSKEY = "twin_state_v2", LSKEY_V1 = "twin_state_v1";
function freshTraits(){ const o={}; for(const k in TRAITS) o[k]={v:0,n:0}; return o; }
function freshMarkets(){ return { ts:0, lastCheck:0, items:[] }; }
let S = { quizDone:false, quizIdx:0, traits:freshTraits(), log:[], seq:0, markets:freshMarkets() };
function save(){ try{ localStorage.setItem(LSKEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{
  const r=localStorage.getItem(LSKEY)||localStorage.getItem(LSKEY_V1);
  if(r){ const p=JSON.parse(r); if(p&&p.traits){ S=p; } }
  if(!S.markets) S.markets=freshMarkets();
  if(!Array.isArray(S.markets.items)) S.markets.items=[];
}catch(e){} }

/* ---------- the model (transparent, tiny) ---------- */
// Learn: running average of the trait-loadings of choices you actually make.
function applyLoadings(load){
  for(const t in load){
    const tr=S.traits[t]; if(!tr) continue;
    tr.v=(tr.v*tr.n+load[t])/(tr.n+1);
    tr.n++;
    if(tr.v>1)tr.v=1; if(tr.v<-1)tr.v=-1;
  }
}
// Predict: trait-weighted scores -> temperature softmax -> probabilities.
const TEMP=0.5;
function predictProbs(opts){
  const sc=opts.map(o=>{ let s=0; for(const t in o.load) s+=(S.traits[t]?S.traits[t].v:0)*o.load[t]; return s; });
  const ex=sc.map(s=>Math.exp(s/TEMP)), sum=ex.reduce((a,b)=>a+b,0);
  return ex.map(e=>e/sum);
}
function argmax(a){ let bi=0; for(let i=1;i<a.length;i++) if(a[i]>a[bi]) bi=i; return bi; }
// Reasoning factors: signed trait contributions to the predicted option.
function factors(opts,idx){
  const arr=[];
  for(const t in opts[idx].load) arr.push({t, c:(S.traits[t]?S.traits[t].v:0)*opts[idx].load[t]});
  arr.sort((a,b)=>b.c-a.c);
  return arr.slice(0,3);
}
// Multi-class Brier score: mean squared error of the probability vector.
function brier(probs,chosen){
  let s=0; for(let i=0;i<probs.length;i++){ const y=i===chosen?1:0; s+=(probs[i]-y)*(probs[i]-y); }
  return s/probs.length;
}
function scoredLog(){ return S.log.filter(e=>e.status==="scored"); }
function stats(){
  const L=scoredLog(), n=L.length;
  const acc=n?L.filter(e=>e.correct).length/n:null;
  const br=n?L.reduce((a,e)=>a+e.brier,0)/n:null;
  const avgConf=n?L.reduce((a,e)=>a+e.conf,0)/n:null;
  return {n,acc,br,avgConf};
}
function traitWord(t,v){
  const T=TRAITS[t];
  return v>=0?T.hi:T.lo;
}
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function $(id){ return document.getElementById(id); }
function pct(x){ return Math.round(x*100)+"%"; }

/* ---------- onboarding ---------- */
function showOnboard(){ $("onboard").hidden=false; renderOnboardHero(); }
function hideOnboard(){ $("onboard").hidden=true; }

function renderOnboardHero(){
  $("onboard-card").innerHTML =
    '<h1><span class="mark">◐</span> Meet your twin</h1>'+
    '<p>Not a chatbot. A <b style="color:var(--ink)">prediction machine about you</b>.'+
    ' Answer 12 quick choices so it can build a model of your preferences —'+
    ' then it starts predicting your decisions <i>before</i> you make them, and scores itself.</p>'+
    '<p>It will be wrong sometimes. That\'s the point: every miss is shown, measured, and learned from.</p>'+
    '<button class="btn" id="ob-start">Build my twin — 12 questions</button>'+
    '<button class="btn ghost" id="ob-skip" style="margin-top:10px">Skip for now — explore the markets</button>';
  $("ob-start").onclick=()=>{ S.quizIdx=0; save(); renderQuizQ(); };
  $("ob-skip").onclick=()=>{ hideOnboard(); renderAll(); };
}

function renderQuizQ(){
  const i=S.quizIdx, q=QUIZ[i], card=$("onboard-card");
  card.innerHTML =
    '<div class="qcount">QUESTION '+(i+1)+' / '+QUIZ.length+' · '+esc(q.d).toUpperCase()+'</div>'+
    '<div class="qprog"><i style="width:'+Math.round(i/QUIZ.length*100)+'%"></i></div>'+
    '<p class="qtext">'+esc(q.q)+'</p>'+
    '<div class="opts">'+
      '<button class="opt" data-i="0">'+esc(q.a[0])+'</button>'+
      '<button class="opt" data-i="1">'+esc(q.a[1])+'</button>'+
    '</div><div class="qupd" id="qupd"></div>';
  card.querySelectorAll(".opt").forEach(b=>{
    b.onclick=()=>{
      const idx=+b.dataset.i;
      card.querySelectorAll(".opt").forEach(x=>{x.disabled=true;});
      b.classList.add("picked");
      const before=JSON.parse(JSON.stringify(S.traits));
      applyLoadings(q.load[idx]);
      // visible trait-weight update: show the biggest mover
      let bt=null,bd=0;
      for(const t in q.load[idx]){ const d=S.traits[t].v-before[t].v; if(Math.abs(d)>Math.abs(bd)){bd=d;bt=t;} }
      $("qupd").textContent = bt ? ("twin update: "+TRAITS[bt].name+" "+(bd>=0?"+":"")+bd.toFixed(2)) : "";
      S.quizIdx++; save();
      setTimeout(()=>{
        if(S.quizIdx>=QUIZ.length){ S.quizDone=true; save(); renderQuizDone(); }
        else renderQuizQ();
      }, 850);
    };
  });
}

function renderQuizDone(){
  const card=$("onboard-card");
  const strong=Object.keys(TRAITS).map(k=>({k,v:S.traits[k].v}))
    .sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,3);
  card.innerHTML =
    '<h1><span class="mark">◐</span> Twin calibrated</h1>'+
    '<p>12 choices in. Your twin\'s strongest reads on you:</p>'+
    strong.map(s=>'<div class="why"><b>'+esc(TRAITS[s.k].name)+'</b> '+
      '<span class="'+(s.v>=0?"pos":"neg")+'">'+(s.v>=0?"+":"")+s.v.toFixed(2)+'</span>'+
      ' — leans '+esc(traitWord(s.k,s.v))+'</div>').join("")+
    '<p>Now it predicts <i>before</i> you answer. Let\'s see how well it knows you.</p>'+
    '<button class="btn" id="ob-go">Start predicting</button>';
  $("ob-go").onclick=()=>{ hideOnboard(); renderAll(); };
}

/* ---------- predict view ---------- */
let cur=null;
function nextScenario(){
  const asked=new Set(S.log.filter(e=>e.kind==="pred").map(e=>e.scnId));
  const pool=BANK.filter(b=>!asked.has(b.id));
  const src=pool.length?pool:BANK;
  return src[Math.floor(Math.random()*src.length)];
}
function whyHTML(opts,idx){
  return factors(opts,idx).map(f=>{
    const w=traitWord(f.t, S.traits[f.t].v);
    return '<div><b>'+esc(TRAITS[f.t].name)+'</b> <span class="'+(f.c>=0?"pos":"neg")+'">'+(f.c>=0?"+":"")+f.c.toFixed(2)+
      '</span> — leans '+esc(w)+'</div>';
  }).join("");
}
function renderPredict(){
  const w=$("pred-wrap");
  cur={ scn:nextScenario() };
  // pre-commit: the twin locks in its prediction NOW, but it stays hidden
  // until the user answers — otherwise the reveal contaminates the pick.
  cur.probs=predictProbs(cur.scn.load.map(l=>({load:l})));
  cur.pred=argmax(cur.probs); cur.conf=cur.probs[cur.pred];
  w.innerHTML =
    '<div class="pcard">'+
      '<span class="domain">'+esc(cur.scn.d)+'</span>'+
      '<p class="q">'+esc(cur.scn.q)+'</p>'+
      '<div class="twinbox locked" id="twinbox"><div class="tw">◐ twin predicts</div>'+
        '<div class="twin-pick">🔒 locked in — answer below to reveal</div>'+
      '</div>'+
      '<div class="opts" id="pred-opts">'+
        cur.scn.a.map((t,i)=>'<button class="opt" data-i="'+i+'">'+esc(t)+'</button>').join("")+
      '</div>'+
      '<div id="pred-verdict"></div>'+
    '</div>';
  w.querySelectorAll("#pred-opts .opt").forEach(b=>{ b.onclick=()=>answerPred(+b.dataset.i); });
}
function answerPred(idx){
  const scn=cur.scn, pred=cur.pred, conf=cur.conf, probs=cur.probs;
  const correct=idx===pred, br=brier(probs,idx);
  const before=JSON.parse(JSON.stringify(S.traits));
  applyLoadings(scn.load[idx]);
  let bt=null,bd=0;
  for(const t in scn.load[idx]){ const d=S.traits[t].v-before[t].v; if(Math.abs(d)>Math.abs(bd)){bd=d;bt=t;} }
  S.seq++;
  S.log.push({seq:S.seq,kind:"pred",scnId:scn.id,domain:scn.d,q:scn.q,options:scn.a.slice(),
    predIdx:pred,conf:+conf.toFixed(3),chosenIdx:idx,correct,brier:+br.toFixed(3),status:"scored",ts:Date.now()});
  save();
  const btns=document.querySelectorAll("#pred-opts .opt");
  btns.forEach(b=>{ b.disabled=true; const i=+b.dataset.i;
    if(i===pred) b.classList.add(correct?"right":"wrong");
    if(i===idx&&!correct) b.classList.add("picked");
  });
  // reveal the locked-in prediction only now that the user has committed
  $("twinbox").classList.remove("locked");
  $("twinbox").innerHTML =
    '<div class="tw">◐ twin predicted</div>'+
    '<div class="twin-pick">'+esc(scn.a[pred])+'</div>'+
    '<div class="confbar"><i style="width:'+pct(conf)+'"></i></div>'+
    '<div class="confn">'+pct(conf)+' confident</div>'+
    '<div class="why">'+whyHTML(scn.load.map(l=>({load:l})),pred)+'</div>';
  $("pred-verdict").innerHTML =
    '<div class="verdict '+(correct?"right":"wrong")+'">'+
      (correct?"🎯 Twin called it.":"✗ Twin missed — and that's data.")+
      '<span class="sub">Predicted <b>'+esc(scn.a[pred])+'</b> at '+pct(conf)+
      ', you chose <b>'+esc(scn.a[idx])+'</b>. Brier '+br.toFixed(3)+
      (bt?' · twin update: '+esc(TRAITS[bt].name)+' '+(bd>=0?"+":"")+bd.toFixed(2):"")+'</span></div>'+
    '<button class="btn" id="pred-next">Next prediction →</button>';
  $("pred-next").onclick=renderPredict;
  renderTop();
}

/* ---------- what-if view ---------- */
function renderWhatif(){
  const cl=$("cf-list");
  cl.innerHTML=CFS.map(c=>{
    const already=S.log.some(e=>e.kind==="cf"&&e.scnId===c.id&&e.status==="open");
    const probs=predictProbs(c.load.map(l=>({load:l})));
    const pred=argmax(probs), conf=probs[pred];
    return '<div class="pcard"><span class="domain">'+esc(c.d)+' · open question</span>'+
      '<p class="q">'+esc(c.q)+'</p>'+
      '<div class="twinbox"><div class="tw">◐ twin predicts</div>'+
      '<div class="twin-pick">'+esc(c.a[pred])+'</div>'+
      '<div class="confbar"><i style="width:'+pct(conf)+'"></i></div>'+
      '<div class="confn">'+pct(conf)+' confident</div>'+
      '<div class="why">'+whyHTML(c.load.map(l=>({load:l})),pred)+'</div></div>'+
      (already
        ? '<div class="fine">Committed — resolve it below when life answers.</div>'
        : '<button class="btn" data-cf="'+c.id+'">Commit this prediction</button>')+
    '</div>';
  }).join("");
  cl.querySelectorAll("[data-cf]").forEach(b=>{
    b.onclick=()=>{
      const c=CFS.find(x=>x.id===b.dataset.cf);
      const probs=predictProbs(c.load.map(l=>({load:l})));
      const pred=argmax(probs);
      S.seq++;
      S.log.push({seq:S.seq,kind:"cf",scnId:c.id,domain:c.d,q:c.q,options:c.a.slice(),
        loadings:c.load.map(l=>Object.assign({},l)),
        predIdx:pred,conf:+probs[pred].toFixed(3),status:"open",ts:Date.now()});
      save(); renderWhatif();
    };
  });
  const ol=$("open-list"), open=S.log.filter(e=>e.status==="open").reverse();
  ol.innerHTML = open.length ? open.map(e=>
    '<div class="plog"><span class="pm">◷</span><b>'+esc(e.options[e.predIdx])+'</b>'+
    ' <span class="pconf">'+pct(e.conf)+'</span>'+
    '<div class="pq">'+esc(e.q)+'</div>'+
    '<div class="opts" style="margin-top:8px">'+e.options.map((t,i)=>
      '<button class="opt" data-seq="'+e.seq+'" data-i="'+i+'" style="font-size:13.5px;padding:10px">✓ '+esc(t)+' happened</button>'
    ).join("")+'</div></div>'
  ).join("") : '<div class="empty">No open predictions. Commit one above.</div>';
  ol.querySelectorAll("[data-seq]").forEach(b=>{
    b.onclick=()=>{
      const e=S.log.find(x=>x.seq===+b.dataset.seq); if(!e||e.status!=="open") return;
      const idx=+b.dataset.i, probs=predictProbs(e.loadings.map(l=>({load:l})));
      const correct=idx===e.predIdx, br=brier(probs,idx);
      applyLoadings(e.loadings[idx]);
      e.chosenIdx=idx; e.correct=correct; e.brier=+br.toFixed(3); e.status="scored";
      save(); renderWhatif(); renderTop(); renderDash();
    };
  });
}

/* ---------- live markets (Polymarket public Gamma API) ----------
   The twin's call on a market IS the crowd price (the best honest baseline).
   The user rides the crowd or fades it; the commitment is scored when the
   market actually resolves. Market answers never touch the trait model —
   they calibrate forecasting skill, not personal taste. */
const PM_SEARCH = "https://gamma-api.polymarket.com/public-search?q=";
const PM_EVENTS = "https://gamma-api.polymarket.com/events";
const PM_MARKET = "https://gamma-api.polymarket.com/markets/";
const PM_QUERIES = ["federal reserve rate cut","AI model","bitcoin price","ethereum","nvidia stock","recession","spacex launch","us election"];
const PM_CACHE_MS = 3600e3, PM_CHECK_MS = 3600e3;
const PM_MAX_DAYS = 240, PM_MIN_VOL = 1000, PM_FEED_N = 12;

function pmNum(x){ const n=parseFloat(x); return isFinite(n)?n:null; }
function fmtMoney(v){ v=+v||0; if(v>=1e6) return "$"+(v/1e6).toFixed(1)+"M"; if(v>=1e3) return "$"+(v/1e3).toFixed(0)+"K"; return "$"+Math.round(v); }
function fmtDate(iso){ try{ const d=new Date(iso); return d.toLocaleDateString(undefined,{month:"short",day:"numeric"}); }catch(e){ return ""; } }
function pmStatus(t){ const el=$("pm-status"); if(el) el.textContent=t||""; }

async function pmFetchJSON(url){
  const r=await fetch(url,{headers:{Accept:"application/json"}});
  if(!r.ok) throw new Error("HTTP "+r.status);
  return r.json();
}
// Filter a batch of full events down to clean binary Yes/No open markets.
function pmPickMarkets(events){
  const out=[], seen=new Set();
  const now=Date.now(), maxT=now+PM_MAX_DAYS*864e5;
  for(const e of (events||[])){
    if(!e) continue;
    for(const m of (e.markets||[])){
      if(!m||seen.has(String(m.id))) continue;
      let outcomes; try{ outcomes=JSON.parse(m.outcomes); }catch(_){ continue; }
      if(!Array.isArray(outcomes)||outcomes.length!==2) continue;
      const yi=outcomes.indexOf("Yes"), ni=outcomes.indexOf("No");
      if(yi<0||ni<0) continue;
      let prices; try{ prices=JSON.parse(m.outcomePrices).map(pmNum); }catch(_){ continue; }
      if(prices.length!==2||prices[yi]==null) continue;
      const crowdYes=prices[yi];
      if(m.closed||m.archived||!m.active) continue;
      const vol=pmNum(m.volume)||pmNum(e.volume)||0;
      if(vol<PM_MIN_VOL) continue;
      const endT=Date.parse(m.endDate||e.endDate||"");
      if(!isFinite(endT)||endT<now||endT>maxT) continue;
      if(crowdYes<0.03||crowdYes>0.97) continue; // nearly decided — no information in the call
      seen.add(String(m.id));
      out.push({ id:String(m.id), q:m.question||e.title||"Untitled market",
        crowdYes:+crowdYes.toFixed(3), vol, endDate:m.endDate||e.endDate });
    }
  }
  out.sort((a,b)=>(Date.parse(a.endDate)-Date.parse(b.endDate))||(b.vol-a.vol));
  return out.slice(0,PM_FEED_N);
}
async function pmRefresh(force){
  const mc=S.markets;
  if(!force&&mc.ts&&Date.now()-mc.ts<PM_CACHE_MS&&mc.items.length) return mc.items;
  pmStatus("Fetching live markets…");
  const ids=[];
  for(const q of PM_QUERIES){
    try{
      const d=await pmFetchJSON(PM_SEARCH+encodeURIComponent(q));
      for(const e of (d.events||[])){
        const id=String(e&&e.id||"");
        if(id&&!ids.includes(id)) ids.push(id);
      }
    }catch(_){/* keep going */}
    if(ids.length>=48) break;
  }
  const events=[];
  for(let i=0;i<ids.length;i+=12){
    try{
      const chunk=await pmFetchJSON(PM_EVENTS+"?"+ids.slice(i,i+12).map(id=>"id="+encodeURIComponent(id)).join("&"));
      if(Array.isArray(chunk)) events.push(...chunk);
    }catch(_){}
  }
  const items=pmPickMarkets(events);
  S.markets.ts=Date.now(); S.markets.items=items; save();
  pmStatus(items.length?("Live · "+items.length+" open markets · updated "+new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})):"");
  return items;
}
function marketCardHTML(m){
  const cy=m.crowdYes, leanYes=cy>=0.5, top=Math.max(cy,1-cy);
  return '<div class="pcard"><span class="domain">live market · resolves '+esc(fmtDate(m.endDate))+'</span>'+
    '<p class="q">'+esc(m.q)+'</p>'+
    '<div class="twinbox"><div class="tw">◐ the crowd says</div>'+
    '<div class="twin-pick">'+(leanYes?"Yes":"No")+' <span class="confn">'+pct(top)+'</span></div>'+
    '<div class="confbar"><i style="width:'+pct(top)+'"></i></div>'+
    '<div class="fine">'+fmtMoney(m.vol)+' volume · market-implied probability</div></div>'+
    '<div class="opts">'+
    '<button class="opt" data-mid="'+esc(m.id)+'" data-side="ride">Ride the crowd — '+(leanYes?"Yes":"No")+' at '+pct(top)+'</button>'+
    '<button class="opt" data-mid="'+esc(m.id)+'" data-side="fade">Fade the crowd — '+(leanYes?"No":"Yes")+' at '+pct(1-top)+'</button>'+
    '</div></div>';
}
function renderMarkets(){
  const w=$("markets-feed"); if(!w) return;
  w.innerHTML='<div class="fine">Loading live markets…</div>';
  pmRefresh(false).then(items=>{ paintMarketFeed(items,false); autoCheck(); })
    .catch(()=>{
      const cached=S.markets.items||[];
      if(cached.length){ paintMarketFeed(cached,true); }
      else{
        w.innerHTML='<div class="empty">Couldn\'t reach Polymarket — check your connection.</div>'+
          '<button class="btn ghost" id="pm-retry">Retry</button>';
        $("pm-retry").onclick=()=>renderMarkets();
      }
    });
}
function paintMarketFeed(items,stale){
  const w=$("markets-feed"); if(!w) return;
  const committed=new Set(S.log.filter(e=>e.kind==="market").map(e=>e.mid));
  const list=(items||[]).filter(m=>!committed.has(m.id));
  w.innerHTML=(stale?'<div class="fine">Showing cached markets (offline).</div>':"")+
    (list.length?list.map(marketCardHTML).join("")
      :'<div class="empty">No fresh markets right now — pull to refresh later.</div>');
  w.querySelectorAll("[data-mid]").forEach(b=>{ b.onclick=()=>commitMarket(b.dataset.mid,b.dataset.side==="ride"); });
  renderOpenMarkets();
}
function commitMarket(mid,ride){
  const m=(S.markets.items||[]).find(x=>x.id===String(mid)); if(!m) return;
  if(S.log.some(e=>e.kind==="market"&&e.mid===String(mid))) return; // one call per market
  const cy=m.crowdYes;
  const probs=ride?[cy,1-cy]:[1-cy,cy];
  const pred=argmax(probs);
  S.seq++;
  S.log.push({seq:S.seq,kind:"market",mid:String(mid),domain:"markets",q:m.q,options:["Yes","No"],
    probs:probs.map(p=>+p.toFixed(3)),crowdYes:cy,
    predIdx:pred,conf:+Math.max(probs[0],probs[1]).toFixed(3),
    status:"open",ts:Date.now(),endDate:m.endDate});
  save(); renderTop(); paintMarketFeed(S.markets.items,false);
  pmStatus("Call committed — it scores automatically when the market resolves.");
}
function renderOpenMarkets(){
  const ol=$("open-markets"); if(!ol) return;
  const open=S.log.filter(e=>e.kind==="market"&&e.status==="open").reverse();
  const done=S.log.filter(e=>e.kind==="market"&&e.status==="scored").slice(-4).reverse();
  ol.innerHTML=
    (open.length?open.map(e=>
      '<div class="plog"><span class="pm">◷</span>Your call: <b>'+esc(e.options[e.predIdx])+'</b>'+
      ' <span class="pconf">'+pct(e.conf)+'</span>'+
      '<div class="pq">'+esc(e.q)+' · resolves '+esc(fmtDate(e.endDate))+' · crowd was '+pct(e.crowdYes)+' Yes</div></div>'
    ).join(""):'<div class="empty">No open calls. Pick a side above.</div>')+
    (done.length?'<h3 class="sect">Recently resolved</h3>'+done.map(e=>
      '<div class="plog '+(e.correct?"right":"wrong")+'"><span class="pm">'+(e.correct?"✓":"✗")+'</span>'+
      'Resolved <b>'+esc(e.options[e.chosenIdx])+'</b> — you said <b>'+esc(e.options[e.predIdx])+'</b>'+
      ' <span class="pconf">'+pct(e.conf)+'</span>'+
      '<div class="pq">'+esc(e.q)+' · Brier '+e.brier.toFixed(3)+' (crowd '+e.crowdBrier.toFixed(3)+')</div></div>'
    ).join(""):"");
}
// A closed market resolves when one side's price is ~1.00.
function pmResolved(m){
  if(!m||!m.closed) return null;
  let outcomes,prices;
  try{ outcomes=JSON.parse(m.outcomes); prices=JSON.parse(m.outcomePrices).map(pmNum); }catch(_){ return null; }
  const yi=outcomes.indexOf("Yes"), ni=outcomes.indexOf("No");
  if(yi<0||!prices||prices.length!==2) return null;
  if(prices[yi]>=0.999) return 0;
  if(ni>=0&&prices[ni]>=0.999) return 1;
  return null;
}
let pmChecking=false;
async function checkResolutions(silent){
  if(pmChecking) return 0; pmChecking=true;
  const open=S.log.filter(e=>e.kind==="market"&&e.status==="open");
  let n=0;
  for(const e of open){
    try{
      const m=await pmFetchJSON(PM_MARKET+encodeURIComponent(e.mid));
      const res=pmResolved(m);
      if(res==null) continue;
      const probs=e.probs||[e.crowdYes,1-e.crowdYes];
      const correct=res===e.predIdx, br=brier(probs,res);
      const crowdBr=brier([e.crowdYes,1-e.crowdYes],res);
      e.chosenIdx=res; e.correct=correct; e.brier=+br.toFixed(3);
      e.crowdBrier=+crowdBr.toFixed(3); e.status="scored"; e.resolvedAt=Date.now();
      n++;
    }catch(_){/* network hiccup: try next time */}
  }
  S.markets.lastCheck=Date.now(); save();
  pmChecking=false;
  renderTop(); renderOpenMarkets();
  if(!$("view-dash").hidden) renderDash();
  if(!silent) pmStatus(n?(n+" market"+(n>1?"s":"")+" resolved — scores updated."):"No new resolutions yet. Markets resolve on their end date.");
  return n;
}
function autoCheck(){
  const hasOpen=S.log.some(e=>e.kind==="market"&&e.status==="open");
  if(hasOpen&&Date.now()-(S.markets.lastCheck||0)>PM_CHECK_MS) checkResolutions(true);
}

/* ---------- dashboard ---------- */
function renderDash(){
  const st=stats(), L=scoredLog();
  const dc=$("dash-cards");
  // markets vs the crowd: same resolved markets, scored both ways
  const mktL=L.filter(e=>e.kind==="market"&&e.crowdBrier!=null);
  let mktCard;
  if(mktL.length){
    const uBr=mktL.reduce((s,e)=>s+e.brier,0)/mktL.length;
    const cBr=mktL.reduce((s,e)=>s+e.crowdBrier,0)/mktL.length;
    mktCard=dcard("You vs the crowd", uBr<cBr?"you ✓":"crowd ✓",
      "your Brier "+uBr.toFixed(3)+" vs crowd "+cBr.toFixed(3)+" · "+mktL.length+" resolved");
  }else{
    mktCard=dcard("You vs the crowd","—","commit live-market calls to compare");
  }
  dc.innerHTML =
    dcard("Brier score", st.br==null?"—":st.br.toFixed(3),
      st.br==null?"predict to calibrate":"lower is better · coin flip = 0.250"+(st.br<0.25?" · beating chance ✓":""))+
    dcard("Accuracy", st.acc==null?"—":pct(st.acc), st.n+" scored predictions")+
    dcard("Avg confidence", st.avgConf==null?"—":pct(st.avgConf),
      st.acc==null?"":(st.avgConf>st.acc+0.05?"twin runs hot — overconfident":st.acc>st.avgConf+0.05?"twin runs cool — underconfident":"confidence matches reality"))+
    dcard("Traits w/ evidence", Object.values(S.traits).filter(t=>t.n>=3).length+" / 8",
      "traits with 3+ data points")+
    mktCard;
  drawCalib(L);
  // domains (dynamic: personal domains + any the log actually has)
  const dr=$("domain-rows");
  const doms=[...new Set([...DOMAINS,...L.map(e=>e.domain).filter(Boolean)])];
  dr.innerHTML=doms.map(d=>{
    const dl=L.filter(e=>e.domain===d), n=dl.length;
    const a=n?dl.filter(e=>e.correct).length/n:null;
    const br=n?dl.reduce((s,e)=>s+e.brier,0)/n:null;
    return '<div class="drow"><div class="dn">'+d+'</div><div class="bar"><i style="width:'+(a==null?0:pct(a))+'"></i></div>'+
      '<div class="dv2">'+(a==null?"no data":pct(a)+" · n="+n+(br!=null?" · "+br.toFixed(2):""))+'</div></div>';
  }).join("");
  // misses, most confident first
  const ml=$("miss-list"), misses=L.filter(e=>!e.correct).sort((a,b)=>b.conf-a.conf);
  ml.innerHTML=misses.length?misses.slice(0,8).map(e=>plogHTML(e)).join("")
    : (L.length?'<div class="empty">Suspiciously perfect. Predict more — the misses are coming.</div>'
              :'<div class="empty">No predictions scored yet.</div>');
  // recent
  const rl=$("recent-list"), rec=L.slice(-8).reverse();
  rl.innerHTML=rec.length?rec.map(e=>plogHTML(e)).join(""):'<div class="empty">Nothing yet.</div>';
}
function dcard(l,v,s){ return '<div class="dcard"><div class="dl">'+l+'</div><div class="dv">'+v+'</div><div class="ds">'+s+'</div></div>'; }
function plogHTML(e){
  return '<div class="plog '+(e.correct?"right":"wrong")+'"><span class="pm">'+(e.correct?"✓":"✗")+'</span>'+
    'Twin said <b>'+esc(e.options[e.predIdx])+'</b> <span class="pconf">'+pct(e.conf)+'</span>'+
    ' → you chose <b>'+esc(e.options[e.chosenIdx])+'</b>'+
    '<div class="pq">'+esc(e.q)+' · Brier '+e.brier.toFixed(3)+'</div></div>';
}
function drawCalib(L){
  const cv=$("calib"), box=cv.getBoundingClientRect(), W=Math.max(280,box.width||300), H=230;
  const dpr=window.devicePixelRatio||1;
  cv.width=W*dpr; cv.height=H*dpr; cv.style.height=H+"px";
  const g=cv.getContext("2d"); g.scale(dpr,dpr); g.clearRect(0,0,W,H);
  const pad={l:34,r:10,t:10,b:26}, iw=W-pad.l-pad.r, ih=H-pad.t-pad.b;
  const X=x=>pad.l+x*iw, Y=y=>pad.t+(1-y)*ih;
  g.strokeStyle="#28303c"; g.fillStyle="#6b7480"; g.font="10px sans-serif"; g.lineWidth=1;
  [0,.25,.5,.75,1].forEach(v=>{
    g.beginPath(); g.moveTo(X(0),Y(v)); g.lineTo(X(1),Y(v)); g.stroke();
    g.fillText(pct(v),4,Y(v)+3); g.fillText(pct(v),X(v)-8,H-8);
  });
  g.fillText("twin confidence →",pad.l+iw-92,H-8);
  g.save(); g.translate(10,pad.t+ih); g.rotate(-Math.PI/2); g.fillText("actual accuracy →",0,0); g.restore();
  // perfect-calibration diagonal
  g.strokeStyle="#3a4350"; g.setLineDash([5,4]); g.beginPath(); g.moveTo(X(0),Y(0)); g.lineTo(X(1),Y(1)); g.stroke(); g.setLineDash([]);
  const buckets=[[0.5,0.6],[0.6,0.7],[0.7,0.8],[0.8,0.9],[0.9,1.01]];
  let any=false;
  buckets.forEach(b=>{
    const inb=L.filter(e=>e.conf>=b[0]&&e.conf<b[1]);
    if(!inb.length) return; any=true;
    const mc=inb.reduce((s,e)=>s+e.conf,0)/inb.length;
    const ac=inb.filter(e=>e.correct).length/inb.length;
    const r=4+Math.min(10,Math.sqrt(inb.length)*3);
    g.beginPath(); g.arc(X(mc),Y(ac),r,0,7);
    g.fillStyle=ac>=mc?"rgba(76,175,125,.85)":"rgba(240,180,41,.9)"; g.fill();
    g.fillStyle="#0e1116"; g.font="bold 9px sans-serif"; g.textAlign="center";
    g.fillText("n="+inb.length,X(mc),Y(ac)+3); g.textAlign="left";
  });
  $("calib-empty").textContent = any ? "" :
    (L.length? "Not enough spread yet — keep predicting." : "The curve appears after your first scored predictions.");
}

/* ---------- traits view ---------- */
function renderTraits(){
  const tl=$("trait-list");
  tl.innerHTML=Object.keys(TRAITS).map(k=>{
    const tr=S.traits[k], v=tr.v, left=v<0?50+v*50:50, width=Math.abs(v)*50;
    const evd=Object.entries(lastEvidence(k)).map(([q,d])=>esc(q)+" <b>"+(d>0?"+":"")+d.toFixed(2)+"</b>").join("<br>");
    return '<div class="trait" data-t="'+k+'"><div class="th"><span class="tn">'+esc(TRAITS[k].name)+
      '</span><span class="tvv">'+(v>=0?"+":"")+v.toFixed(2)+'</span></div>'+
      '<div class="tbar"><span class="zero"></span><i style="left:'+left+'%;width:'+width+'%"></i></div>'+
      '<div class="poles"><span>'+esc(TRAITS[k].lo)+'</span><span>'+esc(TRAITS[k].hi)+'</span></div>'+
      '<div class="ev">'+(evd||"No evidence yet — answer predictions to teach the twin.")+
      '<br><span style="color:var(--dim)">'+tr.n+' data points</span></div></div>';
  }).join("");
  tl.querySelectorAll(".trait").forEach(el=>{ el.onclick=()=>el.classList.toggle("open"); });
  $("model-note").innerHTML="<b style='color:var(--ink)'>How the twin thinks.</b><br>"+
    "Each trait is a running average of the choices you've made. A prediction scores every option by "+
    "trait × loading, then converts scores to probabilities with a softmax (temperature 0.5). "+
    "Confidence is the top probability. Scoring uses the Brier score — mean squared error of the "+
    "probability vector. Nothing is hidden: every number on this page comes from these rules.";
}
// last few choices that moved a trait, for the evidence view
function lastEvidence(k){
  const out={};
  for(let i=S.log.length-1;i>=0&&Object.keys(out).length<3;i--){
    const e=S.log[i]; if(e.status!=="scored"||e.kind==="market") continue;
    const loads=e.kind==="cf"?e.loadings[e.chosenIdx]:(BANK.find(b=>b.id===e.scnId)||{load:[]}).load[e.chosenIdx];
    if(loads&&loads[k]) out[e.q.slice(0,42)+"…"]=loads[k];
  }
  return out;
}

/* ---------- chrome ---------- */
function renderTop(){
  const st=stats();
  $("ts-brier").textContent=st.br==null?"—":st.br.toFixed(3);
  $("ts-acc").textContent=st.acc==null?"—":pct(st.acc);
  $("ts-n").textContent=st.n;
}
const TABS=["markets","training","whatif","dash","traits"];
function showTab(name){
  document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===name));
  TABS.forEach(t=>{ $("view-"+t).hidden=t!==name; });
  if(name==="dash"){ renderDash(); }
  if(name==="whatif"){ renderWhatif(); }
  if(name==="traits"){ renderTraits(); }
  if(name==="markets"){ renderMarkets(); }
  if(name==="training"&&!cur){ renderPredict(); }
  window.scrollTo(0,0);
}
function renderAll(){ renderTop(); renderMarkets(); syncQuizBtn(); }
function syncQuizBtn(){ const b=$("btn-retake"); if(b) b.textContent = S.quizDone ? "Retake quiz" : "Take the quiz"; }

document.querySelectorAll("#tabs button").forEach(b=>{ b.onclick=()=>showTab(b.dataset.tab); });
$("btn-pm-refresh").onclick=()=>{ S.markets.ts=0; renderMarkets(); };
$("btn-pm-check").onclick=()=>checkResolutions(false);
$("btn-retake").onclick=()=>{ const msg = S.quizDone ? "Retake the quiz? This resets your traits but keeps scored predictions." : "Take the 12-question quiz to build your twin's preference model?"; if(confirm(msg)){
  S.traits=freshTraits(); S.quizDone=false; S.quizIdx=0; save(); showOnboard(); } };
$("btn-reset").onclick=()=>{ if(confirm("Erase the twin completely? All traits and predictions will be gone.")){
  localStorage.removeItem(LSKEY); location.reload(); } };

/* ---------- init ---------- */
load();
if(!S.quizDone && !S.onboardSeen){ S.onboardSeen=true; save(); showOnboard(); }
else { renderAll(); }
window.addEventListener("resize",()=>{ if(!$("view-dash").hidden) drawCalib(scoredLog()); });

/* test hook: exposes internals for automated checks; harmless in production */
window.__twin={S,predictProbs,brier,applyLoadings,argmax,factors,renderPredict,answerPred,
  renderDash,renderWhatif,renderTraits,renderTop,showTab,showOnboard,scoredLog,stats,
  BANK,QUIZ,CFS,TRAITS,nextScenario,
  pmPickMarkets,pmRefresh,pmResolved,checkResolutions,commitMarket,renderMarkets,fmtMoney,fmtDate};
