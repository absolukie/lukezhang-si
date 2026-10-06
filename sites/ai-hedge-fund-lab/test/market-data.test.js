/* Meridian Labs — real-data tests. Run: node test/market-data.test.js */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const MD = require("../market-data.js");
const Sim = require("../sim.js");

let pass = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { console.error("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; }
}

/* ---------- 1. Stooq CSV parsing ---------- */
console.log("Stooq CSV parsing");
let SAMPLE_CSV = "Date,Open,High,Low,Close,Volume\n";
for (let i = 0; i < 65; i++) {
  const px = 200 + i * 0.5;
  SAMPLE_CSV += "2026-0" + (i < 30 ? "6" : "7") + "-" + String((i % 28) + 1).padStart(2, "0") + "," +
    px.toFixed(2) + "," + (px + 2).toFixed(2) + "," + (px - 2).toFixed(2) + "," +
    (px + 0.5).toFixed(2) + ",120000000\n";
}
ok("parses rows into bars", () => {
  const bars = MD.parseStooqDaily(SAMPLE_CSV, "NVDA");
  assert.strictEqual(bars.length, 65);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(bars[0].d));
  assert.ok(bars[64].c > bars[0].c, "rising series preserved");
  assert.strictEqual(bars[10].v, 120000000);
});
ok("rejects garbage csv", () => {
  assert.throws(() => MD.parseStooqDaily("Date,Open\n2026-01-01,1\n", "NVDA"), /too few/);
});

/* ---------- 2. sanity checker ---------- */
console.log("sanity checker");
function goodDataset() {
  const snap = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "snapshot.json"), "utf8"));
  const perSym = { SPY: snap.spy.map((b, i) => ({ d: snap.dates[i], o: b[0], h: b[1], l: b[2], c: b[3], v: b[4] })) };
  MD.TICKERS.forEach(t => {
    perSym[t] = snap.series[t].map((b, i) => ({ d: snap.dates[i], o: b[0], h: b[1], l: b[2], c: b[3], v: b[4] }));
  });
  return MD.toDataset(perSym, "test", snap.asOf);
}
const ds = goodDataset();
ok("accepts the real snapshot dataset", () => {
  assert.ok(MD.sanity(ds).ok, MD.sanity(ds).issues.join("; "));
});
ok("rejects negative close", () => {
  const bad = JSON.parse(JSON.stringify(ds));
  bad.series.NVDA[10][3] = -5;
  assert.ok(!MD.sanity(bad).ok);
});
ok("rejects out-of-range close", () => {
  const bad = JSON.parse(JSON.stringify(ds));
  bad.series.AAPL[10][3] = 0.01; // AAPL sane range starts at 30
  assert.ok(!MD.sanity(bad).ok);
});
ok("rejects non-ascending dates", () => {
  const bad = JSON.parse(JSON.stringify(ds));
  bad.dates[5] = bad.dates[6];
  assert.ok(!MD.sanity(bad).ok);
});
ok("rejects OHLC inconsistency (low above close)", () => {
  const bad = JSON.parse(JSON.stringify(ds));
  bad.series.MSFT[10][2] = bad.series.MSFT[10][3] + 50; // low > close
  assert.ok(!MD.sanity(bad).ok);
});

/* ---------- 3. snapshot freshness & shape ---------- */
console.log("bundled snapshot");
ok("covers 10 tickers + SPY with 400+ sessions", () => {
  assert.strictEqual(Object.keys(ds.series).length, 10);
  assert.ok(ds.dates.length >= 400, ds.dates.length + " sessions");
  assert.ok(ds.spy.length >= ds.dates.length * 0.95);
});
ok("last session is recent (warns if stale)", () => {
  const last = ds.dates[ds.dates.length - 1];
  const ageDays = (Date.now() - new Date(last + "T12:00:00Z").getTime()) / 864e5;
  console.log("    snapshot asOf=" + ds.asOf + ", last session=" + last + " (" + ageDays.toFixed(1) + "d ago)");
  assert.ok(ageDays < 60, "snapshot older than 60 days");
});
ok("closes are real numbers in sane ranges", () => {
  const px = ds.series.NVDA.map(b => b[3]);
  assert.ok(px.every(x => isFinite(x) && x > 0));
  const last = px[px.length - 1];
  assert.ok(last > 50 && last < 1000, "NVDA last close " + last);
});

/* ---------- 4. sim on real data ---------- */
console.log("sim engine on real data");
const fund = Sim.newFund(42, ds);
ok("fund opens with 200+ sessions of real history", () => {
  assert.ok(fund.day >= 200, "day=" + fund.day);
  assert.strictEqual(fund.v, 2);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(fund.dates[fund.day]));
  assert.ok(fund.dates[fund.day] > "2024-01-01", "real date, not 2024-01-02 fiction");
});
ok("regimes are measured values", () => {
  const vals = new Set(fund.regimes);
  assert.ok(vals.has("bull") || vals.has("bear") || vals.has("chop"));
  vals.forEach(v => assert.ok(["bull", "bear", "chop"].includes(v), v));
});
ok("events are detected with real dates/sizes", () => {
  assert.ok(fund.events.length > 20, fund.events.length + " events");
  const e = fund.events[0];
  assert.ok(e.day >= 0 && e.shock !== 0 && /abnormal move/.test(e.text));
});
ok("full loop: cycle → advance → resolve on real prices", () => {
  const s2 = Sim.newFund(7, ds);
  Sim.runCycle(s2);
  const nPred = s2.predictions.length;
  assert.ok(nPred > 0, "agents pitched");
  const r = Sim.advanceDays(s2, 60);
  assert.strictEqual(r.advanced, 60);
  const resolved = s2.predictions.filter(p => p.resolved);
  assert.ok(resolved.length > 0, "predictions resolved");
  resolved.forEach(p => {
    assert.ok(p.brier >= 0 && p.brier <= 1, "brier in range");
    assert.ok(isFinite(p.ret), "real return");
  });
  const eq = Sim.equity(s2);
  assert.ok(isFinite(eq) && eq > 0, "equity " + eq);
  // agents earned real reputation
  const scored = Sim.AGENTS.filter(a => s2.agents[a.id].n > 0);
  assert.ok(scored.length > 0);
  console.log("    " + resolved.length + "/" + nPred + " resolved, equity=" + eq.toFixed(0));
});
ok("advance stops at end of data", () => {
  const s3 = Sim.newFund(9, ds);
  const left = Sim.sessionsLeft(s3);
  const r = Sim.advanceDays(s3, left + 100);
  assert.strictEqual(r.advanced, left);
  assert.ok(r.atEnd);
  assert.ok(!Sim.canAdvance(s3, 1));
});
ok("extendMarket appends sessions, keeps indices stable", () => {
  const s4 = Sim.newFund(11, ds);
  Sim.runCycle(s4);
  const dayBefore = s4.day, nPred = s4.predictions.length;
  const firstPredDay = s4.predictions[0].day;
  // fake a newer dataset: same dates + 5 synthetic sessions
  const ext = JSON.parse(JSON.stringify(ds));
  const lastClose = {};
  MD.TICKERS.forEach(t => { lastClose[t] = ext.series[t][ext.series[t].length - 1][3]; });
  let lastSpy = ext.spy[ext.spy.length - 1][3];
  let lastDate = new Date(ext.dates[ext.dates.length - 1] + "T12:00:00Z");
  for (let i = 1; i <= 5; i++) {
    lastDate.setUTCDate(lastDate.getUTCDate() + 1);
    if ([0, 6].includes(lastDate.getUTCDay())) { lastDate.setUTCDate(lastDate.getUTCDate() + (lastDate.getUTCDay() === 0 ? 1 : 2)); }
    const iso = lastDate.toISOString().slice(0, 10);
    ext.dates.push(iso);
    MD.TICKERS.forEach(t => {
      const c = lastClose[t] * 1.001; lastClose[t] = c;
      ext.series[t].push([c, c * 1.005, c * 0.995, c, 1000000]);
    });
    lastSpy *= 1.001;
    ext.spy.push([lastSpy, lastSpy * 1.005, lastSpy * 0.995, lastSpy, 1000000]);
  }
  const res = Sim.extendMarket(s4, ext);
  assert.strictEqual(res.added, 5);
  assert.strictEqual(s4.day, dayBefore, "current day index unchanged");
  assert.strictEqual(s4.predictions.length, nPred, "ledger intact");
  assert.strictEqual(s4.predictions[0].day, firstPredDay, "prediction day refs stable");
  assert.ok(Sim.canAdvance(s4, 1), "room to advance again");
});
ok("simDate renders real trading dates", () => {
  const d = Sim.simDate(fund, fund.day);
  assert.ok(/^[A-Z][a-z]{2} \d{1,2}, 20\d{2}$/.test(d), d);
});

console.log(pass + " assertions passed");
