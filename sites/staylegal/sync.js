/* StayLegal sync — PROTOTYPE.
 * Local-first sync to sprint-backend-proto (https://sync-proto.lukezhang.si).
 * Additive: the app works fully offline; sync never blocks the UI.
 * Prototype-grade auth: a random per-device key stored in localStorage.
 * Anyone holding the key can read/write this device's records.
 * Pure merge functions are exported for node testing (no DOM needed).
 *
 * Syncs saved address checks ("your past reports on any device").
 * Per-city checklists (staylegal.checklist.*) stay local-only.
 */
(function(){
"use strict";

var WORKER = "https://sync-proto.lukezhang.si";
var APP = "staylegal";
var LS_DEVICE = "staylegal.device_key";
var LS_META = "staylegal.syncmeta.v1";
var LS_LAST = "staylegal.lastsync.v1";
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

function checkKey(c){ return (c.cityId || "") + "|" + (c.address || ""); }

/* Map app state -> flat record list. S = { checks: [...] }. */
function stateToRecords(S){
  var R = [];
  (S.checks || []).forEach(function(c){
    if (c && c.cityId) R.push({ collection: "checks", key: checkKey(c), value: c });
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

function upsertIntoState(S, collection, key, value){
  if (collection !== "checks") return;
  S.checks = S.checks || [];
  var ex = null;
  for (var i = 0; i < S.checks.length; i++){
    if (S.checks[i] && checkKey(S.checks[i]) === key){ ex = S.checks[i]; break; }
  }
  if (ex) Object.assign(ex, value);
  else S.checks.push(value);
}
function removeFromState(S, collection, key){
  if (collection !== "checks") return;
  S.checks = (S.checks || []).filter(function(c){ return !c || checkKey(c) !== key; });
}

/* node test export */
if (typeof module !== "undefined" && module.exports){
  module.exports = { stateToRecords: stateToRecords, applyRecords: applyRecords,
    hashRecord: hashRecord, upsertIntoState: upsertIntoState,
    removeFromState: removeFromState, checkKey: checkKey };
  return;
}

/* ---------- browser glue ---------- */
if (!window.__staylegal) return; // app.js must load first

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
    el.className = "syncpill " + (s === "synced" ? "ok" : s === "offline" ? "" : s === "error" ? "crit" : "warn");
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
  var S = window.__staylegal.getS();
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
  if (!out.length){ setStatus("synced"); return; }
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
    var S = window.__staylegal.getS();
    applyingRemote = true;
    var changed = applyRecords(S, data.records || [], meta);
    if (changed){
      saveMeta();
      window.__staylegal.saveLocal(); // persist without triggering a push
      window.__staylegal.refresh();
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

/* Self-styled settings UI (injected styles so no app CSS dependency). */
function injectStyles(){
  if (document.getElementById("syncbox-css")) return;
  var st = document.createElement("style");
  st.id = "syncbox-css";
  st.textContent =
    ".syncbox{border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#fff;margin:12px 0;font-size:14px;color:#1e293b}" +
    ".syncbox h4{margin:0 0 10px;font-size:15px}" +
    ".syncrow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0}" +
    ".syncpill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#e2e8f0;color:#475569}" +
    ".syncpill.ok{background:#dcfce7;color:#166534}.syncpill.warn{background:#fef9c3;color:#854d0e}.syncpill.crit{background:#fee2e2;color:#991b1b}" +
    ".synckey{font-family:ui-monospace,monospace;font-size:11px;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;margin:6px 0;max-height:60px;overflow:auto}" +
    ".syncbtn{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:10px 14px;font-size:14px;font-weight:600;touch-action:manipulation;cursor:pointer}" +
    ".syncbtn.primary{background:#1d4ed8;color:#fff;border-color:#1d4ed8;margin-top:8px;width:100%}" +
    ".syncinput{width:100%;font-size:16px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-top:6px;box-sizing:border-box}" +
    ".syncnote{font-size:12px;color:#64748b;margin:8px 0 0;line-height:1.5}";
  document.head.appendChild(st);
}

function renderSettingsUI(){
  injectStyles();
  var host = document.querySelector("#syncBoxHost");
  if (!host || host.querySelector("#syncBox")) return;
  var box = document.createElement("div");
  box.id = "syncBox";
  box.className = "syncbox";
  box.innerHTML =
    '<h4>Device sync <span style="font-weight:normal;color:#64748b">(prototype)</span></h4>' +
    '<div class="syncrow"><span>Status</span><span id="syncStatus" class="syncpill">…</span></div>' +
    '<p class="syncnote">Same key on two devices = your saved checks on both. ' +
    'Anyone with the key can read your records.</p>' +
    '<div class="synckey" id="syncKeyView">…</div>' +
    '<div class="syncrow"><span>Device key</span><button class="syncbtn" id="syncCopy">Copy</button></div>' +
    '<label style="font-size:13px">Use a key from another device<input id="syncPaste" class="syncinput" type="text" placeholder="paste 64-char key" maxlength="64" autocapitalize="off" spellcheck="false"></label>' +
    '<button class="syncbtn primary" id="syncUse">Switch to this key</button>';
  host.appendChild(box);
  box.querySelector("#syncKeyView").textContent = deviceKey || "(registering…)";
  setStatus(status);
  var cp = box.querySelector("#syncCopy");
  cp.onclick = function(){
    var done = function(){ cp.textContent = "Copied!"; setTimeout(function(){ cp.textContent = "Copy"; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(deviceKey || "").then(done, function(){ prompt("Copy device key:", deviceKey); });
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
    box.querySelector("#syncKeyView").textContent = v;
    lastPushed = snapshot(stateToRecords(window.__staylegal.getS()));
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
    } catch(e){ setStatus("offline"); return; }
  }
  // Fresh device: push existing local data up. Existing device: pull first.
  lastPushed = snapshot(stateToRecords(window.__staylegal.getS()));
  if (fresh){ await pushDirty(); }
  else { await pull(); }
  setInterval(pull, PULL_INTERVAL_MS);
  window.addEventListener("online", pull);
  if (document.querySelector("#syncBoxHost")) renderSettingsUI();
}

/* hooks consumed by app.js */
window.__staylegalSync = { onSave: onSave };
window.__staylegalSyncUI = renderSettingsUI;
window.__staylegalSyncPull = pull;   // exposed for testing
window.__staylegalSyncPush = pushDirty;
window.__staylegalSyncStatus = function(){ return status; };

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();

})();
