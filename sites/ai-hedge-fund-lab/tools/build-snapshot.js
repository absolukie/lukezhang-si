/* Build data/snapshot.json — real daily OHLCV (dividend/split adjusted) from Yahoo Finance.
 * Run: node tools/build-snapshot.js
 * Output: data/snapshot.json — normalized bars aligned to the SPY trading calendar.
 * No keys, no secrets. Re-run anytime to refresh. */
"use strict";
const https = require("https");
const fs = require("fs");
const path = require("path");

const TICKERS = ["NVDA", "MSFT", "AAPL", "AMZN", "TSLA", "AMD", "JPM", "XOM", "LLY", "COIN", "SPY"];
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
// ~26 months of buffer so the app always has 200d of history + runway
const PERIOD1 = Math.floor(new Date("2024-07-01T00:00:00Z").getTime() / 1000);
const PERIOD2 = Math.floor(Date.now() / 1000);

function fetchChart(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&period1=${PERIOD1}&period2=${PERIOD2}&events=div%7Csplit`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA } }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(sym + " HTTP " + res.statusCode));
        try {
          const j = JSON.parse(raw);
          const r = j.chart && j.chart.result && j.chart.result[0];
          if (!r) return reject(new Error(sym + " no result: " + (j.chart && j.chart.error && j.chart.error.description)));
          resolve(r);
        } catch (e) { reject(new Error(sym + " parse: " + e.message)); }
      });
    }).on("error", reject);
  });
}

function isoDay(ts) {
  // Yahoo timestamps are UTC midnight-ish; a trading day is unambiguous in UTC for US equities
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function round2(x) { return Math.round(x * 100) / 100; }

(async () => {
  const out = { asOf: new Date().toISOString().slice(0, 10), source: "yahoo-finance", dates: [], tickers: TICKERS.filter(t => t !== "SPY"), series: {}, spy: [] };
  const per = {};
  for (const sym of TICKERS) {
    const r = await fetchChart(sym);
    const q = r.indicators.quote[0];
    const adj = (r.indicators.adjclose && r.indicators.adjclose[0].adjclose) || [];
    const bars = [];
    for (let i = 0; i < r.timestamp.length; i++) {
      const c = q.close[i], a = adj[i];
      if (c == null || a == null || q.open[i] == null) continue;
      const f = a / c; // dividend/split adjustment factor
      bars.push({
        d: isoDay(r.timestamp[i]),
        o: round2(q.open[i] * f), h: round2(q.high[i] * f),
        l: round2(q.low[i] * f), c: round2(a),
        v: Math.round(q.volume[i] || 0),
      });
    }
    if (bars.length < 300) throw new Error(sym + ": only " + bars.length + " bars, expected 300+");
    per[sym] = bars;
    console.log(sym, bars.length, "bars", bars[0].d, "→", bars[bars.length - 1].d, "last close", bars[bars.length - 1].c);
  }
  // Inner join on the SPY trading calendar
  const spyDates = new Set(per.SPY.map(b => b.d));
  const dates = per.SPY.map(b => b.d);
  for (const sym of TICKERS) {
    const m = new Map(per[sym].map(b => [b.d, b]));
    const aligned = dates.map(d => m.get(d)).filter(Boolean);
    if (aligned.length < dates.length * 0.97)
      throw new Error(sym + ": only " + aligned.length + "/" + dates.length + " dates align with SPY");
    if (sym === "SPY") out.spy = aligned.map(b => [b.o, b.h, b.l, b.c, b.v]);
    else out.series[sym] = aligned.map(b => [b.o, b.h, b.l, b.c, b.v]);
  }
  out.dates = dates;
  const dir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, "snapshot.json");
  fs.writeFileSync(fp, JSON.stringify(out));
  console.log("wrote", fp, (fs.statSync(fp).size / 1024).toFixed(1) + "KB");
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
