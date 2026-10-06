/* ============================================================
   MERIDIAN LABS — optional real headlines
   The event feed works without this: events are detected abnormal
   moves with real dates and sizes. If the user pastes their own free
   Finnhub API key (Settings in the About tab), recent events get real
   published headlines attached. The key lives in localStorage only —
   it is never written to the repo or sent anywhere except Finnhub.
   ============================================================ */
(function () {
  "use strict";

  var KEY_LS = "meridian-finnhub-key";
  var CACHE_LS = "meridian-headlines-v1";

  function getKey() {
    try { return (localStorage.getItem(KEY_LS) || "").trim(); } catch (e) { return ""; }
  }
  function setKey(k) {
    try {
      k = (k || "").trim();
      if (k) localStorage.setItem(KEY_LS, k); else localStorage.removeItem(KEY_LS);
      localStorage.removeItem(CACHE_LS); // key changed → refetch
    } catch (e) {}
  }
  function loadCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_LS) || "{}"); } catch (e) { return {}; }
  }
  function saveCache(c) {
    try { localStorage.setItem(CACHE_LS, JSON.stringify(c)); } catch (e) {}
  }

  function dayOf(iso) { return iso.slice(0, 10); }
  function addDays(iso, n) {
    var d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function fetchTickerNews(key, ticker, from, to) {
    var url = "https://finnhub.io/api/v1/company-news?symbol=" + encodeURIComponent(ticker) +
      "&from=" + from + "&to=" + to + "&token=" + encodeURIComponent(key);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Finnhub HTTP " + r.status);
      return r.json();
    }).then(function (arr) {
      return (arr || []).filter(function (a) { return a && a.headline; })
        .map(function (a) {
          return { headline: a.headline, url: a.url || "",
            source: a.source || "", date: dayOf(new Date(a.datetime * 1000).toISOString()) };
        });
    });
  }

  // Attach real headlines to recent headline-less events. Never throws.
  // st: fund state (needs .events with {day,ticker} and .dates), returns Promise.
  function enrich(st, maxEvents) {
    var key = getKey();
    if (!key || !st || !st.events || !st.events.length) return Promise.resolve({ attached: 0, reason: key ? "no-events" : "no-key" });
    maxEvents = maxEvents || 12;
    var recent = st.events.slice(-60).filter(function (e) { return !e.headline; }).slice(-maxEvents);
    if (!recent.length) return Promise.resolve({ attached: 0, reason: "up-to-date" });
    var byTicker = {};
    recent.forEach(function (e) { (byTicker[e.ticker] = byTicker[e.ticker] || []).push(e); });
    var cache = loadCache();
    var jobs = Object.keys(byTicker).map(function (ticker) {
      var evs = byTicker[ticker];
      var dates = evs.map(function (e) { return st.dates[e.day]; });
      var from = dates.reduce(function (a, b) { return a < b ? a : b; });
      var to = addDays(dates.reduce(function (a, b) { return a > b ? a : b; }), 2);
      var ck = ticker + "|" + from + "|" + to;
      var got = cache[ck] ? Promise.resolve(cache[ck]) :
        fetchTickerNews(key, ticker, from, to).then(function (arts) {
          cache[ck] = arts; saveCache(cache); return arts;
        }).catch(function () { return []; });
      return got.then(function (arts) {
        var n = 0;
        evs.forEach(function (e) {
          var ed = st.dates[e.day];
          var hit = null;
          for (var i = 0; i < arts.length; i++) {
            var ad = arts[i].date;
            if (ad >= ed && ad <= addDays(ed, 4)) { hit = arts[i]; break; }
          }
          if (hit) { e.headline = hit.headline; e.url = hit.url; e.source = hit.source; n++; }
        });
        return n;
      });
    });
    return Promise.all(jobs).then(function (ns) {
      return { attached: ns.reduce(function (a, b) { return a + b; }, 0) };
    }).catch(function () { return { attached: 0, reason: "fetch-failed" }; });
  }

  function evLabel(e) { return e.headline || e.text; }

  var News = { getKey: getKey, setKey: setKey, enrich: enrich, evLabel: evLabel };
  if (typeof module !== "undefined" && module.exports) module.exports = News;
  else if (typeof window !== "undefined") window.News = News;
})();
