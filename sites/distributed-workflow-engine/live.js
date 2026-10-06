/* ============================================================================
 * DURABLE FLOW — Live mode: real pipeline observability via GitHub Actions
 * ----------------------------------------------------------------------------
 * Sandbox mode simulates a cluster; Live mode shows REAL workflow executions:
 *   GitHub Actions run  → workflow run (real timestamps, no virtual clock)
 *   job                 → parallel task (jobs fan out, like the ETL transforms)
 *   step                → sequential DAG node inside its job
 *   conclusion          → terminal state (success / failure / cancelled…)
 *   run_attempt         → retry count
 * Fetches are cached aggressively in localStorage (runs 5 min, job detail
 * 15 min) because unauthenticated GitHub API calls are capped at 60/hour.
 * An optional personal token (stored only in this browser, sent only to
 * api.github.com) unlocks private repos and 5,000 calls/hour.
 * Live shows history, not a live tail: GitHub's API reports completed steps;
 * in-progress steps update when you hit refresh.
 * Mapping + cache logic is pure and unit-testable in node (see test/).
 * ========================================================================== */
(function (root) {
"use strict";

var API = "https://api.github.com";
var LS_KEY = "df_live_v1";
var LS_TOKEN = "df_live_token";
var TTL_RUNS = 5 * 60 * 1000;
var TTL_JOBS = 15 * 60 * 1000;

var REPOS = [
  { id: "absolukie/draw-and-guess", note: "Draw & Guess — real CI history" },
  { id: "absolukie/Flight-tracker", note: "Flight tracker — real CI history" },
  { id: "absolukie/get-clocked",    note: "Get Clocked — no Actions runs yet" },
];

/* ---------------- pure mapping ---------------- */
function isoDur(a, b) {
  if (!a || !b) return null;
  var s = (Date.parse(b) - Date.parse(a)) / 1000;
  return s >= 0 ? s : null;
}

/* GitHub status/conclusion → durable-flow node state. */
var STATE = {
  success: "completed", failure: "failed", cancelled: "failed",
  skipped: "skipped", neutral: "completed", timed_out: "failed",
  action_required: "waiting", stale: "failed",
  queued: "pending", in_progress: "running", requested: "pending",
  waiting: "waiting", pending: "pending",
};
function toState(status, conclusion) {
  if (status === "completed") return STATE[conclusion] || "completed";
  return STATE[status] || "running";
}

function mapRun(r) {
  return {
    id: r.id,
    name: r.name || r.display_title || ("run " + r.run_number),
    title: r.display_title || "",
    number: r.run_number,
    attempt: r.run_attempt || 1,
    status: r.status,
    conclusion: r.conclusion,
    state: toState(r.status, r.conclusion),
    branch: r.head_branch,
    event: r.event,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    durSec: isoDur(r.created_at, r.updated_at),
    url: r.html_url,
  };
}

function mapStep(s) {
  return {
    name: s.name,
    number: s.number,
    status: s.status,
    conclusion: s.conclusion,
    state: toState(s.status, s.conclusion),
    durSec: isoDur(s.started_at, s.completed_at),
    startedAt: s.started_at,
    completedAt: s.completed_at,
    boiler: /^(Set up job|Complete job|Post .+)$/.test(s.name || ""),
  };
}

function mapJob(j) {
  return {
    id: j.id,
    name: j.name,
    status: j.status,
    conclusion: j.conclusion,
    state: toState(j.status, j.conclusion),
    durSec: isoDur(j.started_at, j.completed_at),
    startedAt: j.started_at,
    completedAt: j.completed_at,
    url: j.html_url,
    steps: (j.steps || []).map(mapStep),
  };
}

/* Chronological durable-style events derived from a mapped run + jobs. */
function deriveEvents(run, jobs) {
  var evs = [];
  function at(t, cls, html) { if (t) evs.push({ t: t, cls: cls, html: html }); }
  at(run.createdAt, "wf",
    `RUN_STARTED · "${run.name}" #${run.number} · ${run.branch || "?"} · ${run.event || "?"}`);
  jobs.forEach(function (j) {
    at(j.startedAt, "task", `JOB_STARTED · "${j.name}"`);
    j.steps.forEach(function (s) {
      at(s.startedAt, "task", `STEP_STARTED · "${s.name}" · ${j.name}`);
      if (s.completedAt) {
        var fail = s.state === "failed";
        at(s.completedAt, fail ? "chaos" : "task",
          (fail ? "✖ STEP_FAILED" : "STEP_COMPLETED") + ` · "${s.name}" · ${j.name}` +
          (s.durSec != null ? ` · ${s.durSec.toFixed(1)}s` : ""));
      } else if (s.state === "skipped") {
        at(j.completedAt || run.updatedAt, "info", `… STEP_SKIPPED · "${s.name}" · ${j.name}`);
      }
    });
    if (j.completedAt) {
      var jf = j.state === "failed";
      at(j.completedAt, jf ? "chaos" : "task",
        (jf ? "✖ JOB_FAILED" : "JOB_COMPLETED") + ` · "${j.name}"` +
        (j.durSec != null ? ` · ${j.durSec.toFixed(1)}s` : ""));
    }
  });
  if (run.status === "completed" && run.updatedAt) {
    var rf = run.state === "failed";
    at(run.updatedAt, rf ? "chaos" : "wf",
      (rf ? "✖ RUN_FAILED" : "✔ RUN_COMPLETED") + ` · "${run.name}" #${run.number}` +
      (run.durSec != null ? ` · elapsed ${fmtDur(run.durSec)}` : "") +
      (run.attempt > 1 ? ` · attempt ${run.attempt}` : ""));
  }
  evs.sort(function (a, b) { return Date.parse(a.t) - Date.parse(b.t); });
  evs.forEach(function (e, i) { e.seq = i + 1; });
  return evs;
}

/* ---------------- cache ---------------- */
function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch (e) { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch (e) { /* private mode */ }
}
function cacheGet(c, repo, kind, key, ttl) {
  var r = c.repos && c.repos[repo];
  if (!r) return null;
  var e = r[kind + ":" + key];
  if (!e || Date.now() - e.ts > ttl) return null;
  return { data: e.data, ageMs: Date.now() - e.ts };
}
function cachePut(c, repo, kind, key, data) {
  c.repos = c.repos || {};
  c.repos[repo] = c.repos[repo] || {};
  c.repos[repo][kind + ":" + key] = { ts: Date.now(), data: data };
  // keep the cache small: only the newest runs list + a few job payloads
  var keys = Object.keys(c.repos[repo]);
  if (keys.length > 8) {
    keys.sort(function (a, b) { return c.repos[repo][a].ts - c.repos[repo][b].ts; });
    keys.slice(0, keys.length - 8).forEach(function (k) { delete c.repos[repo][k]; });
  }
  saveCache(c);
}

/* ---------------- API client ---------------- */
var lastRate = { remaining: null, reset: null };
function getToken() {
  try { return localStorage.getItem(LS_TOKEN) || ""; } catch (e) { return ""; }
}
function resetIn() {
  if (!lastRate.reset) return "a while";
  var s = Math.max(0, Math.round(lastRate.reset * 1000 - Date.now()) / 1000);
  return s > 90 ? Math.round(s / 60) + "m" : Math.round(s) + "s";
}
function gh(url) {
  var headers = { "Accept": "application/vnd.github+json" };
  var tok = getToken();
  if (tok) headers["Authorization"] = "Bearer " + tok;
  return fetch(url, { headers: headers }).then(function (res) {
    try {
      lastRate.remaining = res.headers.get("X-RateLimit-Remaining");
      lastRate.reset = parseInt(res.headers.get("X-RateLimit-Reset"), 10) || null;
    } catch (e) { /* ignore */ }
    if (res.status === 403 && String(lastRate.remaining) === "0") {
      var e1 = new Error("GitHub API rate limit hit (60 calls/hour without a token). " +
        "Wait " + resetIn() + ", or add a token below for 5,000/hour.");
      e1.code = "rate_limit"; throw e1;
    }
    if (res.status === 404) {
      var e2 = new Error("Repo not found — check the name, or add a token below: " +
        "private repos (like peggie) need one.");
      e2.code = "not_found"; throw e2;
    }
    if (res.status === 401) {
      var e4 = new Error("Token rejected (401) — it may be expired or lack repo scope. " +
        "Remove it below and retry without, or paste a fresh one.");
      e4.code = "bad_token"; throw e4;
    }
    if (!res.ok) {
      var e3 = new Error("GitHub API error " + res.status + " — try again in a bit.");
      e3.code = "http_" + res.status; throw e3;
    }
    return res.json();
  }, function () {
    var e = new Error("Can't reach api.github.com — check your connection and retry.");
    e.code = "network"; throw e;
  });
}

/* ---------------- formatting ---------------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g,
    function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
}
function fmtDur(sec) {
  if (sec == null) return "—";
  sec = Math.max(0, Math.floor(sec));
  var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600),
      m = Math.floor(sec % 3600 / 60), s = sec % 60;
  var p = function (n) { return String(n).padStart(2, "0"); };
  if (d > 0) return d + "d " + p(h) + "h";
  if (h > 0) return h + "h " + p(m) + "m";
  if (m > 0) return m + "m " + p(s) + "s";
  return s + "s";
}
function fmtClock(iso) {
  if (!iso) return "—";
  var d = new Date(iso);
  var p = function (n) { return String(n).padStart(2, "0"); };
  return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) + " " +
    p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + "Z";
}
function ageStr(ms) {
  var s = Math.round(ms / 1000);
  if (s < 60) return s + "s ago";
  var m = Math.round(s / 60);
  return m + "m ago";
}

/* ---------------- live state + rendering ---------------- */
var L = {
  ready: false, repo: REPOS[0].id, runs: [], jobsByRun: {},
  selectedRun: null, loading: false, err: null, runsCachedAge: null,
};

function $(id) { return document.getElementById(id); }

function renderRepoBar() {
  var opts = REPOS.map(function (r) {
    return `<option value="${esc(r.id)}"${r.id === L.repo ? " selected" : ""}>${esc(r.id)}</option>`;
  }).join("");
  var isCustom = !REPOS.some(function (r) { return r.id === L.repo; });
  if (isCustom) opts += `<option value="__custom" selected>${esc(L.repo)} (custom)</option>`;
  else opts += `<option value="__custom">custom owner/repo…</option>`;
  $("liverepo").innerHTML = `
    <div class="liverow">
      <select id="livesel" aria-label="repository">${opts}</select>
      <input id="livecustom" class="hidden" placeholder="owner/repo" value="${isCustom ? esc(L.repo) : ""}" aria-label="custom owner/repo">
      <button class="btn xs" id="liverefresh" title="bypass cache and refetch">⟳ refresh</button>
    </div>
    <div class="repometa">${esc((REPOS.find(function (r) { return r.id === L.repo; }) || {}).note || "custom repo")}</div>
    <details class="livedet"><summary>private repos? add a token (optional)</summary>
      <div class="liverow">
        <input id="livetoken" type="password" placeholder="ghp_…" autocomplete="off" aria-label="GitHub personal token">
        <button class="btn xs" id="livetokensave">save</button>
        <button class="btn xs ghost" id="livetokenclear">remove</button>
      </div>
      <div class="hint">Stored only in this browser. Sent only to api.github.com. Try <b>absolukie/peggie</b> or <b>absolukie/liverpool-rummy</b> with a token.</div>
    </details>
    <div id="liveerr" class="liveerr${L.err ? "" : " hidden"}"></div>
    <div id="liveapi" class="apinote"></div>`;
  if (L.err) {
    $("liveerr").innerHTML = `<b>⚠ ${esc(L.err.message)}</b>
      <div class="row"><button class="btn xs" id="liveerr-retry">retry</button></div>`;
    $("liveerr-retry").addEventListener("click", function () { loadRuns(true); });
  }
  $("livesel").addEventListener("change", function (ev) {
    var v = ev.target.value;
    if (v === "__custom") { $("livecustom").classList.remove("hidden"); $("livecustom").focus(); return; }
    $("livecustom").classList.add("hidden");
    setRepo(v);
  });
  $("livecustom").addEventListener("change", function (ev) {
    var v = ev.target.value.trim().replace(/^https?:\/\/github.com\//, "").replace(/\/$/, "");
    if (/^[\w.-]+\/[\w.-]+$/.test(v)) setRepo(v);
    else { L.err = new Error("Use the form owner/repo, e.g. absolukie/peggie"); renderRepoBar(); }
  });
  $("liverefresh").addEventListener("click", function () { loadRuns(true); });
  $("livetokensave").addEventListener("click", function () {
    var t = $("livetoken").value.trim();
    try { localStorage.setItem(LS_TOKEN, t); } catch (e) {}
    L.err = null; loadRuns(true);
  });
  $("livetokenclear").addEventListener("click", function () {
    try { localStorage.removeItem(LS_TOKEN); } catch (e) {}
    loadRuns(true);
  });
  renderApiNote();
}

function renderApiNote() {
  var el = $("liveapi");
  if (!el) return;
  var bits = [`<span class="mono">api.github.com</span>`];
  if (lastRate.remaining != null) bits.push(`${esc(lastRate.remaining)} calls left${getToken() ? " (token)" : " (no token · 60/hr)"}`);
  if (L.runsCachedAge != null) bits.push(`runs cached ${ageStr(L.runsCachedAge)}`);
  el.innerHTML = bits.join(" · ");
}

function setRepo(repo) {
  L.repo = repo; L.runs = []; L.jobsByRun = {}; L.selectedRun = null;
  L.err = null; L.runsCachedAge = null;
  renderRepoBar(); loadRuns(false);
}

function loadRuns(force) {
  L.loading = true; L.err = null; renderRepoBar();
  $("liveruns").innerHTML = `<span class="empty">loading runs…</span>`;
  var url = API + "/repos/" + L.repo + "/actions/runs?per_page=10";
  var c = loadCache();
  if (!force) {
    var hit = cacheGet(c, L.repo, "runs", "", TTL_RUNS);
    if (hit) { L.runsCachedAge = hit.ageMs; gotRuns(hit.data, true); return; }
  }
  gh(url).then(function (d) {
    var runs = (d.workflow_runs || []).map(mapRun);
    cachePut(c, L.repo, "runs", "", runs);
    L.runsCachedAge = 0;
    gotRuns(runs, false);
  }).catch(function (e) { L.loading = false; L.err = e; renderRepoBar();
    $("liveruns").innerHTML = `<span class="empty">no runs — fix the error above or pick another repo</span>`; });
}

function gotRuns(runs, cached) {
  L.loading = false; L.runs = runs;
  renderRepoBar();
  if (!runs.length) {
    $("liveruns").innerHTML = `<span class="empty">no Actions runs on ${esc(L.repo)} yet${cached ? " (cached)" : ""} — pick a repo with CI history</span>`;
    $("livedag").innerHTML = ""; $("liverunmeta").textContent = ""; renderStats(); renderLog([]);
    return;
  }
  L.selectedRun = runs[0].id;
  renderRunTabs(); loadJobs(runs[0]);
}

function renderRunTabs() {
  $("liveruns").innerHTML = L.runs.map(function (r) {
    var dot = r.state === "running" ? "var(--acc)" : r.state === "completed" ? "var(--ok)" : "var(--bad)";
    return `<button class="rtab${r.id === L.selectedRun ? " on" : ""}" data-id="${r.id}" title="${esc(r.title || r.name)}">
      <span class="dot" style="background:${dot}"></span>#${r.number}</button>`;
  }).join("");
  $("liveruns").querySelectorAll(".rtab").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = parseInt(b.dataset.id, 10);
      var run = L.runs.find(function (r) { return r.id === id; });
      if (run) { L.selectedRun = id; renderRunTabs(); loadJobs(run); }
    });
  });
}

function loadJobs(run) {
  var cached = L.jobsByRun[run.id];
  if (cached) { renderRun(run, cached); return; }
  $("livedag").innerHTML = `<span class="empty">loading jobs…</span>`;
  var url = API + "/repos/" + L.repo + "/actions/runs/" + run.id + "/jobs?per_page=30";
  var c = loadCache();
  var hit = cacheGet(c, L.repo, "jobs", String(run.id), TTL_JOBS);
  function done(jobs) { L.jobsByRun[run.id] = jobs; renderRun(run, jobs); }
  if (hit) { done(hit.data.map(mapJob)); return; }
  gh(url).then(function (d) {
    var jobs = (d.jobs || []).map(mapJob);
    cachePut(c, L.repo, "jobs", String(run.id), d.jobs || []);
    done(jobs);
  }).catch(function (e) { L.err = e; renderRepoBar();
    $("livedag").innerHTML = `<span class="empty">couldn't load jobs — see error above</span>`; });
}

function renderRun(run, jobs) {
  /* DAG: one column per job (they fan out), steps sequential inside. */
  $("livedag").innerHTML = jobs.length ? jobs.map(function (j) {
    var nodes = j.steps.map(function (s) {
      var meta = [
        s.durSec != null ? s.durSec.toFixed(1) + "s" : null,
        s.state === "running" ? "in progress" : null,
      ].filter(Boolean).join(" · ");
      return `<div class="dnode st-${s.state}${s.boiler ? " dim" : ""}">
        <div class="t">${esc(s.name)}</div>
        ${meta ? `<div class="meta">${esc(meta)}</div>` : ""}
        <span class="badge b-${s.state}">${s.state.toUpperCase()}</span></div>`;
    }).join("");
    return `<div class="dcol"><div class="djob">⚙ ${esc(j.name)}
      <span class="badge b-${j.state}">${j.state.toUpperCase()}</span>
      <div class="meta">${j.durSec != null ? esc(fmtDur(j.durSec)) : "…"}</div></div>${nodes}</div>`;
  }).join("") : `<span class="empty">no jobs reported for this run</span>`;

  $("liverunmeta").innerHTML =
    `#${run.number} · <b>${esc(run.title || run.name)}</b> · <span class="badge b-${run.state}">${run.state.toUpperCase()}</span>` +
    ` · ${esc(run.branch || "?")} · ${esc(run.event || "?")} · ${run.durSec != null ? esc(fmtDur(run.durSec)) : "in progress"}` +
    (run.attempt > 1 ? ` · attempt ${run.attempt}` : "") +
    (run.url ? ` · <a href="${esc(run.url)}" target="_blank" rel="noopener">view on GitHub ↗</a>` : "");
  renderStats();
  renderLog(deriveEvents(run, jobs));
}

function renderStats() {
  var ok = 0, bad = 0, run = 0, durs = [];
  L.runs.forEach(function (r) {
    if (r.state === "completed") { ok++; if (r.durSec != null) durs.push(r.durSec); }
    else if (r.state === "failed") bad++;
    else run++;
  });
  var avg = durs.length ? durs.reduce(function (a, b) { return a + b; }, 0) / durs.length : null;
  $("stats").innerHTML =
    stat("runs", L.runs.length) + stat("green", ok, "ok") + stat("red", bad, "bad") +
    stat("in flight", run) + stat("avg duration", avg != null ? fmtDur(avg) : "—") +
    stat("repo", esc(L.repo), "acc");
  function stat(l, v, c) { return `<div class="stat">${l}<b class="${c || ""}">${v}</b></div>`; }
}

function renderLog(evs) {
  var box = $("elog");
  box.innerHTML = "";
  evs.forEach(function (e) {
    var div = document.createElement("div");
    div.className = "el " + e.cls;
    div.innerHTML = `<span class="ts">[${fmtClock(e.t)}]</span> <span class="sq">#${String(e.seq).padStart(4, "0")}</span> ${e.html}`;
    box.appendChild(div);
  });
  if ($("autoscroll") && $("autoscroll").checked) box.scrollTop = box.scrollHeight;
}

/* ---------------- boot ---------------- */
function init() {
  if (L.ready) { /* re-entering live mode: repaint from memory */ renderRepoBar(); renderRunTabs();
    var run = L.runs.find(function (r) { return r.id === L.selectedRun; });
    if (run && L.jobsByRun[run.id]) renderRun(run, L.jobsByRun[run.id]);
    return; }
  L.ready = true;
  renderRepoBar();
  loadRuns(false);
}

var api = {
  mapRun: mapRun, mapJob: mapJob, mapStep: mapStep, deriveEvents: deriveEvents,
  toState: toState, isoDur: isoDur, fmtDur: fmtDur, fmtClock: fmtClock,
  cacheGet: cacheGet, cachePut: cachePut, TTL_RUNS: TTL_RUNS, TTL_JOBS: TTL_JOBS,
  init: init,
};
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.LiveFlow = api;
})(typeof self !== "undefined" ? self : this);
