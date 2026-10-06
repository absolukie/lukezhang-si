/* ============================================================
   MERIDIAN LABS — market data pipeline
   Real daily OHLCV, never invented. Source priority:
     1. live Stooq daily CSV (free, no key, CORS-friendly)
     2. localStorage cache of the last good fetch
     3. bundled real snapshot (data/snapshot.json, Yahoo Finance)
   If (1) fails the app still runs on real data and says so.
   ============================================================ */
(function () {
  "use strict";

  var TICKERS = ["NVDA", "MSFT", "AAPL", "AMZN", "TSLA", "AMD", "JPM", "XOM", "LLY", "COIN"];
  var STOOQ_SYM = {
    NVDA: "nvda.us", MSFT: "msft.us", AAPL: "aapl.us", AMZN: "amzn.us",
    TSLA: "tsla.us", AMD: "amd.us", JPM: "jpm.us", XOM: "xom.us",
    LLY: "lly.us", COIN: "coin.us", SPY: "spy.us"
  };
  var CACHE_KEY = "meridian-market-v3";
  var SNAPSHOT_URL = "data/snapshot.json";

  // Generous sanity guardrails (USD). These only reject garbage, never real quotes.
  var RANGES = {
    NVDA: [5, 3000], MSFT: [50, 3000], AAPL: [30, 2000], AMZN: [30, 2000],
    TSLA: [30, 3000], AMD: [10, 2000], JPM: [30, 1500], XOM: [20, 900],
    LLY: [100, 5000], COIN: [10, 4000], SPY: [100, 3000]
  };

  /* ---------- Stooq CSV ---------- */
  // https://stooq.com/q/d/l/?s=nvda.us&d1=20240701&d2=20260929&i=d
  // → Date,Open,High,Low,Close,Volume (one header row)
  function parseStooqDaily(csv, sym) {
    var lines = String(csv).trim().split(/\r?\n/);
    if (lines.length < 60) throw new Error(sym + ": too few rows (" + lines.length + ")");
    var bars = [];
    for (var i = 1; i < lines.length; i++) {
      var p = lines[i].split(",");
      if (p.length < 6) continue;
      var o = +p[1], h = +p[2], l = +p[3], c = +p[4], v = +p[5];
      if (!isFinite(o) || !isFinite(h) || !isFinite(l) || !isFinite(c) || c <= 0) continue;
      bars.push({ d: p[0], o: o, h: h, l: l, c: c, v: Math.round(v) || 0 });
    }
    if (bars.length < 60) throw new Error(sym + ": too few valid bars");
    return bars;
  }

  function isoCompact(d) { return d.replace(/-/g, ""); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  function fetchStooqDaily(sym, d1, d2) {
    var url = "https://stooq.com/q/d/l/?s=" + STOOQ_SYM[sym] +
      "&d1=" + isoCompact(d1) + "&d2=" + isoCompact(d2) + "&i=d";
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(sym + ": HTTP " + r.status);
      return r.text();
    }).then(function (csv) { return parseStooqDaily(csv, sym); });
  }

  /* ---------- normalize to one dataset shape ---------- */
  // dataset = { dataId, asOf, source, dates[], series{t:[[o,h,l,c,v]...]}, spy:[[o,h,l,c,v]...] }
  function toDataset(perSym, source, asOf) {
    var spyBars = perSym.SPY;
    var spyDates = {};
    spyBars.forEach(function (b) { spyDates[b.d] = 1; });
    var dates = spyBars.map(function (b) { return b.d; });
    var series = {}, spy = [];
    var all = TICKERS.concat(["SPY"]);
    for (var i = 0; i < all.length; i++) {
      var sym = all[i], m = {};
      perSym[sym].forEach(function (b) { m[b.d] = b; });
      var aligned = [];
      for (var k = 0; k < dates.length; k++) {
        var b = m[dates[k]];
        if (!b) continue; // a ticker missing a session SPY traded
        aligned.push([b.o, b.h, b.l, b.c, b.v]);
      }
      if (aligned.length < dates.length * 0.95)
        throw new Error(sym + ": only " + aligned.length + "/" + dates.length + " sessions align");
      if (sym === "SPY") spy = aligned; else series[sym] = aligned;
    }
    var ds = { dataId: source + "|" + dates[0] + "|" + dates[dates.length - 1],
      asOf: asOf, source: source, dates: dates, series: series, spy: spy };
    var chk = sanity(ds);
    if (!chk.ok) throw new Error("sanity: " + chk.issues.join("; "));
    return ds;
  }

  /* ---------- sanity: real numbers in sane ranges ---------- */
  function sanity(ds) {
    var issues = [];
    try {
      if (!ds.dates || ds.dates.length < 250) issues.push("fewer than 250 sessions");
      for (var i = 1; i < ds.dates.length; i++)
        if (ds.dates[i] <= ds.dates[i - 1]) { issues.push("dates not ascending"); break; }
      var syms = TICKERS.concat(["SPY"]);
      syms.forEach(function (sym) {
        var arr = sym === "SPY" ? ds.spy : ds.series[sym];
        if (!arr || arr.length < ds.dates.length * 0.95) { issues.push(sym + ": short series"); return; }
        var rg = RANGES[sym];
        for (var k = 0; k < arr.length; k++) {
          var b = arr[k], c = b[3];
          if (!isFinite(c) || c <= 0) { issues.push(sym + ": bad close @" + k); break; }
          if (c < rg[0] || c > rg[1]) { issues.push(sym + ": close " + c + " outside sane range"); break; }
          if (!(b[2] <= Math.min(b[0], c) + 1e-9 && Math.max(b[0], c) - 1e-9 <= b[1])) {
            issues.push(sym + ": OHLC inconsistent @" + k); break;
          }
        }
      });
    } catch (e) { issues.push("exception: " + e.message); }
    return { ok: !issues.length, issues: issues };
  }

  /* ---------- cache / snapshot ---------- */
  function loadCache() {
    try {
      var raw = typeof localStorage !== "undefined" && localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var ds = JSON.parse(raw);
      return sanity(ds).ok ? ds : null;
    } catch (e) { return null; }
  }
  function saveCache(ds) {
    try { if (typeof localStorage !== "undefined") localStorage.setItem(CACHE_KEY, JSON.stringify(ds)); }
    catch (e) {}
  }
  function loadSnapshot() {
    return fetch(SNAPSHOT_URL).then(function (r) {
      if (!r.ok) throw new Error("snapshot HTTP " + r.status);
      return r.json();
    }).then(function (snap) {
      var perSym = { SPY: snap.spy.map(function (b, i) {
        return { d: snap.dates[i], o: b[0], h: b[1], l: b[2], c: b[3], v: b[4] }; }) };
      TICKERS.forEach(function (t) {
        perSym[t] = snap.series[t].map(function (b, i) {
          return { d: snap.dates[i], o: b[0], h: b[1], l: b[2], c: b[3], v: b[4] }; });
      });
      return toDataset(perSym, "snapshot:" + (snap.source || "yahoo-finance"), snap.asOf);
    });
  }

  /* ---------- main entry ---------- */
  // load() → { dataset, provenance, note }
  // provenance ∈ "live" | "cache" | "snapshot"
  function load(opts) {
    opts = opts || {};
    var d1 = "2024-07-01", d2 = todayISO();
    var live = Promise.all(TICKERS.concat(["SPY"]).map(function (sym) {
      return fetchStooqDaily(sym, d1, d2);
    })).then(function (arr) {
      var perSym = {};
      TICKERS.concat(["SPY"]).forEach(function (sym, i) { perSym[sym] = arr[i]; });
      return toDataset(perSym, "stooq", todayISO());
    });
    return live.then(function (ds) {
      saveCache(ds);
      return { dataset: ds, provenance: "live", note: "Live daily bars from Stooq, as of " + ds.asOf };
    }).catch(function (err) {
      var cached = opts.noCache ? null : loadCache();
      if (cached) return { dataset: cached, provenance: "cache",
        note: "Live fetch failed (" + err.message + ") — using cached bars from " + cached.asOf };
      return loadSnapshot().then(function (ds) {
        return { dataset: ds, provenance: "snapshot",
          note: "Live fetch failed (" + err.message + ") — using bundled real snapshot from " + ds.asOf };
      });
    });
  }

  var MD = { TICKERS: TICKERS, CACHE_KEY: CACHE_KEY, load: load, sanity: sanity,
    parseStooqDaily: parseStooqDaily, toDataset: toDataset };
  if (typeof module !== "undefined" && module.exports) module.exports = MD;
  else if (typeof window !== "undefined") window.MarketData = MD;
})();
