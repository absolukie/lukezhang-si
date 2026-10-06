"use strict";
/* Calibration tests: sim constants must match the real-data snapshot. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { createSim, SECTORS, applyCalibration, CALIBRATION, WEALTH_INIT } = require("../sim.js");
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "calibration.json"), "utf8"));

let pass = 0;
const ok = (cond, msg) => { assert(cond, msg); pass++; console.log("  ✓ " + msg); };

// 1. snapshot is well-formed
ok(/^\d{4}-\d{2}-\d{2}$/.test(snap.retrieved), "snapshot has retrieval date: " + snap.retrieved);
ok(snap.sources && snap.sources.gini && snap.sources.wages, "snapshot names its sources");
ok(typeof snap.gini_target === "number" && snap.gini_target > 0.3 && snap.gini_target < 0.6, "gini target sane: " + snap.gini_target);

// 2. baked-in sector wages match the snapshot
assert.strictEqual(SECTORS.length, snap.sectors.length, "sector count matches");
snap.sectors.forEach((cs) => {
  const sec = SECTORS.find((s) => s.name === cs.name);
  ok(sec, "sector present: " + cs.name);
  ok(Math.abs(sec.wage - cs.wage) < 0.011, `${cs.name} wage ${sec.wage} == snapshot ${cs.wage}`);
  ok(sec.hourly === cs.hourly, `${cs.name} hourly $${sec.hourly} matches snapshot`);
});

// 3. mean wage preserves the sim's tuned scale
const meanWage = SECTORS.reduce((s, x) => s + x.wage, 0) / SECTORS.length;
ok(Math.abs(meanWage - snap.base_scale) < 0.02, `mean wage ${meanWage.toFixed(3)} ≈ base scale ${snap.base_scale}`);

// 4. relative pay gaps match BLS exactly (the empirical content)
const rel = (arr) => arr.map((x) => x.hourly / arr.reduce((s, y) => s + y.hourly, 0));
const simRel = rel(SECTORS), snapRel = rel(snap.sectors);
simRel.forEach((v, i) => ok(Math.abs(v - snapRel[i]) < 1e-9, `relative gap identical for ${SECTORS[i].name}`));

// 5. founding Gini lands near the real US Gini
let sum = 0; const N = 24;
for (let s = 1; s <= N; s++) sum += createSim(s * 7919).metrics.gini;
const g0 = sum / N;
ok(Math.abs(g0 - snap.gini_target) < 0.03,
  `founding Gini ${g0.toFixed(3)} ≈ World Bank US Gini ${snap.gini_target} (target ±0.03)`);

// 6. applyCalibration round-trips fresh data
const fresh = JSON.parse(JSON.stringify(snap));
fresh.sectors.find((c) => c.name === "Technology").hourly = 66.64; // +20% tech pay
fresh.retrieved = "2099-01-01";
ok(applyCalibration(fresh) === true, "applyCalibration accepts fresh snapshot");
const tech = SECTORS.find((s) => s.name === "Technology");
ok(Math.abs(tech.wage - 4.44) < 0.02, `wages rescale from new hourly (tech ${tech.wage})`);
ok(CALIBRATION.retrieved === "2099-01-01", "retrieved date updates");
ok(applyCalibration(null) === false && applyCalibration({}) === false, "applyCalibration rejects bad input");

// 7. wealth spread constant matches snapshot
ok(Math.abs(WEALTH_INIT.spread - snap.wealth_spread) < 1e-9, "wealth spread matches snapshot");

console.log(`\n${pass} calibration assertions passed.`);
