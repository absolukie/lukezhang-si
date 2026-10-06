/* Meridian Labs — UI layer. Sim engine in sim.js (window.Sim),
   real market data via market-data.js (window.MarketData),
   optional headlines via news.js (window.News). */
(function () {
  "use strict";
  var S = window.Sim, MD = window.MarketData, News = window.News;
  var LS_KEY = "meridian-fund-v2";

  var st = null;          // fund state (v2)
  var dataRes = null;     // { dataset, provenance, note }

  /* ---------- state ---------- */
  function seedFund(market) {
    var s = S.newFund((Date.now() % 90000) + 7, market);
    S.runCycle(s); S.advanceDays(s, 20);
    S.runCycle(s); S.advanceDays(s, 20);
    S.runCycle(s);
    return s;
  }
  function load(market) {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.v === 2 && s.dataId === market.dataId && s.day > 0) return s;
      }
    } catch (e) {}
    return null;
  }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch (e) {} }

  var seen = {};            // feed ids already animated
  var openAgent = null;     // expanded agent card
  var mktTicker = "NVDA";
  var busy = false;

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function fmtM(x) {
    var neg = x < 0; x = Math.abs(x);
    var s = x >= 1e6 ? "$" + (x / 1e6).toFixed(2) + "M"
      : x >= 1e3 ? "$" + (x / 1e3).toFixed(1) + "K" : "$" + x.toFixed(0);
    return (neg ? "−" : "") + s;
  }
  function fmtPct(x, d) { return (x >= 0 ? "+" : "") + (x * 100).toFixed(d === undefined ? 2 : d) + "%"; }
  function pnlCls(x) { return x >= 0 ? "pos" : "neg"; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function setupCanvas(c, hCss) {
    var dpr = window.devicePixelRatio || 1;
    var w = c.clientWidth || 300;
    c.style.height = hCss + "px";
    c.width = Math.round(w * dpr); c.height = Math.round(hCss * dpr);
    var x = c.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: x, w: w, h: hCss };
  }

  /* ---------- data badge ---------- */
  function updateDataBadge() {
    var b = $("data-src");
    if (!b || !dataRes) return;
    var prov = dataRes.provenance, ds = dataRes.dataset;
    var label = prov === "live" ? "● LIVE" : prov === "cache" ? "◐ CACHED" : "○ SNAPSHOT";
    b.innerHTML = '<span class="dsrc ' + prov + '">' + label + "</span> " +
      esc(ds.source) + " · as of " + esc(ds.asOf);
    b.title = dataRes.note;
  }

  /* ---------- header ---------- */
  function renderHeader() {
    var eq = S.equity(st);
    var hist = st.portfolio.equityHist;
    var dayPnl = hist.length > 1 ? hist[hist.length - 1].eq - hist[hist.length - 2].eq : 0;
    $("st-aum").textContent = fmtM(eq);
    var dp = $("st-daypnl");
    dp.textContent = (dayPnl >= 0 ? "+" : "−") + fmtM(Math.abs(dayPnl)).slice(0);
    dp.className = pnlCls(dayPnl);
    var tr = eq / S.START_CAPITAL - 1;
    var te = $("st-totret");
    te.textContent = fmtPct(tr);
    te.className = pnlCls(tr);
    var reg = st.regimes[st.day];
    $("st-regime").innerHTML = '<span class="regime ' + reg + '">' + S.REGIMES[reg].label.toUpperCase() + "</span>";
    $("st-date").textContent = S.simDate(st, st.day);
  }

  /* ---------- agents rail ---------- */
  function renderAgents() {
    var box = $("agents"); box.innerHTML = "";
    $("agent-count").textContent = "· " + S.AGENTS.length;
    S.AGENTS.forEach(function (a) {
      var ag = st.agents[a.id];
      var card = el("div", "acard" + (openAgent === a.id ? " open" : ""));
      var hr = S.hitRate(st, a.id), br = S.avgBrier(st, a.id), w = S.repWeight(st, a.id);
      card.innerHTML =
        '<div class="arow1"><div class="aicon">' + a.icon + "</div>" +
        "<div><div class='aname'>" + a.name + "</div><div class='arole'>" + a.role + "</div></div>" +
        '<div class="arep" title="PM position-sizing weight">' + w.toFixed(2) + "×</div></div>" +
        '<div class="astats"><span>calls <b>' + ag.n + "</b></span>" +
        "<span>hit <b>" + (ag.n ? Math.round(hr * 100) + "%" : "–") + "</b></span>" +
        "<span>brier <b>" + (ag.n ? br.toFixed(2) : "–") + "</b></span></div>";
      if (openAgent === a.id) {
        var det = el("div", "adetail");
        var h = "<h5>REGIME HIT-RATE</h5>";
        ["bull", "bear", "chop"].forEach(function (rk) {
          var r = ag.regime[rk], pctv = r.n ? r.hit / r.n : 0;
          h += '<div class="regbar"><span class="rl">' + rk + '</span><span class="track"><span class="fill" style="width:' +
            Math.round(pctv * 100) + "%;background:" + S.REGIMES[rk].color + '"></span></span><span class="rv">' +
            (r.n ? Math.round(pctv * 100) + "% · " + r.n : "–") + "</span></div>";
        });
        h += "<h5 style='margin-top:10px'>RECENT CALLS</h5><div class='arecent'>";
        var rec = st.predictions.filter(function (p) { return p.agentId === a.id; }).slice(-4).reverse();
        if (!rec.length) h += "<div><span>no calls yet</span><span></span></div>";
        rec.forEach(function (p) {
          var o = p.resolved ? (p.win ? '<span class="pos">HIT</span>' : '<span class="neg">MISS</span>')
            : '<span class="badge open">OPEN</span>';
          h += "<div><span>" + p.ticker + " " + p.dir.toUpperCase() + " @" + Math.round(p.conf * 100) + "%</span>" + o + "</div>";
        });
        det.innerHTML = h + "</div>";
        card.appendChild(det);
      }
      card.addEventListener("click", function () {
        openAgent = openAgent === a.id ? null : a.id;
        renderAgents();
      });
      box.appendChild(card);
    });
  }

  /* ---------- feed ---------- */
  function feedItemEl(it) {
    var a = it.agentId ? S.agentOf(it.agentId) : null;
    var d = el("div", "fitem " + it.kind + (it.kind === "thesis" ? " fthesis" : ""));
    var head = '<div class="fhead">' +
      (a ? '<span class="fdot" style="background:' + a.color + '"></span><span class="fagent">' + a.name + "</span>" +
        '<span class="frole">' + a.role + "</span>" : '<span class="fagent">SYSTEM</span>') +
      '<span class="ftime">' + S.simDate(st, it.day) + (it.cycle ? " · cyc " + it.cycle : "") + "</span></div>";
    var body = "";
    if (it.kind === "thesis") {
      body = '<div><span class="tick">' + it.ticker + '</span> <span class="dir ' + it.dir + '">' +
        it.dir.toUpperCase() + '</span></div><div class="confbar"><span>confidence ' +
        Math.round(it.conf * 100) + '%</span><span class="track"><span class="fill" style="width:' +
        Math.round(it.conf * 100) + '%"></span></span></div><div class="ftext">' + esc(it.text) + "</div>";
    } else if (it.kind === "rebuttal") {
      var ref = null;
      st.feed.forEach(function (f) { if (f.id === it.refId) ref = f; });
      body = '<div class="rebut-tag">🦉 REBUTTAL' +
        (ref && ref.agentId ? " → " + S.agentOf(ref.agentId).name.split(" ")[0] + "'s " + ref.ticker + " call" : "") +
        '</div><div class="ftext" style="margin-top:4px">' + esc(it.text) + "</div>";
    } else {
      body = '<div class="ftext">' + esc(it.text) + "</div>";
    }
    d.innerHTML = head + body;
    return d;
  }
  function renderFeed() {
    var box = $("feed"); box.innerHTML = "";
    var items = st.feed.slice().reverse();
    items.forEach(function (it) { seen[it.id] = 1; box.appendChild(feedItemEl(it)); });
  }
  function revealItems(items, gap, done) {
    var box = $("feed"), i = 0;
    $("live-dot").classList.remove("hidden");
    (function next() {
      if (i >= items.length) {
        $("live-dot").classList.add("hidden");
        if (done) done();
        return;
      }
      var n = feedItemEl(items[i]);
      n.style.animation = "fadein .3s ease";
      box.insertBefore(n, box.firstChild);
      seen[items[i].id] = 1;
      i++;
      setTimeout(next, gap);
    })();
  }

  /* ---------- portfolio ---------- */
  function renderPortfolio() {
    var eq = S.equity(st), d = st.day;
    var c = $("equity-chart"), g = setupCanvas(c, 150), x = g.ctx;
    var hist = st.portfolio.equityHist;
    x.clearRect(0, 0, g.w, g.h);
    if (hist.length > 1) {
      var vals = hist.map(function (p) { return p.eq; });
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      var pad = (mx - mn) || 1; mn -= pad * 0.15; mx += pad * 0.15;
      function X(i) { return 4 + (i / (hist.length - 1)) * (g.w - 8); }
      function Y(v) { return g.h - 18 - ((v - mn) / (mx - mn)) * (g.h - 30); }
      // area
      var grad = x.createLinearGradient(0, 0, 0, g.h);
      grad.addColorStop(0, "rgba(232,182,76,.35)"); grad.addColorStop(1, "rgba(232,182,76,0)");
      x.beginPath(); x.moveTo(X(0), Y(vals[0]));
      for (var i = 1; i < vals.length; i++) x.lineTo(X(i), Y(vals[i]));
      x.lineTo(X(vals.length - 1), g.h - 14); x.lineTo(X(0), g.h - 14); x.closePath();
      x.fillStyle = grad; x.fill();
      x.beginPath(); x.moveTo(X(0), Y(vals[0]));
      for (var j = 1; j < vals.length; j++) x.lineTo(X(j), Y(vals[j]));
      x.strokeStyle = "#e8b64c"; x.lineWidth = 1.8; x.stroke();
      // start line
      x.strokeStyle = "#3a4a63"; x.setLineDash([3, 3]); x.lineWidth = 1;
      x.beginPath(); x.moveTo(4, Y(S.START_CAPITAL)); x.lineTo(g.w - 4, Y(S.START_CAPITAL)); x.stroke();
      x.setLineDash([]);
      x.fillStyle = "#7d8ca3"; x.font = "9px ui-monospace,monospace";
      x.fillText(fmtM(mx), 4, 10); x.fillText(fmtM(mn), 4, g.h - 4);
    }
    // stats
    var pos = st.portfolio.positions, keys = Object.keys(pos);
    var gross = 0, net = 0;
    keys.forEach(function (t) {
      var w = pos[t].shares * S.px(st, t, d) / eq;
      gross += Math.abs(w); net += w;
    });
    $("pf-stats").innerHTML =
      '<div class="pfstat"><label>CASH</label><b>' + fmtM(st.portfolio.cash) + "</b></div>" +
      '<div class="pfstat"><label>GROSS / NET</label><b>' + Math.round(gross * 100) + "% / " + Math.round(net * 100) + "%</b></div>" +
      '<div class="pfstat"><label>BETA</label><b class="num">' + S.portfolioBeta(st).toFixed(2) + "</b></div>" +
      '<div class="pfstat"><label>OPEN TRADES</label><b class="num">' + st.portfolio.trades.length + "</b></div>";
    // positions
    var pb = $("positions"); pb.innerHTML = "";
    if (!keys.length) { pb.innerHTML = '<div class="pempty">Flat — run a research cycle.</div>'; return; }
    keys.map(function (t) {
      var p = pos[t], w8 = p.shares * S.px(st, t, d) / eq;
      var dpnl = d > 0 ? p.shares * (S.px(st, t, d) - S.px(st, t, d - 1)) : 0;
      return { t: t, w: w8, dpnl: dpnl, dir: p.shares >= 0 ? "long" : "short" };
    }).sort(function (a, b) { return Math.abs(b.w) - Math.abs(a.w); }).forEach(function (r2) {
      var row = el("div", "prow");
      row.innerHTML = '<span class="pt">' + r2.t + '</span><span class="dir ' + r2.dir + '">' +
        r2.dir.toUpperCase() + '</span><span class="pw">' + (r2.w >= 0 ? "" : "−") +
        Math.abs(r2.w * 100).toFixed(1) + '%</span><span class="pp ' + pnlCls(r2.dpnl) + '">' +
        (r2.dpnl >= 0 ? "+" : "−") + fmtM(Math.abs(r2.dpnl)).slice(0) + "</span>";
      pb.appendChild(row);
    });
  }

  /* ---------- tabs ---------- */
  var predictors = ["macro", "fund", "quant", "news", "skeptic"];

  function renderLedger() {
    var box = $("tab-ledger");
    var rows = st.predictions.slice().reverse().slice(0, 250);
    var h = '<table class="data"><tr><th>DATE</th><th class="l">AGENT</th><th>TICK</th><th>DIR</th>' +
      "<th>CONF</th><th>HOR</th><th>RESOLVES</th><th>OUTCOME</th><th>RET</th><th>BRIER</th></tr>";
    rows.forEach(function (p) {
      var a = S.agentOf(p.agentId);
      var out = p.resolved
        ? '<span class="badge ' + (p.win ? "hit" : "miss") + '">' + (p.win ? "HIT" : "MISS") + "</span>"
        : '<span class="badge open">OPEN</span>';
      h += "<tr><td>" + S.simDate(st, p.day) + "</td><td class='l'>" + a.name.split(" ")[1] + "</td><td>" + p.ticker +
        '</td><td><span class="dir ' + p.dir + '">' + p.dir.toUpperCase() + "</span></td><td>" +
        Math.round(p.conf * 100) + "%</td><td>" + p.horizon + "d</td><td>" + S.simDate(st, p.resolveDay) +
        "</td><td>" + out + "</td><td class='" + (p.resolved ? pnlCls(p.ret) : "") + "'>" +
        (p.resolved ? fmtPct(p.ret, 1) : "–") + "</td><td>" + (p.resolved ? p.brier.toFixed(2) : "–") + "</td></tr>";
    });
    box.innerHTML = h + "</table>" +
      (st.predictions.length > 250 ? "<p class='footnote'>Showing latest 250 of " + st.predictions.length + ".</p>" : "");
  }

  function sparkline(canvas, data, color) {
    var g = setupCanvas(canvas, 24), x = g.ctx;
    x.clearRect(0, 0, g.w, g.h);
    if (data.length < 2) return;
    var mn = Math.min.apply(null, data), mx = Math.max.apply(null, data);
    var pad = (mx - mn) || 0.01; mn -= pad * 0.2; mx += pad * 0.2;
    x.beginPath();
    data.forEach(function (v, i) {
      var px = 2 + (i / (data.length - 1)) * (g.w - 4);
      var py = g.h - 3 - ((v - mn) / (mx - mn)) * (g.h - 6);
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    });
    x.strokeStyle = color; x.lineWidth = 1.4; x.stroke();
  }

  function renderBoard() {
    var box = $("tab-board");
    var rows = S.AGENTS.map(function (a) {
      var ag = st.agents[a.id];
      return { a: a, ag: ag, brier: S.avgBrier(st, a.id) };
    }).sort(function (x, y) { return x.brier - y.brier; });
    var h = '<table class="data"><tr><th>#</th><th class="l">AGENT</th><th>CALLS</th><th>HIT%</th>' +
      "<th>AVG BRIER ↓</th><th>P&amp;L ATTRIB</th><th>REP WEIGHT</th><th class='l'>BRIER TREND</th></tr>";
    rows.forEach(function (r2, i) {
      h += "<tr><td>" + (i + 1) + "</td><td class='l'>" + r2.a.icon + " " + r2.a.name +
        ' <span style="color:#4d5b73">' + r2.a.role + "</span></td><td>" + r2.ag.n + "</td><td>" +
        (r2.ag.n ? Math.round(S.hitRate(st, r2.a.id) * 100) + "%" : "–") + "</td><td>" +
        (r2.ag.n ? r2.brier.toFixed(3) : "–") + "</td><td class='" + pnlCls(r2.ag.attrib) + "'>" +
        fmtM(r2.ag.attrib) + "</td><td>" + S.repWeight(st, r2.a.id).toFixed(2) + "×</td>" +
        '<td class="l"><canvas class="spark" data-agent="' + r2.a.id + '" style="width:90px"></canvas></td></tr>';
    });
    box.innerHTML = h + "</table><p class='footnote'>Brier score: (confidence − outcome)², graded on <b>real</b> market outcomes. 0 = perfect, 0.25 = coin flip. PM sizes positions by reputation weight.</p>";
    box.querySelectorAll(".spark").forEach(function (c) {
      sparkline(c, st.agents[c.getAttribute("data-agent")].repTrend, "#e8b64c");
    });
  }

  function renderCalib() {
    var box = $("tab-calib");
    box.innerHTML = '<div class="calib-grid" id="calib-grid"></div>';
    var grid = $("calib-grid");
    predictors.forEach(function (id) {
      var a = S.agentOf(id), ag = st.agents[id];
      var card = el("div", "calib-card");
      card.innerHTML = "<h5>" + a.icon + " " + a.name + " <span style='color:#4d5b73;font-weight:400'>· n=" + ag.n + "</span></h5>";
      var cv = el("canvas"); card.appendChild(cv); grid.appendChild(card);
      var g = setupCanvas(cv, 150), x = g.ctx;
      x.clearRect(0, 0, g.w, g.h);
      var padL = 26, padB = 18, W = g.w - padL - 8, H = g.h - 8 - padB;
      function X(v) { return padL + (v / 100) * W; }
      function Y(v) { return 8 + (1 - v / 100) * H; }
      x.strokeStyle = "#243349"; x.lineWidth = 1;
      x.strokeRect(padL, 8, W, H);
      x.strokeStyle = "#4d5b73"; x.setLineDash([4, 4]);
      x.beginPath(); x.moveTo(X(50), Y(50)); x.lineTo(X(100), Y(100)); x.stroke(); x.setLineDash([]);
      x.fillStyle = "#4d5b73"; x.font = "8.5px ui-monospace,monospace";
      [50, 70, 90].forEach(function (v) { x.fillText(v + "", X(v) - 6, g.h - 5); x.fillText(v + "", 6, Y(v) + 3); });
      var any = false;
      Object.keys(ag.buckets).forEach(function (bk) {
        var b = ag.buckets[bk]; if (!b.n) return; any = true;
        var px = X(+bk + 5), py = Y((b.hit / b.n) * 100);
        x.beginPath(); x.arc(px, py, 3 + Math.min(6, b.n / 2), 0, 7);
        x.fillStyle = a.color; x.fill();
        x.fillStyle = "#7d8ca3";
        x.fillText("n=" + b.n, Math.min(px + 8, g.w - 30), py + 3);
      });
      if (!any) { x.fillStyle = "#4d5b73"; x.fillText("no resolved calls yet", padL + 8, 30); }
    });
  }

  function renderMarket() {
    var box = $("tab-market");
    box.innerHTML = '<div id="ticker-row"></div><canvas id="price-chart"></canvas><div class="mkt-stats" id="mkt-stats"></div><div id="mkt-events"></div>';
    var row = $("ticker-row");
    S.ASSETS.forEach(function (a) {
      var b = el("button", "tbtn" + (a.t === mktTicker ? " sel" : ""), a.t);
      b.addEventListener("click", function () { mktTicker = a.t; renderMarket(); });
      row.appendChild(b);
    });
    var d = st.day, N = Math.min(120, d + 1), t0 = d - N + 1;
    var c = $("price-chart"), g = setupCanvas(c, 220), x = g.ctx;
    x.clearRect(0, 0, g.w, g.h);
    var padL = 44, W = g.w - padL - 8, H = g.h - 24;
    // regime bands (measured from SPY)
    var i = t0;
    while (i <= d) {
      var rk = st.regimes[i], j = i;
      while (j <= d && st.regimes[j] === rk) j++;
      x.fillStyle = S.REGIMES[rk].color + "14";
      x.fillRect(padL + ((i - t0) / N) * W, 8, ((j - i) / N) * W, H);
      i = j;
    }
    var prices = []; for (var k = t0; k <= d; k++) prices.push(S.px(st, mktTicker, k));
    var mn = Math.min.apply(null, prices), mx = Math.max.apply(null, prices);
    var pad = (mx - mn) * 0.1 || 1; mn -= pad; mx += pad;
    function X(dd) { return padL + ((dd - t0) / (N - 1 || 1)) * W; }
    function Y(v) { return 8 + (1 - (v - mn) / (mx - mn)) * H; }
    x.beginPath();
    for (var m = t0; m <= d; m++) { var px2 = X(m), py2 = Y(S.px(st, mktTicker, m)); m === t0 ? x.moveTo(px2, py2) : x.lineTo(px2, py2); }
    x.strokeStyle = "#dbe4f0"; x.lineWidth = 1.6; x.stroke();
    x.fillStyle = "#7d8ca3"; x.font = "9px ui-monospace,monospace";
    x.fillText("$" + mx.toFixed(0), 4, 16); x.fillText("$" + mn.toFixed(0), 4, 8 + H);
    // event markers (detected abnormal moves)
    x.fillStyle = "#ffb454";
    st.events.forEach(function (e) {
      if (e.ticker !== mktTicker || e.day < t0) return;
      x.beginPath(); x.arc(X(e.day), Y(S.px(st, mktTicker, e.day)), 3, 0, 7); x.fill();
    });
    // stats
    var a = S.assetOf(mktTicker);
    var r20 = S.px(st, mktTicker, d) / S.px(st, mktTicker, Math.max(0, d - 20)) - 1;
    $("mkt-stats").innerHTML =
      '<div><label>PRICE</label><b>$' + S.px(st, mktTicker, d).toFixed(2) + "</b></div>" +
      '<div><label>20D CHANGE</label><b class="' + pnlCls(r20) + '">' + fmtPct(r20, 1) + "</b></div>" +
      '<div><label>SECTOR</label><b>' + a.sector + "</b></div>" +
      '<div><label>REALIZED BETA</label><b>' + S.betaAt(st, mktTicker, d).toFixed(2) + "</b></div>" +
      '<div><label>REGIME</label><b>' + S.REGIMES[st.regimes[d]].label + "</b></div>";
    var evs = st.events.filter(function (e) { return e.ticker === mktTicker && e.day >= d - 60; }).reverse().slice(0, 5);
    $("mkt-events").innerHTML = evs.length
      ? "<p class='footnote'>Recent detected events" +
        (News.getKey() ? " (headlines via Finnhub)" : " — paste a free Finnhub key in the About tab to attach real headlines") +
        ": " + evs.map(function (e) {
          var label = News.evLabel(e);
          var txt = S.simDate(st, e.day) + " — " + esc(label) + " (" + fmtPct(e.shock, 1) + ")";
          return e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + txt + "</a>" : txt;
        }).join(" · ") + "</p>" : "";
  }

  /* ---------- tab switching ---------- */
  var curTab = "ledger";
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("sel"); });
      t.classList.add("sel");
      document.querySelectorAll(".tabpanel").forEach(function (x) { x.classList.add("hidden"); });
      curTab = t.getAttribute("data-tab");
      $("tab-" + curTab).classList.remove("hidden");
      renderTab();
    });
  });
  function renderTab() {
    if (curTab === "ledger") renderLedger();
    else if (curTab === "board") renderBoard();
    else if (curTab === "calib") renderCalib();
    else if (curTab === "market") renderMarket();
  }

  /* ---------- actions ---------- */
  function renderAll() {
    if (!st) return;
    renderHeader(); renderAgents(); renderFeed(); renderPortfolio(); renderTab(); updateDataBadge();
    var left = S.sessionsLeft(st);
    var ba = $("btn-advance");
    ba.disabled = busy || left === 0;
    ba.title = left === 0 ? "End of available data — refresh ↻ for newer sessions" : "Advance 20 sessions";
    $("btn-refresh").disabled = busy;
    $("btn-cycle").disabled = busy;
  }
  function setBusy(b) {
    busy = b;
    $("btn-cycle").disabled = b; $("btn-advance").disabled = b; $("btn-refresh").disabled = b;
  }

  function afterAction(items, gap) {
    renderHeader(); renderPortfolio();
    revealItems(items, gap, function () { save(); renderAll(); setBusy(false); });
  }

  $("btn-cycle").addEventListener("click", function () {
    if (busy) return;
    setBusy(true);
    var before = st.feed.length;
    S.runCycle(st);
    afterAction(st.feed.slice(before), 500);
  });

  $("btn-advance").addEventListener("click", function () {
    if (busy || S.sessionsLeft(st) === 0) return;
    setBusy(true);
    var before = st.feed.length;
    var res = S.advanceDays(st, 20);
    var items = st.feed.slice(before);
    if (res.atEnd) {
      items.push({ id: st.nextId++, day: st.day, cycle: st.cycle, kind: "system",
        text: "Reached the end of available market data (" + S.simDate(st, st.day) +
          "). Hit ↻ data to check for newer sessions." });
      st.feed.push(items[items.length - 1]);
    }
    // cap reveal spam on long resolutions
    afterAction(items.slice(0, 24), 160);
  });

  $("btn-refresh").addEventListener("click", function () {
    if (busy) return;
    setBusy(true);
    var badge = $("data-src");
    if (badge) badge.innerHTML = '<span class="dsrc live">…</span> refreshing market data';
    MD.load().then(function (res) {
      dataRes = res;
      var ext = S.extendMarket(st, res.dataset);
      return News.enrich(st).then(function () {
        if (ext.added) save();
        renderAll(); setBusy(false);
      });
    }).catch(function (err) {
      renderAll(); setBusy(false);
      if (badge) badge.title = "Refresh failed: " + err.message;
    });
  });

  $("btn-reset").addEventListener("click", function () {
    if (!confirm("Start over with a fresh fund? The current ledger will be wiped. (Market history is real and stays.)")) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    location.reload();
  });

  window.addEventListener("resize", function () { if (st) { renderPortfolio(); renderTab(); } });

  /* ---------- settings (About tab) ---------- */
  function wireSettings() {
    var input = $("finnhub-key");
    if (!input) return;
    input.value = News.getKey();
    $("finnhub-save").addEventListener("click", function () {
      News.setKey(input.value);
      var on = !!News.getKey();
      $("finnhub-status").textContent = on
        ? "Key saved on this device only — fetching real headlines for recent events…"
        : "Key cleared — events show without headlines.";
      if (on && st) News.enrich(st).then(function (r) {
        $("finnhub-status").textContent = "Key saved — attached " + r.attached + " real headline(s) to recent events.";
        save(); renderAll();
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    MD.load().then(function (res) {
      dataRes = res;
      st = load(res.dataset) || seedFund(res.dataset);
      return News.enrich(st).then(function () { save(); });
    }).then(function () {
      $("boot").classList.add("hidden");
      wireSettings();
      renderAll();
    }).catch(function (err) {
      $("boot-msg").textContent = "Couldn't load market data: " + (err && err.message || err) +
        " — check your connection and reload.";
    });
  }
  boot();
})();
