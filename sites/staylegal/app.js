/* StayLegal app logic. Vanilla JS, no dependencies. */
"use strict";

(function () {
  var DATA = (typeof STAYLEGAL_DATA !== "undefined")
    ? STAYLEGAL_DATA
    : { cities: [], demoAddresses: [], lastChecked: "" };

  var form = document.getElementById("searchForm");
  var input = document.getElementById("addressInput");
  var resultSection = document.getElementById("resultSection");
  var unknownSection = document.getElementById("unknownSection");
  var savedSection = document.getElementById("savedSection");

  var currentCity = null;
  var currentAddress = "";
  var perspective = "investor"; // or "hosted"

  /* ---------- jurisdiction matching ---------- */
  function normalize(s) {
    return (s || "").toLowerCase().replace(/[.,#]/g, " ").replace(/\s+/g, " ").trim();
  }

  function matchCity(address) {
    var n = normalize(address);
    if (!n) return null;
    // 3-digit entries in keywords are ZIP prefixes: only match them against
    // real 5-digit ZIP codes in the address, never as loose substrings
    // (e.g. "100 Main St" must not match NYC's "100" prefix).
    var zips = n.match(/\b\d{5}(?:-\d{4})?\b/g) || [];
    var best = null, bestLen = 0;
    DATA.cities.forEach(function (c) {
      (c.keywords || []).forEach(function (kw) {
        var k = normalize(kw);
        if (!k) return;
        var hit;
        if (/^\d{3}$/.test(k)) {
          hit = zips.some(function (z) { return z.indexOf(k) === 0; });
        } else {
          hit = n.indexOf(k) !== -1;
        }
        if (hit && k.length > bestLen) {
          best = c; bestLen = k.length;
        }
      });
    });
    return best;
  }

  /* ---------- storage ---------- */
  function loadJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* ---------- verdict labels ---------- */
  var VERDICTS = {
    legal:  { stamp: "Legal", short: "Legal" },
    permit: { stamp: "Legal with permit", short: "Permit needed" },
    banned: { stamp: "Not allowed", short: "Not allowed" }
  };

  /* ---------- render ---------- */
  function kv(el, rows) {
    el.innerHTML = "";
    rows.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "row";
      var dt = document.createElement("dt"); dt.textContent = r.label;
      var dd = document.createElement("dd"); dd.textContent = r.value;
      row.appendChild(dt); row.appendChild(dd);
      el.appendChild(row);
    });
  }

  function currentView(city) {
    if (perspective === "hosted" && city.hosted) {
      return {
        verdict: city.hosted.verdict,
        headline: city.hosted.headline,
        summary: city.hosted.summary,
        permit: city.hosted.permit || city.permit
      };
    }
    return { verdict: city.verdict, headline: city.headline, summary: city.summary, permit: city.permit };
  }

  function setPerspective(p) {
    perspective = p;
    var inv = document.getElementById("segInvestor");
    var hos = document.getElementById("segHosted");
    inv.classList.toggle("on", p === "investor");
    hos.classList.toggle("on", p === "hosted");
    inv.setAttribute("aria-pressed", p === "investor" ? "true" : "false");
    hos.setAttribute("aria-pressed", p === "hosted" ? "true" : "false");
    if (currentCity) paintVerdict(currentCity, currentAddress, false);
  }

  document.getElementById("segInvestor").addEventListener("click", function () { setPerspective("investor"); });
  document.getElementById("segHosted").addEventListener("click", function () { setPerspective("hosted"); });

  function paintVerdict(city, address, scroll) {
    var view = currentView(city);
    var v = VERDICTS[view.verdict] || VERDICTS.permit;

    document.getElementById("resultCity").textContent = city.city + ", " + city.state;
    var card = document.getElementById("verdictCard");
    card.className = "verdict " + view.verdict;
    var stamp = document.getElementById("verdictStamp");
    stamp.textContent = v.stamp;
    stamp.classList.remove("pop");
    void stamp.offsetWidth; /* restart the pop animation */
    stamp.classList.add("pop");
    document.getElementById("verdictHeadline").textContent = view.headline;
    document.getElementById("verdictSummary").textContent = view.summary;
    document.getElementById("verdictAddr").textContent = "Checked: " + address;

    kv(document.getElementById("permitKv"), [
      { label: "Permit", value: view.permit.name },
      { label: "Issued by", value: view.permit.issuer },
      { label: "Cost", value: view.permit.cost },
      { label: "Renewal", value: view.permit.renewal }
    ]);
    kv(document.getElementById("limitsKv"), city.limits);
    kv(document.getElementById("taxesKv"), city.taxes);

    renderSteps(city);
    renderChanges(city);

    var src = document.getElementById("sourcesList");
    src.innerHTML = "";
    (city.sources || []).forEach(function (s, i) {
      if (i > 0) src.appendChild(document.createTextNode(" · "));
      var a = document.createElement("a");
      a.href = s.url; a.textContent = s.label;
      a.target = "_blank"; a.rel = "noopener";
      src.appendChild(a);
    });
    document.getElementById("checkedLine").textContent =
      "Rules researched " + DATA.lastChecked + ". They change — verify with the city before you buy.";

    resultSection.classList.remove("hidden");
    unknownSection.classList.add("hidden");
    if (scroll !== false) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCity(city, address) {
    currentCity = city;
    currentAddress = address;

    try {
      history.replaceState(null, "",
        "#/check/" + city.id + "?address=" + encodeURIComponent(address));
    } catch (e) {}

    paintVerdict(city, address, true);
  }

  function renderSteps(city) {
    var list = document.getElementById("stepsList");
    list.innerHTML = "";
    var key = "staylegal.checklist." + city.id;
    var done = loadJSON(key, {});
    var total = city.steps.length, doneCount = 0;

    city.steps.forEach(function (s, i) {
      var li = document.createElement("li");
      var checked = !!done[i];
      if (checked) { li.classList.add("done"); doneCount++; }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "check";
      btn.setAttribute("role", "checkbox");
      btn.setAttribute("aria-checked", checked ? "true" : "false");
      btn.setAttribute("aria-label", "Mark step done: " + s.title);
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">' +
        '<path d="M2.5 7.5l3.2 3.2L11.5 4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
      btn.addEventListener("click", function () {
        var d = loadJSON(key, {});
        d[i] = !d[i];
        saveJSON(key, d);
        renderSteps(city);
      });
      var body = document.createElement("div");
      var t = document.createElement("div"); t.className = "t"; t.textContent = (i + 1) + ". " + s.title;
      var d = document.createElement("div"); d.className = "d"; d.textContent = s.detail;
      body.appendChild(t); body.appendChild(d);
      li.appendChild(btn); li.appendChild(body);
      list.appendChild(li);
    });

    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    document.getElementById("checkProgress").style.width = pct + "%";
  }

  function renderChanges(city) {
    var box = document.getElementById("changesList");
    box.innerHTML = "";
    (city.changes || []).forEach(function (c) {
      var div = document.createElement("div");
      div.className = "change";
      var t = document.createElement("div"); t.className = "t"; t.textContent = c.title;
      var d = document.createElement("div"); d.className = "d"; d.textContent = c.detail;
      div.appendChild(t); div.appendChild(d);
      box.appendChild(div);
    });
  }

  function renderUnknown(address) {
    currentCity = null;
    document.getElementById("coveredCount").textContent = DATA.cities.length;
    var chips = document.getElementById("cityChips");
    chips.innerHTML = "";
    DATA.cities.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.style.color = "var(--blue)";
      b.style.borderColor = "var(--line)"; b.style.background = "#fff";
      b.textContent = c.city + ", " + c.state;
      b.addEventListener("click", function () {
        var demo = "1 Main St, " + c.city + ", " + c.state;
        input.value = demo;
        doCheck(demo);
      });
      chips.appendChild(b);
    });
    resultSection.classList.add("hidden");
    unknownSection.classList.remove("hidden");
    unknownSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- saved checks ---------- */
  function renderSaved() {
    var checks = loadJSON("staylegal.checks", []);
    var box = document.getElementById("savedList");
    box.innerHTML = "";
    if (!checks.length) { savedSection.classList.add("hidden"); return; }
    savedSection.classList.remove("hidden");
    checks.slice().reverse().forEach(function (c, ri) {
      var idx = checks.length - 1 - ri;
      var div = document.createElement("div");
      div.className = "saved-item";
      var v = VERDICTS[c.verdict] || VERDICTS.permit;
      var pill = document.createElement("span");
      pill.className = "pill " + c.verdict; pill.textContent = v.short;
      var a = document.createElement("div"); a.className = "a";
      var name = document.createElement("div"); name.textContent = c.cityLabel;
      var s = document.createElement("div"); s.className = "s"; s.textContent = c.address;
      a.appendChild(name); a.appendChild(s);
      var open = document.createElement("button");
      open.type = "button"; open.className = "btn ghost";
      open.style.padding = "8px 12px"; open.style.fontSize = "13px";
      open.textContent = "Open";
      open.addEventListener("click", function () {
        var city = null;
        DATA.cities.forEach(function (cc) { if (cc.id === c.cityId) city = cc; });
        if (city) { setPerspective("investor"); input.value = c.address; renderCity(city, c.address); }
      });
      var del = document.createElement("button");
      del.type = "button"; del.className = "linklike"; del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove saved check for " + c.address);
      del.addEventListener("click", function () {
        var all = loadJSON("staylegal.checks", []);
        all.splice(idx, 1);
        saveJSON("staylegal.checks", all);
        try{ if(window.__staylegalSync) window.__staylegalSync.onSave(); }catch(e){}
        renderSaved();
      });
      div.appendChild(pill); div.appendChild(a); div.appendChild(open); div.appendChild(del);
      box.appendChild(div);
    });
  }

  document.getElementById("copyLinkBtn").addEventListener("click", function () {
    var btn = document.getElementById("copyLinkBtn");
    function done(label) {
      btn.textContent = label;
      setTimeout(function () { btn.textContent = "Copy link"; }, 1600);
    }
    var url = location.href;
    function legacyCopy(ok, fail) {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        if (document.execCommand("copy")) ok(); else fail();
      } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { done("Copied"); },
        function () { legacyCopy(function () { done("Copied"); }, function () { done("Copy failed"); }); }
      );
    } else {
      legacyCopy(function () { done("Copied"); }, function () { done("Copy failed"); });
    }
  });

  document.getElementById("saveBtn").addEventListener("click", function () {    if (!currentCity) return;
    var checks = loadJSON("staylegal.checks", []);
    var dupe = checks.some(function (c) {
      return c.cityId === currentCity.id && c.address === currentAddress;
    });
    if (!dupe) {
      checks.push({
        cityId: currentCity.id,
        cityLabel: currentCity.city + ", " + currentCity.state,
        verdict: currentCity.verdict,
        address: currentAddress,
        at: Date.now()
      });
      saveJSON("staylegal.checks", checks);
    }
    try{ if(window.__staylegalSync) window.__staylegalSync.onSave(); }catch(e){}
    renderSaved();
    savedSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- search ---------- */
  function doCheck(address) {
    var city = matchCity(address);
    if (city) renderCity(city, address);
    else renderUnknown(address);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) {
      input.focus();
      input.setAttribute("placeholder", "Type an address first, e.g. 123 Main St, Austin, TX");
      return;
    }
    doCheck(v);
  });

  /* ---------- demo chips ---------- */
  var demoBox = document.getElementById("demoChips");
  (DATA.demoAddresses || []).forEach(function (d) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = d.label;
    b.addEventListener("click", function () {
      input.value = d.address;
      doCheck(d.address);
    });
    demoBox.appendChild(b);
  });

  renderSaved();

  /* deep link: #/check/<city-id>?address=... */
  function applyDeepLink() {
    var h = location.hash || "";
    var m = h.match(/^#\/check\/([^?]+)\?address=(.*)$/);
    if (!m) return false;
    var city = null;
    DATA.cities.forEach(function (c) { if (c.id === decodeURIComponent(m[1])) city = c; });
    if (!city) return false;
    var addr = "";
    try { addr = decodeURIComponent(m[2]); } catch (e) {}
    if (!addr) return false;
    input.value = addr;
    setPerspective("investor");
    renderCity(city, addr);
    return true;
  }
  applyDeepLink();
  window.addEventListener("hashchange", applyDeepLink);

  /* ---------- sync bridge (prototype backend; see sync.js) ---------- */
  var syncBridgeS = null;
  window.__staylegal = {
    getS: function(){ syncBridgeS = { checks: loadJSON("staylegal.checks", []) }; return syncBridgeS; },
    saveLocal: function(){ if (syncBridgeS) saveJSON("staylegal.checks", syncBridgeS.checks); },
    refresh: function(){ renderSaved(); }
  };
})();
