/* Next Chapter: app logic. Vanilla JS, localStorage persistence, hash routing. */
(function(){
"use strict";

/* ---------- utilities ---------- */
const $ = (sel, el) => (el||document).querySelector(sel);
const $$ = (sel, el) => Array.from((el||document).querySelectorAll(sel));
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => "id" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const icon = (name, cls) => '<svg class="ic '+(cls||'')+'" aria-hidden="true"><use href="#i-'+name+'"/></svg>';
const fmtDate = iso => { if(!iso) return ""; const d = new Date(iso+"T12:00:00"); return isNaN(d) ? iso : d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); };
const timeAgo = ts => { const s = Math.floor((Date.now()-ts)/1000); if(s<60) return "just now"; if(s<3600) return Math.floor(s/60)+"m ago"; if(s<86400) return Math.floor(s/3600)+"h ago"; return Math.floor(s/86400)+"d ago"; };
const money = n => (n==null||n==="") ? "" : "$" + Number(n).toLocaleString();

const DISP = {
  keep:    {label:"Keep",       cls:"disp-keep"},
  donate:  {label:"Donate",     cls:"disp-donate"},
  sell:    {label:"Sell",       cls:"disp-sell"},
  discard: {label:"Discard",    cls:"disp-discard"},
  ask:     {label:"Ask family", cls:"disp-ask"}
};
const FAM = {
  pending:  {label:"Awaiting family", cls:"fam-pending"},
  approved: {label:"Approved",        cls:"fam-approved"},
  changed:  {label:"Decision changed", cls:"fam-changed"}
};
const VENDOR_KINDS = ["Movers","Estate sale company","Cleaners","Realtor","Donation pickup","Storage","Handyman","Appraiser","Other"];
const VENDOR_STATUS = { todo:{label:"To contact",cls:"st-todo"}, progress:{label:"In progress",cls:"st-progress"}, done:{label:"Done",cls:"st-done"} };
const DEFAULT_ROOMS = ["Living room","Kitchen","Primary bedroom","Bedroom 2","Bedroom 3","Bathroom","Garage","Basement","Attic","Office","Dining room"];

/* ---------- move checklists (change-of-address + accounts, per move type) ---------- */
const CHECKLIST_TPL = {
  "Downsizing move": [
    {c:"Mail & address", t:"File a USPS change of address", o:-14},
    {c:"Mail & address", t:"Update address with bank and credit cards", o:-14},
    {c:"Mail & address", t:"Update voter registration", o:30},
    {c:"Utilities", t:"Schedule final meter readings (electric, gas, water)", o:-7},
    {c:"Utilities", t:"Set up utilities at the new home", o:-7},
    {c:"Utilities", t:"Cancel or move internet and cable service", o:-7},
    {c:"Money", t:"Notify Social Security or pension payer of the new address", o:-7},
    {c:"Money", t:"Update homeowners or renters insurance", o:-7},
    {c:"Health", t:"Transfer prescriptions to a nearby pharmacy", o:-14},
    {c:"Health", t:"Notify doctors and dentists of the new address", o:7},
    {c:"Accounts", t:"Forward or cancel subscriptions and memberships", o:-7},
    {c:"Move day", t:"Confirm movers: time, crew size, parking", o:-3},
    {c:"Move day", t:"Pack a first-night box: medications, chargers, bedding", o:-2},
    {c:"Move day", t:"Return keys and remotes for the old home", o:1}
  ],
  "Estate cleanout": [
    {c:"Legal", t:"Locate the will, trust, and powers of attorney", o:-30},
    {c:"Legal", t:"Order certified death certificates (get extras)", o:-21},
    {c:"Legal", t:"Notify the estate attorney the cleanout is starting", o:-14},
    {c:"Property", t:"Secure the property: change locks, set light timers", o:-21},
    {c:"Property", t:"Check the homeowners policy covers a vacant home", o:-14},
    {c:"Property", t:"Cancel or transfer utilities after final readings", o:-7},
    {c:"Money", t:"Notify Social Security and pension payers", o:-14},
    {c:"Money", t:"Notify banks; ask about an estate account", o:-14},
    {c:"Money", t:"Notify the three credit bureaus", o:-14},
    {c:"Mail & address", t:"Forward mail to the executor", o:-14},
    {c:"Accounts", t:"Cancel subscriptions, memberships, and services", o:-7},
    {c:"Accounts", t:"Collect and return rented medical equipment", o:-7},
    {c:"Close-out", t:"Arrange the final cleaning", o:7},
    {c:"Close-out", t:"Return keys; document the property condition", o:14}
  ],
  "Relocation": [
    {c:"Mail & address", t:"File a USPS change of address", o:-14},
    {c:"Mail & address", t:"Update address with bank and credit cards", o:-14},
    {c:"Mail & address", t:"Update voter registration", o:30},
    {c:"Utilities", t:"Schedule final meter readings (electric, gas, water)", o:-7},
    {c:"Utilities", t:"Set up utilities at the new home", o:-7},
    {c:"Money", t:"Notify Social Security or pension payer of the new address", o:-7},
    {c:"Money", t:"Update homeowners or renters insurance", o:-7},
    {c:"Health", t:"Transfer prescriptions to a nearby pharmacy", o:-14},
    {c:"Health", t:"Find new doctors and request record transfers", o:-14},
    {c:"Accounts", t:"Forward or cancel subscriptions and memberships", o:-7},
    {c:"Move day", t:"Confirm movers: time, crew size, parking", o:-3},
    {c:"Move day", t:"Pack a first-night box: medications, chargers, bedding", o:-2}
  ],
  "Aging in place": [
    {c:"Mail & address", t:"Update voter registration", o:30},
    {c:"Utilities", t:"Review utility bills for assistance programs", o:-14},
    {c:"Money", t:"Notify Social Security or pension payer of any changes", o:-7},
    {c:"Money", t:"Review homeowners or renters insurance", o:-7},
    {c:"Health", t:"Transfer prescriptions to a delivery pharmacy", o:-14},
    {c:"Health", t:"Schedule home safety check: rails, lighting, rugs", o:-7},
    {c:"Accounts", t:"Set up autopay for recurring bills", o:-7},
    {c:"Close-out", t:"Arrange ongoing housekeeping or yard help", o:14}
  ]
};
const TASK_TIMING = [
  {label:"4 weeks before move day", o:-28},
  {label:"2 weeks before move day", o:-14},
  {label:"1 week before move day", o:-7},
  {label:"3 days before move day", o:-3},
  {label:"Move day", o:0},
  {label:"1 week after move day", o:7},
  {label:"1 month after move day", o:30}
];
function genChecklist(moveType){
  return (CHECKLIST_TPL[moveType] || CHECKLIST_TPL["Downsizing move"]).map(x => ({
    id: uid(), text: x.t, category: x.c, offset: x.o, done: false, doneAt: null, custom: false
  }));
}
function taskDueISO(move, task){
  if(!move.targetDate) return null;
  const t = new Date(move.targetDate + "T12:00:00");
  if(isNaN(t)) return null;
  t.setDate(t.getDate() + (Number(task.offset) || 0));
  return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");
}
function taskChip(move, task){
  if(task.done) return "";
  const due = taskDueISO(move, task);
  if(!due) return '<span class="pill" style="background:var(--bg-soft);color:var(--ink-faint)">Set a target date for due dates</span>';
  if(due < todayISO()) return '<span class="pill countdown overdue">Overdue</span>';
  if(due === todayISO()) return '<span class="pill countdown">Due today</span>';
  return '<span class="pill countdown">Due '+esc(fmtDate(due))+'</span>';
}
function roomDims(move, room){
  const d = (move.roomDims || {})[room];
  return (d && Number(d.l) > 0 && Number(d.w) > 0) ? {l: Number(d.l), w: Number(d.w)} : null;
}
function itemDims(it){
  return (it.dims && Number(it.dims.l) > 0 && Number(it.dims.w) > 0) ? {l: Number(it.dims.l), w: Number(it.dims.w)} : null;
}
function dimsText(d, unit){ return Math.round(d.l*10)/10 + " x " + Math.round(d.w*10)/10 + " " + unit; }
/* Bid + sale + checklist fields on every move, so old saved state keeps working */
function ensureMoveFields(m){
  m.checklist = Array.isArray(m.checklist) ? m.checklist : genChecklist(m.moveType);
  if(typeof m.saleFeePct !== "number") m.saleFeePct = 0;
  m.roomDims = (m.roomDims && typeof m.roomDims === "object" && !Array.isArray(m.roomDims)) ? m.roomDims : {};
  m.items.forEach(it => {
    if(it.estValue == null) it.estValue = "";
    if(it.soldPrice == null) it.soldPrice = "";
    if(it.soldTo == null) it.soldTo = "";
    if(it.soldDate == null) it.soldDate = "";
    if(!it.dims || typeof it.dims !== "object") it.dims = null;
  });
  m.vendors.forEach(v => {
    if(v.quote == null) v.quote = "";
    if(v.deposit == null) v.deposit = "";
    if(v.availDate == null) v.availDate = "";
    if(v.quoteNote == null) v.quoteNote = "";
    if(typeof v.awarded !== "boolean") v.awarded = false;
  });
}
function saleTotals(move){
  const sold = move.items.filter(i => i.disposition === "sell");
  const est = sold.reduce((s,i) => s + (Number(i.estValue) || 0), 0);
  const gross = sold.reduce((s,i) => s + (Number(i.soldPrice) || 0), 0);
  const fees = gross * (Number(move.saleFeePct) || 0) / 100;
  return {count: sold.length, soldCount: sold.filter(i => Number(i.soldPrice) > 0).length, est, gross, fees, net: gross - fees};
}
function checklistTotals(move){
  const list = move.checklist || [];
  return {done: list.filter(t => t.done).length, total: list.length};
}

/* ---------- store ---------- */
const KEY = "nc_v1";
const CORRUPT_PREFIX = "nc_v1.unreadable.";
function load(){
  let corruptRaw = null;
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const s = JSON.parse(raw);
      if(s && Array.isArray(s.moves)){
        let changed = false;
        const kept = [];
        s.moves.forEach(m => {
          // Wave F P2-2: one wrong-typed field on a single move no longer
          // quarantines the whole device. Sanitize the field and keep the
          // move; only a move that cannot be repaired at all is set aside.
          try{
            if(!m || typeof m !== "object" || Array.isArray(m)) throw new Error("bad move");
            let mChanged = false;
            ["items","vendors","donations","activity","rooms"].forEach(k => {
              if(!Array.isArray(m[k])){ m[k] = []; mChanged = true; }
            });
            const fi = m.items.filter(it => it && typeof it === "object" && !Array.isArray(it));
            if(fi.length !== m.items.length){ m.items = fi; mChanged = true; }
            const fr = m.rooms.filter(r => typeof r === "string");
            if(fr.length !== m.rooms.length){ m.rooms = fr; mChanged = true; }
            if(m.floorNotes == null || typeof m.floorNotes !== "object" || Array.isArray(m.floorNotes)){ m.floorNotes = {}; mChanged = true; }
            m.items.forEach(it => {
              if(it.photo && !safePhoto(it.photo)){ it.photo = null; mChanged = true; }
            });
            const before = JSON.stringify(m.checklist);
            ensureMoveFields(m);
            if(JSON.stringify(m.checklist) !== before) mChanged = true;
            if(mChanged) changed = true;
            kept.push(m);
          }catch(e){
            try{ localStorage.setItem(CORRUPT_PREFIX + "move-" + new Date().toISOString().replace(/[:.]/g, "-"), JSON.stringify(m)); }catch(_){}
            changed = true;
          }
        });
        s.moves = kept;
        if(!s.sampleMigrated){
          s.moves.forEach(m => { if(m.clientName === "Eleanor Vance" || m.clientName === "The Alvarez Estate") m.sample = true; });
          s.sampleMigrated = true; changed = true;
        }
        if(changed) save(s);
        return s;
      }
      corruptRaw = raw; // valid JSON, but not NextChapter state
    }
  }catch(e){
    try{ corruptRaw = localStorage.getItem(KEY); }catch(_){}
  }
  if(corruptRaw != null){
    // P1-1 fix: unreadable saved data is NEVER overwritten. Quarantine the
    // bad blob under a backup key, seed fresh state in memory only, and
    // show an honest recovery screen. KEY is not written until the user
    // explicitly chooses "Start fresh".
    try{
      // Wave F P2-1: one backup per corrupt blob, not one per boot. Skip the
      // write when an identical backup already exists on this device.
      const dup = corruptKeys().some(k => { try{ return localStorage.getItem(k) === corruptRaw; }catch(_){ return false; } });
      if(!dup){
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        localStorage.setItem(CORRUPT_PREFIX + stamp, corruptRaw);
      }
    }catch(_){}
    window.__ncRecovery = true;
    return seed();
  }
  const s = seed();
  save(s);
  return s;
}
function save(s){
  if(window.__ncRecovery) return; // recovery screen is up; KEY holds quarantined data, do not touch it
  try{ localStorage.setItem(KEY, JSON.stringify(s||state)); }catch(e){ toast("Storage is full. Photos were kept small, but please export soon."); } try{ if(window.__nextchapterSync) window.__nextchapterSync.onSave(); }catch(e){} }
let state = load();

function seed(){
  const m1 = uid(), m2 = uid();
  const item = (room,name,disp,notes,photoSeed) => ({
    id: uid(), room, name, disposition: disp, notes: notes||"",
    photo: null, photoSeed: photoSeed||null,
    destRoom: "", familyStatus: disp==="ask" ? "pending" : "approved",
    comments: [], createdAt: Date.now() - 86400000*2
  });
  const moves = [
    {
      id: m1, sample: true, clientName: "Eleanor Vance", moveType: "Downsizing move",
      fromAddr: "1428 Waverly Ct, Pasadena, CA", toAddr: "Sunrise Gardens, Unit 214, Pasadena, CA",
      targetDate: "2026-11-15", familyContact: "Maya (daughter)",
      rooms: ["Living room","Kitchen","Primary bedroom","Garage","Dining room"],
      items: [
        item("Living room","Oak bookshelf","keep","Sturdy, fits the new apartment wall.","shelf"),
        item("Living room","Blue armchair","ask","Mom loves it, but will it fit?","chair"),
        item("Dining room","China set (12 place)","donate","Chipped gravy boat; rest is fine.","china"),
        item("Primary bedroom","Quilt from Grandma Rose","keep","Hand-stitched, 1962. Non-negotiable.","quilt"),
        item("Garage","Tool chest","sell","Craftsman, good condition.","tools"),
        item("Kitchen","Stand mixer","ask","Only used twice a year?","mixer"),
        item("Garage","Old paint cans","discard","Take to hazardous waste drop-off.","paint")
      ],
      vendors: [
        {id: uid(), kind:"Movers", name:"Gentle Giant Moving", phone:"(626) 555-0142", status:"done", date:"2026-11-15", notes:"Booked for 9am, 3 crew."},
        {id: uid(), kind:"Estate sale company", name:"Pasadena Estate Sales", phone:"(626) 555-8890", status:"progress", date:"", notes:"Walkthrough scheduled Thursday."},
        {id: uid(), kind:"Donation pickup", name:"Habitat ReStore", phone:"(626) 555-2210", status:"todo", date:"", notes:""}
      ],
      activity: [
        {ts: Date.now()-86400000, text:"Maya commented on “Blue armchair”."},
        {ts: Date.now()-86400000*2, text:"7 items inventoried in the Living room, Kitchen and Garage."}
      ],
      floorNotes: {"Living room":"Bookshelf against the east wall. Blue armchair by the window if it fits.","Primary bedroom":"Quilt stays on the bed. Nightstand from the old room."},
      donations: [
        {id: uid(), org:"Habitat ReStore", date:"2026-10-02", itemIds:[], value:240, receipt:false, note:"3 bags of linens + small appliances"}
      ],
      createdAt: Date.now() - 86400000*9
    },
    {
      id: m2, sample: true, clientName: "The Alvarez Estate", moveType: "Estate cleanout",
      fromAddr: "77 Birch Lane, Altadena, CA", toAddr: "", targetDate: "2026-12-01", familyContact: "Daniel (executor)",
      rooms: ["Living room","Kitchen","Garage"],
      items: [
        item("Living room","Mid-century credenza","sell","Appraiser coming Friday.","credenza"),
        item("Garage","Lawn equipment","donate","","mower")
      ],
      vendors: [{id: uid(), kind:"Cleaners", name:"Fresh Start Cleaners", phone:"(626) 555-7731", status:"todo", date:"", notes:"Final clean after clear-out."}],
      activity: [{ts: Date.now()-86400000*3, text:"Estate cleanout started."}],
      floorNotes: {},
      donations: [],
      createdAt: Date.now() - 86400000*3
    }
  ];
  // a family comment on the demo move so the portal feels alive
  moves[0].items[1].comments.push({id: uid(), by:"Maya", text:"I measured, it fits! Keep it by the window.", ts: Date.now()-86400000});
  // sample bid + sale + fit-check data so the new pass-3 views have something real to show
  const vance = moves[0];
  vance.vendors[0].quote = "1850"; vance.vendors[0].deposit = "200"; vance.vendors[0].availDate = "2026-11-15";
  vance.vendors[0].quoteNote = "3 crew, truck, blankets included."; vance.vendors[0].awarded = true;
  vance.vendors.push({id: uid(), kind:"Movers", name:"Bright Move Co.", phone:"(626) 555-3310", status:"todo", date:"",
    notes:"", quote:"2100", deposit:"250", availDate:"2026-11-14", quoteNote:"2 crew. Packing materials extra.", awarded:false});
  const chest = vance.items.find(i => i.name === "Tool chest");
  if(chest){ chest.estValue = "300"; chest.soldPrice = "275"; chest.soldTo = "Estate sale buyer"; chest.soldDate = "2026-10-04"; }
  const armchair = vance.items.find(i => i.name === "Blue armchair");
  if(armchair){ armchair.dims = {l:30, w:32}; }
  vance.roomDims = {"Living room": {l:12, w:14}, "Primary bedroom": {l:11, w:13}};
  vance.saleFeePct = 20;
  vance.checklist = genChecklist(vance.moveType);
  const alvarez = moves[1];
  alvarez.checklist = genChecklist(alvarez.moveType);
  alvarez.saleFeePct = 20;
  ensureMoveFields(vance); ensureMoveFields(alvarez);
  return { moves, sampleMigrated: true, seededAt: Date.now() };
}

function getMove(id){ return state.moves.find(m => m.id === id); }
function logAct(move, text){
  move.activity = move.activity || [];
  move.activity.unshift({ts: Date.now(), text});
  move.activity = move.activity.slice(0, 30);
}
function decidedCount(move){
  return move.items.filter(it => it.disposition !== "ask" || it.familyStatus !== "pending").length;
}
function pendingFamily(move){
  return move.items.filter(it => it.disposition === "ask" && it.familyStatus === "pending").length;
}

function todayISO(){
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function daysLeft(move){
  if(!move.targetDate) return null;
  const target = new Date(move.targetDate+"T00:00:00"), today = new Date();
  if(isNaN(target)) return null;
  // Compare local calendar days without daylight-saving offsets.
  return Math.round((Date.UTC(target.getFullYear(),target.getMonth(),target.getDate()) -
    Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())) / 86400000);
}
function countdown(move){
  const n = daysLeft(move);
  if(n === null) return "";
  const text = n < 0 ? "Overdue by "+Math.abs(n)+" days" : n === 0 ? "Target date is today" : n+" day"+(n===1?"":"s")+" left";
  return '<span class="pill countdown'+(n<0?' overdue':'')+'">'+esc(text)+'</span>';
}
function formatMB(bytes){ return bytes < 1048576 ? (bytes/1024).toFixed(1)+" KB" : (bytes/1048576).toFixed(1)+" MB"; }
function storageText(){
  const bytes = new Blob([JSON.stringify(state)]).size;
  const photos = state.moves.reduce((sum,m) => sum + m.items.reduce((n,it) =>
    n + (typeof it.photo === "string" && it.photo.startsWith("data:image/") ? it.photo.length*.75 : 0), 0), 0);
  return "On this device: about "+formatMB(bytes)+" of move data (photos about "+formatMB(photos)+"). Browser storage is limited, so export a backup.";
}
function downloadFile(contents, type, filename){
  const url = URL.createObjectURL(new Blob([contents], {type}));
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function normalizeBackup(parsed){
  const object = x => x && typeof x === "object" && !Array.isArray(x);
  if(!object(parsed) || !Array.isArray(parsed.moves) || !parsed.moves.every(m =>
    object(m) && typeof m.id === "string" && typeof m.clientName === "string" && Array.isArray(m.items))) throw new Error("Invalid backup");
  parsed.moves.forEach(m => {
    ["items","vendors","donations","activity","rooms"].forEach(k => { if(!Array.isArray(m[k])) m[k] = []; });
    if(!object(m.floorNotes)) m.floorNotes = {};
    ["moveType","fromAddr","toAddr","targetDate","familyContact"].forEach(k => { if(typeof m[k] !== "string") m[k] = ""; });
    if(!m.items.every(object) || !m.vendors.every(object) || !m.donations.every(object) || !m.activity.every(object)) throw new Error("Invalid records");
    m.rooms = m.rooms.filter(r => typeof r === "string");
    m.items.forEach(it => {
      if(typeof it.id !== "string") it.id = uid();
      ["name","room","notes","destRoom"].forEach(k => { if(typeof it[k] !== "string") it[k] = ""; });
      it.photo = safePhoto(it.photo);
      if(!Object.hasOwn(DISP,it.disposition)) it.disposition = "ask";
      if(!Object.hasOwn(FAM,it.familyStatus)) it.familyStatus = it.disposition === "ask" ? "pending" : "approved";
      it.comments = Array.isArray(it.comments) ? it.comments.filter(object) : [];
    });
    m.vendors.forEach(v => { if(typeof v.phone !== "string") v.phone = ""; });
    m.donations.forEach(d => { if(!Array.isArray(d.itemIds)) d.itemIds = []; });
    if(!parsed.sampleMigrated && (m.clientName === "Eleanor Vance" || m.clientName === "The Alvarez Estate")) m.sample = true;
    ensureMoveFields(m);
  });
  parsed.sampleMigrated = true;
  return parsed;
}
async function importBackup(input){
  const file = input.files && input.files[0];
  if(!file) return;
  try{
    const parsed = normalizeBackup(JSON.parse(await file.text()));
    if(confirm("Replace everything on this device with this backup?")){
      state = parsed; save(); route(); toast("Backup restored.");
    }
  }catch(e){ toast("That file did not look like a NextChapter backup. Nothing was changed."); }
  finally{ input.value = ""; }
}

/* ---------- toast ---------- */
function toast(msg){
  const root = $("#toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = icon("check","ic-sm") + "<span>" + esc(msg) + "</span>";
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(()=>el.remove(), 320); }, 2600);
}

/* ---------- bottom sheet ---------- */
/* Drafts survive any non-committed close (navigation, Escape, X): typed
 * text is user data and interruptions are common. Explicit saves clear the
 * draft. Photos cannot be restored programmatically, so the restore toast
 * says so honestly. */
let sheetDrafts = {};
let sheetCloseTimer = null;
function captureSheetDraft(sheet){
  const vals = {};
  sheet.querySelectorAll("input, select, textarea").forEach(el => {
    if(!el.id || el.type === "file" || el.disabled) return;
    if(el.type === "checkbox" || el.type === "radio") vals[el.id] = {checked: el.checked};
    else vals[el.id] = {value: el.value};
  });
  // Wave F P1-3: drafts are keyed by sheet + field id. A half-typed item
  // never pre-fills a different form that happens to share an id, and a
  // sheet with nothing typed never wipes another sheet's draft.
  const key = sheet.getAttribute("data-sheet") || "";
  const hasContent = Object.keys(vals).some(id => {
    const d = vals[id];
    return d.checked === true || (typeof d.value === "string" && d.value.trim() !== "");
  });
  if(hasContent) sheetDrafts[key] = {vals: vals, ts: Date.now()};
}
function restoreSheetDraft(root, title){
  const draft = sheetDrafts[title || ""];
  if(!draft) return 0;
  let restored = 0;
  root.querySelectorAll("input, select, textarea").forEach(el => {
    if(!el.id || el.type === "file" || !draft.vals[el.id]) return;
    const d = draft.vals[el.id];
    if(el.type === "checkbox" || el.type === "radio"){
      if(el.checked !== d.checked){ el.checked = d.checked; restored++; }
    } else if(el.value !== d.value){ el.value = d.value; restored++; }
  });
  delete sheetDrafts[title || ""];
  return restored;
}
function openSheet(title, sub, bodyHTML, footHTML){
  if(sheetCloseTimer){ clearTimeout(sheetCloseTimer); sheetCloseTimer = null; }
  const root = $("#sheet-root");
  root.innerHTML =
    '<div class="sheet-scrim" data-action="close-sheet"></div>' +
    '<div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">' +
      '<div class="sheet-grab"></div>' +
      '<div class="row-between"><h2>'+esc(title)+'</h2>' +
      '<button class="btn btn-ghost btn-sm" data-action="close-sheet" aria-label="Close">'+icon("x","ic-sm")+'</button></div>' +
      (sub ? '<p class="sub">'+esc(sub)+'</p>' : '') +
      '<div class="sheet-body">'+bodyHTML+'</div>' +
      (footHTML ? '<div style="margin-top:16px">'+footHTML+'</div>' : '') +
    '</div>';
  const sheetEl = $(".sheet", root);
  // Wave F P1-3: tag the sheet with its title so closeSheet captures the
  // draft under the sheet it came from.
  if(sheetEl) sheetEl.setAttribute("data-sheet", title);
  const n = restoreSheetDraft(root, title);
  if(n) setTimeout(() => toast("Draft restored. Photos are not kept."), 400);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $(".sheet-scrim", root).classList.add("open");
    $(".sheet", root).classList.add("open");
    const f = $(".sheet input, .sheet select, .sheet textarea", root);
    if(f) f.focus({preventScroll:true});
  }));
}
function closeSheet(committed){
  const root = $("#sheet-root");
  const scrim = $(".sheet-scrim", root), sheet = $(".sheet", root);
  if(!sheet || sheetCloseTimer) return; // already closing: never double-capture
  if(committed) delete sheetDrafts[sheet.getAttribute("data-sheet") || ""];
  else captureSheetDraft(sheet);
  scrim.classList.remove("open"); sheet.classList.remove("open");
  sheetCloseTimer = setTimeout(() => { root.innerHTML = ""; sheetCloseTimer = null; }, 300);
}

/* ---------- photo handling ---------- */
let pendingPhoto = null; // dataURL staged in the add-item sheet
function handlePhotoInput(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const img = new Image();
  img.onload = () => {
    const max = 900;
    let w = img.width, h = img.height;
    if(w > max || h > max){ const r = Math.min(max/w, max/h); w = Math.round(w*r); h = Math.round(h*r); }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    pendingPhoto = c.toDataURL("image/jpeg", 0.72);
    URL.revokeObjectURL(img.src);
    const wrap = $("#photo-pick");
    if(wrap){ wrap.classList.add("has-photo"); wrap.innerHTML = '<img src="'+pendingPhoto+'" alt="Item photo preview"><span class="rephoto btn btn-ghost btn-sm">'+icon("camera","ic-sm")+' Retake</span>'; }
  };
  img.src = URL.createObjectURL(file);
}
/* Illustrated placeholder for seeded demo items (no third-party images) */
function placeholderSVG(seedStr, label){
  const hues = {shelf:36, chair:210, china:200, quilt:280, tools:20, mixer:150, paint:0, credenza:30, mower:100};
  const h = hues[seedStr] != null ? hues[seedStr] : 90;
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='450'>" +
    "<rect width='600' height='450' fill='hsl("+h+",32%,88%)'/>" +
    "<circle cx='300' cy='190' r='70' fill='hsl("+h+",30%,74%)'/>" +
    "<rect x='180' y='300' width='240' height='16' rx='8' fill='hsl("+h+",25%,60%)'/>" +
    "<text x='300' y='392' font-family='sans-serif' font-size='30' text-anchor='middle' fill='hsl("+h+",20%,42%)'>"+esc(label)+"</text></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
function safePhoto(url){ return (typeof url === "string" && /^(data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]|blob:)/.test(url)) ? url : null; }
function itemPhoto(it){
  return safePhoto(it.photo) || (it.photoSeed ? placeholderSVG(it.photoSeed, it.name) : null);
}

/* ---------- views ---------- */
const view = $("#view"), tabbar = $("#tabbar"), topbarActions = $("#topbar-actions");
let digestShowSample = false;
let summaryShowSample = false;
let printReceiptId = null;

function recordButtons(move, it){
  const attrs = ' data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'"';
  return '<div class="fam-actions no-print"><button class="btn btn-sm" data-action="fam-record-approve"'+attrs+'>Record: approved</button>' +
    '<button class="btn btn-soft btn-sm" data-action="fam-record-suggest"'+attrs+'>Record suggestion</button></div>';
}
function digestSections(move, interactive){
  const hidden = move.sample && !digestShowSample;
  const items = hidden ? [] : move.items;
  const needs = items.filter(i => i.disposition === "ask" && i.familyStatus === "pending");
  const decided = items.filter(i => !(i.disposition === "ask" && i.familyStatus === "pending"));
  const hiddenText = '<p class="card">Sample data is hidden in this file.'+(interactive?' Turn the toggle on to preview it.':'')+'</p>';
  const needsHTML = needs.map(it => {
    const photo = safePhoto(itemPhoto(it));
    return '<article class="card digest-card">'+(photo?'<img class="digest-photo" src="'+esc(photo)+'" alt="'+esc(it.name)+'">':'') +
      '<h3>'+esc(it.name)+'</h3><p class="muted">'+esc(it.room)+'</p>' +
      (it.notes?'<p>'+esc(it.notes)+'</p>':'') +
      (interactive?recordButtons(move,it):'') + '<span class="digest-check print-only" aria-label="Decision checkbox"></span></article>';
  }).join("");
  const decidedHTML = decided.map(it => {
    const photo = safePhoto(itemPhoto(it));
    const disp = DISP[it.disposition] || DISP.ask, fam = FAM[it.familyStatus] || FAM.pending;
    // Wave F P1-4: comments may be any truthy non-array in damaged local
    // state. Only arrays of objects are reduced; everything else counts as
    // no comments instead of crashing the whole digest view.
    const commentList = Array.isArray(it.comments) ? it.comments.filter(c => c && typeof c === "object") : [];
    const comment = commentList.reduce((latest,c) => !latest || (Number(c.ts)||0) >= (Number(latest.ts)||0) ? c : latest, null);
    return '<article class="card digest-card">'+(photo?'<img class="digest-photo" src="'+esc(photo)+'" alt="'+esc(it.name)+'">':'') +
      '<h3>'+esc(it.name)+'</h3><div class="digest-pills"><span class="disp '+disp.cls+'">'+esc(disp.label)+'</span> '+
      '<span class="disp '+fam.cls+'">'+esc(fam.label)+'</span></div>' +
      (comment?'<p><strong>'+esc(comment.by)+':</strong> '+esc(comment.text)+'</p>':'')+'</article>';
  }).join("");
  const donations = (hidden?[]:move.donations).map(d => '<div class="card digest-donation"><h3>'+esc(d.org)+'</h3><p>'+esc(fmtDate(d.date))+'</p><p>Estimated value: '+esc(money(d.value))+'</p></div>').join("");
  return '<section class="digest-section"><h2>Needs a decision ('+needs.length+')</h2>'+(hidden?hiddenText:needsHTML || '<p class="card">Nothing needs a decision right now.</p>')+'</section>' +
    '<section class="digest-section"><h2>Already decided ('+decided.length+')</h2>'+(hidden?hiddenText:decidedHTML || '<p class="card">None yet.</p>')+'</section>' +
    '<section class="digest-section"><h2>Donations so far</h2>'+(hidden?hiddenText:donations || '<p class="card">None yet.</p>') +
    '<p class="muted">Donation values are the organizer\'s estimates, not appraisals.</p></section>';
}
function digestBody(move, interactive){
  return '<div class="digest"><header class="card digest-header"><p class="digest-kicker">Family update</p><h2>'+esc(move.clientName)+'</h2>' +
    '<p>Prepared '+esc(fmtDate(todayISO()))+' by the move team.</p>' +
    (interactive?'<div class="digest-buttons no-print"><button class="btn btn-sm" data-action="print-digest">'+icon("print","ic-sm")+' Print digest</button>' +
      '<button class="btn btn-soft btn-sm" data-action="download-digest" data-id="'+esc(move.id)+'">'+icon("download","ic-sm")+' Download file</button>' +
      '<button class="btn btn-ghost btn-sm" data-action="share-update" data-id="'+esc(move.id)+'">'+icon("share","ic-sm")+' Send family update</button></div>':'')+'</header>' +
    (move.sample?'<div class="card digest-sample"><p><strong>Sample move, for demonstration only.</strong></p>' +
      (interactive?'<button class="btn btn-ghost btn-sm no-print" aria-pressed="'+digestShowSample+'" data-action="digest-toggle-sample" data-id="'+esc(move.id)+'">Include sample data</button>':'')+'</div>':'') +
    digestSections(move,interactive)+'<p class="digest-closing">Nothing is final until the family agrees.</p></div>';
}
function vDigest(move){
  digestShowSample = false;
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), null);
  topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm" data-action="share-update" data-id="'+esc(move.id)+'">'+icon("share","ic-sm")+' Send family update</button>';
  view.innerHTML = digestBody(move,true);
}
function buildDigestHTML(move){
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<title>Family update: '+esc(move.clientName)+'</title><style>'+ 
    'body{margin:0;background:#f6f1e7;color:#3b372d;font:16px/1.5 system-ui,sans-serif;padding:20px}'+
    '.digest{max-width:720px;margin:auto;overflow-wrap:anywhere}.card{background:#fffdf8;border:1px solid #e6ddc9;border-radius:16px;padding:18px;margin:12px 0;break-inside:avoid}'+
    'h2,h3{margin:0 0 8px}p{margin:8px 0}.digest-section{margin-top:26px}.digest-kicker{color:#4c5a47;text-transform:uppercase;letter-spacing:.1em;font-size:13px}'+
    '.muted{color:#6e675a}.disp{display:inline-block;border-radius:20px;padding:4px 12px;background:#e7ede1;font-size:14px}.fam-pending{background:#f6ead2}'+
    '.digest-photo{max-width:100%;width:240px;max-height:200px;object-fit:contain;border-radius:10px}.digest-closing{text-align:center;margin:28px 0}.print-only{display:none}'+
    '@media print{body{background:white;padding:0}.card{break-inside:avoid}.print-only{display:block}.digest-check{height:28px;width:28px;border:2px solid #6e675a;margin-top:12px}}'+
    '</style></head><body>'+digestBody(move,false)+'</body></html>';
}
function shareText(move){
  const needs = move.items.filter(i => i.disposition === "ask" && i.familyStatus === "pending");
  const names = needs.slice(0,3).map(it => it.name).join(", ")+(needs.length>3?" and "+(needs.length-3)+" more":"");
  return "Hi! Here is the latest on "+move.clientName+"'s move: "+(needs.length ?
    needs.length+" decision"+(needs.length===1?"":"s")+" waiting ("+names+"). I'll send the family digest file right after this message. It opens on any phone. Nothing is final until the family agrees." :
    "all family decisions are settled. I'll send the family digest file right after this message. It opens on any phone.");
}
function sheetShare(move){
  const text = shareText(move), encoded = encodeURIComponent(text), attrs = ' data-id="'+esc(move.id)+'"';
  openSheet("Send family update", "One message, everything the family needs to know.",
    '<div class="share-preview" role="note">'+esc(text)+'</div>' +
    '<p class="muted small">Download the digest, then attach it to your message.</p>' +
    '<a class="btn btn-ghost share-row" href="'+esc('sms:?&body='+encoded)+'">'+icon("chat")+' Text message</a>' +
    '<a class="btn btn-ghost share-row" href="'+esc('https://wa.me/?text='+encoded)+'" target="_blank" rel="noopener">'+icon("chat")+' WhatsApp</a>' +
    '<a class="btn btn-ghost share-row" href="'+esc('mailto:?subject='+encodeURIComponent('Family update: '+move.clientName)+'&body='+encoded)+'">'+icon("mail")+' Email</a>' +
    '<button class="btn btn-ghost share-row" data-action="copy-share"'+attrs+'>'+icon("copy")+' Copy message</button>' +
    '<button class="btn share-row" data-action="download-digest"'+attrs+'>'+icon("download")+' Download digest file</button>',
    '<p class="muted small">Family links open on this device only, in this build. Send the family digest instead.</p>' +
    '<button class="btn btn-ghost btn-block" data-action="copy-family-link"'+attrs+'>Copy family link</button>');
}
function recordAnswer(el, approved){
  const m = getMove(el.getAttribute("data-id"));
  const it = m && m.items.find(i => i.id === el.getAttribute("data-item"));
  if(!it) return;
  const input = document.getElementById("rec-note-"+it.id), note = input ? input.value.trim() : "";
  it.familyStatus = approved ? "approved" : "changed";
  logAct(m,(approved?'Recorded approval for “':'Recorded a suggestion for “')+it.name+'”'+(note?' ('+note+')':'')+'.');
  if(note){
    it.comments = it.comments || [];
    it.comments.push({id:uid(), by:"Move team", text:note, ts:Date.now()});
  }
  save(); route(false); toast("Recorded."); coachDone();
}

function setTabs(tabs, active){
  if(!tabs){ tabbar.classList.remove("show"); tabbar.innerHTML = ""; return; }
  tabbar.classList.add("show");
  tabbar.innerHTML = '<div class="tabbar-inner">' + tabs.map(t =>
    '<a class="tab" href="'+esc(t.href)+'" '+(t.key===active?'aria-current="page"':'')+'>'+icon(t.icon)+'<span>'+esc(t.label)+'</span></a>'
  ).join("") + "</div>";
}
function moveTabs(move, active){
  return [
    {key:"inventory", label:"Inventory", icon:"box", href:"#/move/"+move.id+"/inventory"},
    {key:"vendors", label:"Vendors", icon:"truck", href:"#/move/"+move.id+"/vendors"},
    {key:"plan", label:"New home", icon:"plan", href:"#/move/"+move.id+"/plan"},
    {key:"giving", label:"Giving", icon:"gift", href:"#/move/"+move.id+"/giving"},
    {key:"family", label:"Family", icon:"family", href:"#/family/"+move.id}
  ];
}

/* ----- dashboard ----- */
function vDashboard(){
  document.body.classList.remove("family-mode");
  setTabs(null); topbarActions.innerHTML = "";
  const showArchived = location.hash.indexOf("archived") > -1;
  const moves = state.moves.filter(m => showArchived ? m.archived : !m.archived);
  const archivedCount = state.moves.filter(m => m.archived).length;
  const nudges = state.moves.filter(m => !m.archived).flatMap(m => m.vendors
    .filter(v => v.status === "todo" || (v.date && v.date < todayISO() && v.status !== "done"))
    .map(v => ({move:m, vendor:v})));
  const nudgeHTML = nudges.length ? '<div class="card nudge no-print"><h3>Needs attention</h3>' +
    nudges.slice(0,5).map(({move:m,vendor:v}) => '<a class="list-row" href="#/move/'+esc(m.id)+'/vendors"><span class="grow">'+esc(v.name)+' ('+esc(v.kind)+') · '+esc(m.clientName)+'</span><span class="chev">'+icon("back")+'</span></a>').join("") +
    (nudges.length>5?'<p class="muted small">+'+(nudges.length-5)+' more</p>':'')+'</div>' : '';
  const todayList = [];
  state.moves.filter(m => !m.archived).forEach(m => (m.checklist || []).forEach(t => {
    if(t.done) return; const d = taskDueISO(m, t); if(d && d <= todayISO()) todayList.push({move:m, task:t, due:d});
  }));
  const todayHTML = todayList.length ? '<div class="card nudge no-print"><h3>Today</h3>' +
    todayList.slice(0,5).map(({move:m,task:t,due}) => '<a class="list-row" href="#/move/'+esc(m.id)+'/checklist"><span class="grow">'+esc(t.text)+'<div class="sub">'+esc(m.clientName)+' · '+(due < todayISO() ? 'Overdue' : 'Due today')+'</div></span><span class="chev">'+icon("back")+'</span></a>').join("") +
    (todayList.length>5?'<p class="muted small">+'+(todayList.length-5)+' more</p>':'')+'</div>' : '';
  let coach = "";
  try{
    if(!localStorage.getItem("nc_coach") && moves.some(m => m.sample)){
      coach = '<div class="card coach-card"><h3>Two sample moves are loaded</h3>' +
        '<ol><li>Open <b>Eleanor Vance</b> and tap <b>Send family update</b> to prepare a digest for the family.</li>' +
        '<li>In the family view, tap <b>Looks good</b> on a decision and watch the progress fill.</li>' +
        '<li>Back in the move, open <b>Inventory</b> and try the <b>+</b> button to add an item.</li></ol>' +
        '<button class="btn btn-sm" data-action="coach-ok">Got it</button></div>';
    }
  }catch(e){}
  const cards = moves.map(m => {
    const total = m.items.length, done = decidedCount(m), pend = pendingFamily(m);
    const pct = total ? Math.round(done/total*100) : 0;
    return '<a class="card move-card" href="#/move/'+esc(m.id)+'">' +
      '<div class="row-between"><h3>'+esc(m.clientName)+(m.sample?' <span class="pill sample-pill">Sample</span>':'')+'</h3>' +
      '<span class="pill" style="background:var(--sage-soft);color:var(--sage-deep)">'+esc(m.moveType)+'</span></div>' +
      '<div class="move-meta">' + countdown(m) +
        (m.targetDate ? '<span>'+icon("cal","ic-sm")+esc(fmtDate(m.targetDate))+'</span>' : '') +
        '<span>'+icon("box","ic-sm")+total+' items</span>' +
        (pend ? '<span>'+icon("family","ic-sm")+pend+' need family</span>' : '<span>'+icon("check","ic-sm")+'all decided</span>') +
      '</div>' +
      '<div class="progress"><i style="width:'+pct+'%"></i></div>' +
      '<div class="progress-label">'+done+' of '+total+' items decided</div>' +
    '</a>';
  }).join("");
  view.innerHTML =
    '<div class="hero card"><div class="hero-art">'+icon("leaf")+'</div>' +
    '<h1>Every move, handled with care.</h1>' +
    '<p>Inventory each room, align the family, coordinate vendors, and document donations. All in one calm place.</p>' +
    '<button class="btn" data-action="new-move">'+icon("plus","ic-sm")+' Start a new move</button></div>' +
    '<div class="section-title">'+(showArchived?"Archived moves":"Active moves")+'</div>' +
    coach + todayHTML + nudgeHTML +
    (cards || '<div class="card empty">'+icon("home")+'<p>'+(showArchived?"No archived moves.":"No moves yet. Start your first above.")+'</p></div>') +
    (archivedCount && !showArchived ? '<div style="text-align:center;margin-top:8px"><a class="btn btn-ghost btn-sm" href="#/archived">View archived ('+archivedCount+')</a></div>' : "") +
    (showArchived ? '<div style="text-align:center;margin-top:8px"><a class="btn btn-ghost btn-sm" href="#/">Back to active</a></div>' : "") +
    (state.moves.some(m => m.sample) ? '<div class="sample-controls no-print"><button class="btn btn-ghost btn-sm" data-action="clear-samples">Clear sample moves</button></div>' : '') +
    '<div class="card backup-card no-print"><h3>Backup</h3><p class="muted small" id="storage-line">'+esc(storageText())+'</p><div class="backup-buttons">' +
    '<button class="btn btn-soft" data-action="export-data">'+icon("download","ic-sm")+' Export backup</button>' +
    '<button class="btn btn-ghost" data-action="import-data">Import backup</button></div><input type="file" id="import-file" accept="application/json,.json" hidden></div>' +
    '<div id="syncAnchor"></div>' +
    '<div id="billAnchor" class="no-print"></div>' +
    '<footer class="app-foot no-print">Your data lives on this device, backed up to the sync prototype. <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></footer>';
  if (window.__nextchapterSyncUI){ try{ window.__nextchapterSyncUI(); }catch(e){} }
}

/* ----- move hub ----- */
function summaryPrintHTML(move){
  if(move.sample && !summaryShowSample)
    return '<p><strong>Sample data is hidden in this summary.</strong></p><p>Turn on "Include sample data" to show it before printing.</p>';
  return (move.sample?'<p><strong>Sample move, for demonstration only. Not real client data.</strong></p>':'')+'<h2>Move summary: '+esc(move.clientName)+'</h2>' +
    '<div class="kv"><span class="k">Move type</span><span class="v">'+esc(move.moveType)+'</span></div>' +
    (move.targetDate?'<div class="kv"><span class="k">Target date</span><span class="v">'+esc(fmtDate(move.targetDate))+'</span></div>':'') +
    '<h3>Inventory by disposition</h3>' +
    Object.keys(DISP).map(k => {
      const list = move.items.filter(i=>i.disposition===k);
      return '<h4>'+esc(DISP[k].label)+' ('+list.length+')</h4>' +
        (list.length ? '<p>'+list.map(i=>esc(i.name)+' <span class="faint">('+esc(i.room)+')</span>').join('<br>')+'</p>' : '<p class="faint">None yet</p>');
    }).join("") +
    '<h3>Vendors</h3>' +
    (move.vendors.length ? move.vendors.map(v=>'<div class="kv"><span class="k">'+esc(v.name)+' ('+esc(v.kind)+')'+(v.awarded?' \u00b7 awarded':'')+'</span><span class="v">'+esc((VENDOR_STATUS[v.status]||{}).label||"")+(v.quote !== "" ? ' · '+esc(money(v.quote)) : '')+'</span></div>').join("") : '<p class="faint">None yet</p>') +
    '<h3>Estate sale</h3>' +
    (function(){ const t = saleTotals(move); return '<div class="kv"><span class="k">Items for sale</span><span class="v">'+t.count+' ('+t.soldCount+' sold)</span></div>' +
      '<div class="kv"><span class="k">Estimated value</span><span class="v">'+esc(money(t.est))+'</span></div>' +
      '<div class="kv"><span class="k">Net to the family</span><span class="v">'+esc(money(Math.round(t.net)))+'</span></div>'; })() +
    '<h3>Move checklist</h3>' +
    (function(){ const c = checklistTotals(move); return '<div class="kv"><span class="k">Tasks complete</span><span class="v">'+c.done+' of '+c.total+'</span></div>'; })() +
    '<h3>Donations</h3>' +
    (move.donations.length ? move.donations.map(d=>'<div class="kv"><span class="k">'+esc(d.org)+' · '+esc(fmtDate(d.date))+'</span><span class="v">'+money(d.value)+'</span></div>').join("") : '<p class="faint">None yet</p>') +
    '<p class="small faint">Prepared '+new Date().toLocaleDateString()+' by the move team.</p>';
}
function vMoveHub(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), null);
  topbarActions.innerHTML =
    '<button class="btn btn-ghost btn-sm" data-action="share-update" data-id="'+esc(move.id)+'">'+icon("share","ic-sm")+' Send family update</button>';
  const total = move.items.length, done = decidedCount(move), pend = pendingFamily(move);
  const pct = total ? Math.round(done/total*100) : 0;
  const byDisp = {};
  Object.keys(DISP).forEach(k => byDisp[k] = 0);
  move.items.forEach(it => byDisp[it.disposition]++);
  const st = saleTotals(move), ct = checklistTotals(move);
  const saleSub = st.count ? st.count+" for sale"+(st.soldCount ? " · "+money(Math.round(st.net))+" net so far" : "") : "tag items “Sell” to track proceeds";
  const taskSub = ct.total ? ct.done+" of "+ct.total+" done" : "no tasks";
  view.innerHTML =
    '<a href="#/" class="btn btn-ghost btn-sm no-print" style="margin-bottom:12px">'+icon("back","ic-sm")+' All moves</a>' +
    '<div class="card"><div class="row-between"><div><h2 style="margin:0 0 4px">'+esc(move.clientName)+(move.sample?' <span class="pill sample-pill">Sample</span>':'')+'</h2>' +
    '<div class="muted small">'+esc(move.moveType)+'</div></div>' +
    '<button class="btn btn-soft btn-sm" data-action="edit-move" data-id="'+esc(move.id)+'">'+icon("edit","ic-sm")+' Edit</button></div>' +
    '<div class="move-meta" style="margin-top:10px">' +
      (move.fromAddr?'<span>'+icon("pin","ic-sm")+esc(move.fromAddr)+'</span>':'') +
      (move.targetDate?'<span>'+icon("cal","ic-sm")+esc(fmtDate(move.targetDate))+'</span>':'') +
      (move.familyContact?'<span>'+icon("family","ic-sm")+esc(move.familyContact)+'</span>':'') +
    '</div>' +
    '<div class="progress"><i style="width:'+pct+'%"></i></div>' +
    '<div class="progress-label">'+done+' of '+total+' items decided'+(pend?' · '+pend+' awaiting family':'')+'</div></div>' +
    '<div class="section-title">Disposition so far</div>' +
    '<div class="card"><div class="seg" style="pointer-events:none">' +
      Object.keys(DISP).map(k => '<span class="disp '+DISP[k].cls+'">'+esc(DISP[k].label)+': '+byDisp[k]+'</span>').join("") +
    '</div></div>' +
    ((move.activity && move.activity.length) ?
      '<div class="section-title">Recent activity</div><div class="card" style="padding:6px 16px">' +
      move.activity.slice(0,5).map(a => '<div class="list-row"><span class="grow"><h4 style="font-weight:500;font-size:15px">'+esc(a.text)+'</h4><div class="sub">'+timeAgo(a.ts)+'</div></span></div>').join("") + '</div>'
      : "") +
    '<div class="section-title">Shortcuts</div>' +
    '<div class="card card-flat no-print" style="padding:6px 16px">' +
      '<a class="list-row" href="#/move/'+esc(move.id)+'/inventory"><span class="grow"><h4>Room-by-room inventory</h4><div class="sub">'+total+' items photographed &amp; tagged</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<a class="list-row" href="#/move/'+esc(move.id)+'/vendors"><span class="grow"><h4>Vendors</h4><div class="sub">'+move.vendors.length+' coordinated'+(move.vendors.some(v => v.quote !== "") ? " · bids recorded" : "")+'</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<a class="list-row" href="#/move/'+esc(move.id)+'/sale"><span class="grow"><h4>Estate sale</h4><div class="sub">'+esc(saleSub)+'</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<a class="list-row" href="#/move/'+esc(move.id)+'/checklist"><span class="grow"><h4>Move checklist</h4><div class="sub">'+esc(taskSub)+'</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<a class="list-row" href="#/move/'+esc(move.id)+'/digest"><span class="grow"><h4>Family digest</h4><div class="sub">A printable update for the whole family</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<a class="list-row" href="#/move/'+esc(move.id)+'/qr"><span class="grow"><h4>Box labels</h4><div class="sub">Printable QR labels: scan a box, see what is inside</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<a class="list-row" href="#/family/'+esc(move.id)+'"><span class="grow"><h4>Family portal</h4><div class="sub">'+(pend?pend+' decisions waiting':'nothing waiting')+'</div></span><span class="chev">'+icon("back")+'</span></a>' +
      '<button class="list-row" data-action="print-summary" style="width:100%;background:none;border-top:0;border-left:0;border-right:0;text-align:left;font-size:16px"><span class="grow"><h4>Print move summary</h4><div class="sub">Inventory, vendors, donations, for the client file</div></span><span class="chev">'+icon("print")+'</span></button>' +
      (move.sample?'<button class="list-row" data-action="summary-toggle-sample" data-id="'+esc(move.id)+'" aria-pressed="'+summaryShowSample+'" style="width:100%;background:none;border-top:0;border-left:0;border-right:0;text-align:left;font-size:16px"><span class="grow"><h4>Include sample data</h4><div class="sub">'+(summaryShowSample?'Sample data will appear in the printed summary.':'Sample data is hidden from the printed summary.')+'</div></span><span class="chev">'+icon("back")+'</span></button>':'') +
    '</div>' +
    '<div class="no-print" style="margin-top:16px"><button class="btn btn-ghost btn-block btn-sm" data-action="archive-move" data-id="'+esc(move.id)+'">'+(move.archived?"Unarchive this move":"Archive this move")+'</button></div>' +
    /* printable client summary: sample data excluded by default, opt-in toggle above */
    '<div class="print-only move-summary">'+summaryPrintHTML(move)+'</div>';
}

/* ----- inventory ----- */
let invFilter = {room:"all", disp:"all"};
let invSelectMode = false, invSel = [], invSelMove = null;
function vInventory(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), "inventory");
  topbarActions.innerHTML = "";
  if(invSelMove !== move.id){ invSelMove = move.id; invSel = []; invSelectMode = false; }
  const rooms = ["all"].concat(move.rooms);
  const countFor = r => r==="all" ? move.items.length : move.items.filter(i=>i.room===r).length;
  let items = move.items.slice();
  if(invFilter.room !== "all") items = items.filter(i => i.room === invFilter.room);
  if(invFilter.disp !== "all") items = items.filter(i => i.disposition === invFilter.disp);
  const cards = items.map(it => {
    const ph = itemPhoto(it);
    const inner = '<div class="item-photo">' + (ph ? '<img src="'+esc(ph)+'" alt="" loading="lazy">' : '<div class="no-photo">'+icon("camera")+'</div>') + '</div>' +
      '<div class="item-body"><div class="item-name">'+esc(it.name)+'</div>' +
      '<div class="item-room">'+esc(it.room)+'</div>' +
      '<div><span class="disp '+(DISP[it.disposition]||DISP.ask).cls+'">'+esc((DISP[it.disposition]||DISP.ask).label)+'</span>' +
      (it.disposition==="ask" ? ' <span class="disp '+((FAM[it.familyStatus]||FAM.pending).cls)+'">'+esc((FAM[it.familyStatus]||FAM.pending).label)+'</span>' : '') + '</div></div>';
    if(invSelectMode){
      const on = invSel.indexOf(it.id) > -1;
      return '<div class="item-card sel'+(on?' on':'')+'" data-action="toggle-item-sel" data-item="'+esc(it.id)+'" role="checkbox" aria-checked="'+on+'">'+inner+'<span class="selbox">'+(on?icon("check","ic-sm"):'')+'</span></div>';
    }
    return '<a class="item-card" href="#/move/'+esc(move.id)+'/inventory/'+esc(it.id)+'">'+inner+'</a>';
  }).join("");
  const bulkBar = (invSelectMode && invSel.length) ?
    '<div class="card bulk-bar no-print"><div class="row-between"><strong>'+invSel.length+' selected</strong><button class="btn btn-ghost btn-sm" data-action="clear-sel">Clear</button></div>' +
    '<div class="section-title">Set disposition</div><div class="chiprow">' +
      Object.keys(DISP).map(k => '<button class="chip" data-action="bulk-disp" data-v="'+k+'" data-id="'+esc(move.id)+'">'+esc(DISP[k].label)+'</button>').join("") +
    '</div><div class="section-title">Move to room</div>' +
    '<select id="bulk-room" data-move="'+esc(move.id)+'" aria-label="Move selected items to room">' +
      move.rooms.map(r => '<option value="'+esc(r)+'">'+esc(r)+'</option>').join("") + '</select></div>' : '';
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<div class="row-between"><h2 style="margin:0">Inventory</h2>' +
    '<div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" data-action="toggle-select">'+(invSelectMode?'Done':'Select')+'</button>' +
    '<button class="btn btn-sm" data-action="add-room" data-id="'+esc(move.id)+'">'+icon("plus","ic-sm")+' Room</button></div></div>' +
    '<div class="section-title">Rooms</div><div class="chiprow">' +
      rooms.map(r => '<button class="chip" data-action="filter-room" data-v="'+esc(r)+'" aria-pressed="'+(invFilter.room===r)+'">'+esc(r==="all"?"All rooms":r)+' · '+countFor(r)+'</button>').join("") +
    '</div>' +
    '<div class="section-title">Disposition</div><div class="chiprow">' +
      ['<button class="chip" data-action="filter-disp" data-v="all" aria-pressed="'+(invFilter.disp==="all")+'">All</button>']
        .concat(Object.keys(DISP).map(k => '<button class="chip" data-action="filter-disp" data-v="'+k+'" aria-pressed="'+(invFilter.disp===k)+'">'+esc(DISP[k].label)+'</button>')).join("") +
    '</div>' +
    '<div class="section-title">'+items.length+' item'+(items.length===1?"":"s")+'</div>' +
    bulkBar +
    (cards ? '<div class="item-grid">'+cards+'</div>' : '<div class="card empty">'+icon("box")+'<p>Nothing here yet. Tap + to photograph the first item.</p></div>') +
    '<button class="fab" data-action="add-item" data-id="'+esc(move.id)+'" aria-label="Add item">'+icon("plus")+'</button>';
}

/* ----- QR box labels ----- */
function qrText(move, it){
  const disp = ((DISP[it.disposition]||{}).label || it.disposition);
  return ["NextChapter", it.name, "Room: "+it.room, "Decision: "+disp, move.clientName+" move"].join("\n");
}
function vQRLabels(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), "inventory");
  topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm no-print" data-action="print-qr">'+icon("print","ic-sm")+' Print labels</button>';
  let items = move.items.slice();
  if(invFilter.room !== "all") items = items.filter(i => i.room === invFilter.room);
  if(invFilter.disp !== "all") items = items.filter(i => i.disposition === invFilter.disp);
  const labels = items.map(it =>
    '<div class="qr-label"><div class="qrbox" data-qr="'+esc(qrText(move,it))+'"></div>' +
    '<div class="qr-name">'+esc(it.name)+'</div>' +
    '<div class="qr-meta">'+esc(it.room)+' · '+esc(((DISP[it.disposition]||{}).label||it.disposition))+'</div></div>'
  ).join("");
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm no-print" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<div class="row-between"><h2 style="margin:0">Box labels</h2></div>' +
    '<div class="card no-print"><p class="muted small" style="margin:0">Print these labels and tape one to each box or item. Any phone camera reads them: the item name, the room, and what to do with it. No app or login needed. Labels follow the room and disposition filters from the inventory.</p></div>' +
    (labels ? '<div class="qr-sheet">'+labels+'</div>'
            : '<div class="card empty">'+icon("box")+'<p>No items match the current filters.</p></div>');
  view.querySelectorAll(".qrbox").forEach(box => {
    const text = box.getAttribute("data-qr");
    if(typeof QRCode !== "undefined"){
      try{ new QRCode(box, {text: text, width: 104, height: 104, correctLevel: QRCode.CorrectLevel.M}); }
      catch(e){ box.textContent = text; }
    } else { box.textContent = text; }
  });
}

/* ----- item detail ----- */
function vItem(move, it){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), "inventory");
  topbarActions.innerHTML = '<button class="btn btn-danger-soft btn-sm" data-action="delete-item" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">Remove</button>';
  const ph = itemPhoto(it);
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'/inventory" class="btn btn-ghost btn-sm" style="margin-bottom:12px">'+icon("back","ic-sm")+' Inventory</a>' +
    '<div class="card" style="padding:0;overflow:hidden">' +
      (ph ? '<img src="'+esc(ph)+'" alt="'+esc(it.name)+'" style="width:100%;max-height:320px;object-fit:cover">' : '') +
      '<div style="padding:16px"><div class="row-between"><h2 style="margin:0">'+esc(it.name)+'</h2></div>' +
      '<div class="muted small" style="margin:6px 0 10px">'+esc(it.room)+'</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="disp '+(DISP[it.disposition]||DISP.ask).cls+'">'+esc((DISP[it.disposition]||DISP.ask).label)+'</span>' +
      (it.disposition==="ask" ? '<span class="disp '+((FAM[it.familyStatus]||FAM.pending).cls)+'">'+esc((FAM[it.familyStatus]||FAM.pending).label)+'</span>' : '') + '</div>' +
      (it.notes ? '<p class="muted" style="margin:12px 0 0">'+esc(it.notes)+'</p>' : '') +
      (it.destRoom ? '<div class="kv" style="margin-top:8px"><span class="k">Goes to (new home)</span><span class="v">'+esc(it.destRoom)+'</span></div>' : '') +
      ((function(){ const d = itemDims(it); return d ? '<div class="kv"><span class="k">Footprint</span><span class="v">'+esc(dimsText(d,"in"))+'</span></div>' : ''; })()) +
      (it.estValue !== "" ? '<div class="kv"><span class="k">Estimated value</span><span class="v">'+esc(money(it.estValue))+'</span></div>' : '') +
      (Number(it.soldPrice) > 0 ? '<div class="kv"><span class="k">Sold for</span><span class="v">'+esc(money(it.soldPrice))+'</span></div>' : '') +
      (it.soldTo ? '<div class="kv"><span class="k">Sold to</span><span class="v">'+esc(it.soldTo)+'</span></div>' : '') +
      (it.soldDate ? '<div class="kv"><span class="k">Sale date</span><span class="v">'+esc(fmtDate(it.soldDate))+'</span></div>' : '') +
      '<div style="margin-top:14px"><button class="btn btn-soft btn-block" data-action="edit-item" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("edit","ic-sm")+' Edit item</button></div>' +
      '</div></div>' +
    ((Array.isArray(it.comments) && it.comments.length) ?
      '<div class="section-title">Family comments ('+it.comments.length+')</div>' +
      it.comments.map(c => '<div class="card"><div class="comment" style="margin:0"><span class="by">'+esc(c.by)+'</span><span class="ts">'+timeAgo(c.ts)+'</span><div style="margin-top:4px">'+esc(c.text)+'</div></div></div>').join("")
      : "");
}

/* ----- vendors ----- */
function bidRowHTML(move, v){
  const st = VENDOR_STATUS[v.status] || VENDOR_STATUS.todo;
  const attrs = ' data-id="'+esc(move.id)+'" data-vendor="'+esc(v.id)+'"';
  return '<tr><td><strong>'+esc(v.name)+'</strong>'+(v.awarded?' <span class="pill" style="background:var(--sage-soft);color:var(--sage-deep)">Awarded</span>':'')+'</td>' +
    '<td>'+(v.quote !== "" ? esc(money(v.quote)) : '<span class="faint">no bid</span>')+'</td>' +
    '<td>'+(v.deposit !== "" ? esc(money(v.deposit)) : '<span class="faint">-</span>')+'</td>' +
    '<td>'+(v.availDate ? esc(fmtDate(v.availDate)) : '<span class="faint">-</span>')+'</td>' +
    '<td><span class="status-dot '+st.cls+'"></span>'+esc(st.label)+'</td>' +
    '<td class="no-print">'+(v.awarded
      ? '<span class="pill" style="background:var(--sage-soft);color:var(--sage-deep)">Awarded</span>'
      : '<button class="btn btn-ghost btn-sm" data-action="award-vendor"'+attrs+'>Award</button>')+'</td></tr>';
}
function vVendors(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), "vendors");
  topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm no-print" data-action="print-bids">'+icon("print","ic-sm")+' Bid sheet</button>';
  const byKind = {};
  move.vendors.forEach(v => { (byKind[v.kind] = byKind[v.kind] || []).push(v); });
  const card = v => {
    const st = VENDOR_STATUS[v.status] || VENDOR_STATUS.todo;
    return '<div class="vendor"><div class="vendor-ic">'+icon("truck")+'</div><div class="vendor-body">' +
      '<div class="row-between"><h4>'+esc(v.name)+'</h4>' +
      '<button class="btn btn-ghost btn-sm" data-action="vendor-status" data-id="'+esc(move.id)+'" data-vendor="'+esc(v.id)+'"><span class="status-dot '+st.cls+'"></span>'+esc(st.label)+'</button></div>' +
      '<div class="small muted">'+esc(v.kind)+(v.awarded?' · <strong>Awarded</strong>':'')+(v.date?' · '+esc(fmtDate(v.date)):'')+'</div>' +
      (v.quote !== "" ? '<div class="small"><strong>Bid '+esc(money(v.quote))+'</strong>'+(v.deposit !== "" ? ' · deposit '+esc(money(v.deposit)) : '')+(v.availDate ? ' · available '+esc(fmtDate(v.availDate)) : '')+'</div>' : '') +
      (v.phone?'<div class="small"><a href="tel:'+esc(v.phone.replace(/[^+\d]/g,""))+'">'+esc(v.phone)+'</a></div>':'') +
      (v.quoteNote?'<div class="small muted">'+esc(v.quoteNote)+'</div>':'') +
      (v.notes?'<div class="small muted">'+esc(v.notes)+'</div>':'') +
      '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-soft btn-sm" data-action="edit-vendor" data-id="'+esc(move.id)+'" data-vendor="'+esc(v.id)+'">'+icon("edit","ic-sm")+' Edit</button>' +
      '<button class="btn btn-ghost btn-sm" data-action="delete-vendor" data-id="'+esc(move.id)+'" data-vendor="'+esc(v.id)+'">Remove</button></div>' +
    '</div></div>';
  };
  const sections = Object.keys(byKind).map(kind => {
    const list = byKind[kind];
    const showCompare = list.length >= 2 && list.some(v => v.quote !== "");
    return '<div class="section-title">'+esc(kind)+' ('+list.length+')</div>' +
      '<div class="card">' + list.map(card).join("") + '</div>' +
      (showCompare ? '<div class="card"><h3 style="margin:0 0 8px">Bid comparison</h3>' +
        '<div class="table-wrap"><table class="bid-table"><thead><tr><th>Company</th><th>Quote</th><th>Deposit</th><th>Available</th><th>Status</th><th class="no-print">Pick</th></tr></thead><tbody>' +
        list.slice().sort((a,b) => (Number(a.quote) || Infinity) - (Number(b.quote) || Infinity)).map(v => bidRowHTML(move, v)).join("") +
        '</tbody></table></div><p class="muted small">Lowest bid first. Awarding marks your choice and clears the rest.</p></div>' : '');
  }).join("");
  const awarded = move.vendors.filter(v => v.awarded);
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm no-print" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<div class="row-between"><h2 style="margin:0">Vendors</h2>' +
    '<button class="btn btn-sm no-print" data-action="add-vendor" data-id="'+esc(move.id)+'">'+icon("plus","ic-sm")+' Add</button></div>' +
    '<p class="muted small">Everyone involved in this move. Record each bid, then award the job.</p>' +
    (sections || '<div class="card empty">'+icon("truck")+'<p>No vendors yet.</p></div>') +
    '<div class="card print-only bid-summary"><h2>Vendor bid summary: '+esc(move.clientName)+'</h2>' +
      (awarded.length ? awarded.map(v => '<div class="kv"><span class="k">'+esc(v.name)+' ('+esc(v.kind)+') · awarded</span><span class="v">'+esc(money(v.quote))+'</span></div>').join("")
        : '<p class="faint">No vendors awarded yet.</p>') +
      '<p class="small muted">Prepared '+esc(fmtDate(todayISO()))+'.</p></div>';
}

/* ----- floor plan (new home) ----- */
function vPlan(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), "plan");
  topbarActions.innerHTML = "";
  const kept = move.items.filter(i => i.disposition === "keep");
  const rooms = move.rooms;
  const fitHTML = r => {
    const rd = roomDims(move, r);
    const here = kept.filter(i => i.destRoom === r);
    const sized = here.map(i => ({it: i, d: itemDims(i)})).filter(x => x.d);
    if(!rd){
      return sized.length ? '<p class="faint small">Add the room size under Notes to check fit.</p>' : '';
    }
    const area = rd.l * rd.w;
    const used = sized.reduce((s,x) => s + (x.d.l * x.d.w) / 144, 0);
    const pct = area > 0 ? Math.round(used / area * 100) : 0;
    const tooLong = sized.filter(x => x.d.l / 12 > rd.l || x.d.w / 12 > rd.w);
    let html = '<div class="small" style="margin-top:8px"><strong>'+esc(dimsText(rd,"ft"))+'</strong> ('+Math.round(area)+' sq ft)</div>';
    if(sized.length){
      html += '<div class="fit-bar" aria-label="Footprint used"><i style="width:'+Math.min(pct,100)+'%;'+(pct > 100 ? 'background:#a33b3b;':'')+'"></i></div>' +
        '<div class="small '+(pct > 100 ? 'fit-warn' : 'muted')+'">Furniture covers about '+used.toFixed(1)+' of '+Math.round(area)+' sq ft ('+pct+'%).' +
        (pct > 100 ? ' May not fit.' : '') + '</div>';
      if(tooLong.length) html += '<div class="small fit-warn">Longer than the room: '+tooLong.map(x => esc(x.it.name)).join(", ")+'</div>';
    } else {
      html += '<p class="faint small">No measured furniture placed here yet.</p>';
    }
    return html + '<p class="faint small" style="margin-top:6px">Rough estimate, not a to-scale layout.</p>';
  };
  const blocks = rooms.map(r => {
    const here = kept.filter(i => i.destRoom === r);
    return '<div class="card"><div class="row-between"><h3 style="margin:0">'+esc(r)+'</h3>' +
      '<button class="btn btn-soft btn-sm" data-action="edit-floornote" data-id="'+esc(move.id)+'" data-room="'+esc(r)+'">'+icon("edit","ic-sm")+' Notes</button></div>' +
      (move.floorNotes[r] ? '<p class="muted">'+esc(move.floorNotes[r])+'</p>' : '<p class="faint small">No notes yet. Where does furniture go in this room?</p>') +
      (here.length ? '<div class="small" style="margin-top:8px"><strong>Placed here:</strong> '+here.map(i=>esc(i.name)).join(", ")+'</div>' : '') +
      fitHTML(r) +
    '</div>';
  }).join("");
  const unplaced = kept.filter(i => !i.destRoom);
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<h2 style="margin:0">The new home</h2>' +
    '<p class="muted small">Floor-plan notes for '+(move.toAddr?esc(move.toAddr):"the new residence")+'. Assign kept items to rooms as you go.</p>' +
    (unplaced.length ? '<div class="card"><div class="section-title" style="margin-top:0">Kept items not yet placed ('+unplaced.length+')</div>' +
      unplaced.map(i => { const d = itemDims(i); return '<div class="list-row"><span class="grow"><h4>'+esc(i.name)+'</h4><div class="sub">'+esc(i.room)+' → ?'+(d ? ' · '+esc(dimsText(d,"in")) : '')+'</div></span><button class="btn btn-soft btn-sm" data-action="place-item" data-id="'+esc(move.id)+'" data-item="'+esc(i.id)+'">Place</button></div>'; }).join("") + '</div>' : '') +
    blocks +
    '<div class="card card-flat"><button class="btn btn-ghost btn-block" data-action="add-room" data-id="'+esc(move.id)+'">'+icon("plus","ic-sm")+' Add a room</button></div>';
}

/* ----- giving (donations) ----- */
function receiptHTML(move){
  const donation = move.donations.find(d => d.id === printReceiptId);
  if(!donation) return "";
  const names = donation.itemIds.map(id => move.items.find(it => it.id === id)).filter(Boolean).map(it => it.name);
  return '<section class="card print-only donation-receipt"><h2>Donation receipt</h2><h3>'+esc(donation.org)+'</h3>' +
    '<p>'+esc(move.clientName)+'</p><p>'+esc(fmtDate(donation.date))+'</p>' +
    (names.length?'<ul>'+names.map(name => '<li>'+esc(name)+'</li>').join("")+'</ul>':'') +
    (donation.note?'<p>'+esc(donation.note)+'</p>':'') +
    '<div class="kv"><span class="k">Estimated value</span><span class="v">'+esc(money(donation.value))+'</span></div>' +
    '<p>Values shown are the organizer\'s estimates, not appraisals.</p>' +
    '<p>This receipt is an organizer\'s worksheet, not tax advice. Keep it with your tax records.</p>' +
    '<p>Prepared '+esc(fmtDate(todayISO()))+'.</p></section>';
}
function vGiving(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), "giving");
  topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm no-print" data-action="print-donations">'+icon("print","ic-sm")+' Summary</button>';
  document.body.classList.toggle("printing-receipt", !!printReceiptId);
  const total = move.donations.reduce((s,d) => s + (Number(d.value)||0), 0);
  const rows = move.donations.map(d => {
    const names = d.itemIds.map(id => { const it = move.items.find(x=>x.id===id); return it?it.name:null; }).filter(Boolean);
    if(d.note && !names.length) names.push(d.note);
    return '<div class="card"><div class="row-between"><h3 style="margin:0">'+esc(d.org)+'</h3><strong>'+money(d.value)+'</strong></div>' +
      '<div class="small muted">'+esc(fmtDate(d.date))+(d.receipt?' · receipt saved':' · no receipt yet')+'</div>' +
      (names.length ? '<div class="small" style="margin-top:6px">'+names.map(esc).join(", ")+'</div>' : '') +
      '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn-soft btn-sm" data-action="edit-donation" data-id="'+esc(move.id)+'" data-donation="'+esc(d.id)+'">'+icon("edit","ic-sm")+' Edit</button>' +
      '<button class="btn btn-soft btn-sm no-print" data-action="print-receipt" data-id="'+esc(move.id)+'" data-donation="'+esc(d.id)+'">'+icon("print","ic-sm")+' Receipt</button>' +
      '<button class="btn btn-ghost btn-sm" data-action="delete-donation" data-id="'+esc(move.id)+'" data-donation="'+esc(d.id)+'">Remove</button></div></div>';
  }).join("");
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm no-print" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<div class="row-between"><h2 style="margin:0">Donation records</h2>' +
    '<button class="btn btn-sm no-print" data-action="add-donation" data-id="'+esc(move.id)+'">'+icon("plus","ic-sm")+' Add</button></div>' +
    '<p class="muted small">Every donation, with its estimated value. Organized records to share with the family or an accountant.</p>' +
    '<p class="muted small">Values are estimates, not appraisals. These records are an organizer&#39;s worksheet, not tax advice.</p>' +
    '<div class="card print-only donation-summary"><h3>Donation summary: '+esc(move.clientName)+'</h3>' +
      '<div class="kv"><span class="k">Total estimated value</span><span class="v">'+money(total)+'</span></div>' +
      '<div class="kv"><span class="k">Donations</span><span class="v">'+move.donations.length+'</span></div>' +
      '<p class="small muted">Values are estimates, not appraisals. This summary is an organizer&#39;s worksheet, not tax advice.</p><p class="small muted">Prepared '+esc(fmtDate(todayISO()))+'. Keep receipts with your tax records.</p></div>' +
    receiptHTML(move) +
    (rows || '<div class="card empty">'+icon("gift")+'<p>No donations recorded yet.</p></div>') +
    (move.donations.length ? '<div class="card"><div class="kv"><span class="k">Total estimated value</span><span class="v">'+money(total)+'</span></div></div>' : '');
}

/* ----- estate sale (proceeds tracker) ----- */
function salePrintHTML(move){
  const t = saleTotals(move);
  if(move.sample) return '<p><strong>Sample move, for demonstration only.</strong></p>' + salePrintBody(move, t);
  return salePrintBody(move, t);
}
function salePrintBody(move, t){
  const rows = move.items.filter(i => i.disposition === "sell").map(i =>
    '<div class="kv"><span class="k">'+esc(i.name)+' <span class="faint">('+esc(i.room)+')</span></span>' +
    '<span class="v">'+(Number(i.soldPrice) > 0 ? esc(money(i.soldPrice)) : 'not sold yet')+'</span></div>').join("");
  return '<h2>Estate sale summary: '+esc(move.clientName)+'</h2>' + (rows || '<p class="faint">No items marked for sale.</p>') +
    '<div class="kv"><span class="k">Total estimated value</span><span class="v">'+esc(money(t.est))+'</span></div>' +
    '<div class="kv"><span class="k">Total sold</span><span class="v">'+esc(money(t.gross))+'</span></div>' +
    '<div class="kv"><span class="k">Sale fees ('+esc(String(Number(move.saleFeePct) || 0))+'%)</span><span class="v">'+esc(money(Math.round(t.fees))) +'</span></div>' +
    '<div class="kv"><span class="k"><strong>Net to the family</strong></span><span class="v"><strong>'+esc(money(Math.round(t.net)))+'</strong></span></div>' +
    '<p class="small faint">Values are the organizer\'s estimates, not appraisals. This summary is an organizer\'s worksheet, not tax or legal advice.</p>' +
    '<p class="small faint">Prepared '+esc(fmtDate(todayISO()))+'.</p>';
}
function vSale(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), null);
  topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm no-print" data-action="print-sale">'+icon("print","ic-sm")+' Summary</button>';
  const t = saleTotals(move);
  const items = move.items.filter(i => i.disposition === "sell");
  const rows = items.map(it => {
    const ph = itemPhoto(it);
    const sold = Number(it.soldPrice) > 0;
    return '<a class="list-row sale-row" href="#/move/'+esc(move.id)+'/inventory/'+esc(it.id)+'">' +
      '<span class="sale-thumb">'+(ph ? '<img src="'+esc(ph)+'" alt="">' : icon("camera"))+'</span>' +
      '<span class="grow"><h4>'+esc(it.name)+'</h4><div class="sub">'+esc(it.room)+
        (it.estValue !== "" ? ' · est. '+esc(money(it.estValue)) : ' · no estimate yet') +'</div></span>' +
      '<span style="text-align:right"><strong>'+(sold ? esc(money(it.soldPrice)) : '<span class="faint">-</span>')+'</strong><div class="sub">'+
        (sold ? '<span class="disp disp-sell">Sold</span>' : '<span class="disp disp-ask">Awaiting sale</span>') +'</div></span></a>';
  }).join("");
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm no-print" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<div class="row-between"><h2 style="margin:0">Estate sale</h2></div>' +
    '<p class="muted small">Every item marked for sale, with its estimated value and what it actually sold for. Values are estimates, not appraisals.</p>' +
    '<div class="card no-print"><div class="field" style="margin-bottom:0"><label for="f-fee">Sale commission or fees (%)</label>' +
      '<div style="display:flex;gap:10px"><input id="f-fee" type="number" inputmode="decimal" min="0" max="100" value="'+esc(String(Number(move.saleFeePct) || 0))+'">' +
      '<button class="btn btn-soft" data-action="save-fee" data-id="'+esc(move.id)+'">Save</button></div>' +
      '<div class="hint">The estate-sale company\'s cut, taken off each sold item.</div></div></div>' +
    '<div class="card"><div class="kv"><span class="k">Items for sale</span><span class="v">'+t.count+' ('+t.soldCount+' sold)</span></div>' +
      '<div class="kv"><span class="k">Total estimated value</span><span class="v">'+esc(money(t.est))+'</span></div>' +
      '<div class="kv"><span class="k">Total sold</span><span class="v">'+esc(money(t.gross))+'</span></div>' +
      '<div class="kv"><span class="k">Fees</span><span class="v">'+esc(money(Math.round(t.fees)))+'</span></div>' +
      '<div class="kv"><span class="k"><strong>Net to the family</strong></span><span class="v"><strong>'+esc(money(Math.round(t.net)))+'</strong></span></div></div>' +
    '<div class="section-title">'+items.length+' item'+(items.length===1?"":"s")+' marked for sale</div>' +
    (rows ? '<div class="card" style="padding:6px 16px">'+rows+'</div>'
      : '<div class="card empty">'+icon("tag")+'<p>Nothing marked for sale yet. Tag items “Sell” in the inventory, then record what they bring.</p></div>') +
    '<div class="card print-only">'+salePrintHTML(move)+'</div>';
}

/* ----- move checklist (change-of-address + accounts) ----- */
function sheetTask(move){
  const cats = Array.from(new Set((move.checklist || []).map(t => t.category)));
  openSheet("Add a task", "Something this move needs that the template missed.",
    '<div class="field"><label for="f-task">Task</label><input id="f-task" placeholder="e.g. Return the cable box"></div>' +
    '<div class="field"><label for="f-tcat">Category</label><select id="f-tcat">' +
      cats.concat(["Other"]).map(c => '<option>'+esc(c)+'</option>').join("") + '</select></div>' +
    '<div class="field"><label for="f-toff">Timing</label><select id="f-toff">' +
      TASK_TIMING.map((x,i) => '<option value="'+x.o+'"'+(i===3?" selected":"")+'>'+esc(x.label)+'</option>').join("") + '</select></div>',
    '<button class="btn btn-block" data-action="create-task" data-id="'+esc(move.id)+'">'+icon("check","ic-sm")+' Add task</button>');
}
function vChecklist(move){
  document.body.classList.remove("family-mode");
  setTabs(moveTabs(move), null);
  topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm no-print" data-action="print-checklist">'+icon("print","ic-sm")+' Print</button>';
  const t = checklistTotals(move);
  const pct = t.total ? Math.round(t.done / t.total * 100) : 0;
  const list = move.checklist || [];
  const cats = [];
  list.forEach(x => { if(!cats.includes(x.category)) cats.push(x.category); });
  const groups = cats.map(c => {
    const tasks = list.filter(x => x.category === c);
    const rows = tasks.map(x => {
      const due = taskChip(move, x);
      return '<div class="task-row"><button class="task-check" data-action="toggle-task" data-id="'+esc(move.id)+'" data-task="'+esc(x.id)+'" aria-pressed="'+x.done+'" aria-label="'+(x.done?"Mark not done":"Mark done")+': '+esc(x.text)+'">' +
          (x.done ? icon("check","ic-sm") : '') + '</button>' +
        '<span class="grow'+(x.done ? " task-done" : "")+'">'+esc(x.text)+(due ? ' <span class="task-due">'+due+'</span>' : '')+'</span>' +
        (x.custom ? '<button class="btn btn-ghost btn-sm no-print" data-action="delete-task" data-id="'+esc(move.id)+'" data-task="'+esc(x.id)+'" aria-label="Remove task">'+icon("x","ic-sm")+'</button>' : '') +
      '</div>';
    }).join("");
    return '<div class="section-title">'+esc(c)+'</div><div class="card" style="padding:6px 16px">'+rows+'</div>';
  }).join("");
  view.innerHTML =
    '<a href="#/move/'+esc(move.id)+'" class="btn btn-ghost btn-sm no-print" style="margin-bottom:12px">'+icon("back","ic-sm")+' '+esc(move.clientName)+'</a>' +
    '<div class="row-between"><h2 style="margin:0">Move checklist</h2>' +
    '<button class="btn btn-sm no-print" data-action="add-task" data-id="'+esc(move.id)+'">'+icon("plus","ic-sm")+' Task</button></div>' +
    '<p class="muted small">The change-of-address and account chores that slip through the cracks, with due dates counted from move day.</p>' +
    (!move.targetDate ? '<div class="card"><p class="muted small" style="margin:0">Add a target date to the move to see each task\'s due date.</p></div>' : '') +
    '<div class="card"><div class="progress"><i style="width:'+pct+'%"></i></div><div class="progress-label">'+t.done+' of '+t.total+' tasks done</div></div>' +
    groups +
    '<p class="muted small" style="margin-top:16px">An organizer\'s worksheet, not legal or tax advice. Confirm deadlines with the family or the estate\'s attorney.</p>';
}

/* ----- family portal ----- */
function vFamily(move){
  document.body.classList.add("family-mode");
  setTabs(null); topbarActions.innerHTML = '<button class="btn btn-ghost btn-sm" data-action="guided-toggle">'+icon("expand","ic-sm")+' Guided view</button>';
  const needs = move.items.filter(i => i.disposition==="ask" && i.familyStatus==="pending");
  const decided = move.items.filter(i => !(i.disposition==="ask" && i.familyStatus==="pending"));
  const askTotal = move.items.filter(i => i.disposition==="ask").length;
  const askDone = askTotal - needs.length;
  const card = it => {
    const ph = itemPhoto(it);
    const comments = (Array.isArray(it.comments) ? it.comments : []).map(c => '<div class="comment"><span class="by">'+esc(c.by)+'</span><span class="ts">'+timeAgo(c.ts)+'</span><div style="margin-top:4px">'+esc(c.text)+'</div></div>').join("");
    return '<div class="card decision-card"><div class="row-between"><h3 style="margin:0">'+esc(it.name)+'</h3>' +
      '<span class="disp '+(DISP[it.disposition]||DISP.ask).cls+'">'+esc((DISP[it.disposition]||DISP.ask).label)+'</span></div>' +
      '<div class="small faint" style="margin:4px 0 8px">From the '+esc(it.room)+'</div>' +
      (ph ? '<img src="'+esc(ph)+'" alt="'+esc(it.name)+'" style="border-radius:12px;max-height:220px;width:100%;object-fit:cover;margin-bottom:8px">' : '') +
      (it.notes ? '<p class="muted small">'+esc(it.notes)+'</p>' : '') +
      (it.familyStatus!=="pending" ? '<div><span class="disp '+((FAM[it.familyStatus]||FAM.pending).cls)+'">'+esc((FAM[it.familyStatus]||FAM.pending).label)+'</span></div>' : "") +
      '<div class="fam-actions">' +
        (it.familyStatus==="pending"
          ? '<button class="btn btn-sm" data-action="fam-approve" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("check","ic-sm")+' Looks good</button>' +
            '<button class="btn btn-soft btn-sm" data-action="fam-suggest" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("chat","ic-sm")+' Suggest instead</button>'
          : '<button class="btn btn-ghost btn-sm" data-action="fam-reopen" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">Reopen decision</button>') +
      '</div>' +
      '<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-action="fam-comment" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("chat","ic-sm")+' Add a comment ('+((it.comments||[]).length)+')</button></div>' +
      (it.disposition === "ask" && it.familyStatus === "pending" ?
        '<details class="record-box"><summary>For the move team: record an answer from a call or text</summary><div class="record-inner"><label class="small" for="rec-note-'+esc(it.id)+'">Note (optional)</label><input id="rec-note-'+esc(it.id)+'" placeholder="e.g. per phone call with Maya">'+recordButtons(move,it)+'</div></details>' : '') +
      comments +
    '</div>';
  };
  view.innerHTML =
    (document.body.classList.contains("guided")?'<button class="guided-exit btn btn-ghost no-print" data-action="guided-toggle">Exit guided view</button>':'') +
    '<div class="family-hero"><h1>'+esc(move.clientName)+'’s move</h1>' +
    '<p>'+(move.familyContact?esc(move.familyContact.split(" ")[0])+", you": "You")+' are invited to weigh in on a few decisions. Nothing is final until the family agrees.</p>' +
    (askTotal ? '<div class="progress" style="margin-top:14px;background:rgba(255,255,255,.25)"><i style="width:'+Math.round(askDone/askTotal*100)+'%;background:#f6f1e7"></i></div><div style="margin-top:6px;font-size:14px;opacity:.9">'+askDone+' of '+askTotal+' family decisions made</div>' : "") + '</div>' +
    (needs.length
      ? '<div class="section-title">Needs your decision ('+needs.length+')</div>' + needs.map(card).join("")
      : (askTotal
        ? '<div class="card aligned">'+icon("check")+'<h3 style="margin:8px 0 4px">Everyone is aligned</h3><p class="muted small" style="margin:0">All '+askTotal+' family decisions are settled. The move team has everything they need.</p></div>'
        : '<div class="card empty">'+icon("check")+'<p>Nothing needs a decision right now. Thank you.</p></div>')) +
    (decided.length
      ? '<div class="section-title">Already decided ('+decided.length+')</div>' + decided.map(card).join("")
      : '') +
    '<p class="faint small" style="text-align:center;margin-top:20px">Shared with love by '+esc(move.clientName)+'’s move team.</p>';
}

function vFamilyMissing(){
  document.body.classList.add("family-mode");
  setTabs(null); topbarActions.innerHTML = "";
  view.innerHTML = '<div class="hero card"><div class="hero-art">'+icon("family")+'</div>' +
    '<h1>This link works on the device where the move was created</h1>' +
    '<p>Family links open the move on the device where it was created, in this build. Ask your move manager to send the family digest instead. It opens on any phone. Or open this link on their device.</p>' +
    '<a class="btn" href="#/">Back to start</a></div>';
}

/* ----- recovery (unreadable saved data) ----- */
function corruptKeys(){
  const out = [];
  try{
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(k && k.indexOf(CORRUPT_PREFIX) === 0) out.push(k);
    }
  }catch(e){}
  return out.sort();
}
function vRecovery(){
  document.body.classList.remove("family-mode");
  setTabs(null); topbarActions.innerHTML = "";
  view.innerHTML = '<div class="hero card"><div class="hero-art">'+icon("doc")+'</div>' +
    '<h1>We could not read your saved data</h1>' +
    '<p>Something damaged the data stored on this device, so we started you with a clean slate for now. Your old data is kept safe in a backup on this device. Nothing was deleted.</p>' +
    '<div style="display:grid;gap:10px;margin-top:16px">' +
    '<button class="btn" data-action="recovery-download">'+icon("download","ic-sm")+' Download the saved backup</button>' +
    '<button class="btn btn-ghost" data-action="recovery-fresh">Start fresh (clears the backup)</button>' +
    '</div>' +
    '<p class="muted small" style="margin-top:16px">Tip: once you are back in, export your moves as a backup file so you always have a copy.</p></div>';
}

/* ---------- sheets (forms) ---------- */
function sheetNewMove(){
  openSheet("Start a new move", "The basics. You can fill in the rest later.",
    '<div class="field"><label for="f-name">Client or estate name</label><input id="f-name" placeholder="e.g. Eleanor Vance"></div>' +
    '<div class="field"><label id="f-type-lbl">Move type</label><div class="seg" id="f-type" role="group" aria-labelledby="f-type-lbl">' +
      ["Downsizing move","Estate cleanout","Relocation","Aging in place"].map((t,i) =>
        '<button type="button" data-v="'+esc(t)+'" aria-pressed="'+(i===0)+'">'+esc(t)+'</button>').join("") + '</div></div>' +
    '<div class="field"><label for="f-from">Current address</label><input id="f-from" placeholder="Street, city"></div>' +
    '<div class="field"><label for="f-to">New address (if any)</label><input id="f-to" placeholder="Street, city"></div>' +
    '<div class="field"><label for="f-date">Target date</label><input id="f-date" type="date"></div>' +
    '<div class="field"><label for="f-fam">Family contact</label><input id="f-fam" placeholder="e.g. Maya (daughter)"></div>',
    '<button class="btn btn-block" data-action="create-move">'+icon("check","ic-sm")+' Create move</button>');
  $("#f-type").addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    $$("#f-type button").forEach(x => x.setAttribute("aria-pressed","false"));
    b.setAttribute("aria-pressed","true");
  });
}
function sheetEditMove(move){
  openSheet("Edit move", "",
    '<div class="field"><label for="f-name">Client or estate name</label><input id="f-name" value="'+esc(move.clientName)+'"></div>' +
    '<div class="field"><label for="f-from">Current address</label><input id="f-from" value="'+esc(move.fromAddr)+'"></div>' +
    '<div class="field"><label for="f-to">New address</label><input id="f-to" value="'+esc(move.toAddr)+'"></div>' +
    '<div class="field"><label for="f-date">Target date</label><input id="f-date" type="date" value="'+esc(move.targetDate)+'"></div>' +
    '<div class="field"><label for="f-fam">Family contact</label><input id="f-fam" value="'+esc(move.familyContact)+'"></div>',
    '<button class="btn btn-block" data-action="save-move" data-id="'+esc(move.id)+'">'+icon("check","ic-sm")+' Save changes</button>');
}
function sheetAddRoom(move){
  openSheet("Add a room", "Rooms organize the inventory, one at a time. No rush.",
    '<div class="field"><label for="f-room">Room name</label><input id="f-room" placeholder="e.g. Sunroom"></div>',
    '<button class="btn btn-block" data-action="create-room" data-id="'+esc(move.id)+'">'+icon("check","ic-sm")+' Add room</button>');
}
function dispSeg(current, label){
  return '<div class="seg" id="f-disp" role="group" aria-label="'+esc(label || "Choose one")+'">' + Object.keys(DISP).map(k =>
    '<button type="button" data-v="'+k+'" aria-pressed="'+(current===k)+'">'+esc(DISP[k].label)+'</button>').join("") + '</div>';
}
function sheetItem(move, it){
  pendingPhoto = null;
  const isEdit = !!it;
  it = it || {name:"", room: move.rooms[0]||"", disposition:"ask", notes:"", destRoom:"", estValue:"", soldPrice:"", soldTo:"", soldDate:"", dims:null};
  const isSell = it.disposition === "sell", isKeep = it.disposition === "keep";
  const saleFields =
    '<div class="field"><label for="f-estval">Estimated value ($)</label><input id="f-estval" type="number" inputmode="decimal" min="0" value="'+esc(it.estValue)+'" placeholder="0"></div>' +
    '<div id="f-soldwrap"'+(isSell?'':' style="display:none"')+'>' +
    '<div class="field"><label for="f-soldprice">Sold price ($)</label><input id="f-soldprice" type="number" inputmode="decimal" min="0" value="'+esc(it.soldPrice)+'" placeholder="0"></div>' +
    '<div class="field"><label for="f-soldto">Sold to</label><input id="f-soldto" value="'+esc(it.soldTo)+'" placeholder="Buyer name"></div>' +
    '<div class="field"><label for="f-solddate">Sale date</label><input id="f-solddate" type="date" value="'+esc(it.soldDate)+'"></div></div>' +
    '<div id="f-dimwrap"'+(isKeep?'':' style="display:none"')+'>' +
    '<div class="field"><label id="f-dim-lbl">Footprint, for the new home (inches)</label><div style="display:flex;gap:10px" role="group" aria-labelledby="f-dim-lbl">' +
      '<input id="f-dim-l" type="number" inputmode="decimal" min="0" placeholder="Length" aria-label="Length in inches" value="'+esc(it.dims && it.dims.l != null ? it.dims.l : "")+'">' +
      '<input id="f-dim-w" type="number" inputmode="decimal" min="0" placeholder="Width" aria-label="Width in inches" value="'+esc(it.dims && it.dims.w != null ? it.dims.w : "")+'">' +
      '</div><div class="hint">Used to check what fits in each room of the new home.</div></div></div>';
  openSheet(isEdit ? "Edit item" : "Add an item", "Photograph it, name it, decide what happens to it.",
    '<div class="field"><label>Photo</label><div class="photo-pick" id="photo-pick" data-action="pick-photo">' +
      (safePhoto(it.photo) ? '<img src="'+esc(safePhoto(it.photo))+'" alt="">' : icon("camera")+'<div><strong>Tap to add a photo</strong><div class="hint">Take one now or choose from the library</div></div>') +
      '<input type="file" id="f-photo" accept="image/*" style="display:none"></div></div>' +
    '<div class="field"><label for="f-name">Item name</label><input id="f-name" value="'+esc(it.name)+'" placeholder="e.g. Oak bookshelf"></div>' +
    '<div class="field"><label for="f-room">Room</label><select id="f-room">' +
      move.rooms.map(r => '<option '+(r===it.room?"selected":"")+'>'+esc(r)+'</option>').join("") + '</select></div>' +
    '<div class="field"><label>What happens to it?</label>'+dispSeg(it.disposition, "What happens to it?")+'</div>' +
    saleFields +
    '<div class="field"><label for="f-notes">Notes (optional)</label><textarea id="f-notes" placeholder="Condition, measurements, memories worth keeping…">'+esc(it.notes)+'</textarea></div>' +
    (isEdit && it.disposition==="keep" ? '<div class="field"><label for="f-dest">Goes to (new home room)</label><select id="f-dest"><option value="">Not placed yet</option>' +
      move.rooms.map(r => '<option '+(r===it.destRoom?"selected":"")+'>'+esc(r)+'</option>').join("") + '</select></div>' : ""),
    '<button class="btn btn-block" data-action="'+(isEdit?"save-item":"create-item")+'" data-id="'+esc(move.id)+'"'+(isEdit?' data-item="'+esc(it.id)+'"':'')+'>'+icon("check","ic-sm")+' '+(isEdit?"Save changes":"Add item")+'</button>');
  $("#f-disp").addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    $$("#f-disp button").forEach(x => x.setAttribute("aria-pressed","false"));
    b.setAttribute("aria-pressed","true");
    const v = b.getAttribute("data-v");
    const sw = $("#f-soldwrap"), dw = $("#f-dimwrap");
    if(sw) sw.style.display = v === "sell" ? "" : "none";
    if(dw) dw.style.display = v === "keep" ? "" : "none";
  });
  if(isEdit && it.photo) pendingPhoto = it.photo;
}
function sheetVendor(move, v){
  const isEdit = !!v;
  v = v || {kind:"Movers", name:"", phone:"", status:"todo", date:"", notes:"", quote:"", deposit:"", availDate:"", quoteNote:"", awarded:false};
  openSheet(isEdit ? "Edit vendor" : "Add a vendor", "",
    '<div class="field"><label for="f-kind">Type</label><select id="f-kind">' +
      VENDOR_KINDS.map(k => '<option '+(k===v.kind?"selected":"")+'>'+esc(k)+'</option>').join("") + '</select></div>' +
    '<div class="field"><label for="f-vname">Company name</label><input id="f-vname" value="'+esc(v.name)+'" placeholder="e.g. Gentle Giant Moving"></div>' +
    '<div class="field"><label for="f-vphone">Phone</label><input id="f-vphone" value="'+esc(v.phone)+'" inputmode="tel" placeholder="(555) 123-4567"></div>' +
    '<div class="field"><label for="f-vdate">Date (if scheduled)</label><input id="f-vdate" type="date" value="'+esc(v.date)+'"></div>' +
    '<div class="field"><label id="f-vbid-lbl">Bid details</label><div style="display:flex;gap:10px" role="group" aria-labelledby="f-vbid-lbl">' +
      '<input id="f-vquote" type="number" inputmode="decimal" min="0" placeholder="Quote ($)" aria-label="Quote in dollars" value="'+esc(v.quote)+'">' +
      '<input id="f-vdeposit" type="number" inputmode="decimal" min="0" placeholder="Deposit ($)" aria-label="Deposit in dollars" value="'+esc(v.deposit)+'"></div></div>' +
    '<div class="field"><label for="f-vavail">Available date</label><input id="f-vavail" type="date" value="'+esc(v.availDate)+'"></div>' +
    '<div class="field"><label for="f-vqnote">What the quote covers</label><textarea id="f-vqnote" placeholder="Insurance, crew size, materials included…">'+esc(v.quoteNote)+'</textarea></div>' +
    '<div class="field"><label for="f-vnotes">Notes</label><textarea id="f-vnotes" placeholder="Quote, crew size, parking notes…">'+esc(v.notes)+'</textarea></div>',
    '<button class="btn btn-block" data-action="'+(isEdit?"save-vendor":"create-vendor")+'" data-id="'+esc(move.id)+'"'+(isEdit?' data-vendor="'+esc(v.id)+'"':'')+'>'+icon("check","ic-sm")+' '+(isEdit?"Save changes":"Add vendor")+'</button>');
}
function sheetFloorNote(move, room){
  const d = roomDims(move, room) || {l:"", w:""};
  openSheet(room + " notes", "Where does furniture go? What fits, what doesn't?",
    '<div class="field"><label id="f-roomsize-lbl">Room size (feet)</label><div style="display:flex;gap:10px" role="group" aria-labelledby="f-roomsize-lbl">' +
      '<input id="f-room-l" type="number" inputmode="decimal" min="0" placeholder="Length" aria-label="Room length in feet" value="'+esc(d.l)+'">' +
      '<input id="f-room-w" type="number" inputmode="decimal" min="0" placeholder="Width" aria-label="Room width in feet" value="'+esc(d.w)+'"></div>' +
      '<div class="hint">Used to check whether kept furniture fits.</div></div>' +
    '<div class="field"><label for="f-fnote">Notes for the new '+esc(room)+'</label><textarea id="f-fnote" placeholder="e.g. Bookshelf against the east wall…">'+esc(move.floorNotes[room]||"")+'</textarea></div>',
    '<button class="btn btn-block" data-action="save-floornote" data-id="'+esc(move.id)+'" data-room="'+esc(room)+'">'+icon("check","ic-sm")+' Save notes</button>');
}
function sheetPlaceItem(move, it){
  openSheet("Place “"+it.name+"”", "Which room of the new home does it go to?",
    '<div class="field"><label for="f-dest">Destination room</label><select id="f-dest">' +
      move.rooms.map(r => '<option '+(r===it.destRoom?"selected":"")+'>'+esc(r)+'</option>').join("") + '</select></div>',
    '<button class="btn btn-block" data-action="save-placement" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("check","ic-sm")+' Place item</button>');
}
function sheetDonation(move, d){
  const isEdit = !!d;
  d = d || {org:"", date: new Date().toISOString().slice(0,10), itemIds:[], value:"", receipt:false, note:""};
  const donated = move.items.filter(i => i.disposition === "donate");
  openSheet(isEdit ? "Edit donation" : "Record a donation", "Organized records to share with the family or an accountant.",
    '<div class="field"><label for="f-dorg">Organization</label><input id="f-dorg" value="'+esc(d.org)+'" placeholder="e.g. Habitat ReStore"></div>' +
    '<div class="field"><label for="f-ddate">Date</label><input id="f-ddate" type="date" value="'+esc(d.date)+'"></div>' +
    (donated.length ? '<div class="field"><fieldset style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:600;margin-bottom:4px">Items from inventory</legend>' +
      donated.map(i => '<label style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-weight:400"><input type="checkbox" class="f-ditem" value="'+esc(i.id)+'" '+(d.itemIds.includes(i.id)?"checked":"")+' style="width:22px;height:22px;min-height:0"> '+esc(i.name)+'</label>').join("") + '</fieldset></div>'
      : '<p class="hint">Tip: tag items as “Donate” in the inventory and they’ll show up here.</p>') +
    '<div class="field"><label for="f-dnote">Other items / description</label><input id="f-dnote" value="'+esc(d.note)+'" placeholder="e.g. 3 bags of linens"></div>' +
    '<div class="field"><label for="f-dval">Estimated value ($)</label><input id="f-dval" type="number" inputmode="decimal" min="0" value="'+esc(d.value)+'" placeholder="0"></div>' +
    '<label style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" id="f-dreceipt" '+(d.receipt?"checked":"")+' style="width:22px;height:22px"> Paper receipt saved</label>',
    '<button class="btn btn-block" data-action="'+(isEdit?"save-donation":"create-donation")+'" data-id="'+esc(move.id)+'"'+(isEdit?' data-donation="'+esc(d.id)+'"':'')+'>'+icon("check","ic-sm")+' '+(isEdit?"Save changes":"Record donation")+'</button>');
}
function sheetFamComment(move, it){
  openSheet("Comment on “"+it.name+"”", "Kind words travel far during a move.",
    '<div class="field"><label for="f-by">Your name</label><input id="f-by" placeholder="e.g. Maya"></div>' +
    '<div class="field"><label for="f-text">Comment</label><textarea id="f-text" placeholder="What would you like the family to know?"></textarea></div>',
    '<button class="btn btn-block" data-action="save-comment" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("check","ic-sm")+' Post comment</button>');
}
function sheetFamSuggest(move, it){
  openSheet("Suggest something different", "“"+it.name+"” is currently marked “"+DISP[it.disposition].label+"”.",
    '<div class="field"><label for="f-by">Your name</label><input id="f-by" placeholder="e.g. Maya"></div>' +
    '<div class="field"><label>What would you suggest?</label>'+dispSeg(it.disposition, "What would you suggest?")+'</div>' +
    '<div class="field"><label for="f-text">Why? (optional)</label><textarea id="f-text" placeholder="A sentence helps everyone understand."></textarea></div>',
    '<button class="btn btn-block" data-action="save-suggest" data-id="'+esc(move.id)+'" data-item="'+esc(it.id)+'">'+icon("check","ic-sm")+' Send suggestion</button>');
  $("#f-disp").addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    $$("#f-disp button").forEach(x => x.setAttribute("aria-pressed","false"));
    b.setAttribute("aria-pressed","true");
  });
}

/* ---------- actions ---------- */
function segVal(id){ const b = $("#"+id+" button[aria-pressed='true']"); return b ? b.getAttribute("data-v") : null; }

const Actions = {
  "recovery-download": () => {
    const keys = corruptKeys();
    if(!keys.length){ toast("No saved backup found."); return; }
    let raw = "";
    try{ raw = localStorage.getItem(keys[keys.length - 1]) || ""; }catch(e){}
    downloadFile(raw, "application/json", "nextchapter-saved-backup.json");
    toast("Backup downloaded.");
  },
  "recovery-fresh": () => {
    if(!confirm("Start fresh? This clears the saved backup from this device.")) return;
    try{ corruptKeys().forEach(k => localStorage.removeItem(k)); }catch(e){}
    window.__ncRecovery = false;
    state = seed(); save(); route();
    // Wave F P1-2 side effect: pull right away so records that arrived
    // before recovery merge back in without waiting for the next interval.
    try{ const p = window.__nextchapterSyncPull && window.__nextchapterSyncPull(); if(p && p.catch) p.catch(function(){}); }catch(e){}
    toast("Started fresh. Your moves are safe to rebuild.");
  },
  "print-digest": () => window.print(),
  "print-bids": () => window.print(),
  "print-sale": () => window.print(),
  "print-checklist": () => window.print(),
  "save-fee": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    const v = Number($("#f-fee").value);
    m.saleFeePct = isNaN(v) || v < 0 ? 0 : Math.min(v, 100);
    save(); route(false); toast("Commission saved.");
  },
  "add-task": el => sheetTask(getMove(el.getAttribute("data-id"))),
  "create-task": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    const text = $("#f-task").value.trim();
    if(!text){ toast("Please name the task."); return; }
    m.checklist = m.checklist || [];
    m.checklist.push({id: uid(), text, category: $("#f-tcat").value, offset: Number($("#f-toff").value) || 0, done: false, doneAt: null, custom: true});
    save(); closeSheet(true); route(false); toast("Task added.");
  },
  "toggle-task": el => {
    const m = getMove(el.getAttribute("data-id"));
    const t = m && (m.checklist || []).find(x => x.id === el.getAttribute("data-task")); if(!t) return;
    t.done = !t.done; t.doneAt = t.done ? Date.now() : null;
    if(t.done) logAct(m, "Checked off: “"+t.text+"”.");
    save(); route(false); coachDone();
  },
  "delete-task": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    if(!confirm("Remove this task?")) return;
    m.checklist = (m.checklist || []).filter(x => x.id !== el.getAttribute("data-task"));
    save(); route(false); toast("Task removed.");
  },
  "award-vendor": el => {
    const m = getMove(el.getAttribute("data-id"));
    const v = m && m.vendors.find(x => x.id === el.getAttribute("data-vendor")); if(!v) return;
    m.vendors.forEach(x => { if(x.kind === v.kind) x.awarded = (x.id === v.id); });
    logAct(m, "Awarded “"+v.kind+"” to "+v.name+(v.quote !== "" ? " ("+money(v.quote)+")" : "")+".");
    save(); route(false); toast("Awarded to "+v.name+".");
  },
  "digest-toggle-sample": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    digestShowSample = !digestShowSample;
    view.innerHTML = digestBody(m,true);
  },
  "share-update": el => sheetShare(getMove(el.getAttribute("data-id"))),
  "copy-share": el => {
    const text = shareText(getMove(el.getAttribute("data-id")));
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(() => toast("Message copied."), () => prompt("Copy this message:",text));
    }else{ prompt("Copy this message:",text); }
  },
  "download-digest": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    const slug = m.clientName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "move";
    downloadFile(buildDigestHTML(m),"text/html","family-update-"+slug+"-"+todayISO()+".html");
    toast("Digest downloaded. Text it or email it to the family.");
  },
  "fam-record-approve": el => recordAnswer(el,true),
  "fam-record-suggest": el => recordAnswer(el,false),
  "guided-toggle": () => { document.body.classList.toggle("guided"); route(false); },
  "export-data": () => {
    downloadFile(JSON.stringify(state),"application/json","nextchapter-export-"+todayISO()+".json");
    toast("Backup downloaded.");
  },
  "import-data": () => { const input = $("#import-file"); if(input) input.click(); },
  "clear-samples": () => {
    if(!confirm("Remove the sample moves? Your real moves stay.")) return;
    state.moves = state.moves.filter(m => !m.sample); save(); route(); toast("Sample moves cleared.");
  },
  "print-receipt": el => {
    printReceiptId = el.getAttribute("data-donation"); route(false);
    setTimeout(() => {
      try{ window.print(); }finally{ printReceiptId = null; route(false); }
    },60);
  },
  "close-sheet": () => closeSheet(),
  "coach-ok": () => { try{ localStorage.setItem("nc_coach","1"); }catch(e){} route(false); },
  "toggle-select": () => { invSelectMode = !invSelectMode; invSel = []; route(false); },
  "toggle-item-sel": el => {
    const id = el.getAttribute("data-item");
    const i = invSel.indexOf(id);
    if(i > -1) invSel.splice(i,1); else invSel.push(id);
    route(false);
  },
  "clear-sel": () => { invSel = []; route(false); },
  "bulk-disp": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m || !invSel.length) return;
    const k = el.getAttribute("data-v"); const label = DISP[k].label;
    let n = 0;
    m.items.forEach(it => { if(invSel.indexOf(it.id) > -1){ it.disposition = k; n++; } });
    logAct(m, "Set "+n+" item"+(n===1?"":"s")+" to "+label+" (bulk).");
    invSel = []; save(); route(false); toast(n+" item"+(n===1?"":"s")+" set to "+label+".");
  },
  "print-qr": () => window.print(),
  "new-move": () => sheetNewMove(),
  "create-move": () => {
    const name = $("#f-name").value.trim();
    if(!name){ toast("Please give the move a name."); $("#f-name").focus(); return; }
    const m = { id: uid(), clientName: name, moveType: segVal("f-type") || "Downsizing move",
      fromAddr: $("#f-from").value.trim(), toAddr: $("#f-to").value.trim(),
      targetDate: $("#f-date").value, familyContact: $("#f-fam").value.trim(),
      rooms: DEFAULT_ROOMS.slice(0,5), items: [], vendors: [], floorNotes: {}, donations: [], activity: [], createdAt: Date.now() };
    ensureMoveFields(m);
    logAct(m, "Move created.");
    state.moves.unshift(m); save(); closeSheet(true); toast("Move created.");
    location.hash = "#/move/" + m.id;
  },
  "edit-move": el => sheetEditMove(getMove(el.getAttribute("data-id"))),
  "save-move": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    m.clientName = $("#f-name").value.trim() || m.clientName;
    m.fromAddr = $("#f-from").value.trim(); m.toAddr = $("#f-to").value.trim();
    m.targetDate = $("#f-date").value; m.familyContact = $("#f-fam").value.trim();
    save(); closeSheet(true); route(); toast("Saved.");
  },
  "add-room": el => sheetAddRoom(getMove(el.getAttribute("data-id"))),
  "create-room": el => {
    const m = getMove(el.getAttribute("data-id")); const name = $("#f-room").value.trim();
    if(!name){ toast("Please name the room."); return; }
    if(!m.rooms.includes(name)) m.rooms.push(name);
    save(); closeSheet(true); route(); toast("Room added.");
  },
  "filter-room": el => { invFilter.room = el.getAttribute("data-v"); route(false); },
  "filter-disp": el => { invFilter.disp = el.getAttribute("data-v"); route(false); },
  "add-item": el => sheetItem(getMove(el.getAttribute("data-id"))),
  "edit-item": el => { const m = getMove(el.getAttribute("data-id")); sheetItem(m, m.items.find(i=>i.id===el.getAttribute("data-item"))); },
  "pick-photo": (el, e) => { if(e.target.closest("input")) return; $("#f-photo").click(); },
  "create-item": el => {
    const m = getMove(el.getAttribute("data-id"));
    const name = $("#f-name").value.trim();
    if(!name){ toast("Please name the item."); $("#f-name").focus(); return; }
    const disp = segVal("f-disp") || "ask";
    const dimL = $("#f-dim-l") ? Number($("#f-dim-l").value) : 0;
    const dimW = $("#f-dim-w") ? Number($("#f-dim-w").value) : 0;
    logAct(m, "Inventoried “"+name+"” ("+$("#f-room").value+").");
    m.items.unshift({ id: uid(), room: $("#f-room").value, name, disposition: disp,
      notes: $("#f-notes").value.trim(), photo: pendingPhoto, photoSeed: null, destRoom: "",
      estValue: $("#f-estval") ? $("#f-estval").value : "",
      soldPrice: $("#f-soldprice") ? $("#f-soldprice").value : "",
      soldTo: $("#f-soldto") ? $("#f-soldto").value.trim() : "",
      soldDate: $("#f-solddate") ? $("#f-solddate").value : "",
      dims: (disp === "keep" && dimL > 0 && dimW > 0) ? {l: dimL, w: dimW} : null,
      familyStatus: disp==="ask" ? "pending" : "approved", comments: [], createdAt: Date.now() });
    save(); closeSheet(true); route(); toast("Item added."); coachDone();
  },
  "save-item": el => {
    const m = getMove(el.getAttribute("data-id"));
    const it = m.items.find(i=>i.id===el.getAttribute("data-item")); if(!it) return;
    const name = $("#f-name").value.trim();
    if(!name){ toast("Please name the item."); return; }
    const disp = segVal("f-disp") || it.disposition;
    it.name = name; it.room = $("#f-room").value; it.notes = $("#f-notes").value.trim();
    if($("#f-dest")) it.destRoom = $("#f-dest").value;
    if($("#f-estval")) it.estValue = $("#f-estval").value;
    if($("#f-soldprice")) it.soldPrice = $("#f-soldprice").value;
    if($("#f-soldto")) it.soldTo = $("#f-soldto").value.trim();
    if($("#f-solddate")) it.soldDate = $("#f-solddate").value;
    const dimL = $("#f-dim-l") ? Number($("#f-dim-l").value) : 0;
    const dimW = $("#f-dim-w") ? Number($("#f-dim-w").value) : 0;
    it.dims = (disp === "keep" && dimL > 0 && dimW > 0) ? {l: dimL, w: dimW} : null;
    if(disp !== it.disposition){
      it.disposition = disp;
      it.familyStatus = disp==="ask" ? "pending" : "approved";
    }
    it.photo = pendingPhoto;
    save(); closeSheet(true); route(); toast("Saved.");
  },
  "delete-item": el => {
    if(!confirm("Remove this item from the inventory?")) return;
    const m = getMove(el.getAttribute("data-id"));
    m.items = m.items.filter(i => i.id !== el.getAttribute("data-item"));
    save(); location.hash = "#/move/"+m.id+"/inventory"; toast("Item removed.");
  },
  "add-vendor": el => sheetVendor(getMove(el.getAttribute("data-id"))),
  "edit-vendor": el => { const m = getMove(el.getAttribute("data-id")); sheetVendor(m, m.vendors.find(v=>v.id===el.getAttribute("data-vendor"))); },
  "create-vendor": el => {
    const m = getMove(el.getAttribute("data-id"));
    const name = $("#f-vname").value.trim();
    if(!name){ toast("Please name the company."); return; }
    m.vendors.push({ id: uid(), kind: $("#f-kind").value, name, phone: $("#f-vphone").value.trim(),
      status: "todo", date: $("#f-vdate").value, notes: $("#f-vnotes").value.trim(),
      quote: $("#f-vquote").value, deposit: $("#f-vdeposit").value,
      availDate: $("#f-vavail").value, quoteNote: $("#f-vqnote").value.trim(), awarded: false });
    save(); closeSheet(true); route(); toast("Vendor added.");
  },
  "save-vendor": el => {
    const m = getMove(el.getAttribute("data-id"));
    const v = m.vendors.find(x=>x.id===el.getAttribute("data-vendor")); if(!v) return;
    v.kind = $("#f-kind").value; v.name = $("#f-vname").value.trim() || v.name;
    v.phone = $("#f-vphone").value.trim(); v.date = $("#f-vdate").value; v.notes = $("#f-vnotes").value.trim();
    v.quote = $("#f-vquote").value; v.deposit = $("#f-vdeposit").value;
    v.availDate = $("#f-vavail").value; v.quoteNote = $("#f-vqnote").value.trim();
    save(); closeSheet(true); route(); toast("Saved.");
  },
  "delete-vendor": el => {
    if(!confirm("Remove this vendor?")) return;
    const m = getMove(el.getAttribute("data-id"));
    m.vendors = m.vendors.filter(v => v.id !== el.getAttribute("data-vendor"));
    save(); route(); toast("Vendor removed.");
  },
  "vendor-status": el => {
    const m = getMove(el.getAttribute("data-id"));
    const v = m.vendors.find(x=>x.id===el.getAttribute("data-vendor")); if(!v) return;
    v.status = v.status==="todo" ? "progress" : v.status==="progress" ? "done" : "todo";
    logAct(m, v.name+" → "+VENDOR_STATUS[v.status].label+".");
    save(); route(false);
  },
  "edit-floornote": el => sheetFloorNote(getMove(el.getAttribute("data-id")), el.getAttribute("data-room")),
  "save-floornote": el => {
    const m = getMove(el.getAttribute("data-id"));
    const room = el.getAttribute("data-room");
    m.floorNotes[room] = $("#f-fnote").value.trim();
    const rl = Number($("#f-room-l").value), rw = Number($("#f-room-w").value);
    if(rl > 0 && rw > 0){ m.roomDims = m.roomDims || {}; m.roomDims[room] = {l: rl, w: rw}; }
    else if(m.roomDims){ delete m.roomDims[room]; }
    save(); closeSheet(true); route(); toast("Notes saved.");
  },
  "place-item": el => { const m = getMove(el.getAttribute("data-id")); sheetPlaceItem(m, m.items.find(i=>i.id===el.getAttribute("data-item"))); },
  "save-placement": el => {
    const m = getMove(el.getAttribute("data-id"));
    const it = m.items.find(i=>i.id===el.getAttribute("data-item")); if(!it) return;
    it.destRoom = $("#f-dest").value; save(); closeSheet(true); route(); toast("Placed in "+it.destRoom+".");
  },
  "add-donation": el => sheetDonation(getMove(el.getAttribute("data-id"))),
  "edit-donation": el => { const m = getMove(el.getAttribute("data-id")); sheetDonation(m, m.donations.find(d=>d.id===el.getAttribute("data-donation"))); },
  "create-donation": el => {
    const m = getMove(el.getAttribute("data-id"));
    const org = $("#f-dorg").value.trim();
    if(!org){ toast("Please name the organization."); return; }
    m.donations.unshift({ id: uid(), org, date: $("#f-ddate").value, note: $("#f-dnote").value.trim(),
      value: $("#f-dval").value, receipt: $("#f-dreceipt").checked,
      itemIds: $$(".f-ditem").filter(c=>c.checked).map(c=>c.value) });
    logAct(m, "Recorded donation to "+org+".");
    save(); closeSheet(true); route(); toast("Donation recorded.");
  },
  "save-donation": el => {
    const m = getMove(el.getAttribute("data-id"));
    const d = m.donations.find(x=>x.id===el.getAttribute("data-donation")); if(!d) return;
    d.org = $("#f-dorg").value.trim() || d.org; d.date = $("#f-ddate").value;
    d.note = $("#f-dnote").value.trim(); d.value = $("#f-dval").value; d.receipt = $("#f-dreceipt").checked;
    d.itemIds = $$(".f-ditem").filter(c=>c.checked).map(c=>c.value);
    save(); closeSheet(true); route(); toast("Saved.");
  },
  "delete-donation": el => {
    if(!confirm("Remove this donation record?")) return;
    const m = getMove(el.getAttribute("data-id"));
    m.donations = m.donations.filter(d => d.id !== el.getAttribute("data-donation"));
    save(); route(); toast("Donation removed.");
  },
  "print-donations": () => window.print(),
  "print-summary": () => window.print(),
  "summary-toggle-sample": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    summaryShowSample = !summaryShowSample;
    vMoveHub(m);
  },
  "archive-move": el => {
    const m = getMove(el.getAttribute("data-id")); if(!m) return;
    m.archived = !m.archived;
    logAct(m, m.archived ? "Move archived." : "Move unarchived.");
    save();
    location.hash = "#/";
    route();
    toast(m.archived ? "Move archived." : "Move restored.");
  },
  "copy-family-link": el => {
    const url = location.origin + location.pathname + "#/family/" + el.getAttribute("data-id");
    const done = () => toast("Family link copied. Send it to the family.");
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done, () => { prompt("Copy this link:", url); });
    } else { prompt("Copy this link:", url); }
  },
  "fam-approve": el => {
    const m = getMove(el.getAttribute("data-id"));
    const it = m.items.find(i=>i.id===el.getAttribute("data-item")); if(!it) return;
    it.familyStatus = "approved"; logAct(m, "Family approved “"+it.name+"”."); save(); route(false); toast("Approved. Thank you.");
  },
  "fam-reopen": el => {
    const m = getMove(el.getAttribute("data-id"));
    const it = m.items.find(i=>i.id===el.getAttribute("data-item")); if(!it) return;
    it.familyStatus = "pending"; save(); route(false);
  },
  "fam-comment": el => { const m = getMove(el.getAttribute("data-id")); sheetFamComment(m, m.items.find(i=>i.id===el.getAttribute("data-item"))); },
  "save-comment": el => {
    const m = getMove(el.getAttribute("data-id"));
    const it = m.items.find(i=>i.id===el.getAttribute("data-item")); if(!it) return;
    const by = $("#f-by").value.trim() || "Family";
    const text = $("#f-text").value.trim();
    if(!text){ toast("Please write a comment first."); return; }
    if(!Array.isArray(it.comments)) it.comments = [];
    it.comments.push({id: uid(), by, text, ts: Date.now()});
    logAct(m, by+" commented on “"+it.name+"”.");
    save(); closeSheet(true); route(false); toast("Comment posted.");
  },
  "fam-suggest": el => { const m = getMove(el.getAttribute("data-id")); sheetFamSuggest(m, m.items.find(i=>i.id===el.getAttribute("data-item"))); },
  "save-suggest": el => {
    const m = getMove(el.getAttribute("data-id"));
    const it = m.items.find(i=>i.id===el.getAttribute("data-item")); if(!it) return;
    const by = $("#f-by").value.trim() || "Family";
    const disp = segVal("f-disp");
    const text = $("#f-text").value.trim();
    const label = DISP[disp] ? DISP[disp].label : disp;
    if(!Array.isArray(it.comments)) it.comments = [];
    it.comments.push({id: uid(), by, text: "Suggested “"+label+"” instead." + (text ? " " + text : ""), ts: Date.now()});
    it.familyStatus = "changed";
    logAct(m, by+" suggested a different decision for “"+it.name+"”.");
    save(); closeSheet(true); route(false); toast("Suggestion sent to the move team.");
  }
};

document.addEventListener("click", e => {
  const nav = e.target.closest("[data-nav]");
  const el = e.target.closest("[data-action]");
  if(!el) return;
  const fn = Actions[el.getAttribute("data-action")];
  if(fn){ e.preventDefault(); fn(el, e); }
});
document.addEventListener("change", e => {
  if(e.target && e.target.id === "f-photo") handlePhotoInput(e.target);
  if(e.target && e.target.id === "import-file") importBackup(e.target);
  if(e.target && e.target.id === "bulk-room") bulkRoom(e.target);
});
function bulkRoom(sel){
  const m = getMove(sel.getAttribute("data-move")); if(!m || !invSel.length || !sel.value) return;
  let n = 0;
  m.items.forEach(it => { if(invSel.indexOf(it.id) > -1){ it.room = sel.value; n++; } });
  logAct(m, "Moved "+n+" item"+(n===1?"":"s")+" to "+sel.value+" (bulk).");
  invSel = []; save(); route(false); toast(n+" item"+(n===1?"":"s")+" moved to "+sel.value+".");
}
document.addEventListener("keydown", e => {
  if(e.key === "Escape") closeSheet();
});

/* ---------- router ---------- */
function route(rerender){
  closeSheet();
  if(window.__ncRecovery){ vRecovery(); window.scrollTo(0,0); return; }
  document.body.classList.remove("printing-receipt");
  const h = location.hash || "#/";
  const parts = h.replace(/^#\//,"").split("/");
  if(parts[0] !== "family" || !getMove(parts[1])) document.body.classList.remove("guided");
  window.scrollTo(0,0);
  if(parts[0] === "family" && parts[1]){
    const m = getMove(parts[1]);
    if(m) vFamily(m); else vFamilyMissing();
    return;
  }
  if(parts[0] === "move" && parts[1]){
    const m = getMove(parts[1]);
    if(!m){ location.hash = "#/"; return; }
    const sub = parts[2];
    if(sub === "inventory"){
      const it = parts[3] && m.items.find(i=>i.id===parts[3]);
      if(parts[3]){ if(it) vItem(m, it); else location.hash = "#/move/"+m.id+"/inventory"; }
      else vInventory(m);
    }
    else if(sub === "vendors") vVendors(m);
    else if(sub === "plan") vPlan(m);
    else if(sub === "giving") vGiving(m);
    else if(sub === "digest") vDigest(m);
    else if(sub === "sale") vSale(m);
    else if(sub === "checklist") vChecklist(m);
    else if(sub === "qr") vQRLabels(m);
    else { summaryShowSample = false; vMoveHub(m); }
    return;
  }
  vDashboard();
}
window.addEventListener("hashchange", () => route());
route();

/* ---------- offline banner: subtle, never a modal ---------- */
function updateOfflineBanner(){
  let b = document.getElementById("offlineBanner");
  if(typeof navigator !== "undefined" && navigator.onLine === false){
    if(!b){
      b = document.createElement("div");
      b.id = "offlineBanner"; b.className = "offline-banner no-print"; b.setAttribute("role","status");
      document.body.prepend(b);
    }
    b.textContent = "You are offline. Everything keeps working; changes stay on this device.";
    b.hidden = false;
  } else if(b){ b.hidden = true; }
}
window.addEventListener("online", updateOfflineBanner);
window.addEventListener("offline", updateOfflineBanner);
updateOfflineBanner();

/* ---------- first-run coach completes on the first real task ---------- */
function coachDone(){ try{ localStorage.setItem("nc_coach","1"); }catch(e){} }

/* ---- sync bridge (consumed by sync.js; local-first, sync never blocks UI) ---- */
window.__nextchapter = {
  getS: () => state,
  // Wave F P1-2: while the recovery screen is up, KEY holds quarantined
  // data. Sync (and everything else) must never write it.
  saveLocal: (s) => { if(window.__ncRecovery) return; try{ localStorage.setItem(KEY, JSON.stringify(s || state)); }catch(e){} },
  refresh: () => route()
};
})();
