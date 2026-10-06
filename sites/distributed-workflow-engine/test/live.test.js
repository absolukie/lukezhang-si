/* Unit tests for live.js: GitHub API mapping, event derivation, cache TTL.
 * Pure functions only — no network, no DOM. Run with: node test/live.test.js */
const Live = require("../live.js");

let failures = 0;
function ok(c, label) { console.log((c ? "PASS " : "FAIL ") + label); if (!c) failures++; }

/* ---- fixture: one real-shaped run + jobs payload ---- */
const RUN = {
  id: 36226076303, name: "pages build and deployment", display_title: "deploy live check",
  run_number: 16, run_attempt: 1, status: "completed", conclusion: "success",
  head_branch: "main", event: "push",
  created_at: "2026-09-26T07:12:34Z", updated_at: "2026-09-26T07:13:18Z",
  html_url: "https://github.com/absolukie/draw-and-guess/actions/runs/36226076303",
  jobs_url: "https://api.github.com/repos/absolukie/draw-and-guess/actions/runs/36226076303/jobs",
};
const JOBS = [
  { id: 1, name: "build", status: "completed", conclusion: "success",
    started_at: "2026-09-26T07:12:41Z", completed_at: "2026-09-26T07:13:01Z",
    html_url: "https://github.com/x/y/runs/1",
    steps: [
      { name: "Set up job", number: 1, status: "completed", conclusion: "success",
        started_at: "2026-09-26T07:12:41Z", completed_at: "2026-09-26T07:12:43Z" },
      { name: "Build with Jekyll", number: 4, status: "completed", conclusion: "success",
        started_at: "2026-09-26T07:12:56Z", completed_at: "2026-09-26T07:12:58Z" },
      { name: "Flaky deploy", number: 5, status: "completed", conclusion: "failure",
        started_at: "2026-09-26T07:12:58Z", completed_at: "2026-09-26T07:12:59Z" },
    ] },
  { id: 2, name: "deploy", status: "completed", conclusion: "cancelled",
    started_at: "2026-09-26T07:13:10Z", completed_at: "2026-09-26T07:13:17Z",
    html_url: "https://github.com/x/y/runs/2",
    steps: [
      { name: "Deploy to GitHub Pages", number: 2, status: "completed", conclusion: "cancelled",
        started_at: "2026-09-26T07:13:10Z", completed_at: null },
    ] },
  { id: 3, name: "test", status: "in_progress", conclusion: null,
    started_at: "2026-09-26T07:13:18Z", completed_at: null,
    html_url: "https://github.com/x/y/runs/3", steps: [] },
];

/* ---- mapRun ---- */
const r = Live.mapRun(RUN);
ok(r.id === 36226076303, "mapRun keeps id");
ok(r.number === 16, "mapRun keeps run number");
ok(r.state === "completed", "success conclusion → completed, got " + r.state);
ok(r.durSec === 44, "real duration 44s computed, got " + r.durSec);
ok(r.branch === "main" && r.event === "push", "branch + trigger preserved");

/* ---- mapJob / mapStep ---- */
const jobs = JOBS.map(Live.mapJob);
ok(jobs[0].state === "completed", "job success → completed");
ok(jobs[0].steps[0].boiler === true, "'Set up job' flagged as boilerplate");
ok(jobs[0].steps[1].boiler === false, "real step not boilerplate");
ok(jobs[0].steps[1].durSec === 2, "step duration 2s, got " + jobs[0].steps[1].durSec);
ok(jobs[0].steps[2].state === "failed", "step failure conclusion → failed");
ok(jobs[1].state === "failed", "cancelled job → failed");
ok(jobs[2].state === "running", "in_progress job → running");
const skippedStep = Live.mapStep({ name: "s", number: 9, status: "completed",
  conclusion: "skipped", started_at: null, completed_at: null });
ok(skippedStep.state === "skipped" && skippedStep.durSec === null, "skipped step, null duration");

/* ---- toState matrix ---- */
[["completed", "success", "completed"], ["completed", "failure", "failed"],
 ["completed", "cancelled", "failed"], ["completed", "timed_out", "failed"],
 ["completed", "skipped", "skipped"], ["completed", "neutral", "completed"],
 ["in_progress", null, "running"], ["queued", null, "pending"],
 ["waiting", null, "waiting"], ["requested", null, "pending"],
].forEach(([st, co, want]) => ok(Live.toState(st, co) === want,
  `toState(${st},${co}) = ${want}`));

/* ---- deriveEvents ---- */
const evs = Live.deriveEvents(r, jobs);
ok(evs.length > 0, "events derived, got " + evs.length);
ok(evs[0].html.includes("RUN_STARTED"), "first event is RUN_STARTED");
ok(evs[evs.length - 1].html.includes("RUN_COMPLETED"), "last event is RUN_COMPLETED");
ok(evs.some((e) => e.html.includes("STEP_FAILED") && e.cls === "chaos"),
  "failed step → chaos-class STEP_FAILED event");
ok(evs.every((e, i) => i === 0 || Date.parse(evs[i - 1].t) <= Date.parse(e.t)),
  "events chronological");
ok(evs.every((e, i) => e.seq === i + 1), "seq numbers assigned in order");
ok(evs.some((e) => e.html.includes("2.0s")), "real durations appear in event text");

/* ---- formatting ---- */
ok(Live.fmtDur(44) === "44s", "fmtDur seconds");
ok(Live.fmtDur(3720) === "1h 02m", "fmtDur hours, got " + Live.fmtDur(3720));
ok(Live.fmtClock("2026-09-26T07:12:34Z") === "2026-09-26 07:12:34Z", "fmtClock UTC");
ok(Live.isoDur(null, "2026-09-26T07:12:34Z") === null, "isoDur null-safe");

/* ---- cache TTL ---- */
const c = {};
Live.cachePut(c, "o/r", "runs", "", [{ id: 1 }]);
const fresh = Live.cacheGet(c, "o/r", "runs", "", Live.TTL_RUNS);
ok(fresh && fresh.data[0].id === 1, "cache hit returns data");
const stale = Live.cacheGet(c, "o/r", "runs", "", -1);
ok(stale === null, "expired TTL → miss");
ok(Live.cacheGet(c, "o/other", "runs", "", Live.TTL_RUNS) === null, "other repo → miss");
// eviction: cache stays bounded
for (let i = 0; i < 20; i++) Live.cachePut(c, "o/r", "jobs", String(i), []);
ok(Object.keys(c.repos["o/r"]).length <= 8, "cache evicts old entries, kept " +
  Object.keys(c.repos["o/r"]).length);

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL LIVE TESTS PASSED");
process.exit(failures ? 1 : 0);
