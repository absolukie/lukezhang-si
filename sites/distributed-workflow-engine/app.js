/* Durable Flow console UI. The engine (engine.js) owns all state; this file only
 * renders projections and forwards user intent as engine calls. */
(function () {
"use strict";
const E = DurableFlow;
const $ = (id) => document.getElementById(id);

const SPEEDS = [1, 5, 30, 300];
let speed = 5;
let S = E.createSim();
let selectedRun = null;
let lastSeq = 0;

function fmtDur(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600),
        m = Math.floor(sec % 3600 / 60), s = sec % 60;
  const p = (n) => String(n).padStart(2, "0");
  if (d > 0) return d + "d " + p(h) + "h";
  if (h > 0) return h + "h " + p(m) + "m";
  if (m > 0) return m + "m " + p(s) + "s";
  return s + "s";
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

let toastT = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 4200);
}

/* ---------------- event log ---------------- */
const FILTERS = {
  all:    () => true,
  task:   (e) => ["task_scheduled","task_started","task_completed","compensation_started"].includes(e.type),
  timer:  (e) => ["timer_started","timer_fired"].includes(e.type),
  signal: (e) => ["signal_awaited","signal_received"].includes(e.type),
  worker: (e) => ["worker_died","worker_revived"].includes(e.type),
  chaos:  (e) => ["chaos","chaos_armed","task_failed","workflow_failed","info",
             "step_skipped","signals_cleared","timers_cleared","saga_started","worker_slowed"].includes(e.type),
};
function fmtEvent(e) {
  const ts = "[T+" + fmtDur(e.t) + "]";
  const sq = "#" + String(e.seq).padStart(4, "0");
  const head = `<span class="ts">${ts}</span> <span class="sq">${sq}</span> `;
  const run = e.runId ? ` · <b>${esc(e.runId)}</b>` : "";
  switch (e.type) {
    case "workflow_started": return { cls: "wf", html: head + `WORKFLOW_STARTED${run} · "${esc(e.name)}" @${esc(e.version)} · queue ${esc(e.queue)}` };
    case "task_scheduled": {
      const nb = e.notBefore > e.t ? ` · not before T+${fmtDur(e.notBefore)}` : "";
      return { cls: "task", html: head + `TASK_SCHEDULED${run} · "${esc(e.name)}" · attempt ${e.attempt}${nb} · <span class="ts">idem ${esc(e.idem)}</span>` };
    }
    case "task_started": return { cls: "task", html: head + `TASK_STARTED${run} · "${esc(e.name)}" · attempt ${e.attempt} → ${esc(e.wid)} · <span class="ts">idem ${esc(e.idem)}</span>` };
    case "task_completed":
      return e.isComp
        ? { cls: "comp", html: head + `COMPENSATION_DONE${run} · "${esc(e.compName)}" · ${e.duration.toFixed(1)}s` }
        : { cls: "task", html: head + `TASK_COMPLETED${run} · "${esc(e.name)}" · attempt ${e.attempt} · ${e.duration.toFixed(1)}s` };
    case "task_failed": return { cls: "chaos", html: head + `✖ TASK_FAILED${run} · "${esc(e.name || e.stepId)}" · attempt ${e.attempt} · ${esc(e.error)}${e.willRetry ? " · <b>will retry</b>" : " · <b>FINAL</b>"}` };
    case "timer_started": return { cls: "timer", html: head + `TIMER_STARTED${run} · "${esc(e.name)}" · fires at T+${fmtDur(e.fireAt)}` };
    case "timer_fired": return { cls: "timer", html: head + `TIMER_FIRED${run} · "${esc(e.name)}"` };
    case "signal_awaited": return { cls: "signal", html: head + `SIGNAL_AWAITED${run} · "${esc(e.name)}" · waiting for <b>${esc(e.signal)}</b>` };
    case "signal_received": return { cls: "signal", html: head + `SIGNAL_RECEIVED${run} · "${esc(e.signal)}" → <b>${e.approved ? "APPROVED" : "REJECTED"}</b>` };
    case "signal_completed": return null; // state change visible in the DAG; signal_received carries the story
    case "step_skipped": return { cls: "chaos", html: head + `↷ STEP_SKIPPED${run} · "${esc(e.name)}" (saga rollback)` };
    case "signals_cleared": return { cls: "chaos", html: head + `… cleared ${e.count} pending signal${e.count === 1 ? "" : "s"}${run} (saga rollback)` };
    case "timers_cleared": return { cls: "chaos", html: head + `… cleared ${e.count} pending timer${e.count === 1 ? "" : "s"}${run} (saga rollback)` };
    case "saga_started": return { cls: "comp", html: head + `↩ SAGA_ROLLBACK${run} · ${esc(e.msg)}` };
    case "worker_slowed": return { cls: "chaos", html: head + `🐢 WORKER_SLOWED · ${esc(e.msg)}` };
    case "chaos_armed": return { cls: "chaos", html: head + `☠ CHAOS · ${esc(e.msg)}` };
    case "fault_consumed": return null; // bookkeeping; the TASK_FAILED line tells the story
    case "compensation_started": return { cls: "comp", html: head + `↩ COMPENSATION${run} · "${esc(e.name)}" (saga rollback)` };
    case "workflow_completed": return { cls: "wf", html: head + `✔ WORKFLOW_COMPLETED${run} · elapsed ${fmtDur(e.elapsed)}` };
    case "workflow_failed": return { cls: "chaos", html: head + `✖ WORKFLOW_FAILED${run} · ${esc(e.reason)}${e.compensated ? " · compensations complete" : ""}` };
    case "worker_died": return { cls: "chaos", html: head + `☠ WORKER_DIED · ${esc(e.msg)}` };
    case "worker_revived": return { cls: "worker", html: head + `♥ WORKER_REVIVED · ${esc(e.msg)}` };
    case "chaos": return { cls: "chaos", html: head + `☠ CHAOS · ${esc(e.msg)}` };
    case "info": return { cls: "info", html: head + `… ${esc(e.msg)}` };
    default: return null; // worker_heartbeat and friends stay out of the log
  }
}
function appendLog() {
  const box = $("elog"), f = FILTERS[$("logfilter").value] || FILTERS.all;
  let added = 0;
  for (const e of S.events) {
    if (e.seq <= lastSeq) continue;
    lastSeq = Math.max(lastSeq, e.seq);
    if (!f(e)) continue;
    const r = fmtEvent(e);
    if (!r) continue;
    const div = document.createElement("div");
    div.className = "el " + r.cls; div.innerHTML = r.html;
    box.appendChild(div); added += 1;
  }
  while (box.children.length > 600) box.removeChild(box.firstChild);
  if (added && $("autoscroll").checked) box.scrollTop = box.scrollHeight;
}

/* ---------------- panels ---------------- */
function renderClock() { $("vclock").textContent = "T+" + fmtDur(S.vnow); }

function renderStats() {
  const st = S.stats;
  $("stats").innerHTML =
    stat("runs", st.workflows) + stat("completed", st.completed, "ok") +
    stat("failed", st.failed, "bad") + stat("tasks done", st.tasks) +
    stat("retries", st.retries) + stat("compensations", st.compensations) +
    stat("events", S.events.length, "acc");
  function stat(l, v, c) { return `<div class="stat">${l}<b class="${c || ""}">${v}</b></div>`; }
}

function renderDefs() {
  $("defs").innerHTML = Object.values(E.DEFINITIONS).map((d) => `
    <div class="def"><div class="grow">
      <div class="nm">${esc(d.name)}<span class="ver">${esc(d.version)}</span></div>
      <div class="bl">${esc(d.blurb)}</div>
      <div class="hist">${d.history.map(esc).join(" &nbsp;·&nbsp; ")}${d.cron ? " &nbsp;·&nbsp; cron " + esc(d.cron) : ""}</div>
    </div><button class="btn primary" data-run="${d.id}">▶ run</button></div>`).join("");
  $("defs").querySelectorAll("[data-run]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = E.startRun(S, b.dataset.run);
      selectedRun = id;
      toast("▶ started " + id + " — watch the event log");
      renderAll();
    }));
}

function renderRunTabs() {
  const ids = Object.keys(S.runs);
  if (!ids.length) { $("runtabs").innerHTML = `<span class="empty">no runs yet — start one above</span>`; return; }
  if (!selectedRun || !S.runs[selectedRun]) selectedRun = ids[ids.length - 1];
  $("runtabs").innerHTML = ids.map((id) => {
    const r = S.runs[id];
    const dot = r.state === "running" ? "var(--acc)" : r.state === "completed" ? "var(--ok)" : "var(--bad)";
    return `<button class="rtab${id === selectedRun ? " on" : ""}" data-id="${id}"><span class="dot" style="background:${dot}"></span>${esc(id)}</button>`;
  }).join("");
  $("runtabs").querySelectorAll(".rtab").forEach((b) =>
    b.addEventListener("click", () => { selectedRun = b.dataset.id; renderAll(); }));
}

const KIND_ICON = { task: "⚙", timer: "⏱", signal: "✋" };
function renderDag() {
  const run = S.runs[selectedRun];
  if (!run) { $("dag").innerHTML = `<span class="empty">pick a run to see its DAG</span>`; $("runmeta").textContent = ""; return; }
  const def = E.DEFINITIONS[run.defId];
  const cols = {};
  def.steps.forEach((s) => {
    const d = E.depthOf(def, s.id);
    (cols[d] = cols[d] || []).push(s);
  });
  $("dag").innerHTML = Object.keys(cols).sort((a, b) => a - b).map((d) => `
    <div class="dcol">${cols[d].map((s) => {
      const st = run.steps[s.id];
      const deps = (s.deps || []).length ? `<div class="deps">← ${s.deps.map(esc).join(", ")}</div>` : "";
      const meta = [
        st.attempts > 1 ? `attempt ${st.attempts}` : null,
        st.worker && st.state === "running" ? esc(st.worker) : null,
        st.note ? esc(st.note) : null,
        s.kind === "timer" ? "timer " + fmtDur(s.timer) : null,
        s.kind === "signal" ? "signal:" + esc(s.signal) : null,
      ].filter(Boolean).join(" · ");
      return `<div class="dnode st-${st.state}">
        <div class="t">${KIND_ICON[s.kind] || "⚙"} ${esc(s.name)}</div>
        ${meta ? `<div class="meta">${meta}</div>` : ""}${deps}
        <span class="badge b-${st.state}">${st.state.toUpperCase()}</span>
      </div>`;
    }).join("")}</div>`).join("");
  $("runmeta").textContent =
    `${run.runId} · ${run.name} @${run.version} · state ${run.state}` +
    (run.finishedAt != null ? ` · finished T+${fmtDur(run.finishedAt)}` : "");
}

function renderWorkers() {
  $("queueinfo").textContent = `queue ${S.queue.length} · timers ${S.timers.length} · inflight ${Object.keys(S.inflight).length}`;
  $("workers").innerHTML = Object.values(S.workers).map((w) => {
    const ago = S.vnow - w.lastHb;
    const hb = w.alive
      ? `<div class="hb">♥ heartbeat ${ago < 2 ? "just now" : fmtDur(ago) + " ago"}</div>`
      : `<div class="hb flat">✖ flatlined — ${fmtDur(ago)} without heartbeat</div>`;
    const slow = w.slowUntil > S.vnow;
    const c = S.inflight[w.id];
    const cur = c
      ? `▶ ${esc(c.isComp ? c.compName : (S.runs[c.runId] ? stepName(c.runId, c.stepId) : c.stepId))} <span style="color:var(--dim)">(att ${c.attempt}${w.alive ? "" : ", ORPHANED"})</span>`
      : `<span style="color:var(--dim)">${w.alive ? "idle" : "dead"}</span>`;
    const btns = w.alive
      ? `<button class="btn danger" data-kill="${w.id}">☠ kill</button><button class="btn ghost" data-slow="${w.id}">🐢 slow</button>`
      : `<button class="btn primary" data-revive="${w.id}">♥ revive</button>`;
    return `<div class="wcard${w.alive ? "" : " dead"}">
      <div class="wn"><span class="hb-dot ${w.alive ? (slow ? "slow" : "alive") : "dead"}"></span>${esc(w.id)}${slow ? ' <span class="badge b-waiting">SLOW</span>' : ""}</div>
      ${hb}<div class="cur">${cur}</div>
      <div class="hb" style="margin-top:4px">${w.done} tasks done${w.replayed ? ` · replayed ${w.replayed} events on revive` : ""}</div>
      <div class="row">${btns}</div></div>`;
  }).join("");
  $("workers").querySelectorAll("[data-kill]").forEach((b) =>
    b.addEventListener("click", () => { E.killWorker(S, b.dataset.kill); renderAll(); }));
  $("workers").querySelectorAll("[data-revive]").forEach((b) =>
    b.addEventListener("click", () => { E.reviveWorker(S, b.dataset.revive); toast("♥ " + b.dataset.revive + " revived — replayed the log to rebuild state"); renderAll(); }));
  $("workers").querySelectorAll("[data-slow]").forEach((b) =>
    b.addEventListener("click", () => { E.slowWorker(S, b.dataset.slow, 120); renderAll(); }));
}
function stepName(runId, stepId) {
  const r = S.runs[runId]; if (!r) return stepId;
  const s = E.DEFINITIONS[r.defId].steps.find((x) => x.id === stepId);
  return s ? s.name : stepId;
}

function renderTimers() {
  const t = $("timers");
  t.innerHTML = S.timers.length ? S.timers.map((x) =>
    `<div class="trow"><div class="tn">⏱ ${esc(x.name)}</div>
     <div class="tc">${esc(x.runId)} · fires in <b>${fmtDur(x.fireAt - S.vnow)}</b> (T+${fmtDur(x.fireAt)})</div></div>`).join("")
    : `<div class="empty">no pending timers — run the research pipeline for a 30-day one</div>`;
}

function renderSignals() {
  const s = $("signals");
  s.innerHTML = S.signals.length ? S.signals.map((x) =>
    `<div class="srow"><div class="sn">✋ ${esc(x.name)}</div>
     <div class="sc">${esc(x.runId)} · awaiting signal <b>${esc(x.signal)}</b></div>
     <div class="row"><button class="btn primary" data-appr="${esc(x.runId)}|${esc(x.signal)}">Approve</button>
     <button class="btn danger" data-rej="${esc(x.runId)}|${esc(x.signal)}">Reject</button></div></div>`).join("")
    : `<div class="empty">no pending human approvals</div>`;
  s.querySelectorAll("[data-appr]").forEach((b) => b.addEventListener("click", () => {
    const [runId, sig] = b.dataset.appr.split("|");
    E.sendSignal(S, runId, sig, true); renderAll();
  }));
  s.querySelectorAll("[data-rej]").forEach((b) => b.addEventListener("click", () => {
    const [runId, sig] = b.dataset.rej.split("|");
    E.sendSignal(S, runId, sig, false);
    toast("✋ rejected — saga rolling back"); renderAll();
  }));
}

function renderAll() {
  appendLog();
  renderClock(); renderStats(); renderRunTabs(); renderDag();
  renderWorkers(); renderTimers(); renderSignals();
}

/* ---------------- controls ---------------- */
function buildSpeedRow() {
  $("speedrow").innerHTML = "";
  SPEEDS.forEach((sp) => {
    const b = document.createElement("button");
    b.textContent = sp + "×"; b.className = sp === speed ? "on" : "";
    b.title = sp + " virtual seconds per tick";
    b.addEventListener("click", () => {
      speed = sp;
      $("speedrow").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
    });
    $("speedrow").appendChild(b);
  });
}

function doReplay() {
  const t0 = performance.now();
  const keep = { failNext: S.failNext, autoSchedule: S.autoSchedule, nextCron: S.nextCron };
  S = E.replay(S.events, keep);
  lastSeq = 0; $("elog").innerHTML = "";
  const ms = (performance.now() - t0).toFixed(1);
  toast(`⟲ replayed ${S.events.length} events in ${ms}ms — every panel rebuilt from the log alone`);
  renderAll();
}

function wire() {
  buildSpeedRow();
  const seg = $("modeseg");
  if (seg && seg.querySelectorAll) seg.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.mode)));
  $("btn-replay").addEventListener("click", doReplay);
  $("btn-replay2").addEventListener("click", doReplay);
  $("btn-failnext").addEventListener("click", () => { E.failNextTask(S); toast("💥 fault armed — the next task to finish will fail"); renderAll(); });
  $("btn-skip").addEventListener("click", () => {
    const j = E.skipToNext(S);
    toast(j > 0 ? `⏩ fast-forwarded ${fmtDur(j)} to the next timer` : "nothing to skip to");
    renderAll();
  });
  $("btn-cron").addEventListener("click", (ev) => {
    S.autoSchedule = !S.autoSchedule;
    ev.currentTarget.setAttribute("aria-pressed", String(S.autoSchedule));
    ev.currentTarget.textContent = S.autoSchedule ? "🕑 Cron: on (0 2 * * *)" : "🕑 Cron: off";
    toast(S.autoSchedule ? "🕑 cron armed — nightly ETL fires at virtual 02:00" : "🕑 cron off");
  });
  $("btn-reset").addEventListener("click", () => {
    S = E.createSim(); lastSeq = 0; selectedRun = null; $("elog").innerHTML = "";
    renderDefs(); renderAll();
  });
  $("logfilter").addEventListener("change", () => {
    lastSeq = 0; $("elog").innerHTML = ""; appendLog();
    if ($("autoscroll").checked) $("elog").scrollTop = $("elog").scrollHeight;
  });
}

/* ---------------- mode toggle (sandbox ↔ live) ---------------- */
let mode = "sandbox";
function setMode(m) {
  mode = m;
  if (typeof document !== "undefined" && document.body && document.body.classList)
    document.body.classList.toggle("mode-live", m === "live");
  const seg = $("modeseg");
  if (seg && seg.querySelectorAll) seg.querySelectorAll("button").forEach((b) =>
    b.classList.toggle("on", b.dataset.mode === m));
  if (m === "live") {
    if (typeof LiveFlow !== "undefined") LiveFlow.init();
  } else {
    // live mode cleared the shared log; rebuild the sandbox view from its log
    lastSeq = 0; $("elog").innerHTML = ""; renderAll();
  }
}

/* ---------------- boot ---------------- */
wire();
renderDefs();
selectedRun = E.startRun(S, "etl"); // something alive on load
renderAll();
setInterval(() => { if (mode === "sandbox") { E.advance(S, speed); renderAll(); } }, 200);
})();
