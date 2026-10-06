/* Smoke test: Polymarket live feed.
   - Unit: pmPickMarkets / pmResolved filtering logic on fabricated payloads.
   - Live: public-search returns real events; batch /events yields pickable
     binary markets; a known closed market resolves to the correct side.
   Run: node --test test/smoke.mjs */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, "..", "app.js"), "utf8");

// ---- minimal browser stubs so app.js loads in node ----
function fakeEl() {
  return new Proxy(
    { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} } },
    {
      get(t, k) {
        if (k === "querySelectorAll") return () => [];
        if (k === "getBoundingClientRect") return () => ({ width: 300 });
        if (k === "getContext") return () => null;
        return t[k];
      },
      set(t, k, v) { t[k] = v; return true; },
    }
  );
}
const store = new Map();
const sandbox = {
  console,
  document: {
    getElementById: () => fakeEl(),
    querySelectorAll: () => [],
    createElement: () => fakeEl(),
  },
  window: { addEventListener() {}, devicePixelRatio: 1, scrollTo() {} },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  fetch: globalThis.fetch,
  setTimeout, clearTimeout,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: "app.js" });
const T = sandbox.window.__twin;
assert.ok(T, "window.__twin hook exposed");

// ---- unit: filtering logic ----
const NOW = Date.now(), DAY = 864e5;
function mkEvent(markets) { return [{ id: "e1", title: "E", volume: "5000", markets }]; }
function mkMarket(over) {
  return Object.assign(
    { id: "m1", question: "Q?", outcomes: '["Yes","No"]', outcomePrices: '["0.68","0.32"]',
      closed: false, archived: false, active: true, volume: "20000",
      endDate: new Date(NOW + 30 * DAY).toISOString() },
    over
  );
}

test("pmPickMarkets keeps clean binary open markets", () => {
  const items = T.pmPickMarkets(mkEvent([mkMarket({ id: "m1" })]));
  assert.equal(items.length, 1);
  assert.equal(items[0].crowdYes, 0.68);
});

test("pmPickMarkets rejects closed / decided / illiquid / multi-outcome / past markets", () => {
  const items = T.pmPickMarkets(mkEvent([
    mkMarket({ id: "a", closed: true }),
    mkMarket({ id: "b", outcomePrices: '["1","0"]' }),
    mkMarket({ id: "b2", outcomePrices: '["0.995","0.005"]' }),
    mkMarket({ id: "c", volume: "10" }),
    mkMarket({ id: "d", outcomes: '["A","B","C"]', outcomePrices: '["0.5","0.3","0.2"]' }),
    mkMarket({ id: "e", endDate: new Date(NOW - DAY).toISOString() }),
    mkMarket({ id: "f", endDate: new Date(NOW + 400 * DAY).toISOString() }),
  ]));
  assert.equal(items.length, 0);
});

test("pmPickMarkets handles reversed Yes/No order", () => {
  const items = T.pmPickMarkets(mkEvent([
    mkMarket({ id: "r", outcomes: '["No","Yes"]', outcomePrices: '["0.4","0.6"]' }),
  ]));
  assert.equal(items.length, 1);
  assert.equal(items[0].crowdYes, 0.6);
});

test("pmResolved reads closed markets", () => {
  assert.equal(T.pmResolved({ closed: true, outcomes: '["Yes","No"]', outcomePrices: '["1","0"]' }), 0);
  assert.equal(T.pmResolved({ closed: true, outcomes: '["Yes","No"]', outcomePrices: '["0","1"]' }), 1);
  assert.equal(T.pmResolved({ closed: false, outcomes: '["Yes","No"]', outcomePrices: '["0.7","0.3"]' }), null);
});

// ---- live: the actual Polymarket API ----
test("live: public-search returns real events", async () => {
  const r = await fetch("https://gamma-api.polymarket.com/public-search?q=" + encodeURIComponent("bitcoin"));
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(Array.isArray(d.events) && d.events.length > 0, "expected events");
});

test("live: batch events yield pickable binary markets", async () => {
  // mirror the app: try several queries, use whatever yields open binary markets
  const queries = ["bitcoin", "AI", "ethereum", "nvidia"];
  let items = [];
  for (const q of queries) {
    const r = await fetch("https://gamma-api.polymarket.com/public-search?q=" + encodeURIComponent(q));
    const d = await r.json();
    const ids = [...new Set((d.events || []).map((e) => String(e.id)))].slice(0, 12);
    if (!ids.length) continue;
    const r2 = await fetch("https://gamma-api.polymarket.com/events?" + ids.map((id) => "id=" + id).join("&"));
    const events = await r2.json();
    items = T.pmPickMarkets(events);
    if (items.length) break;
  }
  assert.ok(items.length > 0, "expected at least one pickable market across queries");
  for (const m of items) {
    assert.ok(m.id && m.q, "market has id + question");
    assert.ok(m.crowdYes > 0 && m.crowdYes < 1, "crowd prob strictly inside (0,1)");
    assert.ok(Date.parse(m.endDate) > Date.now(), "end date in the future");
  }
  console.log("    sample:", items[0].q.slice(0, 60), "| crowd", items[0].crowdYes);
});

test("live: known closed market resolves to No", async () => {
  // market 546611: "Will OpenAI launch a new consumer hardware product in 2025?" — closed, No won
  const r = await fetch("https://gamma-api.polymarket.com/markets/546611");
  assert.equal(r.status, 200);
  const m = await r.json();
  assert.equal(T.pmResolved(m), 1);
});
