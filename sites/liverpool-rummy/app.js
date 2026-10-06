/* Liverpool Rummy — app: UI + local game + online rooms.
   Online play is a thin client: the authoritative referee is a Cloudflare
   Worker (one Durable Object per room). This phone never hosts game logic.
   Engine (pure logic) lives in engine.js as LivEngine. */
(function () {
"use strict";
var E = window.LivEngine;

/* ---------- tiny utils ---------- */
var $ = function (id) { return document.getElementById(id); };
var SCREENS = ["screen-home", "screen-setup", "screen-lobby", "screen-table", "screen-score", "screen-final"];
function show(id) {
  SCREENS.forEach(function (s) { $(s).classList.toggle("active", s === id); });
  window.scrollTo(0, 0);
  if (id === "screen-home") refreshRejoinBtn();
  refreshBanner(id); /* banner slots on menu/lobby screens only, never the table */
}
var rnd = function (n) { return Math.floor(Math.random() * n); };
var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
var toastT = null;
function toast(msg, ms) {
  var t = $("toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toastT);
  toastT = setTimeout(function () { t.classList.add("hidden"); }, ms || 2200);
}

/* ---------- game server (Cloudflare Worker) ---------- */
// The authoritative referee. deploy.sh stamps /liverpool-rummy/api with the live
// Worker origin (e.g. https://liverpool-rummy-rooms.<acct>.workers.dev).
// A per-device override in localStorage (livWorkerURL) wins when present,
// handy for pointing a dev build at a local wrangler instance.
var WORKER_URL = "/liverpool-rummy/api";
function workerURL() {
  try {
    var o = localStorage.getItem("livWorkerURL");
    if (o && o.replace(/\/+$/, "")) return o.replace(/\/+$/, "");
  } catch (e) {}
  // deploy.sh stamps /liverpool-rummy/api above. The sentinel is assembled at runtime
  // so sed never rewrites the comparison itself (a literal placeholder here
  // would be replaced too, breaking the check and the regex).
  var sentinel = "__WORKER" + "_URL__";
  return WORKER_URL === sentinel ? "" : WORKER_URL;
}
/* ---- error beacon: report client-side crashes to the worker ---- */
// Window errors on a real phone are invisible otherwise. Throttled to 5 per
// page load, fire-and-forget, and it never throws itself. Only fires while in
// an online room (net.code set) so pass-and-play stays fully offline.
var _beaconed = 0;
function beaconError(msg, stack) {
  try {
    if (_beaconed >= 5) return;
    var wu = workerURL();
    if (!wu || typeof net === "undefined" || !net || !net.code) return;
    _beaconed++;
    var body = JSON.stringify({
      v: (typeof APP_V === "string" ? APP_V : "?").slice(0, 24),
      msg: String(msg).slice(0, 200),
      stack: String(stack || "").slice(0, 300),
      ua: (navigator.userAgent || "").slice(0, 120)
    });
    var url = wu + "/room/" + net.code + "/client-error";
    if (navigator.sendBeacon) navigator.sendBeacon(url, body);
    else fetch(url, { method: "POST", body: body, keepalive: true }).catch(function () {});
  } catch (e) {}
}
window.addEventListener && window.addEventListener("error", function (ev) {
  beaconError(ev.message || "window.onerror", ev.error && ev.error.stack);
});
window.addEventListener && window.addEventListener("unhandledrejection", function (ev) {
  var r = ev.reason;
  beaconError("unhandledrejection: " + (r && r.message ? r.message : String(r)), r && r.stack);
});

function genCode() {
  var A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", s = "";
  for (var i = 0; i < 4; i++) s += A[rnd(A.length)];
  return s;
}
function newPid() { return "p" + Date.now().toString(36) + rnd(99); }

/* ---------- card html ---------- */
var GLYPH = { S: "♠", H: "♥", D: "♦", C: "♣" };
function cardHTML(id, mini) {
  if (E.isJoker(id))
    return '<div class="card joker' + (mini ? " mini" : "") + '" data-card="' + id + '"><div class="cr">🃏</div><div class="cs">wild</div></div>';
  var r = E.rankOf(id), s = E.suitOf(id), red = (s === "H" || s === "D") ? " red" : "";
  return '<div class="card' + red + (mini ? " mini" : "") + '" data-card="' + id + '">' +
    '<div class="corner"><div class="cr">' + r + '</div><div class="cs">' + GLYPH[s] + "</div></div>" +
    '<div class="pip">' + GLYPH[s] + "</div></div>";
}
/* a wild inside a meld shows the rank it stands in for (gold dashed = wild) */
function meldCardHTML(cid, meld) {
  var asg = (meld.jokers || {})[cid];
  if (!asg || !asg.rank) return cardHTML(cid, true);
  var red = (asg.suit === "H" || asg.suit === "D") ? " red" : "";
  return '<div class="card mini wild-as' + red + '" data-card="' + cid + '">' +
    '<div class="corner"><div class="cr">' + asg.rank + '</div><div class="cs">' +
    (asg.suit ? GLYPH[asg.suit] : "🃏") + '</div></div>' +
    '<div class="pip">🃏</div></div>';
}

/* ---------- app state ---------- */
var app = {
  mode: null,            // 'pass' | 'solo' | 'online'
  state: null,           // engine state (local) / mirrored (online)
  myPid: null,           // viewing human
  dealsTotal: 7,
  sel: {},               // selected card ids (local UI)
  pileSel: null,          // 'stock' | 'discard' — pile tapped once, awaiting confirm tap
  sortSuit: true,
  pendingPid: null,      // pass&play interstitial target
  movePending: false,    // online guest waiting for ack
  _buyQueue: null, _buyCard: null, _buyDiscarder: null, // local buy round
};
var net = {
  active: false, ws: null, connected: false, code: null, pid: null, name: "",
  // isHost now means "I hold the lobby controls" (room creator, or the
  // earliest-seated online human when the creator is away). It does NOT mean
  // this phone runs game logic -- the Worker does that.
  isHost: false, lastState: null, welcomed: false,
  _reTimer: null, _reDelay: 1000, _pingTimer: null,
};

/* ---------- home ---------- */
$("m-play").addEventListener("click", function () { openSetup("play"); });
$("m-online").addEventListener("click", function () { openSetup("online"); });
$("btn-how").addEventListener("click", function () { $("howto").classList.toggle("hidden"); });
$("btn-settings").addEventListener("click", function () { openSettings(); });
$("set-close").addEventListener("click", function () { closeSettings(); });
$("btn-privacy").addEventListener("click", function () { window.open("privacy.html", "_blank", "noopener"); });
$("btn-removeads").addEventListener("click", function () {
  var BG = window.BoyGames;
  if (!BG || !BG.store) return;
  var btn = $("btn-removeads");
  btn.disabled = true; btn.textContent = "Working…";
  BG.store.purchase(BG.store.PRODUCT_REMOVE_ADS).then(function (r) {
    if (r && r.owned) {
      if (BG.ads) BG.ads.hideBanner();
      btn.textContent = "✓ Ads removed";
      $("set-restore-row").classList.add("hidden");
    } else {
      btn.disabled = false;
      refreshStoreRow();
      toast("Purchase unavailable right now.");
    }
  }).catch(function () { btn.disabled = false; refreshStoreRow(); });
});
$("btn-restore").addEventListener("click", function () {
  var BG = window.BoyGames;
  if (!BG || !BG.store) return;
  BG.store.restore().then(function () {
    refreshStoreRow();
    toast(BG.store.isOwned(BG.store.PRODUCT_REMOVE_ADS) ? "Ads removed — restored." : "No purchases found.");
  });
});
$("setup-back").addEventListener("click", function () { show("screen-home"); });

/* ---------- setup ---------- */
var setupNames = ["Luke", "Gabrielle"];
function openSetup(mode) {
  app.mode = mode;
  $("setup-online").classList.toggle("hidden", mode !== "online");
  $("btn-start-game").classList.toggle("hidden", mode === "online");
  $("setup-title").textContent = mode === "play" ? "Play" : "Online Room";
  $("setup-sub").textContent = mode === "play" ? "Humans on this phone + optional bots. Add names, add bots, play!"
    : "Play across phones. Room codes are 4 letters.";
  if (mode === "online") {
    // fresh identity every time: empty + focused so typing starts instantly
    $("online-name").value = "";
    try { $("online-name").focus(); } catch (e) {}
  }
  var body = $("setup-body"); body.innerHTML = "";
  if (mode === "play") {
    body.appendChild(nameListEl(1, 4));
    app.botCount = 0; body.appendChild(stepperEl("ADD BOTS", 0, 3, function (v) { app.botCount = v; }));
    var df = document.createElement("div"); df.className = "field";
    df.innerHTML = "<label>MATCH</label>";
    var seg = document.createElement("div"); seg.className = "seg";
    [[7, "Full · 7 deals"], [3, "Quick · 3 deals"]].forEach(function (o) {
      var b = document.createElement("button");
      b.textContent = o[1]; if (o[0] === 7) b.classList.add("sel");
      b.addEventListener("click", function () {
        app.dealsTotal = o[0];
        Array.prototype.forEach.call(seg.children, function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
      });
      seg.appendChild(b);
    });
    df.appendChild(seg); body.appendChild(df);
    app.dealsTotal = 7;
  }
  show("screen-setup");
}
function nameListEl(min, max) {
  app._names = setupNames.slice(0, min); // play: starts with 1 name field; add more humans as needed
  var wrap = document.createElement("div");
  function render() {
    wrap.innerHTML = "";
    wrap._rows = [];
    app._names.forEach(function (nm, i) {
      var row = document.createElement("div"); row.className = "prow";
      var sp = document.createElement("span"); sp.className = "nm"; sp.textContent = (i + 1) + ". " + nm;
      sp.addEventListener("click", function () { openEdit(row, sp, i); });
      row.appendChild(sp);
      if (app._names.length > min) {
        var x = document.createElement("button"); x.className = "px"; x.textContent = "✕";
        x.addEventListener("click", function () { app._names.splice(i, 1); setupNames = app._names.slice(); render(); });
        row.appendChild(x);
      }
      wrap.appendChild(row);
      wrap._rows.push({ row: row, sp: sp, i: i });
    });
    if (app._names.length < max) {
      var add = document.createElement("button"); add.className = "btn ghost block"; add.textContent = "+ Add player";
      add.addEventListener("click", function () { addPlayer(true); });
      wrap.appendChild(add);
    }
  }
  // Adding a player drops you straight into its name field, focused with the
  // placeholder text fully selected, and Return chains to the next player —
  // rapid entry, never re-tap to keep going.
  function addPlayer(focusNew) {
    if (app._names.length >= max) return;
    app._names.push("Player " + (app._names.length + 1));
    setupNames = app._names.slice();
    render();
    if (focusNew) {
      var r = wrap._rows[wrap._rows.length - 1];
      if (r) openEdit(r.row, r.sp, r.i, true);
    }
  }
  // Inline editor. Closes in place (span swap, no list rebuild) so the tap that
  // blurs this editor still lands on its target — one tap, always.
  function openEdit(row, sp, i, selectAll) {
    var inp = document.createElement("input");
    inp.className = "nmedit"; inp.maxLength = 14; inp.value = app._names[i];
    row.replaceChild(inp, sp);
    inp.focus(); // synchronous: one tap opens the keyboard
    try { if (selectAll) inp.select(); else inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) {}
    var done = false;
    function close(commitIt) {
      if (done) return; done = true;
      var v = inp.value.trim();
      if (commitIt && v && app._names.indexOf(v) < 0) { app._names[i] = v; setupNames = app._names.slice(); }
      var nsp = document.createElement("span");
      nsp.className = "nm"; nsp.textContent = (i + 1) + ". " + app._names[i];
      nsp.addEventListener("click", function () { openEdit(row, nsp, i); });
      if (inp.parentNode === row) row.replaceChild(nsp, inp);
    }
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { close(true); inp.blur(); addPlayer(true); }
      if (e.key === "Escape") { close(false); inp.blur(); }
    });
    inp.addEventListener("blur", function () { close(true); });
  }
  render();
  return wrap;
}
function stepperEl(label, min, max, onCh) {
  var v = min, wrap = document.createElement("div");
  wrap.innerHTML = '<div class="field"><label>' + label + '</label></div>';
  var st = document.createElement("div"); st.className = "stepper";
  var dec = document.createElement("button"); dec.className = "btn"; dec.textContent = "−";
  var sv = document.createElement("div"); sv.className = "sv";
  var inc = document.createElement("button"); inc.className = "btn"; inc.textContent = "+";
  function draw() { sv.textContent = v + (v === 1 ? " bot" : " bots"); }
  dec.addEventListener("click", function () { if (v > min) { v--; draw(); onCh(v); } });
  inc.addEventListener("click", function () { if (v < max) { v++; draw(); onCh(v); } });
  st.appendChild(dec); st.appendChild(sv); st.appendChild(inc);
  wrap.appendChild(st); draw();
  return wrap;
}

$("btn-start-game").addEventListener("click", function () {
  if (app.mode === "play") startLocal("pass", app._names, Math.min(app.botCount || 0, 6 - app._names.length));
});

/* pass-the-phone handoff only matters with 2+ humans; a lone human (+bots) never hands off */
function needHandoff() {
  if (app.mode !== "play" && app.mode !== "pass") return false;
  var h = 0;
  (app.state.players || []).forEach(function (p) { if (!p.isBot) h++; });
  return h > 1;
}

/* ---------- local game ---------- */
function botName(i) { return ["R2-D2", "C-3PO", "BB-8", "WALL-E"][i % 4]; }
function startLocal(mode, names, botCount) {
  var players = names.map(function (nm, i) {
    return { pid: "p" + i + "_" + Date.now().toString(36), name: nm, isBot: false, seat: i };
  });
  for (var b = 0; b < botCount; b++)
    players.push({ pid: "b" + b + "_" + Date.now().toString(36), name: "🤖 " + botName(b), isBot: true, seat: players.length });
  app.myPid = players[0].pid;
  app.state = E.createDeal(players, 1, app.dealsTotal, null, Math.random);
  app.sel = {};
  app._buyQueue = null; app._buyCard = null; hideBuyUI();
  app._sortDeal = null; // new game: re-apply the contract's default sort on deal 1
  if (needHandoff()) { app.myPid = app.state.table.turnPid; showInterstitial(app.state.table.turnPid); }
  else { show("screen-table"); renderTable(); runBotsLocal(); }
}

function showInterstitial(pid) {
  var p = playerById(pid);
  $("int-name").textContent = p ? p.name : "Player";
  $("interstitial").classList.remove("hidden");
  app.pendingPid = pid;
}
$("int-go").addEventListener("click", function () {
  if (app.pendingPid) app.myPid = app.pendingPid; // pass & play: the phone holder is now this player
  $("interstitial").classList.add("hidden");
  app.pendingPid = null;
  app.sel = {};
  show("screen-table"); renderTable();
  runBotsLocal();
});

function playerById(pid) {
  var ps = app.state.players;
  for (var i = 0; i < ps.length; i++) if (ps[i].pid === pid) return ps[i];
  return null;
}
function isMyTurn() {
  var p = playerById(app.myPid);
  return !!p && app.state.table.turnPid === app.myPid && !p.isBot;
}

/* local move application */
function localMove(pid, move) {
  var r = E.applyMove(app.state, pid, move);
  if (!r.ok) { toast("Can't do that: " + r.error); return false; }
  afterLocalMove(pid, move);
  return true;
}
function afterLocalMove(pid, move) {
  var T = app.state.table;
  var isDraw = move.t === "drawStock" || move.t === "drawDiscard";
  if (isDraw) {
    // drawing only adds a card to the hand: keep the player's selected cards
    // selected, dropping any id that somehow left the hand (e.g. dev tools)
    var hand = app.state.hands[pid] || [];
    Object.keys(app.sel).forEach(function (cid) { if (hand.indexOf(cid) < 0) delete app.sel[cid]; });
  } else {
    app.sel = {};
  }
  if (T.phase === "dealEnd") { endDealLocal(); return; }
  renderTable();
  if (move.t === "discard" && startBuyRound(pid, move.card)) return; // buy prompt pending
  continueAfterBuyRound(move.t === "discard");
}
function continueAfterBuyRound(turnAdvanced) {
  var T = app.state.table;
  if (T.phase !== "play") { endDealLocal(); return; }
  renderTable();
  var next = playerById(T.turnPid);
  if (turnAdvanced && needHandoff() && next && !next.isBot) {
    showInterstitial(next.pid); // hide hand between humans
  } else {
    runBotsLocal();
  }
}
/* ---------- buying ---------- */
// After any discard, eligible players (everyone except the discarder and the
// next player, who draws normally instead) may buy the top discard + 1 penalty
// stock card, in turn-order priority. First to say yes wins; one buy per discard.
function startBuyRound(discarderPid, card) {
  var st = app.state, T = st.table;
  if (T.phase !== "play" || T.turnStep !== "draw") return false;
  var queue = E.buyCandidates(st);
  if (!queue.length) return false;
  app._buyQueue = queue; app._buyCard = card; app._buyDiscarder = discarderPid;
  return localPromptNextBuyer();
}
function localPromptNextBuyer() {
  var st = app.state, T = st.table;
  if (!app._buyQueue || !app._buyQueue.length || T.turnStep !== "draw" || !T.lastDiscarderPid) {
    app._buyQueue = null; hideBuyUI(); return false;
  }
  var pid = app._buyQueue[0], p = playerById(pid);
  if (!p) { app._buyQueue.shift(); return localPromptNextBuyer(); }
  if (p.isBot) {
    if (E.botWantsBuy(st, pid, app._buyCard)) {
      var r = E.applyMove(st, pid, { t: "buy", card: app._buyCard });
      app._buyQueue = null; hideBuyUI(); app.lastDrawn = null;
      if (r.ok) toast(p.name + " bought " + E.cardName(r.bought) + " +1 💰");
      renderTable(); continueAfterBuyRound(true);
    } else { app._buyQueue.shift(); return localPromptNextBuyer(); }
    return true;
  }
  var dn = playerById(app._buyDiscarder);
  $("buy-who").textContent = "💰 " + p.name + " — buy?";
  $("buy-text").innerHTML = "<b>" + esc(dn ? dn.name : "someone") + "</b>" +
    " tossed " + E.cardName(app._buyCard) + ".<br>Buy it + 1 penalty card?" +
    ' <span class="mut">💰 ' + (T.buysLeft[pid] || 0) + " left</span>";
  $("buy-card").innerHTML = cardHTML(app._buyCard);
  $("buybox").classList.remove("hidden");
  app._buyPeekPid = pid; // whose hand the peek button reveals
  renderTable(); // hand behind the prompt flips face-down
  return true;
}
function hideBuyUI() { $("buybox").classList.add("hidden"); $("peekov").classList.add("hidden"); app._buyPeekPid = null; }

/* ---------- buy history + winner screen ---------- */
function renderHistory() {
  var T = app.state.table, el = $("history-list");
  if (!el) return;
  el.innerHTML = "";
  var evs = ((T && T.events) || []).slice().reverse();
  if (!evs.length) {
    el.innerHTML = '<div class="hist-ev"><span class="mut">Nothing yet — tosses and buys will show up here.</span></div>';
    return;
  }
  evs.forEach(function (e) {
    var p = playerById(e.who), nm = esc(p ? p.name : "Someone");
    var d = document.createElement("div");
    d.className = "hist-ev";
    if (e.k === "buy") {
      d.innerHTML = "🎯 <b>" + nm + "</b> bought " + esc(E.cardName(e.card)) + " +1" +
        ' <span class="mut">💰' + (e.left || 0) + " left</span>";
    } else if (e.k === "liverpool") {
      d.innerHTML = "🌊 <b>" + nm + "</b> called <b>LIVERPOOL</b> on " + esc(E.cardName(e.card)) +
        " — shed " + esc(E.cardName(e.shed));
    } else if (e.k === "liverpoolFail") {
      d.innerHTML = "🌊😅 <b>" + nm + "</b> flubbed a Liverpool call on " + esc(E.cardName(e.card));
    } else {
      d.innerHTML = "🃏 <b>" + nm + "</b> tossed " + esc(E.cardName(e.card));
    }
    el.appendChild(d);
  });
}
function showBuyWon(buyerPid, card, penalty) {
  var T = app.state.table;
  $("buywon-title").textContent = "You bought the " + E.cardName(card) + "!";
  var fc = $("buywon-cards"); fc.innerHTML = "";
  [[card, "BOUGHT"], [penalty, "PENALTY +1"]].forEach(function (pair) {
    if (!pair[0]) return;
    var w = document.createElement("div");
    w.className = "bw-card";
    w.innerHTML = cardHTML(pair[0]) + '<div class="bw-tag">' + pair[1] + "</div>";
    fc.appendChild(w);
  });
  $("buywon-left").textContent = "💰 " + ((T.buysLeft && T.buysLeft[buyerPid]) || 0) + " buys left";
  app._buyWon = { pid: buyerPid, card: card, penalty: penalty };
  refreshBuyWonHand();
  $("buywon").classList.remove("hidden");
  clearTimeout(app._buyWonTimer); app._buyWonTimer = null;
  if (app.mode === "online") {
    // don't stall the room if the buyer walks away from their phone
    app._buyWonTimer = setTimeout(hideBuyWon, 10000);
  }
}
function refreshBuyWonHand() {
  var bw = app._buyWon; if (!bw) return;
  var hand = (app.state.hands && app.state.hands[bw.pid]) || [];
  var hd = $("buywon-hand"); hd.innerHTML = "";
  sortedHand(hand).forEach(function (cid) {
    var w = document.createElement("div");
    w.innerHTML = cardHTML(cid); // full-size, like the main hand
    var el = w.firstChild;
    if (cid === bw.card || cid === bw.penalty) el.classList.add("newcard");
    hd.appendChild(el);
  });
}
function hideBuyWon() {
  clearTimeout(app._buyWonTimer); app._buyWonTimer = null;
  app._buyWon = null;
  if ($("buywon").classList.contains("hidden")) return;
  $("buywon").classList.add("hidden");
  var f = app._buyWonContinue; app._buyWonContinue = null;
  if (f) f();
}
function answerBuy(yes) {
  hideBuyUI();
  if (net.active) {
    // online: the server runs the buy round; we just send our answer
    netSend({ t: "buy", what: yes ? "buy" : "pass" });
    renderTable();
    return;
  }
  if (yes) {
    var pid = app._buyQueue && app._buyQueue[0];
    var r = pid ? E.applyMove(app.state, pid, { t: "buy", card: app._buyCard }) : { ok: false };
    app._buyQueue = null; app.lastDrawn = null;
    if (r.ok) {
      var p = playerById(pid);
      if (p && !p.isBot) {
        // winner confirmation first; the game continues when they tap Got it
        app._buyWonContinue = function () { renderTable(); continueAfterBuyRound(true); };
        showBuyWon(pid, r.bought, r.penalty);
      } else {
        toast((p ? p.name : "Someone") + " bought " + E.cardName(r.bought) + " +1 💰");
        renderTable(); continueAfterBuyRound(true);
      }
    } else {
      // someone beat them to it (or the window closed): the history has the story
      toast("Too slow — it's gone. Check 📜 history.");
      renderTable(); continueAfterBuyRound(true);
    }
  } else {
    if (app._buyQueue) app._buyQueue.shift();
    if (!localPromptNextBuyer()) { renderTable(); continueAfterBuyRound(true); }
  }
}
$("buy-yes").addEventListener("click", function () { answerBuy(true); });
$("buy-no").addEventListener("click", function () { answerBuy(false); });
function renderPeek() {
  var pid = app._buyPeekPid;
  if (!pid || !app.state || !app.state.hands) return;
  var hd = $("peek-hand"); hd.innerHTML = "";
  sortedHand(app.state.hands[pid] || []).forEach(function (cid) {
    var w = document.createElement("div"); w.innerHTML = cardHTML(cid);
    hd.appendChild(w.firstChild);
  });
  $("peek-sort").textContent = "🔀 Sort: " + (app.sortSuit ? "suit" : "#");
}
$("buy-peek").addEventListener("click", function () {
  if (!app._buyPeekPid) return;
  renderPeek();
  $("peekov").classList.remove("hidden");
});
$("peek-sort").addEventListener("click", function (e) {
  if (e && e.stopPropagation) e.stopPropagation(); // the overlay hides on any tap; the button must not
  app.sortSuit = !app.sortSuit;
  renderPeek();
});
$("peekov").addEventListener("click", function () { $("peekov").classList.add("hidden"); });
/* discard confirmation: double-tap a card, then confirm */
function askDiscard(cid) {
  app._pendingDiscard = cid;
  var w = document.createElement("div"); w.innerHTML = cardHTML(cid);
  var cc = $("confirm-card"); cc.innerHTML = ""; cc.appendChild(w.firstChild);
  $("confirm-text").textContent = "Discard the " + E.cardName(cid) + "?";
  $("confirmbox").classList.remove("hidden");
}
$("confirm-yes").addEventListener("click", function () {
  var cid = app._pendingDiscard;
  $("confirmbox").classList.add("hidden"); app._pendingDiscard = null;
  if (!cid) return;
  app.sel = {};
  doMove({ t: "discard", card: cid });
});
$("confirm-no").addEventListener("click", function () {
  var cid = app._pendingDiscard;
  $("confirmbox").classList.add("hidden"); app._pendingDiscard = null;
  if (cid) { app.sel = {}; app.sel[cid] = 1; } // keep it selected, carry on building sets
  renderTable();
});
$("hud-history").addEventListener("click", function () { $("history-panel").classList.toggle("hidden"); });
$("buywon-ok").addEventListener("click", hideBuyWon);

function runBotsLocal() {
  var T = app.state.table;
  if (T.phase !== "play") return;
  var p = playerById(T.turnPid);
  if (!p || !p.isBot) return;
  clearTimeout(app._botT);
  app._botT = setTimeout(function () {
    var mv = E.botNextMove(app.state, p.pid);
    if (!mv) return;
    var wasDiscard = mv.t === "discard";
    var r = E.applyMove(app.state, p.pid, mv);
    if (!r.ok) return;
    if (app.state.table.phase === "dealEnd") { endDealLocal(); return; }
    if (wasDiscard) {
      renderTable();
      // chain: buy round, then keep botting or pass the phone
      if (app.state.table.phase === "play" && startBuyRound(p.pid, mv.card)) return;
      var T2 = app.state.table, nx = playerById(T2.turnPid);
      if (needHandoff() && nx && !nx.isBot) { showInterstitial(nx.pid); return; }
    }
    renderTable();
    runBotsLocal();
  }, 900);
}

function endDealLocal() {
  var st = app.state, T = st.table;
  var pts = E.scoreDeal(st);
  T.dealPoints = pts;
  T.lastHands = {};
  Object.keys(st.hands).forEach(function (pid) { T.lastHands[pid] = st.hands[pid].slice(); });
  Object.keys(pts).forEach(function (pid) { T.scores[pid] += pts[pid]; });
  renderScore(false);
}
$("btn-next-deal").addEventListener("click", function () {
  if (app.mode === "online") { netNextDeal(); return; }
  var T = app.state.table;
  if (T.dealNum >= T.dealsTotal) { renderFinal(); return; }
  app.state = E.createDeal(app.state.players, T.dealNum + 1, T.dealsTotal, T.scores, Math.random);
  app.sel = {};
  if (needHandoff()) {
    var np = playerById(app.state.table.turnPid);
    if (np && np.isBot) { show("screen-table"); renderTable(); runBotsLocal(); } // new deal can open on a bot
    else showInterstitial(app.state.table.turnPid);
  }
  else { show("screen-table"); renderTable(); runBotsLocal(); }
});

/* ---------- shared table renderer ---------- */
function sortedHand(hand) {
  var h = hand.slice();
  h.sort(function (a, b) {
    if (E.isWild(a) !== E.isWild(b)) return E.isWild(a) ? 1 : -1;
    if (app.sortSuit) {
      var sa = E.suitOf(a), sb = E.suitOf(b);
      if (sa !== sb) return sa < sb ? -1 : 1;
    }
    var va = E.rankVal(E.rankOf(a), true), vb = E.rankVal(E.rankOf(b), true);
    if (va !== vb) return va - vb;
    return E.suitOf(a) < E.suitOf(b) ? -1 : 1;
  });
  return h;
}
function handCount(pid) {
  if (app.mode === "online" && app.state.table.counts) return app.state.table.counts[pid] || 0;
  return (app.state.hands[pid] || []).length;
}

/* Defensive normalizer: a table snapshot should always carry melds/down /
   downTurn / events / dealPoints / stock / discard, but an older or damaged
   snapshot might not. Normalize at the state entry point so render + engine
   code never crashes on a missing key. */
/* Stock count for display. Local engine state carries the real stock array;
   server snapshots carry only stockCount (the stock order is secret). */
function stockN(T) {
  if (!T) return 0;
  if (typeof T.stockCount === "number") return T.stockCount;
  return T.stock ? T.stock.length : 0;
}
function normTable(T) {  if (!T) return T;
  if (!Array.isArray(T.melds)) T.melds = [];
  if (!T.down || typeof T.down !== "object") T.down = {};
  if (!T.downTurn || typeof T.downTurn !== "object") T.downTurn = {};
  if (!Array.isArray(T.events)) T.events = [];
  if (!T.dealPoints || typeof T.dealPoints !== "object") T.dealPoints = {};
  if (!Array.isArray(T.stock)) T.stock = [];
  if (!Array.isArray(T.discard)) T.discard = [];
  return T;
}

function renderTable() {
  clearInterval(app._cdTimer); app._cdTimer = null; // rebuilt below if the turn clock is live
  var st = app.state;
  if (!st || !st.table) return; // not seated at a table yet (lobby) — nothing to paint
  var T = normTable(st.table);
  /* newly drawn card highlight lives only for the current turn+deal */
  var hlKey = T.turnPid + ":" + T.dealNum;
  if (app._hlKey !== hlKey) { app._hlKey = hlKey; app.lastDrawn = null; }
  // default sort follows the contract: any runs -> by suit, sets-only -> by number
  if (app._sortDeal !== T.dealNum) { app._sortDeal = T.dealNum; app.sortSuit = E.contractFor(T.dealNum).runs > 0; }
  var me = playerById(app.myPid) || st.players[0];
  // the players snapshot can lag the table snapshot when joining (or after a
  // kick); bail quietly instead of throwing — the players listener re-renders
  if (!me) { $("turn-note").textContent = "Joining table…"; return; }
  var myPid = me.pid;
  var myHand = st.hands[myPid] || [];
  var myTurn = T.turnPid === myPid && T.phase === "play";

  /* native haptic: buzz once when the turn passes to you (no-op on web) */
  if (myTurn && !app._hapMyTurn) hap("impact", "medium");
  app._hapMyTurn = myTurn;

  /* contract banner */
  var need = E.needsLeft(st, myPid);
  var mine = E.meldsOf(st, myPid), ms = 0, mr = 0;
  mine.forEach(function (m) { if (m.type === "set") ms++; else mr++; });
  var c = E.contractFor(T.dealNum);
  var prog = [];
  if (c.sets) prog.push(ms + "/" + c.sets + " sets");
  if (c.runs) prog.push(mr + "/" + c.runs + " runs");
  var needTxt = (need.sets + need.runs) === 0 ? '<span class="done">DOWN ✓ — lay off freely</span>'
    : "need " + [need.sets ? need.sets + " set" + (need.sets > 1 ? "s" : "") : null,
                 need.runs ? need.runs + " run" + (need.runs > 1 ? "s" : "") : null].filter(Boolean).join(" + ");
  $("contract-bar").innerHTML = "<b>DEAL " + T.dealNum + "/" + T.dealsTotal + "</b> · contract: " +
    esc(E.contractText(T.dealNum)) + "<br>You: " + prog.join(" · ") + " — " + needTxt;

  /* buy HUD: your remaining buys, always visible */
  $("hud-buys").textContent = "💰 " + ((T.buysLeft && T.buysLeft[myPid]) || 0);
  renderHistory();
  /* keep the winner screen's hand strip fresh while it's open */
  if (!$("buywon").classList.contains("hidden")) refreshBuyWonHand();

  /* opponents */
  var orow = $("opp-row"); orow.innerHTML = "";
  st.players.forEach(function (p) {
    if (p.pid === myPid) return;
    var d = document.createElement("div");
    d.className = "opp" + (T.turnPid === p.pid ? " me" : "");
    d.innerHTML = '<div class="on">' + esc(p.name) + "</div>" +
      '<div class="oc">🂠 ×' + handCount(p.pid) + "</div>" +
      (T.down[p.pid] ? '<div class="dn">DOWN ✓</div>' : "") +
      (T.turnPid === p.pid ? '<div class="turn">▶ turn</div>' : "") +
      '<div class="buysline">💰 ' + ((T.buysLeft && T.buysLeft[p.pid]) || 0) + " buys left</div>";
    d.addEventListener("click", function () { d.classList.toggle("open"); });
    orow.appendChild(d);
  });

  /* melds grouped by owner */
  var ma = $("meld-area"); ma.innerHTML = "";
  var byOwner = {};
  T.melds.forEach(function (m) { (byOwner[m.owner] = byOwner[m.owner] || []).push(m); });
  st.players.forEach(function (p) {
    var ms2 = byOwner[p.pid]; if (!ms2 || !ms2.length) return;
    var g = document.createElement("div"); g.className = "meld-group";
    g.innerHTML = '<div class="meld-owner">' + esc(p.name).toUpperCase() + (T.down[p.pid] ? " ✓" : "") + "</div>";
    ms2.forEach(function (m) {
      var md = document.createElement("div"); md.className = "meld"; md.dataset.meldId = m.id;
      md.innerHTML = E.meldDisplayOrder(m).map(function (cid) { return meldCardHTML(cid, m); }).join("");
      // per-card taps: tapping a wild in the meld tries to steal it; tapping
      // any meld card with a hand card selected lays it off
      if (myTurn && T.phase === "play") {
        Array.prototype.forEach.call(md.querySelectorAll("[data-card]"), function (elm) {
          elm.addEventListener("click", function () { onMeldTap(m.id, elm.dataset.card); });
        });
      }
      g.appendChild(md);
    });
    ma.appendChild(g);
  });

  /* piles */
  $("stock-n").textContent = stockN(T) + " left";
  var dt = $("discard-top"); dt.innerHTML = "";
  var top = T.discard[T.discard.length - 1];
  if (top) dt.innerHTML = cardHTML(top);
  else dt.innerHTML = '<div class="card back"><span>–</span></div>';
  /* piles — tap to select, tap again to draw (double-tap friendly) */
  if (!(myTurn && T.turnStep === "draw")) app.pileSel = null;
  $("stock-pile").onclick = function () { if (myTurn && T.turnStep === "draw") confirmDraw("stock"); };
  $("discard-pile").onclick = function () {
    if (myTurn && T.turnStep === "draw") { confirmDraw("discard"); return; }
    // play step: tap a card, then tap the discard pile -> confirm the toss
    if (myTurn && T.turnStep === "play") {
      var sc = Object.keys(app.sel);
      if (sc.length === 1) askDiscard(sc[0]);
    }
  };
  $("stock-pile").classList.toggle("drawsel", app.pileSel === "stock");
  $("discard-pile").classList.toggle("drawsel", app.pileSel === "discard");
  // subtle "draw now" signal: both piles glow on your draw step
  var drawGlow = myTurn && T.phase === "play" && T.turnStep === "draw";
  $("stock-pile").classList.toggle("pile-glow", drawGlow);
  $("discard-pile").classList.toggle("pile-glow", drawGlow);

  /* turn note */
  var tp = playerById(T.turnPid);
  var note = "";
  if (T.phase !== "play") note = "";
  else if (myTurn) note = (T.turnStep === "draw" ? "Your turn — tap a pile twice to draw 👆" : "Your turn — meld, lay off, then discard") +
    " · 💰" + ((T.buysLeft && T.buysLeft[myPid]) || 0);
  else note = esc(tp ? tp.name : "") + "'s turn…";
  $("turn-note").textContent = note;
  // turn clock pill: visible during online play on EVERY turn (yours too),
  // ticking live down from 90 so the auto-play deadline never blindsides you
  if (app.mode === "online" && T.phase === "play" && T.turnDeadline) {
    (function (cddl) {
      var pill = document.createElement("span");
      pill.id = "turn-clock";
      pill.style.cssText = "display:inline-block;margin-left:10px;padding:3px 12px;border-radius:999px;" +
        "background:#fef3c7;color:#92400e;font-weight:800;font-size:14px;font-variant-numeric:tabular-nums;" +
        "border:1px solid #fcd34d;vertical-align:1px;white-space:nowrap";
      var paint = function () {
        pill.textContent = "\u23f1 " + Math.max(0, Math.round((cddl - Date.now()) / 1000)) + "s";
      };
      paint();
      $("turn-note").appendChild(pill);
      app._cdTimer = setInterval(function () {
        if (!$("screen-table").classList.contains("active")) return;
        paint();
      }, 1000);
    })(T.turnDeadline);
  }

  /* hand — stacked fan; every card shows its rank+suit corner */
  var hd = $("hand"); hd.innerHTML = "";
  hd.className = myHand.length > 10 ? "count-many" : "";
  hd.id = "hand";
  // subtle "act now" signal: the hand glows once you've drawn (discard/meld/lay off)
  hd.classList.toggle("hand-glow", myTurn && T.phase === "play" && T.turnStep === "play");
  /* while the buy prompt is up, the hand behind it stays face-down —
     the phone may be in the discarder's hands while someone else decides */
  var buyOpen = !$("buybox").classList.contains("hidden");
  var sh = sortedHand(myHand);
  sh.forEach(function (cid) {
    var w = document.createElement("div");
    if (buyOpen) {
      w.innerHTML = '<div class="card back"><span>🃏</span></div>';
    } else {
      w.innerHTML = cardHTML(cid);
    }
    var el = w.firstChild;
    if (!buyOpen) {
      if (app.sel[cid]) el.classList.add("sel");
      if (cid === app.lastDrawn) el.classList.add("newcard");
    }
    hd.appendChild(el);
  });
  // Container-level tap targeting: cards overlap (negative margins), so a tap
  // on an overlapped region must hit the topmost card at that x-coordinate,
  // not whichever card div the browser's hit-testing prefers. The last (rightmost)
  // card whose rect contains the tap x wins.
  if (!buyOpen) {
    hd.onclick = function (ev) {
      ev = ev || {};
      var cards = hd.querySelectorAll(".card");
      // fallback (no layout / synthetic event): use the event target's card
      if (typeof ev.clientX !== "number" || !cards.length || !cards[0].getBoundingClientRect) {
        var t = ev.target;
        while (t && t !== hd) {
          if (t.dataset && t.dataset.card) { onCardTap(t.dataset.card); return; }
          t = t.parentNode;
        }
        return;
      }
      var x = ev.clientX, picked = null, i, r;
      for (i = 0; i < cards.length; i++) {
        r = cards[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right) picked = cards[i];
      }
      if (picked && picked.dataset.card) onCardTap(picked.dataset.card);
    };
  } else {
    hd.onclick = null;
  }

  renderActionBar(st, me, myTurn);
}

/* tap a pile once to select it, again to confirm the draw */
function confirmDraw(which) {
  var mv = which === "stock" ? { t: "drawStock" } : { t: "drawDiscard" };
  if (app.pileSel === which) { app.pileSel = null; doMove(mv); }
  else { app.pileSel = which; renderTable(); }
}

/* native haptics: forwarded to the app wrapper when present, no-op on web (see js/haptics.js) */
function hap(kind, arg) {
  try {
    var h = window.BoyGames && window.BoyGames.haptics;
    if (h && typeof h[kind] === "function") h[kind](arg);
  } catch (e) {}
}

function onCardTap(cid) {
  var st = app.state, T = st.table, myPid = app.myPid;
  if (T.phase !== "play") return;
  var mine = T.turnPid === myPid;
  // double-tap shortcuts only fire on your turn; selection itself works anytime
  // so you can plan melds while others play — picks survive draws and buys.
  var now = Date.now(), keys = Object.keys(app.sel);
  if (mine && app._lastTapCid === cid && now - app._lastTapT < 450 && T.turnStep === "draw") {
    app._lastTapCid = null;
    drawFirstNudge();
    return;
  }
  if (mine && app._lastTapCid === cid && now - app._lastTapT < 450 && T.turnStep === "play" &&
      keys.length === 1 && keys[0] === cid) {
    app._lastTapCid = null;
    askDiscard(cid);
    return;
  }
  app._lastTapCid = cid; app._lastTapT = now;
  hap("impact", "light"); /* card selected/deselected */
  if (app.sel[cid]) delete app.sel[cid]; else app.sel[cid] = 1;
  renderTable();
}
/* trying to play before drawing: shake both piles + say so */
function drawFirstNudge() {
  ["stock-pile", "discard-pile"].forEach(function (id) {
    var el = $(id);
    el.classList.remove("shake");
    void el.offsetWidth; // restart the animation if it's already shaking
    el.classList.add("shake");
  });
  toast("Draw first! 👆");
  setTimeout(function () {
    $("stock-pile").classList.remove("shake");
    $("discard-pile").classList.remove("shake");
  }, 500);
}
function onMeldTap(meldId, cardId) {
  var st = app.state, T = st.table, myPid = app.myPid;
  if (T.turnPid !== myPid || T.phase !== "play") return;
  if (T.turnStep !== "play") { drawFirstNudge(); return; } // tapped a meld before drawing
  var meld = null;
  st.table.melds.forEach(function (m) { if (m.id === meldId) meld = m; });
  if (!meld) return;
  var selCards = Object.keys(app.sel);
  /* tap a wild sitting in a meld with nothing selected = steal it. No mode
     button: if the natural's in your hand, that's obviously what you want. */
  if (!selCards.length && cardId && E.isWild(cardId) && (meld.jokers || {})[cardId]) {
    if (!T.down[myPid]) { toast("Go down first"); return; }
    if (T.downTurn[myPid] === T.turnNo) { toast("Stealing opens on your next turn — not the turn you go down"); return; }
    var asg = meld.jokers[cardId];
    var hand = st.hands[myPid] || [], match = null;
    for (var i = 0; i < hand.length; i++) {
      var cc = hand[i];
      if (E.isWild(cc)) continue;
      if (E.rankOf(cc) === asg.rank && (!asg.suit || E.suitOf(cc) === asg.suit)) { match = cc; break; }
    }
    if (!match) {
      toast("That wild plays as the " + asg.rank + (asg.suit ? GLYPH[asg.suit] : "") +
        " — you don't hold it");
      return;
    }
    doMove({ t: "steal", meldId: meldId, jokerId: cardId, card: match });
    // belt-and-suspenders: force the meld DOM to refresh from state, in case
    // the full re-render leaves a stale node behind. Replace the node entirely.
    try {
      var fresh = null;
      app.state.table.melds.forEach(function (mm) { if (mm.id === meldId) fresh = mm; });
      if (fresh) {
        var html = E.meldDisplayOrder(fresh).map(function (cid) { return meldCardHTML(cid, fresh); }).join("");
        var els = document.querySelectorAll('[data-meld-id="' + meldId + '"]');
        for (var ei = 0; ei < els.length; ei++) {
          var oldEl = els[ei];
          var newEl = document.createElement("div");
          newEl.className = "meld";
          newEl.setAttribute("data-meld-id", meldId);
          newEl.innerHTML = html;
          // re-attach tap handlers
          (function (mid) {
            Array.prototype.forEach.call(newEl.querySelectorAll("[data-card]"), function (elm) {
              elm.addEventListener("click", function () { onMeldTap(mid, elm.dataset.card); });
            });
          })(meldId);
          if (oldEl.parentNode) oldEl.parentNode.replaceChild(newEl, oldEl);
        }
      }
    } catch (e) { if (window.console) console.log("steal DOM fix failed: " + e.message); }
    return;
  }
  /* direct lay-off: tap one card in your hand, then tap a meld — no mode button.
     Only once you're down, and only from your NEXT turn on (the engine enforces it too). */
  if (!T.down[myPid]) return;
  if (T.downTurn[myPid] === T.turnNo) { toast("Lay-offs open on your next turn — not the turn you go down"); return; }
  if (selCards.length === 1) {
    var cid = selCards[0];
    // wild onto a run with several open spots: pick the spot first
    if (E.isWild(cid) && meld.type === "run") {
      var opts = E.layOffWildOptions(meld, cid);
      if (opts.length > 1) {
        app._wildOnPick = function (pick) { if (pick) doLayOff(cid, meldId, pick.jokers); };
        askWildSpot(meld.cards.concat([cid]), opts);
        return;
      }
    }
    app.sel = {};
    doMove({ t: "layOff", card: cid, meldId: meldId });
  } else if (selCards.length > 1) {
    toast("Lay off one card at a time — select a single card, then tap a meld");
  }
}
function doLayOff(cid, meldId, jokers) {
  app.sel = {};
  var mv = { t: "layOff", card: cid, meldId: meldId };
  if (jokers) mv.jokers = jokers;
  doMove(mv);
}

function canGoOut7(hand) {
  var combos = E.findMeldCombos(hand, 0, 3);
  return combos.some(function (cb) {
    var n = 0, allRuns = true, i;
    for (i = 0; i < cb.length; i++) { n += cb[i].cards.length; if (cb[i].type !== "run") allRuns = false; }
    return allRuns && n === hand.length && cb.length === 3;
  });
}

function renderActionBar(st, me, myTurn) {
  var bar = $("action-bar"); bar.innerHTML = "";
  var T = st.table, myPid = me.pid;
  function btn(txt, fn, cls) {
    var b = document.createElement("button");
    b.className = "btn " + (cls || ""); b.innerHTML = txt;
    b.addEventListener("click", fn); bar.appendChild(b); return b;
  }
  function hint(t) {
    var d = document.createElement("div"); d.className = "ab-hint"; d.textContent = t; bar.appendChild(d);
  }
  if (!myTurn || T.phase !== "play") {
    if (app.mode === "online" && T.phase === "play" && app.movePending) hint("Waiting for host…");
    if (T.phase === "play") {
      // Liverpool: the top discard (or buy card) fits a table meld and wasn't
      // yours — call it any time it's on top, shed a card out of turn
      var lt = liverpoolTarget(), cd = liverpoolCooldownLeft();
      var lb = btn(cd > 0 ? "🌊 " + cd + "s" : "🌊 Liverpool", function () { startLiverpool(); });
      if (!lt || cd > 0) lb.disabled = true;
      btn("ⓘ", function () { showLiverpoolInfo(); }, "ghost");
    }
    btn("🔀 Sort: " + (app.sortSuit ? "suit" : "#"), function () { app.sortSuit = !app.sortSuit; renderTable(); }, "ghost");
    return;
  }
  if (T.turnStep === "draw") {
    if (T.dealNum === 7 && canGoOut7(st.hands[myPid] || []))
      btn("🏆 Go out — all 3 runs!", function () { doMove({ t: "goOut7" }); }, "primary");
    btn(app.pileSel === "stock" ? "📥 Tap again — draw stock (" + stockN(T) + ")" : "📥 Stock (" + stockN(T) + ")",
      function () { confirmDraw("stock"); }, "primary");
    var top = T.discard[T.discard.length - 1];
    if (top) btn(app.pileSel === "discard" ? "🗑 Tap again — take " + E.cardName(top) : "🗑 Take " + E.cardName(top),
      function () { confirmDraw("discard"); });
    btn("🔀 Sort: " + (app.sortSuit ? "suit" : "#"), function () { app.sortSuit = !app.sortSuit; renderTable(); }, "ghost");
    if (!app.pileSel) hint("Tap a pile, then tap it again to draw 👆");
    else hint(app.pileSel === "stock" ? "Tap the stock again to draw" : "Tap the discard pile again to take " + E.cardName(top));
  } else {
    var selCards = Object.keys(app.sel);
    var down = !!T.down[myPid];
    if (!down) {
      var b = btn("⬇ Lay down" + (selCards.length ? " (" + selCards.length + ")" : ""), function () {
        var need = E.needsLeft(st, myPid);
        var found = E.findMeldCombos(selCards, need.sets, need.runs);
        if (!found.length) { toast("Those cards don't meet the contract (" + E.contractText(T.dealNum) + ")"); return; }
        var combo = found[0];
        // a wild in a run can fit several spots: ask per ambiguous meld, then send
        var ambig = [];
        combo.forEach(function (m, ix) {
          if (m.type === "run" && m.cards.some(function (c) { return E.isWild(c); })) {
            var opts = E.runWildOptions(m.cards);
            if (opts.length > 1) ambig.push({ ix: ix, cards: m.cards, opts: opts });
          }
        });
        var send = function (jokersByIx) {
          doMove({ t: "layDown", melds: combo.map(function (m, ix) {
            var mm = { type: m.type, cards: m.cards };
            if (jokersByIx[ix]) mm.jokers = jokersByIx[ix];
            return mm;
          }) });
        };
        if (!ambig.length) { send({}); return; }
        var jokersByIx = {};
        (function next(i) {
          if (i >= ambig.length) { send(jokersByIx); return; }
          var a = ambig[i];
          app._wildOnPick = function (pick) {
            if (!pick) return; // cancelled: don't send a half-chosen lay-down
            jokersByIx[a.ix] = pick.jokers;
            next(i + 1);
          };
          askWildSpot(a.cards, a.opts);
        })(0);
      }, "primary");
      if (!selCards.length) b.disabled = true;
      hint("Select cards, then lay down (" + E.contractText(T.dealNum) + ") · tap a card, then the discard pile — or double-tap it — to toss it");
    } else {
      // stealing needs no button: tap a 🃏/wild in a meld and, if you hold the
      // natural it stands for, it swaps automatically
      if (T.downTurn[myPid] === T.turnNo) hint("You went down this turn — lay-offs open on your next turn");
      else hint("Tap one card, then tap a meld to lay it off · tap a 🃏 in a meld to steal it · or tap a card, then the discard pile, to toss it");
    }
    var db = btn("🗑 Discard" + (selCards.length === 1 ? " " + E.cardName(selCards[0]) : ""), function () {
      if (selCards.length !== 1) { toast("Select exactly one card to discard"); return; }
      app.sel = {};
      doMove({ t: "discard", card: selCards[0] });
    }, "primary");
    if (selCards.length !== 1) db.disabled = true;
    btn("🔀 Sort: " + (app.sortSuit ? "suit" : "#"), function () { app.sortSuit = !app.sortSuit; renderTable(); }, "ghost");
  }
}

/* route a player move: local applies via the engine, online sends to the server */
function reconcileOptimisticHand(h) {
  var oc = app._optimisticDiscard;
  if (!oc) return h;
  if (h.indexOf(oc) < 0) { app._optimisticDiscard = null; return h; } // server applied it
  return h.filter(function (c) { return c !== oc; }); // server hasn't confirmed yet — keep it out
}
function doMove(move) {
  app.pileSel = null;
  var isDraw = move.t === "drawStock" || move.t === "drawDiscard";
  /* native haptic for the player's own moves (bots apply via E.applyMove, never here) */
  (function () {
    var t = move.t;
    if (t === "discard" || t === "layDown") hap("impact", "medium");
    else if (t === "goOut7") hap("notification", "success");
    else hap("impact", "light"); /* draws, lay-offs, steals, buys */
  })();
  if (app.mode === "online" && net.active) {
    if (!net.connected) { toast("Reconnecting\u2026 try again in a sec"); return; }
    if (app.movePending) { toast("Waiting for the server\u2026"); return; }
    app.movePending = true;
    if (isDraw) app._drawSentHand = (app.state.hands[app.myPid] || []).slice();
    else { app.lastDrawn = null; app._drawSentHand = null; }
    if (move.t === "discard" && move.card) {
      // Optimistic: the tossed card leaves the visible hand the moment Yes is
      // tapped, even if the server takes a moment to confirm. The next state
      // broadcast reconciles it; a nak puts it back.
      var oh = app.state.hands[net.pid] || [];
      var oi = oh.indexOf(move.card);
      if (oi >= 0) { oh.splice(oi, 1); app._optimisticDiscard = move.card; }
    }
    if (!netSend({ t: "move", move: move })) {
      // the socket died between render and tap: undo everything so the card
      // returns and the UI never strands on "Waiting for the server..."
      app.movePending = false;
      if (app._optimisticDiscard) {
        (app.state.hands[net.pid] = app.state.hands[net.pid] || []).push(app._optimisticDiscard);
        app._optimisticDiscard = null;
      }
      toast("Couldn't send that move \u2014 try again");
      renderTable();
      return;
    }
    renderTable();
    // Safety: if the socket silently died (iOS backgrounding), recycle it so
    // we re-sync instead of waiting on a dead connection forever.
    setTimeout(function () {
      if (app.movePending && net.active && !net.connected) netRecycle();
    }, 4000);
    return;
  }
  var st = app.state;
  var pid = app.myPid;
  var before = isDraw ? (st.hands[pid] || []).slice() : null;
  var r = E.applyMove(st, pid, move);
  if (!r.ok) { toast("Can't do that: " + r.error); return; }
  if (isDraw) {
    var after = st.hands[pid] || [], drawn = null, i;
    for (i = 0; i < after.length; i++) if (before.indexOf(after[i]) < 0) { drawn = after[i]; break; }
    app.lastDrawn = drawn;
  } else app.lastDrawn = null;
  afterLocalMove(pid, move);
}

/* wild placement picker: the wild fits several spots in the run — each option
   renders the run in order with the wild where it would sit. The picker's
   continuation lives in app._wildOnPick (set by the caller). */
function askWildSpot(cards, opts) {
  var ov = $("wildov"), box = $("wild-opts");
  box.innerHTML = "";
  opts.forEach(function (o) {
    var b = document.createElement("button");
    b.className = "wild-opt";
    var order = E.orderRunCards(cards, o.jokers, o.aceHigh);
    b.innerHTML = order.map(function (cid) { return meldCardHTML(cid, { jokers: o.jokers }); }).join("");
    b.addEventListener("click", function () {
      ov.classList.add("hidden");
      var f = app._wildOnPick; app._wildOnPick = null;
      if (f) f(o);
    });
    box.appendChild(b);
  });
  ov.classList.remove("hidden");
}
$("wild-cancel").addEventListener("click", function () {
  $("wildov").classList.add("hidden");
  var f = app._wildOnPick; app._wildOnPick = null;
  if (f) f(null);
});

/* ---------- LIVERPOOL ---------- */
// The callable card: top discard (or buy card — same card) that could be played
// onto one of the table's melds, discarded by someone else.
function liverpoolTarget() {
  var st = app.state, T = st && st.table;
  if (!st || !T || T.phase !== "play") return null;
  var top = T.discard[T.discard.length - 1];
  if (!top) return null;
  if (app.mode === "online" && T.lastDiscarderPid === net.pid) return null;
  var meld = null;
  for (var i = 0; i < T.melds.length; i++)
    if (E.canLayOff(T.melds[i], top)) { meld = T.melds[i]; break; }
  if (!meld) return null;
  return { card: top, meld: meld };
}
function liverpoolCooldownLeft() {
  return Math.max(0, Math.ceil(((app._livCooldownUntil || 0) - Date.now()) / 1000));
}
function showLiverpoolInfo() { $("livinfoov").classList.remove("hidden"); }
$("livinfo-ok").addEventListener("click", function () { $("livinfoov").classList.add("hidden"); });

/* shed picker: choose one card from `pid`'s hand to shed for the Liverpool */
function pickShedCard(pid, hand, target, onDone) {
  var ov = $("shedov"), tray = $("shed-tray");
  var owner = playerById(pid), nm = owner ? owner.name : "you";
  $("shed-sub").textContent = "The " + E.cardName(target.card) +
    " fits " + (playerById(target.meld.owner) || {}).name + "'s meld — " +
    "call LIVERPOOL and shed one card on the spot, out of turn. Pick the card" +
    (app.mode === "online" ? ":" : " from " + nm + ":");
  tray.innerHTML = "";
  var picked = null;
  hand.forEach(function (cid) {
    var w = document.createElement("div");
    w.innerHTML = cardHTML(cid);
    var elc = w.firstChild;
    elc.addEventListener("click", function () {
      picked = cid;
      Array.prototype.forEach.call(tray.querySelectorAll(".card"), function (c) {
        c.classList.toggle("shedsel", c.getAttribute("data-card") === cid);
      });
    });
    tray.appendChild(elc);
  });
  $("shed-ok").onclick = function () {
    ov.classList.add("hidden");
    onDone(picked);
  };
  ov.classList.remove("hidden");
}
$("shed-cancel").addEventListener("click", function () { $("shedov").classList.add("hidden"); });

/* who's calling? (pass-and-play: the phone goes to the caller first) */
function pickCaller(onDone) {
  var ov = $("callerov"), box = $("caller-opts");
  var T = app.state.table;
  box.innerHTML = "";
  app.state.players.forEach(function (p) {
    if (p.isBot || p.pid === T.lastDiscarderPid) return;
    var b = document.createElement("button");
    b.className = "wild-opt"; b.textContent = p.name;
    b.addEventListener("click", function () {
      ov.classList.add("hidden");
      onDone(p.pid);
    });
    box.appendChild(b);
  });
  ov.classList.remove("hidden");
}
$("caller-cancel").addEventListener("click", function () { $("callerov").classList.add("hidden"); });

function startLiverpool() {
  if (liverpoolCooldownLeft() > 0) return;
  var lt = liverpoolTarget();
  if (!lt) { toast("Nothing to call right now"); return; }
  if (app.mode === "online") {
    var hand = app.state.hands[net.pid] || [];
    pickShedCard(net.pid, hand, lt, function (shed) {
      if (!shed) return;
      // re-validate: the discard top may have changed while picking a shed
      // card. A stale snapshot is not a bad call — abort with no cooldown.
      var lt2 = liverpoolTarget();
      if (!lt2 || lt2.card !== lt.card) { toast("The discard changed — call is off"); return; }
      app._liverpoolPending = true;
      netSend({ t: "move", move: { t: "liverpool", card: lt2.card, discard: shed } });
      hap("notification", "success");
    });
  } else {
    pickCaller(function (callerPid) {
      if (!callerPid) return;
      var hand = app.state.hands[callerPid] || [];
      pickShedCard(callerPid, hand, lt, function (shed) {
        if (!shed) return;
        var lt2 = liverpoolTarget();
        if (!lt2 || lt2.card !== lt.card) { toast("The discard changed — call is off"); return; }
        var r = E.applyMove(app.state, callerPid, { t: "liverpool", card: lt2.card, discard: shed });
        app.sel = {};
        renderTable();
        if (!r.ok) {
          app._livCooldownUntil = Date.now() + 60000;
          toast("Liverpool flubbed: " + r.error);
          hap("notification", "error");
          renderTable();
        } else {
          hap("notification", "success");
          playLiverpoolAnimation({ card: lt2.card, meldId: lt2.meld.id, who: callerPid, ts: Date.now() });
        }
      });
    });
  }
}

/* the LIVERPOOL moment: splash + the card and the meld it fits light up */
function playLiverpoolAnimation(ev) {
  if (ev && ev.ts) app._lastLivTs = Math.max(app._lastLivTs || 0, ev.ts);
  var ov = $("livov");
  var nm = "", cn = "";
  if (ev) {
    var p = playerById(ev.who);
    nm = p ? p.name : "Someone";
    cn = E.cardName(ev.card);
    var owner = null;
    (app.state.table.melds || []).forEach(function (m) { if (m.id === ev.meldId) owner = m.owner; });
    var onm = owner ? ((playerById(owner) || {}).name || "a") : "a";
    $("liv-sub").textContent = nm + " called it — the " + cn + " fits " + onm + " meld!";
  } else {
    $("liv-sub").textContent = "";
  }
  // restart the pop animation (it fill-forwards to invisible after one run)
  ["liv-text", "liv-sub"].forEach(function (id) {
    var elx = $(id);
    elx.style.animation = "none";
    void elx.offsetWidth;
    elx.style.animation = "";
  });
  ov.classList.remove("hidden");
  // highlight the meld it fits for a few seconds (re-query after render)
  if (ev && ev.meldId) {
    setTimeout(function () {
      var mel = document.querySelector('[data-meld-id="' + ev.meldId + '"]');
      if (mel) {
        mel.classList.add("liv-highlight");
        setTimeout(function () { mel.classList.remove("liv-highlight"); }, 4200);
      }
    }, 60);
  }
  clearTimeout(app._livOvT);
  app._livOvT = setTimeout(function () { ov.classList.add("hidden"); }, 2600);
}

/* ---------- scoreboard + final ---------- */
function renderScore(isOnline) {
  var T = app.state.table;
  $("score-title").textContent = "Deal " + T.dealNum + " scores";
  var rows = $("score-rows"); rows.innerHTML = "";
  var order = app.state.players.slice().sort(function (a, b) { return T.scores[a.pid] - T.scores[b.pid]; });
  var tickers = [];
  order.forEach(function (p, i) {
    var d = document.createElement("div");
    d.className = "srow" + (p.pid === order[0].pid ? " win" : "");
    var target = T.scores[p.pid] || 0;
    var prev = target - (T.dealPoints[p.pid] || 0); // count up from where they were
    d.innerHTML = '<div class="nm">' + esc(p.name) + (p.pid === T.goerPid ? " 🏁" : "") + "</div>" +
      '<div class="dp">+' + (T.dealPoints[p.pid] || 0) + "</div>";
    var tpEl = document.createElement("div");
    tpEl.className = "tp";
    tpEl.textContent = prev;
    d.appendChild(tpEl);
    var lh = (T.lastHands || {})[p.pid] || [];
    if (lh.length) {
      var hs = document.createElement("div");
      hs.className = "srow-hand";
      hs.innerHTML = lh.map(function (cid) { return cardHTML(cid, true); }).join("");
      d.appendChild(hs);
    }
    rows.appendChild(d);
    tickers.push({ el: tpEl, from: prev, target: target, delay: 300 + i * 220 });
  });
  var nx = $("score-next");
  if (T.dealNum < T.dealsTotal) {
    nx.textContent = "Next: Deal " + (T.dealNum + 1) + "/" + T.dealsTotal + " — " +
      E.contractText(T.dealNum + 1);
    nx.classList.remove("hidden");
  } else {
    nx.textContent = "";
    nx.classList.add("hidden");
  }
  $("btn-next-deal").textContent = T.dealNum >= T.dealsTotal ? "See winner 🏆" : "Next deal →";
  if (isOnline) $("btn-next-deal").classList.toggle("hidden", !net.isHost);
  else $("btn-next-deal").classList.remove("hidden");
  show("screen-score");
  /* Between-deals ad moment: frequency-capped, never mid-game. */
  try { var _BG = window.BoyGames; if (_BG && _BG.ads) _BG.ads.maybeInterstitial("between-deals"); } catch (e) {}
  burstConfetti($("score-confetti"), 60); // the round winner (🏁) gets the shower
  var t0 = Date.now(), dur = 750;
  (function tick() {
    var now = Date.now(), done = true, k, sp, t, e;
    for (k = 0; k < tickers.length; k++) {
      sp = tickers[k];
      t = (now - t0 - sp.delay) / dur;
      if (t < 0) { done = false; continue; }
      t = Math.min(1, t);
      e = 1 - Math.pow(1 - t, 3);
      sp.el.textContent = Math.round(sp.from + (sp.target - sp.from) * e);
      if (t < 1) done = false;
    }
    if (!done) setTimeout(tick, 30);
  })();
}
/* shared confetti burst: fills a positioned container, falls, cleans up */
function burstConfetti(container, n) {
  if (!container) return;
  container.innerHTML = "";
  var colors = ["#e8b64c", "#7bc96f", "#e26d5a", "#46e0c8", "#f7f1e3", "#c39bff"];
  for (var i = 0; i < (n || 70); i++) {
    var c = document.createElement("div"); c.className = "confetti";
    c.style.left = (Math.random() * 100) + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (2 + Math.random() * 2.5) + "s";
    c.style.animationDelay = (Math.random() * 1.2) + "s";
    if (Math.random() < 0.4) c.style.borderRadius = "50%";
    container.appendChild(c);
  }
  setTimeout(function () { container.innerHTML = ""; }, 6000);
}
function renderFinal() {
  var T = app.state.table;
  var order = app.state.players.slice().sort(function (a, b) { return T.scores[a.pid] - T.scores[b.pid]; });
  var w = order[0];
  // sealed state: the scores stay hidden until the reveal
  $("final-winner").textContent = "And the winner is…";
  $("final-sub").textContent = T.dealsTotal + " deals · lowest score takes the night";
  var rows = $("final-rows"); rows.innerHTML = "";
  var medals = ["🥇", "🥈", "🥉"];
  order.forEach(function (p, i) {
    var d = document.createElement("div");
    d.className = "srow" + (i === 0 ? " win" : "");
    d.innerHTML = '<div class="nm">' + (medals[i] || (i + 1) + ".") + " " + esc(p.name) + "</div>" +
      '<div class="tp">' + T.scores[p.pid] + " pts</div>";
    rows.appendChild(d);
  });
  rows.classList.add("hidden");
  var btnR = $("btn-reveal"), btnC = $("btn-copy-results"), btnA = $("btn-again");
  btnR.classList.remove("hidden");
  btnC.classList.add("hidden");
  btnA.classList.remove("primary"); // reveal is the one gold CTA until tapped
  var lines = order.map(function (p) { return (p.pid === w.pid ? "🏆 " : "") + p.name + ": " + T.scores[p.pid]; });
  var txt = "🃏 LIVERPOOL RUMMY\n" + lines.join("\n") + "\n" + T.dealsTotal + " deals · lowest score wins. Think you can beat us?\nPlay: https://liverpool-rummy.pages.dev";
  btnC.onclick = function () {
    function done() { toast("Copied 📋"); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
    else done();
  };
  btnR.onclick = function () {
    btnR.classList.add("hidden");
    $("final-winner").textContent = "🏆 " + w.name + " wins!";
    rows.classList.remove("hidden");
    btnC.classList.remove("hidden");
    btnA.classList.add("primary");
    showCelebration(order, T); // confetti + count-up reveal, then "See final scores →"
  };
  show("screen-final");
}

/* win celebration: confetti + every final total ticking up from 0 */
function showCelebration(order, T) {
  $("cel-name").textContent = "🏆 " + order[0].name + " wins!";
  var rows = $("cel-rows"); rows.innerHTML = "";
  var spans = order.map(function (p) {
    var d = document.createElement("div"); d.className = "cel-row";
    var nm = document.createElement("span"); nm.textContent = p.name;
    var tp = document.createElement("span"); tp.className = "tp"; tp.textContent = "0";
    d.appendChild(nm); d.appendChild(tp); rows.appendChild(d);
    return { el: tp, target: T.scores[p.pid] || 0 };
  });
  var cf = $("cel-confetti"); cf.innerHTML = "";
  burstConfetti(cf, 70);
  $("celebrate").classList.remove("hidden");
  var t0 = Date.now(), dur = 1400;
  (function tick() {
    var t = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - t, 3);
    spans.forEach(function (sp) { sp.el.textContent = Math.round(sp.target * e); });
    if (t < 1) setTimeout(tick, 30);
    else spans.forEach(function (sp) { sp.el.textContent = sp.target; });
  })();
}
$("cel-go").addEventListener("click", function () {
  $("celebrate").classList.add("hidden");
  show("screen-final");
});
function leaveToHome() {
  if (app.mode === "online") netLeave();
  show("screen-home");
}
$("btn-again").addEventListener("click", leaveToHome);
$("btn-home2").addEventListener("click", leaveToHome);

/* ================= ONLINE (thin client) ================= */
/* The phone never runs game logic. The Cloudflare Worker's Durable Object is
   the referee: it validates moves, runs turn timers/bots/buy rounds, and
   broadcasts the authoritative state. We render it and send intents. */
function onlineError(msg) {
  var el = $("online-error");
  el.textContent = msg; el.classList.toggle("hidden", !msg);
}

function playerListFrom(players) {
  return Object.keys(players || {}).map(function (id) {
    var p = players[id];
    return { pid: id, name: p.name, isBot: !!p.isBot, seat: p.seat, online: !!p.online };
  }).sort(function (a, b) { return a.seat - b.seat; });
}

/* lobby controls: the creator, or the earliest-seated online human when the
   creator is away (mirrors the server's effectiveCreator). */
function amCreator() {
  var s = net.lastState;
  if (!s || !net.pid) return false;
  if (s.creatorPid === net.pid) return true;
  var cp = s.players[s.creatorPid];
  if (cp && cp.online) return false;
  var best = null;
  Object.keys(s.players).forEach(function (id) {
    var p = s.players[id];
    if (p.isBot || !p.online) return;
    if (best === null || p.seat < s.players[best].seat) best = id;
  });
  return best === net.pid;
}

function netSend(msg) {
  if (!net.ws) return false;
  try {
    if (net.ws.readyState !== 1) return false;
    net.ws.send(JSON.stringify(msg));
    return true;
  } catch (e) { return false; }
}

function netConnect(code, opts) {
  opts = opts || {};
  var url = workerURL();
  netLeave(); // clean slate: closes any old socket, clears timers/state
  /* offline: online rooms can't work — say so clearly instead of hanging on "Connecting…" */
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    openSetup("online");
    onlineError("You're offline — online rooms need a connection. Solo vs bots and pass-and-play work offline.");
    return;
  }
  if (!url) { openSetup("online"); onlineError("Couldn't reach the game server. Check your connection and try again."); return; }
  if (opts.name) setupNames[0] = opts.name; // keep one identity across modes
  net.active = true; net.code = code; net.name = opts.name || "Player";
  net.pid = opts.pid || null; // null: the server assigns us a fresh seat
  net._wasCreate = !!opts.create;
  net._createTries = opts._retries || 0;
  net._reDelay = 1000;
  app.mode = "online"; app.myPid = net.pid;
  show("screen-lobby");
  $("room-code").textContent = code;
  $("lobby-wait").textContent = "Connecting\u2026";
  $("lobby-wait").classList.remove("hidden");
  $("host-controls").classList.add("hidden");
  netOpenSocket();
}

function netOpenSocket() {
  if (!net.active) return;
  var wsUrl = workerURL().replace(/^http/, "ws") + "/room/" + net.code + "/ws";
  var ws;
  try { ws = new WebSocket(wsUrl); } catch (e) { netScheduleReconnect(); return; }
  net.ws = ws;
  ws.onopen = function () {
    if (net.ws !== ws) return;
    net.connected = true;
    net._reDelay = 1000;
    netSend({ t: "hello", name: net.name, pid: net.pid, create: net._wasCreate });
    clearInterval(net._pingTimer);
    net._pingTimer = setInterval(function () {
      // a socket iOS killed in the background still looks open until we write
      if (net.ws && !netSend({ t: "ping" })) netRecycle();
    }, 25000);
  };
  ws.onmessage = function (ev) {
    if (net.ws !== ws) return;
    var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
    onServerMessage(msg);
  };
  var done = function () {
    if (net.ws !== ws) return;
    netOnDisconnect();
  };
  ws.onclose = done;
  ws.onerror = done;
}

function netOnDisconnect() {
  if (!net.active) return;
  net.ws = null; net.connected = false;
  clearInterval(net._pingTimer); net._pingTimer = null;
  if (!net._reTimer) {
    if ($("screen-lobby").classList.contains("active") && !net.welcomed)
      $("lobby-wait").textContent = "Reconnecting\u2026";
    else toast("Connection lost \u2014 reconnecting\u2026");
  }
  netScheduleReconnect();
}

function netScheduleReconnect() {
  if (!net.active || net._reTimer) return;
  net._reTimer = setTimeout(function () {
    net._reTimer = null;
    net._reDelay = Math.min(net._reDelay * 2, 15000);
    netOpenSocket();
  }, net._reDelay);
}

/* tab-away / app-background recovery: iOS may silently kill the socket while
   hidden. Recycle it on return -- the hello handshake re-syncs full state. */
function netRecycle() {
  if (!net.active) return;
  var ws = net.ws;
  net.ws = null; net.connected = false;
  clearInterval(net._pingTimer); net._pingTimer = null;
  clearTimeout(net._reTimer); net._reTimer = null;
  if (ws) { ws.onclose = null; ws.onerror = null; try { ws.close(); } catch (e) {} }
  netOpenSocket();
}

function onServerMessage(msg) {
  if (!msg || !msg.t || !net.active) return;
  switch (msg.t) {
    case "welcome":
      net.pid = msg.pid; app.myPid = msg.pid; net.welcomed = true;
      saveSession(net.code, msg.pid, net.name);
      // Fresh handshake: drop any stale buy prompt from the old socket. If a
      // buy round is still live for us, the server re-sends buyRequest right
      // after welcome and the box reappears; otherwise the dead prompt (whose
      // buyRequestClear went to the dead socket) must not linger with live
      // buttons that the server would silently ignore.
      renderBuyBox(null);
      applyServerState(msg.state);
      break;
    case "state":
      applyServerState(msg);
      break;
    case "nak":
      var wasLiv = app._liverpoolPending;
      app._liverpoolPending = false;
      app.movePending = false;
      if (app._optimisticDiscard) {
        (app.state.hands[net.pid] = app.state.hands[net.pid] || []).push(app._optimisticDiscard);
        app._optimisticDiscard = null;
      }
      if (wasLiv) {
        // failed Liverpool: the history entry is already server-side; cool down
        app._livCooldownUntil = Date.now() + 60000;
        toast(msg.error ? "Liverpool flubbed: " + msg.error : "Liverpool call failed.");
        if (app.state && app.state.table && $("screen-table").classList.contains("active")) renderTable();
        break;
      }
      toast(msg.error ? "Can't do that: " + msg.error : "The server rejected that move.");
      if (app.state && app.state.table && $("screen-table").classList.contains("active")) renderTable();
      break;
    case "liverpoolOk":
      app._liverpoolPending = false;
      // the splash plays off the state broadcast's event log — same for everyone
      break;
    case "buyRequest":
      renderBuyBox(msg);
      if (app.state && app.state.table) renderTable();
      break;
    case "buyRequestClear":
      renderBuyBox(null);
      if (app.state && app.state.table && $("screen-table").classList.contains("active")) renderTable();
      break;
    case "buyResult":
      if (msg.buyerPid === net.pid) {
        app._buyWonContinue = null;
        showBuyWon(msg.buyerPid, msg.card, msg.penalty);
      } else {
        toast((msg.buyerName || "Someone") + " bought " + E.cardName(msg.card) + " \uD83D\uDCB0");
      }
      break;
    case "toast":
      toast(msg.msg);
      break;
    case "kicked":
      clearSession();
      netLeave();
      show("screen-home");
      toast("You were removed from the room");
      break;
    case "error":
      // create-collision: the code is taken -- mint a fresh one and retry
      if (!net.welcomed && net._wasCreate && msg.error === "Room taken \u2014 try a new code." && net._createTries < 3) {
        netConnect(genCode(), { create: true, name: net.name, _retries: net._createTries + 1 });
        return;
      }
      var em = msg.error || "Couldn't join the room.";
      netLeave();
      show("screen-setup"); // app.mode is still "online", so the online form shows
      onlineError(em);
      break;
    case "pong":
      break;
  }
}

function applyServerState(s) {
  if (!s || !net.active) return;
  var freshGame = net.lastState && net.lastState.status !== "playing" && s.status === "playing";
  net.lastState = s;
  net.isHost = amCreator();
  if (s.status === "playing" && s.table) {
    if (freshGame) app._sortDeal = null; // fresh deal: re-apply default sort
    if (!app.state) app.state = { players: [], hands: {}, table: null };
    app.movePending = false;
    app.state.table = s.table;
    app.state.players = playerListFrom(s.players);
    app.state.hands = {};
    var h = s.hands && s.hands[net.pid];
    if (h) {
      if (app._drawSentHand) {
        var drawn = null, i;
        for (i = 0; i < h.length; i++) if (app._drawSentHand.indexOf(h[i]) < 0) { drawn = h[i]; break; }
        app.lastDrawn = drawn; app._drawSentHand = null;
      }
      app.state.hands[net.pid] = reconcileOptimisticHand(h);
    }
    // Selections are card ids: drop any that left the hand (melded, discarded)
    // so a stale pick can never wedge the action bar. This was the post-layDown
    // freeze: meld cards stayed "selected" after leaving the hand, so the
    // Discard button (needs exactly 1) stayed disabled forever.
    var myHand = app.state.hands[net.pid] || [];
    Object.keys(app.sel).forEach(function (cid) { if (myHand.indexOf(cid) < 0) delete app.sel[cid]; });
    onTableUpdate();
  } else {
    renderLobbyPlayers();
    renderLobbyDeals();
    $("host-controls").classList.toggle("hidden", !net.isHost);
    $("lobby-wait").classList.toggle("hidden", net.isHost);
    show("screen-lobby");
  }
}

function onTableUpdate() {
  var T = app.state.table;
  if (!T) return;
  normTable(T); // tolerate older/damaged snapshots; worker JSON is always complete
  // Liverpool moments splash for the whole table, one-shot per event
  var evs = T.events || [], i, e;
  for (i = evs.length - 1; i >= 0; i--) {
    e = evs[i];
    if ((e.k === "liverpool" || e.k === "liverpoolFail") && e.ts && e.ts > (app._lastLivTs || 0)) {
      app._lastLivTs = e.ts;
      if (e.k === "liverpool") playLiverpoolAnimation(e);
      else {
        toast(((playerById(e.who) || {}).name || "Someone") + " flubbed a Liverpool call 😅");
        hap("notification", "error");
      }
      break;
    }
  }
  if (T.phase === "play") {
    show("screen-table");
    renderTable();
  } else if (T.phase === "score") {
    renderScore(true);
  } else if (T.phase === "final") {
    renderFinal();
  }
}

function renderLobbyPlayers() {
  var s = net.lastState; if (!s) return;
  var box = $("lobby-players"); box.innerHTML = "";
  var list = playerListFrom(s.players);
  var inLobby = s.status === "lobby";
  list.forEach(function (p) {
    var d = document.createElement("div"); d.className = "lp-row";
    d.innerHTML = "<span>" + esc(p.name) + "</span>" +
      (p.isBot ? '<span class="botbadge">BOT</span>' : "") +
      (!p.online && !p.isBot ? '<span class="mut" style="font-size:12px"> \u00B7 away</span>' : "") +
      (s.creatorPid === p.pid ? '<span class="host">HOST</span>' : "") +
      (net.isHost && inLobby && p.pid !== net.pid
        ? '<button class="px rm" data-rm="' + p.pid + '" data-nm="' + esc(p.name) + '">\u2715</button>' : "");
    box.appendChild(d);
  });
  Array.prototype.forEach.call(box.querySelectorAll("[data-rm]"), function (b) {
    b.addEventListener("click", function () {
      var pid = b.getAttribute("data-rm"), nm = b.getAttribute("data-nm") || "player";
      if (b.dataset.armed) { netSend({ t: "kick", pid: pid }); }
      else {
        b.dataset.armed = "1"; b.textContent = "kick " + nm + "?";
        setTimeout(function () { b.dataset.armed = ""; b.textContent = "\u2715"; }, 2500);
      }
    });
  });
}

function renderLobbyDeals() {
  var s = net.lastState; if (!s) return;
  var cur = (s.settings && s.settings.deals) || 7;
  Array.prototype.forEach.call($("lobby-deals").children, function (b) {
    b.classList.toggle("sel", parseInt(b.dataset.v, 10) === cur);
  });
}

/* ---------- saved sessions ---------- */
function saveSession(code, pid, name) {
  try { localStorage.setItem("livRoom", JSON.stringify({ code: code, pid: pid, name: name })); } catch (e) {}
}
function loadSession() {
  try {
    var s = JSON.parse(localStorage.getItem("livRoom") || "null");
    return (s && s.code && s.code.length === 4) ? s : null;
  } catch (e) { return null; }
}
function clearSession() {
  try { localStorage.removeItem("livRoom"); } catch (e) {}
}
function refreshRejoinBtn() {
  var b = $("btn-rejoin"), s = loadSession();
  b.classList.toggle("hidden", !s);
  if (s) b.textContent = "\u21A9 Rejoin room " + s.code + " as " + (s.name || "you");
}
function rejoinSaved() {
  var s = loadSession();
  if (!s) return;
  onlineError("");
  netConnect(s.code, { name: s.name || "Player", pid: s.pid || null });
  toast("Back in room " + s.code + " \uD83D\uDC4B");
}

/* ---------- leave ---------- */
function netLeave() {
  clearTimeout(net._reTimer); net._reTimer = null;
  clearInterval(net._pingTimer); net._pingTimer = null;
  clearInterval(app._cdTimer); app._cdTimer = null;
  var ws = net.ws; net.ws = null;
  if (ws) { ws.onclose = null; ws.onerror = null; try { ws.close(); } catch (e) {} }
  net.active = false; net.connected = false; net.welcomed = false;
  net.code = null; net.pid = null; net.lastState = null; net.isHost = false;
  net._wasCreate = false;
  app.state = null; app.movePending = false;
  app._optimisticDiscard = null; app._drawSentHand = null;
  renderBuyBox(null);
}

/* ---------- online buttons ---------- */
$("btn-create").addEventListener("click", function () {
  var name = $("online-name").value.trim() || "Player 1";
  onlineError("");
  netConnect(genCode(), { create: true, name: name });
});
$("btn-join").addEventListener("click", function () {
  var name = $("online-name").value.trim() || "Player 2";
  var code = $("join-code").value.trim().toUpperCase();
  onlineError("");
  if (code.length !== 4) { onlineError("Enter the 4-letter room code."); return; }
  var saved = loadSession();
  netConnect(code, { name: name, pid: (saved && saved.code === code && saved.pid) ? saved.pid : null });
});
$("btn-rejoin").addEventListener("click", function () { onlineError(""); rejoinSaved(); });
$("lobby-back").addEventListener("click", function () { netLeave(); show("screen-home"); });
Array.prototype.forEach.call($("lobby-deals").children, function (b) {
  b.addEventListener("click", function () {
    if (!net.isHost) return;
    netSend({ t: "deals", n: parseInt(b.dataset.v, 10) });
  });
});
$("btn-add-bot").addEventListener("click", function () { if (net.isHost) netSend({ t: "addBot" }); });
$("btn-copy").addEventListener("click", function () {
  var link = location.origin + location.pathname + "?room=" + (net.code || "");
  function done(ok) { toast(ok ? "Invite link copied 📋" : "Copy failed — long-press the code instead"); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(function () { done(true); }, function () { done(false); });
  else {
    var ta = document.createElement("textarea");
    ta.value = link; document.body.appendChild(ta); ta.select();
    try { done(document.execCommand("copy")); } catch (e) { done(false); }
    document.body.removeChild(ta);
  }
});
$("btn-del-bot").addEventListener("click", function () {
  if (!net.isHost || !net.lastState) return;
  var bots = playerListFrom(net.lastState.players).filter(function (p) { return p.isBot; });
  if (bots.length) netSend({ t: "removeBot", pid: bots[bots.length - 1].pid });
});
$("btn-lobby-start").addEventListener("click", function () {
  if (!net.isHost) return;
  if (!net.lastState || playerListFrom(net.lastState.players).length < 2) { toast("Need at least 2 players"); return; }
  netSend({ t: "start" });
});
function netNextDeal() { if (net.isHost) netSend({ t: "nextDeal" }); }

/* deep link: ?room=CODE */
(function () {
  try {
    var m = location.search.match(/[?&]room=([A-Za-z0-9]{4})/);
    if (!m) return;
    openSetup("online");
    $("join-code").value = m[1].toUpperCase();
  } catch (e) {}
})();

/* debug/testing handle — used by test/app.smoke.js to set up scenarios */
// buy prompt box: shared by the realtime listener and the REST heal path
function renderBuyBox(r) {
  var pid = net.pid;
  if (r && r.buyerPid === pid) {
    $("buy-who").textContent = "💰 " + net.name + " — buy?";
    $("buy-text").innerHTML = "<b>" + esc(r.discarderName || "Someone") + "</b> tossed " +
      esc(r.cardName || r.card) + ".<br>Buy it + 1 penalty card?" +
      ' <span class="mut">💰 ' + (r.buysLeft || 0) + " left</span>";
    $("buy-card").innerHTML = cardHTML(r.card);
    $("buybox").classList.remove("hidden");
    app._buyPeekPid = pid;
  } else {
    $("buybox").classList.add("hidden");
    app._buyPeekPid = null;
  }
}
window.LivApp = { app: app, net: net, renderTable: renderTable, renderScore: renderScore, renderFinal: renderFinal, renderPeek: renderPeek, promptBuy: localPromptNextBuyer, onMeldTap: onMeldTap, onCardTap: onCardTap, doMove: doMove, E: E, startBuyRound: startBuyRound, runBotsLocal: runBotsLocal, show: show, renderBuyBox: renderBuyBox, reconcileOptimisticHand: reconcileOptimisticHand, netConnect: netConnect, netSend: netSend, netRecycle: netRecycle, netLeave: netLeave, onServerMessage: onServerMessage, applyServerState: applyServerState, amCreator: amCreator, workerURL: workerURL, playerListFrom: playerListFrom, saveSession: saveSession, loadSession: loadSession, clearSession: clearSession, rejoinSaved: rejoinSaved, renderHistory: renderHistory, liverpoolTarget: liverpoolTarget, playLiverpoolAnimation: playLiverpoolAnimation, startLiverpool: startLiverpool };

/* ---------- tab-away recovery (online) ---------- */
// iOS Safari freezes JS timers and may silently drop the WebSocket while the
// tab is hidden. On return, recycle the socket: the hello handshake re-syncs
// the full authoritative state. No host timers or watchdogs live here -- the
// Worker owns all of that now.
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) netRecycle();
});
document.addEventListener("pageshow", function () { netRecycle(); });

// stale-cache self check: 2026.10.05-be1 is stamped at deploy time. If this copy is
// older than what's deployed (aggressive mobile caching), reload once to pick
// up the fix instead of running yesterday's code.
var APP_V = "2026.10.05-be1";
// Build version lives in Settings now (no always-on badge). Format the stamped
// version for display. NOTE: the deploy script stamps every 2026.10.05-be1
// placeholder, so this must NOT compare against the placeholder text (it
// becomes self-false after stamping) — match the dotted version shape instead.
function appVerLabel() {
  return (/^[0-9]{4}\.[0-9]{2}\.[0-9]{2}-/.test(APP_V)) ? "v" + APP_V : "dev";
}
/* ---------- remove-ads IAP (BoyGames.store) + ad banners (BoyGames.ads) ----------
   The Remove Ads row only appears when ads are actually enabled (kill switch
   on) and not already owned. Everything is guarded so the app works fine when
   js/store.js / js/ads.js are absent (e.g. in tests). */
function refreshStoreRow() {
  var row = $("set-removeads-row");
  if (!row) return;
  var rrow = $("set-restore-row"), btn = $("btn-removeads");
  var BG = window.BoyGames;
  var on = !!(BG && BG.config && BG.config.adsEnabled && BG.ads);
  if (!on) { row.classList.add("hidden"); if (rrow) rrow.classList.add("hidden"); return; }
  var owned = !!(BG.store && BG.store.isOwned(BG.store.PRODUCT_REMOVE_ADS));
  row.classList.remove("hidden");
  if (owned) {
    btn.disabled = true; btn.textContent = "✓ Ads removed";
    if (rrow) rrow.classList.add("hidden");
    return;
  }
  btn.disabled = false;
  if (rrow) rrow.classList.remove("hidden");
  if (BG.store) BG.store.getProducts().then(function (ps) {
    var p = null, i;
    for (i = 0; i < ps.length; i++) if (ps[i].id === BG.store.PRODUCT_REMOVE_ADS) p = ps[i];
    if (!BG.store.isOwned(BG.store.PRODUCT_REMOVE_ADS)) btn.textContent = "Remove Ads" + (p ? " — " + p.price : "");
  });
}
var AD_BANNER_SLOTS = { "screen-home": "ad-banner-home", "screen-setup": "ad-banner-setup", "screen-lobby": "ad-banner-lobby" };
function refreshBanner(screenId) {
  try {
    var BG = window.BoyGames;
    if (!BG || !BG.ads) return;
    BG.ads.hideBanner();
    var slot = AD_BANNER_SLOTS[screenId];
    if (slot) { var el = $(slot); if (el) BG.ads.showBanner(el); }
  } catch (e) {}
}
function openSettings() {
  try { $("set-ver").textContent = appVerLabel(); } catch (e) {}
  refreshStoreRow();
  var BG = window.BoyGames;
  if (BG && BG.config && BG.config.load) {
    try { BG.config.load().then(function () { refreshStoreRow(); }); } catch (e) {}
  }
  $("settingsbox").classList.remove("hidden");
}
function closeSettings() { $("settingsbox").classList.add("hidden"); }
/* Ad kill switch: fetch /config.json once at startup (fail closed = ads off). */
try { if (window.BoyGames && window.BoyGames.config) window.BoyGames.config.load().then(function () {
  /* refresh the banner on whichever screen is active — the home screen is
     active by default in HTML (no show() call), and early navigations may
     have rendered before the config resolved */
  try {
    var cur = null, i;
    for (i = 0; i < SCREENS.length; i++) {
      var el = $(SCREENS[i]);
      if (el && el.classList.contains("active")) { cur = SCREENS[i]; break; }
    }
    if (cur) refreshBanner(cur);
  } catch (e) {}
}); } catch (e) {}
try {
  fetch("version.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
    if (d && d.v && d.v !== APP_V) {
      if (!sessionStorage.getItem("lr_vdone")) {
        sessionStorage.setItem("lr_vdone", "1");
        setTimeout(function () { location.reload(); }, 800);
      } else {
        toast("A newer version is available — please close and reopen this tab.");
      }
    }
  }).catch(function () {});
} catch (e) {}

})();
