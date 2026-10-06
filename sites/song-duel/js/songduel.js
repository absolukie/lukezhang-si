/* Song Duel: quick duel, tournament, group mode, history (standalone) */
"use strict";
var HT = window.HT || (window.HT = {});
HT.Duel = (function () {
  var S = { tourney: null, group: null }; // session state
  var ACCENT = "duel";

  function hist() { return HT.store.get("duel-history", []); }
  function saveHist(h) { HT.store.set("duel-history", h); }

  function mkSong(t, a, art, link) {
    return { t: (t || "Untitled").trim() || "Untitled", a: (a || "Unknown artist").trim() || "Unknown artist",
             art: (art || "").trim(), link: (link || "").trim(), id: HT.uid() };
  }
  function artHTML(song) {
    var inner = "🎵" + (song.art
      ? '<img src="' + HT.esc(song.art) + '" alt="" onerror="this.remove()">'
      : "");
    return '<div class="art">' + inner + "</div>";
  }
  function linkHTML(song) {
    if (!song.link) return "";
    return '<div><a href="' + HT.esc(song.link) + '" target="_blank" rel="noopener" class="btn small ghost" style="margin-top:6px">▶ Listen</a></div>';
  }

  // "Gabrielle's playlist" fill button — sits next to each Randomize button
  function gabrielleBtn(fill) {
    var b = document.createElement("button");
    b.className = "btn ghost"; b.textContent = "💛 Gabrielle's playlist";
    b.style.marginTop = "8px";
    b.onclick = function () {
      HT.sfx.tap();
      fill(HT.shuffle(HT.GABRIELLE_SONGS));
      HT.toast("Gabrielle's picks loaded 💛");
    };
    return b;
  }

  /* ================= MENU ================= */
  HT.router.on("duel", function (el) {
    el.appendChild(HT.ui.header("🎵 Song Duel", "Settle the aux debate.", "Head-to-head battles, tournaments, and group votes."));
    var hero = document.createElement("div");
    hero.className = "share-card duel";
    hero.innerHTML = '<div style="font-size:54px">🎵</div><h2>Song Duel</h2>' +
      '<div class="sc-sub">Two songs enter. One song leaves.<br>Tournaments, group votes, bragging rights.</div>';
    el.appendChild(hero);
    var modes = [
      ["⚡", "Quick Duel", "Two songs enter. One song leaves.", "duel-quick"],
      ["🏆", "Tournament", "4, 8, or 16 songs. Full bracket. One champion.", "duel-tourney"],
      ["👥", "Group Mode", "Everyone votes privately on the same matchup.", "duel-group"],
      ["📜", "Duel History", "Past champions and their records.", "duel-history"]
    ];
    modes.forEach(function (m) {
      var c = document.createElement("button");
      c.className = "card"; c.style.width = "100%"; c.style.textAlign = "left"; c.style.cursor = "pointer";
      c.innerHTML = '<div style="font-size:34px">' + m[0] + "</div><h3>" + m[1] + "</h3><p class='sub' style='margin:0'>" + m[2] + "</p>";
      c.onclick = function () { HT.sfx.pick(); HT.router.push(m[3]); };
      el.appendChild(c);
    });
  });

  /* ================= QUICK DUEL SETUP ================= */
  function songForm(el, idx, pre) {
    var fs = document.createElement("div"); fs.className = "card";
    fs.innerHTML = "<h3>Song " + (idx === 0 ? "A 🅰️" : "B 🅱️") + "</h3>";
    var fields = [["t", "Song title", "text"], ["a", "Artist", "text"], ["art", "Artwork image URL (optional)", "url"], ["link", "YouTube / Spotify link (optional)", "url"]];
    var inputs = {};
    fields.forEach(function (f) {
      var d = document.createElement("div"); d.className = "field";
      d.innerHTML = "<label>" + f[1] + "</label>";
      var inp = document.createElement("input"); inp.type = f[2]; inp.placeholder = f[1];
      if (pre) inp.value = pre[f[0]] || "";
      d.appendChild(inp); fs.appendChild(d); inputs[f[0]] = inp;
    });
    el.appendChild(fs);
    return inputs;
  }

  HT.router.on("duel-quick", function (el) {
    el.appendChild(HT.ui.back("Song Duel"));
    el.appendChild(HT.ui.header("⚡ Quick Duel", "Two songs. One winner.", ""));
    var fA = songForm(el, 0), fB = songForm(el, 1);
    var rnd = document.createElement("button");
    rnd.className = "btn ghost"; rnd.textContent = "🎲 Randomize songs";
    rnd.onclick = function () {
      HT.sfx.tap();
      var p = HT.shuffle(HT.SEED_SONGS).slice(0, 2);
      fA.t.value = p[0][0]; fA.a.value = p[0][1];
      fB.t.value = p[1][0]; fB.a.value = p[1][1];
      HT.toast("Songs randomized 🎲");
    };
    el.appendChild(rnd);
    el.appendChild(gabrielleBtn(function (p) {
      fA.t.value = p[0][0]; fA.a.value = p[0][1];
      fB.t.value = p[1][0]; fB.a.value = p[1][1];
    }));
    var go = document.createElement("button");
    go.className = "btn duel"; go.style.marginTop = "10px"; go.textContent = "Start Duel ⚔️";
    go.onclick = function () {
      HT.sfx.pick();
      var a = mkSong(fA.t.value, fA.a.value, fA.art.value, fA.link.value);
      var b = mkSong(fB.t.value, fB.a.value, fB.art.value, fB.link.value);
      startBattle(a, b, { mode: "quick" });
    };
    el.appendChild(go);
  });

  /* ================= BATTLE SCREEN ================= */
  function startBattle(a, b, opts, replace) {
    opts = opts || {};
    HT.router.on("__battle", function (el) { renderBattle(el, a, b, opts); });
    if (replace) HT.router.replace("__battle"); else HT.router.push("__battle");
  }

  function renderBattle(el, a, b, opts) {
    if (opts.mode === "group") el.appendChild(HT.ui.back("Group setup"));
    else if (opts.mode === "tourney") el.appendChild(HT.ui.back("Bracket"));
    else el.appendChild(HT.ui.back("Quick Duel"));
    var kick = opts.mode === "group" ? "👥 Group vote" : opts.mode === "tourney" ? "🏆 " + opts.roundName : "⚡ Quick Duel";
    el.appendChild(HT.ui.header(kick, "Which song wins?", opts.groupLabel || "Tap your pick. No take-backs."));

    var wrap = document.createElement("div"); wrap.className = "vs-wrap";
    function card(song, tag) {
      var c = document.createElement("div"); c.className = "song-card";
      c.innerHTML = artHTML(song) + "<h3>" + HT.esc(song.t) + "</h3><div class='artist'>" + HT.esc(song.a) + "</div>" + linkHTML(song);
      var btn = document.createElement("button");
      btn.className = "btn duel pick-btn"; btn.textContent = "Choose " + tag;
      btn.onclick = function () { HT.sfx.pick(); resolveBattle(el, a, b, opts, song); };
      c.appendChild(btn);
      return c;
    }
    wrap.appendChild(card(a, "A 🅰️"));
    var vs = document.createElement("div"); vs.className = "vs-badge"; vs.textContent = "VS"; wrap.appendChild(vs);
    wrap.appendChild(card(b, "B 🅱️"));
    el.appendChild(wrap);

    if (opts.mode !== "group") {
      var tie = document.createElement("button");
      tie.className = "btn ghost"; tie.textContent = "🤝 Tie — can't decide";
      tie.onclick = function () { HT.sfx.tap(); resolveBattle(el, a, b, opts, null); };
      el.appendChild(tie);
    }
  }

  function resolveBattle(el, a, b, opts, winner) {
    // group mode: accumulate private votes
    if (opts.mode === "group") {
      if (winner === a) S.group.votes.a++;
      else S.group.votes.b++;
      S.group.voter++;
      if (S.group.voter <= S.group.n) { renderPassPhone(el); return; }
      return renderGroupResult(el, a, b, opts);
    }
    // quick / tourney: reveal
    renderReveal(el, a, b, opts, winner);
  }

  function renderReveal(el, a, b, opts, winner) {
    el.innerHTML = "";
    el.appendChild(HT.ui.back(opts.mode === "tourney" ? "Bracket" : "Song Duel"));
    var w = winner, tied = !winner;
    var h = document.createElement("div");
    h.innerHTML = '<div class="kicker">' + (tied ? "🤝 It's a tie" : "🏆 Winner") + "</div>";
    el.appendChild(h);

    var wrap = document.createElement("div"); wrap.className = "vs-wrap";
    [[a], [b]].forEach(function (pair) {
      var song = pair[0];
      var c = document.createElement("div");
      c.className = "song-card reveal-pop" + (tied ? "" : song === w ? " winner" : " loser");
      c.innerHTML = artHTML(song) +
        (tied ? "" : song === w ? "<div style='font-size:30px'>👑</div>" : "") +
        "<h3>" + HT.esc(song.t) + "</h3><div class='artist'>" + HT.esc(song.a) + "</div>" + linkHTML(song);
      wrap.appendChild(c);
      if (song === a) { var vs = document.createElement("div"); vs.className = "vs-badge"; vs.textContent = "VS"; wrap.appendChild(vs); }
    });
    el.appendChild(wrap);

    if (!tied) { HT.sfx.win(); HT.confetti.burst(90); }
    var msg = document.createElement("p");
    msg.className = "sub center";
    msg.textContent = tied ? "The duel ends in a draw. Rematch?" : "“" + w.t + "” takes the duel!";
    el.appendChild(msg);

    var row = document.createElement("div");
    var rematch = document.createElement("button");
    rematch.className = "btn duel row2"; rematch.textContent = "🔁 Rematch";
    rematch.onclick = function () { HT.sfx.tap(); startBattle(a, b, opts, true); };
    var done = document.createElement("button");
    done.className = "btn ghost row2"; done.style.marginLeft = "12px";
    done.textContent = opts.mode === "tourney" ? "Continue 🏆" : "New duel ⚡";
    done.onclick = function () {
      HT.sfx.tap();
      if (opts.mode === "tourney" && opts.onDone) opts.onDone(winner);
      else HT.router.back();
    };
    row.appendChild(rematch); row.appendChild(done); el.appendChild(row);

    if (opts.mode === "quick" && !tied) {
      var hst = hist();
      hst.unshift({ t: w.t, a: w.a, d: HT.today(), kind: "Quick Duel", record: "Won a head-to-head duel" });
      saveHist(hst.slice(0, 100));
    }
  }

  /* ================= TOURNAMENT ================= */
  HT.router.on("duel-tourney", function (el) {
    el.appendChild(HT.ui.back("Song Duel"));
    el.appendChild(HT.ui.header("🏆 Tournament", "How many songs enter the arena?", ""));
    [4, 8, 16].forEach(function (n) {
      var b = document.createElement("button");
      b.className = "btn duel"; b.textContent = n + " songs";
      b.onclick = function () { HT.sfx.pick(); HT.router.on("__tsetup", function (e2) { renderTourneySetup(e2, n); }); HT.router.push("__tsetup"); };
      el.appendChild(b);
    });
  });

  function renderTourneySetup(el, n) {
    el.appendChild(HT.ui.back("Tournament"));
    el.appendChild(HT.ui.header("🏆 " + n + "-Song Tournament", "Enter the contenders, then shuffle the bracket.", ""));
    var forms = [];
    for (var i = 0; i < n; i++) forms.push(songForm(el, i));
    var rnd = document.createElement("button");
    rnd.className = "btn ghost"; rnd.textContent = "🎲 Fill with random songs";
    rnd.onclick = function () {
      HT.sfx.tap();
      var p = HT.shuffle(HT.SEED_SONGS).slice(0, n);
      forms.forEach(function (f, i) { f.t.value = p[i][0]; f.a.value = p[i][1]; });
      HT.toast("Bracket fuel loaded 🎲");
    };
    el.appendChild(rnd);
    el.appendChild(gabrielleBtn(function (p) {
      forms.forEach(function (f, i) { f.t.value = p[i][0]; f.a.value = p[i][1]; });
    }));
    var go = document.createElement("button");
    go.className = "btn duel"; go.style.marginTop = "10px"; go.textContent = "🔀 Shuffle bracket & start";
    go.onclick = function () {
      var songs = forms.map(function (f) { return mkSong(f.t.value, f.a.value, f.art.value, f.link.value); });
      var order = HT.shuffle(songs);
      var matches = [];
      for (var i = 0; i < order.length; i += 2) matches.push({ a: order[i], b: order[i + 1], winner: null });
      S.tourney = { size: n, rounds: [matches], ri: 0, mi: 0, eliminated: [], played: 0, date: HT.today() };
      HT.sfx.pick();
      HT.router.on("__bracket", renderBracket);
      HT.router.push("__bracket");
    };
    el.appendChild(go);
  }

  function roundName(size, ri) {
    var total = Math.log2(size);
    var left = total - ri;
    return left === 1 ? "Final" : left === 2 ? "Semifinals" : "Round of " + Math.pow(2, left);
  }

  function renderBracket(el) {
    var T = S.tourney;
    el.innerHTML = "";
    el.appendChild(HT.ui.back("Song Duel"));
    el.appendChild(HT.ui.header("🏆 Tournament Bracket", T.size + " songs · " + T.played + " matchups played", ""));
    var br = document.createElement("div"); br.className = "bracket";
    T.rounds.forEach(function (matches, ri) {
      var col = document.createElement("div"); col.className = "b-round";
      col.innerHTML = "<h4>" + roundName(T.size, ri) + "</h4>";
      matches.forEach(function (m, mi) {
        var d = document.createElement("div");
        var playable = ri === T.ri && mi === T.mi && !m.winner;
        d.className = "b-match" + (playable ? " playable" : "");
        function team(song, won) {
          return "<span class='bm-team " + (m.winner ? (won ? "win" : "out") : "") + "'>" +
            (m.winner && won ? "👑 " : "") + HT.esc(song.t) + " <small style='color:var(--muted)'>" + HT.esc(song.a) + "</small></span>";
        }
        d.innerHTML = team(m.a, m.winner === m.a) + team(m.b, m.winner === m.b);
        if (playable) {
          d.onclick = function () {
            HT.sfx.pick();
            startBattle(m.a, m.b, {
              mode: "tourney", roundName: roundName(T.size, ri),
              onDone: function (winner) { advanceTourney(winner); }
            });
          };
        }
        col.appendChild(d);
      });
      br.appendChild(col);
    });
    el.appendChild(br);
    var hint = document.createElement("p");
    hint.className = "sub center";
    hint.textContent = "Tap the highlighted matchup to play it.";
    el.appendChild(hint);
  }

  function advanceTourney(winner) {
    var T = S.tourney;
    if (!winner) { HT.router.replace("__bracket"); return; } // tie: replay
    var m = T.rounds[T.ri][T.mi];
    m.winner = winner;
    T.played++;
    T.eliminated.push(winner === m.a ? m.b : m.a);
    // next match or next round
    if (T.mi + 1 < T.rounds[T.ri].length) { T.mi++; }
    else {
      var winners = T.rounds[T.ri].map(function (x) { return x.winner; });
      if (winners.length === 1) return renderChampion(winners[0]);
      var nm = [];
      for (var i = 0; i < winners.length; i += 2) nm.push({ a: winners[i], b: winners[i + 1], winner: null });
      T.rounds.push(nm); T.ri++; T.mi = 0;
    }
    HT.router.replace("__bracket");
  }

  function renderChampion(champ) {
    var T = S.tourney;
    var runnerUp = T.eliminated[T.eliminated.length - 1];
    var h = hist();
    h.unshift({ t: champ.t, a: champ.a, d: T.date, kind: T.size + "-song tournament",
      record: "Beat " + (T.size - 1) + " other song" + (T.size > 2 ? "s" : "") });
    saveHist(h.slice(0, 100));
    HT.router.on("__champ", function (el) {
      el.innerHTML = "";
      el.appendChild(HT.ui.back("Song Duel"));
      HT.sfx.win(); HT.confetti.burst(220);
      var card = document.createElement("div");
      card.className = "share-card duel reveal-pop";
      card.innerHTML = '<div class="sc-kicker">🏆 Song Duel Champion</div>' +
        '<div style="font-size:52px;margin:8px 0">' + (champ.art ? '<img src="' + HT.esc(champ.art) + '" style="width:110px;height:110px;border-radius:22px;object-fit:cover" onerror="this.remove()">' : "🎵") + "</div>" +
        "<h2>" + HT.esc(champ.t) + "</h2>" +
        '<div class="sc-sub">' + HT.esc(champ.a) + "<br>Record: beat " + (T.size - 1) + " other song" + (T.size > 2 ? "s" : "") +
        "<br>🥈 Runner-up: " + HT.esc(runnerUp.t) + " — " + HT.esc(runnerUp.a) + "</div>";
      el.appendChild(card);
      var stats = document.createElement("div"); stats.className = "card";
      stats.innerHTML = "<h3>Tournament recap</h3>" +
        "<div class='list-row'><span class='grow'>Matchups played<small>" + T.played + " head-to-head battles</small></span></div>" +
        "<div class='list-row'><span class='grow'>Songs eliminated<small>" + T.eliminated.map(function (s) { return HT.esc(s.t); }).join(", ") + "</small></span></div>";
      el.appendChild(stats);
      var shot = document.createElement("button");
      shot.className = "btn ghost"; shot.textContent = "📸 Screenshot this card";
      shot.onclick = function () { HT.toast("Screenshot away 📸 — it's all yours"); };
      el.appendChild(shot);
      var again = document.createElement("button");
      again.className = "btn duel"; again.style.marginTop = "10px"; again.textContent = "🏆 New tournament";
      again.onclick = function () { HT.sfx.tap(); HT.router.push("duel-tourney"); };
      el.appendChild(again);
    });
    HT.router.replace("__champ");
  }

  /* ================= GROUP MODE ================= */
  HT.router.on("duel-group", function (el) {
    el.appendChild(HT.ui.back("Song Duel"));
    el.appendChild(HT.ui.header("👥 Group Mode", "Everyone votes. Privately. Then the truth comes out.", ""));
    var n = 3;
    var seg = document.createElement("div"); seg.className = "seg chip-row duel"; seg.style.display = "flex";
    var btns = [];
    [2, 3, 4, 5, 6, 7, 8].forEach(function (k) {
      var b = document.createElement("button");
      b.textContent = k; if (k === 3) b.classList.add("sel");
      b.onclick = function () { HT.sfx.tap(); n = k; btns.forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); };
      btns.push(b); seg.appendChild(b);
    });
    var lab = document.createElement("div"); lab.className = "field";
    lab.innerHTML = "<label>How many people are playing?</label>";
    lab.appendChild(seg); el.appendChild(lab);
    var fA = songForm(el, 0), fB = songForm(el, 1);
    var rnd = document.createElement("button");
    rnd.className = "btn ghost"; rnd.textContent = "🎲 Randomize songs";
    rnd.onclick = function () {
      HT.sfx.tap();
      var p = HT.shuffle(HT.SEED_SONGS).slice(0, 2);
      fA.t.value = p[0][0]; fA.a.value = p[0][1]; fB.t.value = p[1][0]; fB.a.value = p[1][1];
    };
    el.appendChild(rnd);
    el.appendChild(gabrielleBtn(function (p) {
      fA.t.value = p[0][0]; fA.a.value = p[0][1]; fB.t.value = p[1][0]; fB.a.value = p[1][1];
    }));
    var go = document.createElement("button");
    go.className = "btn duel"; go.style.marginTop = "10px"; go.textContent = "Start group vote 🗳️";
    go.onclick = function () {
      HT.sfx.pick();
      S.group = { n: n, voter: 1, votes: { a: 0, b: 0 } };
      var a = mkSong(fA.t.value, fA.a.value, fA.art.value, fA.link.value);
      var b = mkSong(fB.t.value, fB.a.value, fB.art.value, fB.link.value);
      S.group.a = a; S.group.b = b;
      var view = document.getElementById("view-main");
      view.innerHTML = "";
      renderPassPhone(view, true);
    };
    el.appendChild(go);
  });

  function renderPassPhone(el, isFirst) {
    el.innerHTML = "";
    el.appendChild(HT.ui.back("Group setup"));
    var g = S.group;
    var d = document.createElement("div"); d.className = "card center";
    d.innerHTML = '<div style="font-size:52px">🙈</div><h2>Player ' + g.voter + " of " + g.n + "</h2>" +
      '<p class="sub">Vote privately. No peeking, no influencing.</p>';
    el.appendChild(d);
    var go = document.createElement("button");
    go.className = "btn duel"; go.textContent = "I'm Player " + g.voter + " — let me vote";
    go.onclick = function () {
      HT.sfx.tap();
      startBattle(g.a, g.b, { mode: "group", groupLabel: "Player " + g.voter + " — your vote is secret 🤫" }, !isFirst);
    };
    el.appendChild(go);
  }

  function renderGroupResult(el, a, b, opts) {
    el.innerHTML = "";
    el.appendChild(HT.ui.back("Group setup"));
    var g = S.group, va = g.votes.a, vb = g.votes.b;
    el.appendChild(HT.ui.header("🗳️ Results", "The people have spoken.", ""));
    var card = document.createElement("div"); card.className = "card reveal-pop";
    var tot = Math.max(1, va + vb);
    function bar(song, v, color) {
      var pct = Math.round(v / tot * 100);
      return "<div style='margin-bottom:12px'><div style='display:flex;justify-content:space-between;font-weight:700;margin-bottom:5px'><span>" +
        HT.esc(song.t) + "</span><span>" + v + " vote" + (v === 1 ? "" : "s") + "</span></div>" +
        "<div class='progress'><div style='width:" + pct + "%;background:" + color + "'></div></div></div>";
    }
    card.innerHTML = bar(a, va, "linear-gradient(90deg,#8b5cf6,#a78bfa)") + bar(b, vb, "linear-gradient(90deg,#ef4444,#f87171)");
    el.appendChild(card);
    HT.sfx.win(); HT.confetti.burst(80);

    if (va === vb) {
      var t = document.createElement("div"); t.className = "card center";
      t.innerHTML = "<h2>⚖️ TIEBREAKER</h2><p class='sub'>Dead even. How do we settle this?</p>";
      el.appendChild(t);
      var rev = document.createElement("button");
      rev.className = "btn duel row2"; rev.textContent = "🔁 Revote";
      rev.onclick = function () { HT.sfx.tap(); g.voter = 1; g.votes = { a: 0, b: 0 }; var e2 = document.getElementById("view-main"); e2.innerHTML = ""; renderPassPhone(e2); };
      var coin = document.createElement("button");
      coin.className = "btn ghost row2"; coin.style.marginLeft = "12px"; coin.textContent = "🪙 Random";
      coin.onclick = function () {
        HT.sfx.pick();
        var w = Math.random() < 0.5 ? a : b;
        HT.toast("The coin chooses… " + w.t + " 🪙");
        var e2 = document.getElementById("view-main"); e2.innerHTML = "";
        renderReveal(e2, a, b, { mode: "quick" }, w);
      };
      var r = document.createElement("div"); r.appendChild(rev); r.appendChild(coin); el.appendChild(r);
    } else {
      var w = va > vb ? a : b;
      var msg = document.createElement("p");
      msg.className = "sub center";
      msg.textContent = "“" + w.t + "” wins " + Math.max(va, vb) + "–" + Math.min(va, vb) + "!";
      el.appendChild(msg);
      var h = hist();
      h.unshift({ t: w.t, a: w.a, d: HT.today(), kind: "Group vote (" + g.n + " players)", record: "Won " + Math.max(va, vb) + "–" + Math.min(va, vb) });
      saveHist(h.slice(0, 100));
      var again = document.createElement("button");
      again.className = "btn duel"; again.textContent = "🗳️ New group vote";
      again.onclick = function () { HT.sfx.tap(); HT.router.push("duel-group"); };
      el.appendChild(again);
    }
  }

  /* ================= HISTORY ================= */
  HT.router.on("duel-history", function (el) {
    el.appendChild(HT.ui.back("Song Duel"));
    el.appendChild(HT.ui.header("📜 Duel History", "The hall of champions.", ""));
    var h = hist();
    if (!h.length) {
      el.appendChild(HT.ui.empty("🏆", "No champions yet", "Win a duel or a tournament and the legends will be recorded here.", "Start a duel", function () { HT.router.push("duel-quick"); }, "duel"));
      return;
    }
    var card = document.createElement("div"); card.className = "card";
    h.forEach(function (c, i) {
      var r = document.createElement("div"); r.className = "list-row";
      r.innerHTML = "<span style='font-size:26px'>" + (i === 0 ? "👑" : "🎵") + "</span><span class='grow'><b>" + HT.esc(c.t) + "</b><small>" +
        HT.esc(c.a) + " · " + HT.esc(c.kind) + " · " + HT.esc(c.d) + "<br>" + HT.esc(c.record) + "</small></span>";
      card.appendChild(r);
    });
    el.appendChild(card);
  });
})();
