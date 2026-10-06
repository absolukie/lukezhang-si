/* Birds of a Feather — content engine.
 * Word pools, hand-authored levels, seeded level generator, and the
 * quota-elimination solver used to prove every level has a unique,
 * deducible solution. UMD: works in the browser (window.BoFContent)
 * and in Node (module.exports) for the solver test.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BoFContent = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Word pools. Entry is either "word" (unambiguous) or
   * ["word", "OtherTheme"] / ["word", ["T1","T2"]] for ambiguous words
   * that legitimately belong to more than one theme.
   * ------------------------------------------------------------------ */
  var POOLS = {
    Fruits: ['apple', 'banana', 'mango', 'peach', 'grape', 'lemon', 'cherry', 'plum', 'pear', 'melon', ['kiwi', 'Birds'], ['orange', 'Colors'], ['olive', 'Colors']],
    Colors: ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'brown', 'black', 'white', 'gray', ['orange', 'Fruits'], ['violet', 'Flowers'], ['rose', 'Flowers']],
    Animals: ['cat', 'dog', 'horse', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'frog', 'panda', ['turkey', 'Countries'], ['bat', 'Sports'], ['crane', 'Vehicles'], ['calf', 'Body'], ['ram', 'Tools']],
    Sports: ['soccer', 'tennis', 'golf', 'rugby', 'hockey', 'skiing', 'bowling', 'karate', ['bat', 'Animals'], ['cricket', 'Insects'], ['glove', 'Clothes'], ['net', 'Sea'], ['track', 'Music'], ['pitch', 'Music'], ['torch', 'Tools'], 'ring', ['bell', 'Music'], ['whistle', 'Music'], 'cage', ['coach', 'Vehicles']],
    Countries: ['japan', 'brazil', 'france', 'egypt', 'india', 'spain', 'italy', 'mexico', 'canada', 'peru', 'norway', ['turkey', 'Animals']],
    Food: ['pizza', 'sushi', 'taco', 'pasta', 'burger', 'salad', 'sandwich', 'soup', 'curry', 'bread', 'noodles', ['sage', 'Colors'], ['jam', 'Music'], 'jelly', ['drumstick', 'Music'], ['relish', 'Emotions'], ['mustard', 'Colors'], 'dressing'],
    Vegetables: ['carrot', 'potato', 'onion', 'corn', 'peas', 'beans', 'cabbage', 'celery', 'garlic', ['pepper', 'Food'], 'spinach', 'broccoli'],
    Flowers: ['tulip', 'daisy', 'lily', 'daffodil', 'orchid', 'poppy', 'marigold', 'sunflower', 'lavender', ['rose', 'Colors'], ['violet', 'Colors'], ['iris', 'Body']],
    Music: ['piano', 'guitar', 'violin', 'flute', 'trumpet', 'harp', 'cello', 'drums', 'saxophone', 'clarinet', ['bass', 'Sea'], ['scale', 'Sea'], ['record', 'Sports'], ['blues', 'Emotions'], ['tone', 'Body'], ['organ', 'Body'], ['keys', 'Tools']],
    Sea: ['tuna', 'shark', 'whale', 'crab', 'shrimp', 'octopus', 'clam', 'lobster', 'squid', 'dolphin', ['bass', 'Music'], ['salmon', 'Colors'], ['coral', 'Colors'], 'shell', 'mussel', ['surf', 'Sports'], ['dive', 'Sports'], ['port', 'Drinks'], ['hook', 'Sports'], ['tackle', 'Sports'], ['reel', 'Music'], ['cod', ['Animals', 'Food']], ['trout', ['Animals', 'Food']], ['herring', 'Food'], ['sardine', 'Food'], 'anchovy', 'mackerel', 'halibut', 'haddock', 'flounder', 'snapper', 'carp', 'perch', 'catfish', 'swordfish'],
    Desserts: ['cake', 'pie', 'cookie', 'brownie', 'muffin', 'donut', 'pudding', 'fudge', 'tart', 'gelato', 'cupcake', 'eclair', ['chocolate', ['Colors', 'Food']], ['caramel', ['Colors', 'Food']], 'toffee', 'candy', ['nougat', 'Food'], 'marshmallow', ['truffle', 'Food'], 'praline', 'bonbon', 'lollipop', 'licorice', 'gumdrop', 'brittle', 'butterscotch'],
    Drinks: ['coffee', 'tea', 'juice', 'soda', 'water', 'milk', 'lemonade', 'cocoa', 'smoothie', 'cider', 'mocha', 'punch', ['cup', 'Sports'], ['shot', 'Sports'], ['round', 'Sports'], ['mixer', 'Music'], ['finish', 'Sports'], ['tap', 'Tools'], ['ice', 'Weather'], ['dry', 'Weather'], ['bitter', 'Emotions'], ['sour', 'Emotions'], 'vintage', ['amber', 'Colors'], 'rocks', ['cork', 'Trees'], ['head', 'Body'], ['body', 'Body']],
    Clothes: ['shirt', 'pants', 'jacket', 'socks', 'shoes', 'hat', 'scarf', 'gloves', 'sweater', 'boots', 'dress', ['belt', 'Sports'], ['cap', 'Sports'], ['robe', 'Sports'], ['heel', 'Body'], 'collar', 'coat', 'sneaker', 'sandal', 'slipper', 'loafer', 'moccasin', 'clog', 'stocking', ['cleat', 'Sports'], ['pump', 'Tools'], ['mule', 'Animals']],
    Body: ['hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'hair', 'tooth', 'finger', 'knee', 'elbow', 'heart', ['nails', 'Tools']],
    Weather: ['rain', 'snow', 'storm', 'fog', 'wind', 'thunder', 'frost', 'hail', 'cloud', 'breeze', 'sleet', 'drizzle', ['bolt', 'Tools'], ['spring', 'Tools'], 'flake'],
    Space: ['planet', 'star', 'moon', 'comet', 'asteroid', 'galaxy', 'rocket', 'orbit', 'crater', 'eclipse', 'nebula', 'satellite', ['sun', 'Weather']],
    Tools: [['hammer', 'Music'], 'saw', 'drill', 'wrench', 'screwdriver', 'pliers', 'ladder', 'tape', 'chisel', 'level', ['nails', 'Body'], ['nut', 'Food'], ['plane', 'Vehicles']],
    Vehicles: ['car', 'truck', 'bus', ['train', 'Clothes'], 'bike', 'boat', ['plane', 'Tools'], 'ship', 'subway', 'scooter', 'helicopter', ['crane', 'Animals']],
    Insects: ['ant', 'bee', 'beetle', 'butterfly', 'moth', 'wasp', 'ladybug', 'dragonfly', 'firefly', 'grasshopper', ['cricket', 'Sports']],
    Birds: ['robin', 'sparrow', 'eagle', 'owl', 'hawk', 'finch', 'crow', 'dove', 'pelican', 'penguin', 'flamingo', 'swallow'],
    Professions: ['doctor', 'teacher', 'chef', 'pilot', 'farmer', 'nurse', 'baker', 'driver', 'artist', 'writer', 'singer', 'dancer'],
    Emotions: ['happy', 'sad', 'angry', 'calm', 'excited', 'nervous', 'proud', 'shy', 'brave', 'lonely', 'curious', 'jealous'],
    Gems: ['ruby', 'emerald', ['diamond', 'Sports'], 'sapphire', 'opal', ['pearl', 'Sea'], 'topaz', 'amethyst', 'jade', 'quartz', 'garnet', 'onyx'],
    Trees: ['oak', 'pine', 'maple', 'birch', 'willow', 'cedar', 'palm', 'redwood', 'elm', 'ash', 'spruce', ['cherry', 'Fruits']],
    Mammals: ['cow', ['rabbit', ['Animals', 'Food']], ['pig', ['Animals', 'Food']], ['goat', ['Animals', 'Food']], ['sheep', ['Animals', 'Food']], 'donkey', ['zebra', 'Animals'], ['lion', 'Animals'], 'giraffe', 'elephant', 'leopard', 'monkey', 'otter', 'badger', 'squirrel', 'hedgehog'],
    Metals: [['gold', 'Colors'], ['silver', 'Colors'], ['bronze', 'Colors'], ['copper', 'Colors'], 'lead', 'tin', 'iron', 'steel', 'zinc', 'nickel', 'aluminum', 'titanium', 'platinum', 'brass'],
    Fabrics: ['cotton', 'linen', 'silk', 'wool', ['denim', 'Clothes'], 'velvet', 'satin', 'fleece', 'nylon', 'polyester', 'canvas', ['flannel', 'Clothes'], 'tweed', 'felt'],
    Shapes: ['circle', ['square', 'Tools'], 'triangle', 'rectangle', 'oval', 'cube', 'sphere', ['cone', 'Desserts'], 'cylinder', 'pyramid', 'hexagon', 'octagon', 'crescent', ['cross', 'Emotions']],
    Furniture: ['chair', 'table', 'desk', 'sofa', 'couch', 'stool', 'bench', 'bed', 'dresser', 'wardrobe', 'cabinet', 'bookcase', 'cupboard', 'ottoman', ['chest', 'Body'], ['rocker', 'Music']],
    Spices: [['cinnamon', 'Food'], 'cumin', 'paprika', 'turmeric', 'ginger', ['nutmeg', 'Food'], 'clove', 'saffron', 'cardamom', 'coriander', 'anise', 'allspice', 'vanilla', 'fennel'],
    Stationery: [['pencil', 'Tools'], 'pen', ['marker', 'Tools'], 'eraser', 'notebook', 'journal', 'diary', 'envelope', 'paper', 'ink', ['ruler', 'Tools'], ['stapler', 'Tools'], 'binder', 'folder', 'clipboard', 'highlighter']
  };

  var THEME_NAMES = Object.keys(POOLS);
  // Keep the original shuffle input and RNG sequence for levels 1..60 and dailies.
  var LEGACY_THEME_NAMES = THEME_NAMES.slice(0, 24);

  /* ------------------------- seeded RNG ------------------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function normEntry(theme, e) {
    if (typeof e === 'string') return { w: e, also: [] };
    var also = Array.isArray(e[1]) ? e[1].slice() : [e[1]];
    return { w: e[0], also: also };
  }

  /* ------------------------- hand levels ------------------------ *
   * spec: [flockName, [ "word" | ["word","AlsoTheme"], ... ]]
   * Card home = the flock it is listed under; cands = [home, ...also].
   */
  function hand(name, feathers, spec) {
    return {
      name: name,
      feathers: feathers,
      flocks: spec.map(function (pair) {
        var fname = pair[0];
        return {
          name: fname,
          cards: pair[1].map(function (wd) {
            if (typeof wd === 'string') return { w: wd, cands: [fname] };
            return { w: wd[0], cands: [fname].concat(wd[1]) };
          })
        };
      })
    };
  }

  var HAND_LEVELS = [
    hand('First Flight', 5, [
      ['Fruits', ['apple', 'banana']],
      ['Animals', ['cat', 'dog']],
      ['Colors', ['red', 'blue']],
      ['Sports', ['soccer', 'tennis']]
    ]),
    hand('Warming Up', 5, [
      ['Fruits', ['apple', 'mango', 'pear']],
      ['Animals', ['cat', 'horse', 'frog']],
      ['Colors', ['red', 'green']],
      ['Music', ['piano', 'guitar']]
    ]),
    hand('Longer Days', 5, [
      ['Food', ['pizza', 'sushi', 'taco']],
      ['Clothes', ['shirt', 'hat', 'socks']],
      ['Weather', ['rain', 'snow', 'wind']],
      ['Space', ['moon', 'star', 'comet']]
    ]),
    hand('Tight Twigs', 4, [
      ['Desserts', ['cake', 'pie', 'cookie']],
      ['Drinks', ['coffee', 'tea', 'juice']],
      ['Insects', ['ant', 'bee', 'spider']],
      ['Tools', ['hammer', 'saw', 'drill']]
    ]),
    hand('Full Flock', 4, [
      ['Birds', ['robin', 'owl', 'eagle', 'dove']],
      ['Sea', ['salmon', 'tuna', 'crab', 'clam']],
      ['Trees', ['oak', 'pine', 'maple', 'birch']],
      ['Gems', ['ruby', 'opal', 'pearl', 'jade']]
    ]),
    hand('A Riddle Appears', 5, [
      ['Fruits', ['apple', 'banana', ['orange', 'Colors']]],
      ['Colors', ['red', 'blue', 'green']],
      ['Animals', ['cat', 'dog']],
      ['Sports', ['soccer', 'tennis']]
    ]),
    hand('Two Riddles', 5, [
      ['Fruits', ['apple', ['orange', 'Colors']]],
      ['Colors', ['red', 'blue', ['violet', 'Flowers']]],
      ['Flowers', ['tulip', 'daisy']],
      ['Animals', ['cat', 'dog', 'fox']]
    ]),
    hand('Busy Skies', 4, [
      ['Music', ['piano', 'guitar', ['bass', 'Sea']]],
      ['Sea', ['salmon', 'tuna', 'shark']],
      ['Sports', ['soccer', ['bat', 'Animals']]],
      ['Animals', ['cat', 'dog']]
    ]),
    hand('Crosswinds', 4, [
      ['Countries', ['japan', 'brazil', ['turkey', 'Animals']]],
      ['Animals', ['cat', 'dog', 'frog']],
      ['Food', ['pizza', 'sushi', 'taco']],
      ['Colors', ['red', 'blue']]
    ]),
    hand('Headwinds', 4, [
      ['Tools', ['hammer', 'saw', ['nails', 'Body']]],
      ['Body', ['hand', 'eye', 'foot']],
      ['Insects', ['ant', 'bee', ['cricket', 'Sports']]],
      ['Sports', ['soccer', 'tennis']]
    ]),
    hand('Storm Front', 3, [
      ['Vehicles', ['car', 'bus', ['crane', 'Animals']]],
      ['Animals', ['cat', 'dog', 'fox']],
      ['Trees', ['oak', 'pine', ['cherry', 'Fruits']]],
      ['Fruits', ['apple', 'banana']]
    ]),
    hand('Flock Logic', 3, [
      ['Flowers', ['tulip', 'daisy', ['violet', 'Colors']]],
      ['Colors', ['red', 'blue', 'green', ['orange', 'Fruits']]],
      ['Fruits', ['apple', 'banana', 'mango']],
      ['Animals', ['cat', 'dog', 'horse', 'frog']]
    ]),
    hand('Gale Force', 3, [
      ['Sea', ['salmon', 'tuna', ['bass', 'Music']]],
      ['Music', ['piano', 'guitar', 'violin', 'flute']],
      ['Sports', ['soccer', 'tennis', ['cricket', 'Insects']]],
      ['Insects', ['ant', 'bee', 'spider', 'wasp']]
    ]),
    hand('The Murmuration', 3, [
      ['Animals', ['cat', 'dog', ['bat', 'Sports'], ['turkey', 'Countries']]],
      ['Sports', ['soccer', 'tennis', 'golf']],
      ['Countries', ['japan', 'brazil', 'france']],
      ['Fruits', ['apple', 'banana', 'cherry']]
    ]),
    hand('Migration Day', 3, [
      ['Birds', ['robin', 'owl', 'eagle']],
      ['Vehicles', ['car', 'bus', ['crane', 'Animals']]],
      ['Animals', ['cat', 'dog', 'fox']],
      ['Food', ['pizza', 'sushi', ['turkey', 'Animals'], 'salad']]
    ])
  ];

  /* ------------------------- solver ----------------------------- *
   * Quota-elimination proof: repeatedly apply
   *  1. a card with exactly one viable flock must go there, and
   *  2. a flock whose remaining quota equals the number of unassigned
   *     cards that could fill it must take all of them.
   * A level is "deducible" iff this fully assigns every card.
   */
  function solveLevel(level) {
    var rem = {};
    level.flocks.forEach(function (f) { rem[f.name] = f.cards.length; });
    var cards = [];
    level.flocks.forEach(function (f) {
      f.cards.forEach(function (c) {
        cards.push({ w: c.w, cands: c.cands.slice(), home: f.name, flock: null });
      });
    });
    var progress = true, guard = 0;
    while (progress && guard++ < 1000) {
      progress = false;
      var i, c, viable;
      for (i = 0; i < cards.length; i++) {
        c = cards[i];
        if (c.flock) continue;
        viable = c.cands.filter(function (n) { return rem[n] > 0; });
        if (viable.length === 0) return { ok: false, reason: 'no viable flock for ' + c.w };
        if (viable.length === 1) {
          c.flock = viable[0]; rem[viable[0]]--; progress = true;
        }
      }
      for (var fi = 0; fi < level.flocks.length; fi++) {
        var fname = level.flocks[fi].name;
        var k = rem[fname];
        if (k <= 0) continue;
        var S = cards.filter(function (cc) {
          return !cc.flock && cc.cands.indexOf(fname) !== -1;
        });
        if (S.length === k) {
          S.forEach(function (cc) { cc.flock = fname; });
          rem[fname] = 0; progress = true;
        }
      }
    }
    var unassigned = cards.filter(function (c) { return !c.flock; });
    if (unassigned.length) {
      return { ok: false, reason: 'stalled', unassigned: unassigned.map(function (c) { return c.w; }) };
    }
    var mismatched = cards.filter(function (c) { return c.flock !== c.home; });
    return { ok: true, mismatched: mismatched.map(function (c) { return c.w + '->' + c.flock; }) };
  }

  /* ------------------------- generator -------------------------- */
  function tryBuild(themes, quotas, ambTarget, rng, tripleTarget) {
    var wordsByTheme = {};
    themes.forEach(function (th) {
      wordsByTheme[th] = shuffle(POOLS[th].map(function (e) { return normEntry(th, e); }), rng);
    });
    var used = {};
    var cross = [];
    themes.forEach(function (th) {
      wordsByTheme[th].forEach(function (e) {
        if (e.also.length && e.also.every(function (a) { return themes.indexOf(a) !== -1; }) && !used[e.w]) {
          cross.push({ w: e.w, home: th, also: e.also });
        }
      });
    });
    var chosen = [];
    var scross = shuffle(cross, rng);
    // Reserve part of the ambiguous budget for three-flock cards when available.
    // cross already requires every alternate to be among this level's themes.
    var tripleCount = 0;
    for (var di = 0; di < scross.length && tripleCount < tripleTarget && chosen.length < ambTarget; di++) {
      if (scross[di].also.length === 2 && !used[scross[di].w]) {
        used[scross[di].w] = true;
        chosen.push(scross[di]);
        tripleCount++;
      }
    }
    for (var ci = 0; ci < scross.length && chosen.length < ambTarget; ci++) {
      if (scross[ci].also.length === 1 && !used[scross[ci].w]) {
        used[scross[ci].w] = true; chosen.push(scross[ci]);
      }
    }
    if (chosen.length < ambTarget) return null;
    var flocks = [];
    for (var ti = 0; ti < themes.length; ti++) {
      var th = themes[ti];
      var cards = [];
      chosen.forEach(function (c) {
        if (c.home === th) cards.push({ w: c.w, cands: [th].concat(c.also) });
      });
      if (cards.length > quotas[ti]) return null;
      var pool = wordsByTheme[th];
      for (var pi = 0; pi < pool.length && cards.length < quotas[ti]; pi++) {
        var e = pool[pi];
        if (used[e.w]) continue;
        if (e.also.length && e.also.some(function (a) { return themes.indexOf(a) !== -1; })) continue;
        used[e.w] = true;
        cards.push({ w: e.w, cands: [th] });
      }
      if (cards.length < quotas[ti]) return null;
      flocks.push({ name: th, cards: cards });
    }
    return { flocks: flocks };
  }

  function generateFromSeed(seed, t, feathers, tripleTarget) {
    // An explicit fourth argument opts into the expanded campaign pools.
    var themeNames = tripleTarget === undefined ? LEGACY_THEME_NAMES : THEME_NAMES;
    tripleTarget = t > 1.1 ? (tripleTarget || 0) : 0;
    var totalCards = Math.min(25, Math.round(16 + t * 9));
    var ambFull = Math.round(1 + t * 6);
    var attempts = t > 1 ? 120 : 60;
    var tripleSets = [];
    if (tripleTarget > 0) {
      themeNames.forEach(function (th) {
        POOLS[th].forEach(function (entry) {
          var e = normEntry(th, entry);
          if (e.also.length === 2) tripleSets.push([th].concat(e.also));
        });
      });
    }
    for (var amb = ambFull; amb >= 0; amb--) {
      for (var attempt = 0; attempt < attempts; attempt++) {
        var rng = mulberry32((seed + attempt * 100003 + amb * 977) >>> 0);
        var themes = shuffle(themeNames, rng).slice(0, 4);
        // Give endgame triples regular opportunities without removing the
        // ordinary theme draws or the ambiguity-degradation fallback.
        if (tripleSets.length && attempt % 3 === 0) {
          var tripleThemes = tripleSets[Math.floor(rng() * tripleSets.length)];
          themes = tripleThemes.concat(themes.filter(function (th) {
            return tripleThemes.indexOf(th) === -1;
          })).slice(0, 4);
        }
        var quotas = [3, 3, 3, 3];
        var rest = totalCards - 12, qi, guard = 0;
        while (rest > 0 && guard++ < 200) {
          qi = Math.floor(rng() * 4);
          if (quotas[qi] < 8) { quotas[qi]++; rest--; }
        }
        if (rest > 0) continue;
        var lv = tryBuild(themes, quotas, amb, rng, tripleTarget);
        if (!lv) continue;
        lv.feathers = feathers;
        var s = solveLevel(lv);
        if (s.ok && s.mismatched.length === 0) return lv;
      }
    }
    return null;
  }

  function getLevel(n) {
    var lv;
    if (n >= 1 && n <= HAND_LEVELS.length) {
      lv = JSON.parse(JSON.stringify(HAND_LEVELS[n - 1]));
    } else if (n >= 61 && n <= 200) {
      var t2;
      if (n <= 80) t2 = 0.35 + (n - 61) / 19 * 0.25;
      else if (n <= 120) t2 = 0.60 + (n - 81) / 39 * 0.30;
      else if (n <= 160) t2 = 0.90 + (n - 121) / 39 * 0.20;
      else t2 = 1.10 + (n - 161) / 39 * 0.40;
      var tripleTarget = t2 > 1.1 ? 1 + Math.round((t2 - 1.1) * 3) : 0;
      lv = generateFromSeed(n * 7919 + 11, t2, n <= 80 ? 4 : 3, tripleTarget);
      if (!lv) throw new Error('generator failed for level ' + n);
    } else {
      var t = (n - 16) / 44;                          // 0..1 across 16..60
      var feathers = n < 28 ? 5 : (n < 44 ? 4 : 3);
      lv = generateFromSeed(n * 7919 + 11, t, feathers);
      if (!lv) throw new Error('generator failed for level ' + n);
    }
    lv.id = n;
    if (!lv.name) lv.name = 'Level ' + n;
    return lv;
  }

  function dailyLevel(dateStr) {
    var seed = parseInt(dateStr.replace(/-/g, ''), 10);
    var lv = generateFromSeed((seed * 131 + 7) >>> 0, 0.35, 4);
    if (!lv) throw new Error('generator failed for daily ' + dateStr);
    lv.id = 'daily-' + dateStr;
    lv.name = 'Daily Migration';
    return lv;
  }

  function allCards(level) {
    var out = [];
    level.flocks.forEach(function (f) {
      f.cards.forEach(function (c) { out.push({ w: c.w, home: f.name, cands: c.cands.slice() }); });
    });
    return out;
  }

  /* ------------------------- v2 deal + par --------------------------- *
   * v2 adds a Klondike-style draw pile: the first 15 cards of the seeded
   * deck form a 5x3 tableau dealt round-robin; the remainder is a stock
   * drawn one card at a time to a waste pile (2 redeals per level).
   * The player may place the waste-top or any column-top into a nest.
   * Structural fact: any exposed card can always be placed into its true
   * home because quotas are exact, so every deal is solvable and the
   * optimal cost is N placements + S draws (S = stock size).
   */

  // uint32 hash of the deal key. Body copied verbatim from the seedFor
  // helper in index.html so browser deals and this module agree.
  function dealSeed(key) {
    if (typeof key === 'number') return (key * 131 + 7) >>> 0;
    var h = 0; for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return h;
  }

  // Deterministic deal: first 15 cards of the seeded shuffled deck go
  // round-robin into 5 columns (bottom..top; last element = playable top),
  // the rest is the stock with stock[0] = next drawn.
  function dealLayout(levelObj, key) {
    var cards = allCards(levelObj).map(function (c, i) {
      return { uid: i, w: c.w, home: c.home, cands: c.cands };
    });
    var deck = shuffle(cards, mulberry32(dealSeed(key)));
    var columns = [[], [], [], [], []];
    var n = Math.min(15, deck.length);
    for (var i = 0; i < n; i++) columns[i % 5].push(deck[i]);
    return { columns: columns, stock: deck.slice(15) };
  }

  // Oracle hint for the current deal state:
  //   gs = { wasteTop: card|null, stockLeft: int, colTops: [card|null x5] }
  // Placing the waste-top before drawing again keeps the waste empty and
  // is optimal: every exposed card can always go straight home, so a draw
  // never unlocks anything and merely defers a mandatory placement.
  function oracleFor(gs) {
    if (!gs.wasteTop && gs.stockLeft > 0) return { type: 'draw' };
    if (gs.wasteTop) return { type: 'place-waste', home: gs.wasteTop.home };
    for (var i = 0; i < 5; i++) {
      if (gs.colTops[i]) return { type: 'place-col', col: i, home: gs.colTops[i].home };
    }
    return null; // nothing exposed: level is over or the deal is broken
  }

  // Par for a deal: N + max(0, N-15). Proved optima for campaign levels
  // ship in par.js (window.BoFPar) so the game never recomputes them.
  function parFor(levelObj, key) {
    if (typeof levelObj.id === 'number' && levelObj.id >= 1 && levelObj.id <= 200 &&
        typeof window !== 'undefined' && window.BoFPar) {
      return window.BoFPar[levelObj.id];
    }
    var N = allCards(levelObj).length;
    return N + Math.max(0, N - 15);
  }

  var EMOJI = {
   "allspice": "🧂",
   "aluminum": "🥫",
   "amber": "🟠",
   "amethyst": "🔮",
   "anchovy": "🐟",
   "angry": "😠",
   "anise": "✳️",
   "ant": "🐜",
   "apple": "🍎",
   "artist": "🧑‍🎨",
   "ash": "🌫️",
   "asteroid": "☄️",
   "badger": "🦡",
   "baker": "🧑‍🍳",
   "banana": "🍌",
   "bass": "🐟",
   "bat": "🦇",
   "beans": "🫘",
   "bear": "🐻",
   "bed": "🛏️",
   "bee": "🐝",
   "beetle": "🪲",
   "bell": "🔔",
   "belt": "🥋",
   "bench": "🪑",
   "bike": "🚲",
   "binder": "📒",
   "birch": "🌳",
   "bitter": "😖",
   "black": "⚫",
   "blue": "🔵",
   "blues": "🎷",
   "boat": "⛵",
   "bolt": "🔩",
   "bonbon": "🍬",
   "bookcase": "📚",
   "boots": "👢",
   "bowling": "🎳",
   "brass": "🎺",
   "brave": "🦁",
   "brazil": "💃",
   "bread": "🍞",
   "breeze": "🍃",
   "brittle": "🍘",
   "broccoli": "🥦",
   "bronze": "🥉",
   "brown": "🟤",
   "brownie": "🍫",
   "burger": "🍔",
   "bus": "🚌",
   "butterfly": "🦋",
   "butterscotch": "🍬",
   "cabbage": "🥬",
   "cabinet": "🗄️",
   "cage": "🪤",
   "cake": "🎂",
   "calf": "🐄",
   "calm": "😌",
   "canada": "🍁",
   "candy": "🍬",
   "canvas": "🖼️",
   "cap": "🧢",
   "car": "🚗",
   "caramel": "🍬",
   "cardamom": "🫘",
   "carp": "🐟",
   "carrot": "🥕",
   "cat": "🐈",
   "catfish": "🐟",
   "cedar": "🌲",
   "celery": "🥬",
   "cello": "🎻",
   "chair": "🪑",
   "chef": "👨‍🍳",
   "cherry": "🍒",
   "chest": "🧰",
   "chisel": "🪛",
   "chocolate": "🍫",
   "cider": "🍺",
   "cinnamon": "🪵",
   "circle": "⭕",
   "clam": "🐚",
   "clarinet": "🪈",
   "cleat": "👟",
   "clipboard": "📋",
   "clog": "👞",
   "cloud": "☁️",
   "clove": "🌰",
   "coach": "🏋️",
   "coat": "🧥",
   "cocoa": "☕",
   "cod": "🐟",
   "coffee": "☕",
   "collar": "👔",
   "comet": "☄️",
   "cone": "🍦",
   "cookie": "🍪",
   "copper": "🪙",
   "coral": "🪸",
   "coriander": "🌿",
   "cork": "🍾",
   "corn": "🌽",
   "cotton": "☁️",
   "couch": "🛋️",
   "cow": "🐄",
   "crab": "🦀",
   "crane": "🏗️",
   "crater": "🌋",
   "crescent": "🌙",
   "cricket": "🦗",
   "cross": "✝️",
   "crow": "🐦‍⬛",
   "cube": "🧊",
   "cumin": "🧂",
   "cup": "☕",
   "cupboard": "🗄️",
   "cupcake": "🧁",
   "curious": "🧐",
   "curry": "🍛",
   "cylinder": "🛢️",
   "daffodil": "🌼",
   "daisy": "🌼",
   "dancer": "💃",
   "deer": "🦌",
   "denim": "👖",
   "desk": "🧑‍💻",
   "diamond": "💎",
   "diary": "📔",
   "dive": "🤿",
   "doctor": "🧑‍⚕️",
   "dog": "🐕",
   "dolphin": "🐬",
   "donkey": "🫏",
   "donut": "🍩",
   "dove": "🕊️",
   "dragonfly": "🪰",
   "dress": "👗",
   "dresser": "🗄️",
   "dressing": "🥗",
   "drill": "🛠️",
   "driver": "🏎️",
   "drizzle": "🌦️",
   "drums": "🥁",
   "drumstick": "🍗",
   "dry": "🏜️",
   "eagle": "🦅",
   "ear": "👂",
   "eclair": "🥖",
   "eclipse": "🌑",
   "egypt": "🔺",
   "elbow": "💪",
   "elephant": "🐘",
   "elm": "🌳",
   "emerald": "💚",
   "envelope": "✉️",
   "eraser": "🧽",
   "excited": "🤩",
   "eye": "👁️",
   "farmer": "🧑‍🌾",
   "felt": "🧶",
   "fennel": "🌿",
   "finch": "🐦",
   "finger": "👆",
   "finish": "🏁",
   "firefly": "🐛",
   "flake": "❄️",
   "flamingo": "🦩",
   "flannel": "👕",
   "fleece": "🐑",
   "flounder": "🐟",
   "flute": "🪈",
   "fog": "🌫️",
   "folder": "📁",
   "foot": "🦶",
   "fox": "🦊",
   "france": "🥐",
   "frog": "🐸",
   "frost": "❄️",
   "fudge": "🍫",
   "galaxy": "🌌",
   "garlic": "🧄",
   "garnet": "🔴",
   "gelato": "🍨",
   "ginger": "🫚",
   "giraffe": "🦒",
   "glove": "🧤",
   "gloves": "🧤",
   "goat": "🐐",
   "gold": "🥇",
   "golf": "⛳",
   "grape": "🍇",
   "grasshopper": "🦗",
   "gray": "🩶",
   "green": "🟢",
   "guitar": "🎸",
   "gumdrop": "🍬",
   "haddock": "🐟",
   "hail": "🌨️",
   "hair": "🦱",
   "halibut": "🐟",
   "hammer": "🔨",
   "hand": "✋",
   "happy": "😊",
   "harp": "🪉",
   "hat": "🎩",
   "hawk": "🦅",
   "head": "🗣️",
   "heart": "❤️",
   "hedgehog": "🦔",
   "heel": "👠",
   "helicopter": "🚁",
   "herring": "🐟",
   "hexagon": "⬡",
   "highlighter": "🖍️",
   "hockey": "🏒",
   "hook": "🪝",
   "horse": "🐎",
   "ice": "🧊",
   "india": "🪔",
   "ink": "🖋️",
   "iris": "🪻",
   "iron": "⛓️",
   "italy": "🍝",
   "jacket": "🧥",
   "jade": "🟢",
   "jam": "🫙",
   "japan": "🗾",
   "jealous": "😒",
   "jelly": "🫙",
   "journal": "📓",
   "juice": "🧃",
   "karate": "🥋",
   "keys": "🔑",
   "kiwi": "🥝",
   "knee": "🦵",
   "ladder": "🪜",
   "ladybug": "🐞",
   "lavender": "🪻",
   "lead": "🪨",
   "lemon": "🍋",
   "lemonade": "🥤",
   "leopard": "🐆",
   "level": "📏",
   "licorice": "🍬",
   "lily": "🪷",
   "linen": "🧵",
   "lion": "🦁",
   "loafer": "👞",
   "lobster": "🦞",
   "lollipop": "🍭",
   "lonely": "🥺",
   "mackerel": "🐟",
   "mango": "🥭",
   "maple": "🍁",
   "marigold": "🌼",
   "marker": "🖊️",
   "marshmallow": "☁️",
   "melon": "🍈",
   "mexico": "🌮",
   "milk": "🥛",
   "mixer": "🥣",
   "moccasin": "👞",
   "mocha": "☕",
   "monkey": "🐒",
   "moon": "🌕",
   "moth": "🦋",
   "mouth": "👄",
   "muffin": "🧁",
   "mule": "🫏",
   "mussel": "🦪",
   "mustard": "🟡",
   "nails": "💅",
   "nebula": "🌌",
   "nervous": "😰",
   "net": "🥅",
   "nickel": "🪙",
   "noodles": "🍜",
   "norway": "🏔️",
   "nose": "👃",
   "notebook": "📓",
   "nougat": "🍬",
   "nurse": "👩‍⚕️",
   "nut": "🥜",
   "nutmeg": "🌰",
   "nylon": "🧵",
   "oak": "🌳",
   "octagon": "🛑",
   "octopus": "🐙",
   "olive": "🫒",
   "onion": "🧅",
   "onyx": "⚫",
   "opal": "💎",
   "orange": "🍊",
   "orbit": "💫",
   "orchid": "🌸",
   "organ": "🎹",
   "otter": "🦦",
   "ottoman": "🪑",
   "oval": "🥚",
   "owl": "🦉",
   "palm": "🌴",
   "panda": "🐼",
   "pants": "👖",
   "paper": "📄",
   "paprika": "🌶️",
   "pasta": "🍝",
   "peach": "🍑",
   "pear": "🍐",
   "pearl": "🦪",
   "peas": "🫛",
   "pelican": "🐦",
   "pen": "🖊️",
   "pencil": "✏️",
   "penguin": "🐧",
   "pepper": "🫑",
   "perch": "🐟",
   "peru": "🦙",
   "piano": "🎹",
   "pie": "🥧",
   "pig": "🐖",
   "pilot": "🧑‍✈️",
   "pine": "🌲",
   "pink": "🩷",
   "pitch": "⚾",
   "pizza": "🍕",
   "plane": "✈️",
   "planet": "🪐",
   "platinum": "💍",
   "pliers": "🛠️",
   "plum": "🟣",
   "polyester": "👕",
   "poppy": "🌺",
   "port": "⚓",
   "potato": "🥔",
   "praline": "🍫",
   "proud": "😎",
   "pudding": "🍮",
   "pump": "⛽",
   "punch": "👊",
   "purple": "🟣",
   "pyramid": "🔺",
   "quartz": "💎",
   "rabbit": "🐇",
   "rain": "🌧️",
   "ram": "🐏",
   "record": "💿",
   "rectangle": "💳",
   "red": "🔴",
   "redwood": "🌲",
   "reel": "🎞️",
   "relish": "🥒",
   "ring": "💍",
   "robe": "👘",
   "robin": "🐦",
   "rocker": "🪑",
   "rocket": "🚀",
   "rocks": "🪨",
   "rose": "🌹",
   "round": "🔘",
   "ruby": "♦️",
   "rugby": "🏉",
   "ruler": "📏",
   "sad": "😢",
   "saffron": "🌸",
   "sage": "🌿",
   "salad": "🥗",
   "salmon": "🐟",
   "sandal": "👡",
   "sandwich": "🥪",
   "sapphire": "🔷",
   "sardine": "🐟",
   "satellite": "🛰️",
   "satin": "👗",
   "saw": "🪚",
   "saxophone": "🎷",
   "scale": "⚖️",
   "scarf": "🧣",
   "scooter": "🛴",
   "screwdriver": "🪛",
   "shark": "🦈",
   "sheep": "🐑",
   "shell": "🐚",
   "ship": "🚢",
   "shirt": "👕",
   "shoes": "👞",
   "shot": "💉",
   "shrimp": "🦐",
   "shy": "🫣",
   "silk": "👘",
   "silver": "🥈",
   "singer": "🧑‍🎤",
   "skiing": "⛷️",
   "sleet": "🌨️",
   "slipper": "🥿",
   "smoothie": "🥤",
   "snapper": "🐟",
   "sneaker": "👟",
   "snow": "❄️",
   "soccer": "⚽",
   "socks": "🧦",
   "soda": "🥤",
   "sofa": "🛋️",
   "soup": "🍲",
   "sour": "😖",
   "spain": "💃",
   "sparrow": "🐦",
   "sphere": "🔮",
   "spinach": "🥬",
   "spring": "🌷",
   "spruce": "🌲",
   "square": "🟦",
   "squid": "🦑",
   "squirrel": "🐿️",
   "stapler": "🗜️",
   "star": "⭐",
   "steel": "🔩",
   "stocking": "🧦",
   "stool": "🪑",
   "storm": "⛈️",
   "subway": "🚇",
   "sun": "☀️",
   "sunflower": "🌻",
   "surf": "🏄",
   "sushi": "🍣",
   "swallow": "🐦",
   "sweater": "🧥",
   "swordfish": "🐟",
   "table": "🪑",
   "tackle": "🎣",
   "taco": "🌮",
   "tap": "🚰",
   "tape": "📼",
   "tart": "🥧",
   "tea": "🍵",
   "teacher": "🧑‍🏫",
   "tennis": "🎾",
   "thunder": "🌩️",
   "tiger": "🐅",
   "tin": "🥫",
   "titanium": "🦾",
   "toffee": "🍬",
   "tone": "🎵",
   "tooth": "🦷",
   "topaz": "🔶",
   "torch": "🔦",
   "track": "🛤️",
   "train": "🚆",
   "triangle": "🔺",
   "trout": "🐟",
   "truck": "🚚",
   "truffle": "🍄",
   "trumpet": "🎺",
   "tulip": "🌷",
   "tuna": "🐟",
   "turkey": "🦃",
   "turmeric": "🫚",
   "tweed": "🧥",
   "vanilla": "🍨",
   "velvet": "🧵",
   "vintage": "📻",
   "violet": "🪻",
   "violin": "🎻",
   "wardrobe": "🗄️",
   "wasp": "🐝",
   "water": "💧",
   "whale": "🐋",
   "whistle": "📣",
   "white": "⚪",
   "willow": "🌳",
   "wind": "🌬️",
   "wolf": "🐺",
   "wool": "🧶",
   "wrench": "🔧",
   "writer": "✍️",
   "yellow": "🟡",
   "zebra": "🦓",
   "zinc": "🔩"
  };

  return {
    POOLS: POOLS,
    THEME_NAMES: THEME_NAMES,
    HAND_LEVELS: HAND_LEVELS,
    getLevel: getLevel,
    dailyLevel: dailyLevel,
    solveLevel: solveLevel,
    allCards: allCards,
    mulberry32: mulberry32,
    shuffle: shuffle,
    dealSeed: dealSeed,
    dealLayout: dealLayout,
    oracleFor: oracleFor,
    parFor: parFor,
    EMOJI: EMOJI
  };
});
