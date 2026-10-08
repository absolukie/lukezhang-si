/* Next Chapter sync: PROTOTYPE.
 * Local-first sync to sprint-backend-proto (https://sync-proto.lukezhang.si).
 * Additive: the app works fully offline; sync never blocks the UI.
 * Prototype-grade auth: a random per-device key stored in localStorage.
 * Anyone holding the key can read/write this device's records.
 * Pure merge functions are exported for node testing (no DOM needed).
 */
(function(){
"use strict";

var WORKER = "https://sync-proto.lukezhang.si";
var APP = "nextchapter";
var LS_DEVICE = "nextchapter.device_key";
var LS_META = "nextchapter.syncmeta.v1";
var LS_LAST = "nextchapter.lastsync.v1";
var LS_BASE = "nextchapter.syncbase.v1";
var LS_BIG = "nextchapter.oversized.v1";
/* Matches the server's /v1/sync/push cap. The server rejects the WHOLE batch
 * when any record exceeds this, so oversized records must be filtered
 * client-side and surfaced in the UI instead of being marked acknowledged. */
var MAX_RECORD_BYTES = 100000;
var LS_SKEW = "nextchapter.skew.v1";
var PUSH_DEBOUNCE_MS = 2500;
var PULL_INTERVAL_MS = 60000;

/* ---------- pure functions (no DOM; unit-tested in node) ---------- */

function hashStr(s){
  var h = 5381, i;
  for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function hashRecord(r){
  return hashStr(r.collection + ":" + r.key + ":" + JSON.stringify(r.value));
}

/* Map app state -> flat record list. Mirrors the backend's generic model:
 * records(owner_device, app_slug, collection, rec_key, value_json, updated_at) */
/* Map app state -> flat record list. Collections: `moves` (move core fields),
 * `inventory` (key "moveId:itemId", photo stripped: images stay local-only),
 * `vendors` (key "moveId:vendorId"). node-testable: no DOM. */
function stateToRecords(S){
  var R = [];
  (S.moves || []).forEach(function(m){
    R.push({ collection: "moves", key: m.id, value: {
      clientName: m.clientName, moveType: m.moveType, fromAddr: m.fromAddr,
      toAddr: m.toAddr, targetDate: m.targetDate, familyContact: m.familyContact,
      rooms: m.rooms || [], floorNotes: m.floorNotes || {}, donations: m.donations || [],
      activity: (m.activity || []).slice(0, 30), archived: !!m.archived, createdAt: m.createdAt
    }});
    (m.items || []).forEach(function(it){
      var v = {};
      Object.keys(it).forEach(function(k){ if (k !== "photo") v[k] = it[k]; });
      v.hasPhoto = !!it.photo;
      R.push({ collection: "inventory", key: m.id + ":" + it.id, value: v });
    });
    (m.vendors || []).forEach(function(v){
      R.push({ collection: "vendors", key: m.id + ":" + v.id, value: v });
    });
  });
  return R;
}

/* Apply pulled records to state. Last-writer-wins per item via meta timestamps.
 * meta: {"collection:key" -> updated_at}. Returns true if state changed. */
function applyRecords(S, records, meta){
  var changed = false;
  records.forEach(function(rec){
    var mk = rec.collection + ":" + rec.key;
    var known = meta[mk] || 0;
    if (!(rec.updated_at > known)) return; // stale or duplicate
    meta[mk] = rec.updated_at;
    if (rec.deleted) { removeFromState(S, rec.collection, rec.key); changed = true; return; }
    upsertIntoState(S, rec.collection, rec.key, rec.value);
    changed = true;
  });
  return changed;
}

function findById(arr, id){
  for (var i = 0; i < arr.length; i++) if (arr[i] && arr[i].id === id) return arr[i];
  return null;
}
function findMove(S, id){
  var ms = S.moves || [];
  for (var i = 0; i < ms.length; i++) if (ms[i] && ms[i].id === id) return ms[i];
  return null;
}
function upsertIntoState(S, collection, key, value){
  var i, m, ex, parts, mid, iid;
  if (collection === "moves"){
    S.moves = S.moves || [];
    m = findMove(S, key);
    if (m){
      // core fields only: items/vendors arrive as their own records
      ["clientName","moveType","fromAddr","toAddr","targetDate","familyContact",
       "rooms","floorNotes","donations","activity","archived","createdAt"].forEach(function(f){
        if (value[f] !== undefined) m[f] = value[f];
      });
    } else {
      var nm = { id: key, items: [], vendors: [] };
      ["clientName","moveType","fromAddr","toAddr","targetDate","familyContact",
       "rooms","floorNotes","donations","activity","archived","createdAt"].forEach(function(f){
        nm[f] = value[f];
      });
      S.moves.unshift(nm);
    }
  } else if (collection === "inventory"){
    parts = key.split(":"); mid = parts[0]; iid = parts.slice(1).join(":");
    m = findMove(S, mid); if (!m) return;
    m.items = m.items || [];
    ex = null;
    for (i = 0; i < m.items.length; i++) if (m.items[i] && m.items[i].id === iid){ ex = m.items[i]; break; }
    if (ex){
      var keepPhoto = ex.photo; // local-only photo survives remote merge
      for (var k in value) ex[k] = value[k];
      ex.photo = keepPhoto;
      ex.id = iid;
    } else {
      var ni = { id: iid, photo: null, comments: [] };
      for (var k2 in value) ni[k2] = value[k2];
      m.items.push(ni);
    }
  } else if (collection === "vendors"){
    parts = key.split(":"); mid = parts[0]; var vid = parts.slice(1).join(":");
    m = findMove(S, mid); if (!m) return;
    m.vendors = m.vendors || [];
    ex = null;
    for (i = 0; i < m.vendors.length; i++) if (m.vendors[i] && m.vendors[i].id === vid){ ex = m.vendors[i]; break; }
    if (ex){ for (var k3 in value) ex[k3] = value[k3]; ex.id = vid; }
    else { var nv = { id: vid }; for (var k4 in value) nv[k4] = value[k4]; m.vendors.push(nv); }
  }
}
function removeFromState(S, collection, key){
  var parts, m, i;
  if (collection === "moves"){
    S.moves = (S.moves || []).filter(function(x){ return !x || x.id !== key; });
  } else if (collection === "inventory" || collection === "vendors"){
    parts = key.split(":"); m = findMove(S, parts[0]); if (!m) return;
    var sub = parts.slice(1).join(":");
    var arr = collection === "inventory" ? "items" : "vendors";
    m[arr] = (m[arr] || []).filter(function(x){ return !x || x.id !== sub; });
  }
}

/* node test export */
if (typeof module !== "undefined" && module.exports){
  module.exports = { stateToRecords: stateToRecords, applyRecords: applyRecords,
    hashRecord: hashRecord, upsertIntoState: upsertIntoState,
    removeFromState: removeFromState };
  return;
}

/* ---------- browser glue ---------- */
if (!window.__nextchapter) return; // app.js must load first

var deviceKey = null;
var meta = {};
var lastPushed = {};   // "collection:key" -> hash; baseline of server-acknowledged state, PERSISTED
var lastSync = 0;
var skew = 0; // server_time - Date.now(); keeps push stamps on the server clock
try { skew = +localStorage.getItem(LS_SKEW) || 0; } catch(e){ skew = 0; }
var applyingRemote = false;
var pushTimer = null;
var inflight = 0;      // pushes/pulls currently in flight
var status = "starting"; // starting|syncing|offline|pending|synced (see updatePill)

try { meta = JSON.parse(localStorage.getItem(LS_META) || "{}") || {}; } catch(e){ meta = {}; }
try { lastSync = +localStorage.getItem(LS_LAST) || 0; } catch(e){}
/* Outbox durability: the acknowledged baseline survives reloads. Never snapshot
 * the live state as acknowledged here. Anything differing from the baseline is
 * unpushed work that must stay visible in the pill and go up on the next push. */
try { lastPushed = JSON.parse(localStorage.getItem(LS_BASE) || "{}") || {}; } catch(e){ lastPushed = {}; }
function saveMeta(){ try{ localStorage.setItem(LS_META, JSON.stringify(meta)); }catch(e){} }
function saveLastSync(){ try{ localStorage.setItem(LS_LAST, String(lastSync)); }catch(e){} }
function saveBaseline(){ try{ localStorage.setItem(LS_BASE, JSON.stringify(lastPushed)); }catch(e){} }


/* Oversized records: the server rejects any record over MAX_RECORD_BYTES, so
 * they are filtered out of pushes here and surfaced in the UI as device-only
 * instead of being marked acknowledged. Map: "collection:key" -> {bytes, at}. */
var oversized = {};
try { oversized = JSON.parse(localStorage.getItem(LS_BIG) || "{}") || {}; } catch(e){ oversized = {}; }
function saveOversized(){ try{ localStorage.setItem(LS_BIG, JSON.stringify(oversized)); }catch(e){} }
function recordBytes(value){
  try { return JSON.stringify(value === undefined ? null : value).length; }
  catch(e){ return 0; }
}
function escHtml(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* The one honest status function. Four states, derived from real conditions:
 * "Synced" only when nothing is pending and nothing is in flight;
 * "Syncing..." while a push/pull is in flight;
 * "Offline" when the network is down;
 * "Not synced: N changes pending" whenever work is unacknowledged. */
/* Lists oversized (device-only) records inside the settings panel. */
function renderBigWarn(){
  var host = document.querySelector("#syncBigWarn");
  if (!host) return;
  var keys = Object.keys(oversized);
  if (!keys.length){ host.innerHTML = ""; return; }
  host.innerHTML =
    '<div class="syncbig"><strong>Too large to back up (' + keys.length + '):</strong>' +
    '<ul>' + keys.map(function(mk){
      var kb = Math.round((oversized[mk].bytes || 0) / 1024);
      return '<li>' + escHtml(mk) + ': ' + kb +
        ' KB (100 KB cap). Saved on this device only.</li>';
    }).join("") + '</ul></div>';
}

/* The one honest status function. Five states, derived from real conditions:
 * "Synced" only when nothing is pending, nothing oversized, and nothing in flight;
 * "Syncing..." while a push/pull is in flight;
 * "Offline" when the network is down;
 * "Not synced: N changes pending" whenever sendable work is unacknowledged;
 * "Sync limited" when everything sendable is synced but oversized records are
 * device-only (they are surfaced, never marked acknowledged). */
function updatePill(){
  var n, s, label, cls, big;
  try { n = diffOut().length; } catch(e){ n = 0; }
  try { big = Object.keys(oversized).length; } catch(e){ big = 0; }
  if (inflight > 0){ s = "syncing"; label = "Syncing..."; cls = "warn"; }
  else if (typeof navigator !== "undefined" && navigator.onLine === false){ s = "offline"; label = "Offline"; cls = ""; }
  else if (n > 0){ s = "pending"; label = "Not synced: " + n + " change" + (n === 1 ? "" : "s") + " pending"; cls = "crit"; }
  else if (big > 0){ s = "limited"; label = "Sync limited: " + big + " too large"; cls = "warn"; }
  else { s = "synced"; label = "Synced"; cls = "ok"; }
  status = s;
  var el = document.querySelector("#syncStatus");
  if (el){ el.textContent = label; el.className = "pill" + (cls ? " " + cls : ""); }
}



async function api(path, opts){
  opts = opts || {};
  var headers = opts.headers || {};
  var __sess = null;
  try { __sess = localStorage.getItem(LS_DEVICE.replace(/\.device_key$/, ".session_token")); } catch(__e){}
  if (__sess) headers["authorization"] = "Bearer " + __sess;
  else if (deviceKey) headers["authorization"] = "Bearer " + deviceKey;
  if (opts.body) headers["content-type"] = "application/json";
  var res = await fetch(WORKER + path, {
    method: opts.method || "GET",
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) throw new Error("sync http " + res.status);
  var data = await res.json();
  // Track server clock skew so push timestamps stay ahead of the pull
  // `since` filter (server_time). Without this, a client clock behind the
  // server's would have its records silently missed by other devices.
  if (data && data.server_time){
    skew = data.server_time - Date.now();
    try{ localStorage.setItem(LS_SKEW, String(skew)); }catch(e){}
  }
  return data;
}

async function register(){
  var data = await api("/v1/devices", { method: "POST", body: { app_slug: APP } });
  return data.device_key;
}

function snapshot(records){
  var m = {};
  records.forEach(function(r){ m[r.collection + ":" + r.key] = hashRecord(r); });
  return m;
}

/* Push locally-changed records. Diffed against lastPushed; deletions become
 * tombstones automatically. Idempotent by key; safe to retry. */
/* Records that differ from the last acknowledged push (the outbox). */
/* Records that differ from the last acknowledged push (the outbox).
 * Records over MAX_RECORD_BYTES are filtered out of the push batch (the server
 * rejects the whole batch when any record is oversized) and tracked in the
 * oversized map instead of being marked acknowledged. */
function diffOut(){
  var S = window.__nextchapter.getS();
  var records = stateToRecords(S);
  var now = Date.now() + skew;
  var cur = snapshot(records);
  var out = [];
  records.forEach(function(r){
    var mk = r.collection + ":" + r.key;
    if (lastPushed[mk] !== cur[mk]){
      out.push({ app_slug: APP, collection: r.collection, key: r.key,
        value: r.value, updated_at: now });
    }
  });
  Object.keys(lastPushed).forEach(function(mk){
    if (!(mk in cur)){
      var i = mk.indexOf(":");
      out.push({ app_slug: APP, collection: mk.slice(0, i), key: mk.slice(i + 1),
        value: null, updated_at: now, deleted: true });
    }
  });
  var sendable = [];
  var bigDirty = false;
  out.forEach(function(r){
    var mk = r.collection + ":" + r.key;
    if (r.deleted){
      if (oversized[mk]){ delete oversized[mk]; bigDirty = true; }
      sendable.push(r);
      return;
    }
    var b = recordBytes(r.value);
    if (b > MAX_RECORD_BYTES){
      if (!oversized[mk] || oversized[mk].bytes !== b){
        oversized[mk] = { bytes: b, at: Date.now() };
        bigDirty = true;
      }
    } else {
      if (oversized[mk]){ delete oversized[mk]; bigDirty = true; }
      sendable.push(r);
    }
  });
  /* Prune map entries for records that no longer exist locally. */
  Object.keys(oversized).forEach(function(mk){
    if (!(mk in cur)){ delete oversized[mk]; bigDirty = true; }
  });
  if (bigDirty){ saveOversized(); renderBigWarn(); }
  return sendable;
}


/* Push locally-changed records. Diffed against the persisted lastPushed
 * baseline; deletions become tombstones automatically. Idempotent by key;
 * safe to retry. The baseline only advances on success. A failed push keeps
 * the work visible in the pill instead of claiming "Synced". */
async function pushDirty(){
  if (!deviceKey || applyingRemote){ updatePill(); return; }
  var out = diffOut();
  if (!out.length){ updatePill(); return; } // honest no-op: recompute, don't claim
  inflight++; updatePill();
  try {
    await api("/v1/sync/push", { method: "POST", body: { records: out } });
    out.forEach(function(r){
      var mk = r.collection + ":" + r.key;
      meta[mk] = Math.max(meta[mk] || 0, r.updated_at);
      if (r.deleted) delete lastPushed[mk];
      else lastPushed[mk] = hashRecord(r);
    });
    saveMeta();
    saveBaseline();
  } catch(e){ /* pill below reports the unacknowledged work honestly */ }
  inflight--;
  updatePill();
}


/* Pull remote changes since lastSync; apply newer-wins; re-render. */
/* Pull remote changes since lastSync; apply newer-wins; re-render.
 * Applied records merge into the persisted baseline WITHOUT snapshotting the
 * whole state. Local-only work stays unacknowledged and keeps its pill. */
async function pull(){
  if (!deviceKey || applyingRemote) return;
  inflight++; updatePill();
  try {
    var data = await api("/v1/sync/pull?app=" + APP + "&since=" + lastSync);
    var S = window.__nextchapter.getS();
    var applied = {};
    (data.records || []).forEach(function(r){
      var mk = r.collection + ":" + r.key;
      if (r.updated_at > (meta[mk] || 0)) applied[mk] = !!r.deleted;
    });
    applyingRemote = true;
    var changed = applyRecords(S, data.records || [], meta);
    if (changed){
      saveMeta();
      window.__nextchapter.saveLocal(); // persist without triggering a push
      window.__nextchapter.refresh();
      var cur = snapshot(stateToRecords(S));
      Object.keys(applied).forEach(function(mk){
        if (applied[mk]) delete lastPushed[mk];
        else if (cur[mk] !== undefined) lastPushed[mk] = cur[mk];
      });
      saveBaseline();
    }
    lastSync = data.server_time || Date.now();
    saveLastSync();
  } catch(e){ /* honest pill below */ }
  applyingRemote = false;
  inflight--;
  updatePill();
}


function onSave(){
  /* Always report honestly, even when no device key exists yet (backend
   * unreachable at boot): the work is still unacknowledged. Only schedule
   * the push when we have a key to push with. */
  updatePill();
  if (applyingRemote || !deviceKey) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushDirty, PUSH_DEBOUNCE_MS);
}


/* Settings UI, rendered into #syncAnchor at the bottom of the dashboard.
 * Re-renders each call because vDashboard rebuilds the view on every route. */
function renderSettingsUI(){
  var anchor = document.getElementById("syncAnchor");
  if (!anchor) return;
  anchor.innerHTML =
    '<div class="card" id="syncBox" style="margin-top:12px">' +
    '<div class="row-between"><h3 style="margin:0">Device sync <span class="micro">(prototype)</span></h3>' +
    '<span id="syncStatus" class="pill">…</span></div>' +
    '<p style="font-size:12px;color:#64748b;margin:8px 0 0;line-height:1.5">Prototype backup cap: each record may be up to 100 KB. Larger records stay on this device only and are listed below.</p>' +
    '<div id="syncBigWarn"></div>' +
    '<p class="micro">Same key on phone + laptop = same moves. Anyone with the key can read your records. Item photos never leave this device.</p>' +
    '<div class="set-row"><span>Device key</span><button class="link-btn" id="syncCopy">Copy</button></div>' +
    '<label class="micro">Use a key from another device<br><input id="syncPaste" type="text" placeholder="paste 64-char key" maxlength="64"></label>' +
    '<button class="btn btn-ghost btn-sm" id="syncUse" style="margin-top:8px">Switch to this key</button>' +
    '</div>';
  updatePill();
  renderBigWarn();
  var box = anchor.querySelector("#syncBox");
  var cp = box.querySelector("#syncCopy");
  cp.onclick = function(){
    var done = function(){ cp.textContent = "Copied!"; setTimeout(function(){ cp.textContent = "Copy"; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(deviceKey || "").then(done, function(){ prompt("Copy device key:", deviceKey); });
    else prompt("Copy device key:", deviceKey);
  };
  box.querySelector("#syncUse").onclick = async function(){
    var v = box.querySelector("#syncPaste").value.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(v)){ alert("That doesn't look like a device key."); return; }
    deviceKey = v;
    try {
      localStorage.setItem(LS_DEVICE, v);
      localStorage.removeItem(LS_META); localStorage.removeItem(LS_LAST);
    } catch(e){}
    try { localStorage.removeItem(LS_BASE); } catch(e){}
    meta = {}; lastSync = 0; lastPushed = {};
    saveBaseline();
    /* New key = new device identity: pull its remote state first, then push
     * only local-only changes (pull merges applied records into the baseline). */
    try { await pull(); } catch(e){}
    try { await pushDirty(); } catch(e){}
  };
}

async function boot(){
  try{ if (typeof renderSettingsUI === "function") renderSettingsUI(); }catch(e){}
  deviceKey = null;
  try { deviceKey = localStorage.getItem(LS_DEVICE) || null; } catch(e){}
  var fresh = !deviceKey;
  if (!deviceKey){
    try {
      deviceKey = await register();
      localStorage.setItem(LS_DEVICE, deviceKey);
    } catch(e){ updatePill(); return; } // offline: pill reports honestly, no false "Synced"
  }

  try { if (window.__authBoot) await window.__authBoot({ repull: function(){ meta = {}; lastSync = 0; } }); } catch(e){}
  /* Never snapshot the live state as acknowledged here. lastPushed was loaded
   * from localStorage; anything differing from it is unpushed work (including a
   * fresh device's first upload) that must go up. */
  if (fresh){ lastPushed = {}; saveBaseline(); await pushDirty(); }
  else { await pull(); }
  setInterval(pull, PULL_INTERVAL_MS);
  window.addEventListener("online", pull);
  window.addEventListener("offline", updatePill);
  updatePill();
}


/* hooks consumed by app.js */
window.__nextchapterSync = { onSave: onSave };
window.__nextchapterSyncUI = renderSettingsUI;
window.__nextchapterSyncPull = pull;   // exposed for testing
window.__nextchapterSyncPush = pushDirty;
window.__nextchapterSyncStatus = function(){ return status; };

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();

})();


/* Client error reporter (v1).
 * Reports window errors and unhandled promise rejections to the sync backend
 * so crashes can be triaged from the status dashboard. Fire and forget:
 * it never throws, never blocks the app, and skips silently when the backend
 * is unreachable or no device key exists yet. PII patterns are scrubbed
 * client-side before sending (the server scrubs again).
 */
(function(){
  "use strict";
  try {
    var SLUG = "";
    try { SLUG = String(typeof LS_DEVICE === "string" ? LS_DEVICE : "").replace(/\.device_key$/, ""); } catch(e){}
    var BASE = "https://sync-proto.lukezhang.si";
    try { if (typeof WORKER === "string" && WORKER) BASE = WORKER; } catch(e){}
    var ENDPOINT = BASE + "/v1/client-errors";

    function trunc(s, n){
      s = String(s === null || s === undefined ? "" : s);
      return s.length > n ? s.slice(0, n) : s;
    }
    function scrub(s){
      s = String(s === null || s === undefined ? "" : s);
      s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]");
      s = s.replace(/\+?\d[\d][\d\s().-]{6,}\d/g, "[phone]");
      s = s.replace(/(bearer[ :]+)[A-Za-z0-9\-._~+/=]{8,}/gi, "$1[token]");
      s = s.replace(/(api[_-]?key|device[_-]?key|token|secret|password|passwd|auth)\s*[:=]\s*["']?[^"'\s,}]{6,}/gi, "$1=[redacted]");
      return s;
    }

    var busy = false;
    var queue = [];
    function pump(){
      try {
        if (busy) return;
        var item = queue.shift();
        if (!item) return;
        var key = null;
        try { key = localStorage.getItem(LS_DEVICE); } catch(e){}
        if (!key || !SLUG) { pump(); return; }
        busy = true;
        var page = "";
        try { page = location.href.split("#")[0]; } catch(e){}
        var body = JSON.stringify({
          app_slug: SLUG,
          message: trunc(scrub(item.message), 500),
          stack: trunc(scrub(item.stack), 4000),
          page_url: trunc(page, 500)
        });
        fetch(ENDPOINT, {
          method: "POST",
          headers: {"Content-Type": "application/json", "Authorization": "Bearer " + key},
          body: body,
          keepalive: true
        }).then(function(){ busy = false; pump(); }, function(){ busy = false; pump(); });
      } catch(e){ busy = false; }
    }
    function send(message, stack){
      try {
        if (!SLUG) return;
        queue.push({message: message, stack: stack});
        if (queue.length > 5) queue.shift();
        pump();
      } catch(e){}
    }

    window.addEventListener("error", function(ev){
      try {
        var msg = ev && ev.message ? ev.message : "window.onerror";
        try {
          if (ev && ev.filename) msg += " @ " + ev.filename + ":" + (ev.lineno || 0) + ":" + (ev.colno || 0);
        } catch(e){}
        var stack = "";
        try { stack = (ev && ev.error && ev.error.stack) ? ev.error.stack : ""; } catch(e){}
        send(msg, stack);
      } catch(e){}
    });
    window.addEventListener("unhandledrejection", function(ev){
      try {
        var r = ev ? ev.reason : null;
        var msg = "unhandledrejection";
        var stack = "";
        try {
          if (r instanceof Error) { msg = r.message || msg; stack = r.stack || ""; }
          else if (typeof r === "string") { msg = r; }
          else { msg = trunc(JSON.stringify(r), 500); }
        } catch(e){}
        send(msg, stack);
      } catch(e){}
    });
  } catch(e){}
})();
