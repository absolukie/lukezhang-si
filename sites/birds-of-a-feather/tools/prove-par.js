'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var contentPath = path.join(__dirname, '..', 'content.js');
var C = require(contentPath);

function precedes(a, b) {
  return a.f < b.f || (a.f === b.f && a.h < b.h);
}

function Heap() { this.items = []; }
Heap.prototype.push = function (node) {
  var a = this.items;
  var i = a.length;
  a.push(node);
  while (i > 0) {
    var parent = Math.floor((i - 1) / 2);
    if (!precedes(node, a[parent])) break;
    a[i] = a[parent];
    i = parent;
  }
  a[i] = node;
};
Heap.prototype.pop = function () {
  var a = this.items;
  var first = a[0];
  var last = a.pop();
  if (a.length) {
    var i = 0;
    while (i * 2 + 1 < a.length) {
      var child = i * 2 + 1;
      if (child + 1 < a.length && precedes(a[child + 1], a[child])) child++;
      if (!precedes(a[child], last)) break;
      a[i] = a[child];
      i = child;
    }
    a[i] = last;
  }
  return first;
};

function words(cards) {
  return cards.map(function (card) { return card.w; });
}

function prove(level, deal, stats) {
  var names = level.flocks.map(function (flock) { return flock.name; }).sort();
  var quota = {};
  var fill = {};
  var homeByWord = Object.create(null);
  names.forEach(function (name) { quota[name] = 0; fill[name] = 0; });
  C.allCards(level).forEach(function (card) {
    homeByWord[card.w] = card.home;
    quota[card.home]++;
  });
  var N = deal.stock.length;
  deal.columns.forEach(function (col) { N += col.length; });
  var start = {
    stock: words(deal.stock), waste: [], cols: deal.columns.map(words),
    fill: fill, redealsUsed: 0
  };
  var closed = Object.create(null);
  var best = Object.create(null);
  var open = new Heap();
  stats.expansions = 0;
  stats.maxOpen = 0;

  function stateKey(state) {
    // Words are [a-z]+ (single lowercase), so ',' / '|' joins are unambiguous
    // and far cheaper than JSON.stringify at this call volume.
    var parts = [state.stock.join(','), state.waste.join(',')];
    for (var i = 0; i < 5; i++) parts.push(state.cols[i].join(','));
    parts.push(names.map(function (name) { return state.fill[name]; }).join(','));
    parts.push(state.redealsUsed);
    return parts.join('|');
  }

  function enqueue(state, g) {
    var key = stateKey(state);
    if (closed[key] || (best[key] !== undefined && best[key] <= g)) return;
    var homed = 0;
    names.forEach(function (name) { homed += state.fill[name]; });
    // h = unhomed + stockLeft. Admissible: every unhomed card needs >= 1
    // move, and every card still in the stock needs >= 1 draw on top of its
    // placement. Consistent for place (h drops by exactly 1) and draw
    // (h drops by exactly 1); a redeal raises h, so redeal successors always
    // have f > f* and are enqueued but never expanded — the closed set is
    // therefore only ever populated via consistent moves and stays sound.
    var h = (N - homed) + state.stock.length;
    best[key] = g;
    open.push({ state: state, key: key, g: g, h: h, f: g + h });
    stats.maxOpen = Math.max(stats.maxOpen, open.items.length);
  }

  function copy(state) {
    var nextFill = {};
    names.forEach(function (name) { nextFill[name] = state.fill[name]; });
    return {
      stock: state.stock.slice(), waste: state.waste.slice(),
      cols: state.cols.map(function (col) { return col.slice(); }),
      fill: nextFill, redealsUsed: state.redealsUsed
    };
  }

  // A wrong placement costs a move (and a feather in the real game), yet
  // the card must still be homed into its true nest afterwards. A wrongly
  // tapped card stays exposed where it was. Deleting that wrong move from
  // any solution yields a strictly shorter feasible solution. Hence no
  // shortest solution contains a wrong placement: generate only true homes.
  function place(state, col, g) {
    var pile = col < 0 ? state.waste : state.cols[col];
    if (!pile.length) return;
    var home = homeByWord[pile[pile.length - 1]];
    if (!(state.fill[home] < quota[home])) {
      throw new Error('QUOTA INVARIANT VIOLATED: ' + home + ' fill=' +
        state.fill[home] + ' quota=' + quota[home]);
    }
    var next = copy(state);
    (col < 0 ? next.waste : next.cols[col]).pop();
    next.fill[home]++;
    enqueue(next, g + 1);
  }

  enqueue(start, 0);
  while (open.items.length) {
    var node = open.pop();
    if (closed[node.key] || best[node.key] !== node.g) continue;
    // Consistency makes the first expansion final; no reopening is needed.
    closed[node.key] = true;
    if (node.h === 0) return node.g;
    stats.expansions++;
    var state = node.state;
    place(state, -1, node.g);
    for (var i = 0; i < 5; i++) place(state, i, node.g);
    var next;
    // Draw only onto an empty waste. Lemma: some optimal solution never
    // draws while the waste is nonempty. Proof: take an optimal solution
    // and its first draw D onto a nonempty waste (top W, drawn card X).
    // W sits under X, so the solution later places X then W. Swap to
    // (place W, draw X, place X): the same 3 moves, and the resulting
    // state is identical (waste minus W, stock minus X, both homed), so
    // the rest of the solution still applies — the quota invariant keeps
    // the early placement of W legal. Repeating eliminates every such
    // draw without changing the length. Hence restricting draws to empty
    // waste preserves the optimum, and the waste never holds > 1 card.
    if (state.stock.length && state.waste.length === 0) {
      next = copy(state);
      next.waste.push(next.stock.shift()); // stock[0] first; waste top last.
      enqueue(next, node.g + 1);
    } else if (!state.stock.length && state.waste.length && state.redealsUsed < 2) {
      next = copy(state);
      next.stock = state.waste.slice(); // Same order, never reversed.
      next.waste = [];
      next.redealsUsed++;
      enqueue(next, node.g + 1);
    }
  }
  return Infinity;
}

function main() {
  var started = Date.now();
  var pars = {};
  var totalExpansions = 0;
  var maxExpansions = 0;
  var maxOpen = 0;
  var runs = 0;

  function check(level, key) {
    // dealLayout shuffles allCards with mulberry32(dealSeed(key)), deals
    // min(15, N) cards into columns[i % 5] bottom..top, then retains stock order.
    var deal = C.dealLayout(level, key);
    var N = deal.stock.length;
    deal.columns.forEach(function (col) { N += col.length; });
    // Every tableau card needs one placement; each stock card also needs a
    // draw. Placing waste-top before drawing again attains this lower bound,
    // leaving waste empty when stock drains, so no redeal is ever necessary.
    var expected = N + Math.max(0, N - 15);
    var stats = {};
    var got = prove(level, deal, stats);
    if (!isFinite(got) || got !== expected) {
      console.error('FAIL level=' + level.id + ' key=' + key + ' N=' + N +
        ' expected=' + expected + ' got=' + got);
      process.exit(1);
    }
    runs++;
    totalExpansions += stats.expansions;
    maxExpansions = Math.max(maxExpansions, stats.expansions);
    maxOpen = Math.max(maxOpen, stats.maxOpen);
    return got;
  }

  for (var n = 1; n <= 200; n++) pars[n] = check(C.getLevel(n), n);
  for (var d = 0; d < 90; d++) {
    var ds = new Date(Date.UTC(2026, 9, 4 + d)).toISOString().slice(0, 10);
    check(C.dailyLevel(ds), 'daily:' + ds);
  }
  var cert = {
    digest: crypto.createHash('sha256').update(fs.readFileSync(contentPath)).digest('hex'),
    date: new Date().toISOString()
  };
  // Window-preferring wrapper: in Node the test sets global.window = {}
  // before require(), so `window` must win over `self`/`this` (which would
  // resolve to module.exports in Node and strand BoFPar off window).
  var output = '/* generated by tools/prove-par.js — do not hand-edit */\n' +
    '(function (root) {\n' +
    '  \'use strict\';\n' +
    '  root.BoFPar = ' + JSON.stringify(pars) + ';\n' +
    '  root.BoFParCert = ' + JSON.stringify(cert) + ';\n' +
    '})(typeof window !== \'undefined\' ? window : (typeof self !== \'undefined\' ? self : this));\n';
  fs.writeFileSync(path.join(__dirname, '..', 'par.js'), output);
  var values = Object.keys(pars).map(function (id) { return pars[id]; });
  var sum = values.reduce(function (a, b) { return a + b; }, 0);
  console.log('Par min / max / avg: ' + Math.min.apply(null, values) + ' / ' +
    Math.max.apply(null, values) + ' / ' + (sum / values.length).toFixed(2));
  console.log('A* total node expansions: ' + totalExpansions +
    '; average expansions per run: ' + (totalExpansions / runs).toFixed(2) +
    '; max expansions in one run: ' + maxExpansions +
    '; max open-list size: ' + maxOpen);
  console.log('Total runtime: ' + ((Date.now() - started) / 1000).toFixed(3) + ' seconds');
  console.log('PASS: all 200 campaign levels and 90 daily deals proved optimal.');
}

if (require.main === module) main();
