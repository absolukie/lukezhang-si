/* ============================================================
   MERIDIAN LABS — AI Hedge Fund Laboratory engine
   Pure logic, zero DOM.
   Prices are REAL historical daily bars (Stooq / bundled snapshot).
   Regimes are measured from SPY, events are detected abnormal moves,
   the fundamental anchor is the 200-day trend. The agents, their
   research, debate, Brier scoring and the PM's book are simulated —
   but every prediction is graded against what actually happened.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- seeded RNG (narrative variety only; state serializable) ---------- */
  function RNG(seed) { this.s = (seed >>> 0) || 1; }
  RNG.prototype.next = function () {
    var t = (this.s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.range = function (a, b) { return a + (b - a) * this.next(); };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.randn = function () {
    var u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  /* ---------- universe ---------- */
  var TICKERS = ["NVDA", "MSFT", "AAPL", "AMZN", "TSLA", "AMD", "JPM", "XOM", "LLY", "COIN"];
  var ASSETS = [
    { t: "NVDA", name: "Nvidia",     sector: "Semiconductors", beta: 1.6, vol: 0.022 },
    { t: "MSFT", name: "Microsoft",  sector: "Software",       beta: 1.1, vol: 0.014 },
    { t: "AAPL", name: "Apple",      sector: "Hardware",       beta: 1.0, vol: 0.013 },
    { t: "AMZN", name: "Amazon",     sector: "E-commerce",     beta: 1.2, vol: 0.016 },
    { t: "TSLA", name: "Tesla",      sector: "Auto",           beta: 1.7, vol: 0.028 },
    { t: "AMD",  name: "AMD",        sector: "Semiconductors", beta: 1.5, vol: 0.024 },
    { t: "JPM",  name: "JPMorgan",   sector: "Banks",          beta: 0.9, vol: 0.013 },
    { t: "XOM",  name: "Exxon Mobil",sector: "Energy",         beta: 0.7, vol: 0.015 },
    { t: "LLY",  name: "Eli Lilly",  sector: "Pharma",         beta: 0.6, vol: 0.016 },
    { t: "COIN", name: "Coinbase",   sector: "Crypto",         beta: 2.0, vol: 0.035 }
  ];

  var REGIMES = {
    bull: { label: "Bull market",  color: "#7bc96f" },
    bear: { label: "Bear market",  color: "#ff6b6b" },
    chop: { label: "Choppy / flat", color: "#ffb454" }
  };

  var AGENTS = [
    { id: "macro",   name: "Elena Vasquez", role: "Macro Researcher",   icon: "🌐", color: "#5aa9ff" },
    { id: "fund",    name: "Marcus Webb",   role: "Fundamental Analyst",icon: "📊", color: "#7bc96f" },
    { id: "quant",   name: "Priya Nair",    role: "Quant Researcher",   icon: "📈", color: "#c792ea" },
    { id: "news",    name: "Jake Torres",   role: "News/Event Analyst", icon: "📰", color: "#ffb454" },
    { id: "risk",    name: "Sarah Kim",     role: "Risk Manager",       icon: "🛡", color: "#ff8a8a" },
    { id: "skeptic", name: "Ruth Cassidy",  role: "Skeptic · Bear-case",icon: "🦉", color: "#9aa4b2" },
    { id: "pm",      name: "David Okafor",  role: "Portfolio Manager",  icon: "👔", color: "#e8b64c" }
  ];

  var START_CAPITAL = 10000000;
  var HIST_NEED = 200;   // sessions of history required before the fund opens (200d trend)
  var RUNWAY = 220;      // sessions of real future left for replay after opening

  /* ---------- market state from real bars ---------- */
  function mean(xs) {
    var s = 0; for (var i = 0; i < xs.length; i++) s += xs[i];
    return xs.length ? s / xs.length : 0;
  }

  // Regime is measured, not simulated: SPY's trailing 60-session trend.
  function regimeFor(spy, d) {
    var n = Math.min(60, d);
    if (n < 20) return "chop";
    var r = spy[d] / spy[d - n] - 1;
    var thr = 0.09 * n / 60;
    return r > thr ? "bull" : r < -thr ? "bear" : "chop";
  }

  // Realized beta vs SPY over the trailing 60 sessions.
  function betaAt(st, t, d) {
    var n = Math.min(60, d);
    if (n < 20) return assetOf(t).beta; // fallback descriptor
    var px = st.prices[t], sp = st.spy, rx = [], rs = [];
    for (var i = d - n + 1; i <= d; i++) {
      rx.push(px[i] / px[i - 1] - 1); rs.push(sp[i] / sp[i - 1] - 1);
    }
    var mx = mean(rx), ms = mean(rs), cov = 0, vs = 0;
    for (var j = 0; j < n; j++) { cov += (rx[j] - mx) * (rs[j] - ms); vs += (rs[j] - ms) * (rs[j] - ms); }
    if (vs < 1e-10) return assetOf(t).beta;
    return clamp(cov / vs, 0.2, 3.0);
  }

  // Events are detected, not scripted: abnormal single-session moves
  // (|ret| > max(3%, 2.75 × trailing-20d vol)). Date, ticker and size are real.
  function maybeEvent(st, t, d) {
    var px = st.prices[t];
    if (d < 21) return null;
    var ret = px[d] / px[d - 1] - 1;
    var rs = [];
    for (var i = d - 20; i < d; i++) rs.push(px[i + 1] / px[i] - 1);
    var m = mean(rs), v = 0;
    for (var j = 0; j < rs.length; j++) v += (rs[j] - m) * (rs[j] - m);
    v = Math.sqrt(v / rs.length);
    if (Math.abs(ret) > Math.max(0.03, 2.75 * v)) {
      return { day: d, ticker: t,
        text: t + " " + (ret >= 0 ? "+" : "") + (ret * 100).toFixed(1) + "% abnormal move",
        shock: ret, px: px[d] };
    }
    return null;
  }

  function trendAt(prices, t, d) {
    var n = Math.min(200, d + 1), s = 0;
    for (var i = d - n + 1; i <= d; i++) s += prices[t][i];
    return s / n;
  }

  // market = { dates[], series{t:[[o,h,l,c,v]...]}, spy:[[o,h,l,c,v]...] } (MarketData shape)
  function buildMarketState(market) {
    var dates = market.dates, n = dates.length;
    var closes = {}, spy = [];
    for (var k = 0; k < n; k++) spy.push(market.spy[k][3]);
    TICKERS.forEach(function (t) {
      closes[t] = [];
      for (var k2 = 0; k2 < n; k2++) closes[t].push(market.series[t][k2][3]);
    });
    var st = { dates: dates, prices: closes, spy: spy, regimes: [], events: [], trend: {} };
    for (var d = 0; d < n; d++) st.regimes.push(regimeFor(spy, d));
    TICKERS.forEach(function (t) {
      st.trend[t] = [];
      for (var d2 = 0; d2 < n; d2++) st.trend[t].push(trendAt(closes, t, d2));
    });
    TICKERS.forEach(function (t) {
      for (var d3 = 21; d3 < n; d3++) {
        var e = maybeEvent(st, t, d3);
        if (e) st.events.push(e);
      }
    });
    st.events.sort(function (a, b) { return a.day - b.day; });
    return st;
  }

  /* ---------- state ---------- */
  function newFund(seed, market) {
    if (!market || !market.dates || market.dates.length < HIST_NEED + 60)
      throw new Error("market data too short (" +
        (market && market.dates ? market.dates.length : 0) + " sessions)");
    var ms = buildMarketState(market);
    var n = ms.dates.length;
    var startIdx = Math.min(Math.max(HIST_NEED, n - RUNWAY), n - 61);
    var rng = new RNG(seed);
    var st = {
      v: 2, seed: seed, rngS: rng.s,
      dataId: market.dataId, dataSource: market.source, dataAsOf: market.asOf,
      day: startIdx, startDay: startIdx,
      dates: ms.dates, prices: ms.prices, spy: ms.spy,
      regimes: ms.regimes, events: ms.events, trend: ms.trend,
      agents: {}, feed: [], predictions: [],
      portfolio: { cash: START_CAPITAL, positions: {}, equityHist: [], trades: [] },
      cycle: 0, nextId: 1
    };
    AGENTS.forEach(function (a) {
      st.agents[a.id] = { n: 0, hits: 0, brierSum: 0, attrib: 0,
        buckets: {}, regime: { bull: { n: 0, hit: 0 }, bear: { n: 0, hit: 0 }, chop: { n: 0, hit: 0 } },
        repTrend: [] };
    });
    recordEquity(st);
    addFeed(st, { cycle: 0, kind: "system",
      text: "Fund opened on " + simDate(st, st.day) + " — replaying real market history (" +
        st.dataSource + ", as of " + st.dataAsOf + "). " +
        (n - 1 - startIdx) + " sessions of future available." });
    return st;
  }

  function R(st) { var r = new RNG(0); r.s = st.rngS; return r; }
  function saveR(st, r) { st.rngS = r.s; }

  // Append newer sessions to a live fund. Day indices of existing sessions are stable,
  // so saved predictions, positions and the ledger stay valid.
  function extendMarket(st, market) {
    if (!market || market.dataId === st.dataId && market.dates.length <= st.dates.length)
      return { added: 0 };
    var lastDate = st.dates[st.dates.length - 1];
    var idx = market.dates.indexOf(lastDate);
    if (idx < 0) return { added: 0, reason: "dataset-changed" };
    var added = 0;
    for (var k = idx + 1; k < market.dates.length; k++) {
      st.dates.push(market.dates[k]);
      TICKERS.forEach(function (t) {
        st.prices[t].push(market.series[t][k][3]);
        st.trend[t].push(trendAt(st.prices, t, st.dates.length - 1));
      });
      st.spy.push(market.spy[k][3]);
      var d = st.dates.length - 1;
      st.regimes.push(regimeFor(st.spy, d));
      TICKERS.forEach(function (t) {
        var e = maybeEvent(st, t, d);
        if (e) st.events.push(e);
      });
      added++;
    }
    if (added) {
      st.dataAsOf = market.asOf;
      addFeed(st, { cycle: st.cycle, kind: "system",
        text: "Market data extended: +" + added + " sessions through " +
          simDate(st, st.dates.length - 1) + "." });
    }
    return { added: added };
  }

  /* ---------- market math helpers ---------- */
  function px(st, t, d) { return st.prices[t][d]; }
  function retN(st, t, d, n) {
    if (d < n) return 0;
    return st.prices[t][d] / st.prices[t][d - n] - 1;
  }
  function volN(st, t, d, n) {
    if (d < n + 1) return 0.02;
    var rs = [];
    for (var i = d - n + 1; i <= d; i++) rs.push(st.prices[t][i] / st.prices[t][i - 1] - 1);
    var m = mean(rs), v = 0;
    for (var j = 0; j < rs.length; j++) v += (rs[j] - m) * (rs[j] - m);
    return Math.sqrt(Math.max(v / rs.length, 1e-8));
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function assetOf(t) {
    for (var i = 0; i < ASSETS.length; i++) if (ASSETS[i].t === t) return ASSETS[i];
    return null;
  }
  function agentOf(id) {
    for (var i = 0; i < AGENTS.length; i++) if (AGENTS[i].id === id) return AGENTS[i];
    return null;
  }

  /* ---------- signals (each agent's "research", computed on real prices) ---------- */
  function signalQuant(st, t, d) {
    var r20 = retN(st, t, d, 20), v = volN(st, t, d, 20);
    var z = r20 / (v * Math.sqrt(20) + 1e-9);
    return { s: clamp(z / 2.2, -1, 1), r20: r20, z: z };
  }
  // Fundamental anchor: distance from the 200-session trend (mean-reversion proxy).
  function signalFund(st, t, d) {
    var ma = st.trend[t][d], price = st.prices[t][d];
    var gap = (ma - price) / price;
    return { s: clamp(gap / 0.16, -1, 1), gap: gap, ma: ma };
  }
  function signalMacro(st, t, d) {
    var beta = betaAt(st, t, d), reg = st.regimes[d], s = 0, why = "";
    if (reg === "bull") { s = (beta - 1.0) * 0.9; why = "high-beta into bull tape"; }
    else if (reg === "bear") { s = (1.05 - beta) * 0.9; why = "defensive beta into bear tape"; }
    else { var v = volN(st, t, d, 20); s = (v < 0.018 ? 0.25 : -0.25); why = "low-vol preference in chop"; }
    return { s: clamp(s, -1, 1), why: why, reg: reg, beta: beta };
  }
  function signalNews(st, t, d) {
    var best = null;
    for (var i = st.events.length - 1; i >= 0; i--) {
      var e = st.events[i];
      if (e.ticker !== t || d - e.day > 10) continue;
      if (!best || e.day > best.day) best = e;
    }
    if (!best) return { s: 0 };
    var decay = 1 - (d - best.day) / 12;
    return { s: clamp(best.shock / 0.05, -1, 1) * decay, ev: best };
  }

  /* ---------- feed / predictions ---------- */
  function addFeed(st, item) {
    item.id = st.nextId++;
    item.day = st.day;
    st.feed.push(item);
    return item;
  }
  function addPrediction(st, p) {
    p.id = st.nextId++;
    p.resolved = false;
    st.predictions.push(p);
    return p;
  }

  function confOf(sig, rng, lo, hi) {
    lo = lo || 0.55; hi = hi || 0.93;
    return clamp(lo + (hi - lo) * Math.abs(sig) + rng.range(-0.03, 0.03), 0.52, 0.95);
  }
  function dirWord(dir) { return dir === "long" ? "LONG" : "SHORT"; }
  function pct(x, d) { return (x * 100).toFixed(d === undefined ? 1 : d) + "%"; }

  /* ----- thesis copy: distinct voices, real numbers ----- */
  var THESIS_COPY = {
    quant: [
      "Momentum ignition on {T}: 20d return {R20} vs trailing vol — z-score {Z}. My walk-forward backtest wins {W}% on this setup over {H}d. Going {D} at {C}%.",
      "{T} is trending with unusual cleanliness — 20d {R20}, vol-normalized z {Z}. No mean-reversion yet. {D}, {C}% over {H}d.",
      "Cross-sectional momentum ranks {T} #{RK} of 10. Drift persistence is high in this regime. {D} {T}, confidence {C}%, horizon {H}d.",
      "Vol-adjusted momentum on {T} just crossed my entry threshold (z {Z}). Backtest expectancy +{E}% per trade. Taking the {D} side, {C}%."
    ],
    fund: [
      "{T} trades at ${P} vs its 200-day trend ${F} — a {G} dislocation. Stretched tapes snap back more often than not. {D}, {C}% over {H}d.",
      "Trend dislocation in {T}: {G} {DIRWORD} the 200d average (${F}). Nothing fundamental moved — price did. {D} with {C}% confidence.",
      "{T} sits {G} away from its 200-day trend (${F} vs ${P} last). The widest stretch in weeks. Fading it: {D}, {C}%.",
      "Mean-reversion setup on {T}: {G} gap to the ${F} trend line. Price rarely stays this far from trend. {D}, {C}%."
    ],
    macro: [
      "Regime read: {REG}. In this tape I want {WHY} — that's {T} (realized beta {B}). Positioning {D} at {C}%.",
      "{REG} tape, and flows agree with me. {T}'s realized beta of {B} is exactly the exposure this regime pays for. {D}, {C}% over {H}d.",
      "Cross-asset check: rates, credit, and factor momentum all say {REG}. {T} ({WHY}) is the cleanest expression. {D} {C}%.",
      "Don't fight the regime. {REG} rewards {WHY}; {T} fits the bill at beta {B}. {D}, {C}%."
    ],
    news: [
      "Unusual tape in {T}: \"{EV}\" ({SHOCK}). Abnormal moves this size tend to drift for ~2 weeks. I want the {D} side into it. {C}% over {H}d.",
      "\"{EV}\" — {SHOCK}, no headline attached yet. The street reprices these slowly; the drift is the trade. {D} {T}, {C}%.",
      "Event-driven setup on {T}: {EV}. My event study says the {D} side wins {W}% from here. Confidence {C}%.",
      "Fresh dislocation ({EV}, {SHOCK}). Volume confirms real flow behind it. Riding the drift: {D}, {C}%."
    ]
  };
  function fill(tpl, m) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return m[k] !== undefined ? m[k] : "{" + k + "}"; });
  }

  function thesisText(kind, rng, m) {
    return fill(rng.pick(THESIS_COPY[kind]), m);
  }

  var REBUTTALS = [
    "{A}'s {T} {D} at {C}% ignores the tape: 5d return is {R5} and vol just spiked {V}x. This is a falling knife with a narrative.",
    "I've seen this movie. {A} cites {STAT}, but {T}'s {COUNTER}. {C}% confidence? I'd price it at 55% on a good day.",
    "{A} is extrapolating. {T} {D} rests on {STAT} — meanwhile {COUNTER}. Fade it.",
    "Respectfully, {A}'s thesis is consensus dressed as edge. Everyone sees {STAT} on {T}. Where's the variant perception? {COUNTER}.",
    "{C}% on {T}? The base rate for {D} calls after {STAT} is barely 52%. {A} is charging certainty the data doesn't support."
  ];

  var RISK_NOTES = [
    "Sizing check: {T} would be {W}% of NAV — inside the 25% single-name limit, but it's our biggest {SECTOR} exposure. Trim if it runs.",
    "Correlation flag: {T1} and {T2} (both {SECTOR}) now sum to {W}% — a sector shock hurts twice. I'd cap the pair at 30%.",
    "Gross exposure would sit at {G}% — under the 130% ceiling, but no room for new ideas without cuts. Fine for now.",
    "Liquidity is fine on all names (ADV > $200M). No veto from me — but {T} at {W}% gets a stop-loss at -8%.",
    "Factor check: portfolio beta would be {B}. That's a deliberate {REG} bet — just making sure it's deliberate."
  ];

  /* ---------- one research cycle ---------- */
  function runCycle(st) {
    var r = R(st);
    var d = st.day;
    st.cycle++;
    var cyc = st.cycle;
    var cycleTheses = [];

    function pitch(agentId, kind, t, sig, horizon, extra) {
      var dir = sig.s >= 0 ? "long" : "short";
      var conf = confOf(sig.s, r);
      var a = assetOf(t), price = px(st, t, d);
      var m = Object.assign({
        T: t, D: dirWord(dir), C: Math.round(conf * 100), H: horizon,
        P: price.toFixed(2), B: (extra && extra.BETA !== undefined ? extra.BETA : a.beta).toFixed(1),
        SECTOR: a.sector,
        REG: REGIMES[st.regimes[d]].label, DIRWORD: dir === "long" ? "upside" : "downside"
      }, extra || {});
      var item = addFeed(st, { cycle: cyc, kind: "thesis", agentId: agentId, ticker: t,
        dir: dir, conf: conf, text: thesisText(kind, r, m) });
      var pred = addPrediction(st, { cycle: cyc, agentId: agentId, ticker: t, dir: dir,
        conf: conf, horizon: horizon, day: d, resolveDay: d + horizon,
        regime: st.regimes[d], feedId: item.id });
      cycleTheses.push({ pred: pred, item: item, sigAbs: Math.abs(sig.s) });
      return pred;
    }

    // each researcher pitches their 1-2 strongest signals
    var pitchers = [
      { id: "quant", kind: "quant", fn: signalQuant, H: 20 },
      { id: "fund",  kind: "fund",  fn: signalFund,  H: 40 },
      { id: "macro", kind: "macro", fn: signalMacro, H: 20 },
      { id: "news",  kind: "news",  fn: signalNews,  H: 20 }
    ];
    pitchers.forEach(function (P) {
      var scored = ASSETS.map(function (a) {
        var s = P.fn(st, a.t, d);
        return { t: a.t, s: s.s, det: s };
      }).filter(function (x) { return Math.abs(x.s) > 0.18; })
        .sort(function (x, y) { return Math.abs(y.s) - Math.abs(x.s); });
      var n = Math.min(scored.length, 1 + (r.next() < 0.45 ? 1 : 0));
      for (var i = 0; i < n; i++) {
        var x = scored[i], det = x.det;
        var extra = {};
        if (P.kind === "quant") extra = { R20: pct(det.r20), Z: det.z.toFixed(2),
          W: Math.round(52 + 14 * Math.abs(x.s)), RK: i + 1, E: (2 + 6 * Math.abs(x.s)).toFixed(1) };
        if (P.kind === "fund") extra = { G: pct(Math.abs(det.gap)), F: det.ma.toFixed(2) };
        if (P.kind === "macro") extra = { WHY: det.why, BETA: det.beta };
        if (P.kind === "news") extra = det.ev ? { EV: det.ev.headline || det.ev.text, SHOCK: pct(det.ev.shock),
          W: Math.round(54 + 12 * Math.abs(x.s)) } : {};
        if (P.kind === "news" && !det.ev) continue;
        pitch(P.id, P.kind, x.t, x, P.H, extra);
      }
    });

    // the skeptic attacks the two highest-conviction theses
    var targets = cycleTheses.slice().sort(function (a, b) { return b.pred.conf - a.pred.conf; }).slice(0, 2);
    targets.forEach(function (tg) {
      var ag = agentOf(tg.pred.agentId);
      var r5 = pct(retN(st, tg.pred.ticker, d, 5));
      var vmult = (volN(st, tg.pred.ticker, d, 5) / (volN(st, tg.pred.ticker, d, 20) + 1e-9)).toFixed(1);
      var stat = tg.pred.agentId === "quant" ? "a momentum z of " + signalQuant(st, tg.pred.ticker, d).z.toFixed(2)
        : tg.pred.agentId === "fund" ? "a " + pct(Math.abs(signalFund(st, tg.pred.ticker, d).gap)) + " trend dislocation"
        : tg.pred.agentId === "macro" ? "regime tailwinds"
        : "one abnormal tape print";
      var counter = r.next() < 0.5
        ? "crowding is in the " + Math.round(r.range(70, 95)) + "th percentile on my proxy"
        : "the base rate for this setup is barely above a coin flip";
      addFeed(st, { cycle: cyc, kind: "rebuttal", agentId: "skeptic", ticker: tg.pred.ticker,
        refId: tg.item.id, text: fill(r.pick(REBUTTALS), {
          A: ag.name.split(" ")[0] + "'s", T: tg.pred.ticker, D: dirWord(tg.pred.dir),
          C: Math.round(tg.pred.conf * 100), R5: r5, V: vmult, STAT: stat, COUNTER: counter })
      });
    });
    // skeptic occasionally takes her own contrarian shot
    if (r.next() < 0.4 && cycleTheses.length) {
      var fade = r.pick(cycleTheses);
      var fdir = fade.pred.dir === "long" ? "short" : "long";
      var fconf = r.range(0.55, 0.64);
      var item = addFeed(st, { cycle: cyc, kind: "thesis", agentId: "skeptic", ticker: fade.pred.ticker,
        dir: fdir, conf: fconf, text: "Fading " + agentOf(fade.pred.agentId).name.split(" ")[0] + "'s " +
        fade.pred.ticker + " " + dirWord(fade.pred.dir) + " — consensus is crowded and the entry is stale. " +
        "Small " + dirWord(fdir) + " at " + Math.round(fconf * 100) + "%; happy to be wrong cheaply." });
      addPrediction(st, { cycle: cyc, agentId: "skeptic", ticker: fade.pred.ticker, dir: fdir,
        conf: fconf, horizon: 20, day: d, resolveDay: d + 20, regime: st.regimes[d], feedId: item.id });
    }

    // risk manager notes
    var pf = st.portfolio;
    var eq = equity(st);
    var posArr = Object.keys(pf.positions).map(function (t) {
      return { t: t, w: pf.positions[t].shares * px(st, t, d) / eq };
    });
    var gross = posArr.reduce(function (x, p) { return x + Math.abs(p.w); }, 0);
    var rn = r.pick(RISK_NOTES);
    var biggest = posArr.slice().sort(function (a, b) { return Math.abs(b.w) - Math.abs(a.w); })[0];
    addFeed(st, { cycle: cyc, kind: "risk", agentId: "risk", text: fill(rn, {
      T: biggest ? biggest.t : "NVDA", W: pct(Math.abs(biggest ? biggest.w : 0.08)),
      SECTOR: biggest ? assetOf(biggest.t).sector : "Semiconductors",
      T1: posArr[0] ? posArr[0].t : "NVDA", T2: posArr[1] ? posArr[1].t : "AMD",
      G: pct(gross), B: portfolioBeta(st).toFixed(2), REG: REGIMES[st.regimes[d]].label })
    });

    // PM aggregates into target weights, weighted by agent reputation
    var scored = cycleTheses.map(function (ct) {
      var w = repWeight(st, ct.pred.agentId);
      return { ct: ct, score: (ct.pred.dir === "long" ? 1 : -1) * ct.pred.conf * w };
    }).sort(function (a, b) { return Math.abs(b.score) - Math.abs(a.score); }).slice(0, 6);
    var tot = scored.reduce(function (x, s) { return x + Math.abs(s.score); }, 0) || 1;
    var targets2 = scored.map(function (s) {
      var w = clamp(s.score / tot * 1.15, -0.25, 0.25);
      return { t: s.ct.pred.ticker, dir: s.ct.pred.dir, w: w, by: s.ct.pred.agentId, conf: s.ct.pred.conf };
    });
    var lines = targets2.map(function (t2) {
      return t2.t + " " + dirWord(t2.dir) + " " + pct(Math.abs(t2.w), 0) +
        " (" + agentOf(t2.by).name.split(" ")[0] + " " + Math.round(t2.conf * 100) + "%)";
    });
    addFeed(st, { cycle: cyc, kind: "pm", agentId: "pm",
      text: "Book updated for cycle " + cyc + ": " + (lines.length ? lines.join(" · ") : "flat — no edge met the bar") +
      ". Gross " + pct(targets2.reduce(function (x, t2) { return x + Math.abs(t2.w); }, 0), 0) +
      ", sized by live reputation weights." });
    tradeToTargets(st, targets2);

    saveR(st, r);
    return { cycle: cyc, theses: cycleTheses.length };
  }

  /* ---------- portfolio ---------- */
  function equity(st) {
    var d = st.day, eq = st.portfolio.cash;
    Object.keys(st.portfolio.positions).forEach(function (t) {
      eq += st.portfolio.positions[t].shares * px(st, t, d);
    });
    return eq;
  }
  function portfolioBeta(st) {
    var d = st.day, eq = equity(st) || 1, b = 0;
    Object.keys(st.portfolio.positions).forEach(function (t) {
      b += (st.portfolio.positions[t].shares * px(st, t, d) / eq) * betaAt(st, t, d);
    });
    return b;
  }
  function tradeToTargets(st, targets) {
    var d = st.day, eq = equity(st), pf = st.portfolio;
    var want = {};
    targets.forEach(function (t2) { want[t2.t] = { w: t2.w, by: t2.by, conf: t2.conf }; });
    // close names no longer wanted
    Object.keys(pf.positions).forEach(function (t) {
      if (!want[t]) {
        var p = pf.positions[t];
        pf.cash += p.shares * px(st, t, d);
        pf.trades.push({ day: d, cycle: st.cycle, ticker: t, action: "CLOSE", shares: -p.shares });
        delete pf.positions[t];
      }
    });
    // (re)size to targets
    targets.forEach(function (t2) {
      var targetVal = t2.w * eq;
      var cur = pf.positions[t2.t], curVal = cur ? cur.shares * px(st, t2.t, d) : 0;
      var deltaVal = targetVal - curVal;
      if (Math.abs(deltaVal) < eq * 0.002) return;
      var dShares = deltaVal / px(st, t2.t, d);
      pf.cash -= deltaVal;
      if (!cur) pf.positions[t2.t] = { shares: 0, by: t2.by, conf: t2.conf };
      pf.positions[t2.t].shares += dShares;
      pf.positions[t2.t].by = t2.by;
      pf.trades.push({ day: d, cycle: st.cycle, ticker: t2.t,
        action: deltaVal > 0 ? "BUY" : "SELL", shares: dShares, w: t2.w });
    });
  }
  function recordEquity(st) {
    var d = st.day;
    st.portfolio.equityHist.push({ day: d, eq: equity(st) });
    if (st.portfolio.equityHist.length > 600) st.portfolio.equityHist.shift();
  }

  /* ---------- advance time & resolve (replays real sessions) ---------- */
  function canAdvance(st, n) {
    return st.day + (n || 20) <= st.dates.length - 1;
  }
  function sessionsLeft(st) { return st.dates.length - 1 - st.day; }
  function advanceDays(st, n) {
    var room = sessionsLeft(st);
    var k = Math.max(0, Math.min(n, room));
    for (var i = 0; i < k; i++) { st.day++; recordEquity(st); }
    resolveDue(st);
    return { advanced: k, atEnd: sessionsLeft(st) === 0 };
  }

  function resolveDue(st) {
    var r = R(st);
    st.predictions.forEach(function (p) {
      if (p.resolved || p.resolveDay > st.day) return;
      var ret = px(st, p.ticker, p.resolveDay) / px(st, p.ticker, p.day) - 1;
      var win = p.dir === "long" ? ret > 0 : ret < 0;
      var brier = Math.pow(p.conf - (win ? 1 : 0), 2);
      p.resolved = true; p.win = win; p.ret = ret; p.brier = brier;
      var ag = st.agents[p.agentId];
      ag.n++; ag.brierSum += brier; if (win) ag.hits++;
      var bucket = Math.floor(p.conf * 10) * 10;
      var bk = ag.buckets[bucket] || (ag.buckets[bucket] = { n: 0, hit: 0 });
      bk.n++; if (win) bk.hit++;
      var rg = ag.regime[p.regime]; rg.n++; if (win) rg.hit++;
      // attribution: share of position P&L while thesis was live
      var pos = st.portfolio.positions[p.ticker];
      if (pos && pos.by === p.agentId) {
        var pxIn = px(st, p.ticker, p.day), pxOut = px(st, p.ticker, Math.min(p.resolveDay, st.day));
        var dirS = p.dir === "long" ? 1 : -1;
        ag.attrib += pos.shares * dirS * (pxOut - pxIn) * 0.5; // partial credit
      }
      addFeed(st, { cycle: p.cycle, kind: "resolve", agentId: p.agentId, ticker: p.ticker,
        text: (win ? "✅" : "❌") + " " + p.ticker + " " + dirWord(p.dir) +
          " (" + agentOf(p.agentId).name.split(" ")[0] + ", " + Math.round(p.conf * 100) + "%) → " +
          (win ? "HIT" : "MISS") + " " + pct(ret, 1) + " · Brier " + brier.toFixed(2) });
    });
    // reputation trend snapshot
    AGENTS.forEach(function (a) {
      var ag = st.agents[a.id];
      ag.repTrend.push(avgBrier(st, a.id));
      if (ag.repTrend.length > 60) ag.repTrend.shift();
    });
    saveR(st, r);
  }

  function avgBrier(st, id) {
    var ag = st.agents[id];
    return ag.n ? ag.brierSum / ag.n : 0.25;
  }
  function repWeight(st, id) {
    var ag = st.agents[id];
    if (ag.n < 3) return 1.0;
    return clamp(1.7 - 2.2 * avgBrier(st, id), 0.25, 1.5);
  }
  function hitRate(st, id) {
    var ag = st.agents[id];
    return ag.n ? ag.hits / ag.n : 0;
  }

  /* ---------- dates (real trading sessions) ---------- */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function simDate(st, d) {
    var iso = st.dates[d]; // "2026-09-28"
    return MONTHS[+iso.slice(5, 7) - 1] + " " + (+iso.slice(8, 10)) + ", " + iso.slice(0, 4);
  }

  var Sim = {
    ASSETS: ASSETS, AGENTS: AGENTS, REGIMES: REGIMES, START_CAPITAL: START_CAPITAL,
    TICKERS: TICKERS, HIST_NEED: HIST_NEED,
    newFund: newFund, extendMarket: extendMarket,
    advanceDays: advanceDays, canAdvance: canAdvance, sessionsLeft: sessionsLeft,
    runCycle: runCycle, resolveDue: resolveDue,
    equity: equity, portfolioBeta: portfolioBeta, betaAt: betaAt,
    avgBrier: avgBrier, repWeight: repWeight, hitRate: hitRate, simDate: simDate,
    agentOf: agentOf, assetOf: assetOf, px: px, retN: retN, volN: volN, pct: pct,
    signalQuant: signalQuant, signalFund: signalFund, signalMacro: signalMacro, signalNews: signalNews
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Sim;
  else if (typeof window !== "undefined") window.Sim = Sim;
})();
