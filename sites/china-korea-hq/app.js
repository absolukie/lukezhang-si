/* China + Korea Trip HQ — app.js (pre-trip only)
   Countdown to departure, daily prep missions, cities research,
   taste bucket list, quizzes, settings. Fully static, offline-safe. */
(function () {
  "use strict";

  /* ---------- storage ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("ckh_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ckh_" + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem("ckh_" + k); } catch (e) {} }
  };

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function todayStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function addDaysStr(s, n) {
    var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return todayStr(d);
  }
  function dayOfYear() {
    var now = new Date(), start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - start) / 86400000);
  }
  function niceDate(ymd) {
    var p = String(ymd).split("-");
    var M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return M[+p[1] - 1] + " " + (+p[2]) + ", " + p[0];
  }
  var CITY_ORDER = ["shanghai", "beijing", "chengdu", "seoul"];
  function cityById(id) { return HQ.CITIES.filter(function (c) { return c.id === id; })[0]; }

  /* ---------- config: one optional departure date, never invented ---------- */
  function getConfig() { return store.get("config", {}); }
  function daysUntilDeparture() {
    var dep = getConfig().departure;
    if (!dep) return null;
    var p = dep.split("-"), t = todayStr().split("-");
    var a = new Date(+p[0], +p[1] - 1, +p[2]), b = new Date(+t[0], +t[1] - 1, +t[2]);
    return Math.round((a - b) / 86400000);
  }

  /* ---------- XP ---------- */
  function xp() { return store.get("xp", 0); }
  function levelFor(x) { return Math.floor(x / 150) + 1; }
  function addXP(n) {
    var before = levelFor(xp());
    store.set("xp", xp() + n);
    renderXP();
    if (levelFor(xp()) > before && typeof A.levelUp === "function") A.levelUp(levelFor(xp()));
  }
  function renderXP() {
    var el = $("xp-badge");
    if (el) el.textContent = xp() + " XP · Lv " + levelFor(xp());
  }

  /* ---------- phrases ---------- */
  function phraseOfDay() {
    var all = [];
    (HQ.PHRASES_MANDARIN || []).forEach(function (r) { all.push({ lang: "mandarin", front: r.p, py: r.py, en: r.en, use: r.use }); });
    (HQ.PHRASES_KOREAN || []).forEach(function (r) { all.push({ lang: "korean", front: r.p, py: r.py, en: r.en, use: r.use }); });
    if (!all.length) return null;
    return all[dayOfYear() % all.length];
  }
  function phraseCard(ph) {
    if (!ph) return "";
    return '<div class="phrase-card"><div class="p-big">' + esc(ph.front) + '</div>' +
      '<div class="p-py">' + esc(ph.py) + " · " + (ph.lang === "mandarin" ? "Mandarin" : "Korean") + "</div>" +
      '<div class="p-en">' + esc(ph.en) + "</div>" +
      (ph.use ? '<div class="p-use">' + esc(ph.use) + "</div>"
        : '<div class="p-use">Say it out loud three times. Then try it on each other.</div>') + "</div>";
  }

  /* ---------- daily prep mission ---------- */
  function dailyPrep() {
    var list = HQ.DAILY_PREP || [];
    return list[dayOfYear() % list.length];
  }
  function dailyPrepDone() { return (store.get("dailyprep", {}))[todayStr()] === true; }
  function setDailyPrep(done) {
    var d = store.get("dailyprep", {});
    if (done) d[todayStr()] = true; else delete d[todayStr()];
    store.set("dailyprep", d);
  }

  /* ---------- home: countdown + "what should we do now" ---------- */
  function countdownHTML() {
    var d = daysUntilDeparture();
    if (d == null) {
      return '<div class="countdown-card"><div class="big">Dec 2026</div>' +
        '<div class="lbl">The adventure is coming. Set your exact departure date for a live countdown.</div>' +
        '<button class="btn-small" data-go="screen-settings" style="margin-top:10px">Set departure date →</button></div>';
    }
    if (d < 0) {
      return '<div class="countdown-card"><div class="big">✈️</div>' +
        '<div class="lbl">Wheels up! Have the most amazing trip — your prep got you here.</div></div>';
    }
    if (d === 0) {
      return '<div class="countdown-card"><div class="big">Today!</div>' +
        '<div class="lbl">Departure day. Passports, chargers, snacks — go!</div></div>';
    }
    return '<div class="countdown-card"><div class="big">' + d + '</div>' +
      '<div class="lbl">day' + (d === 1 ? "" : "s") + " until departure · " + esc(niceDate(getConfig().departure)) + "</div></div>";
  }
  function upNextHTML() {
    /* Pass 1: one clear priority, ranked by what matters most right now */
    var items = [];
    if (!A.practicedToday()) {
      items.push({ icon: "🃏", title: "Practice today", text: "A short flashcard session keeps your streak alive.", go: "screen-flash", cta: "Start session →" });
    }
    var w = A.currentWeekly && A.currentWeekly();
    if (w && !A.weeklyDone(w.week)) {
      items.push({ icon: "📅", title: "This week's mission: " + w.title, text: w.text, action: "week", wk: w.week, wxp: w.xp });
    }
    var weak = A.weakestCategory && A.weakestCategory();
    if (weak) {
      items.push({ icon: weak.icon, title: "Boost: " + weak.name, text: weak.name + " readiness is at " + weak.pct + "% — knock out the next item.", go: "screen-ready", cta: "Open checklist →" });
    }
    if (!items.length) {
      items.push({ icon: "🧠", title: "Take a culture quiz", text: "You're in great shape — sharpen up with a quiz.", go: "screen-learn", cta: "Open Learn →" });
    }
    var top = items[0];
    var btn = top.action === "week"
      ? '<button class="btn-small" data-weekdone="' + top.wk + '" data-wxp="' + top.wxp + '">Mark done (+' + top.wxp + " XP)</button>"
      : '<button class="btn-small" data-go="' + top.go + '">' + top.cta + "</button>";
    return '<div class="card upnext"><div class="wm-label">Up next — do this first</div>' +
      '<h3>' + top.icon + " " + esc(top.title) + '</h3><p class="page-sub">' + esc(top.text) + "</p>" + btn + "</div>";
  }
  function renderHome() {
    var st = A.streak ? A.streak() : { count: 0 };
    var m = dailyPrep(), done = dailyPrepDone();
    var html = countdownHTML();
    html += upNextHTML();
    html += '<div class="card"><div class="wm-label">Today\'s prep mission</div>' +
      '<p style="margin:6px 0"><b>' + esc(m) + "</b></p>" +
      (done ? '<span class="muted">✓ Done today — nice work.</span>'
        : '<button class="btn-small" id="dp-done">Mark done (+' + (HQ.XP.mission || 15) + " XP)</button>") + "</div>";
    html += '<div id="home-ready">' + (A.readyTeaserHTML ? A.readyTeaserHTML() : "") + "</div>";
    html += '<div class="card"><div class="wm-label">Phrase of the day</div>' + phraseCard(phraseOfDay()) +
      '<button class="btn-small" data-go="screen-phrase">More phrases →</button></div>';
    html += '<div class="card"><h3>🏙️ Know your cities</h3><p class="page-sub">Research before you go.</p>' +
      CITY_ORDER.map(function (id) {
        var c = cityById(id);
        return '<button class="menu-item theme-link" data-city="' + id + '">' + esc(c.cn) + ' <span>' + esc(c.name) + "</span><em>→</em></button>";
      }).join("") + "</div>";
    $("home-body").innerHTML = html;
    var btn = $("dp-done");
    if (btn) btn.addEventListener("click", function () {
      setDailyPrep(true);
      if (A.recordPractice) A.recordPractice();
      addXP(HQ.XP.mission || 15);
      renderHome();
    });
    $("home-body").querySelectorAll("[data-city]").forEach(function (b) {
      b.addEventListener("click", function () { openCity(b.getAttribute("data-city")); });
    });
    if (A.wireWeekly) A.wireWeekly($("home-body"));
    if (A.animateRing) A.animateRing($("home-body"));
  }

  /* ---------- learn tab is rendered by features.js (A.extRender) ---------- */

  /* ---------- cities: pre-trip cultural research ---------- */
  function renderCities() {
    $("cities-list").innerHTML = CITY_ORDER.map(function (id) {
      var c = cityById(id);
      return '<button class="city-card city-' + id + '" data-city="' + id + '"><div class="city-banner">' +
        '<h3>' + esc(c.cn) + " " + esc(c.name) + "</h3>" +
        '<div class="tagline">' + esc(c.tagline) + "</div></div></button>";
    }).join("");
    $("cities-list").querySelectorAll("[data-city]").forEach(function (b) {
      b.addEventListener("click", function () { openCity(b.getAttribute("data-city")); });
    });
  }
  function openCity(id) {
    var c = cityById(id);
    if (!c) return;
    $("city-title").textContent = c.cn + " " + c.name;
    var cul = (HQ.CULTURE || {})[id] || {};
    var html = '<div class="city-hero theme-' + id + '"><div class="cn-big">' + esc(c.cn) + "</div>" +
      "<h2>" + esc(c.name) + "</h2><p>" + esc(c.desc) + "</p></div>";
    if (cul.weather) {
      html += '<div class="card"><h3>❄️ December weather</h3><div class="wx-box"><p>' + esc(cul.weather) + "</p>" +
        (cul.packing_note ? '<p class="wx-pack">🧳 ' + esc(cul.packing_note) + "</p>" : "") + "</div></div>";
    }
    if (cul.december) {
      html += '<div class="card"><h3>🎄 December in ' + esc(c.name) + '</h3><div class="dec-box"><p>' + esc(cul.december) + "</p></div></div>";
    }
    if (cul.etiquette) {
      html += '<div class="card culture-card"><h3>🙏 Etiquette research</h3><div class="etiq-grid">' +
        '<div class="etiq-do"><b>✅ Do</b><ul>' + cul.etiquette.do.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="etiq-dont"><b>🚫 Don\'t</b><ul>' + cul.etiquette.dont.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
        "</div></div>";
    }
    if (c.neighborhoods && c.neighborhoods.length) {
      html += '<div class="card"><h3>📍 Neighborhoods to know</h3>' + c.neighborhoods.map(function (n) {
        return '<div class="spot"><b>' + esc(n.name) + "</b><p>" + esc(n.blurb) + '</p><div class="why">' + esc(n.why) + "</div></div>";
      }).join("") + "</div>";
    }
    if (c.sights && c.sights.length) {
      html += '<div class="card"><h3>🎯 Sights worth researching</h3>' + c.sights.map(function (s) {
        return '<div class="spot"><b>' + esc(s.name) + "</b><p>" + esc(s.blurb) + '</p><div class="why">' + esc(s.why) + "</div></div>";
      }).join("") + "</div>";
    }
    html += '<button class="btn-primary" data-go="screen-food">See the ' + esc(c.name) + ' taste bucket list →</button>';
    $("city-detail").innerHTML = html;
    document.getElementById("screen-city").className = "screen active theme-" + id;
    go("screen-city");
  }

  /* ---------- food: taste bucket list (pre-trip research) ---------- */
  function renderFood() {
    var want = store.get("want", {});
    var total = HQ.DISHES.length, n = HQ.DISHES.filter(function (d) { return want[d.id]; }).length;
    $("food-progress").innerHTML = '<div class="card"><h3>📌 ' + n + " / " + total + " bookmarked to try</h3>" +
      '<div class="progress-wrap"><div class="progress-bar"><div style="width:' + Math.round(n / total * 100) + '%"></div></div></div>' +
      '<p class="page-sub">Research now, feast in December. Tap a dish to bookmark it.</p></div>';
    $("food-list").innerHTML = CITY_ORDER.map(function (cid) {
      var c = cityById(cid);
      var dishes = HQ.DISHES.filter(function (d) { return d.city === cid; });
      var dd = dishes.filter(function (d) { return want[d.id]; }).length;
      return '<div class="passport-city"><span>' + esc(c.cn) + " " + esc(c.name) + '</span><span class="muted">' + dd + "/" + dishes.length + "</span></div>" +
        dishes.map(function (d) {
          var w = !!want[d.id];
          return '<div class="dish' + (w ? " stamped" : "") + '" data-dish="' + d.id + '"><div class="stamp">' + (w ? "📌" : "🍽️") + "</div>" +
            "<div><b>" + esc(d.name) + '</b><div class="alt">' + esc(d.alt) + "</div><p>" + esc(d.desc) + "</p>" +
            (d.order ? '<div class="d-order"><b>Order it:</b> ' + esc(d.order) + "</div>" : "") +
            (d.price ? '<div class="d-price">' + esc(d.price) + "</div>" : "") + "</div></div>";
        }).join("");
    }).join("");
    $("food-list").querySelectorAll("[data-dish]").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-dish");
        var st = store.get("want", {});
        if (st[id]) { delete st[id]; } else { st[id] = true; addXP(HQ.XP.dish || 5); }
        store.set("want", st);
        renderFood(); renderXP();
      });
    });
  }

  /* ---------- quizzes ---------- */
  function startQuiz(cityId) {
    var c = cityById(cityId);
    var qs = (HQ.QUIZZES[cityId] || []).slice();
    /* shuffle for replayability */
    for (var i = qs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = qs[i]; qs[i] = qs[j]; qs[j] = t;
    }
    $("quiz-title").textContent = "🧠 " + c.name + " Quiz";
    var state = { i: 0, correct: 0, answered: false };
    function renderQ() {
      var q = qs[state.i], body = $("quiz-body");
      body.innerHTML = '<div class="card"><div class="quiz-progress">Question ' + (state.i + 1) + " of " + qs.length + "</div>" +
        '<div class="quiz-q">' + esc(q.q) + '</div><div id="quiz-opts">' +
        q.c.map(function (opt, k) { return '<button class="quiz-opt" data-i="' + k + '">' + esc(opt) + "</button>"; }).join("") +
        '</div><div id="quiz-explain"></div></div>';
      body.querySelectorAll(".quiz-opt").forEach(function (b) {
        b.addEventListener("click", function () {
          if (state.answered) return;
          state.answered = true;
          var pick = +b.getAttribute("data-i");
          var opts = body.querySelectorAll(".quiz-opt");
          opts.forEach(function (o) { o.disabled = true; });
          opts[q.a].classList.add("correct");
          if (pick === q.a) { state.correct++; addXP(HQ.XP.quiz || 10); } else { b.classList.add("wrong"); }
          $("quiz-explain").innerHTML = '<div class="quiz-explain">💡 ' + esc(q.e) + "</div>" +
            (state.i < qs.length - 1 ? '<button class="btn-primary" id="quiz-next">Next →</button>' : '<button class="btn-primary" id="quiz-next">See results 🎉</button>');
          $("quiz-next").addEventListener("click", function () {
            state.i++; state.answered = false;
            if (state.i < qs.length) renderQ(); else finishQuiz();
          });
          renderXP();
        });
      });
    }
    function finishQuiz() {
      var scores = store.get("quizscores", {});
      var prev = scores[cityId];
      scores[cityId] = state.correct;
      store.set("quizscores", scores);
      addXP(10 + state.correct * 5);
      var pct = state.correct / qs.length;
      var msg = pct >= 0.9 ? "Flawless! You two are ready. 🌟" : pct >= 0.6 ? "Solid! A little review and you're golden. 💪" : "Worth re-reading the city guide before you go! 📖";
      $("quiz-body").innerHTML = '<div class="card" style="text-align:center"><div style="font-size:52px">' + (pct >= 0.7 ? "🏆" : "🎯") + "</div>" +
        "<h3>" + state.correct + " / " + qs.length + " correct</h3><p>" + msg + "</p>" +
        (prev != null && prev < state.correct ? '<p class="page-sub">New best for ' + esc(c.name) + "!</p>" : "") +
        '<button class="btn-primary" id="quiz-retry">Try again</button>' +
        '<button class="btn-ghost" id="quiz-back">Back to Learn</button></div>';
      $("quiz-retry").addEventListener("click", function () { startQuiz(cityId); });
      $("quiz-back").addEventListener("click", function () { go("screen-learn"); });
      if (A.recordPractice) A.recordPractice();
      renderXP();
    }
    go("screen-quiz");
    renderQ();
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var cfg = getConfig();
    var html = '<div class="card"><h3>✈️ Departure date <span class="muted">(optional)</span></h3>' +
      '<p class="page-sub">Set it for a live countdown and week-by-week missions. Leave it blank and the app counts down to December 2026 roughly.</p>' +
      '<div class="form-card"><label>Departure date</label>' +
      '<input type="date" id="set-departure" value="' + esc(cfg.departure || "") + '" min="2026-09-26" max="2026-12-31">' +
      '<div class="form-row"><button class="btn-primary" id="save-departure">Save</button>' +
      (cfg.departure ? '<button class="btn-ghost" id="clear-departure">Clear</button>' : "") + "</div></div></div>";
    html += '<div class="card"><h3>💾 Backup & reset</h3>' +
      '<button class="btn-small" id="export-btn">Export progress</button> ' +
      '<button class="btn-small" id="import-btn">Import progress</button> ' +
      '<button class="btn-small danger" id="reset-btn">Reset everything</button>' +
      '<input type="file" id="import-file" accept="application/json" style="display:none">' +
      '<p class="page-sub">Your progress lives in this browser only — nothing is sent anywhere.</p></div>';
    $("settings-body").innerHTML = html;
    $("save-departure").addEventListener("click", function () {
      var v = $("set-departure").value;
      var c = getConfig();
      if (v) c.departure = v; else delete c.departure;
      store.set("config", c);
      renderSettings(); renderXP();
    });
    var cd = $("clear-departure");
    if (cd) cd.addEventListener("click", function () {
      var c = getConfig(); delete c.departure; store.set("config", c);
      renderSettings();
    });
    $("export-btn").addEventListener("click", function () {
      var data = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf("ckh_") === 0) data[k] = localStorage.getItem(k);
      }
      var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "trip-hq-backup.json";
      a.click();
    });
    $("import-btn").addEventListener("click", function () { $("import-file").click(); });
    $("import-file").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          Object.keys(data).forEach(function (k) { if (k.indexOf("ckh_") === 0) localStorage.setItem(k, data[k]); });
          renderXP(); alert("Progress imported! 🎉");
        } catch (err) { alert("That file didn't look right. 😅"); }
      };
      r.readAsText(f);
    });
    $("reset-btn").addEventListener("click", function () {
      if (!confirm("Reset all progress, XP, and checklists? This can't be undone.")) return;
      Object.keys(localStorage).filter(function (k) { return k.indexOf("ckh_") === 0; })
        .forEach(function (k) { localStorage.removeItem(k); });
      renderXP(); renderSettings();
    });
  }

  /* ---------- router ---------- */
  var RENDER = {
    "screen-home": renderHome,
    "screen-cities": renderCities,
    "screen-city": function () { /* rendered by openCity */ },
    "screen-food": renderFood,
    "screen-more": function () { },
    "screen-settings": renderSettings,
    "screen-quiz": function () { /* rendered by startQuiz */ }
  };
  var historyStack = [];
  function go(id, replace) {
    var ext = (A.extRender || {})[id];
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
    /* clear per-city theme unless this is the city screen */
    if (id !== "screen-city") {
      var sc = $("screen-city");
      sc.className = "screen";
    }
    var el = $(id);
    if (!el) return;
    el.classList.add("active");
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === id);
    });
    if (!replace) {
      var last = historyStack[historyStack.length - 1];
      if (last !== id) historyStack.push(id);
      if (historyStack.length > 24) historyStack.shift();
    }
    window.scrollTo(0, 0);
    if (ext) ext();
    else if (RENDER[id]) RENDER[id]();
    wireGlobal(el);
  }
  function goBack() {
    historyStack.pop(); /* current */
    var prev = historyStack.pop() || "screen-home";
    go(prev, true);
    historyStack.push(prev);
  }
  function wireGlobal(scope) {
    (scope || document).querySelectorAll("[data-go]").forEach(function (b) {
      if (b._wired) return; b._wired = true;
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
    (scope || document).querySelectorAll("[data-back]").forEach(function (b) {
      if (b._wired) return; b._wired = true;
      b.addEventListener("click", goBack);
    });
    (scope || document).querySelectorAll("[data-tab]").forEach(function (b) {
      if (b._wired) return; b._wired = true;
      b.addEventListener("click", function () { historyStack = []; go(b.getAttribute("data-tab"), true); });
    });
  }

  /* ---------- expose ---------- */
  var A = window.HQApp = {
    store: store, go: go, goBack: goBack, getConfig: getConfig,
    daysUntilDeparture: daysUntilDeparture,
    xp: xp, addXP: addXP, renderXP: renderXP, levelFor: levelFor,
    phraseOfDay: phraseOfDay, phraseCard: phraseCard,
    dailyPrep: dailyPrep, dailyPrepDone: dailyPrepDone,
    esc: esc, niceDate: niceDate, todayStr: todayStr, addDaysStr: addDaysStr,
    CITY_ORDER: CITY_ORDER, renderHome: renderHome,
    renderCities: renderCities, renderFood: renderFood, openCity: openCity,
    startQuiz: startQuiz, renderSettings: renderSettings
  };

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    wireGlobal(document);
    historyStack = [];
    go("screen-home", true);
    renderXP();
  });
})();
