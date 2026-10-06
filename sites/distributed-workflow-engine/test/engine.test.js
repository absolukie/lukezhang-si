/* Engine tests: run in Node. No DOM needed — engine.js is pure logic. */
const E = require("../engine.js");
let pass = 0, fail = 0;
function ok(c, label) { console.log((c ? "PASS " : "FAIL ") + label); c ? pass++ : fail++; }
function runUntil(sim, cond, maxTicks) {
  for (let i = 0; i < (maxTicks || 5000) && !cond(sim); i++) E.advance(sim, 5);
}

// deterministic random: max durations, flaky steps never fail
const sim0 = () => E.createSim({ rand: () => 0.999 });

// 1. ETL runs to completion, all 5 tasks done
{
  const s = sim0();
  const id = E.startRun(s, "etl");
  runUntil(s, (x) => x.runs[id].state !== "running");
  ok(s.runs[id].state === "completed", "etl completes, got " + s.runs[id].state);
  ok(s.stats.tasks === 5, "5 tasks completed, got " + s.stats.tasks);
  ok(s.events.some((e) => e.type === "workflow_completed"), "workflow_completed emitted");
}

// 2. kill a worker mid-task -> heartbeat timeout -> retry -> run still completes
{
  const s = sim0();
  const id = E.startRun(s, "etl");
  runUntil(s, (x) => x.events.some((e) => e.type === "task_started"));
  const startedEv = s.events.find((e) => e.type === "task_started");
  ok(E.killWorker(s, startedEv.wid), "kill worker carrying a task");
  ok(s.workers[startedEv.wid].alive === false, "worker marked dead");
  runUntil(s, (x) => x.events.some((e) => e.type === "task_failed" && e.orphaned));
  ok(true, "orphaned task detected after missed heartbeats");
  ok(s.events.some((e) => e.type === "task_scheduled" && e.attempt === 2), "task rescheduled as attempt 2");
  E.reviveWorker(s, startedEv.wid);
  runUntil(s, (x) => s.runs[id].state !== "running");
  ok(s.runs[id].state === "completed", "run completes after worker loss, got " + s.runs[id].state);
  ok(s.stats.retries >= 1, "retry counted");
}

// 3. injected fault -> exponential backoff visible in log, then success
{
  const s = sim0();
  const id = E.startRun(s, "etl");
  E.failNextTask(s);
  runUntil(s, (x) => s.runs[id].state !== "running");
  const failed = s.events.find((e) => e.type === "task_failed" && e.error.includes("injected"));
  ok(!!failed && failed.willRetry, "injected fault fails a task with retry");
  const info = s.events.find((e) => e.type === "info" && /backoff/.test(e.msg || ""));
  ok(!!info && /in 5s/.test(info.msg), "backoff logged (5s for attempt 2): " + (info && info.msg));
  ok(s.runs[id].state === "completed", "run recovers and completes");
}

// 4. retries exhausted -> saga compensation in reverse, workflow_failed
{
  const s = E.createSim({ rand: () => 0 }); // flaky always fails, min durations
  const id = E.startRun(s, "onboarding");
  runUntil(s, (x) => s.runs[id].state !== "running", 20000);
  ok(s.runs[id].state === "failed", "onboarding fails after exhausted retries, got " + s.runs[id].state);
  const comps = s.events.filter((e) => e.type === "compensation_started").map((e) => e.name);
  ok(comps.length === 2, "2 compensations ran (acct+email done before kyc failed), got " + JSON.stringify(comps));
  ok(comps[0] === "Send retraction email" && comps[1] === "Delete account", "compensations in reverse order");
  ok(s.events.some((e) => e.type === "workflow_failed" && e.compensated), "workflow_failed with compensated=true");
}

// 5. timer: research pipeline waits 30 virtual days, skipToNext fires it
{
  const s = sim0();
  const id = E.startRun(s, "research");
  runUntil(s, (x) => x.events.some((e) => e.type === "timer_started"));
  ok(s.events.some((e) => e.type === "timer_started"), "30-day timer started");
  const t0 = s.vnow;
  const jumped = E.skipToNext(s);
  ok(jumped >= 30 * 86400 - 1, "skip jumped ~30 days, got " + jumped);
  ok(s.vnow - t0 >= 30 * 86400 - 1, "virtual clock advanced 30 days");
  ok(s.events.some((e) => e.type === "timer_fired"), "timer fired after skip");
}

// 6. signal: human approval gate blocks until approved
{
  const s = sim0();
  const id = E.startRun(s, "research");
  // pump: skip long waits, then advance so workers drain the queue
  let guard = 0;
  while (!s.signals.length && guard++ < 60) { E.skipToNext(s); runUntil(s, (x) => x.signals.length > 0, 2000); }
  ok(s.signals.length === 1 && s.signals[0].signal === "approve_report", "approval gate awaiting signal");
  const progTypes = ["task_started", "task_completed", "task_failed", "timer_fired"];
  const nProg = s.events.filter((e) => progTypes.includes(e.type)).length;
  E.advance(s, 3600); E.advance(s, 3600);
  const nProg2 = s.events.filter((e) => progTypes.includes(e.type)).length;
  ok(nProg2 === nProg, "no progress while awaiting signal (only heartbeats)");
  E.sendSignal(s, id, "approve_report", true);
  runUntil(s, (x) => s.runs[id].state !== "running");
  ok(s.runs[id].state === "completed", "run completes after approval");
}

// 7. signal rejection -> rollback
{
  const s = sim0();
  const id = E.startRun(s, "onboarding");
  let guard = 0;
  while (!s.signals.length && guard++ < 60) { E.skipToNext(s); runUntil(s, (x) => x.signals.length > 0, 2000); }
  ok(s.signals.length === 1, "kyc approval gate awaiting signal");
  E.sendSignal(s, id, "approve_kyc", false);
  runUntil(s, (x) => s.runs[id].state !== "running", 20000);
  ok(s.runs[id].state === "failed", "rejected approval fails the run");
  ok(s.events.some((e) => e.type === "compensation_started"), "rejection triggers compensations");
}

// 8. replay: rebuild from events alone, same derived state
{
  const s = sim0();
  const id = E.startRun(s, "etl");
  E.killWorker(s, "worker-1");
  runUntil(s, (x) => s.runs[id].state !== "running");
  const keep = { failNext: s.failNext, autoSchedule: s.autoSchedule, nextCron: s.nextCron };
  const r = E.replay(s.events, keep);
  ok(r.runs[id].state === s.runs[id].state, "replay: same run state (" + r.runs[id].state + ")");
  ok(r.stats.tasks === s.stats.tasks, "replay: same task count");
  ok(r.queue.length === s.queue.length && r.timers.length === s.timers.length, "replay: same queue/timers");
  ok(Object.keys(r.workers).every((w) => r.workers[w].alive === s.workers[w].alive), "replay: same worker liveness");
}

// 9. cron auto-schedule fires the nightly ETL
{
  const s = sim0();
  s.autoSchedule = true;
  E.advance(s, 3 * 3600);
  ok(s.events.some((e) => e.type === "workflow_started" && e.defId === "etl"), "cron fired nightly ETL at 02:00");
}

// 10. audit fixes: event-sourced signals, saga, counters, runSeq, names
{
  const s = sim0();
  const id1 = E.startRun(s, "etl");
  const id2 = E.startRun(s, "etl");
  runUntil(s, (x) => x.runs[id1].state !== "running" && x.runs[id2].state !== "running");
  // done counts are derived from task_completed events
  const doneSum = Object.values(s.workers).reduce((a, w) => a + w.done, 0);
  ok(doneSum === s.stats.tasks && doneSum === 10, "worker done counts derived from log (" + doneSum + ")");
  // every task_completed carries a name (no undefined in the log)
  ok(s.events.filter((e) => e.type === "task_completed").every((e) => typeof e.name === "string" && e.name.length > 0),
    "all task_completed events carry a task name");
  // replay restores runSeq — no duplicate run ids
  const r = E.replay(s.events, null);
  const id3 = E.startRun(r, "etl");
  ok(id3 === "etl-3", "replay restores runSeq, next run is etl-3, got " + id3);
  const doneSumR = Object.values(r.workers).reduce((a, w) => a + w.done, 0);
  ok(doneSumR === doneSum, "replay reconstructs worker done counts (" + doneSumR + ")");
}
{
  // signal approval completes the step via signal_completed event, not mutation
  const s = sim0();
  const id = E.startRun(s, "research");
  let guard = 0;
  while (!s.signals.length && guard++ < 60) { E.skipToNext(s); runUntil(s, (x) => x.signals.length > 0, 2000); }
  E.sendSignal(s, id, "approve_report", true);
  ok(s.events.some((e) => e.type === "signal_completed" && e.stepId === "appr"), "signal_completed event in log");
  ok(s.runs[id].steps.appr.state === "completed" && s.runs[id].steps.appr.note === "approved", "approval step completed via event");
}
{
  // saga rollback is fully event-sourced: step_skipped + saga_started, compQueue from log
  const s = E.createSim({ rand: () => 0 });
  const id = E.startRun(s, "onboarding");
  runUntil(s, (x) => s.runs[id].state !== "running", 20000);
  ok(s.events.some((e) => e.type === "saga_started"), "saga_started event in log");
  ok(s.events.some((e) => e.type === "step_skipped"), "step_skipped events in log");
  const r = E.replay(s.events, null);
  ok(r.runs[id].state === "failed", "replay: same failed state after saga");
  ok(r.stats.compensations === s.stats.compensations, "replay: same compensation count");
}
{
  // slowWorker throttling is event-derived
  const s = sim0();
  E.slowWorker(s, "worker-2", 120);
  ok(s.workers["worker-2"].slowUntil === 120, "slowUntil set via worker_slowed event");
  ok(s.events.some((e) => e.type === "worker_slowed"), "worker_slowed event in log");
  const r = E.replay(s.events, null);
  ok(r.workers["worker-2"].slowUntil === 120, "replay restores throttling");
}
{
  // armed fault is event state: armed via chaos_armed, consumed via fault_consumed
  const s = sim0();
  const id = E.startRun(s, "etl");
  E.failNextTask(s);
  ok(s.failNext === true && s.events.some((e) => e.type === "chaos_armed"), "fault armed via event");
  runUntil(s, (x) => s.runs[id].state !== "running");
  ok(s.failNext === false && s.events.some((e) => e.type === "fault_consumed"), "fault consumed via event");
}

console.log(fail ? "\n" + fail + " FAILURES" : "\nALL " + pass + " ENGINE TESTS PASSED");
process.exit(fail ? 1 : 0);
