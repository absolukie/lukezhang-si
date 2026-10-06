/* How the X Algorithm Works — all interactivity. Vanilla JS, no libraries. */
(function(){
"use strict";

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* ---------- expandable stage nodes + go-deeper toggles ---------- */
document.querySelectorAll(".node-head").forEach(function(btn){
  btn.addEventListener("click",function(){
    var body=document.getElementById(btn.getAttribute("aria-controls"));
    var open=btn.getAttribute("aria-expanded")==="true";
    btn.setAttribute("aria-expanded",String(!open));
    body.hidden=open;
  });
});
document.querySelectorAll(".deeper-toggle").forEach(function(btn){
  btn.addEventListener("click",function(){
    var body=btn.nextElementSibling;
    var open=btn.getAttribute("aria-expanded")==="true";
    btn.setAttribute("aria-expanded",String(!open));
    body.hidden=open;
  });
});

/* ---------- touch slider: whole track tappable, 44px target, keyboard ---------- */
function makeSlider(id, opts){
  var el=document.getElementById(id),
      track=el.querySelector(".cslider-track"),
      fill=el.querySelector(".cslider-fill"),
      thumb=el.querySelector(".cslider-thumb");
  var S={min:opts.min,max:opts.max,step:opts.step,value:opts.value,
         onChange:opts.onChange||function(){}, fmt:opts.fmt};
  function render(){
    var t=(S.value-S.min)/(S.max-S.min);
    fill.style.width=(t*100)+"%";
    thumb.style.left=(t*100)+"%";
    el.setAttribute("aria-valuenow",S.value);
    el.setAttribute("aria-valuetext",S.fmt(S.value));
  }
  function set(v,fire){
    v=Math.min(S.max,Math.max(S.min,v));
    v=Math.round(v/S.step)*S.step;
    v=Math.round(v*1000)/1000;
    if(v===S.value){ render(); return; }
    S.value=v; render();
    if(fire!==false) S.onChange(S.value);
  }
  S.set=set;
  function fromX(cx){
    var r=track.getBoundingClientRect();
    set(S.min+((cx-r.left)/r.width)*(S.max-S.min));
  }
  var dragging=false;
  el.addEventListener("pointerdown",function(e){
    dragging=true;
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    fromX(e.clientX);
    e.preventDefault();
  });
  el.addEventListener("pointermove",function(e){ if(dragging) fromX(e.clientX); });
  el.addEventListener("pointerup",function(){ dragging=false; });
  el.addEventListener("pointercancel",function(){ dragging=false; });
  el.addEventListener("keydown",function(e){
    var d=0;
    if(e.key==="ArrowLeft"||e.key==="ArrowDown") d=-S.step;
    else if(e.key==="ArrowRight"||e.key==="ArrowUp") d=S.step;
    else if(e.key==="Home"){ set(S.min); e.preventDefault(); return; }
    else if(e.key==="End"){ set(S.max); e.preventDefault(); return; }
    else return;
    set(S.value+d); e.preventDefault();
  });
  render();
  return S;
}

/* ==================================================================
   SCORING PLAYGROUND — toy scorer with the real published weights.
   Weights: home-mixer/params/param.rs (repo config, synced 2026-09-28).
   tier v = verified current · h = 2023-era historical · e = estimated.
   ================================================================== */
var ACTIONS=[
  {id:"like",     label:"like",              w:0.5,    tier:"v"},
  {id:"reply",    label:"reply",             w:5.0,    tier:"v"},
  {id:"repost",   label:"repost",            w:1.0,    tier:"v"},
  {id:"quote",    label:"quote",             w:5.0,    tier:"v"},
  {id:"copylink", label:"copy-link share",   w:20.0,   tier:"v"},
  {id:"follow",   label:"follow author",     w:4.0,    tier:"v"},
  {id:"dwell",    label:"deep dwell · 2 min",w:0.48,   tier:"v", note:"0.004/s × 120 s (toy)"},
  {id:"authrep",  label:"author replies back",w:75,    tier:"h"},
  {id:"bookmark", label:"bookmark",          w:5.0,    tier:"e"},
  {id:"notint",   label:"not interested",    w:-47.52, tier:"v", neg:1},
  {id:"mute",     label:"mute author",       w:-58.8,  tier:"v", neg:1},
  {id:"block",    label:"block author",      w:-31.2,  tier:"v", neg:1},
  {id:"report",   label:"report",            w:-234.0, tier:"v", neg:1}
];
var TIER_TAG={v:'<span class="tag">2026</span>',h:'<span class="tag">2023</span>',e:'<span class="tag">est</span>'};
var POSTS=[
  {author:"@maya_bakes",   text:"Sourdough crumb check — 72-hour cold ferment. Recipe in the replies. 🍞", on:{like:1,dwell:1}},
  {author:"@orbit_news",   text:"BREAKING: council approves the waterfront plan 7–2. Details at the link.", on:{}},
  {author:"@devdan",       text:"Hot take: your feed is not the news. It's a mirror with ads in it.", on:{reply:1}},
  {author:"@crypto_king_99",text:"DM me for 10x GUARANTEED gains 🚀🚀🚀", on:{notint:1}}
];
var pgPosts=document.getElementById("pg-posts"),
    pgRank=document.getElementById("pg-rank"),
    engVal=document.getElementById("eng-val"),
    pgCaveat=document.getElementById("pg-caveat");
var engLevel=100;

function actionById(id){
  for(var i=0;i<ACTIONS.length;i++) if(ACTIONS[i].id===id) return ACTIONS[i];
  return null;
}
function postScore(p){
  var s=0, parts=[];
  ACTIONS.forEach(function(a){
    if(!p.on[a.id]) return;
    var prob=a.w>=0 ? engLevel/100 : 1; /* toy: toggled = it happens; positives scale with engagement */
    var c=a.w*prob;
    s+=c;
    parts.push({label:a.label,w:a.w,c:c});
  });
  return {score:s,parts:parts};
}
function fmtW(w){
  var s=(w>0?"+":"")+(Math.abs(w)<1&&Math.abs(w)>0?String(Math.round(w*1000)/1000):String(w));
  return s;
}
function renderPlayground(){
  var rows=POSTS.map(function(p){
    var r=postScore(p);
    return {p:p,score:r.score,parts:r.parts};
  });
  /* post cards */
  pgPosts.innerHTML=rows.map(function(row,idx){
    var chips=ACTIONS.map(function(a){
      var on=!!row.p.on[a.id];
      return '<button type="button" class="chip" data-p="'+idx+'" data-a="'+a.id+'" data-neg="'+(a.neg?1:0)+'" aria-pressed="'+on+'">'+
        esc(a.label)+' <span class="w">'+fmtW(a.w)+"</span>"+TIER_TAG[a.tier]+'</button>';
    }).join("");
    var brk=row.parts.length?row.parts.map(function(pt){
      var cls=pt.c>=0?"c-pos":"c-neg";
      return '<span class="'+cls+'">'+esc(pt.label)+' '+fmtW(pt.w)+' → '+(pt.c>=0?"+":"")+pt.c.toFixed(2)+"</span>";
    }).join(" · "):'<span style="color:#6b7288">nothing toggled — score 0</span>';
    return '<div class="pg-post"><div class="pg-post-head"><span class="pg-author">'+esc(row.p.author)+
      '</span><span class="pg-score">score '+(row.score>=0?"+":"")+row.score.toFixed(2)+
      "</span></div><p class=\"pg-text\">"+esc(row.p.text)+
      '</p><div class="pg-chips">'+chips+'</div><p class="pg-break">'+brk+"</p></div>";
  }).join("");
  pgPosts.querySelectorAll(".chip").forEach(function(ch){
    ch.addEventListener("click",function(){
      var p=POSTS[+ch.getAttribute("data-p")], a=ch.getAttribute("data-a");
      if(p.on[a]) delete p.on[a]; else p.on[a]=1;
      renderPlayground();
    });
  });
  /* live ranking — divergent bars on a sqrt scale */
  var order=rows.slice().sort(function(a,b){return b.score-a.score;});
  var maxAbs=Math.max.apply(null,rows.map(function(r){return Math.abs(r.score);}).concat([1e-6]));
  pgRank.innerHTML=order.map(function(row){
    var t=Math.sqrt(Math.abs(row.score)/maxAbs)*50; /* % of one half */
    var left=row.score>=0?50:50-t, width=Math.max(t, row.score!==0?1.2:0);
    var cls=row.score>=0?"pos":"neg";
    return '<div class="bar-row"><span class="tok">'+esc(row.p.author)+
      '</span><span class="bar-track"><span class="bar-fill '+cls+'" style="left:'+left.toFixed(1)+'%;width:'+width.toFixed(1)+'%"></span></span>'+
      '<span class="bar-pct">'+(row.score>=0?"+":"")+row.score.toFixed(2)+"</span></div>";
  }).join("");
  pgCaveat.innerHTML="Toy probabilities: a toggled action counts as P = 1"+(engLevel<100?" × your "+engLevel+"% engagement level for positives":"")+". Real Phoenix predicts ~19 such probabilities per post, per viewer — and weights ship roughly every 4 weeks, so re-check the repo before quoting them.";
}
var engSlider=makeSlider("sl-eng",{min:0,max:100,step:5,value:100,
  fmt:function(v){return Math.round(v)+"%";},
  onChange:function(v){ engLevel=v; engVal.textContent=Math.round(v)+"%"; renderPlayground(); }});
document.getElementById("eng-dec").addEventListener("click",function(){ engSlider.set(engSlider.value-5); });
document.getElementById("eng-inc").addEventListener("click",function(){ engSlider.set(engSlider.value+5); });
document.getElementById("pg-reset").addEventListener("click",function(){
  POSTS.forEach(function(p){ p.on={}; });
  renderPlayground();
});
renderPlayground();

/* ==================================================================
   FILTER DEMO — nine posts through the real pipeline stages.
   ================================================================== */
var FD=[
  {author:"@friend_ana",     text:"Launch day! Our little app is finally live 🚀", score:42.5},
  {author:"@reposter_bob",   text:"Launch day! Our little app is finally live 🚀", score:0, drop1:"duplicate across sources"},
  {author:"@old_timer",      text:"Throwback to my 2021 marathon finish 🏅", score:0, drop1:"older than 48 hours"},
  {author:"@you",            text:"my draft: thinking out loud about timelines", score:0, drop1:"your own post"},
  {author:"@blocked_ex",     text:"hot takes nobody asked for, daily", score:0, drop1:"blocked author"},
  {author:"@news_wire",      text:"Markets close mixed amid fresh data", score:0, drop1:"already seen"},
  {author:"@premium_writer", text:"Deep-dive: the attention economy 🔒", score:0, drop1:"subscriber-only post"},
  {author:"@crypto_king_99", text:"DM me for 10x GUARANTEED gains 🚀🚀", score:3.1, drop4:"spam label → drop"},
  {author:"@spicy_memes",    text:"spicy meme (mildly adult humor)", score:18.7, inter4:"adult media → interstitial"}
];
var FD_STAGES=["candidates queued","pre-scoring filters","scoring","top-K selection","visibility filtering"];
var fdStage=0, fdPosts=document.getElementById("fd-posts"), fdStageEl=document.getElementById("fd-stage");
function renderFilter(){
  fdStageEl.textContent="Stage "+fdStage+" of 4 · "+FD_STAGES[fdStage];
  var scored=fdStage>=2;
  var ranked=FD.map(function(p,i){return {p:p,i:i};})
    .filter(function(x){return !x.p.drop1;})
    .sort(function(a,b){return b.p.score-a.p.score;});
  var topIdx={}; ranked.slice(0,3).forEach(function(x){ topIdx[x.i]=1; });
  fdPosts.innerHTML=FD.map(function(p,i){
    var stamp="queued", cls="", extra="";
    if(fdStage>=1&&p.drop1){ stamp="dropped · "+p.drop1; cls="dropped"; }
    else if(fdStage>=2&&scored){ extra='<span class="fd-score">toy score +'+p.score.toFixed(1)+"</span>"; }
    if(fdStage>=3&&!p.drop1&&!topIdx[i]){ stamp="dropped · outside top-K"; cls="dropped"; }
    if(fdStage>=4){
      if(p.drop4){ stamp="dropped · "+p.drop4; cls="dropped"; }
      else if(p.inter4){ stamp="kept · "+p.inter4; cls="kept inter"; }
      else if(!p.drop1){ stamp="kept · allow"; cls="kept"; }
    } else if(fdStage>=1&&!p.drop1&&(!topIdx[i]||fdStage<3)&&fdStage<4){
      if(fdStage>=3&&!topIdx[i]){/* handled above */}
      else stamp="kept · passed";
    }
    if(fdStage>=1&&!p.drop1&&fdStage<3) stamp="kept · passed";
    if(fdStage>=3&&!p.drop1&&topIdx[i]&&fdStage<4) stamp="kept · top-K";
    return '<div class="fd-post '+cls+'"><div class="fd-main"><span class="fd-author">'+esc(p.author)+
      '</span><p class="fd-text">'+esc(p.text)+"</p>"+
      '<span class="fd-stamp">'+esc(stamp)+"</span>"+extra+"</div></div>";
  }).join("");
}
document.getElementById("fd-step").addEventListener("click",function(){
  if(fdStage<4){ fdStage++; renderFilter(); }
});
document.getElementById("fd-run").addEventListener("click",function(){
  var t=setInterval(function(){
    if(fdStage>=4){ clearInterval(t); return; }
    fdStage++; renderFilter();
  },900);
});
document.getElementById("fd-reset").addEventListener("click",function(){
  fdStage=0; renderFilter();
});
renderFilter();

/* ==================================================================
   FUNNEL — 500M posts → candidate sources → ~1,500 scored.
   ================================================================== */
var funnelSteps=[
  {row:1,label:"Thunder · in-network",n:1200,read:"Thunder pulls recent posts from accounts you follow — up to ~1,200 in the current config."},
  {row:2,label:"Phoenix retrieval · out-of-network",n:1000,read:"Phoenix retrieval embeds you and every post as vectors and returns the ~1,000 nearest — pure discovery."},
  {row:3,label:"SimClusters · cluster picks",n:300,read:"SimClusters mines engagement clusters for more out-of-network candidates."},
  {row:4,label:"dedup + pre-scoring filters",n:1500,read:"Duplicates across sources are merged, stale/seen/blocked posts removed — about ~1,500 candidates reach Phoenix."}
];
var funnelRead=document.getElementById("funnel-read"), funnelTimer=null;
function funnelSet(step){
  var rows=document.querySelectorAll("#funnel .frow");
  rows.forEach(function(r){
    var s=+r.getAttribute("data-stage");
    var fill=r.querySelector(".ffill"), num=r.querySelector(".fnum");
    if(s===0){ return; }
    if(s<=step){
      var st=funnelSteps[s-1];
      var w=(Math.log10(st.n)/Math.log10(500000000)*100);
      fill.style.width=w.toFixed(1)+"%";
      num.textContent="~"+st.n.toLocaleString("en-US");
      r.classList.remove("dim"); r.classList.add("lit");
    }else{
      fill.style.width="0%"; num.textContent="—";
      r.classList.add("dim"); r.classList.remove("lit");
    }
  });
  funnelRead.textContent=step===0?"Press “Run the funnel”.":
    (funnelSteps[step-1].read+" (log scale — 500M would swallow everything otherwise)");
}
document.getElementById("funnel-run").addEventListener("click",function(){
  if(funnelTimer) clearInterval(funnelTimer);
  var s=0; funnelSet(0);
  funnelTimer=setInterval(function(){
    s++;
    if(s>4){ clearInterval(funnelTimer); funnelTimer=null; return; }
    funnelSet(s);
  },1100);
});
document.getElementById("funnel-reset").addEventListener("click",function(){
  if(funnelTimer){ clearInterval(funnelTimer); funnelTimer=null; }
  funnelSet(0);
});
funnelSet(0);

/* ==================================================================
   WEIGHT CHART — current config + 2023-era + community estimate.
   ================================================================== */
var WEIGHTS=[
  {label:"author replies back",w:75,tier:"h"},
  {label:"copy-link share",w:20.0,tier:"v"},
  {label:"mutual-follow reply boost",w:15.0,tier:"v"},
  {label:"reply (2023)",w:13.5,tier:"h"},
  {label:"profile click (2023)",w:12.0,tier:"h"},
  {label:"reply",w:5.0,tier:"v"},
  {label:"quote",w:5.0,tier:"v"},
  {label:"share via DM",w:5.0,tier:"v"},
  {label:"bookmark",w:5.0,tier:"e"},
  {label:"follow author",w:4.0,tier:"v"},
  {label:"share",w:2.0,tier:"v"},
  {label:"repost",w:1.0,tier:"v"},
  {label:"like",w:0.5,tier:"v"},
  {label:"click",w:0.3,tier:"v"},
  {label:"open link",w:0.2,tier:"v"},
  {label:"dwell · 2 min (toy)",w:0.48,tier:"v"},
  {label:"report (2023)",w:-369,tier:"h"},
  {label:"report",w:-234.0,tier:"v"},
  {label:"mute author",w:-58.8,tier:"v"},
  {label:"not interested",w:-47.52,tier:"v"},
  {label:"block author",w:-31.2,tier:"v"}
];
var wChart=document.getElementById("w-chart");
(function(){
  var maxAbs=369; /* |−369|, the largest magnitude on the chart */
  var tname={v:"verified",h:"historical",e:"estimated"};
  wChart.innerHTML=WEIGHTS.map(function(x){
    var t=Math.sqrt(Math.abs(x.w)/maxAbs)*50;
    var left=x.w>=0?50:50-t, width=Math.max(t,1.2);
    var cls=x.w>=0?"pos":"neg";
    return '<div class="bar-row wrow"><span class="tok" title="'+esc(x.label)+' · '+tname[x.tier]+'">'+esc(x.label)+
      '<span class="tbadge '+x.tier+'">'+tname[x.tier]+'</span></span>'+
      '<span class="bar-track"><span class="bar-fill '+cls+'" style="left:'+left.toFixed(1)+'%;width:'+width.toFixed(1)+'%"></span></span>'+
      '<span class="bar-pct">'+(x.w>=0?"+":"")+x.w+"</span></div>";
  }).join("");
})();

})();
