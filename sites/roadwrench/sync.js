/* RoadWrench sync — PROTOTYPE.
 * Local-first sync to sprint-backend-proto (https://sync-proto.lukezhang.si).
 * Additive: the app works fully offline; sync never blocks the UI.
 * Prototype-grade auth: a random per-device key stored in localStorage.
 * Anyone holding the key can read/write this device's records.
 * PHOTO POLICY: job photos sync as separate "jobphotos" records carrying
 * metadata + a small thumbnail only. Full-res dataUrl NEVER leaves the
 * device (100KB/record prototype cap). Jobs sync with photo id stubs.
 * Pure merge functions are exported for node testing (no DOM needed).
 */
(function(){
"use strict";

var WORKER = "https://sync-proto.lukezhang.si";
var APP = "roadwrench";
var LS_DEVICE = "roadwrench.device_key";
var LS_META = "roadwrench.syncmeta.v1";
var LS_LAST = "roadwrench.lastsync.v1";
var PUSH_DEBOUNCE_MS = 2500;
var PULL_INTERVAL_MS = 60000;

/* Photos whose job hasn't arrived yet (out-of-order pull). */
var pendingPhotos = {};

/* ---------- pure functions (no DOM; unit-tested in node) ---------- */

function hashStr(s){
  var h = 5381, i;
  for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function hashRecord(r){
  return hashStr(r.collection + ":" + r.key + ":" + JSON.stringify(r.value));
}

function photoSyncValue(ph, jobId){
  return { id: ph.id, jobId: jobId, ts: ph.ts || 0, caption: ph.caption || "",
    tag: ph.tag || "before", thumb: ph.thumb || null, hasPhoto: !!ph.dataUrl };
}

/* Photo URL allowlist (mirrors app.js). dataUrl/thumb arrive through sync from
 * other devices; reject anything that is not a real image data URL so a hostile
 * sync peer cannot inject markup that later renders into HTML. */
var IMG_URL_OK = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];
function safeDataUrl(u){
  var s = String(u == null ? "" : u);
  for (var i = 0; i < IMG_URL_OK.length; i++) if (s.indexOf(IMG_URL_OK[i]) === 0) return s;
  return "";
}
function cleanPhotoValue(v){
  if (v && typeof v === "object"){
    if ("dataUrl" in v) v.dataUrl = safeDataUrl(v.dataUrl);
    if ("thumb" in v) v.thumb = safeDataUrl(v.thumb);
  }
  return v;
}
function jobSyncValue(j){
  var v = {};
  Object.keys(j).forEach(function(k){ if (k !== "photos") v[k] = j[k]; });
  v.photoIds = (j.photos || []).map(function(ph){ return ph.id; });
  return v;
}

/* Map app state -> flat record list. Mirrors the backend's generic model:
 * records(owner_device, app_slug, collection, rec_key, value_json, updated_at) */
function stateToRecords(S){
  var R = [];
  function put(collection, key, value){ R.push({ collection: collection, key: key, value: value }); }
  put("company", "main", S.company || {});
  (S.jobs || []).forEach(function(j){
    put("jobs", j.id, jobSyncValue(j));
    (j.photos || []).forEach(function(ph){ put("jobphotos", ph.id, photoSyncValue(ph, j.id)); });
  });
  (S.reminders || []).forEach(function(r){ put("reminders", r.id, r); });
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
function drainPending(j){
  var q = pendingPhotos[j.id];
  if (q && q.length){
    j.photos = j.photos || [];
    q.forEach(function(v){ upsertPhoto(j, v); });
    delete pendingPhotos[j.id];
  }
}
function upsertPhoto(j, v){
  j.photos = j.photos || [];
  var ex = findById(j.photos, v.id);
  if (ex){
    var keep = ex.dataUrl; // full-res stays local; never overwritten by sync
    Object.assign(ex, v);
    if (keep) ex.dataUrl = keep;
  } else j.photos.push(Object.assign({ id: v.id }, v));
}
function upsertIntoState(S, collection, key, value){
  var ex;
  if (collection === "company"){
    S.company = Object.assign({}, S.company, value);
  } else if (collection === "jobs"){
    S.jobs = S.jobs || [];
    ex = findById(S.jobs, key);
    if (ex){
      var keepPhotos = ex.photos || [];
      Object.assign(ex, value);
      delete ex.photoIds;
      var byId = {};
      keepPhotos.forEach(function(ph){ byId[ph.id] = ph; });
      (value.photoIds || []).forEach(function(pid){ if (!byId[pid]) keepPhotos.push({ id: pid }); });
      ex.photos = keepPhotos;
      drainPending(ex);
    } else {
      var nj = Object.assign({ id: key, photos: [] }, value);
      nj.photos = (value.photoIds || []).map(function(pid){ return { id: pid }; });
      delete nj.photoIds;
      S.jobs.unshift(nj);
      drainPending(nj);
    }
  } else if (collection === "jobphotos"){
    S.jobs = S.jobs || [];
    cleanPhotoValue(value);
    var j = findById(S.jobs, value.jobId);
    if (j) upsertPhoto(j, value);
    else {
      pendingPhotos[value.jobId] = pendingPhotos[value.jobId] || [];
      var q = pendingPhotos[value.jobId];
      var px = findById(q, value.id);
      if (px) Object.assign(px, value); else q.push(Object.assign({ id: value.id }, value));
    }
  } else if (collection === "reminders"){
    S.reminders = S.reminders || [];
    ex = findById(S.reminders, key);
    if (ex) Object.assign(ex, value); else S.reminders.push(Object.assign({ id: key }, value));
  }
}
function removeFromState(S, collection, key){
  function drop(arr){ return (arr || []).filter(function(x){ return !x || x.id !== key; }); }
  if (collection === "jobs") S.jobs = drop(S.jobs);
  else if (collection === "reminders") S.reminders = drop(S.reminders);
  else if (collection === "jobphotos"){
    (S.jobs || []).forEach(function(j){
      j.photos = (j.photos || []).filter(function(ph){ return !ph || ph.id !== key; });
    });
  }
}

/* node test export */
if (typeof module !== "undefined" && module.exports){
  module.exports = { stateToRecords: stateToRecords, applyRecords: applyRecords,
    hashRecord: hashRecord, upsertIntoState: upsertIntoState,
    removeFromState: removeFromState, jobSyncValue: jobSyncValue,
    photoSyncValue: photoSyncValue, safeDataUrl: safeDataUrl, cleanPhotoValue: cleanPhotoValue,
    _pendingPhotos: function(){ return pendingPhotos; } };
  return;
}

/* ---------- browser glue ---------- */
if (!window.__roadwrench) return; // app.js must load first

var deviceKey = null;
var meta = {};
var lastPushed = {};   // "collection:key" -> hash, in-memory baseline
var lastSync = 0;
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
    el.className = "sync-pill " + (s === "synced" ? "ok" : s === "offline" ? "" : s === "error" ? "crit" : "warn");
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
  return res.json();
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
  var S = window.__roadwrench.getS();
  var records = stateToRecords(S);
  var now = Date.now();
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
      if (r.deleted) delete lastPushed[mk];
      else lastPushed[mk] = hashRecord(r);
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
    var S = window.__roadwrench.getS();
    applyingRemote = true;
    var changed = applyRecords(S, data.records || [], meta);
    if (changed){
      saveMeta();
      window.__roadwrench.saveLocal(); // persist without triggering a push
      window.__roadwrench.refresh();
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

/* Settings UI (injected by app.js hook into #syncSettings on the settings tab). */
function renderSettingsUI(){
  var host = document.querySelector("#syncSettings");
  if (!host || host.querySelector("#syncBox")) return;
  var box = document.createElement("div");
  box.id = "syncBox";
  box.className = "card";
  box.innerHTML =
    '<h2>Device sync <span class="muted" style="font-weight:normal;font-size:12px">(prototype)</span> <span id="syncStatus" class="sync-pill">…</span></h2>' +
    '<div class="muted" style="margin-bottom:10px;font-size:13px">Same key on two devices = same jobs on both. ' +
    'Full-size photos stay on the device that took them; thumbnails sync. ' +
    'Anyone with the key can read your records.</div>' +
    '<div class="row"><button class="btn secondary grow" id="syncCopy">Copy device key</button></div>' +
    '<div class="field" style="margin-top:8px"><label>Paste a key from another device</label>' +
    '<input id="syncPaste" type="text" placeholder="64-char key" maxlength="64" style="font-size:12px"></div>' +
    '<button class="btn secondary block" id="syncUse" style="margin-top:6px">Use this key</button>';
  host.appendChild(box);
  setStatus(status);
  var cp = box.querySelector("#syncCopy");
  cp.onclick = function(){
    var done = function(){ cp.textContent = "Copied!"; setTimeout(function(){ cp.textContent = "Copy device key"; }, 1500); };
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
    meta = {}; lastSync = 0;
    lastPushed = snapshot(stateToRecords(window.__roadwrench.getS()));
    pull();
  };
}

async function boot(){
  deviceKey = null;
  try { deviceKey = localStorage.getItem(LS_DEVICE) || null; } catch(e){}
  var fresh = !deviceKey;
  if (!deviceKey){
    try {
      deviceKey = await register();
      localStorage.setItem(LS_DEVICE, deviceKey);
    } catch(e){ /* offline: render the settings UI so the pill shows Offline */ }
  }
  try{ renderSettingsUI(); }catch(e){}
  if (!deviceKey){ setStatus("offline"); return; }
  // Fresh device: push existing local data up. Existing device: pull first.
  lastPushed = snapshot(stateToRecords(window.__roadwrench.getS()));
  if (fresh){ await pushDirty(); }
  else { await pull(); }
  setInterval(pull, PULL_INTERVAL_MS);
  window.addEventListener("online", pull);
}

/* hooks consumed by app.js */
window.__roadwrenchSync = { onSave: onSave };
window.__roadwrenchSyncUI = renderSettingsUI;
window.__roadwrenchSyncPull = pull;   // exposed for testing
window.__roadwrenchSyncPush = pushDirty;
window.__roadwrenchSyncStatus = function(){ return status; };

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
