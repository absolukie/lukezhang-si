/* What Should We Talk About? — app logic. No backend, all state in localStorage. */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const WSTA = window.WSTA || {};
const QD = WSTA.q || {};
const GM = WSTA.games || {};

/* ---------- categories ---------- */
const CATS = [
  {k:'funny', e:'😂', n:'Funny', c:'#f59e0b'},
  {k:'relationship', e:'❤️', n:'Relationship', c:'#ef4444'},
  {k:'deep', e:'🧠', n:'Deep', c:'#8b5cf6'},
  {k:'random', e:'🎲', n:'Random', c:'#06b6d4'},
  {k:'cute', e:'🥰', n:'Cute', c:'#ec4899'},
  {k:'wouldyourather', e:'🤔', n:'Would You Rather', c:'#f97316'},
  {k:'memories', e:'🕰️', n:'Memories', c:'#84cc16'},
  {k:'future', e:'🔮', n:'Future', c:'#6366f1'},
  {k:'spicy', e:'🌶️', n:'Spicy', c:'#dc2626'},
  {k:'faith', e:'🙏', n:'Faith', c:'#eab308'},
  {k:'travel', e:'✈️', n:'Travel', c:'#0ea5e9'},
  {k:'hypotheticals', e:'💭', n:'Hypotheticals', c:'#14b8a6'},
  {k:'learnnew', e:'👫', n:'Learn Something New', c:'#a855f7'},
  {k:'challenges', e:'🎯', n:'Challenges', c:'#22c55e'},
  {k:'unhinged', e:'🎉', n:'Unhinged', c:'#d946ef'},
];
const catByKey = k => CATS.find(c=>c.k===k) || {k, e:'💬', n:k, c:'#888'};

/* ---------- state ---------- */
const SKEY='wsta_v1';
let S;
function defState(){return {
  seen:{}, recent:[], fav:[], hidden:[],
  stats:{answered:0, perCat:{}, perMode:{}, days:{}, streak:0, lastDay:null,
         likely:{a:0,b:0,both:0}, debates:{a:0,b:0,tie:0}, guess:{a:0,b:0}, totRuns:0},
  profile:{names:'Luke & partner', anniv:'', upcoming:'China and Korea — December 2026',
           traveled:'', foods:'', hobbies:'', goals:''},
  daily:{}, theme:'auto', lastTpl:-1, lastGen:-1
};}
function load(){ try{ S = Object.assign(defState(), JSON.parse(localStorage.getItem(SKEY)||'{}'));
  S.stats = Object.assign(defState().stats, S.stats||{});
  S.profile = Object.assign(defState().profile, S.profile||{});
 }catch(e){ S = defState(); } }
function save(){ try{ localStorage.setItem(SKEY, JSON.stringify(S)); }catch(e){} }
load();

function names(){ const raw=(S.profile.names||'Luke & partner').trim();
  const parts = raw.split(/\s*(?:&|and|,|\+)\s*/i).filter(Boolean);
  return [parts[0]||'Luke', parts[1]||parts[0]||'partner']; }

/* ---------- utils ---------- */
function toast(msg){ const t=$('toast'); t.textContent=msg; t.hidden=false;
  clearTimeout(t._h); t._h=setTimeout(()=>t.hidden=true,1800); }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
function mood(){ return { s:$('moodSilly').value/100, d:$('moodDeep').value/100 }; }

/* ---------- theme ---------- */
function applyTheme(){ document.documentElement.dataset.theme = S.theme||'auto';
  $('themeBtn').textContent = (S.theme==='dark') ? '☀️' : '🌙'; }
$('themeBtn').onclick = ()=>{ S.theme = (S.theme==='dark') ? 'light' : (S.theme==='light' ? 'auto' : 'dark');
  if(S.theme==='auto' && window.matchMedia('(prefers-color-scheme: dark)').matches){ /* auto handles */ }
  if(S.theme==='auto'){ /* keep auto */ } save(); applyTheme();
  toast(S.theme==='auto'?'Following system':(S.theme==='dark'?'Dark mode':'Light mode')); };
applyTheme();

/* ---------- navigation ---------- */
const VIEWS=['home','question','games','game','stats','profile'];
function showView(v){ VIEWS.forEach(x=>$('view-'+x).hidden = x!==v);
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.nav===v || (v==='question'&&t.dataset.nav==='home') || (v==='game'&&t.dataset.nav==='games')));
  window.scrollTo(0,0);
  if(v==='stats') renderStats();
  if(v==='home') renderDaily();
}
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.nav)));

/* ---------- smart question selection ---------- */
function isHidden(cat,idx){ return S.hidden.includes(cat+':'+idx); }
function poolFor(cat){
  const arr = QD[cat]||[];
  const out=[];
  for(let i=0;i<arr.length;i++){ if(!isHidden(cat,i)) out.push({q:arr[i], idx:i}); }
  return out;
}
function pickQuestion(cat){
  const pool = poolFor(cat);
  if(!pool.length) return null;
  const seen = S.seen[cat]||[];
  let fresh = pool.filter(p=>!seen.includes(p.idx));
  if(!fresh.length){ S.seen[cat]=[]; fresh = pool; } // reshuffle when exhausted
  const m = mood();
  const scored = fresh.map(p=>({p, score: Math.abs((p.q.s??.5)-m.s) + Math.abs((p.q.d??.5)-m.d) + Math.random()*0.9}));
  scored.sort((a,b)=>a.score-b.score);
  const chosen = scored[0].p;
  S.seen[cat] = (S.seen[cat]||[]).concat([chosen.idx]).slice(-80);
  return chosen;
}
function weightedCat(){
  const counts = S.stats.perCat||{};
  const bag=[];
  CATS.forEach(c=>{ const w = 1 + Math.min(counts[c.k]||0, 8)*0.35; // learn favorites, gently
    if((QD[c.k]||[]).length) for(let i=0;i<Math.round(w*10);i++) bag.push(c.k); });
  return pick(bag.length?bag:CATS.map(c=>c.k));
}

/* ---------- personalization (occasional surprise) ---------- */
const PERSONAL = [
  {f:'upcoming', q:u=>`You're already going to ${u} — where should the trip after that be?`},
  {f:'upcoming', q:u=>`What are you most excited to eat while you're in ${u}?`},
  {f:'foods', q:f=>`If we had to cook one meal tonight using only ${f}, what are we making?`},
  {f:'hobbies', q:h=>`What's a brand-new hobby we should try together, inspired by ${h}?`},
  {f:'goals', q:g=>`What's one small step toward "${g}" we could take this month?`},
  {f:'traveled', q:t=>`Of everywhere we've been (${t}), where deserves a second trip?`},
];
function maybePersonalize(){
  if(Math.random() > 1/15) return null;
  const opts = PERSONAL.filter(p=>{ const v=(S.profile[p.f]||'').trim(); return v.length>1; });
  if(!opts.length) return null;
  const p = pick(opts);
  return { text:p.q(S.profile[p.f].trim()), personal:true };
}

/* ---------- question screen ---------- */
let Q = null; // {cat, idx, text, chain:[], depth}
function recordAsked(cat, idx, text){
  S.stats.answered++;
  S.stats.perCat[cat]=(S.stats.perCat[cat]||0)+1;
  const d=todayStr();
  S.stats.days[d]=(S.stats.days[d]||0)+1;
  if(S.stats.lastDay!==d){
    const y=new Date(); y.setDate(y.getDate()-1);
    const ys=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    S.stats.streak = (S.stats.lastDay===ys)? (S.stats.streak||0)+1 : 1;
    S.stats.lastDay=d;
  }
  S.recent.unshift({cat, idx, t:text, ts:Date.now()});
  S.recent=S.recent.slice(0,30);
  save();
}
function openQuestion(cat, pre){
  let text, idx=null, personal=false;
  if(pre && pre.text){ text=pre.text; personal=!!pre.personal; }
  else {
    const per = maybePersonalize();
    if(per){ text=per.text; personal=true; }
    else { const c=pickQuestion(cat); if(!c){ toast('No questions left here'); return; }
      text=c.q.t; idx=c.idx; }
  }
  const meta = catByKey(cat);
  const baseQ = (idx!=null && QD[cat]) ? QD[cat][idx] : null;
  Q = { cat, idx, text, chain: baseQ && baseQ.deeper ? baseQ.deeper.slice() : [], depth:0, personal };
  renderQuestion();
  recordAsked(cat, idx==null?-1:idx, text);
  showView('question');
}
function renderQuestion(){
  const meta = catByKey(Q.cat);
  const pill=$('qCatPill'); pill.textContent = meta.e+' '+meta.n; pill.style.background=meta.c;
  $('qText').textContent = Q.text;
  $('qDepth').hidden = Q.depth===0;
  $('qDepth').textContent = Q.depth>0 ? '↳ DEEPER ×'+Q.depth : '';
  $('qPersonal').hidden = !Q.personal;
  updateFavBtn();
  $('qDeeperBtn').style.display='';
}
function updateFavBtn(){
  const isF = S.fav.some(f=>f.cat===Q.cat && f.idx===Q.idx && f.t===Q.text);
  $('qFavBtn').textContent = isF?'❤️':'🤍';
}
const GENERIC_DEEPER = [
  "What do you think I'd answer to that?",
  "Why do you think you feel that way about it?",
  "What would 10-year-old you say about that?",
  "Has your answer to that changed over the years?",
  "What's the story behind that answer?",
  "What would make your answer completely different?",
];
function goDeeper(){
  let next=null;
  if(Q.depth < Q.chain.length){ next = Q.chain[Q.depth]; }
  else {
    const tpls = GM.deeperTemplates||[];
    let found=null;
    for(let tries=0; tries<tpls.length; tries++){
      S.lastTpl = (S.lastTpl+1)%tpls.length;
      const t=tpls[S.lastTpl];
      try{ if(t.re && new RegExp(t.re).test(Q.text)){ found=t; break; } }catch(e){}
    }
    if(found && found.q && found.q.length){ next = pick(found.q); }
    else { S.lastGen=(S.lastGen+1)%GENERIC_DEEPER.length; next=GENERIC_DEEPER[S.lastGen]; }
  }
  Q.depth++;
  Q.text = next;
  renderQuestion();
  save();
}
$('qDeeperBtn').onclick = goDeeper;
$('qNextBtn').onclick = ()=>openQuestion(Q.cat);
$('qDiffCatBtn').onclick = ()=>showView('home');
$('qFavBtn').onclick = ()=>{
  const i = S.fav.findIndex(f=>f.cat===Q.cat && f.idx===Q.idx && f.t===Q.text);
  if(i>=0){ S.fav.splice(i,1); toast('Removed from favorites'); }
  else { S.fav.unshift({cat:Q.cat, idx:Q.idx, t:Q.text, ts:Date.now()}); S.fav=S.fav.slice(0,200); toast('❤️ Saved to favorites'); }
  save(); updateFavBtn();
};
$('qHideBtn').onclick = ()=>{
  if(Q.idx!=null && !S.hidden.includes(Q.cat+':'+Q.idx)){ S.hidden.push(Q.cat+':'+Q.idx); save(); }
  toast('Hidden — you won\u2019t see it again');
  openQuestion(Q.cat);
};

/* ---------- home ---------- */
function renderHome(){
  const g=$('catGrid'); g.innerHTML='';
  CATS.forEach(c=>{
    const n=(QD[c.k]||[]).length;
    const b=document.createElement('button');
    b.className='cat-btn';
    b.innerHTML=`<span class="e">${c.e}</span><span class="n">${c.n}</span><span class="count">${n} questions</span>`;
    b.onclick=()=>openQuestion(c.k);
    g.appendChild(b);
  });
}
$('moodToggle').onclick=()=>{ const p=$('moodPanel'); p.hidden=!p.hidden;
  $('moodToggle').querySelector('.chev').textContent = p.hidden?'▾':'▴'; };
$('surpriseBtn').onclick=()=>openQuestion(weightedCat());
$('boredBtn').onclick=()=>openGame('bored');
$('favLink').onclick=()=>showView('stats');
$('dailyGo').onclick=()=>{ const d=S.daily[todayStr()]; if(d) openQuestion(d.cat,{text:(QD[d.cat]||[])[d.idx]?QD[d.cat][d.idx].t:'', idx:d.idx}); };

function renderDaily(){
  const ds=todayStr();
  if(!S.daily[ds]){
    const h=hashStr('wsta-daily-'+ds);
    const cats=CATS.filter(c=>(QD[c.k]||[]).length);
    const cat=cats[h%cats.length].k;
    const arr=QD[cat];
    S.daily[ds]={cat, idx:h%arr.length};
    save();
  }
  const d=S.daily[ds];
  const q=(QD[d.cat]||[])[d.idx];
  if(q){ $('dailyCard').hidden=false; $('dailyQ').textContent=q.t; }
  else $('dailyCard').hidden=true;
}

/* ---------- games ---------- */
const GAMES=[
  {k:'bored', e:'😴', n:"We're Bored", d:'One tap. Zero decisions. We serve up the fun.'},
  {k:'guess', e:'🔮', n:'Guess Your Partner', d:'Lock in your answer, pass the phone, see if they really know you.'},
  {k:'thisorthat', e:'⚡', n:'This or That', d:'Rapid-fire choices. Tap or swipe. How in sync are you two?'},
  {k:'rank', e:'🏅', n:'Rank It', d:'Put date nights, foods, cities and more in order. Defend your ranking.'},
  {k:'likely', e:'👑', n:'Who Is More Likely', d:'Vote Luke, partner, or both. Tally the chaos.'},
  {k:'debate', e:'🎙️', n:'Debate Mode', d:'Harmless topics, 60 seconds each. Settle it once and for all.'},
  {k:'trip', e:'✈️', n:'Build Our Trip', d:'Random destination, budget, and one ridiculous restriction.'},
];
function renderGames(){
  const l=$('gameList'); l.innerHTML='';
  GAMES.forEach(g=>{
    const b=document.createElement('button');
    b.className='game-card';
    b.innerHTML=`<span class="e">${g.e}</span><span><div class="t">${g.n}</div><div class="d">${g.d}</div></span>`;
    b.onclick=()=>openGame(g.k);
    l.appendChild(b);
  });
}
function openGame(k){
  S.stats.perMode[k]=(S.stats.perMode[k]||0)+1; save();
  showView('game');
  const body=$('gameBody'); body.innerHTML='';
  ({bored:gameBored, guess:gameGuess, thisorthat:gameTot, rank:gameRank,
    likely:gameLikely, debate:gameDebate, trip:gameTrip}[k]||(()=>{}))(body);
}
function h(html){ const d=document.createElement('div'); d.innerHTML=html; return d; }
function modeHead(body, emoji, title){
  body.appendChild(h(`<div class="mode-label">${emoji} ${title}</div>`));
}

/* ---- 1. WE'RE BORED ---- */
function gameBored(body){
  modeHead(body,'😴',"We're bored");
  const wrap=document.createElement('div'); body.appendChild(wrap);
  const btn=document.createElement('button'); btn.className='btn btn-primary'; btn.textContent='🎲 Surprise us';
  body.appendChild(btn);
  function serve(){
    const [n1]=names();
    const typePool=[
      ['question',5],['challenge',4],['hypothetical',3],['minigame',3],
      ['memory',3],['rank',2],['debate',2],['prediction',3],['guess',2]
    ];
    const bag=[]; typePool.forEach(([t,w])=>{for(let i=0;i<w;i++)bag.push(t);});
    const type=pick(bag);
    let label='', text='', sub='';
    if(type==='question'){ const c=weightedCat(); const cMeta=catByKey(c);
      const p=pickQuestion(c); label=`💬 ${cMeta.e} ${cMeta.n}`; text=p?p.q.t:'';
      if(p){ S.stats.answered++; S.stats.perCat[c]=(S.stats.perCat[c]||0)+1;
        S.recent.unshift({cat:c,idx:p.idx,t:p.q.t,ts:Date.now()}); S.recent=S.recent.slice(0,30); save(); } }
    else if(type==='challenge'){ label='🎯 5-minute challenge'; text=pick(GM.bored.challenges||['High-five.']); }
    else if(type==='hypothetical'){ label='💭 Ridiculous hypothetical'; const p=pickQuestion('hypotheticals'); text=p?p.q.t:''; }
    else if(type==='minigame'){ label='🎮 Mini game'; text=pick(GM.bored.minigames||['Thumb war.']); }
    else if(type==='memory'){ label='🕰️ Memory lane'; const p=pickQuestion('memories'); text=p?p.q.t:''; }
    else if(type==='rank'){ const r=pick(GM.rank||[]); label='🏅 Rank it together'; text=r?('Rank these: '+r.items.join(', ')):'';
      sub='Open Rank It in Games to do it properly →'; }
    else if(type==='debate'){ label='🎙️ Debate it'; text=pick(GM.debate||['Is a hot dog a sandwich?']); sub='60 seconds each. Go.'; }
    else if(type==='prediction'){ label='🔮 Prediction'; text=pick(GM.bored.predictions||['']); sub=`About ${n1}…`; }
    else { const g=pick(GM.guess||[]); label='👫 Guess your partner'; text=g?g.q:''; sub='Open Guess Your Partner in Games to play →'; }
    wrap.innerHTML='';
    const card=document.createElement('div'); card.className='big-card';
    card.innerHTML=`<div class="mode-label">${label}</div><p></p>${sub?`<div class="sub">${sub}</div>`:''}`;
    card.querySelector('p').textContent=text;
    card.style.animation='none'; void card.offsetWidth; card.style.animation='';
    wrap.appendChild(card);
  }
  btn.onclick=serve; serve();
}

/* ---- 2. GUESS YOUR PARTNER ---- */
function gameGuess(body){
  modeHead(body,'🔮','Guess your partner');
  const [n1,n2]=names();
  const prompts=shuffle(GM.guess||[]);
  let i=0, score={a:0,b:0}, answerer=0, locked='', optsPicked='';
  const wrap=document.createElement('div'); body.appendChild(wrap);
  function screenWho(){
    wrap.innerHTML=`<div class="big-card"><p>Who's answering first?</p>
      <div class="sub">They'll secretly lock in their answer.</div></div>
      <div class="person-pick">
        <button class="btn btn-primary" id="gwA">${n1}</button>
        <button class="btn btn-primary" id="gwB">${n2}</button>
      </div>
      <div class="score-line"><span>${n1}: ${score.a}</span><span>${n2}: ${score.b}</span></div>`;
    wrap.querySelector('#gwA').onclick=()=>{answerer=0;screenLock();};
    wrap.querySelector('#gwB').onclick=()=>{answerer=1;screenLock();};
  }
  function screenLock(){
    const g=prompts[i%prompts.length];
    const me=answerer===0?n1:n2;
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🤫 ${me}, secretly answer</div><p></p>
      <div class="opt-list" id="gOpts"></div>
      <input class="text-input" id="gIn" placeholder="Type your secret answer…"></div>
      <button class="btn btn-primary" id="gLock">Lock it in & pass the phone →</button>`;
    wrap.querySelector('p').textContent=g.q;
    const ol=wrap.querySelector('#gOpts');
    if(g.opts){ g.opts.forEach(o=>{ const b=document.createElement('button'); b.className='opt-btn'; b.textContent=o;
      b.onclick=()=>{ ol.querySelectorAll('.opt-btn').forEach(x=>x.classList.remove('picked')); b.classList.add('picked'); optsPicked=o; };
      ol.appendChild(b); }); }
    wrap.querySelector('#gLock').onclick=()=>{
      locked = optsPicked || wrap.querySelector('#gIn').value.trim();
      if(!locked){ toast('Lock in an answer first'); return; }
      optsPicked=''; screenGuess(g);
    };
  }
  function screenGuess(g){
    const guesser=answerer===0?n2:n1;
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🙋 ${guesser}, what's their answer?</div><p></p>
      <input class="text-input" id="gGs" placeholder="Your guess…"></div>
      <button class="btn btn-primary" id="gRev">Reveal →</button>`;
    wrap.querySelector('p').textContent=g.q;
    wrap.querySelector('#gRev').onclick=()=>{
      const gs=wrap.querySelector('#gGs').value.trim()||'(no guess)';
      screenReveal(g,gs);
    };
  }
  function screenReveal(g,gs){
    const me=answerer===0?n1:n2, guesser=answerer===0?n2:n1;
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🎉 Reveal</div><p></p>
      <div class="answer-reveal"><span class="who">${me}'s real answer</span></div>
      <div class="answer-reveal"><span class="who">${guesser} guessed</span></div></div>
      <div class="person-pick">
        <button class="btn btn-primary" id="gHit">✅ Nailed it</button>
        <button class="btn btn-ghost" id="gMiss">❌ Missed</button>
      </div>`;
    const revs=wrap.querySelectorAll('.answer-reveal');
    revs[0].appendChild(document.createTextNode(locked));
    revs[1].appendChild(document.createTextNode(gs));
    wrap.querySelector('p').textContent=g.q;
    const done=(hit)=>{ if(hit){ if(answerer===0)score.b++; else score.a++;
        S.stats.guess[answerer===0?'b':'a']=(S.stats.guess[answerer===0?'b':'a']||0)+1; save(); }
      i++; answerer=1-answerer; locked=''; screenWho(); };
    wrap.querySelector('#gHit').onclick=()=>done(true);
    wrap.querySelector('#gMiss').onclick=()=>done(false);
  }
  screenWho();
}

/* ---- 3. THIS OR THAT ---- */
function gameTot(body){
  modeHead(body,'⚡','This or that');
  const pairs=shuffle(GM.thisorthat||[]).slice(0,10);
  let i=0, agree=0; const picks=[];
  const wrap=document.createElement('div'); body.appendChild(wrap);
  function screen(){
    if(i>=pairs.length){ summary(); return; }
    const [a,b]=pairs[i];
    wrap.innerHTML=`<div class="progress"><i style="width:${(i/pairs.length)*100}%"></i></div>
      <div class="mode-label">Round ${i+1} of ${pairs.length} — both answer!</div>
      <div class="tot-wrap" id="totW">
        <button class="tot-opt a"></button>
        <button class="tot-opt b"></button>
      </div>
      <p class="hidden-note">Tap your choice, or swipe ◀ ▶</p>`;
    const [ba,bb]=wrap.querySelectorAll('.tot-opt');
    ba.textContent=a; bb.textContent=b;
    ba.onclick=()=>choose(0); bb.onclick=()=>choose(1);
    // swipe
    let sx=null;
    const wEl=wrap.querySelector('#totW');
    wEl.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});
    wEl.addEventListener('touchend',e=>{ if(sx==null)return;
      const dx=e.changedTouches[0].clientX-sx;
      if(Math.abs(dx)>50) choose(dx<0?0:1); sx=null; },{passive:true});
  }
  function choose(side){
    // In this party version both partners just discuss; we track "same choice" by asking
    picks.push({pair:pairs[i], side});
    i++; screen();
  }
  function summary(){
    S.stats.totRuns++; save();
    // playful: ask how many they agreed on
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🏁 Results</div>
      <p>You made it through ${pairs.length} rapid-fire rounds!</p>
      <div class="sub">How many did you two actually agree on?</div></div>
      <div class="person-pick" id="agreeRow"></div>`;
    const row=wrap.querySelector('#agreeRow');
    for(let n=0;n<=pairs.length;n++){ const b=document.createElement('button');
      b.className='opt-btn'; b.textContent=n; b.style.minWidth='52px';
      b.onclick=()=>final(n); row.appendChild(b); }
    function final(n){
      const pct=Math.round(n/pairs.length*100);
      let msg = pct>=80 ? 'Suspiciously in sync. Are you sure you\u2019re two people? 👯'
        : pct>=50 ? 'Pretty aligned. Couples who choose together… brunch together. 💛'
        : pct>=30 ? 'Healthy disagreement. Keeps things spicy. 🌶️'
        : 'Opposites attract, apparently. This is going to be a fun marriage. 😂';
      wrap.innerHTML=`<div class="big-card"><div class="mode-label">🏁 Final verdict</div>
        <p>${n}/${pairs.length} in sync (${pct}%)</p><div class="sub">${msg}</div></div>
        <button class="btn btn-primary" id="totAgain">Play again</button>`;
      wrap.querySelector('#totAgain').onclick=()=>gameTot(body);
    }
  }
  screen();
}

/* ---- 4. RANK IT ---- */
function gameRank(body, preset){
  modeHead(body,'🏅','Rank it');
  const wrap=document.createElement('div'); body.appendChild(wrap);
  function topicScreen(){
    wrap.innerHTML='<div class="opt-list" id="rkT"></div>';
    const ol=wrap.querySelector('#rkT');
    (GM.rank||[]).forEach(r=>{ const b=document.createElement('button'); b.className='opt-btn';
      b.textContent=r.topic; b.onclick=()=>rankScreen(r); ol.appendChild(b); });
  }
  function rankScreen(r){
    let items=shuffle(r.items);
    wrap.innerHTML=`<div class="mode-label">${r.topic}</div>
      <p class="hidden-note">Tap ▲ ▼ to order — #1 is the best.</p>
      <div class="rank-list" id="rkL"></div>
      <button class="btn btn-primary" id="rkDone">Lock in our ranking</button>`;
    const list=wrap.querySelector('#rkL');
    function draw(){
      list.innerHTML='';
      items.forEach((t,idx)=>{
        const row=document.createElement('div'); row.className='rank-item';
        row.innerHTML=`<span class="rank-num">${idx+1}</span><span class="t"></span>
          <span class="rank-mv"><button ${idx===0?'disabled':''}>▲</button><button ${idx===items.length-1?'disabled':''}>▼</button></span>`;
        row.querySelector('.t').textContent=t;
        const [up,dn]=row.querySelectorAll('button');
        up.onclick=()=>{[items[idx-1],items[idx]]=[items[idx],items[idx-1]];draw();};
        dn.onclick=()=>{[items[idx+1],items[idx]]=[items[idx],items[idx-1]];draw();};
        list.appendChild(row);
      });
    }
    draw();
    wrap.querySelector('#rkDone').onclick=()=>{
      const medals=['🥇','🥈','🥉','4.','5.','6.'];
      wrap.innerHTML=`<div class="big-card"><div class="mode-label">🏁 Your ranking</div><div class="opt-list" id="rkR"></div>
        <div class="sub">${r.topic}</div></div>
        <button class="btn btn-ghost" id="rkBack">Rank something else</button>`;
      const rl=wrap.querySelector('#rkR');
      items.forEach((t,idx)=>{ const d=document.createElement('div'); d.className='opt-btn';
        d.innerHTML=`<b>${medals[idx]||(idx+1)+'.'}</b> `; d.appendChild(document.createTextNode(t)); rl.appendChild(d); });
      wrap.querySelector('#rkBack').onclick=topicScreen;
    };
  }
  if(preset) rankScreen(preset); else topicScreen();
}

/* ---- 5. WHO IS MORE LIKELY ---- */
function gameLikely(body){
  modeHead(body,'👑','Who is more likely');
  const [n1,n2]=names();
  const prompts=shuffle(GM.likely||[]).slice(0,10);
  let i=0; const tally={a:0,b:0,both:0};
  const wrap=document.createElement('div'); body.appendChild(wrap);
  function screen(){
    if(i>=prompts.length){ results(); return; }
    wrap.innerHTML=`<div class="progress"><i style="width:${(i/prompts.length)*100}%"></i></div>
      <div class="big-card"><p></p></div>
      <div class="person-pick" style="grid-template-columns:1fr 1fr 1fr">
        <button class="btn btn-primary" id="lkA">${n1}</button>
        <button class="btn btn-primary" id="lkB">${n2}</button>
        <button class="btn btn-ghost" id="lkC">Both</button>
      </div>`;
    wrap.querySelector('.big-card p').textContent=prompts[i];
    const v=k=>{ tally[k]++; S.stats.likely[k]=(S.stats.likely[k]||0)+1; save(); i++; screen(); };
    wrap.querySelector('#lkA').onclick=()=>v('a');
    wrap.querySelector('#lkB').onclick=()=>v('b');
    wrap.querySelector('#lkC').onclick=()=>v('both');
  }
  function results(){
    const wins=[['a',n1],['b',n2]].sort((x,y)=>tally[y[0]]-tally[x[0]]);
    const champ = tally.a===tally.b ? 'It\u2019s a tie — you\u2019re both chaos. 🤝' : `Most likely to: <b>${wins[0][1]}</b> 👑`;
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🏁 Final tally</div>
      <div class="tally"><span class="pill">${n1}: ${tally.a}</span><span class="pill">${n2}: ${tally.b}</span><span class="pill">Both: ${tally.both}</span></div>
      <p style="font-size:19px">${champ}</p></div>
      <button class="btn btn-primary" id="lkAgain">Play again</button>`;
    wrap.querySelector('#lkAgain').onclick=()=>gameLikely(body);
  }
  screen();
}

/* ---- 6. DEBATE MODE ---- */
function gameDebate(body){
  modeHead(body,'🎙️','Debate mode');
  const [n1,n2]=names();
  const topics=shuffle(GM.debate||[]);
  let i=0; let timer=null;
  const wrap=document.createElement('div'); body.appendChild(wrap);
  function topic(){
    const t=topics[i%topics.length];
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🎙️ Tonight's debate</div><p></p>
      <div class="sub">60 seconds each. ${n1} goes first.</div></div>
      <button class="btn btn-primary" id="dbStart">Start the clock ⏱️</button>
      <button class="btn btn-ghost" id="dbSkip">Skip topic</button>`;
    wrap.querySelector('.big-card p').textContent=t;
    wrap.querySelector('#dbStart').onclick=()=>round(t,0);
    wrap.querySelector('#dbSkip').onclick=()=>{i++;topic();};
  }
  function round(t,side){
    const speaker=side===0?n1:n2;
    let left=60;
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🎙️ ${speaker}'s turn — defend it!</div><p></p>
      <div class="timer" id="dbT">1:00</div></div>`;
    wrap.querySelector('.big-card p').textContent=t;
    const tEl=wrap.querySelector('#dbT');
    clearInterval(timer);
    timer=setInterval(()=>{
      left--;
      tEl.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
      if(left<=10) tEl.classList.add('low');
      if(left<=0){ clearInterval(timer);
        try{ navigator.vibrate && navigator.vibrate([200,100,200]); }catch(e){}
        if(side===0) round(t,1); else winner(t);
      }
    },1000);
  }
  function winner(t){
    clearInterval(timer);
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">🏆 Who won?</div><p></p></div>
      <div class="person-pick" style="grid-template-columns:1fr 1fr 1fr">
        <button class="btn btn-primary" id="dbA">${n1}</button>
        <button class="btn btn-primary" id="dbB">${n2}</button>
        <button class="btn btn-ghost" id="dbT2">Tie</button>
      </div>`;
    wrap.querySelector('.big-card p').textContent=t;
    const done=k=>{ S.stats.debates[k]=(S.stats.debates[k]||0)+1; save();
      const nt=pick(GM.debate||[]); i++; topic();
      toast(k==='tie'?'A diplomatic tie 🤝':'Winner declared 🏆'); };
    wrap.querySelector('#dbA').onclick=()=>done('a');
    wrap.querySelector('#dbB').onclick=()=>done('b');
    wrap.querySelector('#dbT2').onclick=()=>done('tie');
  }
  topic();
}

/* ---- 7. BUILD OUR TRIP ---- */
function gameTrip(body){
  modeHead(body,'✈️','Build our trip');
  const T=GM.trip||{};
  const wrap=document.createElement('div'); body.appendChild(wrap);
  function build(){
    const d=pick(T.destinations||['Somewhere fun']);
    const b=pick(T.budgets||['$3,000']);
    const l=pick(T.lengths||['7 days']);
    const s=pick(T.stays||['boutique hotel']);
    const r=pick(T.restrictions||['but no phones allowed']);
    wrap.innerHTML=`<div class="big-card"><div class="mode-label">✈️ Your trip</div>
      <p>${l} in ${d}</p>
      <div class="answer-reveal"><span class="who">budget</span>${b}</div>
      <div class="answer-reveal"><span class="who">staying in</span>a ${s}</div>
      <div class="answer-reveal"><span class="who">the catch</span>${r}</div></div>
      <button class="btn btn-primary" id="trAgain">Build another trip</button>`;
    wrap.querySelector('#trAgain').onclick=build;
  }
  build();
}

/* ---------- stats ---------- */
function favCat(){ const c=S.stats.perCat||{}; let best=null,bn=-1;
  Object.keys(c).forEach(k=>{ if(c[k]>bn){bn=c[k];best=k;} }); return best?catByKey(best):null; }
function favMode(){ const m=S.stats.perMode||{}; let best=null,bn=-1;
  Object.keys(m).forEach(k=>{ if(m[k]>bn){bn=m[k];best=k;} });
  const g=GAMES.find(g=>g.k===best); return g?g.e+' '+g.n:null; }
function renderStats(){
  const st=S.stats, [n1,n2]=names();
  const fc=favCat(), fm=favMode();
  const chaotic=Object.keys(st.perCat||{}).sort((a,b)=>(st.perCat[b]||0)-(st.perCat[a]||0))[0];
  const grid=[
    [st.answered,'Questions answered'],
    [Object.keys(st.days||{}).length,'Days together'],
    [st.streak||0,'Day streak 🔥'],
    [S.fav.length,'Favorited'],
    [fc?fc.e+' '+fc.n:'—','Favorite category'],
    [fm||'—','Most-used mode'],
  ];
  $('statGrid').innerHTML=grid.map(([v,k])=>`<div class="stat-box"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
  const fun=[
    [`👑 Most likely to: <b>${(st.likely.a||0)>=(st.likely.b||0)?n1:n2}</b>`,`${n1} ${st.likely.a||0} · ${n2} ${st.likely.b||0} · Both ${st.likely.both||0}`],
    [`🎙️ Debate champion: <b>${(st.debates.a||0)>=(st.debates.b||0)?((st.debates.a||0)>(st.debates.b||0)?n1:'Tied') :n2}</b>`,`${n1} ${st.debates.a||0} · ${n2} ${st.debates.b||0} · Ties ${st.debates.tie||0}`],
    [`🔮 Best guesser: <b>${(st.guess.a||0)>=(st.guess.b||0)?n1:n2}</b>`,`Correct guesses — ${n1}: ${st.guess.a||0}, ${n2}: ${st.guess.b||0}`],
    [`🎉 Most chaotic category: <b>${chaotic?catByKey(chaotic).n:'—'}</b>`,`${chaotic?(st.perCat[chaotic]||0)+' questions':'Play something!'}`],
  ];
  $('funStats').innerHTML=fun.map(([t,m])=>`<div class="mini-card"><div>${t}</div><div class="meta">${m}</div></div>`).join('');
  $('favList').innerHTML = S.fav.length ? S.fav.map((f,i)=>`<div class="mini-card"><div class="row"><span>${f.t}</span><button class="icon-btn" data-fav="${i}" style="width:34px;height:34px">▶</button></div><div class="meta">${catByKey(f.cat).e} ${catByKey(f.cat).n}</div></div>`).join('')
    : '<p class="empty-note">Nothing favorited yet — tap 🤍 on any question.</p>';
  $('favList').querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{
    const f=S.fav[+b.dataset.fav]; Q={cat:f.cat,idx:f.idx,text:f.t,chain:[],depth:0,personal:false};
    renderQuestion(); showView('question'); });
  $('recentList').innerHTML = S.recent.length ? S.recent.slice(0,15).map(r=>`<div class="mini-card"><div>${r.t}</div><div class="meta">${catByKey(r.cat).e} ${catByKey(r.cat).n}</div></div>`).join('')
    : '<p class="empty-note">No questions yet.</p>';
  const days=Object.keys(S.daily).sort().reverse().slice(0,14);
  $('dailyList').innerHTML = days.length ? days.map(d=>{ const e=S.daily[d]; const q=(QD[e.cat]||[])[e.idx];
    return `<div class="mini-card"><div>${q?q.t:''}</div><div class="meta">${d} · ${catByKey(e.cat).n}</div></div>`; }).join('')
    : '<p class="empty-note">No daily questions yet.</p>';
}

/* ---------- profile ---------- */
function renderProfile(){
  const p=S.profile;
  $('pfNames').value=p.names||''; $('pfAnniv').value=p.anniv||'';
  $('pfUpcoming').value=p.upcoming||''; $('pfTraveled').value=p.traveled||'';
  $('pfFoods').value=p.foods||''; $('pfHobbies').value=p.hobbies||'';
  $('pfGoals').value=p.goals||'';
}
$('pfSave').onclick=()=>{
  S.profile={ names:$('pfNames').value, anniv:$('pfAnniv').value, upcoming:$('pfUpcoming').value,
    traveled:$('pfTraveled').value, foods:$('pfFoods').value, hobbies:$('pfHobbies').value, goals:$('pfGoals').value };
  save(); $('pfSaved').hidden=false; setTimeout(()=>$('pfSaved').hidden=true,2000);
  toast('Profile saved ✓');
};

/* ---------- boot ---------- */
renderHome(); renderGames(); renderProfile(); renderDaily(); showView('home');
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }); }
})();
