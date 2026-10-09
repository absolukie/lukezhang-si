/* Curbside sync - PROTOTYPE.
 * Local-first sync to sprint-backend-proto (https://sync-proto.lukezhang.si).
 * Additive: the app works fully offline; sync never blocks the UI.
 * Prototype-grade auth: a random per-device key stored in localStorage.
 * Anyone holding the key can read/write this device's records.
 * Pure merge functions are exported for node testing (no DOM needed).
 */
(function(){
"use strict";

var WORKER = "https://sync-proto.lukezhang.si";
var APP = "curbside";
var LS_DEVICE = "curbside.device_key";
var LS_META = "curbside.syncmeta.v1";
var LS_LAST = "curbside.lastsync.v1";
var LS_BASE = "curbside.syncbase.v1";
var LS_BIG = "curbside.oversized.v1";
/* Matches the server's /v1/sync/push cap. The server rejects the WHOLE batch
 * when any record exceeds this, so oversized records must be filtered
 * client-side and surfaced in the UI instead of being marked acknowledged. */
var MAX_RECORD_BYTES = 100000;
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
function stateToRecords(S){
  var R = [];
  function put(collection, key, value){ R.push({ collection: collection, key: key, value: value }); }
  (S.permits || []).forEach(function(p){
    put("permits", p.id, { status: p.status, expires: p.expires, cost: p.cost, expiresEst: !!p.expiresEst, city: p.city || null });
  });
  (S.customDefs || []).forEach(function(d){ put("permit_defs", d.id, d); });
  Object.keys(S.locations || {}).forEach(function(k){ put("locations", k, S.locations[k]); });
  (S.events || []).forEach(function(e){ put("events", e.id, e); });
  (S.revenue || []).forEach(function(r){ put("revenue", r.id, r); });
  put("commissary", "main", S.commissary || {});
  put("settings", "main", { truckName: S.truckName, city: S.city,
    truckType: S.truckType, onboarded: S.onboarded, extraCities: S.extraCities || [] });
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
  if (collection === "permits"){
    ex = findById(S.permits, key);
    if (ex) Object.assign(ex, value); else S.permits.push(Object.assign({ id: key }, value));
  } else if (collection === "permit_defs"){
    S.customDefs = S.customDefs || [];
    ex = findById(S.customDefs, key);
    if (ex) Object.assign(ex, value); else S.customDefs.push(value);
  } else if (collection === "locations"){
    S.locations = S.locations || {}; S.locations[key] = value;
  } else if (collection === "events"){
    ex = findById(S.events, key);
    if (ex) Object.assign(ex, value); else S.events.push(value);
  } else if (collection === "revenue"){
    ex = findById(S.revenue, key);
    if (ex) Object.assign(ex, value); else S.revenue.push(value);
  } else if (collection === "commissary"){
    S.commissary = value;
  } else if (collection === "settings"){
    S.truckName = value.truckName; S.city = value.city;
    S.truckType = value.truckType; S.onboarded = value.onboarded;
    if (Array.isArray(value.extraCities)) S.extraCities = value.extraCities;
  }
}
function removeFromState(S, collection, key){
  function drop(arr){ return (arr || []).filter(function(x){ return !x || x.id !== key; }); }
  if (collection === "permits") S.permits = drop(S.permits);
  else if (collection === "permit_defs") S.customDefs = drop(S.customDefs);
  else if (collection === "locations"){ if (S.locations) delete S.locations[key]; }
  else if (collection === "events") S.events = drop(S.events);
  else if (collection === "revenue") S.revenue = drop(S.revenue);
}

/* node test export */
if (typeof module !== "undefined" && module.exports){
  module.exports = { stateToRecords: stateToRecords, applyRecords: applyRecords,
    hashRecord: hashRecord, upsertIntoState: upsertIntoState,
    removeFromState: removeFromState };
  return;
}

/* ---------- browser glue ---------- */
if (!window.__curbside) return; // app.js must load first

var deviceKey = null;
var meta = {};
var lastPushed = {};   // "collection:key" -> hash; baseline of server-acknowledged state, PERSISTED
var lastSync = 0;
var applyingRemote = false;
var pushTimer = null;
var inflight = 0;      // pushes/pulls currently in flight
var status = "starting"; // starting|syncing|offline|pending|synced (see updatePill)

try { meta = JSON.parse(localStorage.getItem(LS_META) || "{}") || {}; } catch(e){ meta = {}; }
try { lastSync = +localStorage.getItem(LS_LAST) || 0; } catch(e){}
/* Outbox durability: the acknowledged baseline survives reloads. Never snapshot
 * the live state as acknowledged here - anything differing from the baseline is
 * unpushed work that must stay visible in the pill and go up on the next push. */
try { lastPushed = JSON.parse(localStorage.getItem(LS_BASE) || "{}") || {}; } catch(e){ lastPushed = {}; }
function saveMeta(){ try{ localStorage.setItem(LS_META, JSON.stringify(meta)); }catch(e){} }
function saveLastSync(){ try{ localStorage.setItem(LS_LAST, String(lastSync)); }catch(e){} }
function saveBaseline(){ try{ localStorage.setItem(LS_BASE, JSON.stringify(lastPushed)); }catch(e){} }


/* Records that differ from the last acknowledged push (the outbox). */
/* Records that differ from the last acknowledged push (the outbox).
 * Records over MAX_RECORD_BYTES are filtered out of the push batch (the server
 * rejects the whole batch when any record is oversized) and tracked in the
 * oversized map instead of being marked acknowledged. */
function diffOut(){
  var S = window.__curbside.getS();
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
 * "Syncing…" while a push/pull is in flight;
 * "Offline" when the network is down;
 * "Not synced - N changes pending" whenever work is unacknowledged. */
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
      return '<li>' + escHtml(mk) + ' \u00b7 ' + kb +
        ' KB (100 KB cap). Saved on this device only.</li>';
    }).join("") + '</ul></div>';
}

/* The one honest status function. Five states, derived from real conditions:
 * "Synced" only when nothing is pending, nothing oversized, and nothing in flight;
 * "Syncing..." while a push/pull is in flight;
 * "Offline" when the network is down;
 * "Not synced - N changes pending" whenever sendable work is unacknowledged;
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
  document.querySelectorAll(".sync-status").forEach(function(el){
    el.textContent = label; el.className = "pill sync-status" + (cls ? " " + cls : "");
  });
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
/* Push locally-changed records. Diffed against the persisted lastPushed
 * baseline; deletions become tombstones automatically. Idempotent by key;
 * safe to retry. The baseline only advances on success - a failed push keeps
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
 * whole state - local-only work stays unacknowledged and keeps its pill. */
async function pull(){
  if (!deviceKey || applyingRemote) return;
  inflight++; updatePill();
  try {
    var data = await api("/v1/sync/pull?app=" + APP + "&since=" + lastSync);
    var S = window.__curbside.getS();
    var applied = {};
    (data.records || []).forEach(function(r){
      var mk = r.collection + ":" + r.key;
      if (r.updated_at > (meta[mk] || 0)) applied[mk] = !!r.deleted;
    });
    applyingRemote = true;
    var changed = applyRecords(S, data.records || [], meta);
    if (changed){
      /* P1-2 (red2): synced records take the same unguarded path as imports;
       * clamp free-text fields so a long string from another device cannot
       * blow out the phone layout. */
      try { if (window.__curbside && window.__curbside.sanitizeState) window.__curbside.sanitizeState(S); } catch(se){}
      saveMeta();
      window.__curbside.saveLocal(); // persist without triggering a push
      window.__curbside.refresh();
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


/* Settings sheet UI (injected by app.js hook). */
function renderSettingsUI(){
  var sheet = document.querySelector("#sheet");
  if (!sheet || sheet.querySelector("#syncBox")) return;
  var box = document.createElement("div");
  box.id = "syncBox";
  box.className = "card";
  box.style.marginTop = "12px";
  box.innerHTML =
    '<h4>Device sync <span class="muted" style="font-weight:normal">(prototype)</span></h4>' +
    '<div class="set-row"><span>Status</span><span class="pill sync-status">…</span></div>' +
    '<p style="font-size:12px;color:#64748b;margin:8px 0 0;line-height:1.5">Prototype backup cap: each record may be up to 100 KB. Larger records stay on this device only and are listed below.</p>' +
    '<div id="syncBigWarn"></div>' +
    '<p class="muted" style="font-size:12px">Same key on two devices = same data. ' +
    'Anyone with the key can read your records.</p>' +
    '<div class="set-row"><span>Device key</span><button class="link-btn" id="syncCopy">Copy</button></div>' +
    '<label>Use a key from another device<input id="syncPaste" type="text" placeholder="paste 64-char key" maxlength="64" style="font-size:12px"></label>' +
    '<button class="btn small" id="syncUse" style="margin-top:6px">Switch to this key</button>';
  sheet.appendChild(box);
  updatePill();
  renderBigWarn();
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
window.__curbsideSync = { onSave: onSave };
window.__curbsideSyncUI = renderSettingsUI;
window.__curbsideSyncPull = pull;   // exposed for testing
window.__curbsideSyncPush = pushDirty;
window.__curbsideSyncStatus = function(){ return status; };

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
    /* P2-7 fix: LS_DEVICE and WORKER live in the first IIFE's scope and are
     * invisible here, so this IIFE always resolved SLUG to "" and every
     * report early-returned. Resolve the slug by scanning localStorage for
     * the device-key record instead. Resolution is lazy (at send time) so
     * first-boot crashes after async device registration still report. */
    var SLUG = "";
    function resolveSlug(){
      try {
        for (var ki = 0; ki < localStorage.length; ki++) {
          var kk = localStorage.key(ki) || "";
          var mm = /^(.+)\.device_key$/.exec(kk);
          if (mm) return mm[1];
        }
      } catch(e2){}
      return "";
    }
    var BASE = "https://sync-proto.lukezhang.si";
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
        try { key = localStorage.getItem(SLUG + ".device_key"); } catch(e){}
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
        if (!SLUG) SLUG = resolveSlug();
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
