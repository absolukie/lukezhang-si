/* Aftermath sync — PROTOTYPE.
 * Local-first sync to sprint-backend-proto (https://sync-proto.lukezhang.si).
 * Additive: the app works fully offline; sync never blocks the UI.
 * Prototype-grade auth: a random per-device key stored in localStorage.
 * Anyone holding the key can read/write this device's records.
 * PHOTO POLICY: photo records sync metadata + a small thumbnail only.
 * Full-res dataUrl NEVER leaves the device (100KB/record prototype cap).
 * Pure merge functions are exported for node testing (no DOM needed).
 */
(function(){
"use strict";

var WORKER = "https://sync-proto.lukezhang.si";
var APP = "aftermath";
var LS_DEVICE = "aftermath.device_key";
var LS_META = "aftermath.syncmeta.v1";
var LS_LAST = "aftermath.lastsync.v1";
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

function photoSyncValue(p){
  return { id: p.id, jobId: p.jobId, takenAt: p.takenAt, room: p.room || "",
    damageType: p.damageType || "", severity: p.severity || "", notes: p.notes || "",
    pins: p.pins || [], phase: p.phase || "", sample: !!p.sample,
    thumb: p.thumb || null, hasPhoto: !!p.dataUrl };
}

/* Map app state -> flat record list. Mirrors the backend's generic model:
 * records(owner_device, app_slug, collection, rec_key, value_json, updated_at) */
function stateToRecords(S){
  var R = [];
  function put(collection, key, value){ R.push({ collection: collection, key: key, value: value }); }
  (S.jobs || []).forEach(function(j){ put("jobs", j.id, j); });
  (S.photos || []).forEach(function(p){ put("photos", p.id, photoSyncValue(p)); });
  (S.checklist || []).forEach(function(c){ put("checklist", c.id, c); });
  (S.lineItems || []).forEach(function(i){ put("lineitems", i.id, i); });
  (S.events || []).forEach(function(e){ put("events", e.id, e); });
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
  var ex;
  if (collection === "jobs"){
    S.jobs = S.jobs || [];
    ex = findById(S.jobs, key);
    if (ex) Object.assign(ex, value); else S.jobs.unshift(Object.assign({ id: key }, value));
  } else if (collection === "photos"){
    S.photos = S.photos || [];
    ex = findById(S.photos, key);
    if (ex){
      var keep = ex.dataUrl; // full-res photo stays local; never overwritten by sync
      Object.assign(ex, value);
      if (keep) ex.dataUrl = keep;
    } else S.photos.push(Object.assign({ id: key }, value));
  } else if (collection === "checklist"){
    S.checklist = S.checklist || [];
    ex = findById(S.checklist, key);
    if (ex) Object.assign(ex, value); else S.checklist.push(Object.assign({ id: key }, value));
  } else if (collection === "lineitems"){
    S.lineItems = S.lineItems || [];
    ex = findById(S.lineItems, key);
    if (ex) Object.assign(ex, value); else S.lineItems.push(Object.assign({ id: key }, value));
  } else if (collection === "events"){
    S.events = S.events || [];
    ex = findById(S.events, key);
    if (ex) Object.assign(ex, value); else S.events.push(Object.assign({ id: key }, value));
  }
}
function removeFromState(S, collection, key){
  function drop(arr){ return (arr || []).filter(function(x){ return !x || x.id !== key; }); }
  if (collection === "jobs") S.jobs = drop(S.jobs);
  else if (collection === "photos") S.photos = drop(S.photos);
  else if (collection === "checklist") S.checklist = drop(S.checklist);
  else if (collection === "lineitems") S.lineItems = drop(S.lineItems);
  else if (collection === "events") S.events = drop(S.events);
}

/* node test export */
if (typeof module !== "undefined" && module.exports){
  module.exports = { stateToRecords: stateToRecords, applyRecords: applyRecords,
    hashRecord: hashRecord, upsertIntoState: upsertIntoState,
    removeFromState: removeFromState, photoSyncValue: photoSyncValue };
  return;
}

/* ---------- browser glue ---------- */
if (!window.__aftermath) return; // app.js must load first

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
  var S = window.__aftermath.getS();
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
    var S = window.__aftermath.getS();
    applyingRemote = true;
    var changed = applyRecords(S, data.records || [], meta);
    if (changed){
      saveMeta();
      window.__aftermath.saveLocal(); // persist without triggering a push
      window.__aftermath.refresh();
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

/* Settings UI (injected by app.js hook into #syncSettings). */
function renderSettingsUI(){
  var host = document.querySelector("#syncSettings");
  if (!host || host.querySelector("#syncBox")) return;
  var box = document.createElement("div");
  box.id = "syncBox";
  box.className = "sync-card";
  box.innerHTML =
    '<div class="sync-head"><b>Device sync</b> <span class="muted">(prototype)</span> ' +
    '<span id="syncStatus" class="sync-pill">…</span></div>' +
    '<p class="muted" style="font-size:12px">Same key on two devices = same jobs on both. ' +
    'Full-size photos stay on the device that took them; thumbnails sync. ' +
    'Anyone with the key can read your records.</p>' +
    '<div class="sync-row"><button class="btn btn-ghost" id="syncCopy" style="font-size:13px">Copy device key</button></div>' +
    '<div class="sync-row"><input id="syncPaste" type="text" placeholder="Paste a 64-char key from another device" maxlength="64" style="font-size:12px">' +
    '<button class="btn btn-ghost" id="syncUse" style="font-size:13px">Use this key</button></div>';
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
    lastPushed = snapshot(stateToRecords(window.__aftermath.getS()));
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
  lastPushed = snapshot(stateToRecords(window.__aftermath.getS()));
  if (fresh){ await pushDirty(); }
  else { await pull(); }
  setInterval(pull, PULL_INTERVAL_MS);
  window.addEventListener("online", pull);
}

/* hooks consumed by app.js */
window.__aftermathSync = { onSave: onSave };
window.__aftermathSyncUI = renderSettingsUI;
window.__aftermathSyncPull = pull;   // exposed for testing
window.__aftermathSyncPush = pushDirty;
window.__aftermathSyncStatus = function(){ return status; };

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();

})();
