/* Random Side Quest: generator, XP, achievements, chains, history */
"use strict";
var HT = window.HT || (window.HT = {});
HT.Quests = (function () {
  var F = { d: "any", time: "any", loc: "any", b: "any", p: "any" }; // filters
  var current = null; // active quest offered
  var activeChain = null;

  function prof() {
    return HT.store.get("quest-profile", {
      xp: 0, completed: 0, streak: 0, lastDate: null,
      byTag: { outdoor: 0, friends: 0, date: 0, chaotic: 0 },
      byLoc: {}, achievements: []
    });
  }
  function saveProf(p) { HT.store.set("quest-profile", p); }
  function qhist() { return HT.store.get("quest-history", []); }
  function saveQhist(h) { HT.store.set("quest-history", h); }

  function levelFor(xp) {
    var lvl = 0;
    HT.LEVELS.forEach(function (L, i) { if (xp >= L.xp) lvl = i; });
    return lvl;
  }
  function diffStars(d) { return d === "easy" ? "★☆☆" : d === "medium" ? "★★☆" : "★★★"; }
  function diffName(d) { return d === "easy" ? "Easy" : d === "medium" ? "Medium" : "Chaotic"; }
  function timeName(t) { return t >= 120 ? "2+ hours" : t >= 60 ? "1 hour" : t + " min"; }
  function locName(l) {
    return { home: "At home", outside: "Outside", restaurant: "Restaurant / Bar", mall: "Mall",
             anywhere: "Anywhere", datenight: "Date night", friends: "With friends" }[l] || l;
  }

  function matches(q) {
    if (F.d !== "any" && q.d !== F.d) return false;
    if (F.time !== "any") {
      var t = +F.time;
      if (t === 5 && q.time > 10) return false;
      if (t === 15 && (q.time < 11 || q.time > 20)) return false;
      if (t === 30 && (q.time < 21 || q.time > 45)) return false;
      if (t === 60 && (q.time < 46 || q.time > 90)) return false;
      if (t === 120 && q.time < 91) return false;
    }
    if (F.loc !== "any" && q.loc.indexOf(F.loc) < 0) return false;
    if (F.b !== "any") {
      var order = { free: 0, "10": 1, "25": 2, any: 3 };
      var ok = q.b.some(function (x) { return order[x] <= order[F.b]; });
      if (!ok) return false;
    }
    if (F.p !== "any" && q.p.indexOf(F.p) < 0) return false;
    return true;
  }

  /* ================= MAIN ================= */
  HT.router.on("quests", function (el) {
    el.appendChild(HT.ui.header("🗺️ Random Side Quest", "Real life becomes a video game.", ""));
    var p = prof(), lvl = levelFor(p.xp), L = HT.LEVELS[lvl];
    var next = HT.LEVELS[lvl + 1];

    var pc = document.createElement("div"); pc.className = "card";
    var favLoc = Object.keys(p.byLoc).sort(function (a, b) { return (p.byLoc[b] || 0) - (p.byLoc[a] || 0); })[0];
    pc.innerHTML =
      "<div style='display:flex;justify-content:space-between;align-items:baseline'><h3 style='margin:0'>Level " + (lvl + 1) + " — " + L.n + "</h3>" +
      "<b style='color:var(--gold)'>" + p.xp + " XP</b></div>" +
      (next ? "<div class='xpbar'><div style='width:" + Math.min(100, Math.round((p.xp - L.xp) / (next.xp - L.xp) * 100)) + "%'></div></div>" +
        "<small style='color:var(--muted)'>" + (next.xp - p.xp) + " XP to " + next.n + "</small>"
        : "<p class='sub'>Max level. Legendary.</p>") +
      "<div class='chip-row' style='margin:10px 0 0'>" +
      "<span class='qtag'>⚔️ " + p.completed + " quests</span>" +
      "<span class='qtag'>🔥 " + p.streak + " day streak</span>" +
      (favLoc ? "<span class='qtag'>❤️ " + locName(favLoc) + "</span>" : "") + "</div>";
    el.appendChild(pc);

    // sub-nav
    var tabs = [["🎲", "Quest"], ["🗺️", "Chains"], ["🏆", "Trophies"], ["📜", "History"]];
    var sub = HT.store.get("quest-sub", "Quest");
    var seg = document.createElement("div"); seg.className = "seg"; seg.style.marginBottom = "14px";
    tabs.forEach(function (t) {
      var b = document.createElement("button");
      b.textContent = t[0] + " " + t[1];
      if (sub === t[1]) b.classList.add("sel");
      b.onclick = function () { HT.sfx.tap(); HT.store.set("quest-sub", t[1]); HT.router.refresh(); };
      seg.appendChild(b);
    });
    el.appendChild(seg);

    if (sub === "Quest") renderGenerator(el);
    else if (sub === "Chains") renderChains(el);
    else if (sub === "Trophies") renderTrophies(el);
    else renderHistory(el);
  });

  /* ================= GENERATOR ================= */
  function chipRow(el, label, options, key) {
    var d = document.createElement("div"); d.className = "field";
    d.innerHTML = "<label>" + label + "</label>";
    var row = document.createElement("div"); row.className = "chip-row quest";
    options.forEach(function (o) {
      var b = document.createElement("button");
      b.className = "chip" + (F[key] === o[0] ? " sel" : ""); b.textContent = o[1];
      b.onclick = function () {
        HT.sfx.tap(); F[key] = o[0];
        row.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
      };
      row.appendChild(b);
    });
    d.appendChild(row); el.appendChild(d);
  }

  function renderGenerator(el) {
    chipRow(el, "Difficulty", [["any", "Any"], ["easy", "Easy"], ["medium", "Medium"], ["chaotic", "Chaotic"]], "d");
    chipRow(el, "Time available", [["any", "Any"], ["5", "5 min"], ["15", "15 min"], ["30", "30 min"], ["60", "1 hour"], ["120", "2+ hours"]], "time");
    chipRow(el, "Location", [["any", "Anywhere"], ["home", "🏠 At home"], ["outside", "🌳 Outside"], ["restaurant", "🍽️ Restaurant / Bar"], ["mall", "🛍️ Mall"], ["datenight", "🌙 Date night"], ["friends", "👯 With friends"]], "loc");
    chipRow(el, "Budget", [["any", "No limit"], ["free", "Free"], ["10", "Under $10"], ["25", "Under $25"]], "b");
    chipRow(el, "Players", [["any", "Any"], ["solo", "Solo"], ["2", "2 players"], ["4", "3–4"], ["5", "5+"]], "p");

    var big = document.createElement("button");
    big.className = "btn quest"; big.style.fontSize = "20px"; big.style.padding = "20px";
    big.textContent = "🎲 GIVE ME A SIDE QUEST";
    big.onclick = function () { HT.sfx.quest(); rollQuest(el); };
    el.appendChild(big);

    var slot = document.createElement("div"); slot.id = "quest-slot"; slot.className = "mt";
    el.appendChild(slot);
    if (current) paintQuest(slot, current);
    else slot.appendChild(HT.ui.empty("🗺️", "No quest yet", "Set your filters (or don't) and smash the big button. Adventure awaits.", "", null));
  }

  function rollQuest(el) {
    var slot = document.getElementById("quest-slot");
    // 12% chance: rare mini adventure
    if (Math.random() < 0.12) {
      current = { chain: HT.pick(HT.QUEST_CHAINS) };
      paintQuest(slot, current);
      HT.toast("✨ RARE: Mini Adventure appeared!");
      return;
    }
    var pool = HT.QUESTS.filter(matches);
    if (!pool.length) {
      slot.innerHTML = "";
      slot.appendChild(HT.ui.empty("🤷", "No quests match", "Try loosening a filter or two — adventure is flexible.", "", null));
      HT.sfx.bad();
      return;
    }
    current = HT.pick(pool);
    paintQuest(slot, current);
  }

  function paintQuest(slot, q) {
    slot.innerHTML = "";
    var card = document.createElement("div");
    card.className = "card quest-card reveal-pop";
    if (q.chain) {
      var c = q.chain;
      card.innerHTML = '<div class="kicker" style="color:#fde68a">✨ Rare — Mini Adventure</div>' +
        "<h2>" + HT.esc(c.n) + "</h2>" +
        c.steps.map(function (s, i) {
          return '<div class="chain-step"><span class="n">' + (i + 1) + "</span><span class='flavor'>" + HT.esc(s) + "</span></div>";
        }).join("") +
        '<div class="quest-meta"><span class="xp-pill">+' + c.xp + " XP</span></div>";
      var acc = document.createElement("button");
      acc.className = "btn"; acc.style.background = "rgba(255,255,255,.18)"; acc.textContent = "Accept adventure ⚔️";
      acc.onclick = function () { HT.sfx.pick(); startChain(card, c); };
      card.appendChild(acc);
    } else {
      card.innerHTML = '<div class="kicker" style="color:#a7f3d0">Side Quest</div>' +
        "<h2>" + HT.esc(q.n) + "</h2>" +
        "<p class='flavor'>" + HT.esc(q.t) + "</p>" +
        '<div class="quest-meta"><span class="qtag"><span class="stars">' + diffStars(q.d) + "</span> " + diffName(q.d) + "</span>" +
        '<span class="qtag">⏱️ ' + timeName(q.time) + "</span>" +
        '<span class="qtag">📍 ' + q.loc.map(locName).slice(0, 2).join(" · ") + "</span>" +
        '<span class="xp-pill">+' + HT.XP_FOR[q.d] + " XP</span></div>";
      var row = document.createElement("div");
      var acc2 = document.createElement("button");
      acc2.className = "btn row2"; acc2.style.background = "rgba(255,255,255,.18)"; acc2.textContent = "Accept quest ⚔️";
      acc2.onclick = function () { HT.sfx.pick(); acceptQuest(card, q); };
      var reroll = document.createElement("button");
      reroll.className = "btn row2"; reroll.style.background = "rgba(255,255,255,.12)"; reroll.style.marginLeft = "12px";
      reroll.textContent = "🎲 Reroll";
      reroll.onclick = function () { HT.sfx.tap(); rollQuest(document.getElementById("quests")); };
      row.appendChild(acc2); row.appendChild(reroll); card.appendChild(row);
    }
    slot.appendChild(card);
    card.scrollIntoView({ behavior: HT.settings.anim ? "smooth" : "auto", block: "nearest" });
  }

  function acceptQuest(card, q) {
    card.innerHTML = '<div class="kicker" style="color:#a7f3d0">Quest accepted</div>' +
      "<h2>" + HT.esc(q.n) + "</h2><p class='flavor'>" + HT.esc(q.t) + "</p>" +
      '<p class="flavor">Go do the thing. Come back and claim your XP. 🎮</p>';
    var done = document.createElement("button");
    done.className = "btn"; done.style.background = "var(--gold)"; done.style.color = "#3a2a00";
    done.textContent = "✅ Complete quest (+" + HT.XP_FOR[q.d] + " XP)";
    done.onclick = function () { completeQuest(q, HT.XP_FOR[q.d]); current = null; HT.router.refresh(); };
    var drop = document.createElement("button");
    drop.className = "btn ghost"; drop.style.marginTop = "10px"; drop.style.color = "#fff"; drop.textContent = "Abandon quest";
    drop.onclick = function () { HT.sfx.tap(); current = null; HT.router.refresh(); };
    card.appendChild(done); card.appendChild(drop);
  }

  function completeQuest(q, xp) {
    var p = prof();
    var oldLvl = levelFor(p.xp);
    p.xp += xp; p.completed++;
    var today = HT.today();
    if (p.lastDate === today) { /* streak unchanged */ }
    else {
      var y = new Date(); y.setDate(y.getDate() - 1);
      p.streak = (p.lastDate === y.toISOString().slice(0, 10)) ? p.streak + 1 : 1;
      p.lastDate = today;
    }
    (q.tag || []).forEach(function (t) { p.byTag[t] = (p.byTag[t] || 0) + 1; });
    q.loc.forEach(function (l) { p.byLoc[l] = (p.byLoc[l] || 0) + 1; });
    // achievements
    var fresh = [];
    HT.ACHIEVEMENTS.forEach(function (a) {
      if (p.achievements.indexOf(a.id) < 0 && a.check(p)) { p.achievements.push(a.id); fresh.push(a); }
    });
    saveProf(p);
    var h = qhist();
    h.unshift({ n: q.n || q.name, d: today, diff: q.d || "adventure", xp: xp,
      players: (q.p || []).join(","), fav: false });
    saveQhist(h.slice(0, 200));
    var newLvl = levelFor(p.xp);
    if (newLvl > oldLvl) { HT.sfx.level(); HT.confetti.burst(200); HT.toast("🎉 LEVEL UP — " + HT.LEVELS[newLvl].n + "!"); }
    else { HT.sfx.win(); HT.confetti.burst(90); }
    fresh.forEach(function (a) { setTimeout(function () { HT.toast("🏆 Achievement: " + a.name); }, 600); });
  }

  /* ================= CHAINS ================= */
  function renderChains(el) {
    el.appendChild(HT.ui.header("", "", ""));
    var info = document.createElement("p"); info.className = "sub";
    info.textContent = "Mini Adventures are multi-step quests with big XP. They also appear rarely when you roll.";
    el.appendChild(info);
    HT.QUEST_CHAINS.forEach(function (c) {
      var card = document.createElement("div"); card.className = "card quest-card";
      card.innerHTML = '<div class="kicker" style="color:#fde68a">Mini Adventure</div><h2>' + HT.esc(c.n) + "</h2>" +
        '<p class="flavor">' + c.steps.length + " steps</p>" +
        '<div class="quest-meta"><span class="xp-pill">+' + c.xp + " XP</span></div>";
      var b = document.createElement("button");
      b.className = "btn"; b.style.background = "rgba(255,255,255,.18)"; b.textContent = "Start adventure ⚔️";
      b.onclick = function () { HT.sfx.pick(); startChain(card, c); };
      card.appendChild(b);
      el.appendChild(card);
    });
  }

  function startChain(card, c) {
    activeChain = { c: c, step: 0 };
    paintChainStep(card);
  }
  function paintChainStep(card) {
    var a = activeChain, c = a.c;
    card.innerHTML = '<div class="kicker" style="color:#fde68a">Mini Adventure · step ' + (a.step + 1) + " of " + c.steps.length + "</div>" +
      "<h2>" + HT.esc(c.n) + "</h2>" +
      "<p class='flavor' style='font-size:18px'>" + HT.esc(c.steps[a.step]) + "</p>" +
      '<div class="progress" style="background:rgba(255,255,255,.15)"><div style="width:' + Math.round(a.step / c.steps.length * 100) + '%;background:var(--gold)"></div></div>';
    var b = document.createElement("button");
    b.className = "btn"; b.style.background = "rgba(255,255,255,.18)";
    b.textContent = a.step + 1 < c.steps.length ? "Done — next step →" : "🏁 Finish adventure (+" + c.xp + " XP)";
    b.onclick = function () {
      HT.sfx.pick(); a.step++;
      if (a.step >= c.steps.length) {
        completeQuest({ n: c.n, d: "adventure", loc: ["anywhere"], p: ["2"], tag: [] }, c.xp);
        activeChain = null; current = null; HT.router.refresh();
      } else paintChainStep(card);
    };
    card.appendChild(b);
  }

  /* ================= TROPHIES ================= */
  function renderTrophies(el) {
    var p = prof();
    var got = p.achievements.length;
    el.appendChild(HT.ui.header("", "", ""));
    var info = document.createElement("p"); info.className = "sub";
    info.textContent = got + " of " + HT.ACHIEVEMENTS.length + " achievements unlocked.";
    el.appendChild(info);
    var grid = document.createElement("div"); grid.className = "trophy-case";
    HT.ACHIEVEMENTS.forEach(function (a) {
      var un = p.achievements.indexOf(a.id) >= 0;
      var d = document.createElement("div"); d.className = "trophy mini" + (un ? "" : " locked");
      d.innerHTML = '<span class="t-ico">' + (un ? a.icon : "🔒") + "</span><b>" + HT.esc(a.name) + "</b><small>" + HT.esc(a.desc) + "</small>";
      grid.appendChild(d);
    });
    el.appendChild(grid);
  }

  /* ================= HISTORY ================= */
  function renderHistory(el) {
    el.appendChild(HT.ui.header("", "", ""));
    var h = qhist();
    if (!h.length) {
      el.appendChild(HT.ui.empty("📜", "No quests completed yet", "Your finished adventures will be logged here with XP and dates.", "", null));
      return;
    }
    var card = document.createElement("div"); card.className = "card";
    h.forEach(function (q, i) {
      var r = document.createElement("div"); r.className = "hist-row";
      r.innerHTML = "<span style='font-size:22px'>" + (q.diff === "chaotic" ? "🌪️" : q.diff === "medium" ? "⚔️" : q.diff === "adventure" ? "🗺️" : "🌱") + "</span>" +
        "<span class='grow'><b>" + HT.esc(q.n) + "</b><small>" + HT.esc(q.d) + " · +" + q.xp + " XP · " + HT.esc(q.diff) + "</small></span>";
      var fav = document.createElement("button");
      fav.className = "fav-btn"; fav.textContent = q.fav ? "⭐" : "☆";
      fav.onclick = function () {
        HT.sfx.tap(); q.fav = !q.fav;
        var all = qhist(); all[i].fav = q.fav; saveQhist(all);
        fav.textContent = q.fav ? "⭐" : "☆";
      };
      r.appendChild(fav);
      card.appendChild(r);
    });
    el.appendChild(card);
  }
})();
