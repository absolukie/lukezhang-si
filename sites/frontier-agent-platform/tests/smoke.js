/* Smoke test: frontier-agent-platform real-data layer.
   Run: node tests/smoke.js  (network check is warn-only so CI stays green offline) */
"use strict";
const fs = require("fs");
const path = require("path");

let failures = 0;
const ok = (cond, msg) => {
  console.log((cond ? "  PASS " : "  FAIL ") + msg);
  if (!cond) failures++;
};

const snap = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "models.json"), "utf8"));

console.log("— models.json snapshot —");
ok(snap.meta && /^\d{4}-\d{2}-\d{2}$/.test(snap.meta.snapshot_date), "meta.snapshot_date is a dated snapshot");
ok(snap.meta && /openrouter/i.test(snap.meta.pricing_source || ""), "pricing source labeled (OpenRouter)");
ok(snap.meta && /artificial analysis/i.test(snap.meta.benchmark_source || ""), "benchmark source labeled (Artificial Analysis)");
ok(Array.isArray(snap.models) && snap.models.length >= 10, `>=10 curated models (got ${snap.models.length})`);

const ids = snap.models.map(m => m.id);
ok(new Set(ids).size === ids.length, "model ids are unique");

let badPrice = 0, badTier = 0, badAA = 0;
for (const m of snap.models) {
  if (!(isFinite(m.priceIn) && m.priceIn > 0 && isFinite(m.priceOut) && m.priceOut > 0)) badPrice++;
  if (!["ultra", "pro", "lite"].includes(m.tier)) badTier++;
  if (m.aa_index != null && !(m.aa_index >= 0 && m.aa_index <= 100)) badAA++;
  if (!(isFinite(m.context) && m.context > 0)) { ok(false, `${m.id} has a real context window`); break; }
}
ok(badPrice === 0, "every model has priceIn/priceOut numbers > 0 (real economics)");
ok(badTier === 0, "every model has a valid tier");
ok(badAA === 0, "AA index scores are within 0–100 where present");
ok(snap.models.every(m => isFinite(m.context) && m.context > 0), "every model has a real context window");

for (const t of ["ultra", "pro", "lite"]) {
  const id = snap.tier_default && snap.tier_default[t];
  ok(!!id && ids.includes(id), `tier_default.${t} points at a real model (${id})`);
}
ok(snap.models.some(m => m.aa_index != null), "at least one model carries a real AA benchmark score");

console.log("— app.js wiring —");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
ok(!/frontier-1-(ultra|pro|lite)/.test(app), "no fictional frontier-1-* models remain");
ok(app.includes("https://openrouter.ai/api/v1/models"), "live OpenRouter refresh wired");
ok(app.includes("frontier-models-cache"), "localStorage price cache wired");
ok(app.includes("models.json"), "shipped snapshot loaded");
ok(/simulated latency|\(sim\)/.test(app), "simulated latencies labeled as simulated");

console.log("— index.html honesty —");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
ok(/simulated client-side/.test(html) && /real/i.test(html), "footer distinguishes real data from simulation");

(async () => {
  console.log("— live OpenRouter check (warn-only) —");
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    const live = new Set((data.data || []).map(m => m.id));
    const missing = ids.filter(id => !live.has(id));
    ok(missing.length === 0, `all ${ids.length} curated models still listed live` + (missing.length ? ` (missing: ${missing.join(", ")})` : ""));
  } catch (e) {
    console.log("  WARN live check skipped: " + e.message);
  }
  console.log(failures ? `\n${failures} FAILURES` : "\nALL GREEN");
  process.exit(failures ? 1 : 0);
})();
