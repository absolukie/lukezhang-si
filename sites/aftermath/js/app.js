/* AFTERMATH v1 — localStorage-backed cleanup documentation */
"use strict";
var LS_KEY = "aftermath.v1";
var uid = function(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); };
var $ = function(id){ return document.getElementById(id); };

function fmtTime(ts){
  var d = new Date(ts);
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) + " " +
         d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}
function fmtTimeShort(ts){
  var d = new Date(ts);
  return d.toLocaleDateString("en-US",{month:"numeric",day:"numeric"}) + " " +
         d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}
function money(n){ return "$" + Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function esc(s){
  return String(s==null?"":s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

/* ---------- state ---------- */
var state = { jobs:[], photos:[], checklist:[], lineItems:[], events:[] };
var currentJobId = null;
var taggingPhotoId = null;
var pinMode = false;
var pinDraft = [];

function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} try{ if(window.__aftermathSync) window.__aftermathSync.onSave(); }catch(e){} }

/* Sync bridge (sync.js). Local-first: app works fully offline; sync is debounced and never blocks UI. */
window.__aftermath = {
  getS: function(){ return state; },
  saveLocal: function(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} },
  refresh: function(){ refreshAfterSync(); }
};
function refreshAfterSync(){
  if(currentJobId){
    renderJobHeader(); renderPhotos(); renderChecklist(); renderWorklog(); renderDossierTab();
  } else renderJobs();
}
function load(){
  try{
    var raw = localStorage.getItem(LS_KEY);
    if(raw){ var s = JSON.parse(raw); if(s && s.jobs){ state = s; } }
  }catch(e){}
}

function logEvent(jobId, text){
  state.events.push({id:uid(), jobId:jobId, ts:Date.now(), text:text});
  save();
}
function jobPhotos(jobId){ return state.photos.filter(function(p){return p.jobId===jobId;}); }
function jobChecklist(jobId){ return state.checklist.filter(function(c){return c.jobId===jobId;}); }
function jobItems(jobId){ return state.lineItems.filter(function(i){return i.jobId===jobId;}); }
function jobEvents(jobId){ return state.events.filter(function(e){return e.jobId===jobId;}).sort(function(a,b){return a.ts-b.ts;}); }
function getJob(id){ return state.jobs.find(function(j){return j.id===id;}); }

var DEFAULT_CHECKLIST = [
  ["PPE donned and inspected","Gloves, respirator, eye protection, coveralls per OSHA 29 CFR 1910.1030"],
  ["Work area isolated","Barriers / signage posted; HVAC vents sealed if airborne risk"],
  ["Sharps and hazards sweep","Needles, broken glass, structural hazards identified and contained"],
  ["Bulk debris removed","Bagged in labeled biohazard / waste containers"],
  ["Porous materials removed","Carpet, drywall, upholstery cut out where contaminated"],
  ["Surfaces cleaned","Detergent wash of all affected hard surfaces"],
  ["Disinfection applied","EPA-registered disinfectant, label dwell time observed"],
  ["Deodorizing treatment","As needed: hydroxyl / ozone / enzymatic per job type"],
  ["Waste staged for disposal","Manifests prepared; licensed hauler scheduled"],
  ["Final walkthrough","Photos of completed state captured; client sign-off"]
];

function ensureChecklist(jobId){
  if(jobChecklist(jobId).length) return;
  DEFAULT_CHECKLIST.forEach(function(c){
    state.checklist.push({id:uid(), jobId:jobId, label:c[0], sub:c[1], done:false, doneAt:null});
  });
  save();
}

/* ---------- toast ---------- */
var toastTimer = null;
function toast(msg){
  var t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2200);
}

/* ---------- view switching ---------- */
function showView(name){
  document.querySelectorAll(".view").forEach(function(v){ v.classList.remove("active"); });
  $("view-"+name).classList.add("active");
  window.scrollTo(0,0);
}

/* ---------- jobs list ---------- */
function statusLabel(s){
  return {intake:"Intake", active:"Active", awaiting:"Awaiting adjuster", closed:"Closed"}[s] || s;
}
function renderJobs(){
  var list = $("job-list");
  var stats = $("jobs-stats");
  var open = state.jobs.filter(function(j){return j.status!=="closed";}).length;
  var totalVal = 0;
  state.jobs.forEach(function(j){
    if(j.status!=="closed"){
      totalVal += jobItems(j.id).reduce(function(s,i){ return s + (i.qty*i.rate); }, 0);
    }
  });
  stats.textContent = state.jobs.length + (state.jobs.length===1?" job":" jobs") + " · " + open + " open" +
    (totalVal>0 ? " · " + money(totalVal) + " documented" : "");
  if(!state.jobs.length){
    var welcomed = false;
    try{ welcomed = !!localStorage.getItem("aftermath.welcomed"); }catch(e){}
    list.innerHTML =
      (welcomed ? "" :
      '<div class="welcome-card">' +
      '<div class="welcome-kicker">Welcome to Aftermath</div>' +
      '<div class="welcome-title">Turn a cleanup job into an insurance dossier in 3 steps</div>' +
      '<div class="welcome-steps">' +
      '<div><b>1</b> Document the scene with timestamped, tagged photos</div>' +
      '<div><b>2</b> Check off the decontamination work as the crew finishes</div>' +
      '<div><b>3</b> Generate the adjuster-ready dossier in one tap</div>' +
      '</div>' +
      '<button id="btn-welcome-demo" class="btn btn-primary btn-block">See a finished dossier</button>' +
      '<button id="btn-welcome-new" class="btn btn-secondary btn-block" style="margin-top:8px;">Start my first job</button>' +
      '</div>') +
      '<div class="empty">' +
      '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>' +
      '<div style="font-weight:700;color:var(--text);margin-bottom:6px;">No jobs yet</div>' +
      '<div>Create a job to start documenting, or load the demo job to see a finished dossier.</div></div>';
    var wd = $("btn-welcome-demo");
    if(wd) wd.addEventListener("click", function(){
      try{ localStorage.setItem("aftermath.welcomed","1"); }catch(e){}
      seedDemo(true);
    });
    var wn = $("btn-welcome-new");
    if(wn) wn.addEventListener("click", function(){
      try{ localStorage.setItem("aftermath.welcomed","1"); }catch(e){}
      renderJobs(); openModal("modal-job");
    });
    return;
  }
  list.innerHTML = state.jobs.map(function(j){
    var pc = jobPhotos(j.id).length;
    return '<div class="job-card" data-id="'+j.id+'">' +
      '<div class="job-card-top"><div class="job-card-name">'+esc(j.name)+'</div>' +
      '<div class="status-pill status-'+j.status+'">'+statusLabel(j.status)+'</div></div>' +
      '<div class="job-card-meta">' +
      (j.client?'<div>'+esc(j.client)+'</div>':'') +
      (j.address?'<div>'+esc(j.address)+'</div>':'') +
      '<div>'+pc+' photo'+(pc===1?"":"s")+' · opened '+fmtTime(j.createdAt)+'</div>' +
      '</div></div>';
  }).join("");
  list.querySelectorAll(".job-card").forEach(function(c){
    c.addEventListener("click", function(){ openJob(c.getAttribute("data-id")); });
  });
}

function openJob(id){
  currentJobId = id;
  ensureChecklist(id);
  renderJobHeader();
  renderPhotos(); renderChecklist(); renderWorklog(); renderDossierTab();
  switchTab("photos");
  showView("job");
}
function renderJobHeader(){
  var j = getJob(currentJobId); if(!j) return;
  $("job-title").textContent = j.name;
  $("job-sub").textContent = [j.client, j.type].filter(Boolean).join(" · ");
  $("job-status").value = j.status;
}

/* ---------- tabs ---------- */
function switchTab(name){
  document.querySelectorAll("#job-tabs .tab").forEach(function(t){
    t.classList.toggle("active", t.getAttribute("data-tab")===name);
  });
  document.querySelectorAll(".tab-panel").forEach(function(p){ p.classList.remove("active"); });
  $("tab-"+name).classList.add("active");
}

/* ---------- photos ---------- */
function renderPhotos(){
  var grid = $("photo-grid");
  var photos = jobPhotos(currentJobId);
  $("count-photos").textContent = photos.length || "";
  if(!photos.length){
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1;padding:30px 10px;">No photos yet.<br>Add photos from the camera or gallery.</div>';
    return;
  }
  grid.innerHTML = photos.map(function(p){
    var badges = "";
    if(p.room) badges += '<span class="badge">'+esc(p.room)+'</span>';
    if(p.damageType) badges += '<span class="badge">'+esc(p.damageType)+'</span>';
    if(p.severity) badges += '<span class="badge sev-'+esc(p.severity)+'">'+esc(p.severity)+'</span>';
    if(p.phase) badges += '<span class="badge phase-'+p.phase+'">'+p.phase.charAt(0).toUpperCase()+p.phase.slice(1)+'</span>';
    if(p.sample) badges += '<span class="badge sample">SAMPLE</span>';
    var pins = (p.pins||[]).map(function(pin,i){
      return '<div class="pin-dot" style="left:'+pin.x+'%;top:'+pin.y+'%">'+(i+1)+'</div>';
    }).join("");
    return '<div class="photo-cell" data-id="'+p.id+'"><img src="'+p.dataUrl+'" alt="" loading="lazy">' +
      '<div style="position:absolute;inset:0;pointer-events:none;">'+pins+'</div>' +
      '<div class="badges">'+badges+'</div></div>';
  }).join("");
  grid.querySelectorAll(".photo-cell").forEach(function(c){
    c.addEventListener("click", function(){ openTagModal(c.getAttribute("data-id")); });
  });
}

function handlePhotoFiles(files){
  var jobId = currentJobId; // capture now: async callbacks must not use the live currentJobId
  var arr = Array.prototype.slice.call(files);
  var done = 0;
  arr.forEach(function(f){
    if(!f.type || f.type.indexOf("image/")!==0) return;
    var reader = new FileReader();
    reader.onload = function(){
      downscale(reader.result, function(dataUrl, thumb){
        state.photos.push({
          id:uid(), jobId:jobId, dataUrl:dataUrl, thumb:thumb,
          takenAt: f.lastModified || Date.now(),
          room:"", damageType:"", severity:"", notes:"", pins:[], phase:"", sample:false
        });
        save();
        done++;
        if(currentJobId===jobId){ renderPhotos(); renderDossierTab(); }
        logEvent(jobId, "Photo added ("+(f.name||"upload")+")");
      });
    };
    reader.readAsDataURL(f);
  });
  if(arr.length) toast(arr.length + (arr.length===1?" photo":" photos") + " added");
}

function downscale(dataUrl, cb){
  var img = new Image();
  img.onload = function(){
    var max = 1400;
    var w = img.width, h = img.height;
    if(Math.max(w,h) > max){
      var r = max / Math.max(w,h); w = Math.round(w*r); h = Math.round(h*r);
    }
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    var full = c.toDataURL("image/jpeg", 0.82);
    // small thumbnail for sync (full-res dataUrl never leaves this device)
    var tw = 240, th = Math.max(1, Math.round(240 * h / w));
    var tc = document.createElement("canvas"); tc.width = tw; tc.height = th;
    tc.getContext("2d").drawImage(img, 0, 0, tw, th);
    cb(full, tc.toDataURL("image/jpeg", 0.6));
  };
  img.onerror = function(){ cb(dataUrl, null); };
  img.src = dataUrl;
}

/* ---------- sample photos (procedural, clearly labeled) ---------- */
var SAMPLE_ROOMS = ["Kitchen","Bathroom","Bedroom","Living room","Basement","Garage"];
var sampleIdx = 0;
function makeSamplePhoto(){
  var room = SAMPLE_ROOMS[sampleIdx % SAMPLE_ROOMS.length]; sampleIdx++;
  var w = 800, h = 600;
  var c = document.createElement("canvas"); c.width = w; c.height = h;
  var x = c.getContext("2d");
  var g = x.createLinearGradient(0,0,0,h);
  var tone = 30 + Math.floor(Math.random()*30);
  g.addColorStop(0, "rgb("+(tone+25)+","+(tone+18)+","+(tone+10)+")");
  g.addColorStop(1, "rgb("+tone+","+tone+","+tone+")");
  x.fillStyle = g; x.fillRect(0,0,w,h);
  // clutter blocks
  for(var i=0;i<26;i++){
    x.fillStyle = "rgba("+(40+Math.random()*70|0)+","+(35+Math.random()*50|0)+","+(30+Math.random()*40|0)+",0.85)";
    var bw = 40+Math.random()*130, bh = 30+Math.random()*110;
    x.fillRect(Math.random()*(w-bw), h*0.45+Math.random()*(h*0.55-bh), bw, bh);
  }
  // vignette
  var v = x.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.85);
  v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(0,0,0,0.55)");
  x.fillStyle = v; x.fillRect(0,0,w,h);
  // label
  x.fillStyle = "rgba(0,0,0,0.6)"; x.fillRect(0,0,w,64);
  x.fillStyle = "#f0a832"; x.font = "bold 26px sans-serif";
  x.fillText("SAMPLE PHOTO — " + room.toUpperCase(), 20, 42);
  x.fillStyle = "rgba(255,255,255,0.75)"; x.font = "20px sans-serif";
  x.fillText("placeholder — replace with real job photos", 20, h-24);
  var du = c.toDataURL("image/jpeg", 0.85);
  return {dataUrl: du, thumb: du, room: room}; // sample photo is already small; reuse as its own thumb
}

/* ---------- tag modal ---------- */
function openModal(id){ $(id).classList.add("open"); }
function closeModals(){ document.querySelectorAll(".modal").forEach(function(m){ m.classList.remove("open"); }); pinMode=false; updatePinBtn(); }
var confirmCb = null;
function askConfirm(title, body, okLabel, danger, cb){
  $("confirm-title").textContent = title;
  $("confirm-body").textContent = body || "";
  var yes = $("confirm-yes");
  yes.textContent = okLabel || "Confirm";
  yes.className = "btn " + (danger ? "btn-ghost danger" : "btn-primary");
  confirmCb = cb;
  openModal("modal-confirm");
}

function openTagModal(photoId){
  var p = state.photos.find(function(x){return x.id===photoId;});
  if(!p) return;
  taggingPhotoId = photoId;
  pinDraft = (p.pins||[]).map(function(pin){ return {x:pin.x, y:pin.y, label:pin.label||""}; });
  $("tag-img").src = p.dataUrl;
  $("photo-room").value = p.room || "";
  $("photo-damage").value = p.damageType || "";
  $("photo-severity").value = p.severity || "";
  $("photo-taken").value = fmtTime(p.takenAt);
  $("photo-notes").value = p.notes || "";
  taggingPhase = p.phase || "";
  paintPhaseBtns();
  renderPinLayer(); renderPinList();
  openModal("modal-photo");
}
function renderPinLayer(){
  var layer = $("pin-layer");
  layer.innerHTML = pinDraft.map(function(pin,i){
    return '<div class="pin-dot" style="left:'+pin.x+'%;top:'+pin.y+'%">'+(i+1)+'</div>';
  }).join("");
}
function renderPinList(){
  var list = $("pin-list");
  if(!pinDraft.length){ list.innerHTML = '<span class="muted" style="font-size:13px;">No markers yet.</span>'; return; }
  list.innerHTML = pinDraft.map(function(pin,i){
    return '<span class="pin-chip"><b>'+(i+1)+'</b> ' +
      '<input type="text" data-pin="'+i+'" value="'+esc(pin.label)+'" placeholder="Label (e.g. stain)" maxlength="40" style="width:130px;margin:0;padding:5px 8px;font-size:13px;">' +
      '<button type="button" data-delpin="'+i+'">×</button></span>';
  }).join("");
  list.querySelectorAll("[data-delpin]").forEach(function(b){
    b.addEventListener("click", function(){
      pinDraft.splice(parseInt(b.getAttribute("data-delpin"),10),1);
      renderPinLayer(); renderPinList();
    });
  });
  list.querySelectorAll("[data-pin]").forEach(function(inp){
    inp.addEventListener("input", function(){
      pinDraft[parseInt(inp.getAttribute("data-pin"),10)].label = inp.value;
    });
  });
}
var taggingPhase = "";
function paintPhaseBtns(){
  document.querySelectorAll("#photo-phase .phase-btn").forEach(function(b){
    b.classList.toggle("sel", b.getAttribute("data-phase")===taggingPhase);
  });
}
function updatePinBtn(){
  $("btn-pin-mode").classList.toggle("armed", pinMode);
  $("btn-pin-mode").textContent = pinMode ? "Placing markers — tap Done" : "Tap photo to place marker";
}

/* ---------- checklist ---------- */
function renderChecklist(){
  var list = $("checklist-list");
  var items = jobChecklist(currentJobId);
  var done = items.filter(function(c){return c.done;}).length;
  $("count-checklist").textContent = done + "/" + items.length;
  $("checklist-bar").style.width = (items.length ? Math.round(done/items.length*100) : 0) + "%";
  list.innerHTML = items.map(function(c){
    return '<div class="check-item'+(c.done?" done":"")+'" data-id="'+c.id+'">' +
      '<div class="check-box"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<div><div class="check-label">'+esc(c.label)+'</div>' +
      '<div class="check-sub">'+esc(c.sub)+'</div>' +
      (c.done && c.doneAt ? '<div class="check-time">Completed '+fmtTimeShort(c.doneAt)+'</div>' : '') +
      '</div></div>';
  }).join("");
  list.querySelectorAll(".check-item").forEach(function(el){
    el.addEventListener("click", function(){
      var c = state.checklist.find(function(x){return x.id===el.getAttribute("data-id");});
      if(!c) return;
      c.done = !c.done; c.doneAt = c.done ? Date.now() : null;
      save(); renderChecklist(); renderDossierTab();
      if(c.done) logEvent(currentJobId, "Checklist: " + c.label);
    });
  });
}

/* ---------- work log ---------- */
function renderWorklog(){
  var items = jobItems(currentJobId);
  var total = items.reduce(function(s,i){ return s + (i.qty*i.rate); }, 0);
  $("count-worklog").textContent = items.length || "";
  $("worklog-total").innerHTML = '<div><div class="t-label">Work record total</div><div class="t-val">'+money(total)+'</div></div>' +
    '<div class="t-label">'+items.length+' line item'+(items.length===1?"":"s")+'</div>';
  var list = $("worklog-list");
  if(!items.length){ list.innerHTML = '<div class="empty" style="padding:20px;">No line items yet.</div>'; return; }
  list.innerHTML = items.map(function(i){
    return '<div class="li-row" data-id="'+i.id+'">' +
      '<div><div class="li-desc">'+esc(i.desc)+'</div>' +
      '<div class="li-meta">'+i.qty+' '+esc(i.unit||"")+' × '+money(i.rate)+'</div></div>' +
      '<div style="display:flex;align-items:center;gap:6px;"><div class="li-amt">'+money(i.qty*i.rate)+'</div>' +
      '<button class="li-del" data-del="'+i.id+'" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button></div></div>';
  }).join("");
  list.querySelectorAll("[data-del]").forEach(function(b){
    b.addEventListener("click", function(ev){
      ev.stopPropagation();
      var id = b.getAttribute("data-del");
      var it = state.lineItems.find(function(x){return x.id===id;});
      state.lineItems = state.lineItems.filter(function(x){return x.id!==id;});
      save(); renderWorklog(); renderDossierTab();
      if(it) logEvent(currentJobId, "Work log: removed '" + it.desc + "'");
      toast("Line item removed");
    });
  });
}

/* ---------- dossier score ---------- */
function dossierScore(jobId){
  var j = getJob(jobId);
  var photos = jobPhotos(jobId);
  var items = jobChecklist(jobId);
  var done = items.filter(function(c){return c.done;}).length;
  var lis = jobItems(jobId);
  var parts = [];
  var metaPts = (j.claim?8:0)+(j.insurer?7:0)+(j.client?5:0)+(j.address?5:0);
  parts.push({label:"Claim details (claim #, insurer, client, address)", pts:metaPts, max:25});
  var photoPts = Math.round(Math.min(photos.length,8)/8*25);
  parts.push({label:"Photo evidence ("+photos.length+" of 8+)", pts:photoPts, max:25});
  var checkPts = items.length ? Math.round(done/items.length*25) : 0;
  parts.push({label:"Decontamination checklist ("+done+"/"+items.length+")", pts:checkPts, max:25});
  var workPts = Math.round(Math.min(lis.length,4)/4*25);
  parts.push({label:"Work record ("+lis.length+" line items)", pts:workPts, max:25});
  var total = parts.reduce(function(s,p){return s+p.pts;},0);
  return {parts:parts, total:total};
}
function scoreMissing(jobId, sc){
  var j = getJob(jobId);
  var out = [];
  if(!j.claim) out.push("Add the insurance claim number (New job form)");
  if(!j.insurer) out.push("Add the insurer name");
  if(jobPhotos(jobId).length<8) out.push("Add "+(8-jobPhotos(jobId).length)+" more tagged photos");
  var items = jobChecklist(jobId);
  var left = items.filter(function(c){return !c.done;}).length;
  if(left) out.push("Complete "+left+" checklist step"+(left===1?"":"s"));
  if(!jobItems(jobId).length) out.push("Add line items to the work log");
  return out;
}
function scoreRing(pct, size){
  var s = size||84, r = s/2-8, c = 2*Math.PI*r, off = c*(1-pct/100);
  var col = pct>=90 ? "#3ecf8e" : pct>=55 ? "#f0a832" : "#ff6b6b";
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 '+s+' '+s+'" style="transform:rotate(-90deg)">'+
    '<circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" fill="none" stroke="#26303e" stroke-width="9"/>'+
    '<circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="9" stroke-linecap="round" '+
    'stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" style="transition:stroke-dashoffset .8s;"/></svg>';
}

/* ---------- dossier ---------- */
function renderDossierTab(){
  var photos = jobPhotos(currentJobId);
  var items = jobChecklist(currentJobId);
  var done = items.filter(function(c){return c.done;}).length;
  var total = jobItems(currentJobId).reduce(function(s,i){return s+(i.qty*i.rate);},0);
  var sc = dossierScore(currentJobId);
  var miss = scoreMissing(currentJobId, sc);
  var verdict = sc.total>=90
    ? '<span class="verdict-pill v-ready">Adjuster-ready</span>'
    : sc.total>=55
    ? '<span class="verdict-pill v-soon">Nearly there</span>'
    : '<span class="verdict-pill v-early">In progress</span>';
  $("dossier-stats").innerHTML =
    '<div class="score-hero"><div class="score-ring-wrap">'+scoreRing(sc.total,92)+
    '<div class="score-num"><span id="scoreNum">0</span><small>%</small></div></div>'+
    '<div><div class="score-label">Dossier score</div>'+verdict+
    '<div class="muted" style="margin-top:6px;font-size:13px;">'+money(total)+' documented · '+photos.length+' photos</div></div></div>'+
    (miss.length
      ? '<div class="miss-card"><div class="miss-title">To reach 100% — '+miss.length+' item'+(miss.length===1?"":"s")+'</div><ul class="miss-list">'+
        miss.map(function(m){return '<li>'+esc(m)+'</li>';}).join("")+'</ul></div>'
      : '<div class="miss-card sealed"><div class="miss-title">Dossier sealed.</div><div class="muted">Every record an adjuster asks for is present and timestamped. Generate it and send.</div></div>');
  var cust = $("custody-list");
  var evs = jobEvents(currentJobId);
  var sn = $("scoreNum");
  if(sn){
    var target = dossierScore(currentJobId).total, n = 0;
    var step = Math.max(1, Math.round(target/28));
    var tick = function(){ n = Math.min(target, n+step); sn.textContent = n; if(n<target) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  if(!evs.length){ cust.innerHTML = '<div class="muted">No events yet.</div>'; return; }
  cust.innerHTML = evs.slice(-8).reverse().map(function(e){
    return '<div class="custody-row"><div class="custody-time">'+fmtTimeShort(e.ts)+'</div><div class="custody-text">'+esc(e.text)+'</div></div>';
  }).join("");
}

function buildDossierHTML(){
  var j = getJob(currentJobId);
  var photos = jobPhotos(currentJobId);
  var items = jobChecklist(currentJobId);
  var lis = jobItems(currentJobId);
  var evs = jobEvents(currentJobId);
  var total = lis.reduce(function(s,i){return s+(i.qty*i.rate);},0);

  function photoCard(p, pi){
    var pins = (p.pins||[]).map(function(pin,i){
      return '<span class="cap-tag">Marker '+(i+1)+(pin.label?": "+esc(pin.label):"")+'</span>';
    }).join("");
    return '<div class="dz-photo"><img src="'+p.dataUrl+'" alt="Evidence photo '+(pi+1)+'">' +
      '<div class="dz-photo-cap"><b>Photo '+(pi+1)+'</b> — captured '+fmtTime(p.takenAt) +
      (p.sample ? ' <span class="cap-tag">SAMPLE</span>' : '') +
      '<div class="cap-tags">' +
      (p.room?'<span class="cap-tag">'+esc(p.room)+'</span>':'') +
      (p.damageType?'<span class="cap-tag">'+esc(p.damageType)+'</span>':'') +
      (p.severity?'<span class="cap-tag">'+esc(p.severity)+'</span>':'') + pins +
      '</div>' +
      (p.notes?'<div style="margin-top:6px;">'+esc(p.notes)+'</div>':'') +
      '</div></div>';
  }
  var photoHTML;
  if(!photos.length){
    photoHTML = '<p>No photos documented.</p>';
  } else {
    var groups = [["before","Before remediation"],["during","During remediation"],["after","After remediation"],["","Unclassified"]];
    photoHTML = "";
    var n = 0;
    groups.forEach(function(g){
      var gp = photos.filter(function(p){ return (p.phase||"")===g[0]; });
      if(!gp.length) return;
      photoHTML += '<h3>'+g[1]+' ('+gp.length+')</h3>';
      gp.forEach(function(p){ n++; photoHTML += photoCard(p, n); });
    });
  }

  var checkHTML = items.map(function(c){
    return '<div class="dz-check"><div class="box">'+(c.done?"✓":"")+'</div>' +
      '<div><b>'+esc(c.label)+'</b><br><span style="color:#555;">'+esc(c.sub)+'</span>' +
      (c.done&&c.doneAt?' <span style="color:#0a7a4a;">— completed '+fmtTime(c.doneAt)+'</span>':'') +
      '</div></div>';
  }).join("");

  var liHTML = lis.length ? '<table class="dz-table"><tr><th>Description</th><th>Qty</th><th>Rate</th><th style="text-align:right;">Amount</th></tr>' +
    lis.map(function(i){
      return '<tr><td>'+esc(i.desc)+'</td><td>'+i.qty+' '+esc(i.unit||"")+'</td><td>'+money(i.rate)+'</td><td style="text-align:right;">'+money(i.qty*i.rate)+'</td></tr>';
    }).join("") +
    '<tr class="dz-total-row"><td colspan="3">Total</td><td style="text-align:right;">'+money(total)+'</td></tr></table>'
    : '<p>No line items recorded.</p>';

  var custHTML = evs.length ? '<table class="dz-table"><tr><th>Timestamp</th><th>Event</th></tr>' +
    evs.map(function(e){ return '<tr><td style="white-space:nowrap;">'+fmtTime(e.ts)+'</td><td>'+esc(e.text)+'</td></tr>'; }).join("") +
    '</table>' : '<p>No custody events recorded.</p>';

  return '<h1>REMEDIATION DOSSIER</h1>' +
    '<div class="dz-cover-sub">Prepared by '+esc(j.company||"Cleanup contractor")+' · Generated '+fmtTime(Date.now())+' via Aftermath</div>' +
    '<div class="dz-meta">' +
    '<div><b>Job</b>'+esc(j.name)+'</div><div><b>Job type</b>'+esc(j.type||"—")+'</div>' +
    '<div><b>Client / policyholder</b>'+esc(j.client||"—")+'</div><div><b>Property address</b>'+esc(j.address||"—")+'</div>' +
    '<div><b>Claim number</b>'+esc(j.claim||"—")+'</div><div><b>Insurer</b>'+esc(j.insurer||"—")+'</div>' +
    '</div>' +
    '<h2>1 · Photo evidence ('+photos.length+')</h2>' + photoHTML +
    '<h2>2 · Decontamination checklist</h2>' + checkHTML +
    '<h2>3 · Line-item work record</h2>' + liHTML +
    '<h2>4 · Chain of custody</h2>' + custHTML +
    '<div class="dz-sign"><div><div class="sig-line">Technician signature / date</div></div>' +
    '<div><div class="sig-line">Client / adjuster signature / date</div></div></div>' +
    '<div class="dz-footer">This dossier documents conditions observed and work performed. Timestamps are captured at the time of photo capture and checklist completion. Retain with claim file.</div>';
}

/* ---------- demo seed ---------- */
function seedDemo(toDossier){
  if(state.jobs.some(function(j){return j.demo;})){ toast("Demo job already loaded"); return; }
  var jobId = uid();
  var now = Date.now(), H = 3600000, D = 24*H;
  state.jobs.push({
    id:jobId, name:"Hoarding cleanup — 418 Maple St", client:"M. Alvarez (policyholder)",
    address:"418 Maple St, Fresno, CA 93721", claim:"CLM-8841023", insurer:"Meridian Home Insurance",
    type:"Hoarding cleanup", company:"Aftermath Demo Services",
    status:"awaiting", createdAt: now - 6*D, demo:true
  });
  ensureChecklist(jobId);
  var rooms = ["Kitchen","Bathroom","Bedroom","Living room","Basement","Garage"];
  var damages = ["Hoarding debris","Hoarding debris","Mold","Water damage","Biohazard","Odor"];
  var sevs = ["Severe","Moderate","Severe","Extreme","Moderate","Light"];
  var phases = ["before","before","before","during","after","after"];
  rooms.forEach(function(room,i){
    var s = makeSamplePhoto();
    var taken = now - 5*D + i*3*H;
    state.photos.push({
      id:uid(), jobId:jobId, dataUrl:s.dataUrl, thumb:s.thumb, takenAt:taken,
      room:room, damageType:damages[i], severity:sevs[i], phase:phases[i], sample:true,
      notes: i===0 ? "Bulk debris 3-4 ft deep across full kitchen floor." : "",
      pins: i===0 ? [{x:42,y:55,label:"deepest accumulation"},{x:70,y:38,label:"blocked egress"}] : []
    });
    state.events.push({id:uid(), jobId:jobId, ts:taken, text:"Photo added ("+room+")"});
  });
  var items = jobChecklist(jobId);
  items.slice(0,7).forEach(function(c,i){
    c.done = true; c.doneAt = now - 4*D + i*2*H;
    state.events.push({id:uid(), jobId:jobId, ts:c.doneAt, text:"Checklist: "+c.label});
  });
  [["Biohazard remediation, crew of 3",26,"hr",185],
   ["Debris removal and disposal",4.5,"ton",320],
   ["EPA disinfectant + deodorizing treatment",1,"job",950],
   ["PPE and consumables",1,"lot",420]
  ].forEach(function(r){
    state.lineItems.push({id:uid(), jobId:jobId, desc:r[0], qty:r[1], unit:r[2], rate:r[3]});
  });
  state.events.push({id:uid(), jobId:jobId, ts:now-6*D, text:"Job created"});
  state.events.push({id:uid(), jobId:jobId, ts:now-1*D, text:"Status changed to Awaiting adjuster"});
  save();
  renderJobs();
  toast("Demo job loaded");
  openJob(jobId);
  if(toDossier){
    switchTab("dossier");
    toast("This is the magic moment — one tap generates the dossier");
  }
}

/* ---------- init / wiring ---------- */
document.addEventListener("DOMContentLoaded", function(){
  load();
  renderJobs();

  $("btn-new-job").addEventListener("click", function(){ openModal("modal-job"); });
  $("btn-demo").addEventListener("click", seedDemo);
  $("btn-wipe").addEventListener("click", function(){
    askConfirm("Delete all data?", "Every job, photo, and work record on this device will be removed. This cannot be undone.", "Delete everything", true, function(){
      state = {jobs:[],photos:[],checklist:[],lineItems:[],events:[]};
      try{
        localStorage.removeItem("aftermath.device_key");
        localStorage.removeItem("aftermath.syncmeta.v1");
        localStorage.removeItem("aftermath.lastsync.v1");
      }catch(e){}
      save(); renderJobs(); toast("All data cleared");
    });
  });
  $("confirm-yes").addEventListener("click", function(){
    closeModals();
    if(confirmCb){ var cb = confirmCb; confirmCb = null; cb(); }
  });
  $("confirm-no").addEventListener("click", closeModals);

  document.querySelectorAll("[data-close]").forEach(function(b){
    b.addEventListener("click", closeModals);
  });
  document.querySelectorAll(".modal").forEach(function(m){
    m.addEventListener("click", function(e){ if(e.target===m) closeModals(); });
  });

  $("job-form").addEventListener("submit", function(e){
    e.preventDefault();
    var name = $("job-name").value.trim();
    if(!name) return;
    var id = uid();
    state.jobs.unshift({
      id:id, name:name,
      client:$("job-client").value.trim(), address:$("job-address").value.trim(),
      claim:$("job-claim").value.trim(), insurer:$("job-insurer").value.trim(),
      type:$("job-type").value, company:$("job-company").value.trim(),
      status:"intake", createdAt:Date.now()
    });
    save();
    logEvent(id, "Job created");
    $("job-form").reset();
    closeModals(); renderJobs();
    toast("Job created");
    openJob(id);
  });

  $("btn-back").addEventListener("click", function(){ currentJobId=null; renderJobs(); showView("jobs"); });
  $("job-status").addEventListener("change", function(){
    var j = getJob(currentJobId); if(!j) return;
    j.status = $("job-status").value; save();
    logEvent(currentJobId, "Status changed to " + statusLabel(j.status));
    toast("Status: " + statusLabel(j.status));
  });

  document.querySelectorAll("#job-tabs .tab").forEach(function(t){
    t.addEventListener("click", function(){ switchTab(t.getAttribute("data-tab")); });
  });

  $("photo-input").addEventListener("change", function(){
    handlePhotoFiles(this.files); this.value = "";
  });
  $("btn-sample-photo").addEventListener("click", function(){
    var s = makeSamplePhoto();
    state.photos.push({
      id:uid(), jobId:currentJobId, dataUrl:s.dataUrl, thumb:s.thumb, takenAt:Date.now(),
      room:s.room, damageType:"", severity:"", notes:"", pins:[], phase:"", sample:true
    });
    save(); renderPhotos(); renderDossierTab();
    logEvent(currentJobId, "Sample photo added ("+s.room+")");
    toast("Sample photo added");
  });

  /* tag modal wiring */
  $("tag-stage").addEventListener("click", function(e){
    if(!pinMode) return;
    var r = $("tag-stage").getBoundingClientRect();
    var x = Math.round((e.clientX - r.left)/r.width*1000)/10;
    var y = Math.round((e.clientY - r.top)/r.height*1000)/10;
    pinDraft.push({x:x, y:y, label:""});
    renderPinLayer(); renderPinList();
  });
  $("btn-pin-mode").addEventListener("click", function(){
    pinMode = !pinMode; updatePinBtn();
  });
  $("btn-pin-clear").addEventListener("click", function(){
    pinDraft = []; renderPinLayer(); renderPinList();
  });
  document.querySelectorAll("#photo-phase .phase-btn").forEach(function(b){
    b.addEventListener("click", function(){
      taggingPhase = b.getAttribute("data-phase");
      paintPhaseBtns();
    });
  });
  $("photo-form").addEventListener("submit", function(e){
    e.preventDefault();
    var p = state.photos.find(function(x){return x.id===taggingPhotoId;});
    if(!p) return;
    p.room = $("photo-room").value; p.damageType = $("photo-damage").value;
    p.severity = $("photo-severity").value; p.notes = $("photo-notes").value.trim();
    p.pins = pinDraft.map(function(pin){ return {x:pin.x, y:pin.y, label:(pin.label||"").trim()}; });
    p.phase = taggingPhase;
    save(); closeModals();
    renderPhotos(); renderDossierTab();
    logEvent(currentJobId, "Photo tagged ("+[p.room,p.damageType].filter(Boolean).join(", ")+")");
    toast("Photo tagged");
  });
  $("btn-photo-delete").addEventListener("click", function(){
    askConfirm("Delete this photo?", "It will be removed from the dossier.", "Delete photo", true, function(){
      state.photos = state.photos.filter(function(x){return x.id!==taggingPhotoId;});
      save(); closeModals(); renderPhotos(); renderDossierTab();
      logEvent(currentJobId, "Photo deleted");
      toast("Photo deleted");
    });
  });

  /* work log */
  $("lineitem-form").addEventListener("submit", function(e){
    e.preventDefault();
    var desc = $("li-desc").value.trim();
    var qty = parseFloat($("li-qty").value)||0;
    var rate = parseFloat($("li-rate").value)||0;
    if(!desc || !rate) return;
    state.lineItems.push({id:uid(), jobId:currentJobId, desc:desc, qty:qty, unit:$("li-unit").value.trim(), rate:rate});
    save();
    logEvent(currentJobId, "Work log: " + desc + " (" + money(qty*rate) + ")");
    $("li-desc").value = ""; $("li-qty").value = "1"; $("li-rate").value = "";
    renderWorklog(); renderDossierTab();
    toast("Line item added");
  });

  /* csv export */
  $("btn-csv").addEventListener("click", function(){
    var j = getJob(currentJobId);
    var items = jobItems(currentJobId);
    if(!items.length){ toast("Nothing to export yet"); return; }
    var rows = [["Job","Description","Qty","Unit","Rate","Amount"]];
    items.forEach(function(i){
      rows.push([j.name, i.desc, i.qty, i.unit||"", i.rate, (i.qty*i.rate).toFixed(2)]);
    });
    var csv = rows.map(function(r){
      return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(",");
    }).join("\r\n");
    var blob = new Blob([csv], {type:"text/csv"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aftermath-worklog-" + currentJobId + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 800);
    logEvent(currentJobId, "Work log exported (CSV, "+items.length+" items)");
    toast("CSV exported");
  });

  /* dossier */
  var genBtnHTML = $("btn-generate").innerHTML;
  $("btn-generate").addEventListener("click", function(){
    var btn = $("btn-generate");
    var j = getJob(currentJobId);
    btn.disabled = true;
    var dots = 0;
    btn.textContent = "Assembling dossier";
    var iv = setInterval(function(){
      dots = (dots+1)%4;
      btn.textContent = "Assembling dossier" + ".".repeat(dots);
    }, 220);
    setTimeout(function(){
      clearInterval(iv);
      btn.disabled = false;
      btn.innerHTML = genBtnHTML;
      $("dossier-doc").innerHTML = buildDossierHTML();
      logEvent(currentJobId, "Dossier generated ("+jobPhotos(currentJobId).length+" photos, "+money(jobItems(currentJobId).reduce(function(s,i){return s+(i.qty*i.rate);},0))+")");
      renderDossierTab();
      showView("dossier");
      toast("Dossier ready — print or save as PDF");
    }, 900);
  });
  $("btn-dossier-back").addEventListener("click", function(){ showView("job"); });
  $("btn-print").addEventListener("click", function(){ window.print(); });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeModals();
  });

  /* device sync (prototype) */
  try{ if(window.__aftermathSyncUI) window.__aftermathSyncUI(); }catch(e){}
});
