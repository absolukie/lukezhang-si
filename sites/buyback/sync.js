/* Curbside sync — PROTOTYPE.
 * Local-first sync to sprint-backend-proto (https://sync-proto.lukezhang.si).
 * Additive: the app works fully offline; sync never blocks the UI.
 * Prototype-grade auth: a random per-device key stored in localStorage.
 * Anyone holding the key can read/write this device's records.
 * Pure merge functions are exported for node testing (no DOM needed).
 */
(function(){
"use strict";

var WORKER = "https://sync-proto.lukezhang.si";
var APP = "buyback";
var LS_DEVICE = "buyback.device_key";
var LS_META = "buyback.syncmeta.v1";
var LS_LAST = "buyback.lastsync.v1";
var LS_SKEW = "buyback.skew.v1";
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
/* Map app state -> flat record list. Collections: `case` (single active case)
 * and `repairs` (one record per repair). Repair photos are stripped — they
 * stay local-only (base64 images would blow the 100KB/record prototype cap).
 * node-testable: no DOM. */
function stateToRecords(S){
  var R = [];
  R.push({ collection: "case", key: "main",
    value: { state: S.state || null, car: S.car || null, intake: S.intake || null } });
  (S.repairs || []).forEach(function(r){
    var v = {};
    Object.keys(r).forEach(function(k){ if (k !== "photo") v[k] = r[k]; });
    v.hasPhoto = !!r.photo;
    R.push({ collection: "repairs", key: r.id, value: v });
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
function upsertIntoState(S, collection, key, value){
  var ex, i;
  if (collection === "case"){
    S.state = value.state; S.car = value.car; S.intake = value.intake;
  } else if (collection === "repairs"){
    S.repairs = S.repairs || [];
    ex = null;
    for (i = 0; i < S.repairs.length; i++) if (S.repairs[i] && S.repairs[i].id === key){ ex = S.repairs[i]; break; }
    if (ex){
      var keepPhoto = ex.photo; // local-only evidence photo survives remote merge
      for (var k in value) ex[k] = value[k];
      ex.photo = keepPhoto;
      ex.id = key;
    } else {
      var nv = { id: key, photo: null };
      for (var k2 in value) nv[k2] = value[k2];
      S.repairs.push(nv);
    }
    S.repairs.sort(function(a, b){ return a.dateIn < b.dateIn ? -1 : 1; });
  }
}
function removeFromState(S, collection, key){
  if (collection === "repairs")
    S.repairs = (S.repairs || []).filter(function(x){ return !x || x.id !== key; });
}

/* node test export */
if (typeof module !== "undefined" && module.exports){
  module.exports = { stateToRecords: stateToRecords, applyRecords: applyRecords,
    hashRecord: hashRecord, upsertIntoState: upsertIntoState,
    removeFromState: removeFromState };
  return;
}

/* ---------- browser glue ---------- */
if (!window.__buyback) return; // app.js must load first

var deviceKey = null;
var meta = {};
var lastPushed = {};   // "collection:key" -> hash, in-memory baseline
var lastSync = 0;
var skew = 0; // server_time - Date.now(); keeps push stamps on the server clock
try { skew = +localStorage.getItem(LS_SKEW) || 0; } catch(e){ skew = 0; }
var applyingRemote = false;
var pushTimer = null;
var status = "starting";

try { meta = JSON.parse(localStorage.getItem(LS_META) || "{}") || {}; } catch(e){ meta = {}; }
try { lastSync = +localStorage.getItem(LS_LAST) || 0; } catch(e){}
function saveMeta(){ try{ localStorage.setItem(LS_META, JSON.stringify(meta)); }catch(e){} }
function saveLastSync(){ try{ localStorage.setItem(LS_LAST, String(lastSync)); }catch(e){} }

function setStatus(s){
  status = s;
  var el = document.querySelector("#syncStatus");
  if (el){
    var label = { synced: "Synced", syncing: "Syncing…", offline: "Offline",
      error: "Sync error", starting: "Starting…" }[s] || s;
    el.textContent = label;
    el.className = "pill " + (s === "synced" ? "ok" : s === "offline" ? "" : s === "error" ? "crit" : "warn");
  }
}

async function api(path, opts){
  opts = opts || {};
  var headers = opts.headers || {};
  if (deviceKey) headers["authorization"] = "Bearer " + deviceKey;
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
async function pushDirty(){
  if (!deviceKey || applyingRemote) return;
  var S = window.__buyback.getS();
  var records = stateToRecords(S);
  var now = Date.now() + skew; // stamp on the server clock (see api())
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
  if (!out.length) return;
  setStatus("syncing");
  try {
    await api("/v1/sync/push", { method: "POST", body: { records: out } });
    out.forEach(function(r){
      var mk = r.collection + ":" + r.key;
      meta[mk] = Math.max(meta[mk] || 0, r.updated_at);
      lastPushed[mk] = r.deleted ? undefined : hashRecord(r);
      if (r.deleted) delete lastPushed[mk];
    });
    saveMeta();
    setStatus("synced");
  } catch(e){ setStatus(navigator.onLine === false ? "offline" : "error"); }
}

/* Pull remote changes since lastSync; apply newer-wins; re-render. */
async function pull(){
  if (!deviceKey || applyingRemote) return;
  setStatus("syncing");
  try {
    var data = await api("/v1/sync/pull?app=" + APP + "&since=" + lastSync);
    var S = window.__buyback.getS();
    applyingRemote = true;
    var changed = applyRecords(S, data.records || [], meta);
    if (changed){
      saveMeta();
      window.__buyback.saveLocal(); // persist without triggering a push
      window.__buyback.refresh();
      lastPushed = snapshot(stateToRecords(S));
    }
    applyingRemote = false;
    lastSync = data.server_time || Date.now();
    saveLastSync();
    setStatus("synced");
  } catch(e){
    applyingRemote = false;
    setStatus(navigator.onLine === false ? "offline" : "error");
  }
}

function onSave(){
  if (applyingRemote || !deviceKey) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushDirty, PUSH_DEBOUNCE_MS);
}

/* Settings UI — rendered into #syncAnchor (static aside card slot in index.html).
 * Re-renders each call so the status pill stays current after navigation. */
function renderSettingsUI(){
  var anchor = document.getElementById("syncAnchor");
  if (!anchor) return;
  anchor.innerHTML =
    '<div class="card" id="syncBox">' +
    '<h3>Device sync <span class="micro">(prototype)</span></h3>' +
    '<div class="set-row"><span>Status</span><span id="syncStatus" class="pill">…</span></div>' +
    '<p class="micro">Same key on two devices = same case. Anyone with the key can read your records. Repair photos never leave this device.</p>' +
    '<div class="set-row"><span>Device key</span><button class="link-btn" id="syncCopy">Copy</button></div>' +
    '<label class="micro">Use a key from another device<br><input id="syncPaste" type="text" placeholder="paste 64-char key" maxlength="64"></label>' +
    '<button class="btn btn-ghost btn-block" id="syncUse" style="margin-top:8px">Switch to this key</button>' +
    '</div>';
  setStatus(status);
  var box = anchor.querySelector("#syncBox");
  var cp = box.querySelector("#syncCopy");
  cp.onclick = function(){
    var done = function(){ cp.textContent = "Copied!"; setTimeout(function(){ cp.textContent = "Copy"; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(deviceKey || "").then(done, function(){ prompt("Copy device key:", deviceKey); });
    else prompt("Copy device key:", deviceKey);
  };
  box.querySelector("#syncUse").onclick = function(){
    var v = box.querySelector("#syncPaste").value.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(v)){ alert("That doesn't look like a device key."); return; }
    deviceKey = v;
    try {
      localStorage.setItem(LS_DEVICE, v);
      localStorage.removeItem(LS_META); localStorage.removeItem(LS_LAST);
    } catch(e){}
    meta = {}; lastSync = 0; lastPushed = {};
    pull();
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
    } catch(e){ setStatus("offline"); return; }
  }
  // Fresh device: push ALL local data up (lastPushed starts empty so the
  // diff sees everything as new). Existing device: pull first.
  if (fresh){ lastPushed = {}; await pushDirty(); }
  else { await pull(); }
  setInterval(pull, PULL_INTERVAL_MS);
  window.addEventListener("online", pull);
  try{ renderSettingsUI(); }catch(e){}
}

/* hooks consumed by app.js */
window.__buybackSync = { onSave: onSave };
window.__buybackSyncUI = renderSettingsUI;
window.__buybackSyncPull = pull;   // exposed for testing
window.__buybackSyncPush = pushDirty;
window.__buybackSyncStatus = function(){ return status; };

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
