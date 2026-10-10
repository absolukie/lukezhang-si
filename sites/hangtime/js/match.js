/* How Well Do We Match? — compatibility game */
"use strict";
var HT = window.HT || (window.HT = {});
HT.Match = (function () {
  var S = {}; // session: p1, p2, rel, questions, answers1, answers2, qi, phase
  var NQ = 18;

  function hist() { return HT.store.get("match-history", []); }
  function saveHist(h) { HT.store.set("match-history", h); }

  var RELS = ["Dating / Couple", "Married", "Best Friends", "Friends", "Siblings", "Custom"];

  /* ================= MENU ================= */
  HT.router.on("match", function (el) {
    el.appendChild(HT.ui.header("💞 How Well Do We Match?", "Extremely unofficial compatibility analysis.", "Answer separately. Compare honestly. Laugh often."));
    var b = document.createElement("button");
    b.className = "btn match"; b.textContent = "Start Matching 💘";
    b.onclick = function () { HT.sfx.pick(); HT.router.push("match-setup"); };
    el.appendChild(b);
    var h = document.createElement("button");
    h.className = "btn ghost"; h.style.marginTop = "10px"; h.textContent = "📜 Match history";
    h.onclick = function () { HT.sfx.tap(); HT.router.push("match-history"); };
    el.appendChild(h);
  });

  /* ================= SETUP ================= */
  HT.router.on("match-setup", function (el) {
    el.appendChild(HT.ui.back("Match"));
    el.appendChild(HT.ui.header("Who are we comparing?", "Both players answer the same questions — separately.", ""));
    function field(label, id, ph) {
      var d = document.createElement("div"); d.className = "field";
      d.innerHTML = "<label>" + label + "</label>";
      var i = document.createElement("input"); i.id = id; i.placeholder = ph; i.maxLength = 24;
      d.appendChild(i); el.appendChild(d); return i;
    }
    var n1 = field("Player 1 name", "m-p1", "e.g. Luke");
    var n2 = field("Player 2 name", "m-p2", "e.g. Sam");
    var rl = document.createElement("div"); rl.className = "field";
    rl.innerHTML = "<label>Relationship type</label>";
    var chips = document.createElement("div"); chips.className = "chip-row match";
    var rel = RELS[2];
    RELS.forEach(function (r) {
      var c = document.createElement("button"); c.className = "chip" + (r === rel ? " sel" : ""); c.textContent = r;
      c.onclick = function () { HT.sfx.tap(); rel = r; chips.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("sel"); }); c.classList.add("sel"); };
      chips.appendChild(c);
    });
    rl.appendChild(chips); el.appendChild(rl);
    var go = document.createElement("button");
    go.className = "btn match"; go.textContent = "Start Matching 💘";
    go.onclick = function () {
      var p1 = n1.value.trim() || "Player 1", p2 = n2.value.trim() || "Player 2";
      // 18 questions: at least one from every category, rest random
      var byCat = {};
      HT.MATCH_QUESTIONS.forEach(function (q) { (byCat[q.c] = byCat[q.c] || []).push(q); });
      var qs = [];
      Object.keys(byCat).forEach(function (c) { qs.push(HT.pick(byCat[c])); });
      var rest = HT.shuffle(HT.MATCH_QUESTIONS.filter(function (q) { return qs.indexOf(q) < 0; }));
      while (qs.length < NQ && rest.length) qs.push(rest.pop());
      S = { p1: p1, p2: p2, rel: rel, questions: HT.shuffle(qs), a1: [], a2: [], qi: 0, phase: 1 };
      HT.sfx.pick();
      HT.router.on("__mquiz", renderQuiz);
      HT.router.push("__mquiz");
    };
    el.appendChild(go);
  });

  /* ================= QUIZ ================= */
  function renderQuiz(el) {
    el.innerHTML = "";
    var who = S.phase === 1 ? S.p1 : S.p2;
    var ans = S.phase === 1 ? S.a1 : S.a2;
    if (S.qi >= S.questions.length) {
      if (S.phase === 1) return renderPassPhone(el);
      return renderResults(el);
    }
    var q = S.questions[S.qi];
    var cat = HT.MATCH_CATS[q.c];
    el.appendChild(HT.ui.header(cat.icon + " " + cat.name, "Question " + (S.qi + 1) + " of " + S.questions.length + " · " + who, ""));
    var prog = document.createElement("div"); prog.className = "progress";
    prog.innerHTML = "<div style='width:" + Math.round(S.qi / S.questions.length * 100) + "%'></div>";
    el.appendChild(prog);
    var card = document.createElement("div"); card.className = "card";
    card.innerHTML = "<h2 style='margin-top:0'>" + HT.esc(q.q) + "</h2>";
    q.o.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.className = "opt-btn"; b.textContent = opt;
      b.onclick = function () {
        HT.sfx.pick(); ans.push(i); S.qi++;
        HT.router.on("__mquiz", renderQuiz);
        HT.router.replace("__mquiz");
      };
      card.appendChild(b);
    });
    el.appendChild(card);
  }

  function renderPassPhone(el) {
    el.innerHTML = "";
    var d = document.createElement("div"); d.className = "card center reveal-pop";
    d.innerHTML = '<div style="font-size:56px">🙈</div><h2>Pass the phone to ' + HT.esc(S.p2) + ".</h2>" +
      '<p class="sub">' + HT.esc(S.p1) + " is done. " + HT.esc(S.p2) + ", answer the same " + S.questions.length +
      " questions — no peeking at " + HT.esc(S.p1) + "’s answers!</p>";
    el.appendChild(d);
    var go = document.createElement("button");
    go.className = "btn match"; go.textContent = "I'm " + S.p2 + " — start my turn";
    go.onclick = function () { HT.sfx.pick(); S.phase = 2; S.qi = 0; HT.router.on("__mquiz", renderQuiz); HT.router.replace("__mquiz"); };
    el.appendChild(go);
  }

  /* ================= SCORING ================= */
  function score() {
    var total = S.questions.length, hits = 0;
    var cats = {};
    var matches = [], diffs = [];
    S.questions.forEach(function (q, i) {
      var c = cats[q.c] = cats[q.c] || { hit: 0, n: 0 };
      c.n++;
      if (S.a1[i] === S.a2[i]) { hits++; c.hit++; matches.push({ q: q, i: i }); }
      else diffs.push({ q: q, i: i });
    });
    return { total: total, hits: hits, pct: Math.round(hits / total * 100), cats: cats, matches: matches, diffs: diffs };
  }

  function catPct(c) { return c.n ? Math.round(c.hit / c.n * 100) : 0; }

  var COMMENTS = {
    high: [
      "You two could travel together without murdering each other.",
      "Your food compatibility is dangerously high.",
      "Honestly? Suspiciously in sync.",
      "Do you share a brain? Asking for science."
    ],
    mid: [
      "Solid match with just enough friction to stay interesting.",
      "You agree on the important stuff. Probably.",
      "A healthy mix of twin energy and delightful chaos.",
      "Compatible enough to split dessert. Probably not the bill."
    ],
    low: [
      "One of you wants to party. The other wants pajamas.",
      "You agree on almost everything except apparently everything.",
      "Opposites attract. Scientists are still confused too.",
      "This report has been forwarded to a couples therapist (kidding)."
    ]
  };

  function commentaryFor(pct) {
    var pool = pct >= 75 ? COMMENTS.high : pct >= 45 ? COMMENTS.mid : COMMENTS.low;
    return HT.pick(pool);
  }

  function badgesFor(sc) {
    var b = [];
    function catHit(key, name, icon, thresh) {
      var c = sc.cats[key];
      if (c && catPct(c) >= (thresh || 80)) b.push(icon + " " + name);
    }
    catHit("travel", "Travel Twins", "🌎");
    catHit("food", "Food Soulmates", "🍜");
    catHit("fun", "Entertainment Twins", "🎮");
    catHit("social", "Social Sync", "🔋");
    var chaos = sc.cats.chaos;
    if (chaos && chaos.n && chaos.hit === chaos.n) b.push("🔥 Chaos Partners");
    var money = sc.cats.money;
    if (money && catPct(money) <= 30) b.push("💰 Financial Opposites");
    // night owl duo: both picked night owl
    S.questions.forEach(function (q, i) {
      if (q.q === "Early bird or night owl?" && S.a1[i] === 1 && S.a2[i] === 1) b.push("🌙 Night Owl Duo");
      if (q.q === "Dogs or cats?" && S.a1[i] === 1 && S.a2[i] === 1) b.push("🐱 Cat People");
      if (q.q === "Ideal Friday night?" && ((S.a1[i] === 3) || (S.a1[i] === 4)) && S.a1[i] === S.a2[i]) b.push("🛋️ Homebody Alliance");
    });
    if (sc.pct >= 90) b.push("💫 Practically Telepathic");
    if (sc.pct <= 30) b.push("🎲 Beautiful Chaos");
    return b.slice(0, 6);
  }

  /* ================= RESULTS ================= */
  function renderResults(el) {
    el.innerHTML = "";
    var sc = score();
    HT.sfx.win(); HT.confetti.burst(150);
    el.appendChild(HT.ui.back("Match"));

    // score ring
    var ring = document.createElement("div"); ring.className = "card center reveal-pop";
    var circ = 2 * Math.PI * 64;
    ring.innerHTML =
      '<div class="kicker">Extremely unofficial compatibility analysis</div>' +
      '<div class="score-ring"><svg width="150" height="150">' +
      '<circle cx="75" cy="75" r="64" fill="none" stroke="var(--card2)" stroke-width="14"/>' +
      '<circle cx="75" cy="75" r="64" fill="none" stroke="url(#mg)" stroke-width="14" stroke-linecap="round" ' +
      'stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - sc.pct / 100)) + '" style="transition:stroke-dashoffset 1s ease"/>' +
      '<defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f43f5e"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs></svg>' +
      '<div class="score-num"><b>' + sc.pct + '%</b><span>MATCH</span></div></div>' +
      "<h2 style='margin-bottom:2px'>" + HT.esc(S.p1) + " + " + HT.esc(S.p2) + "</h2>" +
      '<p class="sub" style="margin:0">' + HT.esc(S.rel) + " · " + sc.hits + " of " + sc.total + " answers aligned</p>";
    el.appendChild(ring);

    // commentary
    var cq = document.createElement("div"); cq.className = "quote";
    cq.textContent = "💬 " + commentaryFor(sc.pct);
    el.appendChild(cq);

    // badges
    var badges = badgesFor(sc);
    if (badges.length) {
      var bc = document.createElement("div"); bc.className = "card";
      bc.innerHTML = "<h3 style='margin-top:0'>Unlocked badges</h3>";
      badges.forEach(function (x) { var s = document.createElement("span"); s.className = "badge"; s.textContent = x; bc.appendChild(s); });
      el.appendChild(bc);
    }

    // per-category bars
    var cc = document.createElement("div"); cc.className = "card";
    cc.innerHTML = "<h3 style='margin-top:0'>Breakdown</h3>";
    Object.keys(HT.MATCH_CATS).forEach(function (key) {
      var c = sc.cats[key]; if (!c) return;
      var p = catPct(c), meta = HT.MATCH_CATS[key];
      var d = document.createElement("div"); d.className = "cat-bar";
      d.innerHTML = "<div class='cb-top'><span>" + meta.icon + " " + meta.name + "</span><span>" + p + "%</span></div>" +
        "<div class='cb-track'><div class='cb-fill' style='width:" + p + "%'></div></div>";
      cc.appendChild(d);
    });
    el.appendChild(cc);

    // biggest match / funniest disagreement
    var hl = document.createElement("div"); hl.className = "card";
    hl.innerHTML = "<h3 style='margin-top:0'>Highlights</h3>";
    if (sc.matches.length) {
      var bm = HT.pick(sc.matches);
      var qm = bm.q;
      hl.innerHTML += "<div class='quote'>💚 <b>Biggest match:</b> “" + HT.esc(qm.q) + "”<br>Both answered: <b>" + HT.esc(qm.o[S.a1[bm.i]]) + "</b></div>";
    }
    if (sc.diffs.length) {
      var bd = HT.pick(sc.diffs);
      var qd = bd.q;
      hl.innerHTML += "<div class='quote'>😅 <b>Funniest disagreement:</b> “" + HT.esc(qd.q) + "”<br>" +
        HT.esc(S.p1) + ": <b>" + HT.esc(qd.o[S.a1[bd.i]]) + "</b><br>" +
        HT.esc(S.p2) + ": <b>" + HT.esc(qd.o[S.a2[bd.i]]) + "</b></div>";
    }
    el.appendChild(hl);

    // share card
    var share = document.createElement("div"); share.className = "share-card match";
    share.innerHTML = '<div class="sc-kicker">💞 Compatibility Report</div>' +
      "<h2>" + HT.esc(S.p1) + " + " + HT.esc(S.p2) + "</h2>" +
      '<div class="sc-big">' + sc.pct + '%</div><div class="sc-sub">MATCH · ' + HT.esc(S.rel) + '</div>' +
      '<div class="sc-badges">' + badges.slice(0, 3).map(function (x) { return '<span class="badge">' + HT.esc(x) + "</span>"; }).join("") + "</div>";
    el.appendChild(share);
    var shot = document.createElement("button");
    shot.className = "btn ghost"; shot.textContent = "📸 Screenshot This";
    shot.onclick = function () { HT.toast("Screenshot away 📸"); };
    el.appendChild(shot);

    // save history
    var h = hist();
    h.unshift({ p1: S.p1, p2: S.p2, rel: S.rel, score: sc.pct, d: HT.today(), badges: badges.slice(0, 3) });
    saveHist(h.slice(0, 50));

    var again = document.createElement("button");
    again.className = "btn match"; again.style.marginTop = "10px"; again.textContent = "💘 Play again";
    again.onclick = function () { HT.sfx.tap(); HT.router.push("match-setup"); };
    el.appendChild(again);
  }

  /* ================= HISTORY ================= */
  HT.router.on("match-history", function (el) {
    el.appendChild(HT.ui.back("Match"));
    el.appendChild(HT.ui.header("📜 Match History", "Past compatibility reports.", ""));
    var h = hist();
    if (!h.length) {
      el.appendChild(HT.ui.empty("💞", "No matches yet", "Run your first compatibility test and it'll live here.", "Start matching", function () { HT.router.push("match-setup"); }, "match"));
      return;
    }
    var card = document.createElement("div"); card.className = "card";
    h.forEach(function (m) {
      var r = document.createElement("div"); r.className = "list-row";
      r.innerHTML = "<span style='font-size:26px'>💞</span><span class='grow'><b>" + HT.esc(m.p1) + " + " + HT.esc(m.p2) +
        "</b> — " + m.score + "%<small>" + HT.esc(m.rel) + " · " + HT.esc(m.d) +
        (m.badges && m.badges.length ? "<br>" + m.badges.map(HT.esc).join(" · ") : "") + "</small></span>";
      card.appendChild(r);
    });
    el.appendChild(card);
  });
})();
