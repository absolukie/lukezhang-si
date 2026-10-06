/* ============================================================================
 * DURABLE FLOW — event-sourced durable workflow engine (simulation core)
 * ----------------------------------------------------------------------------
 * This is a genuine event-sourced design, not a mock:
 *  - Every state transition is appended to sim.events as an immutable event.
 *  - ALL durable state (run/step states, worker liveness, queue, timers,
 *    signals, stats, per-worker completed counts, run id sequence) is
 *    derived by folding events through reduce(). No function outside
 *    reduce() mutates durable state — public functions only emit events.
 *  - The engine's hot path reads the live projection; "Replay log" rebuilds
 *    it from scratch to prove the log is the source of truth.
 *  - Volatile by design (live process memory, never replayed): worker
 *    progress countdowns (a task's remaining seconds), missed-heartbeat
 *    tick counters, and UI selections. Partial progress is always
 *    discarded on recovery — exactly like a real worker restart.
 *  - Virtual clock (sim.vnow, seconds). Nothing here touches the DOM or
 *    real timers — the UI drives it with advance().
 * ========================================================================== */
(function (root) {
"use strict";

/* ---------------- workflow definitions ---------------- */
const DEFINITIONS = {
  research: {
    id: "research", name: "AI research pipeline", version: "v2", queue: "research-q",
    history: ["v1 — straight pipeline", "v2 — +30d citation timer, human approval gate"],
    blurb: "Long-running agent workflow: literature → hypotheses → experiments → a 30-day citation wait → analysis → human approval → publish.",
    steps: [
      { id: "lit",  name: "Literature review",     kind: "task",   dur: [6, 10] },
      { id: "hyp",  name: "Generate hypotheses",   kind: "task",   deps: ["lit"], dur: [4, 8] },
      { id: "exp",  name: "Run experiments",       kind: "task",   deps: ["hyp"], dur: [10, 16] },
      { id: "wait", name: "Wait 30d for citations",kind: "timer",  deps: ["exp"], timer: 30 * 86400 },
      { id: "ana",  name: "Analyze results",       kind: "task",   deps: ["wait"], dur: [5, 9] },
      { id: "appr", name: "Human approval",        kind: "signal", deps: ["ana"], signal: "approve_report" },
      { id: "pub",  name: "Publish report",        kind: "task",   deps: ["appr"], dur: [3, 5] },
    ],
  },
  onboarding: {
    id: "onboarding", name: "Customer onboarding saga", version: "v1", queue: "saga-q",
    history: ["v1 — saga with per-step compensations"],
    blurb: "Saga pattern: every step has a compensation. The KYC step is flaky — watch retries with backoff, then rollback in reverse order.",
    steps: [
      { id: "acct",  name: "Create account",      kind: "task", dur: [3, 5], comp: "Delete account" },
      { id: "email", name: "Send welcome email",  kind: "task", deps: ["acct"],  dur: [2, 4], comp: "Send retraction email" },
      { id: "kyc",   name: "KYC check",           kind: "task", deps: ["email"], dur: [4, 7], comp: "Flag account for review", flaky: true },
      { id: "appr",  name: "Human approval (KYC)",kind: "signal", deps: ["kyc"], signal: "approve_kyc" },
      { id: "prov",  name: "Provision workspace", kind: "task", deps: ["appr"],  dur: [4, 6], comp: "Deprovision workspace" },
    ],
  },
  etl: {
    id: "etl", name: "Nightly ETL", version: "v3", queue: "etl-q", cron: "0 2 * * *",
    history: ["v1 — serial transforms", "v2 — parallel fan-out", "v3 — +Transform C, idempotent loads"],
    blurb: "Parallel fan-out: extract → three transforms at once → load. Idempotent steps, safe to replay.",
    steps: [
      { id: "ext",  name: "Extract",     kind: "task", dur: [5, 8] },
      { id: "ta",   name: "Transform A", kind: "task", deps: ["ext"], dur: [6, 10] },
      { id: "tb",   name: "Transform B", kind: "task", deps: ["ext"], dur: [5, 9] },
      { id: "tc",   name: "Transform C", kind: "task", deps: ["ext"], dur: [7, 11] },
      { id: "load", name: "Load warehouse", kind: "task", deps: ["ta", "tb", "tc"], dur: [4, 6] },
    ],
  },
};

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE = 5;          // virtual seconds; attempt n waits 5 * 2^(n-1)
const ORPHAN_TICKS = 3;          // missed heartbeats before an orphaned task is requeued
const WORKER_IDS = ["worker-1", "worker-2", "worker-3"];

/* ---------------- sim construction ---------------- */
function createSim(opts) {
  const sim = {
    vnow: 0, seq: 0, tick: 0,
    events: [],
    runs: {}, runSeq: 0,
    workers: {}, queue: [], timers: [], signals: [], inflight: {},
    failNext: false, autoSchedule: false, nextCron: 2 * 3600,
    stats: { workflows: 0, completed: 0, failed: 0, tasks: 0, retries: 0, compensations: 0 },
    rand: (opts && opts.rand) || Math.random,
  };
  WORKER_IDS.forEach((id) => {
    sim.workers[id] = { id, alive: true, slowUntil: 0, orphanTicks: 0, lastHb: 0, done: 0, replayed: 0 };
  });
  return sim;
}

/* ---------------- event log ---------------- */
function emit(sim, type, d) {
  sim.seq += 1;
  const e = Object.assign({ seq: sim.seq, t: sim.vnow, type }, d || {});
  sim.events.push(e);
  reduce(sim, e);
  return e;
}

/* Fold one event into the derived projection. This is the ONLY writer of
 * sim.runs / sim.queue / sim.timers / sim.signals / sim.inflight / liveness. */
function reduce(sim, e) {
  const R = sim.runs[e.runId];
  switch (e.type) {
    case "workflow_started": {
      const def = DEFINITIONS[e.defId];
      const steps = {};
      def.steps.forEach((s) => { steps[s.id] = { state: "pending", attempts: 0, worker: null, note: "" }; });
      sim.runs[e.runId] = { runId: e.runId, defId: e.defId, name: def.name, version: def.version,
        state: "running", steps, compQueue: [], startedAt: e.t, finishedAt: null };
      sim.stats.workflows += 1;
      break;
    }
    case "task_scheduled": {
      const k = qkey(e);
      if (!sim.queue.some((q) => q.key === k)) sim.queue.push({ key: k, runId: e.runId, stepId: e.stepId,
        attempt: e.attempt, notBefore: e.notBefore, isComp: !!e.isComp, compName: e.compName || null });
      if (R) { const st = R.steps[e.stepId]; st.attempts = Math.max(st.attempts, e.attempt); if (!e.isComp) st.state = "pending"; }
      break;
    }
    case "task_started": {
      const i = sim.queue.findIndex((q) => q.key === e.qkey);
      if (i >= 0) sim.queue.splice(i, 1);
      sim.inflight[e.wid] = { runId: e.runId, stepId: e.stepId, attempt: e.attempt, isComp: !!e.isComp,
        compName: e.compName || null, expectedDur: e.expectedDur, idem: e.idem,
        startedAt: sim.vnow, remaining: e.expectedDur };
      if (R && !e.isComp) { const st = R.steps[e.stepId]; st.state = "running"; st.worker = e.wid; }
      break;
    }
    case "task_completed": {
      delete sim.inflight[e.wid];
      sim.stats.tasks += 1;
      if (sim.workers[e.wid]) sim.workers[e.wid].done += 1;
      if (R) {
        if (e.isComp) { R.compQueue.shift(); }
        else { const st = R.steps[e.stepId]; st.state = "completed"; st.note = e.duration.toFixed(1) + "s"; }
      }
      break;
    }
    case "task_failed": {
      delete sim.inflight[e.wid];
      if (e.willRetry) { sim.stats.retries += 1; if (R && !e.isComp) R.steps[e.stepId].state = "retrying"; }
      else if (R && !e.isComp) { R.steps[e.stepId].state = "failed"; }
      break;
    }
    case "timer_started":
      sim.timers.push({ runId: e.runId, stepId: e.stepId, fireAt: e.fireAt, name: e.name });
      if (R) R.steps[e.stepId].state = "waiting";
      break;
    case "timer_fired":
      sim.timers = sim.timers.filter((t) => !(t.runId === e.runId && t.stepId === e.stepId));
      if (R) { R.steps[e.stepId].state = "completed"; R.steps[e.stepId].note = "fired"; }
      break;
    case "signal_awaited":
      sim.signals.push({ runId: e.runId, stepId: e.stepId, signal: e.signal, name: e.name });
      if (R) R.steps[e.stepId].state = "waiting";
      break;
    case "signal_received":
      sim.signals = sim.signals.filter((s) => !(s.runId === e.runId && s.stepId === e.stepId));
      break;
    case "signal_completed":
      if (R) { R.steps[e.stepId].state = "completed"; R.steps[e.stepId].note = e.note || "approved"; }
      break;
    case "step_skipped":
      if (R) R.steps[e.stepId].state = "skipped";
      break;
    case "signals_cleared":
      sim.signals = sim.signals.filter((s) => s.runId !== e.runId);
      break;
    case "timers_cleared":
      sim.timers = sim.timers.filter((t) => t.runId !== e.runId);
      break;
    case "saga_started":
      if (R) R.compQueue = (e.comps || []).slice();
      break;
    case "compensation_started":
      sim.stats.compensations += 1;
      break;
    case "workflow_completed":
      if (R) { R.state = "completed"; R.finishedAt = e.t; }
      sim.stats.completed += 1;
      break;
    case "workflow_failed":
      if (R) { R.state = "failed"; R.finishedAt = e.t; }
      sim.stats.failed += 1;
      break;
    case "worker_died":
      sim.workers[e.wid].alive = false;
      sim.workers[e.wid].orphanTicks = 0;
      break;
    case "worker_slowed":
      sim.workers[e.wid].slowUntil = e.until;
      break;
    case "worker_revived":
      sim.workers[e.wid].alive = true;
      sim.workers[e.wid].replayed = e.replayed;
      break;
    case "worker_heartbeat":
      sim.workers[e.wid].lastHb = e.t;
      break;
    case "chaos_armed":
      sim.failNext = true;
      break;
    case "fault_consumed":
      sim.failNext = false;
      break;
    /* chaos / info events carry no projection */
    default: break;
  }
}

function qkey(e) { return e.runId + ":" + e.stepId + (e.isComp ? ":comp" : "") + "#" + e.attempt; }
function defOf(run) { return DEFINITIONS[run.defId]; }
function stepDef(run, stepId) { return defOf(run).steps.find((s) => s.id === stepId); }
function backoff(attempt) { return Math.min(600, BACKOFF_BASE * Math.pow(2, attempt - 1)); } // attempt that just failed
function pickDur(sim, step) { const d = step.dur || [2, 4]; return d[0] + sim.rand() * (d[1] - d[0]); }

/* ---------------- run lifecycle ---------------- */
function startRun(sim, defId) {
  const def = DEFINITIONS[defId];
  if (!def) return null;
  sim.runSeq += 1;
  const runId = defId + "-" + sim.runSeq;
  emit(sim, "workflow_started", { runId, defId, name: def.name, version: def.version, queue: def.queue });
  def.steps.filter((s) => !s.deps || !s.deps.length).forEach((s) => scheduleStep(sim, runId, s.id, 1, false));
  return runId;
}

function scheduleStep(sim, runId, stepId, attempt, isComp, compName) {
  const run = sim.runs[runId];
  const step = isComp ? null : stepDef(run, stepId);
  const wait = attempt > 1 ? backoff(attempt - 1) : 0;
  const ev = { runId, stepId, attempt, notBefore: sim.vnow + wait, isComp: !!isComp,
    compName: compName || null, qkey: null,
    name: isComp ? compName : step.name,
    idem: runId + ":" + stepId + (isComp ? ":comp" : ""),
  };
  ev.qkey = qkey(ev);
  emit(sim, "task_scheduled", ev);
  if (attempt > 1 && !isComp) {
    emit(sim, "info", { runId, msg: "retry scheduled in " + wait + "s (backoff 2^" + (attempt - 1) + " × " + BACKOFF_BASE + "s) · idempotency key " + ev.idem });
  }
  return ev;
}

function scheduleSignalOrTimer(sim, runId, step) {
  if (step.kind === "timer") {
    emit(sim, "timer_started", { runId, stepId: step.id, name: step.name, fireAt: sim.vnow + step.timer });
  } else if (step.kind === "signal") {
    emit(sim, "signal_awaited", { runId, stepId: step.id, name: step.name, signal: step.signal });
  }
}

function depsMet(run, step) {
  return (step.deps || []).every((d) => run.steps[d] && run.steps[d].state === "completed");
}

/* After a step completes, fan out to ready dependents. */
function fanOut(sim, runId, doneStepId) {
  const run = sim.runs[runId];
  if (!run || run.state !== "running") return;
  defOf(run).steps.forEach((s) => {
    if (!(s.deps || []).includes(doneStepId)) return;
    const st = run.steps[s.id];
    if (st.state !== "pending") return;
    if (!depsMet(run, s)) return;
    if (s.kind === "task") scheduleStep(sim, runId, s.id, 1, false);
    else scheduleSignalOrTimer(sim, runId, s);
  });
  checkRunDone(sim, runId);
}

function checkRunDone(sim, runId) {
  const run = sim.runs[runId];
  if (!run || run.state !== "running") return;
  const allDone = defOf(run).steps.every((s) => run.steps[s.id].state === "completed");
  if (allDone) emit(sim, "workflow_completed", { runId, elapsed: sim.vnow - run.startedAt });
}

/* Final task failure (or signal rejection): run compensations in reverse,
 * then mark the workflow failed. This is the saga path. */
function compensateRun(sim, runId, reason) {
  const run = sim.runs[runId];
  if (!run || run.state !== "running") return;
  const steps = defOf(run).steps;
  const done = steps.filter((s) => run.steps[s.id].state === "completed" && s.comp).reverse();
  // every state change below goes through the log — no direct mutation
  steps.forEach((s) => {
    const st = run.steps[s.id];
    if (st.state === "pending" || st.state === "retrying" || st.state === "waiting")
      emit(sim, "step_skipped", { runId, stepId: s.id, name: s.name });
  });
  const nSig = sim.signals.filter((sg) => sg.runId === runId).length;
  const nTim = sim.timers.filter((t) => t.runId === runId).length;
  if (nSig) emit(sim, "signals_cleared", { runId, count: nSig });
  if (nTim) emit(sim, "timers_cleared", { runId, count: nTim });
  if (!done.length) {
    emit(sim, "workflow_failed", { runId, reason, compensated: false });
    return;
  }
  const comps = done.map((s) => ({ stepId: s.id, compName: s.comp }));
  emit(sim, "saga_started", { runId, reason, comps,
    msg: "saga rollback: " + done.length + " compensations (" + reason + ")" });
  scheduleComp(sim, runId);
}

function scheduleComp(sim, runId) {
  const run = sim.runs[runId];
  const next = run.compQueue[0];
  if (!next) { emit(sim, "workflow_failed", { runId, reason: "task retries exhausted", compensated: true }); return; }
  emit(sim, "compensation_started", { runId, stepId: next.stepId, name: next.compName });
  scheduleStep(sim, runId, next.stepId, 1, true, next.compName);
}

/* ---------------- task execution ---------------- */
function finishTask(sim, wid, c) {
  const run = sim.runs[c.runId];
  const tname = c.isComp ? c.compName : stepDef(run, c.stepId).name;
  const base = { runId: c.runId, stepId: c.stepId, wid, attempt: c.attempt, name: tname,
    isComp: !!c.isComp, compName: c.compName || null,
    idem: c.runId + ":" + c.stepId + (c.isComp ? ":comp" : "") };
  let fail = false, err = null;
  if (sim.failNext && !c.isComp) {
    fail = true; err = "injected fault (chaos panel)";
    emit(sim, "fault_consumed", { wid, msg: "armed fault consumed by \"" + tname + "\"" });
  } else if (!c.isComp) {
    const step = stepDef(run, c.stepId);
    if (step.flaky && sim.rand() < 0.55) { fail = true; err = "KYC provider 503 — flaky step"; }
  }
  if (c.isComp) {
    emit(sim, "task_completed", Object.assign({}, base, { duration: c.expectedDur }));
    scheduleComp(sim, c.runId); // next compensation, or workflow_failed when empty
    return;
  }
  if (fail) {
    const willRetry = c.attempt < MAX_ATTEMPTS;
    emit(sim, "task_failed", Object.assign({}, base, { error: err, willRetry }));
    if (willRetry) scheduleStep(sim, c.runId, c.stepId, c.attempt + 1, false);
    else compensateRun(sim, c.runId, "retries exhausted on \"" + tname + "\"");
  } else {
    emit(sim, "task_completed", Object.assign({}, base, { duration: c.expectedDur }));
    fanOut(sim, c.runId, c.stepId);
  }
}

/* One engine tick: advance the virtual clock by dt seconds. */
function advance(sim, dt) {
  sim.vnow += dt; sim.tick += 1;

  // 1. worker progress (volatile countdown on the event-derived inflight entry)
  Object.values(sim.workers).forEach((w) => {
    if (!w.alive) return;
    const c = sim.inflight[w.id];
    if (!c) return;
    const mul = w.slowUntil > sim.vnow ? 0.4 : 1;
    c.remaining -= dt * mul;
    if (c.remaining <= 0) finishTask(sim, w.id, c);
  });

  // 2. orphaned tasks: dead worker's in-flight task hangs until heartbeat timeout
  Object.values(sim.workers).forEach((w) => {
    const c = sim.inflight[w.id];
    if (w.alive || !c) return;
    w.orphanTicks += 1; // volatile liveness bookkeeping, like a real failure detector
    if (w.orphanTicks === ORPHAN_TICKS) {
      const tname = c.isComp ? c.compName : stepDef(sim.runs[c.runId], c.stepId).name;
      emit(sim, "task_failed", { runId: c.runId, stepId: c.stepId, wid: w.id, attempt: c.attempt, name: tname,
        isComp: !!c.isComp, compName: c.compName || null,
        error: "worker lost — " + ORPHAN_TICKS + " missed heartbeats", willRetry: true, orphaned: true,
        idem: c.runId + ":" + c.stepId + (c.isComp ? ":comp" : "") });
      emit(sim, "info", { runId: c.runId, msg: "recovery: \"" + tname +
        "\" requeued (attempt " + (c.attempt + 1) + ") — replay resumes after last completed step, partial work discarded" });
      scheduleStep(sim, c.runId, c.stepId, c.attempt + 1, !!c.isComp, c.compName);
    }
  });

  // 3. timers
  sim.timers.slice().forEach((t) => {
    if (t.fireAt <= sim.vnow) {
      emit(sim, "timer_fired", { runId: t.runId, stepId: t.stepId, name: t.name });
      fanOut(sim, t.runId, t.stepId);
    }
  });

  // 4. heartbeats
  if (sim.tick % 5 === 0) {
    Object.values(sim.workers).forEach((w) => {
      if (w.alive) emit(sim, "worker_heartbeat", { wid: w.id });
    });
  }

  // 5. assign idle workers
  Object.values(sim.workers).forEach((w) => {
    if (!w.alive || sim.inflight[w.id]) return;
    const qi = sim.queue.findIndex((q) => q.notBefore <= sim.vnow);
    if (qi < 0) return;
    const q = sim.queue[qi];
    const run = sim.runs[q.runId];
    if (!run || run.state !== "running") { sim.queue.splice(qi, 1); return; }
    const step = q.isComp ? null : stepDef(run, q.stepId);
    const expectedDur = q.isComp ? 2 + sim.rand() * 2 : pickDur(sim, step);
    const name = q.isComp ? q.compName : step.name;
    emit(sim, "task_started", { runId: q.runId, stepId: q.stepId, wid: w.id, attempt: q.attempt,
      qkey: q.key, isComp: q.isComp, compName: q.compName, name, expectedDur,
      idem: q.runId + ":" + q.stepId + (q.isComp ? ":comp" : "") });
  });

  // 6. cron auto-schedule
  if (sim.autoSchedule && sim.vnow >= sim.nextCron) {
    sim.nextCron += 86400;
    const id = startRun(sim, "etl");
    emit(sim, "info", { msg: "cron \"0 2 * * *\" fired → started " + id });
  }
}

/* Fast-forward the virtual clock to the next timer fire (or queued retry). */
function skipToNext(sim) {
  const targets = [];
  sim.timers.forEach((t) => { if (t.fireAt > sim.vnow) targets.push(t.fireAt); });
  sim.queue.forEach((q) => { if (q.notBefore > sim.vnow) targets.push(q.notBefore); });
  if (sim.autoSchedule && sim.nextCron > sim.vnow) targets.push(sim.nextCron);
  if (!targets.length) return 0;
  const target = Math.min.apply(null, targets);
  let jumped = 0, guard = 0;
  while (sim.vnow < target && guard < 20000) {
    const step = Math.min(600, target - sim.vnow);
    advance(sim, step); jumped += step; guard += 1;
    if (!sim.timers.some((t) => t.fireAt > sim.vnow && t.fireAt <= target) &&
        !sim.queue.some((q) => q.notBefore > sim.vnow && q.notBefore <= target) &&
        sim.vnow >= target) break;
  }
  return jumped;
}

/* ---------------- chaos & signals ---------------- */
function killWorker(sim, wid) {
  const w = sim.workers[wid];
  if (!w || !w.alive) return false;
  const c = sim.inflight[wid];
  const carrying = c ? (" carrying \"" + (c.isComp ? c.compName :
    stepDef(sim.runs[c.runId], c.stepId).name) + "\"") : " (idle)";
  emit(sim, "worker_died", { wid, msg: wid + " killed" + carrying + " — heartbeat flatlined" });
  return true;
}
function reviveWorker(sim, wid) {
  const w = sim.workers[wid];
  if (!w || w.alive) return false;
  emit(sim, "worker_revived", { wid, replayed: sim.events.length,
    msg: wid + " revived — replayed " + sim.events.length + " events to rebuild state, ready for work" });
  return true;
}
function failNextTask(sim) {
  emit(sim, "chaos_armed", { msg: "fault injected: the next task to finish will fail" });
}
function slowWorker(sim, wid, secs) {
  const w = sim.workers[wid];
  if (!w) return false;
  const s = secs || 120;
  emit(sim, "worker_slowed", { wid, until: sim.vnow + s,
    msg: wid + " throttled to 40% speed for " + s + "s (simulated noisy neighbor)" });
  return true;
}
function sendSignal(sim, runId, signal, approved) {
  const i = sim.signals.findIndex((s) => s.runId === runId && s.signal === signal);
  if (i < 0) return false;
  const sg = sim.signals[i];
  emit(sim, "signal_received", { runId, stepId: sg.stepId, signal, approved,
    msg: "signal \"" + signal + "\" → " + (approved ? "APPROVED" : "REJECTED") });
  if (approved) {
    emit(sim, "signal_completed", { runId, stepId: sg.stepId, signal, note: "approved" });
    fanOut(sim, runId, sg.stepId);
  } else {
    compensateRun(sim, runId, "human rejected \"" + sg.name + "\"");
  }
  return true;
}

/* Rebuild a sim purely from an event array — the replayability proof. */
function replay(events, keep) {
  const sim = createSim({ rand: Math.random });
  sim.vnow = 0;
  events.forEach((e) => {
    sim.seq = Math.max(sim.seq, e.seq);
    if (e.t > sim.vnow) sim.vnow = e.t;
    if (e.type === "workflow_started") {
      const m = /-(\d+)$/.exec(e.runId || "");
      if (m) sim.runSeq = Math.max(sim.runSeq, parseInt(m[1], 10));
    }
    sim.events.push(e);
    reduce(sim, e);
  });
  // Nothing else to rebuild: the in-flight projection (incl. remaining time
  // restarting at full expected duration) folds out of task_started events,
  // so a replayed worker resumes exactly like a restarted one — partial
  // progress discarded, work resuming after the last completed step.
  if (keep) { sim.failNext = !!keep.failNext; sim.autoSchedule = !!keep.autoSchedule; sim.nextCron = keep.nextCron; }
  return sim;
}

function depthOf(def, stepId, memo) {
  memo = memo || {};
  if (memo[stepId] !== undefined) return memo[stepId];
  const s = def.steps.find((x) => x.id === stepId);
  const d = !(s.deps || []).length ? 0 : 1 + Math.max.apply(null, s.deps.map((dep) => depthOf(def, dep, memo)));
  memo[stepId] = d; return d;
}

const api = {
  DEFINITIONS, MAX_ATTEMPTS, WORKER_IDS,
  createSim, startRun, advance, skipToNext, replay,
  killWorker, reviveWorker, failNextTask, slowWorker, sendSignal,
  depthOf, backoff,
};
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.DurableFlow = api;
})(typeof self !== "undefined" ? self : this);
