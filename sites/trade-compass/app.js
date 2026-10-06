/* Trade Compass — app logic: portfolio math, live market data (via /api/quotes proxy), indicators, render. */
(function () {
  "use strict";

  var D = TC_DATA;

  /* ---------------- privacy: mask personal dollars by default ---------------- */
  var privacyOn = true;
  try { privacyOn = localStorage.getItem("tc_privacy") !== "off"; } catch (e) {}
  function fmtMoney(x, dec) {
    var d = (dec === undefined) ? 2 : dec;
    var neg = x < 0;
    var s = Math.abs(x).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-$" : "$") + s;
  }
  function mkt(x, dec) { return fmtMoney(x, dec); } // public market data: never masked

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function money(x, dec) {
    if (privacyOn) return "•••"; // personal dollars stay hidden
    return fmtMoney(x, dec);
  }
  function signedMoney(x) {
    if (privacyOn) return "•••";
    return (x >= 0 ? "+" : "-") + fmtMoney(Math.abs(x)).slice(0);
  }
  function pct(x, dec) {
    var d = (dec === undefined) ? 2 : dec;
    return (x >= 0 ? "+" : "") + (x * 100).toFixed(d) + "%";
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function qtyStr(p) {
    if (privacyOn) return "•••";
    return p.qty + (p.kind === "option" ? " contract" : (p.kind === "crypto" ? "" : " sh"));
  }
  function posValue(p) {
    return p.kind === "option" ? p.price * 100 * p.qty : p.price * p.qty;
  }
  function posCost(p) {
    return p.kind === "option" ? p.avgCost * 100 * p.qty : p.avgCost * p.qty;
  }
  function posPnl(p) { return posValue(p) - posCost(p); }
  function posPnlPct(p) { return posPnl(p) / posCost(p); }

  /* ---------------- portfolio overview ---------------- */
  function acctPositions(acct) {
    return D.POSITIONS.filter(function (p) { return p.account === acct; });
  }

  function renderOverview() {
    var invested = 0, pnl = 0;
    acctPositions("individual").forEach(function (p) { invested += posValue(p); pnl += posPnl(p); });

    $("ov-total").textContent = money(D.ACCOUNT_TOTAL);
    var pnlEl = $("ov-pnl");
    pnlEl.textContent = signedMoney(pnl) + " (" + pct(pnl / (invested - pnl)) + ")";
    pnlEl.className = "stat-val " + (pnl >= 0 ? "pos" : "neg");
    $("ov-bp").textContent = money(D.BUYING_POWER);
    $("ov-invested").textContent = money(invested);

    renderAlloc($("alloc"), acctPositions("individual"));
  }

  function render100xOverview() {
    var names = acctPositions("100x");
    var invested = 0, pnl = 0;
    names.forEach(function (p) { invested += posValue(p); pnl += posPnl(p); });

    $("hx-total").textContent = money(D.X100_TOTAL);
    var pnlEl = $("hx-pnl");
    pnlEl.textContent = signedMoney(pnl) + " (" + pct(pnl / (invested - pnl)) + ")";
    pnlEl.className = "stat-val " + (pnl >= 0 ? "pos" : "neg");
    $("hx-invested").textContent = money(invested);

    renderAlloc($("alloc-100x"), names);
  }

  function renderAlloc(wrap, list) {
    wrap.innerHTML = "";
    var invested = 0;
    list.forEach(function (p) { invested += posValue(p); });
    var sorted = list.slice().sort(function (a, b) { return posValue(b) - posValue(a); });
    sorted.forEach(function (p) {
      var v = posValue(p), w = invested ? v / invested * 100 : 0, pp = posPnl(p);
      var row = document.createElement("div");
      row.className = "alloc-row";
      row.innerHTML =
        '<div class="alloc-top"><span class="alloc-sym">' + esc(p.symbol) + '</span>' +
        '<span class="alloc-val">' + money(v) + ' · ' + w.toFixed(1) + '%</span></div>' +
        '<div class="alloc-bar"><div class="alloc-fill" style="width:' + w.toFixed(1) + '%"></div></div>' +
        '<div class="alloc-pnl ' + (pp >= 0 ? "pos" : "neg") + '">' + signedMoney(pp) + " (" + pct(posPnlPct(p)) + ")</div>";
      wrap.appendChild(row);
    });
  }

  /* ---------------- 100x thesis: the real "100x Bagger" account ---------------- */
  function renderThesis() {
    var T = D.THESIS100X;
    var names = acctPositions("100x");

    $("spot-h1").textContent = privacyOn ? "The moonshot" : "The " + fmtMoney(T.total, 0) + " moonshot";
    $("th-sub").textContent = privacyOn ? "5 positions" : "5 positions · " + fmtMoney(T.total, 0);

    $("th-stake").textContent = money(T.total);
    $("th-target").textContent = money(T.total * 100, 0);

    var pnlEl = $("th-pnl");
    pnlEl.textContent = signedMoney(T.openPnl) + " (" + pct(T.openPnl / (T.total - T.openPnl)) + ")";
    pnlEl.className = "stat-val " + (T.openPnl >= 0 ? "pos" : "neg");

    $("th-mult").textContent = "100.0x";

    var tb = $("th-table");
    tb.innerHTML = "";
    names.forEach(function (p) {
      var v = posValue(p), pp = posPnl(p);
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><b>" + esc(p.symbol) + "</b><br><span class='dim'>" + esc(p.name) + "</span></td>" +
        "<td class='num'>" + mkt(p.price) + "</td>" +
        "<td class='num'>" + money(v) + "</td>" +
        "<td class='num " + (pp >= 0 ? "pos" : "neg") + "'><b>" + signedMoney(pp) + "</b><br><span class='dim'>" + pct(posPnlPct(p)) + "</span></td>" +
        "<td class='num'>" + mkt(p.price * 10) + "</td>" +
        "<td class='num'><b>" + mkt(p.price * 100, 0) + "</b></td>";
      tb.appendChild(tr);
    });

    var mg = $("th-must");
    mg.innerHTML = "";
    T.mustGoRight.forEach(function (m) {
      var li = document.createElement("li");
      li.textContent = m;
      mg.appendChild(li);
    });

    $("th-verdict").innerHTML = "<b>The truth:</b> " + esc(T.verdict);
  }

  /* ---------------- indicators ---------------- */
  function sma(vals, n) {
    if (vals.length < n) return null;
    var s = 0;
    for (var i = vals.length - n; i < vals.length; i++) s += vals[i];
    return s / n;
  }
  function emaSeries(vals, n) {
    if (vals.length < n) return null;
    var k = 2 / (n + 1), out = [], e = sma(vals.slice(0, n), n);
    for (var i = n; i < vals.length; i++) { e = vals[i] * k + e * (1 - k); out.push(e); }
    return out;
  }
  function rsi(closes, n) {
    n = n || 14;
    if (closes.length < n + 1) return null;
    var g = 0, l = 0;
    for (var i = 1; i <= n; i++) {
      var d = closes[i] - closes[i - 1];
      if (d > 0) g += d; else l -= d;
    }
    g /= n; l /= n;
    for (var j = n + 1; j < closes.length; j++) {
      var dd = closes[j] - closes[j - 1];
      g = (g * (n - 1) + Math.max(0, dd)) / n;
      l = (l * (n - 1) + Math.max(0, -dd)) / n;
    }
    if (l === 0) return 100;
    return 100 - 100 / (1 + g / l);
  }
  function macd(closes) {
    var e12 = emaSeries(closes, 12), e26 = emaSeries(closes, 26);
    if (!e12 || !e26) return null;
    var mline = [];
    var off = e12.length - e26.length;
    for (var i = 0; i < e26.length; i++) mline.push(e12[i + off] - e26[i]);
    var sig = emaSeries(mline, 9);
    if (!sig) return null;
    var mv = mline[mline.length - 1], sv = sig[sig.length - 1];
    return { macd: mv, signal: sv, hist: mv - sv };
  }
  function rsiLabel(r) {
    if (r === null) return "n/a";
    if (r >= 70) return "Overbought";
    if (r <= 30) return "Oversold";
    if (r >= 55) return "Bullish momentum";
    if (r <= 45) return "Bearish momentum";
    return "Neutral";
  }

  /* ---------------- live quotes (same-origin proxy) ---------------- */
  function quotesURL(symbols) {
    return "/api/quotes?s=" + symbols.join(",");
  }
  function parseQuotes(json, symbols) {
    var out = {};
    symbols.forEach(function (sym) {
      var rows = json[sym];
      if (!Array.isArray(rows) || !rows.length) return;
      rows = rows.filter(function (r) {
        return r && isFinite(r.o) && isFinite(r.h) && isFinite(r.l) && isFinite(r.c);
      });
      rows.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      if (rows.length) out[sym] = rows;
    });
    return out;
  }

  function technicals(rows) {
    var closes = rows.map(function (r) { return r.c; });
    var highs = rows.map(function (r) { return r.h; });
    var lows = rows.map(function (r) { return r.l; });
    var vols = rows.map(function (r) { return r.v; });
    var last = rows[rows.length - 1], prev = rows[rows.length - 2] || last;

    var s20 = sma(closes, 20), s50 = sma(closes, 50), s200 = sma(closes, 200);
    var r = rsi(closes, 14), m = macd(closes);
    var win = closes.slice(-252);
    var hi52 = Math.max.apply(null, win), lo52 = Math.min.apply(null, win);
    var r20 = rows.slice(-20);
    var res = Math.max.apply(null, r20.map(function (x) { return x.h; }));
    var sup = Math.min.apply(null, r20.map(function (x) { return x.l; }));
    var vavg = sma(vols.slice(0, -1), 20);

    var above = 0, n = 0;
    [s20, s50, s200].forEach(function (s) { if (s !== null) { n++; if (last.c > s) above++; } });
    var trend = n === 0 ? "n/a" : (above === n ? "Uptrend" : (above === 0 ? "Downtrend" : "Mixed"));

    function dist(s) { return s === null ? "n/a" : pct((last.c - s) / s, 1); }
    return {
      last: last.c, date: last.date,
      dayChg: (last.c - prev.c) / prev.c,
      s20: s20, s50: s50, s200: s200, d20: dist(s20), d50: dist(s50), d200: dist(s200),
      trend: trend, aboveCount: above, smaCount: n,
      rsi: r, rsiLabel: rsiLabel(r),
      macd: m,
      hi52: hi52, lo52: lo52,
      offHigh: (last.c - hi52) / hi52, aboveLow: (last.c - lo52) / lo52,
      res: res, sup: sup,
      vol: last.v, volAvg: vavg, volRatio: vavg ? last.v / vavg : null
    };
  }

  /* ---------------- position cards ---------------- */
  function techHTML(p, t) {
    function row(k, v, cls) {
      return '<div class="kv"><span class="k">' + k + '</span><span class="v ' + (cls || "") + '">' + v + '</span></div>';
    }
    function smRow(label, s, d) {
      if (s === null) return row(label, "n/a");
      var cls = t.last > s ? "pos" : "neg";
      return row(label, mkt(s) + ' <span class="dim">(' + d + ")</span>", cls);
    }
    var macdTxt = "n/a", macdCls = "";
    if (t.macd) {
      macdTxt = (t.macd.hist >= 0 ? "Bullish" : "Bearish") + ' <span class="dim">(' + t.macd.hist.toFixed(2) + ")</span>";
      macdCls = t.macd.hist >= 0 ? "pos" : "neg";
    }
    var rsiTxt = t.rsi === null ? "n/a" : t.rsi.toFixed(1) + ' <span class="dim">— ' + t.rsiLabel + "</span>";
    var rsiCls = t.rsi === null ? "" : (t.rsi >= 70 || t.rsi <= 30 ? "warn" : (t.rsi >= 55 ? "pos" : (t.rsi <= 45 ? "neg" : "")));
    var h = '<div class="tech-grid">';
    h += row("Last close (" + esc(t.date) + ")", "<b>" + mkt(t.last) + "</b>") ;
    h += row("Day change", pct(t.dayChg), t.dayChg >= 0 ? "pos" : "neg");
    h += row("Trend", "<b>" + t.trend + "</b>" + (t.smaCount ? ' <span class="dim">(' + t.aboveCount + "/" + t.smaCount + " SMAs)</span>" : ""));
    h += smRow("SMA 20", t.s20, t.d20);
    h += smRow("SMA 50", t.s50, t.d50);
    h += smRow("SMA 200", t.s200, t.d200);
    h += row("RSI (14)", rsiTxt, rsiCls);
    h += row("MACD", macdTxt, macdCls);
    h += row("52w high", mkt(t.hi52) + ' <span class="dim">(' + pct(t.offHigh, 1) + " from high)</span>");
    h += row("52w low", mkt(t.lo52) + ' <span class="dim">(' + pct(t.aboveLow, 1) + " above low)</span>");
    h += row("Resistance (20d)", mkt(t.res));
    h += row("Support (20d)", mkt(t.sup));
    h += row("Volume vs 20d avg", t.volRatio === null ? "n/a" : t.volRatio.toFixed(2) + "x", t.volRatio !== null && t.volRatio >= 1.5 ? "warn" : "");
    h += "</div>";
    h += '<p class="src">Live daily data via Yahoo Finance. Computed in your browser.</p>';
    return h;
  }

  function optionTechHTML(p) {
    var today = new Date();
    var expiry = new Date(p.expiryISO + "T00:00:00");
    var daysLeft = Math.max(0, Math.round((expiry - today) / 86400000));
    var breakeven = p.strike + p.avgCost;
    var needPct = (breakeven - p.refPrice) / p.refPrice;
    function row(k, v, cls) {
      return '<div class="kv"><span class="k">' + k + '</span><span class="v ' + (cls || "") + '">' + v + '</span></div>';
    }
    var h = '<div class="tech-grid">';
    h += row("Contract value", "<b>" + mkt(p.price * 100) + "</b> <span class='dim'>(" + mkt(p.price) + " × 100)</span>");
    h += row("Your cost basis", money(p.avgCost * 100) + ' <span class="dim">(' + pct((p.price - p.avgCost) / p.avgCost) + ")</span>", "neg");
    h += row("Strike", mkt(p.strike));
    h += row("Breakeven at expiry", "<b>" + mkt(breakeven) + "</b>");
    h += row("Stock needs", pct(needPct, 1) + ' <span class="dim">to reach breakeven</span>', "warn");
    h += row("Intrinsic value", mkt(0));
    h += row("Time value", mkt(p.price) + ' <span class="dim">(100% of price)</span>');
    h += row("Days to expiry", "<b>" + daysLeft + "</b> <span class='dim'>(Jan 21, 2028)</span>");
    h += row("Worth at expiry if GRAB = $" + p.strike.toFixed(0), mkt(0), "neg");
    h += "</div>";
    h += '<p class="src">Computed from your cost basis — no market data needed.</p>';
    return h;
  }

  function fundHTML(p) {
    var f = p.fundamentals, h = "";
    h += '<p class="biz">' + esc(f.business) + "</p>";
    h += '<div class="tech-grid">';
    f.stats.forEach(function (s) {
      var val = (/account value basis/i.test(s[0]) && privacyOn) ? "•••" : s[1];
      h += '<div class="kv"><span class="k">' + esc(s[0]) + '</span><span class="v">' + esc(val) + "</span></div>";
    });
    h += "</div>";
    h += '<h4 class="mini-h pos">Catalysts</h4><ul class="ticks">';
    f.catalysts.forEach(function (c) { h += "<li>" + esc(c) + "</li>"; });
    h += '</ul><h4 class="mini-h neg">Risks</h4><ul class="ticks">';
    f.risks.forEach(function (r) { h += "<li>" + esc(r) + "</li>"; });
    h += '</ul><p class="src">' + esc(D.FUND_LABEL) + "</p>";
    return h;
  }

  function renderCards() {
    var wrap = $("cards");
    wrap.innerHTML = "";
    var groups = [
      ["100x", "100x Bagger account — the five speculative names"],
      ["individual", "Individual account"]
    ];
    groups.forEach(function (g) {
      var h = document.createElement("h3");
      h.className = "acct-h";
      h.textContent = g[1];
      wrap.appendChild(h);
      D.POSITIONS.forEach(function (p, idx) {
        if (p.account !== g[0]) return;
        var v = posValue(p), pp = posPnl(p), pctv = posPnlPct(p);
        var card = document.createElement("section");
        card.className = "card";
        card.id = "card-" + p.id;
        card.innerHTML =
          '<div class="card-head">' +
            '<div><div class="card-sym">' + esc(p.symbol) + '</div>' +
            '<div class="card-name">' + esc(p.name) + '</div></div>' +
            '<div class="card-nums"><div class="card-val">' + money(v) + '</div>' +
            '<div class="' + (pp >= 0 ? "pos" : "neg") + '">' + signedMoney(pp) + " (" + pct(pctv) + ")</div></div>" +
          "</div>" +
          '<div class="card-meta"><span>' + qtyStr(p) +
          " @ " + mkt(p.price) + '</span><span class="dim">avg ' + money(p.avgCost) + "</span></div>" +
          '<p class="tagline">' + esc(p.tagline) + "</p>" +
          '<div class="tabs">' +
            '<button class="tab active" data-tab="tech" data-i="' + idx + '">Technicals</button>' +
            '<button class="tab" data-tab="fund" data-i="' + idx + '">Fundamentals</button>' +
            '<button class="tab" data-tab="take" data-i="' + idx + '">My take</button>' +
          "</div>" +
          '<div class="tab-body" id="tb-' + p.id + '"><div class="loading">Loading live data…</div></div>';
        wrap.appendChild(card);
      });
    });
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest(".tab");
      if (!b) return;
      var card = b.closest(".card");
      card.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      b.classList.add("active");
      showTab(D.POSITIONS[+b.dataset.i], b.dataset.tab);
    });
  }

  var liveData = {};   // yahoo-proxy symbol -> rows
  var liveFailed = false;

  function showTab(p, tab) {
    var body = $("tb-" + p.id);
    if (tab === "fund") { body.innerHTML = fundHTML(p); return; }
    if (tab === "take") {
      body.innerHTML = '<p class="take">' + esc(p.take) + '</p><p class="src">Educational opinion, not financial advice.</p>';
      return;
    }
    // technicals
    if (p.kind === "option") { body.innerHTML = optionTechHTML(p); return; }
    if (liveFailed) {
      body.innerHTML = '<div class="unavail">Live market data unavailable.<br><button class="retry" id="retry-btn">Retry</button></div>';
      var rb = $("retry-btn");
      if (rb) rb.onclick = loadLive;
      return;
    }
    var rows = liveData[p.stooq];
    if (!rows) { body.innerHTML = '<div class="loading">Loading live data…</div>'; return; }
    body.innerHTML = techHTML(p, technicals(rows));
  }

  function refreshVisibleTech() {
    D.POSITIONS.forEach(function (p) {
      var card = $("card-" + p.id);
      if (!card) return;
      var active = card.querySelector(".tab.active");
      if (active && active.dataset.tab === "tech") showTab(p, "tech");
    });
  }

  function loadLive() {
    var syms = D.POSITIONS.filter(function (p) { return p.stooq; }).map(function (p) { return p.stooq; });
    var uniq = syms.filter(function (s, i) { return syms.indexOf(s) === i; });
    liveFailed = false;
    refreshVisibleTech();
    var ctrl = null, timer = null;
    try {
      ctrl = new AbortController();
      timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 20000);
    } catch (e) { ctrl = null; }
    var opts = ctrl ? { signal: ctrl.signal } : {};
    fetch(quotesURL(uniq), opts)
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (json) {
        var parsed = parseQuotes(json, uniq);
        if (!Object.keys(parsed).length) throw new Error("no data");
        liveData = parsed;
        liveFailed = false;
        refreshVisibleTech();
        var stamp = $("data-stamp");
        if (stamp) {
          var dates = Object.keys(parsed).map(function (k) { return parsed[k][parsed[k].length - 1].date; });
          dates.sort();
          stamp.textContent = "Market data through " + dates[dates.length - 1] + " (Yahoo Finance, daily)";
        }
      })
      .catch(function () {
        liveFailed = true;
        refreshVisibleTech();
      })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  /* ---------------- privacy toggle ---------------- */
  function paintPrivacyBtn() {
    var b = $("privacy-btn");
    if (b) b.textContent = privacyOn ? "🔒 Numbers hidden" : "🔓 Numbers shown";
  }
  function rerenderAll() {
    renderOverview();
    render100xOverview();
    renderThesis();
    renderCards();
    refreshVisibleTech();
    paintPrivacyBtn();
  }

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderOverview();
    render100xOverview();
    renderThesis();
    renderCards();
    loadLive();
    paintPrivacyBtn();
    var rb = $("refresh-btn");
    if (rb) rb.addEventListener("click", loadLive);
    var pb = $("privacy-btn");
    if (pb) pb.addEventListener("click", function () {
      privacyOn = !privacyOn;
      try { localStorage.setItem("tc_privacy", privacyOn ? "on" : "off"); } catch (e) {}
      rerenderAll();
    });
  });
})();
