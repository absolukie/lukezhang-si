/* China + Korea Trip HQ — features.js (pre-trip only)
   Readiness system, flashcards (SRS), guides, packing, dialogues,
   hangul/pinyin lessons, streaks, level-ups, learn hub, weekly prep.
   Loads after app.js; extends window.HQApp via A.extRender. */
(function () {
  "use strict";
  var A = window.HQApp;
  var store = A.store, esc = A.esc;
  function $(id) { return document.getElementById(id); }
  function cityById(id) { return HQ.CITIES.filter(function (c) { return c.id === id; })[0]; }
  function paras(body) {
    return String(body).split(/\n\n+/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  }

  /* ---------- content patches ---------- */
  if (HQ.DISH_UPDATES) {
    HQ.DISHES.forEach(function (d) {
      var u = HQ.DISH_UPDATES[d.id];
      if (u) { if (u.order) d.order = u.order; if (u.price) d.price = u.price; }
    });
  }

  /* ---------- streaks ---------- */
  function recordPractice() {
    var s = store.get("streak", { last: null, count: 0, best: 0 });
    var t = A.todayStr();
    if (s.last === t) return s.count;
    s.count = (s.last === A.addDaysStr(t, -1)) ? s.count + 1 : 1;
    if (s.count > (s.best || 0)) s.best = s.count;
    s.last = t; store.set("streak", s);
    return s.count;
  }
  function streak() { return store.get("streak", { last: null, count: 0, best: 0 }); }
  function practicedToday() { return streak().last === A.todayStr(); }

  /* ---------- level-up toast ---------- */
  A.levelUp = function (lv) {
    var t = document.createElement("div");
    t.className = "level-toast";
    t.innerHTML = '<div class="lt-star">⭐</div><div><b>Level ' + lv + '!</b><br><span>Prep rank up — keep going.</span></div>';
    $("toast-root").appendChild(t);
    setTimeout(function () { t.classList.add("show"); }, 60);
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 450); }, 2800);
  };

  /* ---------- readiness ---------- */
  function knownCards() {
    var c = store.get("cards", {}), n = 0;
    for (var k in c) if (c[k].box >= 1) n++;
    return n;
  }
  function quizzesDone() {
    var s = store.get("quizscores", {});
    return A.CITY_ORDER.filter(function (id) { return s[id] != null; }).length;
  }
  function packingCount() {
    var t = 0, d = 0, p = store.get("pack", {});
    if (HQ.PACKING) HQ.PACKING.forEach(function (cat, ci) {
      cat.items.forEach(function (it, ii) { t++; if (p[ci + "|" + ii]) d++; });
    });
    return { done: d, total: t };
  }
  function autoCheck(kind) {
    switch (kind) {
      case "quiz": return quizzesDone() >= 4;
      case "flash25": return knownCards() >= 25;
      case "flash50": return knownCards() >= 50;
      case "flash100": return knownCards() >= 100;
      case "dialogues": return Object.keys(store.get("dlgs", {})).length >= 2;
      case "guides": var g = store.get("guides", {}); return !!g.money && !!g.connectivity;
      case "packingpct": var pc = packingCount(); return pc.total > 0 && pc.done / pc.total >= 0.8;
      default: return false;
    }
  }
  function readiness() {
    if (!HQ.READINESS) return { pct: 0, cats: [] };
    var cats = HQ.READINESS.map(function (cat) {
      var items = cat.items.map(function (it) {
        var done = it.auto ? autoCheck(it.auto) : !!store.get("ready", {})[it.id];
        return { id: it.id, text: it.text, done: done, auto: !!it.auto };
      });
      var dn = items.filter(function (i) { return i.done; }).length;
      return {
        id: cat.id, name: cat.name, icon: cat.icon, weight: cat.weight, items: items,
        earned: cat.weight * dn / items.length, pct: Math.round(dn / items.length * 100)
      };
    });
    return { pct: Math.round(cats.reduce(function (s, c) { return s + c.earned; }, 0)), cats: cats };
  }
  function weakestCategory() {
    var r = readiness();
    var open = r.cats.filter(function (c) { return c.pct < 100; });
    if (!open.length) return null;
    open.sort(function (a, b) { return (b.weight * (100 - b.pct)) - (a.weight * (100 - a.pct)); });
    return open[0];
  }
  function toggleReady(id) {
    var r = store.get("ready", {});
    var was = !!r[id];
    if (was) delete r[id]; else r[id] = true;
    store.set("ready", r);
    if (!was) A.addXP(HQ.XP.readiness || 5);
  }
  function ringSVG(pct, size) {
    size = size || 112;
    var r = (size - 14) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#efe7d6" stroke-width="11"/>' +
      '<circle class="ring-fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#e4572e" stroke-width="11" stroke-linecap="round"' +
      ' stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-off="' + off.toFixed(1) + '"' +
      ' transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="50%" y="50%" dy=".35em" text-anchor="middle" class="ring-txt">' + pct + '%</text></svg>';
  }
  function animateRing(scope) {
    (scope || document).querySelectorAll(".ring-fg").forEach(function (el) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)";
          el.style.strokeDashoffset = el.getAttribute("data-off");
        });
      });
    });
  }
  function readinessLine(pct) {
    if (pct >= 80) return "You're in great shape — the trip is going to be smooth.";
    if (pct >= 50) return "Solid progress. Keep chipping away each week.";
    if (pct > 0) return "Every check brings the trip closer.";
    return "Start checking things off — future you says thanks.";
  }

  /* ---------- weekly prep (Pass 1: week-aware without invented dates) ---------- */
  function parseYMD(s) {
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function weeksOut() {
    var cfg = A.getConfig(), t = A.todayStr();
    var target;
    if (cfg.departure) {
      target = parseYMD(cfg.departure);
    } else {
      target = new Date(2026, 11, 1); /* rough December anchor — not a claimed departure date */
    }
    var today = parseYMD(t);
    var diff = Math.round((target - today) / 86400000);
    if (diff < 0) return 0;
    return Math.max(1, Math.min(10, Math.ceil(diff / 7)));
  }
  function currentWeekly() {
    if (!HQ.WEEKLY_PREP) return null;
    var w = weeksOut();
    if (!w) return null;
    var wk = Math.min(10, Math.max(1, w));
    return HQ.WEEKLY_PREP.filter(function (x) { return x.week === wk; })[0] || null;
  }
  function weeklyDone(wk) { return !!store.get("weekly", {})[wk]; }
  function weeklyHTML() {
    var w = currentWeekly();
    if (!w) return '<span class="muted">Wheels-up time — have an amazing trip! ✈️</span>';
    var cfg = A.getConfig();
    var ctx = cfg.departure ? "About " + weeksOut() + " weeks until departure" : "Roughly " + weeksOut() + " weeks until December";
    var html = '<div class="wm-label">' + esc(ctx) + '</div>' +
      '<b>Week ' + w.week + ": " + esc(w.title) + '</b><p class="page-sub">' + esc(w.text) + "</p>" +
      (weeklyDone(w.week) ? '<span class="muted">✓ Done this week</span>'
        : '<button class="btn-small" data-weekdone="' + w.week + '" data-wxp="' + w.xp + '">Mark done (+' + w.xp + " XP)</button>");
    /* upcoming weeks preview */
    var upcoming = HQ.WEEKLY_PREP.filter(function (x) { return x.week < w.week; })
      .sort(function (a, b) { return b.week - a.week; }).slice(0, 2);
    if (upcoming.length) {
      html += '<div class="wm-next"><div class="wm-label">Coming up</div>' + upcoming.map(function (u) {
        return '<div class="wm-row"><span>Week ' + u.week + " — " + esc(u.title) + "</span>" +
          (weeklyDone(u.week) ? '<span class="muted">✓</span>' : "") + "</div>";
      }).join("") + "</div>";
    }
    return html;
  }
  function wireWeekly(scope) {
    (scope || document).querySelectorAll("[data-weekdone]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var wk = store.get("weekly", {});
        wk[b.getAttribute("data-weekdone")] = true;
        store.set("weekly", wk);
        A.addXP(+b.getAttribute("data-wxp") || 20);
        var sc = b.closest(".screen");
        if (sc && sc.id === "screen-ready") renderReady();
        else if (typeof A.renderHome === "function") A.renderHome();
        A.renderXP();
      });
    });
  }

  /* ---------- readiness screen (Pass 1: richer category progress) ---------- */
  function renderReady() {
    var r = readiness(), st = streak();
    var html = '<div class="card ready-hero">' + ringSVG(r.pct, 132) +
      '<div class="ready-meta"><h3>Trip Readiness</h3><p class="page-sub">' + readinessLine(r.pct) + "</p>" +
      (st.count > 0 ? '<div class="streak">🔥 ' + st.count + "-day practice streak</div>" : "") + "</div></div>";
    html += '<div class="card"><div class="wm-label">This week\'s mission</div>' + weeklyHTML() + "</div>";
    html += r.cats.map(function (cat) {
      var open = cat.items.filter(function (i) { return !i.done; }).length;
      return '<div class="card culture-card"><h3>' + cat.icon + " " + esc(cat.name) +
        ' <span class="muted">' + cat.pct + '%</span></h3>' +
        '<div class="progress-wrap"><div class="progress-bar"><div style="width:' + cat.pct + '%"></div></div>' +
        '<span class="cat-wt">worth ' + cat.weight + '%</span></div>' +
        '<p class="page-sub">' + (open ? open + " to go" : "Complete ✓") + " · contributes " + Math.round(cat.earned) + "% of " + cat.weight + "%</p>" +
        cat.items.map(function (it) {
          return '<div class="check-row' + (it.done ? " done" : "") + '"' + (it.auto ? "" : ' data-ready="' + it.id + '"') + '>' +
            '<div class="check-box">' + (it.done ? "✓" : "") + "</div>" +
            '<div class="check-text">' + esc(it.text) + (it.auto ? ' <span class="auto-tag">auto</span>' : "") + "</div></div>";
        }).join("") + "</div>";
    }).join("");
    $("ready-body").innerHTML = html;
    $("ready-body").querySelectorAll("[data-ready]").forEach(function (row) {
      row.addEventListener("click", function () {
        toggleReady(row.getAttribute("data-ready"));
        renderReady(); animateRing($("ready-body")); A.renderXP();
      });
    });
    wireWeekly($("ready-body"));
    animateRing($("ready-body"));
  }

  /* ---------- home readiness teaser ---------- */
  function readyTeaserHTML() {
    var r = readiness(), st = streak();
    return '<div class="card ready-card"><div class="ready-row">' + ringSVG(r.pct, 96) +
      '<div class="ready-meta"><h3>Trip Readiness</h3><p class="page-sub">' + readinessLine(r.pct) + "</p>" +
      (st.count > 0 ? '<div class="streak">🔥 ' + st.count + "-day streak" + (st.best > st.count ? " · best " + st.best : "") + "</div>" : "") +
      '<br><button class="btn-small" data-go="screen-ready">Open checklist →</button></div></div>' +
      '<div class="weekly-mini">' + weeklyHTML() + "</div></div>";
  }

  /* ---------- badges ---------- */
  function updateBadges() {
    var r = readiness(), pc = packingCount();
    var mr = $("menu-ready-pct"); if (mr) mr.textContent = r.pct + "% →";
    var mp = $("menu-pack-pct"); if (mp) mp.textContent = pc.total ? Math.round(pc.done / pc.total * 100) + "% →" : "→";
  }

  /* ---------- flashcards (simple SRS) ---------- */
  var SRS_GAPS = [1, 3, 7, 14, 30];
  function allCards() {
    var out = [];
    ["mandarin", "korean"].forEach(function (lang) {
      var deck = HQ.QUICKLANG[lang] || {};
      Object.keys(deck).forEach(function (cat) {
        deck[cat].forEach(function (row, i) {
          out.push({ id: lang + "|" + cat + "|" + i, lang: lang, cat: cat, front: row[0], py: row[1], back: row[2] });
        });
      });
    });
    return out;
  }
  function dueCards() {
    var st = store.get("cards", {}), t = A.todayStr();
    var out = allCards().filter(function (c) { var s = st[c.id]; return !s || s.next <= t; });
    out.sort(function (a, b) {
      var sa = st[a.id], sb = st[b.id];
      if (!sa && sb) return -1; if (sa && !sb) return 1; if (!sa && !sb) return 0;
      return sa.next < sb.next ? -1 : 1;
    });
    return out;
  }
  var F = { queue: [], i: 0, known: 0 };
  function renderFlash() {
    var due = dueCards(), total = allCards().length, kn = knownCards(), st = streak();
    $("flash-body").innerHTML = '<div class="card"><h3>Training deck</h3><p class="page-sub">' +
      total + " cards · " + kn + " learned · " + due.length + " due" +
      (st.count > 0 ? " · 🔥 " + st.count + "-day streak" : "") + "</p>" +
      (due.length ? '<button class="btn-primary" id="flash-start">Start session (' + Math.min(12, due.length) + " cards)</button>"
        : "<p>🎉 All caught up! Reviews unlock again tomorrow.</p>") +
      '<p class="page-sub">Tap a card to flip it. Mark <b>Known</b> and it comes back later; <b>Still learning</b> brings it back tomorrow.</p></div>';
    var b = $("flash-start");
    if (b) b.addEventListener("click", function () { F.queue = due.slice(0, 12); F.i = 0; F.known = 0; renderFCard(); });
  }
  function renderFCard() {
    var body = $("flash-body"), c = F.queue[F.i];
    if (!c) {
      recordPractice();
      A.addXP(Math.min(20, F.queue.length * (HQ.XP.card || 2)));
      body.innerHTML = '<div class="card" style="text-align:center"><div style="font-size:52px">🎉</div><h3>Session complete</h3>' +
        '<p class="page-sub">' + F.known + " marked known out of " + F.queue.length + '.</p><button class="btn-primary" id="f-done">Back to Learn</button></div>';
      $("f-done").addEventListener("click", function () { A.go("screen-learn"); });
      return;
    }
    body.innerHTML = '<div class="card"><div class="quiz-progress">Card ' + (F.i + 1) + " of " + F.queue.length +
      " · " + esc(c.cat) + " (" + (c.lang === "mandarin" ? "Mandarin" : "Korean") + ")</div>" +
      '<div class="fcard" id="fcard"><div class="f-front"><div class="f-big">' + esc(c.front) + '</div><div class="f-py">' + esc(c.py) +
      '</div><div class="f-hint">tap to flip</div></div>' +
      '<div class="f-back" style="display:none"><div class="f-en">' + esc(c.back) + '</div><div class="f-hint">tap to flip back</div></div></div>' +
      '<div class="f-btns" id="fbtns" style="display:none"><button class="btn-ghost" id="f-hard">Still learning</button>' +
      '<button class="btn-primary" id="f-known" style="margin:0">Known ✓</button></div></div>';
    var card = $("fcard"), flipped = false;
    card.addEventListener("click", function () {
      flipped = !flipped;
      card.querySelector(".f-front").style.display = flipped ? "none" : "";
      card.querySelector(".f-back").style.display = flipped ? "" : "none";
      $("fbtns").style.display = flipped ? "" : "none";
    });
    $("f-hard").addEventListener("click", function (e) { e.stopPropagation(); gradeCard(c, false); });
    $("f-known").addEventListener("click", function (e) { e.stopPropagation(); gradeCard(c, true); });
  }
  function gradeCard(c, known) {
    var st = store.get("cards", {}), s = st[c.id] || { box: 0, next: A.todayStr() };
    if (known) { s.box = Math.min(4, s.box + 1); F.known++; } else { s.box = 0; }
    s.next = A.addDaysStr(A.todayStr(), SRS_GAPS[Math.min(4, s.box)]);
    st[c.id] = s; store.set("cards", st);
    F.i++; renderFCard();
  }

  /* ---------- hangul ---------- */
  function renderHangul() {
    var H = HQ.HANGUL, body = $("hangul-body");
    if (!H) { body.innerHTML = '<div class="card"><p class="page-sub">Hangul course coming soon.</p></div>'; return; }
    var done = !!store.get("courses", {}).hangul;
    var html = '<div class="card"><h3>Read Korean signs in 20 minutes</h3><p>' + esc(H.intro) + "</p><p>" + esc(H.howBlocks) + "</p></div>";
    html += '<div class="card"><h3>Consonants</h3><div class="script-grid">' +
      H.consonants.map(function (x) { return '<div class="script-cell"><div class="sc">' + esc(x.h) + '</div><div class="sr">' + esc(x.r) + '</div><div class="st">' + esc(x.tip) + "</div></div>"; }).join("") + "</div></div>";
    html += '<div class="card"><h3>Vowels</h3><div class="script-grid">' +
      H.vowels.map(function (x) { return '<div class="script-cell"><div class="sc">' + esc(x.h) + '</div><div class="sr">' + esc(x.r) + '</div><div class="st">' + esc(x.tip) + "</div></div>"; }).join("") + "</div></div>";
    html += '<div class="card"><h3>Final consonants (batchim)</h3><p>' + esc(H.batchim) + "</p></div>";
    html += '<div class="card"><h3>Practice: real signs</h3>' +
      H.practice.map(function (x) { return '<div class="lang-row"><div><div class="l1">' + esc(x.h) + '</div><div class="muted" style="font-size:13px">' + esc(x.r) + '</div></div><div class="l2">' + esc(x.en) + "</div></div>"; }).join("") + "</div>";
    html += '<div class="card"><h3>Tips</h3><ul class="tips">' + H.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      (done ? '<p class="muted">✓ Course complete</p>' : '<button class="btn-primary" id="hangul-done">Mark course complete (+' + (HQ.XP.course || 30) + " XP)</button>") + "</div>";
    body.innerHTML = html;
    var b = $("hangul-done");
    if (b) b.addEventListener("click", function () {
      var cs = store.get("courses", {}); cs.hangul = true; store.set("courses", cs);
      A.addXP(HQ.XP.course || 30); recordPractice(); renderHangul(); A.renderXP();
    });
  }

  /* ---------- pinyin ---------- */
  function renderPinyin() {
    var P = HQ.PINYIN, body = $("pinyin-body");
    if (!P) { body.innerHTML = '<div class="card"><p class="page-sub">Pinyin primer coming soon.</p></div>'; return; }
    var done = !!store.get("courses", {}).pinyin;
    var html = '<div class="card"><h3>Pinyin, plain and simple</h3><p>' + esc(P.intro) + "</p></div>";
    html += '<div class="card"><h3>Tricky initials</h3><div class="script-grid">' +
      P.initials.map(function (x) { return '<div class="script-cell"><div class="sc sm">' + esc(x.p) + '</div><div class="st">' + esc(x.like) + "</div></div>"; }).join("") + "</div></div>";
    html += '<div class="card"><h3>Common finals</h3><div class="script-grid">' +
      P.finals.map(function (x) { return '<div class="script-cell"><div class="sc sm">' + esc(x.p) + '</div><div class="st">' + esc(x.like) + "</div></div>"; }).join("") + "</div></div>";
    html += '<div class="card"><h3>A note on tones</h3><p>' + esc(P.tones) + "</p></div>";
    html += '<div class="card"><h3>Watch out for</h3><ul class="tips">' + P.pitfalls.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>";
    html += '<div class="card"><h3>Try saying</h3>' +
      P.practice.map(function (x) { return '<div class="lang-row"><div><div class="l1">' + esc(x[0]) + '</div><div class="muted" style="font-size:13px">' + esc(x[1]) + '</div></div><div class="l2">' + esc(x[2]) + "</div></div>"; }).join("") +
      (done ? '<p class="muted">✓ Primer complete</p>' : '<button class="btn-primary" id="pinyin-done">Mark primer complete (+20 XP)</button>') + "</div>";
    body.innerHTML = html;
    var b = $("pinyin-done");
    if (b) b.addEventListener("click", function () {
      var cs = store.get("courses", {}); cs.pinyin = true; store.set("courses", cs);
      A.addXP(20); recordPractice(); renderPinyin(); A.renderXP();
    });
  }

  /* ---------- dialogues ---------- */
  var curDlg = null, curDlgLang = "mandarin";
  function renderDialogues() {
    curDlg = null;
    if (!HQ.DIALOGUES) { $("dialogues-list").innerHTML = '<div class="card"><p class="page-sub">Dialogues coming soon.</p></div>'; $("dialogue-body").innerHTML = ""; return; }
    var read = store.get("dlgs", {});
    $("dialogue-body").innerHTML = "";
    $("dialogues-list").style.display = "";
    $("dialogues-list").innerHTML = HQ.DIALOGUES.map(function (d) {
      return '<button class="menu-item" data-dlg="' + d.id + '">💬 <span>' + esc(d.title) +
        '<br><span class="muted" style="font-weight:400">' + esc(d.setting) + '</span></span><em>' + (read[d.id] ? "✓ read" : "→") + "</em></button>";
    }).join("");
    $("dialogues-list").querySelectorAll("[data-dlg]").forEach(function (b) {
      b.addEventListener("click", function () { openDialogue(b.getAttribute("data-dlg")); });
    });
  }
  function openDialogue(id) {
    curDlg = id; curDlgLang = "mandarin";
    var rd = store.get("dlgs", {});
    if (!rd[id]) { rd[id] = true; store.set("dlgs", rd); A.addXP(HQ.XP.dialogue || 5); recordPractice(); A.renderXP(); }
    renderDialogueDetail();
  }
  function renderDialogueDetail() {
    var d = HQ.DIALOGUES.filter(function (x) { return x.id === curDlg; })[0];
    if (!d) return;
    $("dialogues-list").style.display = "none";
    var data = d[curDlgLang];
    var html = '<button class="btn-ghost" id="dlg-back">‹ All dialogues</button>' +
      '<div class="card"><h3>💬 ' + esc(d.title) + "</h3>" +
      '<div class="seg"><button class="seg-btn' + (curDlgLang === "mandarin" ? " active" : "") + '" data-dl="mandarin">🇨🇳 Mandarin</button>' +
      '<button class="seg-btn' + (curDlgLang === "korean" ? " active" : "") + '" data-dl="korean">🇰🇷 Korean</button></div>' +
      '<p class="page-sub">' + esc(d.setting) + "</p>" +
      data.lines.map(function (ln) {
        return '<div class="dlg-line"><div class="dlg-say">' + esc(ln.say) + '</div><div class="dlg-py">' + esc(ln.py) + '</div>' +
          '<div class="dlg-en">' + esc(ln.en) + '</div><div class="dlg-tap">tap to reveal English</div></div>';
      }).join("") +
      '<div class="quiz-explain">💡 ' + esc(d.tip) + "</div></div>";
    $("dialogue-body").innerHTML = html;
    $("dialogue-body").querySelectorAll("[data-dl]").forEach(function (b) {
      b.addEventListener("click", function () { curDlgLang = b.getAttribute("data-dl"); renderDialogueDetail(); });
    });
    $("dialogue-body").querySelectorAll(".dlg-line").forEach(function (el) {
      el.addEventListener("click", function () { el.classList.toggle("open"); });
    });
    $("dlg-back").addEventListener("click", renderDialogues);
    window.scrollTo(0, 0);
  }

  /* ---------- guides ---------- */
  function renderGuides() {
    if (!HQ.GUIDES) { $("guides-list").innerHTML = '<div class="card"><p class="page-sub">Guides coming soon.</p></div>'; return; }
    var read = store.get("guides", {});
    var done = Object.keys(read).length;
    $("guides-list").innerHTML = '<p class="page-sub">' + done + " of " + HQ.GUIDES.length + " read</p>" +
      HQ.GUIDES.map(function (g) {
        return '<button class="menu-item" data-guide="' + g.id + '"><span class="g-ico">' + g.icon + "</span>" +
          '<span>' + esc(g.title) + '<br><span class="muted" style="font-weight:400">' + esc(g.sub) + "</span></span>" +
          "<em>" + (read[g.id] ? "✓ read" : "→") + "</em></button>";
      }).join("");
    $("guides-list").querySelectorAll("[data-guide]").forEach(function (b) {
      b.addEventListener("click", function () { openGuide(b.getAttribute("data-guide")); });
    });
  }
  function openGuide(id) {
    var g = HQ.GUIDES.filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    $("guide-title").textContent = g.icon + " " + g.title;
    var html = "";
    if (g.verify) html += '<div class="verify-banner">⚠️ Policies and products change — verify the details close to departure.</div>';
    html += g.sections.map(function (s) {
      return '<div class="card"><h3>' + esc(s.h) + "</h3>" + paras(s.body) +
        (s.verify ? '<div class="verify-tag">verify before you go</div>' : "") + "</div>";
    }).join("");
    html += '<p class="page-sub">Last reviewed ' + esc(g.updated || "Sep 2026") + ".</p>";
    $("guide-body").innerHTML = html;
    var gd = store.get("guides", {});
    if (!gd[id]) { gd[id] = true; store.set("guides", gd); A.addXP(5); A.renderXP(); }
    A.go("screen-guide");
  }

  /* ---------- packing ---------- */
  function renderPacking() {
    if (!HQ.PACKING) { $("pack-body").innerHTML = '<div class="card"><p class="page-sub">Packing list coming soon.</p></div>'; return; }
    var p = store.get("pack", {}), t = 0, d = 0;
    var html = "";
    HQ.PACKING.forEach(function (cat, ci) {
      var rows = cat.items.map(function (it, ii) {
        var k = ci + "|" + ii; t++; var done = !!p[k]; if (done) d++;
        var cities = (!it.cities || it.cities === "all" || it.cities.indexOf("all") >= 0) ? ""
          : ' <span class="pack-cities">' + it.cities.map(function (c) { return esc(cityById(c).name); }).join(" · ") + "</span>";
        return '<div class="check-row' + (done ? " done" : "") + '" data-pack="' + k + '"><div class="check-box">' + (done ? "✓" : "") +
          '</div><div class="check-text">' + esc(it.t) + cities + '<br><span class="muted" style="font-size:13px">' + esc(it.detail) + "</span></div></div>";
      }).join("");
      var cdone = cat.items.filter(function (it, ii) { return p[ci + "|" + ii]; }).length;
      html += '<div class="card"><h3>' + esc(cat.cat) + ' <span class="muted">' + cdone + "/" + cat.items.length + "</span></h3>" +
        '<div class="progress-wrap"><div class="progress-bar"><div style="width:' + Math.round(cdone / cat.items.length * 100) + '%"></div></div></div>' + rows + "</div>";
    });
    $("pack-body").innerHTML = '<div class="card"><h3>🧳 ' + d + " / " + t + " packed</h3>" +
      '<div class="progress-wrap"><div class="progress-bar"><div style="width:' + Math.round(d / t * 100) + '%"></div></div></div>' +
      '<p class="page-sub">Every item you check earns XP. Start with the coat — December is no joke.</p></div>' + html;
    $("pack-body").querySelectorAll("[data-pack]").forEach(function (row) {
      row.addEventListener("click", function () {
        var k = row.getAttribute("data-pack"), pp = store.get("pack", {});
        var was = !!pp[k];
        if (was) delete pp[k]; else { pp[k] = true; A.addXP(HQ.XP.pack || 3); }
        store.set("pack", pp);
        renderPacking(); A.renderXP();
      });
    });
  }

  /* ---------- learn hub ---------- */
  function renderLearn() {
    var st = streak(), due = dueCards().length, kn = knownCards(), total = allCards().length;
    var scores = store.get("quizscores", {});
    var courses = store.get("courses", {});
    var dlgs = store.get("dlgs", {});
    var ph = A.phraseOfDay();
    var html = "";
    /* streak hero */
    html += '<div class="card"><h3>🔥 Daily practice' + (st.count > 0 ? ' <span class="muted">' + st.count + "-day streak" + (st.best > st.count ? " · best " + st.best : "") + "</span>" : "") + "</h3>" +
      '<p class="page-sub">' + (practicedToday() ? "Done for today — nice. Come back tomorrow to keep the flame alive." : "A short session today keeps your streak alive. Even 5 minutes counts.") + "</p>" +
      '<button class="btn-primary" data-go="screen-flash">🃏 Flashcards' + (due ? " (" + due + " due)" : " — all caught up") + "</button></div>";
    /* phrase of the day */
    html += '<div class="card"><div class="wm-label">Phrase of the day</div>' + A.phraseCard(ph) +
      '<button class="btn-small" data-go="screen-phrase">Browse all phrases →</button></div>';
    /* quizzes */
    html += '<div class="card"><h3>🧠 Culture quizzes</h3><p class="page-sub">' + quizzesDone() + " of 4 cities completed</p>";
    html += A.CITY_ORDER.map(function (id) {
      var c = cityById(id), sc = scores[id], n = (HQ.QUIZZES[id] || []).length;
      return '<button class="menu-item" data-quiz="' + id + '">🧠 <span>' + esc(c.name) + ' quiz</span><em>' + (sc != null ? sc + "/" + n + " ⭐" : n + " questions →") + "</em></button>";
    }).join("") + "</div>";
    /* courses + dialogues */
    html += '<div class="card"><h3>📚 Courses & rehearsal</h3>' +
      '<button class="menu-item" data-go="screen-hangul">🇰🇷 <span>Hangul crash course</span><em>' + (courses.hangul ? "✓ done" : "→") + "</em></button>" +
      '<button class="menu-item" data-go="screen-pinyin">🗣️ <span>Pinyin primer</span><em>' + (courses.pinyin ? "✓ done" : "→") + "</em></button>" +
      '<button class="menu-item" data-go="screen-dialogues">💬 <span>Rehearsal dialogues</span><em>' + Object.keys(dlgs).length + " read →</em></button></div>";
    html += '<p class="page-sub">' + kn + " of " + total + " flashcards marked known.</p>";
    $("learn-body").innerHTML = html;
    $("learn-body").querySelectorAll("[data-quiz]").forEach(function (b) {
      b.addEventListener("click", function () { A.startQuiz(b.getAttribute("data-quiz")); });
    });
  }

  /* ---------- phrase browser ---------- */
  function renderPhrase() {
    var ph = A.phraseOfDay();
    var html = '<div class="card"><div class="wm-label">Today\'s phrase</div>' + A.phraseCard(ph) + "</div>";
    html += '<div class="card"><h3>Browse all phrases</h3><p class="page-sub">Filter by language and category.</p>' +
      '<div class="seg"><button class="seg-btn active" data-pl="mandarin">🇨🇳 Mandarin</button>' +
      '<button class="seg-btn" data-pl="korean">🇰🇷 Korean</button></div>' +
      '<div id="phrase-cats"></div><div id="phrase-rows"></div></div>';
    $("phrase-body").innerHTML = html;
    var lang = "mandarin";
    function drawCats() {
      var cats = Object.keys(HQ.QUICKLANG[lang]);
      $("phrase-cats").innerHTML = '<div class="lt-row">' + cats.map(function (c, i) {
        return '<button class="btn-small" data-cat="' + i + '">' + esc(c) + "</button>";
      }).join("") + "</div>";
      $("phrase-cats").querySelectorAll("[data-cat]").forEach(function (b) {
        b.addEventListener("click", function () { drawRows(cats[+b.getAttribute("data-cat")]); });
      });
      drawRows(cats[0]);
    }
    function drawRows(cat) {
      $("phrase-rows").innerHTML = HQ.QUICKLANG[lang][cat].map(function (row) {
        return '<div class="lang-row"><div><div class="l1">' + esc(row[0]) + '</div><div class="muted" style="font-size:13px">' + esc(row[1]) + '</div></div><div class="l2">' + esc(row[2]) + "</div></div>";
      }).join("");
    }
    $("phrase-body").querySelectorAll("[data-pl]").forEach(function (b) {
      b.addEventListener("click", function () {
        $("phrase-body").querySelectorAll("[data-pl]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        lang = b.getAttribute("data-pl");
        drawCats();
      });
    });
    drawCats();
  }

  /* ---------- router extension ---------- */
  A.extRender = {
    "screen-ready": renderReady,
    "screen-guides": renderGuides,
    "screen-guide": function () { /* rendered by openGuide */ },
    "screen-flash": renderFlash,
    "screen-hangul": renderHangul,
    "screen-pinyin": renderPinyin,
    "screen-dialogues": renderDialogues,
    "screen-pack": renderPacking,
    "screen-learn": renderLearn,
    "screen-phrase": renderPhrase,
    "screen-more": updateBadges
  };

  /* expose for app.js + tests */
  A.readiness = readiness; A.weakestCategory = weakestCategory;
  A.dueCards = dueCards; A.allCards = allCards; A.knownCards = knownCards;
  A.recordPractice = recordPractice; A.streak = streak; A.practicedToday = practicedToday;
  A.currentWeekly = currentWeekly; A.weeklyDone = weeklyDone; A.weeksOut = weeksOut;
  A.packingCount = packingCount; A.readyTeaserHTML = readyTeaserHTML; A.wireWeekly = wireWeekly;
  A.weeklyHTML = weeklyHTML; A.animateRing = animateRing;
})();
