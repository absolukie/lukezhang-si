/* Liverpool Rummy — pure game engine.
   No DOM, no network: usable from the browser app and from Node tests.
   Cards are short ids: "AS","10H","KD","2C", jokers "JOKER1".. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.LivEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_GLYPH = { S: "\u2660", H: "\u2665", D: "\u2666", C: "\u2663" };

  function isJoker(id) { return id.indexOf("JOKER") === 0; }
  // 2s are wild too (house rule): they meld exactly like jokers, in sets and runs.
  // Only actual jokers can be stolen from a meld.
  function isWild(id) { return isJoker(id) || rankOf(id) === "2"; }
  function baseId(id) { var h = id.indexOf("#"); return h < 0 ? id : id.slice(0, h); }
  function rankOf(id) { return isJoker(id) ? null : baseId(id).slice(0, -1); }
  function suitOf(id) { return isJoker(id) ? null : baseId(id).slice(-1); }
  function rankVal(rank, aceHigh) {
    if (rank === "A") return aceHigh ? 14 : 1;
    if (rank === "J") return 11;
    if (rank === "Q") return 12;
    if (rank === "K") return 13;
    return parseInt(rank, 10);
  }
  function cardPoints(id) {
    if (isWild(id)) return 15;
    var r = rankOf(id);
    if (r === "A") return 15;
    if (r === "K" || r === "Q" || r === "J" || r === "10") return 10;
    return 5;
  }
  function cardName(id) {
    if (isJoker(id)) return "Joker";
    return rankOf(id) + SUIT_GLYPH[suitOf(id)];
  }
  function isRed(id) {
    var s = suitOf(id);
    return s === "H" || s === "D";
  }

  /* ---------- decks ---------- */
  function deckSpec(numPlayers) {
    // 2-4 players: 2 decks + 4 jokers; 5-6: 3 decks + 6 jokers
    if (numPlayers >= 5) return { decks: 3, jokers: 6 };
    return { decks: 2, jokers: 4 };
  }
  function buildDeck(numPlayers) {
    var spec = deckSpec(numPlayers), cards = [], d, s, r, j;
    for (d = 0; d < spec.decks; d++)
      for (s = 0; s < SUITS.length; s++)
        for (r = 0; r < RANKS.length; r++)
          // unique id per physical card: identical ranks across decks must stay distinguishable
          cards.push(RANKS[r] + SUITS[s] + (spec.decks > 1 ? "#" + (d + 1) : ""));
    for (j = 1; j <= spec.jokers; j++) cards.push("JOKER" + j);
    return cards;
  }
  function shuffle(arr, rng) {
    var r = rng || Math.random, i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(r() * (i + 1));
      t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ---------- contracts ---------- */
  // deal numbers are 1-based; index 0 unused
  var CONTRACTS = [
    null,
    { sets: 2, runs: 0 }, // 1: two sets
    { sets: 1, runs: 1 }, // 2: one set + one run
    { sets: 0, runs: 2 }, // 3: two runs
    { sets: 3, runs: 0 }, // 4: three sets
    { sets: 2, runs: 1 }, // 5: two sets + one run
    { sets: 1, runs: 2 }, // 6: one set + two runs
    { sets: 0, runs: 3 }  // 7: three runs
  ];
  function contractFor(dealNum) { return CONTRACTS[dealNum]; }

  /* ---------- buying ---------- */
  // Liverpool Rummy: after a discard, other players may buy the top discard
  // plus 1 penalty card from the stock. The next player can't buy (they draw
  // normally instead); priority goes in turn order after them. One buy per
  // discard; each player gets a limited number of buys per deal.
  function buyLimit(nPlayers) { return nPlayers <= 2 ? 3 : nPlayers <= 4 ? 2 : 1; }
  function buyCandidates(state) {
    var T = state.table;
    if (T.phase !== "play" || T.turnStep !== "draw" || !T.lastDiscarderPid) return [];
    var n = state.players.length, out = [], k;
    var start = (seatOf(state, T.turnPid) + 1) % n;
    for (k = 0; k < n; k++) {
      var p = state.players[(start + k) % n];
      if (p.pid === T.lastDiscarderPid) continue;
      if (p.pid === T.turnPid) continue; // next player draws normally, never buys
      if (T.down[p.pid]) continue; // no buying once you've laid down
      if (((T.buysLeft || {})[p.pid] || 0) <= 0) continue;
      out.push(p.pid);
    }
    return out;
  }  function contractText(dealNum) {
    var c = contractFor(dealNum), parts = [];
    if (c.sets) parts.push(c.sets + (c.sets === 1 ? " set" : " sets"));
    if (c.runs) parts.push(c.runs + (c.runs === 1 ? " run" : " runs"));
    return parts.join(" + ");
  }
  function dealSize(dealNum) { return dealNum <= 4 ? 10 : 12; }
  function contractSatisfied(melds, contract) {
    var s = 0, r = 0, i;
    for (i = 0; i < melds.length; i++) {
      if (melds[i].type === "set") s++;
      else if (melds[i].type === "run") r++;
    }
    return s >= contract.sets && r >= contract.runs;
  }

  /* ---------- meld validation ---------- */
  // analyzeMeld(cards) -> {valid, type, jokers:{jokerId:{rank,suit}}} | {valid:false}
  function analyzeMeld(cards) {
    if (!cards || cards.length < 3) return { valid: false };
    var set = validSet(cards);
    if (set.valid) return set;
    return validRun(cards);
  }

  function validSet(cards) {
    if (cards.length < 3) return { valid: false };
    var nat = [], jok = [], i;
    for (i = 0; i < cards.length; i++) {
      if (isWild(cards[i])) jok.push(cards[i]);
      else nat.push(cards[i]);
    }
    if (nat.length < 2) return { valid: false }; // need at least 2 naturals
    var r0 = rankOf(nat[0]);
    for (i = 1; i < nat.length; i++) if (rankOf(nat[i]) !== r0) return { valid: false };
    var jm = {};
    jok.forEach(function (j) { jm[j] = { rank: r0, suit: null }; });
    return { valid: true, type: "set", jokers: jm };
  }

  // House rule: a run is a consecutive rank interval of one suit. Wilds occupy
  // exactly the non-natural ranks — filling single gaps or sitting on the ends —
  // but two wilds may NEVER sit side-by-side (no consecutive wild positions).
  // ("wild 9 10 wild" is fine; "9 10 wild wild" is not.) At least 2 naturals
  // always end up anchoring the run; the math below enforces that on its own.
  //
  // validRunPlacements returns EVERY valid wild placement ({jokers, aceHigh}),
  // deduped by the actual rank assignments (which wild id sits where is not a
  // distinct option on screen). The UI offers these when a wild's spot is
  // ambiguous (e.g. joker-3-joker-5 could be J-3-J-5 or 3-J-5-J).
  function validRunPlacements(cards) {
    var out = [], seenKey = {};
    if (!cards || cards.length < 4) return out;
    var nat = [], jok = [], i;
    for (i = 0; i < cards.length; i++) {
      if (isWild(cards[i])) jok.push(cards[i]);
      else nat.push(cards[i]);
    }
    if (!nat.length) return out; // nothing to anchor the suit/ranks
    var s0 = suitOf(nat[0]);
    for (i = 1; i < nat.length; i++) if (suitOf(nat[i]) !== s0) return out;
    var ranks = nat.map(rankOf);
    var seen = {};
    for (i = 0; i < ranks.length; i++) {
      if (seen[ranks[i]]) return out; // no duplicate ranks in a run
      seen[ranks[i]] = true;
    }
    var w = jok.length;
    // try ace-low and ace-high interpretations
    for (var ah = 0; ah <= 1; ah++) {
      var aceHigh = !!ah;
      var vals = ranks.map(function (r) { return rankVal(r, aceHigh); });
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      var natSet = {};
      vals.forEach(function (v) { natSet[v] = true; });
      var valToRank = {};
      RANKS.forEach(function (r) { valToRank[rankVal(r, aceHigh)] = r; });
      for (var lo = Math.max(1, mn - w); lo <= mn; lo++) {
        for (var hi = mx; hi <= Math.min(14, mx + w); hi++) {
          if ((hi - lo + 1) - nat.length !== w) continue; // wilds fill exactly the rest
          var ok = true, prevWild = false, v;
          for (v = lo; v <= hi; v++) {
            var isW = !natSet[v];
            if (isW && prevWild) { ok = false; break; } // two wilds in a row: illegal
            prevWild = isW;
          }
          if (!ok) continue;
          var jm = {}, wi = 0;
          for (v = lo; v <= hi; v++) {
            if (!natSet[v]) jm[jok[wi++]] = { rank: valToRank[v], suit: s0 };
          }
          // dedupe: same rank assignments = same option, however reached
          var ids = Object.keys(jm).sort();
          var key = ids.map(function (id) { return jm[id].rank + (jm[id].suit || ""); }).join("|");
          if (seenKey[key]) continue;
          seenKey[key] = true;
          out.push({ jokers: jm, aceHigh: aceHigh });
        }
      }
    }
    return out;
  }
  function validRun(cards) {
    var ps = validRunPlacements(cards);
    if (!ps.length) return { valid: false };
    return { valid: true, type: "run", jokers: ps[0].jokers, aceHigh: ps[0].aceHigh };
  }

  // Display order for a run's cards: ascending by assigned rank, so wilds sit
  // exactly where they're "missing" (joker-3-4-joker, never joker-joker-3-4).
  function orderRunCards(cards, jokers, aceHigh) {
    var ah = !!aceHigh;
    return cards.slice().sort(function (a, b) {
      var ra = ((jokers || {})[a] || {}).rank || rankOf(a);
      var rb = ((jokers || {})[b] || {}).rank || rankOf(b);
      return rankVal(ra, ah) - rankVal(rb, ah);
    });
  }
  // Card ids in the order a meld should be rendered. Runs use their assigned
  // ranks; the server stores `order` at creation, older melds fall back to a
  // heuristic sort (ace-low when an ace sits with a 2).
  function meldDisplayOrder(meld) {
    if (meld.order && meld.order.length === meld.cards.length) return meld.order.slice();
    if (meld.type !== "run") return meld.cards.slice();
    var ah = true, hasA = false, has2 = false;
    meld.cards.forEach(function (c) {
      var r = ((meld.jokers || {})[c] || {}).rank || rankOf(c);
      if (r === "A") hasA = true;
      if (r === "2") has2 = true;
    });
    if (hasA && has2) ah = false;
    return orderRunCards(meld.cards, meld.jokers, ah);
  }
  function jokersEqual(a, b) {
    a = a || {}; b = b || {};
    var ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false;
      if ((a[ka[i]].rank || null) !== (b[ka[i]].rank || null)) return false;
      if ((a[ka[i]].suit || null) !== (b[ka[i]].suit || null)) return false;
    }
    return true;
  }
  // Placement options for laying a wild onto an existing run meld.
  function layOffWildOptions(meld, cardId) {
    if (!meld || meld.type !== "run" || !isWild(cardId)) return [];
    return validRunPlacements(meld.cards.concat([cardId]));
  }

  function canLayOff(meld, cardId) {
    var res = analyzeMeld(meld.cards.concat([cardId]));
    return res.valid ? res : null;
  }

  /* ---------- candidate meld generation + contract search ---------- */
  function combos(arr, k) {
    var out = [];
    (function rec(start, cur) {
      if (cur.length === k) { out.push(cur.slice()); return; }
      for (var i = start; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); }
    })(0, []);
    return out;
  }

  function genCandidates(cards) {
    var cands = [], seen = {};
    var naturals = cards.filter(function (c) { return !isWild(c); });
    var jokers = cards.filter(isWild);
    function add(type, list) {
      var key = type + ":" + list.slice().sort().join(",");
      if (seen[key]) return;
      seen[key] = true;
      var a = analyzeMeld(list);
      if (a.valid && a.type === type) cands.push({ type: type, cards: list.slice(), jokers: a.jokers });
    }
    // sets: rank groups, exactly 3 (house rule: a set goes down as 3, the 4th+
    // is laid off on a later turn) — plus 2 naturals + 1 wild
    var byRank = {};
    naturals.forEach(function (c) { (byRank[rankOf(c)] = byRank[rankOf(c)] || []).push(c); });
    Object.keys(byRank).forEach(function (r) {
      var rs = byRank[r], n = rs.length, combo, ci;
      if (n >= 3) {
        var subs = combos(rs, 3);
        for (ci = 0; ci < subs.length; ci++) add("set", subs[ci]);
      }
      if (n >= 2 && jokers.length) {
        var pairs = combos(rs, 2);
        for (var j = 0; j < jokers.length; j++)
          for (ci = 0; ci < pairs.length; ci++) add("set", pairs[ci].concat([jokers[j]]));
      }
    });
    // runs: per suit, windows of naturals (len>=2) + wilds. A run of n naturals
    // can hold at most n+1 wilds without two sitting side-by-side, so we try
    // every wild count 0..kmax; analyzeMeld is the arbiter of what's legal.
    var bySuit = {};
    naturals.forEach(function (c) { (bySuit[suitOf(c)] = bySuit[suitOf(c)] || []).push(c); });
    Object.keys(bySuit).forEach(function (s) {
      var sc = bySuit[s].slice().sort(function (a, b) { return rankVal(rankOf(a), true) - rankVal(rankOf(b), true); });
      // dedupe equal ranks for windowing (multi-deck dupes): keep first of each rank
      var uniq = [], seenR = {};
      sc.forEach(function (c) { var r = rankOf(c); if (!seenR[r]) { seenR[r] = true; uniq.push(c); } });
      var n = uniq.length, i, j, k, ci;
      var J = jokers.length;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var win = uniq.slice(i, j + 1), winLen = win.length;
          var kmax = Math.min(J, winLen + 1);
          for (k = 0; k <= kmax; k++) {
            if (winLen + k < 4) continue; // runs are 4+ cards
            var jcs = k === 0 ? [[]] : combos(jokers, k);
            for (ci = 0; ci < jcs.length; ci++) add("run", win.concat(jcs[ci]));
          }
        }
      }
    });
    return cands;
  }

  // find disjoint meld combos within `cards` satisfying needs; best = most cards, then fewest jokers
  function findMeldCombos(cards, needSets, needRuns, maxResults) {
    var cands = genCandidates(cards);
    cands.sort(function (a, b) { return b.cards.length - a.cards.length; });
    var results = [];
    var used = {};
    function score(combo) {
      var n = 0, j = 0, s = 0, r = 0, i, k;
      for (i = 0; i < combo.length; i++) {
        n += combo[i].cards.length; s += combo[i].type === "set" ? 1 : 0; r += combo[i].type === "run" ? 1 : 0;
        for (k = 0; k < combo[i].cards.length; k++) if (isWild(combo[i].cards[k])) j++;
      }
      return { n: n, j: j, s: s, r: r };
    }
    function better(a, b) { // is combo a better than b?
      if (!b) return true;
      var sa = score(a), sb = score(b);
      if (sa.n !== sb.n) return sa.n > sb.n;
      return sa.j < sb.j;
    }
    (function rec(idx, cur) {
      var sc = score(cur);
      if (sc.s >= needSets && sc.r >= needRuns) {
        if (better(cur, results[0])) results[0] = cur.slice();
        // keep searching for a better one
      }
      for (var i = idx; i < cands.length; i++) {
        var m = cands[i], clash = false, k;
        for (k = 0; k < m.cards.length; k++) if (used[m.cards[k]]) { clash = true; break; }
        if (clash) continue;
        // prune: don't exceed needs by too much (allow extra melds? no — keep it tight)
        var ns = sc.s + (m.type === "set" ? 1 : 0), nr = sc.r + (m.type === "run" ? 1 : 0);
        if (ns > needSets + 1 || nr > needRuns + 1) continue;
        for (k = 0; k < m.cards.length; k++) used[m.cards[k]] = true;
        cur.push(m);
        rec(i + 1, cur);
        cur.pop();
        for (k = 0; k < m.cards.length; k++) delete used[m.cards[k]];
      }
    })(0, []);
    return results[0] ? [results[0]] : [];
  }

  /* ---------- game state + moves ---------- */
  // state: {players:[{pid,name,isBot,seat}], hands:{pid:[]},
  //         table:{dealNum,dealsTotal,stock:[],discard:[],melds:[{id,type,owner,cards[],jokers{}}],
  //                turnPid,turnStep:'draw'|'play',down:{pid:1},scores:{pid:n},dealPoints:{pid:n},
  //                phase:'play'|'dealEnd',goerPid}}
  var _meldSeq = 1;
  function newMeldId() { return "m" + (_meldSeq++) + "_" + Math.floor(Math.random() * 1e6); }

  function createDeal(players, dealNum, dealsTotal, prevScores, rng) {
    var deck = shuffle(buildDeck(players.length), rng);
    var size = dealSize(dealNum), hands = {}, i, p;
    players.forEach(function (pl, idx) {
      hands[pl.pid] = [];
      for (i = 0; i < size; i++) hands[pl.pid].push(deck.pop());
    });
    var stock = deck;
    var discard = [stock.pop()];
    var firstSeat = dealNum % players.length; // dealer rotates; left of dealer starts
    var scores = {}, buysLeft = {};
    players.forEach(function (pl) {
      scores[pl.pid] = (prevScores && prevScores[pl.pid]) || 0;
      buysLeft[pl.pid] = buyLimit(players.length);
    });
    return {
      players: players,
      hands: hands,
      table: {
        dealNum: dealNum, dealsTotal: dealsTotal,
        stock: stock, discard: discard, melds: [],
        turnPid: players[firstSeat].pid, turnStep: "draw", turnNo: 1,
        down: {}, downTurn: {}, scores: scores, dealPoints: {},
        buysLeft: buysLeft, lastDiscarderPid: null, events: [],
        phase: "play", goerPid: null
      }
    };
  }

  function seatOf(state, pid) {
    for (var i = 0; i < state.players.length; i++) if (state.players[i].pid === pid) return i;
    return -1;
  }
  function nextPid(state, pid) {
    var s = seatOf(state, pid);
    return state.players[(s + 1) % state.players.length].pid;
  }
  function meldsOf(state, pid) {
    return state.table.melds.filter(function (m) { return m.owner === pid; });
  }
  function needsLeft(state, pid) {
    var c = contractFor(state.table.dealNum), mine = meldsOf(state, pid), s = 0, r = 0;
    mine.forEach(function (m) { if (m.type === "set") s++; else r++; });
    return { sets: Math.max(0, c.sets - s), runs: Math.max(0, c.runs - r) };
  }

  function reshuffleIfNeeded(table) {
    if (table.stock.length === 0 && table.discard.length > 1) {
      var top = table.discard.pop();
      table.stock = shuffle(table.discard, Math.random);
      table.discard = [top];
    }
  }

  // compact per-deal event log (tosses + buys) for the history feed
  function logEvent(T, ev) {
    T.events = T.events || [];
    T.events.push(ev);
    while (T.events.length > 30) T.events.shift();
  }

  // applyMove(state, pid, move) -> {ok:true} or {ok:false, error}
  // move: {t:'drawStock'|'drawDiscard'|'goOut7'|'layDown'|'layOff'|'steal'|'discard'|'buy'|'liverpool', ...}
  function applyMove(state, pid, move) {
    var T = state.table, hand = state.hands[pid];
    if (!hand) return { ok: false, error: "unknown player" };
    if (T.phase !== "play") return { ok: false, error: "deal over" };
    // buys and Liverpool calls happen outside the caller's turn, during the
    // next player's draw step (or any later point while the card sits on top)
    if (move.t === "buy") return applyBuy(state, pid, move);
    if (move.t === "liverpool") return applyLiverpool(state, pid, move);
    if (T.turnPid !== pid) return { ok: false, error: "not your turn" };
    function takeFromHand(card) {
      var i = hand.indexOf(card);
      if (i < 0) return false;
      hand.splice(i, 1); return true;
    }

    if (move.t === "drawStock" || move.t === "drawDiscard") {
      if (T.turnStep !== "draw") return { ok: false, error: "already drew" };
      if (move.t === "drawStock") {
        reshuffleIfNeeded(T);
        if (!T.stock.length) return { ok: false, error: "stock empty" };
        hand.push(T.stock.pop());
      } else {
        if (!T.discard.length) return { ok: false, error: "discard empty" };
        hand.push(T.discard.pop());
      }
      T.turnStep = "play";
      T.lastDiscarderPid = null; // next player drew: the buy window is over
      return { ok: true };
    }

  // LIVERPOOL: anyone except the discarder may call it on the top discard
  // (or the buy card, which is the same card) while it sits on top. The call
  // is good when the card could be played onto one of the table's melds.
  // Good call: the caller sheds one card from hand immediately, out of turn;
  // the turn order doesn't move (no buy round on the shed card, no turnNo++).
  // Bad call: recorded in history; the phone cools the button down for 60s.
  function applyLiverpool(state, pid, move) {
    var T = state.table, hand = state.hands[pid];
    if (!hand) return { ok: false, error: "unknown player" };
    if (T.phase !== "play") return { ok: false, error: "deal over" };
    var top = T.discard[T.discard.length - 1];
    if (!top || top !== move.card) return { ok: false, error: "card is gone" };
    if (pid === T.lastDiscarderPid) return { ok: false, error: "can't call your own discard" };
    if (!move.discard || hand.indexOf(move.discard) < 0)
      return { ok: false, error: "choose a card to shed" };
    if (hand.length <= 1) return { ok: false, error: "must keep one card" };
    var fits = null;
    for (var i = 0; i < T.melds.length; i++) {
      if (canLayOff(T.melds[i], top)) { fits = T.melds[i]; break; }
    }
    if (!fits) {
      logEvent(T, { k: "liverpoolFail", who: pid, card: top, ts: Date.now() });
      return { ok: false, error: "that card can't be melded" };
    }
    hand.splice(hand.indexOf(move.discard), 1);
    T.discard.push(move.discard);
    logEvent(T, { k: "liverpool", who: pid, card: top, meldId: fits.id, shed: move.discard, ts: Date.now() });
    return { ok: true, meldId: fits.id };
  }

  function applyBuy(state, pid, move) {
    var T = state.table, hand = state.hands[pid];
    if (T.turnStep !== "draw") return { ok: false, error: "buy window closed" };
    if (!T.lastDiscarderPid) return { ok: false, error: "nothing to buy" };
    if (pid === T.turnPid) return { ok: false, error: "take it on your turn instead" };
    if (pid === T.lastDiscarderPid) return { ok: false, error: "can't buy your own discard" };
    var left = (T.buysLeft && T.buysLeft[pid]) || 0;
    if (left <= 0) return { ok: false, error: "no buys left" };
    var top = T.discard[T.discard.length - 1];
    if (!top || top !== move.card) return { ok: false, error: "card is gone" };
    T.discard.pop();
    hand.push(top);
    reshuffleIfNeeded(T);
    var penalty = null;
    if (T.stock.length) { penalty = T.stock.pop(); hand.push(penalty); } // penalty card
    T.buysLeft[pid] = left - 1;
    T.lastDiscarderPid = null; // one buy per discard; window closes
    logEvent(T, { k: "buy", who: pid, card: top, penalty: penalty, left: T.buysLeft[pid] });
    return { ok: true, bought: top, penalty: penalty };
  }

    if (move.t === "goOut7") {
      // deal-7 exception: 3 runs covering every card in hand, no draw/discard needed
      if (T.dealNum !== 7 || T.turnStep !== "draw") return { ok: false, error: "not available" };
      var combos = findMeldCombos(hand, 0, 3);
      var good = combos.some(function (cb) {
        var n = 0, allRuns = true, i;
        for (i = 0; i < cb.length; i++) { n += cb[i].cards.length; if (cb[i].type !== "run") allRuns = false; }
        return allRuns && n === hand.length && cb.length === 3;
      });
      if (!good) return { ok: false, error: "hand is not 3 runs" };
      T.phase = "dealEnd"; T.goerPid = pid;
      return { ok: true };
    }

    if (move.t === "layDown") {
      if (T.turnStep !== "play") return { ok: false, error: "draw first" };
      if (T.down[pid]) return { ok: false, error: "already down" };
      var need = needsLeft(state, pid);
      var melds = move.melds || [];
      if (!melds.length) return { ok: false, error: "no melds" };
      // validate each meld and that cards are in hand & disjoint
      var usedCards = [], i, m, placements = [];
      for (i = 0; i < melds.length; i++) {
        m = melds[i];
        var a = analyzeMeld(m.cards);
        if (!a.valid || a.type !== m.type) return { ok: false, error: "invalid meld" };
        // house rule: a set goes down as exactly 3 — the 4th+ is laid off later
        if (m.type === "set" && m.cards.length > 3)
          return { ok: false, error: "sets go down as 3 — lay the rest off next turn" };
        // the phone may choose which valid wild placement a run uses; it must
        // be one of the engine's options, never an invention
        var pl = null;
        if (m.jokers) {
          if (m.type !== "run") return { ok: false, error: "invalid meld" };
          var opts = validRunPlacements(m.cards);
          for (var oi = 0; oi < opts.length; oi++)
            if (jokersEqual(opts[oi].jokers, m.jokers)) { pl = opts[oi]; break; }
          if (!pl) return { ok: false, error: "invalid meld" };
        }
        placements.push(pl);
        for (var k = 0; k < m.cards.length; k++) {
          if (hand.indexOf(m.cards[k]) < 0 || usedCards.indexOf(m.cards[k]) >= 0)
            return { ok: false, error: "card not available" };
          usedCards.push(m.cards[k]);
        }
      }
      var asMelds = melds.map(function (mm, ix) {
        var a2 = analyzeMeld(mm.cards);
        var plc = placements[ix];
        var jk = plc ? plc.jokers : a2.jokers;
        var md = { id: newMeldId(), type: a2.type, owner: pid, cards: mm.cards.slice(), jokers: jk };
        md.order = md.type === "run"
          ? orderRunCards(md.cards, jk, plc ? plc.aceHigh : a2.aceHigh)
          : md.cards.slice();
        return md;
      });
      if (!contractSatisfied(asMelds, contractFor(T.dealNum)))
        return { ok: false, error: "does not meet contract" };
      // you must keep one card back to discard — laying down your whole hand
      // leaves no legal move and soft-locks the turn
      if (hand.length - usedCards.length < 1)
        return { ok: false, error: "must keep one card to discard" };
      usedCards.forEach(takeFromHand);
      asMelds.forEach(function (mm) { T.melds.push(mm); });
      T.down[pid] = 1;
      T.downTurn[pid] = T.turnNo; // lay-offs open up on the NEXT turn, not this one
      return { ok: true };
    }

    if (move.t === "layOff") {
      if (T.turnStep !== "play") return { ok: false, error: "draw first" };
      if (!T.down[pid]) return { ok: false, error: "go down first" };
      if (T.downTurn[pid] === T.turnNo) return { ok: false, error: "lay-offs open next turn" };
      var meld = null, mi;
      for (mi = 0; mi < T.melds.length; mi++) if (T.melds[mi].id === move.meldId) meld = T.melds[mi];
      if (!meld) return { ok: false, error: "no such meld" };
      if (hand.indexOf(move.card) < 0) return { ok: false, error: "card not in hand" };
      var res = canLayOff(meld, move.card);
      if (!res) return { ok: false, error: "does not fit" };
      // laying a wild onto a run can be ambiguous (several spots fit) — the
      // phone may send its pick; it must be one of the engine's options
      if (move.jokers && meld.type === "run" && isWild(move.card)) {
        var lopts = layOffWildOptions(meld, move.card), lok = false;
        for (var li = 0; li < lopts.length; li++)
          if (jokersEqual(lopts[li].jokers, move.jokers)) { lok = true; res = lopts[li]; break; }
        if (!lok) return { ok: false, error: "does not fit" };
      }
      if (hand.length <= 1) return { ok: false, error: "must keep one card to discard" };
      takeFromHand(move.card);
      meld.cards.push(move.card);
      meld.jokers = res.jokers;
      if (meld.type === "run") meld.order = orderRunCards(meld.cards, meld.jokers, res.aceHigh);
      return { ok: true };
    }

    if (move.t === "steal") {
      if (T.turnStep !== "play") return { ok: false, error: "draw first" };
      if (!T.down[pid]) return { ok: false, error: "go down first" };
      if (T.downTurn[pid] === T.turnNo) return { ok: false, error: "stealing opens next turn" };
      if (!isWild(move.jokerId)) return { ok: false, error: "only wilds can be stolen" };
      var tm = null, ti;
      for (ti = 0; ti < T.melds.length; ti++) if (T.melds[ti].id === move.meldId) tm = T.melds[ti];
      if (!tm || !tm.jokers[move.jokerId]) return { ok: false, error: "no such joker" };
      if (hand.indexOf(move.card) < 0 || isWild(move.card)) return { ok: false, error: "card not in hand" };
      var asg = tm.jokers[move.jokerId];
      if (asg.rank !== rankOf(move.card)) return { ok: false, error: "wrong card" };
      if (asg.suit && asg.suit !== suitOf(move.card)) return { ok: false, error: "wrong suit" };
      // validate the swap on a copy first: the steal must be atomic, never
      // leave a card vanished from the hand but missing from the meld
      var ci = tm.cards.indexOf(move.jokerId);
      if (ci < 0) return { ok: false, error: "no such joker" };
      var newCards = tm.cards.slice();
      newCards[ci] = move.card;
      var chk = analyzeMeld(newCards);
      if (!chk.valid) return { ok: false, error: "meld broken" };
      // swap
      takeFromHand(move.card);
      tm.cards[ci] = move.card;
      delete tm.jokers[move.jokerId];
      hand.push(move.jokerId);
      tm.jokers = chk.jokers;
      if (tm.type === "run") tm.order = orderRunCards(tm.cards, tm.jokers, chk.aceHigh);
      return { ok: true };
    }

    if (move.t === "discard") {
      if (T.turnStep !== "play") return { ok: false, error: "draw first" };
      if (!takeFromHand(move.card)) return { ok: false, error: "card not in hand" };
      T.discard.push(move.card);
      T.lastDiscarderPid = pid;
      logEvent(T, { k: "toss", who: pid, card: move.card });
      if (hand.length === 0) {
        T.phase = "dealEnd"; T.goerPid = pid;
      } else {
        T.turnPid = nextPid(state, pid);
        T.turnStep = "draw";
        T.turnNo++;
      }
      return { ok: true };
    }

    return { ok: false, error: "unknown move" };
  }

  function scoreDeal(state) {
    var pts = {}, pid;
    for (pid in state.hands) {
      if (pid === state.table.goerPid) { pts[pid] = 0; continue; }
      var s = 0, i, h = state.hands[pid];
      for (i = 0; i < h.length; i++) s += cardPoints(h[i]);
      pts[pid] = s;
    }
    return pts;
  }

  /* ---------- bot AI (one competent difficulty) ---------- */
  function cardKeepValue(hand, card, need) {
    // how much the bot wants to KEEP this card, given the contract it still needs
    if (isWild(card)) return 99;
    need = need || { sets: 1, runs: 1 };
    var v = 0, i, c;
    var rank = rankOf(card), suit = suitOf(card), rv = rankVal(rank, true);
    var sameRank = 0, suited = [];
    for (i = 0; i < hand.length; i++) {
      c = hand[i];
      if (c === card || isWild(c)) continue;
      if (rankOf(c) === rank) sameRank++;
      else if (suitOf(c) === suit) suited.push(rankVal(rankOf(c), true));
    }
    if (need.sets > 0) {
      if (sameRank >= 2) v += 8; else if (sameRank === 1) v += 4;
    }
    if (need.runs > 0) {
      // size of the best suited cluster inside a 4-span window: a future run core
      var vals = [rv];
      if (rank === "A") vals.push(1); // ace plays low too
      for (i = 0; i < suited.length; i++) if (vals.indexOf(suited[i]) < 0) vals.push(suited[i]);
      var best = 1, a, b, cnt;
      for (a = 0; a < vals.length; a++) {
        cnt = 0;
        for (b = 0; b < vals.length; b++)
          if (vals[b] >= vals[a] && vals[b] <= vals[a] + 3) cnt++;
        if (cnt > best) best = cnt;
      }
      if (best >= 4) v += 9; else if (best === 3) v += 6; else if (best === 2) v += 2;
    } else {
      for (i = 0; i < suited.length; i++)
        if (Math.abs(suited[i] - rv) === 1) v += 1; // layoff fodder once down
    }
    return v;
  }
  function handUsefulness(hand, card) { return cardKeepValue(hand, card, null); }

  function botChooseDiscard(hand, need) {
    var best = null, bestScore = -1e9, i;
    for (i = 0; i < hand.length; i++) {
      var c = hand[i];
      var sc = cardPoints(c) * 2 - cardKeepValue(hand, c, need);
      if (isWild(c) && hand.length > 1) sc = -1e6; // keep wilds unless it's the last card
      if (sc > bestScore) { bestScore = sc; best = c; }
    }
    return best;
  }

  function botDrawChoice(hand, discardTop, need) {
    if (!discardTop) return "drawStock";
    if (isWild(discardTop)) return "drawDiscard";
    need = need || { sets: 1, runs: 1 };
    var r = rankOf(discardTop), s = suitOf(discardTop), rv = rankVal(r, true), i, useful = false;
    for (i = 0; i < hand.length; i++) {
      var c = hand[i];
      if (isWild(c)) continue;
      if (need.sets > 0 && rankOf(c) === r) { useful = true; break; }
      if (need.runs > 0 && suitOf(c) === s && Math.abs(rankVal(rankOf(c), true) - rv) <= 2) { useful = true; break; }
    }
    if (useful && Math.random() < 0.9) return "drawDiscard";
    if (!useful && Math.random() < 0.1) return "drawDiscard";
    return "drawStock";
  }

  // would this bot take the discard if it were their draw? -> they'd buy it
  function botWantsBuy(state, pid, card) {
    var hand = state.hands[pid];
    if (!hand || !card) return false;
    return botDrawChoice(hand, card, needsLeft(state, pid)) === "drawDiscard";
  }

  // full bot turn computed step-wise by the caller via botNextMove
  function botNextMove(state, pid) {
    var T = state.table, hand = state.hands[pid];
    if (T.phase !== "play" || T.turnPid !== pid) return null;
    if (T.turnStep === "draw") {
      if (T.dealNum === 7) {
        var combos = findMeldCombos(hand, 0, 3);
        var out = combos.some(function (cb) {
          var n = 0, allRuns = true, i;
          for (i = 0; i < cb.length; i++) { n += cb[i].cards.length; if (cb[i].type !== "run") allRuns = false; }
          return allRuns && n === hand.length && cb.length === 3;
        });
        if (out) return { t: "goOut7" };
      }
      var top = T.discard[T.discard.length - 1];
      return { t: botDrawChoice(hand, top, needsLeft(state, pid)) };
    }
    // play step
    if (!T.down[pid]) {
      var need = needsLeft(state, pid);
      var found = findMeldCombos(hand, need.sets, need.runs);
      if (found.length) {
        var combo = found[0];
        var usedCount = combo.reduce(function (a, m) { return a + m.cards.length; }, 0);
        if (hand.length - usedCount >= 1) {
          return { t: "layDown", melds: combo.map(function (m) { return { type: m.type, cards: m.cards }; }) };
        }
      }
    } else if (hand.length > 1 && T.downTurn[pid] !== T.turnNo) {
      // greedy layoff: first card that fits anywhere (never lay off the last card: must discard to go out)
      // (lay-offs open on the turn AFTER going down)
      for (var i = 0; i < hand.length; i++) {
        var c = hand[i];
        for (var mi = 0; mi < T.melds.length; mi++) {
          if (canLayOff(T.melds[mi], c)) return { t: "layOff", card: c, meldId: T.melds[mi].id };
        }
      }
    }
    // discard (keep one card back implicitly: we always discard exactly one)
    var d = botChooseDiscard(hand, needsLeft(state, pid));
    return { t: "discard", card: d };
  }

  return {
    RANKS: RANKS, SUITS: SUITS,
    isJoker: isJoker, isWild: isWild, rankOf: rankOf, suitOf: suitOf, rankVal: rankVal,
    cardPoints: cardPoints, cardName: cardName, isRed: isRed,
    deckSpec: deckSpec, buildDeck: buildDeck, shuffle: shuffle,
    CONTRACTS: CONTRACTS, contractFor: contractFor, contractText: contractText,
    dealSize: dealSize, contractSatisfied: contractSatisfied,
    analyzeMeld: analyzeMeld, canLayOff: canLayOff,
    findMeldCombos: findMeldCombos,
    runWildOptions: validRunPlacements, layOffWildOptions: layOffWildOptions,
    orderRunCards: orderRunCards, meldDisplayOrder: meldDisplayOrder,
    createDeal: createDeal, applyMove: applyMove, scoreDeal: scoreDeal,
    needsLeft: needsLeft, nextPid: nextPid, meldsOf: meldsOf,
    botNextMove: botNextMove, botChooseDiscard: botChooseDiscard, botDrawChoice: botDrawChoice,
    buyLimit: buyLimit, buyCandidates: buyCandidates, botWantsBuy: botWantsBuy,
    handUsefulness: handUsefulness
  };
});
