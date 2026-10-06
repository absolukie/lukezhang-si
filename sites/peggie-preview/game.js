/* ============================================================================
 * Peggie — Story Mode v1.1
 * "Kitten's Dream Logic" — a Peggle-like roguelike. One yarn-ball toy,
 * 9 balls a level, green-peg powers, the Pounce ult, cat-fear menagerie,
 * named feats. Treats (per-run) and Stars (persistent) are the two currencies.
 *
 * Refactor of the original Peggie canvas game. Kept from the original:
 *   canvas engine + responsive scaling, ball/peg physics + collision
 *   substeps, moving catch bucket, particles, floating text, screen shake,
 *   WebAudio SFX + rising peg pitch, haptics (buzz), hint system,
 *   sound toggle, PWA.
 * Removed: orb picker, relics, player HP, score/multipliers, old enemies,
 *   Purr-fect Fever, aim snapping, DOM battle mascot (canvas cat now).
 * ========================================================================== */
(function (global) {
"use strict";

/* Build marker — bump on every player-facing change so a version can be
 * confirmed from the home screen footer or the devtools console. */
global.PEGGIE_VERSION = "1.4.5-pounce";

/* ============================================================================
 * TUNING — every balance number lives here. Nothing below should hard-code
 * a gameplay constant; read it from TUNING instead.
 * ========================================================================== */
var TUNING = {
  FINAL_DEPTH: 20,
  BOSS_DEPTHS: [10, 20],

  // balls = life
  BALLS_BASE: 9,                 // nine balls, nine lives
  BALLS_BONUS_EVERY: 4,         // +1 max ball every 4 depths
  PITY_BASE: 0.40,              // zero-hit ball refund chance at full balls
  PITY_LOW: 0.85,               // refund chance at/below PITY_LOW_BALLS
  PITY_LOW_BALLS: 2,

  // damage (peg roles: blue normal, orange crit, green = equipped power,
  // purple = Pounce ult)
  DMG_BLUE: 1,
  DMG_ORANGE: 2,              // critical: 2x blue
  DMG_GREEN: 1,
  DMG_PURPLE: 2,
  DMG_JUNK: 0,

  // enemies (gentle linear scaling; adaptive multiplier applied on top)
  ENEMY_HP_BASE: 26,
  ENEMY_HP_PER_DEPTH: 4.5,
  ELITE_HP_MUL: 1.6,
  BOSS_HP: { 10: 120, 20: 170 },
  BOSS_ATTACK_EVERY: 3,         // boss acts every N shots
  BOSS_JUNK_PEGS: 3,            // junk pegs spawned by the spawn attack

  // powers (green pegs fire the CURRENT power; levels 1..3).
  // Purple is the Pounce ult — one per board, same size, called out by color + sparkle.
  POWER_MAX_LV: 3,
  MULTIBALL_EXTRA: [0, 2, 3, 4], // extra balls per level index
  PIERCE_THROUGH: [0, 4, 6, 9],  // pegs passed through per level index
  HEAVY_RADIUS: [1, 1.4, 1.6, 1.9],
  HEAVY_DMG: [0, 1, 2, 3],

  // economy (treats = per-run 🐟; 25% of lifetime treats bank to stars ⭐)
  COIN_BLUE: 1,
  COIN_ORANGE: 3,
  COIN_GREEN: 2,
  COIN_PURPLE: 5,
  ELITE_COIN_MUL: 1.5,
  WIN_BONUS: { normal: 20, elite: 30, treasure: 50, boss: 100, breather: 10 },
  FEAT_REWARD: { longshot: 10, offwall: 15, lucky: 15, madskillz: 20, lastpeg: 25 },
  BANK_RATE: 0.25,

  // shop (treats sink on the saga map)
  SHOP_NEW_POWER: 80,
  SHOP_LEVEL_UP: 60,
  SHOP_EXTRA_YARN: 40,        // +2 balls next level
  SHOP_STARS_PRICE: 100,      // fallback sink: treats -> stars
  SHOP_STARS_GAIN: 10,

  // adaptive difficulty (invisible, +/-15%)
  ADAPT_WINDOW: 6,
  ADAPT_DOWN: 0.85,
  ADAPT_UP: 1.15,

  // feel
  HOLD_SPEED: 2.5,              // hold screen during flight = 2.5x physics
  SLOWMO_SCALE: 0.15,           // last-ball cinema timescale (mandatory)
  SLOWMO_ZOOM: 1.35,            // cinematic zoom toward the ball
  SLOWMO_ENGAGE_DELAY: 1.0,     // latest engage time after the last ball fires
  FAIL_BEAT: 0.9,               // drama pause before the fail screen

  // Pounce ult (the single purple peg — unmistakable in purple with a twinkling sparkle)
  ULT_BURST_BALLS: 5,            // total balls after the burst (original + extras)
  ULT_PIERCE: 999,               // ult balls pierce through everything
  ULT_DMG_MULT: 3,               // ult balls deal 3x damage
  ULT_BEAT: 0.4,                 // slow-mo beat at the ult trigger (seconds)
  ULT_BEAT_SCALE: 0.3,           // timescale during the ult beat

  // win cinematic: EVERY level-winning hit gets its moment, reserves or not
  WIN_CINE_TIME: 0.7,            // slow-mo duration on the winning hit (seconds)
  WIN_CINE_SCALE: 0.35,          // timescale during the win cinematic
  WIN_CINE_ZOOM: 1.3,            // camera zoom toward the winning hit
  REFRESH_AT: 8,                // safety-net respawn when unhit non-orange < this

  // board lattice (hexagonal packing — even, beautiful spacing, no clumps)
  LATTICE_SPACING: 9,           // hex lattice pitch in shape units (~40px)
  LATTICE_JITTER: 0.05,          // per-peg jitter as a fraction of spacing (whisper only)
};

/* ============================================================================
 * LOGIC — pure functions. No DOM, no canvas, no G. Fully unit-testable.
 * ========================================================================== */
var POWERS = [
  { id: "multiball", name: "Multiball", icon: "🎱",
    desc: "Green peg splits your ball into extras mid-flight." },
  { id: "pierce",    name: "Pierce",    icon: "🏹",
    desc: "Green peg: ball passes through pegs without bouncing." },
  { id: "heavy",     name: "Heavy",     icon: "🎳",
    desc: "Green peg: bigger, heavier ball that hits harder." },
];

var Logic = {
  TUNING: TUNING,
  POWERS: POWERS,

  maxBalls: function (depth) {
    return TUNING.BALLS_BASE + Math.floor((depth - 1) / TUNING.BALLS_BONUS_EVERY);
  },

  // Zero-hit pity refund chance. Favors the player when balls run low:
  // PITY_BASE at a full rack, rising linearly to PITY_LOW at PITY_LOW_BALLS.
  pityChance: function (ballsLeft) {
    var lo = TUNING.PITY_LOW_BALLS, hi = TUNING.BALLS_BASE;
    var f = clamp((ballsLeft - lo) / (hi - lo), 0, 1);
    return TUNING.PITY_LOW - (TUNING.PITY_LOW - TUNING.PITY_BASE) * f;
  },

  // Damage dealt to the enemy when a peg of `type` is cleared.
  // Roles: blue = normal, orange = critical (2x), green = equipped power,
  // purple = Pounce ult (3x damage applied via ball.ult in hitPeg).
  pegDamage: function (type, powerId, powerLv) {
    var d = type === "orange" ? TUNING.DMG_ORANGE
          : type === "purple" ? TUNING.DMG_PURPLE
          : type === "green"  ? TUNING.DMG_GREEN
          : type === "junk"   ? TUNING.DMG_JUNK
          : TUNING.DMG_BLUE;
    if (powerId === "heavy" && powerLv > 0) d += TUNING.HEAVY_DMG[powerLv];
    return d;
  },

  enemyHP: function (depth, opts) {
    opts = opts || {};
    var hp;
    if (opts.boss) {
      hp = TUNING.BOSS_HP[depth] || 150;
    } else {
      hp = TUNING.ENEMY_HP_BASE + depth * TUNING.ENEMY_HP_PER_DEPTH;
      if (opts.elite) hp *= TUNING.ELITE_HP_MUL;
    }
    if (opts.adaptive) hp *= opts.adaptive;
    return Math.max(1, Math.round(hp));
  },

  // "curated spine": which enemy (if any) lives at this depth.
  // Chapters rotate a small menagerie, never repeating twice in a row.
  // prev = the last non-boss enemy faced (from the run); rng picks.
  enemyForDepth: function (depth, nodeType, prev, rng) {
    if (TUNING.BOSS_DEPTHS.indexOf(depth) >= 0) return depth === 10 ? "bath" : "carrier";
    if (nodeType === "treasure" || nodeType === "shop" || depth === 1) return null; // breather: pure pegs
    var pool = depth <= 10 ? ["vacuum", "spray", "hairball"]
                           : ["cucumber", "reddot", "storm"];
    rng = rng || Math.random;
    var cands = pool.filter(function (e) { return e !== prev; });
    return cands[Math.floor(rng() * cands.length)];
  },

  nodeChoices: function (depth) {
    if (depth === 1) return ["breather"];
    if (TUNING.BOSS_DEPTHS.indexOf(depth) >= 0) return ["boss"];
    return ["normal", "elite", "treasure", "shop"];
  },

  chapterForDepth: function (depth) {
    return depth <= 10
      ? { n: 1, title: "The 3AM Zoomies" }
      : { n: 2, title: "The Cucumber Incident" };
  },

  // ---- upgrades -----------------------------------------------------------
  // Exactly ONE offer per level. The run's FIRST power is always Multiball —
  // the iconic first pick and the best first-five-minutes moment. After that,
  // smart pick: prefer unowned powers, then level up the weakest owned power.
  // Returns {kind:'new'|'up', id} or null (all maxed).
  singleUpgradeOffer: function (owned, rng) {
    rng = rng || Math.random;
    owned = owned || {};
    var anyOwned = POWERS.some(function (p) { return owned[p.id] > 0; });
    if (!anyOwned) return { kind: "new", id: "multiball" };
    var news = [], ups = [];
    POWERS.forEach(function (p) {
      if (owned[p.id] > 0) {
        if (owned[p.id] < TUNING.POWER_MAX_LV) ups.push({ kind: "up", id: p.id });
      } else {
        news.push({ kind: "new", id: p.id });
      }
    });
    shuffle(news, rng);
    if (news.length) return news[0];
    if (ups.length) {
      ups.sort(function (a, b) { return (owned[a.id] || 0) - (owned[b.id] || 0); });
      return ups[0];
    }
    return null;
  },

  // ---- shop ---------------------------------------------------------------
  // The treats sink: 3 items — a new power (if any unowned), a power
  // level-up (owned powers), and Extra Yarn (+2 balls next level).
  // Falls back to a treats->stars exchange when powers are maxed.
  shopOffer: function (powers, rng) {
    rng = rng || Math.random;
    var items = [];
    var unowned = POWERS.filter(function (p) { return !(powers[p.id] > 0); });
    var ups = POWERS.filter(function (p) { return powers[p.id] > 0 && powers[p.id] < TUNING.POWER_MAX_LV; });
    shuffle(unowned, rng); shuffle(ups, rng);
    if (unowned.length) items.push({ kind: "new", id: unowned[0].id, price: TUNING.SHOP_NEW_POWER });
    if (ups.length) {
      var up2 = ups.filter(function (p) {
        return !items.some(function (it) { return it.id === p.id; });
      });
      var pick = up2[0] || ups[0];
      items.push({ kind: "up", id: pick.id, price: TUNING.SHOP_LEVEL_UP });
    }
    items.push({ kind: "yarn", price: TUNING.SHOP_EXTRA_YARN });
    while (items.length < 3) items.push({ kind: "stars", price: TUNING.SHOP_STARS_PRICE });
    return items.slice(0, 3);
  },

  // Pure: apply a choice -> new {powers, current}
  applyUpgrade: function (powers, current, choice) {
    var next = {}, k;
    for (k in powers) if (Object.prototype.hasOwnProperty.call(powers, k)) next[k] = powers[k];
    if (choice.kind === "new") { next[choice.id] = 1; current = choice.id; }
    else { next[choice.id] = Math.min(TUNING.POWER_MAX_LV, (next[choice.id] || 0) + 1); }
    return { powers: next, current: current };
  },

  powerDef: function (id) {
    for (var i = 0; i < POWERS.length; i++) if (POWERS[i].id === id) return POWERS[i];
    return null;
  },

  // ---- economy ------------------------------------------------------------
  coinForPeg: function (type, isElite) {
    var c = type === "orange" ? TUNING.COIN_ORANGE
          : type === "green"  ? TUNING.COIN_GREEN
          : type === "purple" ? TUNING.COIN_PURPLE
          : TUNING.COIN_BLUE;
    if (type === "junk") c = 0;
    if (isElite) c = Math.round(c * TUNING.ELITE_COIN_MUL);
    return c;
  },

  winBonus: function (nodeType) {
    return TUNING.WIN_BONUS[nodeType] || 0;
  },

  bankToGlobal: function (localEarned) {
    return Math.floor(localEarned * TUNING.BANK_RATE);
  },

  // ---- adaptive difficulty ------------------------------------------------
  // results: recent level outcomes, 1 = win, 0.5 = close win, 0 = loss.
  // Returns a multiplier clamped to [ADAPT_DOWN, ADAPT_UP].
  adaptiveMult: function (results) {
    if (!results || !results.length) return 1;
    var w = results.slice(-TUNING.ADAPT_WINDOW);
    var avg = w.reduce(function (a, b) { return a + b; }, 0) / w.length;
    var m = avg <= 0.5 ? TUNING.ADAPT_DOWN : avg >= 0.85 ? TUNING.ADAPT_UP : 1;
    return Math.min(TUNING.ADAPT_UP, Math.max(TUNING.ADAPT_DOWN, m));
  },

  resultScore: function (won, ballsLeft) {
    if (!won) return 0;
    return ballsLeft <= 2 ? 0.5 : 1;
  },
};

/* ============================== utils ===================================== */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
function $(id) {
  try { return document.getElementById(id); } catch (e) { return null; }
}
function showEl(el) { if (el && el.classList) el.classList.remove("hidden"); }
function hideEl(el) { if (el && el.classList) el.classList.add("hidden"); }
function setText(el, t) { if (el) el.textContent = t; }

// storage: localStorage when available, in-memory fallback otherwise
// (the fallback also keeps node smoke tests honest)
var store = (function () {
  var mem = {};
  return {
    get: function (k) {
      try { if (typeof localStorage !== "undefined") return localStorage.getItem(k); } catch (e) {}
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
    },
    set: function (k, v) {
      try { if (typeof localStorage !== "undefined") { localStorage.setItem(k, v); return; } } catch (e) {}
      mem[k] = String(v);
    },
    del: function (k) {
      try { if (typeof localStorage !== "undefined") { localStorage.removeItem(k); return; } } catch (e) {}
      delete mem[k];
    },
  };
})();

var seen = {};
function loadSeen() { try { seen = JSON.parse(store.get("peggie_seen") || "{}") || {}; } catch (e) { seen = {}; } }
function markSeen(k) { seen[k] = 1; try { store.set("peggie_seen", JSON.stringify(seen)); } catch (e) {} }

var buzz = (function () {
  var last = 0;
  return function (ms) {
    var now = Date.now();
    if (now - last < 60) return;
    last = now;
    try {
      var n = (typeof navigator !== "undefined") ? navigator.vibrate : null;
      if (n) n.call(navigator, ms);
    } catch (e) {}
  };
})();

/* ============================== audio ===================================== */
var Sound = {
  ctx: null, master: null, enabled: true, pegStreak: 0,
  init: function () {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  setEnabled: function (on) {
    this.enabled = on;
    if (this.master) { try { this.master.gain.value = on ? 0.5 : 0; } catch (e) {} }
  },
  tone: function (freq, dur, type, vol, when, slideTo) {
    if (!this.enabled || !this.ctx) return;
    try {
      var t = this.ctx.currentTime + (when || 0);
      var o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  },
  peg: function (combo) {
    this.pegStreak++;
    var base = 420 * Math.pow(2, Math.min(this.pegStreak, 24) / 24);
    this.tone(base, 0.09, "triangle", 0.22);
    this.tone(base * 2, 0.06, "sine", 0.1);
    buzz(8);
  },
  resetPegStreak: function () { this.pegStreak = 0; },
  shoot: function () { this.tone(300, 0.12, "sine", 0.2, 0, 620); },
  bounce: function () { this.tone(220, 0.05, "square", 0.07); },
  bucket: function () { this.tone(660, 0.08, "sine", 0.2); this.tone(990, 0.12, "sine", 0.18, 0.07); buzz(15); },
  green: function () { [523, 659, 784].forEach(function (f, i) { Sound.tone(f, 0.14, "triangle", 0.22, i * 0.06); }); buzz(25); },
  power: function () { this.tone(180, 0.3, "sawtooth", 0.16, 0, 900); buzz(30); },
  feat: function () { [784, 988, 1175, 1568].forEach(function (f, i) { Sound.tone(f, 0.16, "triangle", 0.2, i * 0.07); }); buzz(35); },
  win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { Sound.tone(f, 0.22, "triangle", 0.22, i * 0.09); }); },
  lose: function () { this.tone(300, 0.5, "sine", 0.2, 0, 120); },
  bonk: function () { this.tone(160, 0.12, "square", 0.25, 0, 90); this.tone(520, 0.1, "triangle", 0.15, 0.1, 700); buzz(40); },
  click: function () { this.tone(700, 0.05, "sine", 0.12); },
  tick: function () { this.tone(880, 0.04, "sine", 0.1); },
  throwS: function () { this.tone(500, 0.08, "sine", 0.14, 0, 900); },
  // last-peg drama: long pitch drop into the slow-mo
  slowmo: function () {
    this.tone(760, 1.4, "sine", 0.22, 0, 90);
    this.tone(380, 1.4, "triangle", 0.13, 0.05, 60);
    buzz(25);
  },
  purple: function () {
    [1047, 1319, 1568, 2093].forEach(function (f, i) { Sound.tone(f, 0.12, "sine", 0.16, i * 0.05); });
    buzz(20);
  },
  // Pounce ult: the signature moment in the kit
  ult: function () {
    [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { Sound.tone(f, 0.16, "sine", 0.2, i * 0.04); });
    this.tone(180, 0.5, "sawtooth", 0.14, 0, 1200);
    buzz(50);
  },
  buy: function () {
    this.tone(988, 0.09, "triangle", 0.2);
    this.tone(1319, 0.14, "triangle", 0.2, 0.08);
    buzz(20);
  },
};

/* ============================================================================
 * MUSIC_HOOK — future home of licensed / adaptive music. Story v1 ships with
 * SFX only. When tracks arrive, implement these hooks:
 *   Music.onLevelStart(depth, isBoss)  — pick/loop the right track
 *   Music.setIntensity(0..1)           — crossfade layers with heat
 *   Music.onBossAttack()               — stinger
 *   Music.onWin() / Music.onLose()     — resolve
 *   Music.stop()                       — back to menu
 * ========================================================================== */
var Music = {
  onLevelStart: function (/* depth, isBoss */) {},
  setIntensity: function (/* x */) {},
  onBossAttack: function () {},
  onWin: function () {},
  onLose: function () {},
  stop: function () {},
};

/* ============================ canvas consts =============================== */
var W = 480, H = 800;                 // design-space width / reference height
var VH = 800, VSCALE = 1, VOX = 0;    // live viewport: logical height, width scale, x-offset (CSS px)
var LAUNCH_X = W / 2, LAUNCH_Y = VH - 92, BALL_START_Y = VH - 104; // bottom: we shoot UP now
// Bottom-anchored furniture (launcher, kitten, ball spawn, sim launch) must
// track the LIVE viewport height: fitViewport() stretches VH on tall phones,
// and these were once frozen at the 800 reference — leaving the shooter
// floating mid-screen with a dead gap above the bucket. The peg field rides
// as a rigid unit just above the launcher (PEG_BOTTOM = BALL_START_Y - 48,
// the original intent), so the launch-to-field geometry — and the calibrated
// difficulty — is identical on every viewport height. PEG_TOP never rises
// above 146, keeping pegs clear of the enemy/HUD zone on short screens.
function anchorBottom() {
  LAUNCH_Y = VH - 92; BALL_START_Y = VH - 104; CAT_Y = VH - 124;
  SIM_LAUNCH_Y = VH - 104;
  PEG_BOTTOM = BALL_START_Y - 48;
  PEG_TOP = Math.max(146, PEG_BOTTOM - 502);
  BOARD_CY = (PEG_TOP + PEG_BOTTOM) / 2;
  SHAPE_CY = BOARD_CY + 3; // shape grammar was authored for SHAPE_CY=400=BOARD_CY+3 at the reference height
}
var PEG_R = 9, BALL_R = 8, GRAV = 1500, BALL_SPEED = 1400; // 1400: vertical shots must clear PEG_TOP (146) from BALL_START_Y (696)
var PEG_TOP = 146, PEG_BOTTOM = BALL_START_Y - 48, PEG_LEFT = 26, PEG_RIGHT = W - 26; // field rides with the launcher; see anchorBottom()
var BOARD_CX = W / 2, BOARD_CY = (PEG_TOP + PEG_BOTTOM) / 2;
// battle staging: kitten bottom-left by the launcher, enemy top-right —
// she bats the yarn UP at whatever is menacing her nap
var CAT_X = 104, CAT_Y = VH - 124, ENEMY_X = 368, ENEMY_Y = 132;
// battle text lanes (design px): the DOM enemy plate (#enemy, top-right) and
// HUD pills (#hud, top-left) sit OVER the canvas, so no canvas text may spawn
// above ENEMY_SAFE_Y (sized for notched-iPhone safe areas). Big center power
// banners use BANNER_Y; small center notes ("fresh yarn!", boss tells) use INFO_Y.
var ENEMY_SAFE_Y = 235, BANNER_Y = 258, INFO_Y = 322;

var canvas = null, ctx = null, DPR = 1;
function setupCanvas() {
  canvas = $("game"); if (!canvas) return;
  fitViewport();
  try { global.addEventListener("resize", fitViewport); } catch (e) {}
  ctx = canvas.getContext("2d");
}

// Responsive viewport: the 480-unit world always fills the wrap width
// exactly; the logical height stretches so the dream-sky covers every
// screen with no seams, no clipped edges, and 1:1 touch mapping.
// (Squat/landscape screens fit height instead, with seamless sky bars.)
function fitViewport() {
  if (!canvas) return;
  var wrap = $("wrap");
  var w = wrap ? wrap.clientWidth : W, h = wrap ? wrap.clientHeight : H;
  DPR = Math.min(2, global.devicePixelRatio || 1);
  canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
  VSCALE = w / W; VH = h / VSCALE; VOX = 0;
  if (VH < 780) { VSCALE = h / 780; VH = 780; VOX = (w - W * VSCALE) / 2; }
  anchorBottom(); // keep the shooter/kitten/bucket stacked at the real bottom
}

// One continuous dream-sky: painted in device space over the whole canvas
// BEFORE the game transform, so the background is seamless top-to-bottom
// on every screen — no bands, no hard edges behind the shooter or bucket.
function paintSky() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  var g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#fbe9f1"); g.addColorStop(0.55, "#f6dbe8"); g.addColorStop(1, "#eec9da");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,.35)";
  for (var i = 0; i < 26; i++) {
    var x = (i * 173) % canvas.width, y = (i * 311) % canvas.height, r = (3 + (i % 4)) * DPR;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

/* ============================ shape grammar =================================
 * "Curated spine, procedural flesh" for level geometry.
 *
 * Shapes are DATA recipes, not code: each recipe composes mask primitives
 * (disc, ellipse, ring, polygon, union, difference, sampled path) into a
 * region mask in shape units (a +/-40 box, 1 unit ~= 4.4px). The 8 classic
 * shapes are the first 8 recipes, ported 1:1 from the old hand-written
 * masks — a board built from a canonical (unjittered) recipe is
 * pixel-identical to the old board (verified by test).
 *
 * varyRecipe(recipe, rng, opts) mints fresh variants by jittering the
 * recipe's parameters (star points, ring radii, polygon sides, spiral
 * turns, overall scale...), so the generator can sample new boards forever
 * instead of cycling 8 fixed layouts.
 * ========================================================================== */

// polygon vertex generators. Each canonical form reproduces the old shape
// exactly (same formulas, same operation order — even float rounding).
function genPolyVerts(node) {
  if (node.verts) return node.verts;
  var pts = [], i, a, r, t, x, y;
  if (node.gen === "star") {
    var points = node.points || 5;
    for (i = 0; i < points * 2; i++) {
      r = (i % 2 === 0) ? node.rOuter : node.rInner;
      a = (node.rot || 0) + i * Math.PI / points;
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
  } else if (node.gen === "heart") {
    var n = node.n || 26;
    for (i = 0; i < n; i++) {
      t = (i / n) * Math.PI * 2;
      x = 16 * Math.pow(Math.sin(t), 3);
      y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([x * 2.2 * 0.95, -y * 2.2 * 0.95]);
    }
  } else if (node.gen === "ngon") {
    var sides = node.n || 6;
    for (i = 0; i < sides; i++) {
      a = (node.rot || 0) + i * Math.PI * 2 / sides;
      pts.push([node.r * Math.cos(a), node.r * Math.sin(a)]);
    }
  } else if (node.gen === "spiral") {
    var turns = node.turns || 2.6, segs = node.segs || 220;
    var r0 = node.r0 == null ? 4 : node.r0, r1 = node.r1 == null ? 38 : node.r1;
    for (i = 0; i <= segs; i++) {
      t = (i / segs) * turns * Math.PI;
      r = r0 + ((r1 - r0) * t) / (turns * Math.PI);
      pts.push([r * Math.cos(t), r * Math.sin(t)]);
    }
  }
  return pts;
}

// compile a mask recipe node into a point-in-shape predicate (x, y in shape
// units). Compiled predicates are cached on the node as _fn.
function compileMask(node) {
  if (node._fn) return node._fn;
  var fn;
  if (node.op === "disc") {
    (function (cx, cy, r2) {
      fn = function (x, y) { var dx = x - cx, dy = y - cy; return dx * dx + dy * dy <= r2; };
    })(node.cx || 0, node.cy || 0, node.r * node.r);
  } else if (node.op === "ellipse") {
    (function (cx, cy, rx, ry) {
      fn = function (x, y) { var ex = (x - cx) / rx, ey = (y - cy) / ry; return ex * ex + ey * ey <= 1; };
    })(node.cx || 0, node.cy || 0, node.rx, node.ry);
  } else if (node.op === "ring") {
    (function (r0, r1) {
      fn = function (x, y) { var r = Math.sqrt(x * x + y * y); return r >= r0 && r <= r1; };
    })(node.r0, node.r1);
  } else if (node.op === "poly" || node.op === "tri") {
    var verts = genPolyVerts(node);
    fn = function (x, y) { return pointInPoly(x, y, verts); };
  } else if (node.op === "union") {
    var parts = node.parts.map(compileMask);
    fn = function (x, y) {
      for (var i = 0; i < parts.length; i++) if (parts[i](x, y)) return true;
      return false;
    };
  } else if (node.op === "diff") {
    var base = compileMask(node.base);
    var cuts = node.cuts.map(compileMask);
    fn = function (x, y) {
      if (!base(x, y)) return false;
      for (var i = 0; i < cuts.length; i++) if (cuts[i](x, y)) return false;
      return true;
    };
  } else if (node.op === "path") {
    var path = node.pts || genPolyVerts({ gen: "spiral", turns: node.turns, segs: node.segs, r0: node.r0, r1: node.r1 });
    var w = node.width;
    fn = function (x, y) {
      var best = Infinity;
      for (var i = 0; i < path.length - 1; i++) {
        var p = path[i], q = path[i + 1];
        var d = distToSeg(x, y, p[0], p[1], q[0], q[1]);
        if (d < best) best = d;
        if (best < w) return true;
      }
      return best < w;
    };
  } else {
    fn = function () { return false; };
  }
  node._fn = fn;
  return fn;
}

// scale every spatial parameter of a mask tree by s (used for variants;
// canonical recipes never go through this, so the port stays exact).
function scaleMaskTree(node, s) {
  function sc(v) { return v * s; }
  if (node.op === "disc") { node.cx = sc(node.cx || 0); node.cy = sc(node.cy || 0); node.r = sc(node.r); }
  else if (node.op === "ellipse") { node.cx = sc(node.cx || 0); node.cy = sc(node.cy || 0); node.rx = sc(node.rx); node.ry = sc(node.ry); }
  else if (node.op === "ring") { node.r0 = sc(node.r0); node.r1 = sc(node.r1); }
  else if (node.op === "poly" || node.op === "tri") {
    node.verts = genPolyVerts(node).map(function (p) { return [p[0] * s, p[1] * s]; });
  }
  else if (node.op === "union") { node.parts.forEach(function (p) { scaleMaskTree(p, s); }); }
  else if (node.op === "diff") { scaleMaskTree(node.base, s); node.cuts.forEach(function (c) { scaleMaskTree(c, s); }); }
  else if (node.op === "path") {
    var path = node.pts || genPolyVerts({ gen: "spiral", turns: node.turns, segs: node.segs, r0: node.r0, r1: node.r1 });
    node.pts = path.map(function (p) { return [p[0] * s, p[1] * s]; });
    node.width = sc(node.width);
  }
  delete node._fn;
}

var SHAPE_RECIPES = [
  { name: "heart", center: [0, 4], bbox: [-36, -28, 36, 39],
    mask: { op: "poly", gen: "heart", n: 26 },
    vary: { n: [22, 30] } },
  { name: "star", center: [0, 0], bbox: [-40, -40, 40, 40],
    mask: { op: "poly", gen: "star", points: 5, rOuter: 38, rInner: 16, rot: -Math.PI / 2 },
    vary: { points: [4, 7], rOuter: [32, 40], rInnerRatio: [0.35, 0.5] } },
  { name: "paw", center: [0, 12], bbox: [-30, -27, 30, 32],
    mask: { op: "union", parts: [
      { op: "ellipse", cx: 0, cy: 15, rx: 19, ry: 14 },
      { op: "disc", cx: -19, cy: -8, r: 7.5 },
      { op: "disc", cx: -7, cy: -16, r: 8 },
      { op: "disc", cx: 7, cy: -16, r: 8 },
      { op: "disc", cx: 19, cy: -8, r: 7.5 } ] },
    vary: null },
  { name: "fish", center: [0, 0], bbox: [-32, -17, 46, 17],
    mask: { op: "union", parts: [
      { op: "ellipse", cx: 0, cy: 0, rx: 30, ry: 15 },
      { op: "poly", verts: [[26, -12], [44, 0], [26, 12]] } ] },
    vary: null },
  { name: "ring", center: [0, -29], bbox: [-38, -38, 38, 38],
    mask: { op: "ring", r0: 22, r1: 36 },
    vary: { r0: [18, 26], r1: [32, 40] } },
  { name: "diamond", center: [0, 0], bbox: [-30, -38, 30, 38],
    mask: { op: "poly", verts: [[0, -36], [28, 0], [0, 36], [-28, 0]] },
    vary: null },
  { name: "spiral", center: [4, 0], bbox: [-40, -40, 40, 40],
    mask: { op: "path", gen: "spiral", turns: 2.6, segs: 220, r0: 4, r1: 38, width: 6 },
    vary: { turns: [2.2, 3.0], width: [5, 7] } },
  { name: "bowtie", center: [0, 0], bbox: [-36, -28, 36, 28],
    mask: { op: "union", parts: [
      { op: "poly", verts: [[-34, -26], [-34, 26], [0, 0]] },
      { op: "poly", verts: [[34, -26], [34, 26], [0, 0]] } ] },
    vary: null },
  // grammar-showcase shapes (preview gallery; not in the live rotation yet)
  { name: "hex", center: [0, 0], bbox: [-36, -36, 36, 36],
    mask: { op: "poly", gen: "ngon", n: 6, r: 34, rot: -Math.PI / 2 },
    vary: { n: [5, 8], r: [30, 36] } },
  { name: "moon", center: [-6, 0], bbox: [-40, -40, 40, 40],
    mask: { op: "diff",
      base: { op: "disc", cx: 0, cy: 0, r: 38 },
      cuts: [{ op: "disc", cx: 16, cy: 0, r: 30 }] },
    vary: null },
];

function recipeByName(name) {
  for (var i = 0; i < SHAPE_RECIPES.length; i++)
    if (SHAPE_RECIPES[i].name === name) return SHAPE_RECIPES[i];
  return null;
}

// mint a variant of a recipe. Structural params come from recipe.vary;
// opts.scale (e.g. [0.92, 1.1]) applies a uniform geometric scale.
function varyRecipe(recipe, rng, opts) {
  opts = opts || {};
  var out = {
    name: recipe.name,
    center: recipe.center.slice(),
    bbox: recipe.bbox.slice(),
    mask: JSON.parse(JSON.stringify(recipe.mask)),
  };
  var v = recipe.vary || {}, m = out.mask, k;
  function jr(rg) { return rg[0] + rng() * (rg[1] - rg[0]); }
  for (k in v) {
    if (k === "points" || k === "n") m[k] = Math.max(3, Math.round(jr(v[k])));
    else if (k === "rInnerRatio") m.rInner = m.rOuter * jr(v.rInnerRatio);
    else if (v[k] instanceof Array && typeof m[k] === "number") m[k] = jr(v[k]);
  }
  if (opts.scale) {
    var s = jr(opts.scale);
    if (s !== 1) {
      scaleMaskTree(m, s);
      out.center = [out.center[0] * s, out.center[1] * s];
      out.bbox = out.bbox.map(function (b) { return b * s; });
      out.name = recipe.name + "~" + s.toFixed(2);
    }
  }
  return out;
}

// Geometry-based special placement — no per-shape focal lists.
//   purple: exactly one, on the peg nearest the recipe's heart (center).
//   oranges: farthest-point sampling biased toward the shape's extremities,
//     so they land on star tips, heart lobes, ring arcs... spread out, never
//     clumped.
//   greens: min-distance dart throwing (Poisson-ish, no clumps).
function paintSpecials(pegs, rng, recipe, nOrange, nGreen) {
  var pcx = BOARD_CX + recipe.center[0] * SHAPE_SX;
  var pcy = SHAPE_CY + recipe.center[1] * SHAPE_SY;
  var bcx = BOARD_CX + (recipe.bbox[0] + recipe.bbox[2]) / 2 * SHAPE_SX;
  var bcy = SHAPE_CY + (recipe.bbox[1] + recipe.bbox[3]) / 2 * SHAPE_SY;
  var used = {}, i, d;
  var pi = -1, bd = Infinity;
  for (i = 0; i < pegs.length; i++) {
    d = dist2(pegs[i].x, pegs[i].y, pcx, pcy);
    if (d < bd) { bd = d; pi = i; }
  }
  if (pi < 0) return;
  pegs[pi].type = "purple"; used[pi] = 1;
  // seed: farthest peg from the bbox center — an extremity of the shape
  var seed = -1; bd = -1;
  for (i = 0; i < pegs.length; i++) {
    if (used[i]) continue;
    d = dist2(pegs[i].x, pegs[i].y, bcx, bcy);
    if (d > bd) { bd = d; seed = i; }
  }
  var oidx = [];
  if (seed >= 0) { used[seed] = 1; pegs[seed].type = "orange"; oidx.push(seed); }
  var want = Math.min(nOrange, pegs.length - 1);
  while (oidx.length < want) {
    var best = -1, bestScore = -1;
    for (i = 0; i < pegs.length; i++) {
      if (used[i]) continue;
      var md = Infinity;
      for (var j = 0; j < oidx.length; j++)
        md = Math.min(md, dist2(pegs[i].x, pegs[i].y, pegs[oidx[j]].x, pegs[oidx[j]].y));
      // extremity bias: prefer pegs far from the bbox center
      var score = md * (0.5 + dist2(pegs[i].x, pegs[i].y, bcx, bcy) / 1e6);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best < 0) break;
    used[best] = 1; pegs[best].type = "orange"; oidx.push(best);
  }
  // greens: dart throwing with a minimum separation
  var g2 = Math.pow(TUNING.LATTICE_SPACING * SHAPE_SX * 1.6, 2);
  var gidx = [], gi = 0;
  var rest = shuffle(
    pegs.map(function (_, k) { return k; }).filter(function (k) { return !used[k]; }), rng);
  for (var r = 0; r < rest.length && gi < nGreen; r++) {
    var idx = rest[r], clear = true;
    for (var g = 0; g < gidx.length; g++)
      if (dist2(pegs[idx].x, pegs[idx].y, pegs[gidx[g]].x, pegs[gidx[g]].y) < g2) { clear = false; break; }
    if (clear) { pegs[idx].type = "green"; used[idx] = 1; gidx.push(idx); gi++; }
  }
}

// Stray pruning: mask-clipped lattices leave disconnected dots on thin
// protrusions (star tips, tail ends). Iteratively drop pegs with fewer than
// 2 neighbors within 1.6x pitch — they read as visual noise, not board.
// Runs BEFORE specials are painted, so the purple/oranges/greens land on
// the final set. Never prunes below minKeep pegs.
function pruneStrays(pegs, pitchPx, minKeep) {
  minKeep = minKeep || 8;
  var out = pegs.slice(), changed = true;
  while (changed && out.length > minKeep) {
    changed = false;
    var keep = [];
    for (var i = 0; i < out.length; i++) {
      var cnt = 0;
      for (var j = 0; j < out.length; j++) {
        if (i === j) continue;
        var dx = out[i].x - out[j].x, dy = out[i].y - out[j].y;
        if (dx * dx + dy * dy < pitchPx * pitchPx * 2.56) cnt++; // 1.6^2
        if (cnt >= 2) break;
      }
      if (cnt >= 2 || out.length <= minKeep) keep.push(out[i]);
      else changed = true;
    }
    out = keep;
  }
  return out;
}

// build a peg board from a recipe — hex-lattice fill clipped to the mask,
// tiny jitter, stray pruning, geometry-based specials. Canonical recipes
// reproduce the old boards' peg positions exactly; specials follow the
// shape's geometry.
function shapeBoard(recipe, rng, depth, opts) {
  opts = opts || {};
  var mask = compileMask(recipe.mask);
  var spacing = TUNING.LATTICE_SPACING * (opts.spacingMul || 1);
  var jit = spacing * TUNING.LATTICE_JITTER;
  var pts = latticeFill({ bbox: recipe.bbox, mask: mask }, spacing);
  var pegs = pts.map(function (p) {
    return mkPeg(
      clamp(BOARD_CX + (p[0] + (rng() - 0.5) * 2 * jit) * SHAPE_SX, PEG_LEFT + 6, PEG_RIGHT - 6),
      clamp(SHAPE_CY + (p[1] + (rng() - 0.5) * 2 * jit) * SHAPE_SY, PEG_TOP + 6, PEG_BOTTOM - 6));
  });
  pegs = pruneStrays(pegs, spacing * SHAPE_SX);
  paintSpecials(pegs, rng, recipe, opts.oranges || 4, opts.greens || 0);
  return pegs;
}

/* ============================ board shapes ================================
 * "Curated spine, procedural flesh": each shape is a REGION MASK in shape
 * units (a ±40 box, 1 unit ≈ 4.4px). Pegs are placed on a HEXAGONAL LATTICE
 * clipped to the mask, with tiny jitter — so every board is evenly and
 * beautifully spaced: no clumps, no overlaps, no awkward gaps. Exactly one
 * purple sits at the shape's geometric heart; oranges are farthest-point
 * sampled with an extremity bias so they spread across the shape; greens
 * are dart-thrown for even spacing. Each shape: {name, center, bbox, mask}.
 * varyRecipe() derives jittered/structural variants for the generator.
 * ========================================================================== */
var SHAPE_SX = 4.4, SHAPE_SY = 4.4, SHAPE_CY = 400;

function mkPeg(x, y, type) {
  return { x: x, y: y, type: type || "blue", hit: false, anim: 0, r: PEG_R, lit: 0 };
}

// even-odd point-in-polygon for closed outline shapes
function pointInPoly(px, py, poly) {
  var inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}

function pointInTri(px, py, t) {
  var x0 = t[0][0], y0 = t[0][1], x1 = t[1][0], y1 = t[1][1], x2 = t[2][0], y2 = t[2][1];
  var d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  var a = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / d;
  var b = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / d;
  return a >= 0 && b >= 0 && a + b <= 1;
}

function distToSeg(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay;
  var t = dx * dx + dy * dy > 0 ? ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy) : 0;
  t = clamp(t, 0, 1);
  var cx = ax + t * dx - px, cy = ay + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
}


// Hexagonal lattice fill: rows offset by half a pitch, row height = pitch *
// sqrt(3)/2. Every peg sits the same distance from its neighbors — the math
// that makes the boards feel even and beautiful.
function latticeFill(def, spacing) {
  var pts = [];
  var bb = def.bbox, rowH = spacing * 0.8660254;
  // anchor the grid on the bbox CENTER (a column through cx, a row through cy)
  // so symmetric masks sample symmetrically. Anchoring on the bbox corner —
  // the old behavior — put a stray column on one side and came out lopsided.
  var cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
  var x0 = cx - Math.ceil((cx - bb[0]) / spacing) * spacing;
  var maxK = Math.ceil(Math.max(cy - bb[1], bb[3] - cy) / rowH);
  for (var k = -maxK; k <= maxK; k++) {
    var y = cy + k * rowH;
    if (y < bb[1] || y > bb[3]) continue;
    var off = (Math.abs(k) % 2) * spacing * 0.5;
    for (var x = x0 + off; x <= bb[2]; x += spacing)
      if (def.mask(x, y)) pts.push([x, y]);
  }
  return pts;
}

// Curated special placement: exactly one purple at the shape's heart
// (placed first, always prominent), oranges at focal points, greens
// sprinkled at random. Topped up at random when focals run short.

function pickShape(rng) { return SHAPE_RECIPES[Math.floor(rng() * 8)]; }

function teachingLayout(rng) {
  // depth 1: a hand-placed heart — the curated spine's first vertebra. A
  // lattice-sampled mask can't resolve the heart's cleft at this pitch, so
  // this one is placed peg by peg: two lobes, a cleft, tapering to a point.
  // Mirror-symmetric by construction, same pitch as a 1.3x lattice board.
  var p = TUNING.LATTICE_SPACING * 1.3 * SHAPE_SX; // 51.5px
  var cx = BOARD_CX, y0 = BOARD_CY - 97; // heart rides the field center (300 at the 800 reference)
  // [col, row] with a cleft at (0,0): 4+5+5+3+1 = 18 pegs
  var cells = [
    [-2, 0], [-1, 0], [1, 0], [2, 0],
    [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
    [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2],
    [-1, 3], [0, 3], [1, 3],
    [0, 4],
  ];
  var pegs = cells.map(function (c) {
    return mkPeg(cx + c[0] * p, y0 + c[1] * p);
  });
  function at(c, r) {
    for (var i = 0; i < cells.length; i++)
      if (cells[i][0] === c && cells[i][1] === r) return pegs[i];
    return null;
  }
  at(0, 2).type = "purple"; // the geometric heart of the heart
  at(-2, 0).type = "orange"; at(2, 0).type = "orange"; // lobe tips
  at(0, 1).type = "orange"; at(0, 4).type = "orange";  // cleft + point
  return pegs;
}

function layoutFor(depth, nodeType, rng) {
  if (depth === 1) return teachingLayout(rng);
  if (nodeType === "treasure")
    return genLayout(depth, rng, { band: "EASY", oranges: [5, 5], greens: [2, 4], spacing: [1.2, 1.35] });
  if (nodeType === "boss")
    return genLayout(depth, rng, { band: "MEDIUM", oranges: [5, 6], greens: [3, 3], spacing: [0.95, 1.05], shapes: ["star"], jitter: false });
  if (nodeType === "elite")
    return genLayout(depth, rng, { band: "HARD", oranges: [6, 7], greens: [3, 4], spacing: [0.85, 0.95], timeBudgetMs: 250 });
  // "start simple, ramp slowly": density ramps with depth while difficulty
  // comes from orange count + shape. Early boards are open, a few pegs.
  var sp = depth <= 3 ? [1.2, 1.35] : depth <= 6 ? [1.1, 1.25] : depth <= 9 ? [1.0, 1.15] : [0.95, 1.1];
  return genLayout(depth, rng, {
    band: depth <= 3 ? "EASY" : "MEDIUM",
    oranges: depth <= 3 ? [4, 5] : [5, 7], greens: depth >= 2 ? [3, 3] : [0, 0],
    spacing: sp, timeBudgetMs: 150,
  });
}

// generate-and-test level builder: sample a recipe + parameters, build the
// board, score it with the headless physics sim, keep it if it lands in the
// target band. Bounded retries + time budget; falls back to the closest
// candidate so a board always comes back.
var DIFF_BANDS = {
  EASY:   { max: 10.5 },          // teaching-like (measured 8.0-10.3)
  MEDIUM: { min: 10.5, max: 14 }, // normal/treasure/boss-like (measured ~10-14)
  HARD:   { min: 14 },            // elite-like (measured mean ~15.4)
};
function bandOf(score) {
  if (score < DIFF_BANDS.EASY.max) return "EASY";
  if (score <= DIFF_BANDS.MEDIUM.max) return "MEDIUM";
  return "HARD";
}
function bandDist(score, band) {
  var b = DIFF_BANDS[band];
  if (b.min != null && score < b.min) return b.min - score;
  if (b.max != null && score > b.max) return score - b.max;
  return 0;
}

function sampleCandidate(spec, rng) {
  var names = spec.shapes;
  if (!names) {
    names = [];
    for (var i = 0; i < 8; i++) names.push(SHAPE_RECIPES[i].name); // the 8 classics
  }
  var base = recipeByName(names[Math.floor(rng() * names.length)]);
  var recipe = spec.jitter === false ? base : varyRecipe(base, rng, { scale: spec.scaleRange || [0.94, 1.08] });
  function ri(lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  function rf(lo, hi) { return lo + rng() * (hi - lo); }
  return {
    recipe: recipe, shapeName: base.name,
    oranges: ri(spec.oranges[0], spec.oranges[1]),
    greens: ri(spec.greens[0], spec.greens[1]),
    spacing: rf(spec.spacing[0], spec.spacing[1]),
  };
}

function generateBoard(spec) {
  var rng = spec.rng || mulberry32(spec.seed == null ? 1 : spec.seed);
  var tries = spec.tries || 40;
  var trials = spec.trials || 32;
  var deadline = spec.timeBudgetMs ? Date.now() + spec.timeBudgetMs : Infinity;
  var best = null, bestDist = Infinity;
  for (var t = 0; t < tries; t++) {
    if (best && Date.now() > deadline) break;
    var cand = sampleCandidate(spec, rng);
    var pegs = shapeBoard(cand.recipe, rng, spec.depth || 1,
      { oranges: cand.oranges, greens: cand.greens, spacingMul: cand.spacing });
    var s = scoreBoard(pegs, { trials: trials, rng: rng });
    var v = validateBoard(pegs, {
      pitchPx: cand.spacing * TUNING.LATTICE_SPACING * SHAPE_SX,
      oranges: cand.oranges, greens: cand.greens,
    });
    if (!v.ok) continue; // geometrically invalid — not shippable, try again
    var d = bandDist(s.expectedBalls, spec.band);
    if (d === 0) return { pegs: pegs, score: s, band: spec.band, candidate: cand, tries: t + 1 };
    if (d < bestDist) best = { pegs: pegs, score: s, band: spec.band, candidate: cand, tries: t + 1, fallback: true };
    if (d < bestDist) bestDist = d;
  }
  if (!best) {
    // last resort: never crash the game. Ship the closest board found even if
    // it failed validation, flagged so tests and the lab can see it.
    var cand = sampleCandidate(spec, rng);
    var pegs = shapeBoard(cand.recipe, rng, spec.depth || 1,
      { oranges: cand.oranges, greens: cand.greens, spacingMul: cand.spacing });
    var s = scoreBoard(pegs, { trials: trials, rng: rng });
    return { pegs: pegs, score: s, band: spec.band, candidate: cand, tries: tries, fallback: true, unvalidated: true };
  }
  return best;
}

function genLayout(depth, rng, spec) {
  spec.depth = depth; spec.rng = rng;
  return generateBoard(spec).pegs;
}

/* ============================ difficulty scorer =============================
 * scoreBoard(pegs, opts): headless Monte-Carlo difficulty measurement.
 *
 * Simulates full clear attempts with the REAL ball physics (physicsStep):
 * each trial fires balls until every orange is gone, mixing uniform-random
 * aim angles with a greedy heuristic (aim at the densest unhit-orange
 * cluster) that approximates a decent player. Returns
 * {expectedBalls, clearProb, trials}.
 *
 * Deliberately models plain balls only — no bucket refunds, no pity, no
 * green powers, no Pounce. Those all help the player, so the score is a
 * conservative, board-intrinsic difficulty number; bands are calibrated
 * against it, so the comparison is apples-to-apples.
 * ========================================================================== */
var SIM_LAUNCH_X = 240, SIM_LAUNCH_Y = VH - 104, SIM_SPEED = BALL_SPEED;
var SIM_MIN_DY = 0.12; // matches the game's aim clamp (setAim)

function simGrid(pegs, cell) {
  var g = {};
  for (var i = 0; i < pegs.length; i++) {
    var p = pegs[i];
    p._gi = i; // stable index: query output is sorted by it so collision
    var k = Math.floor(p.x / cell) + ":" + Math.floor(p.y / cell); // order matches the game's array order and is
    (g[k] = g[k] || []).push(p);                                  // translation-invariant (absolute cell alignment
  }                                                               // otherwise leaks into bounce resolution)
  return function (x, y, rad) {
    var out = [];
    var x0 = Math.floor((x - rad) / cell), x1 = Math.floor((x + rad) / cell);
    var y0 = Math.floor((y - rad) / cell), y1 = Math.floor((y + rad) / cell);
    for (var cx = x0; cx <= x1; cx++)
      for (var cy = y0; cy <= y1; cy++) {
        var arr = g[cx + ":" + cy];
        if (arr) for (var i = 0; i < arr.length; i++) out.push(arr[i]);
      }
    out.sort(function (a, b) { return a._gi - b._gi; });
    return out;
  };
}

function simRandAngle(rng) {
  var lo = Math.asin(SIM_MIN_DY);
  return -Math.PI + lo + rng() * (Math.PI - 2 * lo); // upward fan (canvas y-down)
}

function simClampAngle(a) {
  var lo = Math.asin(SIM_MIN_DY);
  while (a <= -Math.PI) a += 2 * Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  return clamp(a, -Math.PI + lo, -lo); // keep shots pointing upward
}

// Projectile solution: canvas launch angle that puts a ball (speed SIM_SPEED,
// gravity GRAV) onto (tx, ty) from the launcher. Solves the ballistic arc in
// math coords (y up), takes the flatter of the two arcs, and converts back to
// canvas angle (y down). Returns null when the target is out of range.
// A decent player leads the arc instinctively; straight-line aim undershoots
// by ~60px at these distances, so the sim must solve it to mean anything.
function simBallisticAngle(tx, ty) {
  var X = tx - SIM_LAUNCH_X, Y = SIM_LAUNCH_Y - ty; // y-up: target above => Y>0
  var v = SIM_SPEED, g = GRAV;
  if (Math.abs(X) < 1) return -Math.PI / 2; // dead above: straight up
  var a = g * X * X / (2 * v * v);
  var disc = X * X - 4 * a * (Y + a);
  if (disc < 0) return null; // out of range
  var sq = Math.sqrt(disc);
  var u1 = (X + sq) / (2 * a), u2 = (X - sq) / (2 * a);
  var u = Math.abs(u1) < Math.abs(u2) ? u1 : u2; // flatter arc
  var cosT = (X > 0 ? 1 : -1) / Math.sqrt(1 + u * u);
  var sinT = u * cosT;
  return Math.atan2(-v * sinT, v * cosT); // back to canvas (y down)
}

// greedy heuristic: aim at the unhit orange with the most unhit-orange
// neighbors (densest cluster), solve the ballistic arc to it, plus noise.
function simGreedyAngle(pegs, rng) {
  var best = null, bestN = -1, i, j;
  var R2 = 90 * 90;
  for (i = 0; i < pegs.length; i++) {
    var p = pegs[i];
    if (p.hit || p.type !== "orange") continue;
    var n = 0;
    for (j = 0; j < pegs.length; j++) {
      var q = pegs[j];
      if (q === p || q.hit || q.type !== "orange") continue;
      var dx = p.x - q.x, dy = p.y - q.y;
      if (dx * dx + dy * dy < R2) n++;
    }
    if (n > bestN || (n === bestN && rng() < 0.5)) { bestN = n; best = p; }
  }
  if (!best) return simRandAngle(rng);
  var a = simBallisticAngle(best.x, best.y);
  if (a == null) a = Math.atan2(best.y - SIM_LAUNCH_Y, best.x - SIM_LAUNCH_X);
  return simClampAngle(a + (rng() - 0.5) * 0.08);
}

function simFireBall(pegs, query, angle, stepCap) {
  var b = {
    x: SIM_LAUNCH_X, y: SIM_LAUNCH_Y,
    vx: Math.cos(angle) * SIM_SPEED, vy: Math.sin(angle) * SIM_SPEED,
    r: BALL_R, pierce: 0, t: 0,
  };
  var ctx = {
    grav: GRAV, ballR: BALL_R, right: W, query: query,
    onWall: null,
    onHit: function (ball, peg) { peg.hit = true; },
  };
  var dt = 1 / 60;
  for (var s = 0; s < stepCap; s++) {
    physicsStep(b, pegs, ctx, dt);
    if (b.y > VH - 8) return;                    // fell out the bottom
    if (b.y > PEG_BOTTOM + 60 && b.vy > 0) return; // below every peg, falling
  }
}

function simOrangeLeft(pegs) {
  var n = 0;
  for (var i = 0; i < pegs.length; i++)
    if (!pegs[i].hit && pegs[i].type === "orange") n++;
  return n;
}

function scoreBoard(pegs, opts) {
  opts = opts || {};
  var trials = opts.trials || 64;
  var rng = opts.rng || Math.random;
  var greedyMix = opts.greedyMix == null ? 0.6 : opts.greedyMix;
  var stepCap = opts.stepCap || 720;
  var ballCap = opts.ballCap || 30;
  var totalBalls = 0, clears = 0;
  for (var t = 0; t < trials; t++) {
    var sim = pegs.map(function (p) { return { x: p.x, y: p.y, r: p.r, type: p.type, hit: false }; });
    var query = simGrid(sim, 48);
    var used = 0;
    while (simOrangeLeft(sim) > 0 && used < ballCap) {
      used++;
      var a = rng() < greedyMix ? simGreedyAngle(sim, rng) : simRandAngle(rng);
      simFireBall(sim, query, a, stepCap);
    }
    totalBalls += used;
    if (simOrangeLeft(sim) === 0) clears++;
  }
  return { expectedBalls: totalBalls / trials, clearProb: clears / trials, trials: trials };
}

/* ============================ board validator =============================
 * validateBoard(pegs, opts): hard geometric assertions every generated board
 * must pass. Research notes: Poisson-disk layouts guarantee a MINIMUM
 * distance (no clumps/overlaps); our hex lattice gives that by construction,
 * but mask-clipped lattices ALSO need boundary hygiene — no disconnected
 * strays, no holes. So the validator asserts:
 *   1. uniform ball size  — every peg's stored radius is exactly PEG_R
 *      (the purple ult is drawn 1.3x at render time, deliberately, so it
 *      reads as the power peg; its hitbox stays PEG_R)
 *   2. no overlaps        — nearest neighbor >= 2*PEG_R + 4
 *   3. even spacing       — nearest neighbor within 1.4x of pitch
 *      (the no-overlap rule is the effective lower bound)
 *   4. no lonely pegs     — every peg has >= 2 neighbors within 1.6x pitch
 *      (boards with >= 8 pegs); strays are pruned at generation, this is
 *      the backstop
 *   5. specials exact     — exactly 1 purple, orange/green counts match spec
 * Returns {ok, failures[], minNN, maxNN, lonely}. generateBoard() rejects
 * candidates that fail, so "looks right" is a gate, not a vibe.
 * ========================================================================== */
function validateBoard(pegs, opts) {
  opts = opts || {};
  var failures = [];
  var pitch = opts.pitchPx || TUNING.LATTICE_SPACING * SHAPE_SX;
  var i, j;
  for (i = 0; i < pegs.length; i++) {
    if (pegs[i].r !== PEG_R) {
      failures.push("ball size: peg " + i + " r=" + pegs[i].r + ", expected " + PEG_R);
      break;
    }
  }
  var minNN = Infinity, maxNN = 0, lonely = 0;
  var r16 = pitch * pitch * 2.56; // (1.6x)^2
  for (i = 0; i < pegs.length; i++) {
    var best = Infinity, cnt = 0;
    for (j = 0; j < pegs.length; j++) {
      if (i === j) continue;
      var dx = pegs[i].x - pegs[j].x, dy = pegs[i].y - pegs[j].y;
      var d2 = dx * dx + dy * dy;
      if (d2 < best) best = d2;
      if (d2 < r16) cnt++;
    }
    best = Math.sqrt(best);
    if (best < minNN) minNN = best;
    if (best > maxNN) maxNN = best;
    if (cnt < 2) lonely++;
  }
  if (minNN < 2 * PEG_R + 4)
    failures.push("overlap: nearest neighbors " + minNN.toFixed(1) + "px apart (< " + (2 * PEG_R + 4) + "px)");
  if (maxNN > pitch * 1.4)
    failures.push("gap: a peg's nearest neighbor is " + maxNN.toFixed(1) + "px away (> 1.4x pitch " + pitch.toFixed(1) + "px)");
  if (pegs.length >= 8 && lonely > 0)
    failures.push("lonely: " + lonely + " peg(s) with fewer than 2 neighbors");
  if (opts.oranges != null) {
    var no = 0, ng = 0, np = 0, nb = 0;
    for (i = 0; i < pegs.length; i++) {
      if (pegs[i].type === "orange") no++;
      else if (pegs[i].type === "green") ng++;
      else if (pegs[i].type === "purple") np++;
      else if (pegs[i].type === "blue") nb++;
    }
    if (np !== 1) failures.push("specials: " + np + " purple pegs, expected exactly 1");
    if (no !== opts.oranges) failures.push("specials: " + no + " oranges, expected " + opts.oranges);
    if (opts.greens != null && ng !== opts.greens) failures.push("specials: " + ng + " greens, expected " + opts.greens);
    // a board that's nearly all specials isn't a board — half of it must be
    // plain blue pegs to bounce off
    if (nb < no + ng + np) failures.push("degenerate: only " + nb + " blue pegs for " + (no + ng + np) + " specials");
  }
  return { ok: failures.length === 0, failures: failures, minNN: minNN, maxNN: maxNN, lonely: lonely };
}

function orangeCount() {
  var n = 0;
  for (var i = 0; i < G.pegs.length; i++)
    if (G.pegs[i].type === "orange" && !G.pegs[i].hit) n++;
  return n;
}
function unhitNonOrange() {
  var n = 0;
  for (var i = 0; i < G.pegs.length; i++) {
    var p = G.pegs[i];
    if (!p.hit && p.type !== "orange" && p.type !== "junk") n++;
  }
  return n;
}

/* ============================ enemies ===================================== */
// The Cat-Fear Menagerie. Chapter 1 rotates vacuum/spray/hairball, chapter 2
// rotates cucumber/reddot/storm — never the same twice in a row.
var ENEMIES = {
  vacuum:   { name: "The Vacuum",        icon: "🌀", sub: "it hungers for yarn", boss: false },
  spray:    { name: "The Spray Bottle",  icon: "💦", sub: "psst. psst.", boss: false },
  hairball: { name: "The Hairball",      icon: "🐈", sub: "it just sits there. menacingly.", boss: false },
  cucumber: { name: "The Cucumber",      icon: "🥒", sub: "it appeared from nowhere", boss: false },
  reddot:   { name: "The Red Dot",       icon: "🔴", sub: "you can never catch it", boss: false },
  storm:    { name: "The Thunderstorm",  icon: "⛈️", sub: "the sky is falling", boss: false },
  bath:     { name: "THE BATH",          icon: "🛁", sub: "boss — strikes every 3 shots", boss: true },
  carrier:  { name: "THE VET'S CARRIER", icon: "🧳", sub: "final boss — strikes every 3 shots", boss: true },
};

function makeEnemy(typeId, depth, nodeType, adaptive) {
  var def = ENEMIES[typeId];
  if (!def) return null;
  var isBoss = !!def.boss;
  var hp = Logic.enemyHP(depth, { boss: isBoss, elite: nodeType === "elite", adaptive: adaptive });
  return {
    type: typeId, name: def.name, icon: def.icon, sub: def.sub, boss: isBoss,
    hp: hp, maxhp: hp,
    shotsTaken: 0, telegraph: false,
    wob: 0, flash: 0,
  };
}

/* ============================ game state ================================== */
function freshRun(seed) {
  return {
    seed: seed, depth: 1, nodeType: "breather",
    local: 0, earned: 0,                 // treats (per-run 🐟)
    powers: {}, current: null,
    shopYarn: 0, lastEnemy: null,
    path: [],                           // legacy completed-node log (pre-DAG map)
    map: genMap((seed ^ 0x5f3d) >>> 0),  // DAG run map; every run is born valid
    mapPath: [],                        // completed node ids, bottom-up
    nodeId: null,                       // current node id on the map
    freeRestart: true, adRestart: true,
    results: [], consecCatches: 0,
    stats: { pegs: 0, oranges: 0, feats: 0, bosses: 0, shots: 0, catches: 0, retries: 0 },
  };
}

var G = {
  screen: "menu",
  run: null, global: 0,                  // stars (persistent ⭐)
  depth: 1, nodeType: "breather", enemy: null,
  balls: 0, maxBalls: 9,
  pegs: [], ballsInPlay: [], particles: [], texts: [],
  aim: null, holding: false, started: false,
  bucket: { x: W / 2, vx: 95, w: 58, h: 12 },
  slowmo: 0, slowmoT: 0,           // 0=off, 1=armed (last ball fired), 2=cinematic
  slowmoZoom: 1, slowmoFX: W / 2, slowmoFY: 400, // smooth zoom state + focus
  winCineT: 0, winCineX: W / 2, winCineY: 400, // win-cinematic beat state
  ultBeat: 0,                                // Pounce trigger slow-mo beat
  pendingWin: false, failDelay: 0,
  swipeT: 0,
  powerFlash: 0, powerBannerT: 0, powerBannerTxt: "", powerBannerUlt: false,
  shake: 0, t: 0,
  upgrade: null, shop: null, failInfo: null,
  hintTimer: 0,
};

/* ============================ persistence ================================ */
var SAVE_KEY = "peggie_save_v1";
var GLOBAL_KEY = "peggie_global_v1";

function saveRun() {
  if (G.run) { try { store.set(SAVE_KEY, JSON.stringify(G.run)); } catch (e) {} }
}
function loadRun() {
  try { return JSON.parse(store.get(SAVE_KEY) || "null"); } catch (e) { return null; }
}
function clearSave() { store.del(SAVE_KEY); }
function getGlobal() {
  var g = parseInt(store.get(GLOBAL_KEY) || "0", 10);
  return isNaN(g) ? 0 : g;
}
function addGlobal(n) {
  var g = getGlobal() + n;
  store.set(GLOBAL_KEY, String(g));
  G.global = g;
  return g;
}

/* ============================ economy ===================================== */
function awardCoins(n, why) {
  if (!G.run || n <= 0) return;
  G.run.local += n;
  G.run.earned += n;
  if (why) floatText(BOARD_CX, INFO_Y, "+" + n + " 🐟", "#b8860b", 20);
  updateHUD();
  popEl($("hud-treats"));
}

function showFeat(id, label, sub) {
  var reward = TUNING.FEAT_REWARD[id] || 10;
  awardCoins(reward);
  if (G.run) G.run.stats.feats++;
  Sound.feat(); buzz(35);
  G.shake = Math.max(G.shake, 5);
  var box = $("feat");
  if (box) {
    setText($("feat-name"), label);
    setText($("feat-sub"), sub + "  •  +" + reward + " 🐟");
    showEl(box);
    box.classList.remove("play"); void box.offsetWidth; box.classList.add("play");
    var b2 = box;
    setTimeout(function () { hideEl(b2); }, 1900);
  } else {
    floatText(BOARD_CX, 300, label + "!", "#e8930c", 34);
  }
}

/* ============================ enemy canvas art ============================
 * Cute/funny cartoon cat-fears, drawn in the existing pastel style.
 * ========================================================================== */
function drawEnemy(e, x, y, s, t) {
  if (!ctx || !e) return;
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.2) * 4 * s);
  ctx.scale(s, s);
  var bob = Math.sin(t * 3) * 0.03;
  ctx.rotate(bob);

  function eye(ex, ey, r, lookX, lookY, angry) {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2a3a";
    ctx.beginPath(); ctx.arc(ex + lookX, ey + lookY, r * 0.5, 0, Math.PI * 2); ctx.fill();
    if (angry) {
      ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(ex - r - 2, ey - r - 3); ctx.lineTo(ex + r * 0.4, ey - r + 2); ctx.stroke();
    }
  }

  if (e.type === "vacuum") {
    // round grumpy vacuum body + hose + wheels
    ctx.fillStyle = "#8fa3c7";
    ctx.strokeStyle = "#5b6f96"; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-30, -22, 60, 44, 18); else ctx.rect(-30, -22, 60, 44);
    ctx.fill(); ctx.stroke();
    // hose
    ctx.strokeStyle = "#5b6f96"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(20, -20); ctx.quadraticCurveTo(44, -34, 40, -6); ctx.stroke();
    ctx.fillStyle = "#5b6f96";
    ctx.beginPath(); ctx.arc(40, -2, 7, 0, Math.PI * 2); ctx.fill();
    // wheels
    ctx.fillStyle = "#4a3a4a";
    ctx.beginPath(); ctx.arc(-16, 24, 8, 0, Math.PI * 2); ctx.arc(16, 24, 8, 0, Math.PI * 2); ctx.fill();
    eye(-11, -4, 7, 1.5, 1, true); eye(11, -4, 7, 1.5, 1, true);
    // frown
    ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 16, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else if (e.type === "spray") {
    // judgmental spray bottle
    ctx.fillStyle = "#bfe3ff";
    ctx.strokeStyle = "#5b8fc7"; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-18, -6, 36, 38, 9); else ctx.rect(-18, -6, 36, 38);
    ctx.fill(); ctx.stroke();
    // trigger head + nozzle
    ctx.fillStyle = "#8fb8e8";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-13, -26, 26, 20, 6); else ctx.rect(-13, -26, 26, 20);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#5b8fc7";
    ctx.fillRect(9, -23, 15, 8);
    // mist
    ctx.fillStyle = "rgba(159,208,245,.9)";
    for (var m = 0; m < 4; m++) {
      var mx = 30 + m * 8 + Math.sin(t * 5 + m * 1.7) * 2.5;
      ctx.beginPath(); ctx.arc(mx, -19 + (m % 2) * 7, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    // water line
    ctx.strokeStyle = "#5b8fc7"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, 18); ctx.lineTo(12, 18); ctx.stroke();
    eye(-7, 6, 6, 1.5, 0, true); eye(8, 6, 6, 1.5, 0, true);
    ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-6, 24); ctx.lineTo(6, 24); ctx.stroke();
  } else if (e.type === "hairball") {
    // a fuzzy blob of pure menace
    ctx.fillStyle = "#a9805e";
    ctx.strokeStyle = "#7a5638"; ctx.lineWidth = 3;
    var blobs = [[-14, 6, 15], [10, 8, 16], [0, -10, 15], [-4, 16, 12]];
    for (var hb = 0; hb < blobs.length; hb++) {
      ctx.beginPath(); ctx.arc(blobs[hb][0], blobs[hb][1], blobs[hb][2], 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    // fur tufts
    ctx.strokeStyle = "#7a5638"; ctx.lineWidth = 2;
    for (var ft = 0; ft < 6; ft++) {
      var fa = ft * 1.05 + 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(fa) * 22, Math.sin(fa) * 18 + 4);
      ctx.lineTo(Math.cos(fa) * 30, Math.sin(fa) * 26 + 4);
      ctx.stroke();
    }
    eye(-8, -2, 6, 0, 1, true); eye(9, -2, 6, 0, 1, true);
    ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 16, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else if (e.type === "cucumber") {
    // startled cucumber
    ctx.fillStyle = "#5fae4e";
    ctx.strokeStyle = "#3d7a33"; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-16, -30, 32, 60, 16); else ctx.rect(-16, -30, 32, 60);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#3d7a33"; ctx.lineWidth = 2;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(-12, i * 16 - 4); ctx.quadraticCurveTo(0, i * 16, 12, i * 16 - 4); ctx.stroke();
    }
    eye(-7, -10, 5.5, 0, -1, false); eye(7, -10, 5.5, 0, -1, false);
    // open scared mouth
    ctx.fillStyle = "#3a2a3a";
    ctx.beginPath(); ctx.ellipse(0, 10, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === "reddot") {
    // the uncatchable red dot, mid-dash
    ctx.strokeStyle = "rgba(214,58,92,.5)"; ctx.lineWidth = 4; ctx.lineCap = "round";
    for (var sl = 0; sl < 3; sl++) {
      var sy2 = -10 + sl * 10;
      ctx.beginPath(); ctx.moveTo(-44, sy2); ctx.lineTo(-22 - sl * 4, sy2); ctx.stroke();
    }
    var rg = ctx.createRadialGradient(-4, -4, 2, 0, 0, 22);
    rg.addColorStop(0, "#ff8a9a"); rg.addColorStop(0.55, "#e23a5c"); rg.addColorStop(1, "rgba(226,58,92,0)");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e23a5c";
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.beginPath(); ctx.arc(-4, -4, 3.6, 0, Math.PI * 2); ctx.fill();
    eye(-5, 1, 4.6, 2, 0, true); eye(6, 1, 4.6, 2, 0, true);
  } else if (e.type === "storm") {
    // grumpy little thundercloud
    ctx.fillStyle = "#7b8aa8";
    ctx.strokeStyle = "#4a5570"; ctx.lineWidth = 3;
    var puffs = [[-20, 2, 14], [-6, -8, 16], [10, -6, 15], [22, 4, 12], [2, 6, 16]];
    for (var pf = 0; pf < puffs.length; pf++) {
      ctx.beginPath(); ctx.arc(puffs[pf][0], puffs[pf][1], puffs[pf][2], 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    // rain
    ctx.strokeStyle = "#7cc7ee"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    for (var rn = 0; rn < 4; rn++) {
      var rx = -18 + rn * 12, ry = 18 + ((t * 70 + rn * 17) % 22);
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 7); ctx.stroke();
    }
    // lightning bolt
    ctx.fillStyle = "#ffd94d";
    ctx.strokeStyle = "#d9a400"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, -4); ctx.lineTo(-8, 12); ctx.lineTo(-1, 12); ctx.lineTo(-9, 28);
    ctx.lineTo(4, 10); ctx.lineTo(-3, 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    eye(-10, -4, 5.5, 0, 1, true); eye(6, -6, 5.5, 0, 1, true);
  } else if (e.type === "bath") {
    // menacing bathtub
    ctx.fillStyle = "#f4f6fb";
    ctx.strokeStyle = "#9aa7c7"; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-38, -12, 76, 34, 10); else ctx.rect(-38, -12, 76, 34);
    ctx.fill(); ctx.stroke();
    // water
    ctx.fillStyle = "#7cc7ee";
    ctx.beginPath(); ctx.ellipse(0, -10, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
    // shower head + drops
    ctx.strokeStyle = "#9aa7c7"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(30, -12); ctx.lineTo(30, -34); ctx.stroke();
    ctx.fillStyle = "#9aa7c7";
    ctx.beginPath(); ctx.arc(24, -36, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#7cc7ee";
    for (var d = 0; d < 3; d++) {
      var dy = ((t * 60 + d * 14) % 26);
      ctx.beginPath(); ctx.arc(18 + d * 6, -30 + dy, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    eye(-14, 6, 7, 0, 1, true); eye(12, 6, 7, 0, 1, true);
    ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-8, 18); ctx.lineTo(8, 18); ctx.stroke();
    // feet
    ctx.fillStyle = "#9aa7c7";
    ctx.beginPath(); ctx.arc(-24, 26, 6, 0, Math.PI * 2); ctx.arc(24, 26, 6, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === "carrier") {
    // pet carrier with glowing eyes inside
    ctx.fillStyle = "#c9a06a";
    ctx.strokeStyle = "#8a6435"; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-36, -26, 72, 52, 8); else ctx.rect(-36, -26, 72, 52);
    ctx.fill(); ctx.stroke();
    // door grid
    ctx.fillStyle = "#2c2130";
    ctx.fillRect(-22, -16, 44, 34);
    ctx.strokeStyle = "#8a6435"; ctx.lineWidth = 2;
    for (var gx = -22; gx <= 22; gx += 8) { ctx.beginPath(); ctx.moveTo(gx, -16); ctx.lineTo(gx, 18); ctx.stroke(); }
    for (var gy = -16; gy <= 18; gy += 8) { ctx.beginPath(); ctx.moveTo(-22, gy); ctx.lineTo(22, gy); ctx.stroke(); }
    // glowing eyes in the dark
    var gl = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.fillStyle = "rgba(255,220,80," + gl.toFixed(2) + ")";
    ctx.beginPath(); ctx.arc(-8, -2, 4.5, 0, Math.PI * 2); ctx.arc(8, -2, 4.5, 0, Math.PI * 2); ctx.fill();
    // handle
    ctx.strokeStyle = "#8a6435"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-18, -26); ctx.quadraticCurveTo(0, -40, 18, -26); ctx.stroke();
  }
  ctx.restore();

  // hit flash ring
  if (e.flash > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(e.flash * 2, 0, 0.8);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, 44 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

/* ============================ the kitten ==================================
 * Canvas kitten, top-left, facing the enemy. Swipes its paw on every shot
 * and every damage event — paw arc + slash streaks + impact star.
 * ========================================================================== */
function drawCat(x, y, s, t) {
  if (!ctx) return;
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2) * 3 * s);
  ctx.scale(s, s);
  // tail curl
  ctx.strokeStyle = "#e8b98a"; ctx.lineWidth = 9; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-22, 18);
  ctx.quadraticCurveTo(-44, 8, -34, -14 + Math.sin(t * 3) * 4); ctx.stroke();
  // body
  ctx.fillStyle = "#f7e8d0"; ctx.strokeStyle = "#d9a86c"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, 14, 22, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tabby stripes
  ctx.strokeStyle = "#e8b98a"; ctx.lineWidth = 2;
  for (var st = -1; st <= 1; st++) {
    ctx.beginPath(); ctx.moveTo(st * 10 - 4, 2); ctx.lineTo(st * 10 + 4, 2); ctx.stroke();
  }
  // head
  ctx.fillStyle = "#f7e8d0"; ctx.strokeStyle = "#d9a86c"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(8, -14, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // ears
  ctx.fillStyle = "#f7e8d0"; ctx.strokeStyle = "#d9a86c";
  [[-4, -26], [20, -26]].forEach(function (ep) {
    ctx.beginPath(); ctx.moveTo(ep[0] - 7, ep[1] + 8); ctx.lineTo(ep[0], ep[1] - 4); ctx.lineTo(ep[0] + 7, ep[1] + 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f5b8c8";
    ctx.beginPath(); ctx.moveTo(ep[0] - 3.5, ep[1] + 4); ctx.lineTo(ep[0], ep[1] - 1); ctx.lineTo(ep[0] + 3.5, ep[1] + 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f7e8d0";
  });
  // eyes (locked on the enemy), blush, mouth
  ctx.fillStyle = "#3a2a3a";
  ctx.beginPath(); ctx.arc(12, -16, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, -16, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(245,150,170,.55)";
  ctx.beginPath(); ctx.arc(6, -8, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#a06a5a"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(17, -9, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
}

// trigger the swipe; called on every shot fired and every damage event
function catSwipe() { G.swipeT = 0.0001; }

function drawSwipe() {
  if (!ctx || G.swipeT <= 0) return;
  var dur = 0.5, p = clamp(G.swipeT / dur, 0, 1);
  var sx = CAT_X + 26, sy = CAT_Y + 8;         // paw rest
  var ex = ENEMY_X - 40, ey = ENEMY_Y;         // impact point
  var px = lerp(sx, ex, p), py = lerp(sy, ey, p) - Math.sin(p * Math.PI) * 42;
  ctx.save();
  // paw: pad + toe beans
  var pa = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
  ctx.globalAlpha = clamp(pa, 0, 1);
  ctx.fillStyle = "#f7e8d0"; ctx.strokeStyle = "#d9a86c"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f5b8c8";
  [[-7, -11], [0, -14], [7, -11]].forEach(function (o) {
    ctx.beginPath(); ctx.arc(px + o[0], py + o[1], 3.4, 0, Math.PI * 2); ctx.fill();
  });
  ctx.beginPath(); ctx.ellipse(px, py + 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  // slash streaks across the enemy
  if (p > 0.45) {
    var sa = 1 - (p - 0.45) / 0.55;
    ctx.globalAlpha = clamp(sa, 0, 1) * 0.9;
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.lineCap = "round";
    for (var i = 0; i < 3; i++) {
      var yy = ey - 18 + i * 16;
      ctx.beginPath(); ctx.moveTo(ex - 26, yy - 10); ctx.quadraticCurveTo(ex, yy + 4, ex + 26, yy - 12); ctx.stroke();
    }
  }
  // impact star
  if (p > 0.6) {
    var ia = 1 - (p - 0.6) / 0.4, ir = 10 + (p - 0.6) * 90;
    ctx.globalAlpha = clamp(ia, 0, 1);
    ctx.fillStyle = "#ffd94d"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var s2 = 0; s2 < 8; s2++) {
      var a2 = s2 * Math.PI / 4, rr = s2 % 2 === 0 ? ir : ir * 0.45;
      var vx2 = ex + Math.cos(a2) * rr, vy2 = ey + Math.sin(a2) * rr;
      if (s2 === 0) ctx.moveTo(vx2, vy2); else ctx.lineTo(vx2, vy2);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/* ============================ juice ======================================= */
function floatText(x, y, txt, color, size) {
  // ENEMY_SAFE_Y floor: canvas text must never spawn behind the DOM enemy
  // plate / HUD pills (top of screen), whatever y the caller passes.
  G.texts.push({ x: clamp(x, 60, W - 60), y: Math.max(y, ENEMY_SAFE_Y), txt: txt, color: color || "#fff",
                 size: size || 18, t: 0, life: 1.4, vy: -46 });
}
function burst(x, y, color, n, spd) {
  for (var i = 0; i < (n || 10); i++) {
    var a = Math.random() * Math.PI * 2, s = (spd || 160) * (0.35 + Math.random());
    G.particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
                       t: 0, life: 0.5 + Math.random() * 0.5, color: color, r: 2 + Math.random() * 3 });
  }
}
function ringFx(x, y, color) {
  G.particles.push({ ring: true, x: x, y: y, t: 0, life: 0.45, color: color || "#fff" });
}
function addShake(n) { G.shake = Math.max(G.shake, n); }

function showHint(key, text, ms) {
  if (seen[key]) return;
  markSeen(key);
  var h = $("hint");
  if (!h) return;
  setText(h, text);
  showEl(h);
  G.hintTimer = (ms || 4200) / 1000;
}

// telegraphed boss warning under the enemy HP bar
function showTell(txt) { setText($("enemy-tell"), txt || ""); }

/* ============================ battle setup ================================ */
function hideOverlays() {
  ["menu", "map", "upgrade", "shop", "result", "victory", "adstub"].forEach(function (id) { hideEl($(id)); });
  hideEl($("hint"));
}

function startBattle() {
  var run = G.run;
  if (!run) return;
  var depth = run.depth, nodeType = run.nodeType;
  G.depth = depth; G.nodeType = nodeType;

  var rng = mulberry32((run.seed ^ (depth * 7919) ^ (nodeType.length * 131)) >>> 0);
  G.pegs = layoutFor(depth, nodeType, rng);
  var adaptive = Logic.adaptiveMult(run.results);
  var erng = mulberry32((run.seed ^ (depth * 104729)) >>> 0);
  var typeId = Logic.enemyForDepth(depth, nodeType, run.lastEnemy, erng);
  if (typeId) run.lastEnemy = typeId; // never the same twice in a row
  G.enemy = makeEnemy(typeId, depth, nodeType, adaptive);

  G.maxBalls = Logic.maxBalls(depth);
  G.balls = G.maxBalls + (run.shopYarn || 0); // Extra Yarn from the shop
  run.shopYarn = 0;
  G.ballsInPlay = []; G.particles = []; G.texts = [];
  G.aim = null; G.holding = false;
  G.slowmo = 0; G.slowmoT = 0; G.slowmoZoom = 1;
  G.pendingWin = false; G.failDelay = 0;
  G.swipeT = 0; G.shop = null;
  G.powerFlash = 0; G.powerBannerT = 0; G.powerBannerUlt = false;
  G.ultBeat = 0; G.winCineT = 0;
  G.bucket.x = W / 2; G.bucket.vx = 95;
  G.started = true;
  G.screen = "play";
  hideOverlays();
  showEl($("hud"));
  updateHUD();
  showTell("");
  Sound.resetPegStreak();

  // chapter cards: non-blocking, auto-dismiss
  var ch = Logic.chapterForDepth(depth);
  if (depth === 1 || depth === 11) showChapter(ch.n, ch.title);
  if (G.enemy && G.enemy.boss) showBossBanner(G.enemy);

  // zero-text teaching, first encounters only
  if (depth === 1) showHint("d1", "👆 drag to aim, release to fire the yarn ball");
  else if (depth === 2 && nodeType !== "treasure") {
    showHint("d2", "pegs damage " + G.enemy.name + " — empty its HP bar!");
    showHint("green2", "🟢 green pegs fire your equipped power!");
    if (G.run.powers && G.run.current)
      showHint("purple", "🟣 the purple peg is your POUNCE ult!");
  }
  if (G.enemy && G.enemy.boss) showHint("boss", "⚠️ the boss strikes every 3 shots — watch the warning!");

  Music.onLevelStart(depth, !!(G.enemy && G.enemy.boss));
  saveRun();
}

function enterNode(nodeId) {
  var run = G.run;
  if (!run || !run.map) return;
  var nd = mapNodeById(run.map, nodeId);
  if (!nd) return;
  if (!isMapChoice(run, nodeId)) return; // map UI only offers reachable nodes; guard anyway
  Sound.click();
  run.nodeId = nodeId;
  run.nodeType = nd.type;
  if (nd.type === "shop") { showShop(); return; } // treats sink: no battle, just shopping
  startBattle();
}

/* ============================ shooting ==================================== */
function makeBall(x, y, vx, vy) {
  return {
    x: x, y: y, vx: vx, vy: vy, r: BALL_R,
    heavy: false, heavyLv: 0, pierce: 0,
    wallBounced: false, firstHit: false, pegsHit: 0,
    hitSet: {}, dead: false, caught: false, t: 0,
  };
}

function fire() {
  if (!G.started || G.slowmo > 0) return;
  if (G.balls <= 0 || G.ballsInPlay.length > 0) return;
  if (!G.aim) return;
  var sp = BALL_SPEED;
  G.ballsInPlay.push(makeBall(LAUNCH_X, BALL_START_Y, G.aim.dx * sp, G.aim.dy * sp));
  G.balls--;
  // the LAST ball of the level gets the cinematic — armed at launch, so
  // multiball splits from this shot are covered too
  if (G.balls === 0 && G.slowmo === 0) { G.slowmo = 1; G.slowmoT = 0; }
  popEl($("hud-balls")); // neutral scale-pop on the counter — no red penalties
  catSwipe(); // the kitten bats at the enemy with every shot
  if (G.run) {
    G.run.stats.shots++;
  }
  Sound.shoot(); buzz(12);
  // boss strike countdown
  var e = G.enemy;
  if (e && e.boss) {
    e.shotsTaken++;
    if (e.shotsTaken % TUNING.BOSS_ATTACK_EVERY === 0) {
      e.telegraph = true;
      showTell("⚠️ " + e.name + " is winding up…");
    }
  }
  Music.setIntensity(clamp(1 - G.balls / G.maxBalls, 0, 1));
  updateHUD();
}

/* ============================ powers ====================================== */
function firePower(ball) {
  var run = G.run;
  if (!run || !run.current) return;
  var id = run.current, lv = run.powers[id] || 0;
  if (!lv) return;
  var def = Logic.powerDef(id);
  G.powerBannerTxt = def.icon + " " + def.name.toUpperCase() + (lv > 1 ? " Lv" + lv : "") + "!";
  G.powerBannerT = 1.6;
  G.powerFlash = 0.5;
  Sound.power();
  buzz(30);

  if (id === "multiball") {
    var n = TUNING.MULTIBALL_EXTRA[lv] || 2;
    for (var i = 0; i < n; i++) {
      var a = -0.5 + (i / Math.max(1, n - 1)) * 1.0;
      var sp = Math.hypot(ball.vx, ball.vy) || 700;
      var base = Math.atan2(ball.vy, ball.vx);
      var nb = makeBall(ball.x, ball.y, Math.cos(base + a) * sp, Math.sin(base + a) * sp);
      if (ball.heavy) { nb.heavy = true; nb.heavyLv = ball.heavyLv; nb.r = ball.r; }
      G.ballsInPlay.push(nb);
      burst(ball.x, ball.y, "#ffd166", 6, 220);
    }
    // (no "SPLIT!" floater — the center power banner already announces it)
  } else if (id === "pierce") {
    ball.pierce = TUNING.PIERCE_THROUGH[lv] || 4;
    ringFx(ball.x, ball.y, "#7cc7ee");
    // (no "PIERCE!" floater — the center power banner already announces it)
  } else if (id === "heavy") {
    ball.heavy = true; ball.heavyLv = lv;
    ball.r = BALL_R * (TUNING.HEAVY_RADIUS[lv] || 1.4);
    ringFx(ball.x, ball.y, "#e07f2e");
    // (no "HEAVY!" floater — the center power banner already announces it)
  }
}

/* ============================ peg hits ==================================== */
function hitPeg(ball, peg) {
  if (peg.hit) return;
  var lastOrange = peg.type === "orange" && orangeCount() === 1;
  peg.hit = true; peg.anim = 1; peg.lit = 1;
  ball.pegsHit++;
  var key = G.pegs.indexOf(peg);
  ball.hitSet[key] = 1;

  var run = G.run;
  var isElite = G.nodeType === "elite";
  var isCrit = peg.type === "orange";

  // --- named feats: first-contact tracking
  if (!ball.firstHit) {
    ball.firstHit = true;
    var d = Math.hypot(ball.x - LAUNCH_X, ball.y - BALL_START_Y);
    if (d > H * 0.6) showFeat("longshot", "LONG SHOT", "way downtown 🎯");
    if (ball.wallBounced) showFeat("offwall", "OFF THE WALL", "banked it in 🧱");
  }
  if (lastOrange) showFeat("lastpeg", "LAST PEG", "cleaned 'em out 🧹");

  // --- damage: numbers pop at the peg hit (clamped below the enemy plate
  // by the floatText floor) so every peg visibly pays off; the enemy itself
  // wobbles + flashes and its HP bar shrinks, and the kitten swipes at it
  if (G.enemy && peg.type !== "junk") {
    var dmg = Logic.pegDamage(peg.type, ball.heavy ? "heavy" : null, ball.heavyLv);
    if (ball.ult) dmg *= TUNING.ULT_DMG_MULT; // Pounce: 3x damage
    G.enemy.hp = Math.max(0, G.enemy.hp - dmg);
    G.enemy.wob = 1; G.enemy.flash = 0.5;
    catSwipe(); // the kitten bats the enemy for every damaging peg
    floatText(peg.x, peg.y - 30,
      "-" + dmg + (isCrit ? " CRIT" : ""), isCrit ? "#e07f2e" : "#d63a5c", isCrit ? 26 : 19);
    updateEnemyHP();
  }

  // --- treats
  awardCoins(Logic.coinForPeg(peg.type, isElite));
  if (run) {
    run.stats.pegs++;
    if (peg.type === "orange") run.stats.oranges++;
  }

  // --- juice + sfx
  var col = isCrit ? "#ff9a3d" : peg.type === "green" ? "#4dffa6"
          : peg.type === "purple" ? "#c86bff"
          : peg.type === "junk" ? "#9aa0b5" : "#7cc7ee";
  burst(peg.x, peg.y, col, isCrit || peg.type === "purple" ? 16 : 9, 200);
  ringFx(peg.x, peg.y, col);
  Sound.peg(ball.pegsHit);
  addShake(isCrit ? 3 : 1.5);
  if (isCrit || peg.type === "purple") buzz(isCrit ? 18 : 12); // tactile pop on the big hits
  if (isCrit) floatText(peg.x, peg.y - 26, "CRIT!", "#e07f2e", 22);

  // --- peg roles: green fires the equipped power (classic Peggle),
  // --- purple is the POUNCE ult — one per board, unmistakable in purple.
  // --- During the ult's moment (banner live) greens stay quiet: the ult owns
  // --- the show, so a mid-chaos power can never clobber its banner or reshape
  // --- its balls.
  if (peg.type === "green") {
    if (!(G.powerBannerUlt && G.powerBannerT > 0)) firePower(ball);
  } else if (peg.type === "purple") {
    firePounce(ball, peg);
  }

  // --- win check
  var won = G.enemy ? G.enemy.hp <= 0 : orangeCount() === 0;
  if (won && !G.pendingWin) triggerWin(peg.x, peg.y);

  // --- safety net: pegs ran out before the enemy died. On enemy levels the
  // --- win comes from the enemy's HP bar, not the oranges — so a nearly
  // --- empty board with a living enemy must refresh even when zero oranges
  // --- remain. (Otherwise: every peg cleared + enemy at 1 HP = soft-lock,
  // --- the board sits empty with balls left and no way to deal damage.)
  if (G.enemy && G.enemy.hp > 0 && unhitNonOrange() < TUNING.REFRESH_AT) {
    boardRefresh();
  }
  updateHUD();
}

// POUNCE — the purple-peg ult. One per board: screen flash + banner + a
// 0.4s slow-mo beat, the ball bursts into 5, ALL of them pierce through
// pegs, 3x damage.
function firePounce(ball, peg) {
  Sound.ult();
  buzz(50);
  G.powerFlash = 1.0;
  G.powerBannerTxt = "🌟 POUNCE!";
  G.powerBannerT = 2.2;
  G.powerBannerUlt = true;
  G.ultBeat = TUNING.ULT_BEAT; // brief slow-mo beat right at the trigger
  // the triggering ball goes ult too — then it bursts into the full five
  ball.ult = true;
  ball.pierce = TUNING.ULT_PIERCE;
  var sp = Math.hypot(ball.vx, ball.vy) || 700;
  var base = Math.atan2(ball.vy, ball.vx);
  var n = TUNING.ULT_BURST_BALLS - 1;
  for (var i = 0; i < n; i++) {
    var a = -0.6 + (i / Math.max(1, n - 1)) * 1.2;
    var nb = makeBall(ball.x, ball.y, Math.cos(base + a) * sp, Math.sin(base + a) * sp);
    nb.ult = true;
    nb.pierce = TUNING.ULT_PIERCE;
    if (ball.heavy) { nb.heavy = true; nb.heavyLv = ball.heavyLv; nb.r = ball.r; }
    G.ballsInPlay.push(nb);
    burst(ball.x, ball.y, "#ffd166", 8, 260);
  }
  burst(peg.x, peg.y, "#fff3b0", 24, 320);
  burst(peg.x, peg.y, "#e9c8ff", 18, 240);
  ringFx(peg.x, peg.y, "#ffd166");
  // (no "ULT!" floater — the POUNCE center banner already announces it)
  addShake(6);
}

function boardRefresh() {
  var n = 0;
  for (var i = 0; i < G.pegs.length; i++) {
    var p = G.pegs[i];
    // the single purple peg never refreshes — one per board, always
    if (p.hit && p.type === "blue") {
      p.hit = false; p.anim = 1; n++;
    }
  }
  if (n > 0) {
    floatText(BOARD_CX, INFO_Y, "fresh yarn! 🧶", "#4dffa6", 24);
    Sound.green();
  }
}

/* ============================ boss attacks ================================
 * Only bosses attack — every 3 shots, telegraphed. Either eats 1 ball or
 * spawns 3 grey junk pegs. Cartoon bonk on the kitten mascot.
 * ========================================================================== */
function doBossAttack() {
  var e = G.enemy;
  if (!e || !e.boss) return;
  Music.onBossAttack();
  if (Math.random() < 0.5) {
    // eat a ball — neutral tick on the HUD counter, never a red penalty
    if (G.balls > 0) G.balls--;
    floatText(BOARD_CX, INFO_Y, "nom… 🧶×" + G.balls, "#8a7a8a", 17);
    showTell(e.name + " eats a ball!");
  } else {
    spawnJunk(TUNING.BOSS_JUNK_PEGS);
    floatText(BOARD_CX, INFO_Y, "junk pegs! 🗑️", "#9aa0b5", 22);
    showTell(e.name + " clogs the board!");
  }
  floatText(CAT_X, CAT_Y - 46, "OW!", "#d63a5c", 30); // cartoon bonk on the kitten
  Sound.bonk();
  addShake(8);
  updateHUD();
}

function spawnJunk(n) {
  var rng = Math.random, placed = 0, guard = 0;
  while (placed < n && guard++ < 200) {
    var x = PEG_LEFT + rng() * (PEG_RIGHT - PEG_LEFT);
    var y = PEG_TOP + rng() * (PEG_BOTTOM - PEG_TOP);
    var ok = true;
    for (var i = 0; i < G.pegs.length; i++) {
      if (dist2(x, y, G.pegs[i].x, G.pegs[i].y) < 44 * 44) { ok = false; break; }
    }
    if (!ok) continue;
    var p = mkPeg(x, y, "junk"); p.anim = 1;
    G.pegs.push(p);
    burst(x, y, "#9aa0b5", 8, 150);
    placed++;
  }
}

/* ============================ win / lose ================================== */
function triggerWin(x, y) {
  if (G.pendingWin) return;
  G.pendingWin = true;
  // WIN CINEMATIC: the level-winning hit gets a camera zoom toward the hit
  // plus a slow-mo beat while the shot drains — on EVERY level clear, even
  // with reserves left. Skipped only when the last-ball cinema is already
  // running: one combined beat, never a double cinema.
  if (G.slowmo !== 2) {
    G.winCineT = TUNING.WIN_CINE_TIME;
    G.winCineX = (typeof x === "number") ? x : BOARD_CX;
    G.winCineY = (typeof y === "number") ? y : 400;
    G.powerFlash = Math.max(G.powerFlash, 0.7);
    Sound.slowmo();
  }
  // the win resolves when the shot's balls drain (see update)
}

function finishWin() {
  var run = G.run;
  if (!run) return;
  var nodeType = G.nodeType;
  var bonus = Logic.winBonus(nodeType);
  if (bonus) awardCoins(bonus, true);

  var close = G.balls <= 2;
  run.results.push(Logic.resultScore(true, G.balls));
  if (G.enemy && G.enemy.boss) run.stats.bosses++;
  run.consecCatches = 0;
  // record the completed node for the map's path history
  if (!run.mapPath) run.mapPath = [];
  if (run.nodeId) run.mapPath.push(run.nodeId);
  saveRun();

  // final boss -> story complete
  if (G.depth >= TUNING.FINAL_DEPTH && G.enemy && G.enemy.boss) { victory(); return; }
  showUpgrade(nodeType === "elite");
}

function showFail() {
  if (G.screen !== "play") return;
  Music.onLose(); // Sound.lose() already played in the "SO CLOSE!" drama beat
  var run = G.run;
  var left = G.enemy ? G.enemy.hp + " HP left on " + G.enemy.name
                     : orangeCount() + (orangeCount() === 1 ? " peg left" : " pegs left");
  G.failInfo = { left: left };
  G.screen = "fail";

  var t = $("result-title"), s = $("result-sub");
  var res = $("result");
  if (res) { res.classList.add("lost"); res.classList.remove("dead"); }
  hideEl($("result-stats"));
  setText(t, "SO CLOSE!");
  setText(s, left + " — SO CLOSE!");
  setText($("result-score"), "");
  var stats = run ? "depth " + run.depth + "  •  " + run.stats.pegs + " pegs popped  •  " + run.stats.feats + " feats" : "";
  setText($("result-best"), stats);

  var rb = $("btn-retry");
  if (rb) {
    rb.onclick = retryLevel; // restore after the death screen repurposes this button
    if (run && run.freeRestart) { rb.textContent = "↻ Retry — FREE"; rb.style.display = ""; rb.disabled = false; }
    else if (run && run.adRestart) { rb.textContent = "↻ Retry — 📺 ad"; rb.style.display = ""; rb.disabled = false; }
    else { rb.style.display = "none"; }
  }
  var gb = $("btn-giveup");
  if (gb) { gb.style.display = ""; gb.textContent = (run && (run.freeRestart || run.adRestart)) ? "Give Up" : "Run Over →"; }
  hideEl($("btn-next"));
  hideEl($("hud"));
  showEl($("result"));
  saveRun();
}

// AD_STUB: real rewarded ads plug in here. The placeholder grants the restart
// with a clearly-labeled screen ("have this one on us").
function retryLevel() {
  var run = G.run;
  if (!run) return;
  Sound.click();
  if (run.freeRestart) {
    run.freeRestart = false;
    run.results.push(0);
    run.stats.retries++;
    startBattle(); // instant, same depth
  } else if (run.adRestart) {
    showAdStub(function () {
      run.adRestart = false;
      run.results.push(0);
      run.stats.retries++;
      startBattle();
    });
  }
}

function showAdStub(cb) {
  // AD_STUB — replace with the ad SDK's rewarded placement later.
  G.screen = "adstub";
  hideEl($("result"));
  showEl($("adstub"));
  var btn = $("btn-ad-done");
  if (btn) {
    btn.onclick = function () {
      Sound.click();
      hideEl($("adstub"));
      cb();
    };
  } else { cb(); }
}

function giveUp() {
  Sound.click();
  die();
}

function statLine(icon, label, val) {
  return "<div class='stat-line'><span>" + icon + " " + label + "</span><b>" + val + "</b></div>";
}

function die() {
  var run = G.run;
  var banked = 0, depth = 1, earned = 0;
  if (run) {
    banked = Logic.bankToGlobal(run.earned);
    if (banked > 0) addGlobal(banked);
    depth = run.depth; earned = run.earned;
    clearSave();
  }
  // best depth persists across runs
  var best = parseInt(store.get("peggie_best") || "0", 10) || 0;
  if (depth > best) { best = depth; try { store.set("peggie_best", String(best)); } catch (e) {} }
  G.run = null;
  G.screen = "dead";
  Music.onLose();
  hideOverlays(); hideEl($("hud"));

  var res = $("result");
  if (res) { res.classList.add("lost"); res.classList.add("dead"); }
  setText($("result-title"), "The dream ends…");
  setText($("result-sub"), "the kitten stirs, stretches, and forgets everything.");
  setText($("result-score"), "");
  var st = $("result-stats");
  if (st) {
    st.innerHTML =
      statLine("📍", "depth reached", depth + " / " + TUNING.FINAL_DEPTH) +
      statLine("🐟", "treats earned", earned) +
      statLine("⭐", "stars banked", banked) +
      statLine("🏆", "best depth", best);
    showEl(st);
  }
  setText($("result-best"), banked > 0 ? "25% of your 🐟 treats became ⭐ stars" : "no treats to bank this time");
  var rb = $("btn-retry");
  if (rb) {
    rb.textContent = "↻ Retry";
    rb.style.display = "";
    rb.disabled = false;
    rb.onclick = function () { newRun(); };
  }
  var gb = $("btn-giveup"); if (gb) { gb.style.display = "none"; }
  var nb = $("btn-next"); if (nb) { nb.style.display = "none"; }
  var mb = $("btn-menu");
  if (mb) { mb.textContent = "menu"; mb.style.display = ""; }
  showEl($("result"));
}

function victory() {
  var run = G.run;
  var banked = 0;
  if (run) {
    banked = Logic.bankToGlobal(run.earned);
    if (banked > 0) addGlobal(banked);
    clearSave();
  }
  G.run = null;
  G.screen = "victory";
  hideOverlays(); hideEl($("hud"));
  Music.onWin();
  setText($("victory-stats"), "the kitten wakes up… mostly.<br><b>Story complete — Endless coming soon 🐾</b>" +
    (banked > 0 ? "<br>+" + banked + " ⭐ banked — 25% of your 🐟 treats became ⭐ stars" : ""));
  showEl($("victory"));
}

/* ============================ upgrades ====================================
 * One upgrade per level: exactly one offer, Take / Skip, then the map.
 * ========================================================================== */
function showUpgrade() {
  var run = G.run;
  if (!run) return;
  G.screen = "upgrade";
  hideOverlays(); hideEl($("hud"));

  var rng = mulberry32(((run.seed ^ 0x9e37) + run.depth * 101) >>> 0);
  G.upgrade = { choice: Logic.singleUpgradeOffer(run.powers, rng) };

  setText($("upgrade-title"), run.depth === 1 ? "CHOOSE YOUR FIRST POWER" : "POWER UP!");
  if (typeof document === "undefined") return;
  paintUpgrade();
  showEl($("upgrade"));
}

function paintUpgrade() {
  var run = G.run, up = G.upgrade;
  if (!run || !up || typeof document === "undefined") return;

  // owned powers row (tap to equip as current)
  var owned = $("upgrade-owned");
  if (owned) {
    owned.innerHTML = "";
    var ids = Object.keys(run.powers).filter(function (id) { return run.powers[id] > 0; });
    if (!ids.length) { owned.textContent = "no powers yet — pick one!"; }
    ids.forEach(function (id) {
      var def = Logic.powerDef(id);
      var b = document.createElement("button");
      b.className = "owned-btn" + (run.current === id ? " cur" : "");
      b.innerHTML = "<span>" + def.icon + "</span><span>" + def.name + " Lv" + run.powers[id] + "</span>" +
                    (run.current === id ? "<span class='cur-tag'>ACTIVE</span>" : "");
      b.onclick = function () { run.current = id; Sound.click(); paintUpgrade(); };
      owned.appendChild(b);
    });
    var treats = document.createElement("div");
    treats.className = "coin-line";
    treats.textContent = "🐟 " + run.local + " treats   ·   ⭐ " + G.global + " stars";
    owned.appendChild(treats);
    var key = document.createElement("div");
    key.className = "peg-key";
    key.textContent = "🟢 green fires your equipped power · 🟣 purple = POUNCE ult";
    owned.appendChild(key);
  }

  // the single offer — THE CARD IS THE BUTTON: tap it to take
  var single = $("upgrade-single");
  if (single) {
    single.innerHTML = "";
    var card = document.createElement("button");
    card.className = "power-btn single";
    card.type = "button";
    if (!up.choice) {
      card.innerHTML = "<div class='pow-ic'>🐟</div>" +
        "<div class='pow-nm'>ALL POWERS MAXED</div>" +
        "<div class='pow-ds'>tap to take 50 🐟 treats instead!</div>";
    } else {
      var def2 = Logic.powerDef(up.choice.id);
      var cur = run.powers[up.choice.id] || 0;
      card.innerHTML = "<div class='pow-ic'>" + def2.icon + "</div>" +
        "<div class='pow-nm'>" + (up.choice.kind === "new" ? "NEW: " : "+1 ") + def2.name +
        (cur ? " <span class='lv'>Lv" + cur + "→" + Math.min(3, cur + 1) + "</span>" : "") + "</div>" +
        "<div class='pow-ds'>" + def2.desc + "</div>" +
        "<div class='pow-tap'>tap to take ✨</div>";
    }
    card.onclick = function () { takeUpgrade(); };
    single.appendChild(card);
  }
}

function takeUpgrade() {
  var run = G.run, up = G.upgrade;
  if (!run || !up) { endUpgrade(); return; }
  if (up.choice) {
    var res = Logic.applyUpgrade(run.powers, run.current, up.choice);
    run.powers = res.powers; run.current = res.current;
  } else {
    awardCoins(50);
  }
  Sound.green(); buzz(20);
  saveRun();
  endUpgrade();
}

function skipUpgrade() {
  endUpgrade();
}

function endUpgrade() {
  var run = G.run;
  if (!run) { showMenu(); return; }
  Sound.click();
  run.depth++;
  run.nodeType = "normal";
  run.consecCatches = 0;
  G.upgrade = null;
  saveRun();
  showMap();
}

/* ============================ shop ========================================
 * A saga-map node: spend treats, no fighting. Three items, then leave.
 * ========================================================================== */
function showShop() {
  var run = G.run;
  if (!run) { showMenu(); return; }
  G.screen = "shop";
  G.started = false;
  hideOverlays(); hideEl($("hud"));

  var rng = mulberry32(((run.seed ^ 0x51f7) + run.depth * 101) >>> 0);
  G.shop = { items: Logic.shopOffer(run.powers, rng) };
  if (typeof document === "undefined") return;
  paintShop();
  showEl($("shop"));
}

function shopItemView(it, run) {
  var view = { icon: "❓", name: "", desc: "", price: it.price, sold: !!it.sold,
               afford: run.local >= it.price };
  if (it.kind === "new" || it.kind === "up") {
    var def = Logic.powerDef(it.id);
    var cur = run.powers[it.id] || 0;
    view.icon = def.icon;
    view.name = (it.kind === "new" ? "NEW: " : "+1 ") + def.name +
                (cur ? " Lv" + cur + "→" + Math.min(3, cur + 1) : "");
    view.desc = def.desc;
  } else if (it.kind === "yarn") {
    view.icon = "🧶"; view.name = "Extra Yarn";
    view.desc = "+2 balls next level";
  } else if (it.kind === "stars") {
    view.icon = "⭐"; view.name = "Star Treat";
    view.desc = "trade " + TUNING.SHOP_STARS_PRICE + " 🐟 → " + TUNING.SHOP_STARS_GAIN + " ⭐";
  }
  return view;
}

function paintShop() {
  var run = G.run, sh = G.shop;
  if (!run || !sh || typeof document === "undefined") return;
  var tl = $("shop-treats");
  if (tl) tl.innerHTML = "🐟 <b>" + run.local + "</b> treats";
  var grid = $("shop-grid");
  if (grid) {
    grid.innerHTML = "";
    sh.items.forEach(function (it, i) {
      var v = shopItemView(it, run);
      var b = document.createElement("button");
      b.className = "shop-item" + (v.sold ? " sold" : "");
      b.disabled = v.sold || !v.afford;
      b.innerHTML = "<div class='pow-ic'>" + v.icon + "</div>" +
        "<div class='pow-nm'>" + v.name + "</div>" +
        "<div class='pow-ds'>" + v.desc + "</div>" +
        "<div class='shop-price'>" + (v.sold ? "SOLD ✓" : "🐟 " + v.price) + "</div>";
      b.onclick = function () { buyShop(i); };
      grid.appendChild(b);
    });
  }
}

function buyShop(i) {
  var run = G.run, sh = G.shop;
  if (!run || !sh || !sh.items[i] || sh.items[i].sold) return;
  var it = sh.items[i];
  if (run.local < it.price) { Sound.tick(); return; }
  run.local -= it.price;
  if (it.kind === "new" || it.kind === "up") {
    var res = Logic.applyUpgrade(run.powers, run.current, it);
    run.powers = res.powers; run.current = res.current;
    it.sold = true;
  } else if (it.kind === "yarn") {
    run.shopYarn = (run.shopYarn || 0) + 2;
    it.sold = true;
  } else if (it.kind === "stars") {
    addGlobal(TUNING.SHOP_STARS_GAIN);
    // the exchange never sells out — it's the treats sink
  }
  Sound.buy(); buzz(20);
  saveRun();
  paintShop();
}

function leaveShop() {
  var run = G.run;
  Sound.click();
  if (run) {
    if (!run.mapPath) run.mapPath = [];
    if (run.nodeId) run.mapPath.push(run.nodeId);
    run.depth++;
    run.nodeType = "normal";
    run.consecCatches = 0;
    saveRun();
  }
  G.shop = null;
  showMap();
}

/* ============================ physics ===================================== */
/* ============================ headless physics ==============================
 * physicsStep is the game's ball/peg collision core, factored pure: the live
 * game calls it with the real peg list plus sound/FX callbacks; the
 * difficulty scorer calls it headless with a spatial query and a silent
 * onHit. Same formulas, same bounces — so simulated difficulty reflects the
 * real game. ctx: {grav, ballR, right, onWall(b), onHit(b, peg),
 * query(x, y, rad) -> [pegs] (optional spatial index)}.
 * ========================================================================== */
function physicsStep(b, pegs, ctx, dt) {
  var steps = 3, sdt = dt / steps;
  var query = ctx.query || null;
  for (var s = 0; s < steps; s++) {
    b.vy += ctx.grav * sdt;
    b.x += b.vx * sdt; b.y += b.vy * sdt;
    if (b.x < ctx.ballR + 4) { b.x = ctx.ballR + 4; b.vx = Math.abs(b.vx) * 0.92; if (ctx.onWall) ctx.onWall(b); }
    if (b.x > ctx.right - ctx.ballR - 4) { b.x = ctx.right - ctx.ballR - 4; b.vx = -Math.abs(b.vx) * 0.92; if (ctx.onWall) ctx.onWall(b); }
    var cands = query ? query(b.x, b.y, b.r + PEG_R + 8) : pegs;
    for (var i = 0; i < cands.length; i++) {
      var p = cands[i];
      if (p.hit) continue;
      var rr = b.r + p.r;
      var dx = b.x - p.x, dy = b.y - p.y;
      if (dx * dx + dy * dy < rr * rr) {
        if (b.pierce > 0) { b.pierce--; ctx.onHit(b, p); continue; }
        var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var nx = dx / d, ny = dy / d;
        b.x = p.x + nx * rr; b.y = p.y + ny * rr;
        var dot = b.vx * nx + b.vy * ny;
        b.vx -= 1.82 * dot * nx; b.vy -= 1.82 * dot * ny;
        b.vx *= 0.985; b.vy *= 0.985;
        ctx.onHit(b, p);
      }
    }
  }
  b.t += dt;
}

function updateBall(b, dt) {
  physicsStep(b, G.pegs, {
    grav: GRAV, ballR: BALL_R, right: W,
    onWall: function () { b.wallBounced = true; Sound.bounce(); },
    onHit: function (ball, peg) { hitPeg(ball, peg); },
  }, dt);
  if (b.y > VH - 46 && b.vy > 0) {
    var bk = G.bucket;
    if (Math.abs(b.x - bk.x) < bk.w / 2) { b.dead = true; b.caught = true; onCatch(b); }
    else if (b.y > VH - 8) { b.dead = true; onLost(b); }
  } else if (b.y > VH + 40) { b.dead = true; onLost(b); }
}

function onCatch(b) {
  G.balls++;
  Sound.bucket();
  burst(b.x, VH - 50, "#ffd166", 10, 180);
  floatText(b.x, VH - 90, "+1 🧶", "#e8930c", 20);
  var run = G.run;
  if (run) {
    run.consecCatches++;
    run.stats.catches++;
    if (run.consecCatches === 3) showFeat("madskillz", "MAD SKILLZ", "3 catches in a row 🪣");
  }
  updateHUD();
}

function onLost(b) {
  var run = G.run;
  if (b.pegsHit === 0) {
    // zero-hit pity refund — odds tilt toward the player when balls run low
    if (Math.random() < Logic.pityChance(G.balls)) {
      G.balls++;
      floatText(clamp(b.x, 60, W - 60), VH - 70, "pity! +1 🧶", "#4dffa6", 18);
      Sound.tick();
    }
  }
  if (b.pegsHit >= 5) showFeat("lucky", "LUCKY BOUNCE", b.pegsHit + " pegs, one ball 🍀");
  if (run) run.consecCatches = 0;
  updateHUD();
}

function checkDepletion() {
  if (!G.started || G.screen !== "play") return;
  if (G.pendingWin || G.failDelay > 0) return;
  if (G.ballsInPlay.length > 0 || G.balls > 0) return;
  // the fail screen gets its own drama beat first
  G.failDelay = TUNING.FAIL_BEAT;
  floatText(BOARD_CX, 330, "SO CLOSE!", "#d63a5c", 46);
  addShake(8);
  Sound.lose();
}

/* ============================ main update ================================= */
function update(rdt) {
  rdt = Math.min(rdt, 0.05);
  G.t += rdt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - rdt * 26);
  if (G.hintTimer > 0) { G.hintTimer -= rdt; if (G.hintTimer <= 0) hideEl($("hint")); }
  if (G.powerFlash > 0) G.powerFlash -= rdt * 2;
  if (G.powerBannerT > 0) G.powerBannerT -= rdt;
  if (G.swipeT > 0) { G.swipeT += rdt; if (G.swipeT > 0.5) G.swipeT = 0; }

  for (var i = G.particles.length - 1; i >= 0; i--) {
    var pt = G.particles[i]; pt.t += rdt;
    if (pt.t >= pt.life) G.particles.splice(i, 1);
    else if (!pt.ring) { pt.x += pt.vx * rdt; pt.y += pt.vy * rdt; pt.vy += 500 * rdt; }
  }
  for (var k = G.texts.length - 1; k >= 0; k--) {
    var tx = G.texts[k]; tx.t += rdt; tx.y += tx.vy * rdt;
    if (tx.t >= tx.life) G.texts.splice(k, 1);
  }
  for (var q = 0; q < G.pegs.length; q++) {
    var pg = G.pegs[q];
    if (pg.anim > 0) pg.anim = Math.max(0, pg.anim - rdt * 3);
    if (pg.lit > 0) pg.lit -= rdt * 2;
  }
  if (G.enemy) {
    if (G.enemy.wob > 0) G.enemy.wob -= rdt * 2.4;
    if (G.enemy.flash > 0) G.enemy.flash -= rdt * 2;
  }
  if (G.screen === "play") {
    var bk = G.bucket;
    bk.x += bk.vx * rdt;
    if (bk.x < 50) { bk.x = 50; bk.vx = Math.abs(bk.vx); }
    if (bk.x > W - 50) { bk.x = W - 50; bk.vx = -Math.abs(bk.vx); }
  }
  if (G.screen !== "play") return;

  // fail drama beat: "SO CLOSE!" hangs in the air, then the fail screen
  if (G.failDelay > 0) {
    G.failDelay -= rdt;
    if (G.failDelay <= 0) { G.failDelay = 0; showFail(); }
    return;
  }

  // LAST-BALL CINEMA: armed at launch of the final reserve ball, engages
  // once it tastes its first peg (or 1s in), then runs at 0.15x with a
  // smooth zoom tracking the ball until the shot resolves. Mandatory and
  // unskippable — hold-to-speed can never cancel it.
  var ballDt = rdt;
  if (G.slowmo === 1) {
    G.slowmoT += rdt;
    var tasted = false;
    for (var tb = 0; tb < G.ballsInPlay.length; tb++)
      if (G.ballsInPlay[tb].pegsHit > 0) { tasted = true; break; }
    if (G.ballsInPlay.length === 0) {
      G.slowmo = 0; // the shot fizzled with zero pegs — no cinema
    } else if (tasted || G.slowmoT >= TUNING.SLOWMO_ENGAGE_DELAY) {
      G.slowmo = 2; // engage the cinema
      Sound.slowmo();
      addShake(4);
    }
  }
  if (G.slowmo === 2) {
    ballDt = rdt * TUNING.SLOWMO_SCALE;
    var pb = G.ballsInPlay[0];
    if (pb) { G.slowmoFX = pb.x; G.slowmoFY = pb.y; }
    G.slowmoZoom = Math.min(TUNING.SLOWMO_ZOOM, G.slowmoZoom + rdt * 1.1);
  } else if (G.winCineT > 0 && G.ballsInPlay.length > 0) {
    // WIN CINEMATIC: zoom toward the winning hit with a slow-mo beat while
    // the shot drains. Unskippable; hold-to-speed can never cancel it.
    G.winCineT -= rdt;
    ballDt = rdt * TUNING.WIN_CINE_SCALE;
    G.slowmoFX = G.winCineX; G.slowmoFY = G.winCineY;
    G.slowmoZoom = Math.min(TUNING.WIN_CINE_ZOOM, G.slowmoZoom + rdt * 2.0);
  } else {
    G.slowmoZoom = Math.max(1, G.slowmoZoom - rdt * 2.2);
    if (G.ultBeat > 0) {
      // POUNCE beat: a brief slow-mo right at the ult trigger
      G.ultBeat -= rdt;
      ballDt = rdt * TUNING.ULT_BEAT_SCALE;
    } else if (G.slowmo === 0 && G.holding && G.ballsInPlay.length > 0) {
      ballDt = rdt * TUNING.HOLD_SPEED; // hold = 2.5x flight (never during cinema)
    }
  }

  for (var b = G.ballsInPlay.length - 1; b >= 0; b--) {
    var ball = G.ballsInPlay[b];
    updateBall(ball, ballDt);
    if (ball.dead) G.ballsInPlay.splice(b, 1);
  }

  // the cinema ends when the last shot's balls resolve
  if (G.slowmo === 2 && G.ballsInPlay.length === 0) G.slowmo = 0;
  // wins resolve when the shot's balls drain — dramatically after the
  // cinema, snappy otherwise
  if (G.pendingWin && G.slowmo === 0 && G.ballsInPlay.length === 0) {
    G.pendingWin = false;
    Sound.win(); Music.onWin(); buzz(40);
    finishWin(); return;
  }

  // telegraphed boss attack resolves when the shot's balls drain
  var e = G.enemy;
  if (e && e.telegraph && G.ballsInPlay.length === 0 && !G.pendingWin) {
    e.telegraph = false; showTell("");
    doBossAttack();
  }

  checkDepletion();
}

/* ============================ aiming ======================================
 * Pure physics: a short direction guide, no peg magnetism, no snap.
 * ========================================================================== */
function setAim(dx, dy) {
  var len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  if (dy > -0.12) { G.aim = null; return; } // upward shots only
  G.aim = { dx: dx, dy: dy };
}

/* ============================ UI screens ================================== */
function showMenu() {
  G.screen = "menu"; G.started = false;
  hideOverlays(); hideEl($("hud"));
  Music.stop();
  var c = $("btn-continue");
  if (c) c.style.display = loadRun() ? "" : "none";
  setText($("menu-global"), G.global > 0 ? "⭐ " + G.global + " stars" : "");
  showEl($("menu"));
}

function newRun() {
  Sound.init(); Sound.click();
  var seed = (Math.random() * 1e9) | 0;
  G.run = freshRun(seed);
  G.global = getGlobal();
  G.run.nodeType = "breather";
  G.run.nodeId = G.run.map.rows[0][0].id; // depth-1 breather node
  saveRun();
  startBattle(); // depth 1, straight in — first shot within seconds
}

function continueRun() {
  var run = loadRun();
  if (!run) return;
  Sound.init(); Sound.click();
  if (!run.path) run.path = []; // migrate pre-v1.2 saves
  if (!run.map) migrateRunToMap(run); // migrate pre-DAG saves
  G.run = run;
  G.global = getGlobal();
  showMap();
}

function showMap() {
  var run = G.run;
  if (!run) { showMenu(); return; }
  if (!run.map) run.map = genMap((run.seed ^ 0x5f3d) >>> 0); // safety net
  if (!run.mapPath) run.mapPath = [];
  G.screen = "map";
  G.started = false;
  hideOverlays(); hideEl($("hud"));
  setText($("map-title"), "CHOOSE YOUR PATH");
  if (typeof document === "undefined") return;
  var stats = $("map-stats");
  if (stats) {
    var pow = Object.keys(run.powers).filter(function (id) { return run.powers[id] > 0; })
      .map(function (id) { return Logic.powerDef(id).icon + " Lv" + run.powers[id]; }).join("  ");
    stats.innerHTML = "depth <b>" + run.depth + " / " + TUNING.FINAL_DEPTH + "</b> &nbsp;·&nbsp; 🐟 " + run.local +
      " &nbsp;·&nbsp; ⭐ " + G.global + (pow ? "<br>" + pow : "");
  }
  var track = $("map-track");
  var wrap = $("map-track-wrap");
  showEl($("map")); // show first so the track area can be measured
  if (track && wrap) {
    track.innerHTML = paintMapTrack(run);
    var svg = track.firstChild;
    if (svg) svg.addEventListener("click", function (ev) {
      var t = ev.target;
      var g = t && t.closest ? t.closest(".mt-node.choice") : null;
      if (g && g.getAttribute("data-id")) enterNode(g.getAttribute("data-id"));
    });
    // auto-scroll: the kitten sits ~60% down the viewport, choices visible above
    var m = mapNodes(run), cur = null;
    m.nodes.forEach(function (nd) { if (nd.state === "cur") cur = nd; });
    if (cur && svg) {
      var scale = (svg.clientWidth || m.w) / m.w;
      wrap.scrollTop = Math.max(0, cur.y * scale - wrap.clientHeight * 0.6);
    }
  }
  if (run.depth === 2) showHint("map", "choose your path — 💀 elite is risk + reward");
  saveRun();
}

var NODE_ICONS = { breather: "🌙", normal: "🐾", elite: "💀", shop: "🏪", treasure: "🎁", boss: "👹" };
var NODE_NAMES = { breather: "FIRST STEPS", normal: "BATTLE", elite: "ELITE", shop: "SHOP", treasure: "TREASURE", boss: "BOSS" };

// ---- DAG run map (Candy-Crush style: bottom-up, FTL branching) ----------------
// One row per depth (rows[0] = depth-1 breather … rows[19] = depth-20 boss).
// Each node links to 1-2 nodes in the row above; every node gets >= 1 incoming
// edge so nothing is ever orphaned or unreachable. Node types are rolled per
// node — shops are a sometimes-treat (capped per map), never a standing offer.
function genMap(seed) {
  var rng = mulberry32((seed || 1) >>> 0);
  var rows = [], idc = 0;
  function nid() { return "n" + (idc++); }
  function rollType() {
    var r = rng();
    if (r < 0.57) return "normal";
    if (r < 0.79) return "elite";
    if (r < 0.94) return "treasure";
    return "shop";
  }
  for (var d = 1; d <= TUNING.FINAL_DEPTH; d++) {
    var row = [];
    if (d === 1) row.push({ id: nid(), type: "breather" });
    else if (TUNING.BOSS_DEPTHS.indexOf(d) >= 0) row.push({ id: nid(), type: "boss" });
    else {
      var n = rng() < 0.5 ? 2 : 3;
      for (var i = 0; i < n; i++) row.push({ id: nid(), type: rollType() });
      // never an all-elite row — a fair fight is always on the board
      if (row.every(function (nd) { return nd.type === "elite"; }))
        row[(rng() * n) | 0].type = "normal";
    }
    rows.push(row);
  }
  // shops are a sometimes-treat: at most 2 per map
  var shops = [];
  rows.forEach(function (row) { row.forEach(function (nd) { if (nd.type === "shop") shops.push(nd); }); });
  shuffle(shops, rng);
  while (shops.length > 2) shops.pop().type = "normal";

  var edges = [];
  function link(a, b) { edges.push([a, b]); }
  for (var d2 = 2; d2 <= TUNING.FINAL_DEPTH; d2++) {
    var prev = rows[d2 - 2], cur = rows[d2 - 1];
    if (cur.length === 1) { prev.forEach(function (pp) { link(pp.id, cur[0].id); }); continue; }
    if (prev.length === 1) { cur.forEach(function (cc) { link(prev[0].id, cc.id); }); continue; }
    prev.forEach(function (pp) {
      var k = rng() < 0.55 ? 2 : 1;
      var ts = shuffle(cur.slice(), rng).slice(0, Math.min(k, cur.length));
      ts.forEach(function (tt) { link(pp.id, tt.id); });
    });
    cur.forEach(function (cc) {
      var hasIn = edges.some(function (e) { return e[1] === cc.id; });
      if (!hasIn) link(prev[(rng() * prev.length) | 0].id, cc.id);
    });
  }
  return { rows: rows, edges: edges };
}

function mapNodeById(map, id) {
  for (var r = 0; r < map.rows.length; r++)
    for (var i = 0; i < map.rows[r].length; i++)
      if (map.rows[r][i].id === id) return map.rows[r][i];
  return null;
}

// the node the kitten is standing on: last completed, else the breather
function mapCurrentId(run) {
  if (run.mapPath && run.mapPath.length) return run.mapPath[run.mapPath.length - 1];
  return run.map.rows[0][0].id;
}

// nodes the player may enter next: reachable nodes in the upcoming depth's row
function mapChoices(run) {
  var cur = mapCurrentId(run);
  var rowIdx = run.depth - 1; // upcoming depth -> 0-indexed row
  if (rowIdx < 0 || rowIdx >= run.map.rows.length) return [];
  var outs = {};
  run.map.edges.forEach(function (e) { if (e[0] === cur) outs[e[1]] = true; });
  return run.map.rows[rowIdx].filter(function (nd) { return outs[nd.id]; });
}

function isMapChoice(run, id) {
  return mapChoices(run).some(function (nd) { return nd.id === id; });
}

// pre-DAG saves: rebuild a map and re-fit the old {depth,type} path log onto it
function migrateRunToMap(run) {
  run.map = genMap((run.seed ^ 0x5f3d) >>> 0);
  run.mapPath = [];
  var kids = {}; // parent id -> {childId: true}, for a genuinely walkable trail
  run.map.edges.forEach(function (e) { (kids[e[0]] = kids[e[0]] || {})[e[1]] = true; });
  var used = {}, prev = null;
  (run.path || []).forEach(function (pe) {
    var row = run.map.rows[(pe.depth || 1) - 1];
    if (!row) return;
    function ok(nd) { return !used[nd.id] && (!prev || (kids[prev] && kids[prev][nd.id])); }
    var pick = null, i;
    for (i = 0; i < row.length; i++) if (row[i].type === pe.type && ok(row[i])) { pick = row[i]; break; }
    if (!pick) for (i = 0; i < row.length; i++) if (ok(row[i])) { pick = row[i]; break; }
    if (!pick) for (i = 0; i < row.length; i++) if (!used[row[i].id] && row[i].type === pe.type) { pick = row[i]; break; }
    if (!pick) for (i = 0; i < row.length; i++) if (!used[row[i].id]) { pick = row[i]; break; }
    if (!pick) return;
    used[pick.id] = true; prev = pick.id; run.mapPath.push(pick.id);
  });
  if (!run.nodeId && run.mapPath.length) run.nodeId = run.mapPath[run.mapPath.length - 1];
}

// ---- map track layout ------------------------------------------------
// Vertical DAG: depth 1 at the BOTTOM, the final boss at the TOP. You are the
// 🐱; completed nodes get ✓; reachable next-row nodes glow; unreachable
// next-row nodes and everything above stay dimmed.
var MAP_NODE_R = 26;      // 52px tap target, >= 44px iOS minimum
var MAP_ROW_PITCH = 98;   // vertical spacing between rows
var MAP_W = 480;

function mapNodeHash(id) {
  var h = 0;
  for (var i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 100) / 100;
}

function mapLayout(run) {
  var nRows = run.map.rows.length;
  var padT = 84, padB = 96, pos = {};
  run.map.rows.forEach(function (row, ri) {
    var y = padT + (nRows - 1 - ri) * MAP_ROW_PITCH; // row 0 sits at the bottom
    var n = row.length;
    row.forEach(function (nd, i) {
      var x = MAP_W * (i + 1) / (n + 1) + (mapNodeHash(nd.id) - 0.5) * 34;
      pos[nd.id] = { x: Math.round(x), y: y };
    });
  });
  return { pos: pos, w: MAP_W, h: padT + (nRows - 1) * MAP_ROW_PITCH + padB };
}

// Node geometry for the current run map. H is accepted for backwards
// compatibility and ignored — the DAG sizes itself from its row count.
function mapNodes(run, H) {
  var lay = mapLayout(run);
  var curId = mapCurrentId(run);
  var doneSet = {};
  (run.mapPath || []).forEach(function (id) { doneSet[id] = true; });
  var choiceSet = {};
  mapChoices(run).forEach(function (nd) { choiceSet[nd.id] = true; });
  var nextRow = run.depth - 1;
  var nodes = [], edges = [];
  run.map.rows.forEach(function (row, ri) {
    row.forEach(function (nd) {
      var p = lay.pos[nd.id];
      var state;
      if (nd.id === curId) state = "cur";
      else if (doneSet[nd.id]) state = "done";
      else if (choiceSet[nd.id]) state = "choice";
      else if (ri === nextRow) state = "locked";
      else if (ri < nextRow) state = "missed";
      else state = "future";
      nodes.push({ id: nd.id, x: p.x, y: p.y,
        icon: nd.id === curId ? "🐱" : (NODE_ICONS[nd.type] || "🐾"),
        name: nd.id === curId ? "YOU" : (NODE_NAMES[nd.type] || "BATTLE"),
        state: state, type: nd.type, depth: ri + 1 });
    });
  });
  var idToIdx = {};
  nodes.forEach(function (nd, i) { idToIdx[nd.id] = i; });
  run.map.edges.forEach(function (e) {
    var a = idToIdx[e[0]], b = idToIdx[e[1]];
    if (a == null || b == null) return;
    var cls = "mt-edge", bNode = nodes[b];
    if (bNode.state === "choice") cls += " to-choice";
    else if (bNode.state === "future" || bNode.state === "missed" || bNode.state === "locked") cls += " to-future";
    if (doneSet[e[0]] && doneSet[e[1]]) cls += " taken";
    edges.push({ a: a, b: b, cls: cls });
  });
  return { nodes: nodes, edges: edges, curId: curId, w: lay.w, h: lay.h };
}

function paintMapTrack(run, H) {
  var m = mapNodes(run, H), s = "";
  m.edges.forEach(function (e) {
    var a = m.nodes[e.a], b = m.nodes[e.b];
    var my = Math.round((a.y + b.y) / 2);
    s += "<path class='" + e.cls + "' d='M" + a.x + "," + a.y +
      " C" + a.x + "," + my + " " + b.x + "," + my + " " + b.x + "," + b.y + "'/>";
  });
  m.nodes.forEach(function (nd) {
    if (nd.state === "future" || nd.state === "missed") {
      s += "<g class='mt-node future'>";
      s += "<circle class='mt-ghost' cx='" + nd.x + "' cy='" + nd.y + "' r='22'/>";
      s += "<text class='mt-ic' x='" + nd.x + "' y='" + (nd.y + 8) + "'>" + nd.icon + "</text>";
      s += "<text class='mt-lb' x='" + nd.x + "' y='" + (nd.y + 44) + "'>" + nd.name + "</text>";
      s += "</g>";
      return;
    }
    s += "<g class='mt-node " + nd.state + "'" + (nd.state === "choice" ? " data-id='" + nd.id + "'" : "") + ">";
    if (nd.state === "choice")
      s += "<circle class='mt-hit' cx='" + nd.x + "' cy='" + nd.y + "' r='34'/>";
    s += "<circle class='mt-ring' cx='" + nd.x + "' cy='" + nd.y + "' r='" + MAP_NODE_R + "'/>";
    s += "<text class='mt-ic' x='" + nd.x + "' y='" + (nd.y + 9) + "'>" + nd.icon + "</text>";
    if (nd.state === "done")
      s += "<circle class='mt-check' cx='" + (nd.x + 19) + "' cy='" + (nd.y - 19) + "' r='10'/>" +
           "<text class='mt-check-t' x='" + (nd.x + 19) + "' y='" + (nd.y - 15) + "'>✓</text>";
    s += "<text class='mt-lb' x='" + nd.x + "' y='" + (nd.y + 46) + "'>" + nd.name + "</text>";
    s += "</g>";
  });
  return "<svg class='mt-svg' viewBox='0 0 " + m.w + " " + m.h +
    "' style='width:100%;height:auto;max-width:" + m.w + "px' role='group' aria-label='run map'>" + s + "</svg>";
}


function popEl(el) {
  if (!el || typeof document === "undefined") return;
  el.classList.remove("pop");
  void el.offsetWidth; // restart the animation
  el.classList.add("pop");
}

// enemy HP plate: bar width + a numeric readout, so "1 HP left" is never
// ambiguous from a hairline sliver of bar
function updateEnemyHP() {
  var e = G.enemy; if (!e) return;
  var fill = $("enemy-hp-fill");
  if (fill) fill.style.width = (100 * e.hp / e.maxhp) + "%";
  setText($("enemy-name"), e.icon + " " + e.name + " · " + e.hp + " HP");
}

function updateHUD() {
  if (!$("hud")) return;  setText($("hud-level"), "DEPTH " + G.depth);
  var bb = $("hud-balls");
  if (bb) bb.textContent = "🧶×" + G.balls;
  var ht = $("hud-treats");
  if (ht && G.run) ht.textContent = "🐟 " + G.run.local;
  var ep = $("enemy");
  if (G.enemy) {
    showEl(ep);
    updateEnemyHP();
    hideEl($("hud-orange"));
  } else {
    hideEl(ep);
    var ho = $("hud-orange");
    if (ho) { showEl(ho); ho.textContent = "🍊 " + orangeCount() + " left"; }
  }
}

function showChapter(n, title) {
  var b = $("boss-banner");
  if (!b) return;
  setText($("boss-banner-icon"), "🌙");
  setText($("boss-banner-name"), "CHAPTER " + n);
  setText($("boss-banner-sub"), title);
  showEl(b);
  setTimeout(function () { hideEl(b); }, 2600);
}

function showBossBanner(e) {
  var b = $("boss-banner");
  if (!b) return;
  setText($("boss-banner-icon"), e.icon);
  setText($("boss-banner-name"), e.name);
  setText($("boss-banner-sub"), e.sub);
  showEl(b);
  setTimeout(function () { hideEl(b); }, 2600);
}

function toggleSound() {
  Sound.init();
  Sound.setEnabled(!Sound.enabled);
  store.set("peggie_sound", Sound.enabled ? "on" : "off");
  updateSoundBtn();
  Sound.click();
}

function updateSoundBtn() {
  var t = Sound.enabled ? "🔊" : "🔇";
  var h = $("hud-sound"); if (h) h.textContent = t;
  var m = $("btn-menu-sound"); if (m) m.textContent = Sound.enabled ? "🔊 sound on" : "🔇 sound off";
}

function bindUI() {
  if (typeof document === "undefined") return;
  var on = function (id, fn) { var el = $(id); if (el) el.onclick = fn; };
  on("btn-newrun", newRun);
  on("btn-continue", continueRun);
  on("btn-menu-sound", toggleSound);
  on("hud-sound", toggleSound);
  on("btn-retry", retryLevel);
  on("btn-giveup", giveUp);
  on("btn-menu", showMenu);
  on("btn-skip", skipUpgrade);
  on("btn-leave", leaveShop);
  on("btn-again", newRun);
  on("btn-vmenu", showMenu);
}

/* ============================ input ======================================= */
var aiming = false, aimId = null;

function canvasPos(ev) {
  var r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) / r.width * W,
    y: (ev.clientY - r.top) / r.height * VH,
  };
}

function bindInput() {
  if (!canvas || typeof document === "undefined") return;
  canvas.addEventListener("pointerdown", function (ev) {
    Sound.init();
    if (G.screen !== "play" || !G.started) return;
    ev.preventDefault();
    if (G.ballsInPlay.length > 0) { G.holding = true; return; } // hold = 2.5x flight
    if (G.balls <= 0) return;
    aiming = true; aimId = ev.pointerId;
    var p = canvasPos(ev);
    setAim(p.x - LAUNCH_X, p.y - BALL_START_Y);
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  canvas.addEventListener("pointermove", function (ev) {
    if (!aiming || ev.pointerId !== aimId) return;
    var p = canvasPos(ev);
    setAim(p.x - LAUNCH_X, p.y - BALL_START_Y);
  });
  function endPointer(ev) {
    if (G.holding && (ev.pointerId !== aimId)) { G.holding = false; }
    if (aiming && ev.pointerId === aimId) {
      aiming = false; aimId = null;
      if (G.aim) { fire(); G.aim = null; }
    }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
}

/* ============================ render ====================================== */
/* (drawBackground retired in v1.2 — paintSky fills the whole canvas in
 * device space so the dream-sky is seamless on every screen.) */

function drawPegs() {
  for (var i = 0; i < G.pegs.length; i++) {
    var p = G.pegs[i];
    if (p.hit && p.anim <= 0) continue;
    // every peg is the same size at rest: hit pegs shrink as they fade out,
    // refreshed pegs grow in from half size. The purple peg is distinguished
    // by color + sparkle, never by size.
    var r = p.r * (p.hit ? (0.5 + 0.5 * p.anim) : (1 - 0.5 * p.anim));
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.hit) ctx.globalAlpha = 0.35;
    var cols = p.type === "orange" ? ["#ffc37e", "#f07f2e"]
             : p.type === "green"  ? ["#7dffb0", "#1d9e5e"]
             : p.type === "purple" ? ["#e3b0ff", "#8a3fd1"]
             : p.type === "junk"   ? ["#c9cfdd", "#878da1"]
             : ["#aee3ff", "#5aa2ff"];
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, Math.PI * 2); ctx.stroke();
    if (p.type === "purple") {
      // prominent twinkling sparkle — the power peg is unmissable
      var tw = 0.5 + 0.5 * Math.sin(G.t * 6 + p.x * 0.1);
      ctx.strokeStyle = "rgba(255,255,255," + (0.4 + tw * 0.6).toFixed(2) + ")";
      ctx.lineWidth = 1.8;
      var sr = r * (0.5 + tw * 0.4);
      ctx.beginPath();
      ctx.moveTo(-sr, 0); ctx.lineTo(sr, 0);
      ctx.moveTo(0, -sr); ctx.lineTo(0, sr);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    if (p.type === "green") {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    if (p.type === "junk") {
      ctx.strokeStyle = "rgba(60,60,80,.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, 4); ctx.moveTo(4, -4); ctx.lineTo(-4, 4); ctx.stroke();
    }
    if (p.lit > 0) {
      ctx.globalAlpha = p.lit * 0.7;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawYarnBall(x, y, r, heavy, pierce) {
  ctx.save();
  ctx.translate(x, y);
  var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  g.addColorStop(0, "#ffb37e"); g.addColorStop(1, "#ef7f4e");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(178,84,38,.6)"; ctx.lineWidth = 1.6;
  for (var i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * r * 0.36, r * 0.92, r * 0.3, 0.3 * i, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(178,84,38,.85)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r * 0.7, r * 0.5);
  ctx.quadraticCurveTo(r * 1.7, r * 1.1 + Math.sin(G.t * 6) * 2, r * 2.2, r * 1.8);
  ctx.stroke();
  if (heavy) {
    ctx.strokeStyle = "#e07f2e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, Math.PI * 2); ctx.stroke();
  }
  if (pierce > 0) {
    ctx.strokeStyle = "#7cc7ee"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawBalls() {
  for (var i = 0; i < G.ballsInPlay.length; i++) {
    var b = G.ballsInPlay[i];
    drawYarnBall(b.x, b.y, b.r, b.heavy, b.pierce);
  }
}

function drawAim() {
  if (!G.aim) return;
  ctx.save();
  ctx.strokeStyle = "rgba(232,147,12,.75)"; ctx.lineWidth = 3;
  ctx.setLineDash([2, 9]); ctx.lineCap = "round";
  // short direction guide only — no peg targeting, no snap
  var len = 150;
  ctx.beginPath();
  ctx.moveTo(LAUNCH_X, BALL_START_Y);
  ctx.lineTo(LAUNCH_X + G.aim.dx * len, BALL_START_Y + G.aim.dy * len);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawBucket() {
  var bk = G.bucket, y = VH - 46;
  ctx.save();
  // breathing catch-zone glow so the moving bucket reads at a glance
  ctx.globalAlpha = 0.20 + 0.08 * Math.sin(G.t * 4);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath(); ctx.ellipse(bk.x, y + 6, bk.w * 0.62, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(232,147,12,.25)";
  ctx.beginPath(); ctx.ellipse(bk.x, y + 16, bk.w * 0.75, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e8930c";
  ctx.strokeStyle = "#b96a0a"; ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bk.x - bk.w / 2, y, bk.w, bk.h, 6); else ctx.rect(bk.x - bk.w / 2, y, bk.w, bk.h);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fillRect(bk.x - bk.w / 2 + 4, y + 2, bk.w - 8, 3);
  ctx.restore();
}

function drawLauncher() {
  // clean yarn-ball launcher: soft cream ring, the kitten's toy seated in it,
  // subtle cat ears on the yarn so it reads as hers. No clutter near the bucket.
  ctx.save();
  ctx.translate(LAUNCH_X, LAUNCH_Y);
  ctx.fillStyle = "#fff7ee";
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#e8b04b"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.stroke();
  // breathing outer glow so the launcher reads as the "ready" spot
  ctx.save();
  ctx.globalAlpha = 0.22 + 0.08 * Math.sin(G.t * 3);
  ctx.strokeStyle = "#e8b04b"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  if (G.balls > 0 && G.ballsInPlay.length === 0) {
    drawYarnBall(0, 1, 10, false, 0);
    // subtle cat ears on the yarn ball
    ctx.fillStyle = "#f5b8c9";
    ctx.beginPath();
    ctx.moveTo(-8, -6); ctx.lineTo(-11, -14); ctx.lineTo(-3, -9); ctx.closePath();
    ctx.moveTo(8, -6); ctx.lineTo(11, -14); ctx.lineTo(3, -9); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f8d3de";
    ctx.beginPath();
    ctx.moveTo(-8, -8); ctx.lineTo(-9.5, -12); ctx.lineTo(-5.5, -9); ctx.closePath();
    ctx.moveTo(8, -8); ctx.lineTo(9.5, -12); ctx.lineTo(5.5, -9); ctx.closePath();
    ctx.fill();
  }
  if (G.aim) {
    var a = Math.atan2(G.aim.dy, G.aim.dx);
    ctx.rotate(a);
    ctx.fillStyle = "#e8930c";
    ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(31, -7); ctx.lineTo(31, 7); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawParticles() {
  for (var i = 0; i < G.particles.length; i++) {
    var p = G.particles[i], k = 1 - p.t / p.life;
    ctx.save();
    ctx.globalAlpha = clamp(k, 0, 1);
    if (p.ring) {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, (1 - k) * 46 + 8, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k + 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawTexts() {
  ctx.save();
  ctx.textAlign = "center";
  for (var i = 0; i < G.texts.length; i++) {
    var t = G.texts[i], k = 1 - t.t / t.life;
    ctx.globalAlpha = clamp(k * 1.4, 0, 1);
    ctx.font = "800 " + t.size + "px -apple-system, system-ui, sans-serif";
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.strokeText(t.txt, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.restore();
}

function render() {
  if (!ctx) return;
  paintSky(); // the whole canvas first — one continuous dream-sky
  ctx.setTransform(DPR * VSCALE, 0, 0, DPR * VSCALE, VOX * DPR, 0);
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  // cinematic zoom: eases toward the last ball during slow-mo
  if (G.slowmoZoom > 1.001) {
    ctx.translate(W / 2, VH / 2);
    ctx.scale(G.slowmoZoom, G.slowmoZoom);
    ctx.translate(-G.slowmoFX, -G.slowmoFY);
  }
  if (G.screen === "play" || G.screen === "fail") {
    if (G.enemy) drawEnemy(G.enemy, ENEMY_X, 132, G.enemy.boss ? 1.15 : 0.85, G.t);
    // the kitten perches at top-left, facing the enemy, always ready to swipe
    drawCat(CAT_X, CAT_Y, 0.85, G.t);
    drawPegs();
    drawBucket();
    drawBalls();
    if (G.aim && G.ballsInPlay.length === 0 && G.balls > 0 && G.slowmo !== 2) drawAim();
    drawLauncher();
    drawSwipe(); // paw arc + slash streaks + impact star over the enemy
  }
  drawParticles();
  drawTexts();
  ctx.restore();

  // cinematic letterbox + vignette, painted in device space over everything
  if (G.slowmoZoom > 1.01) {
    var k = clamp((G.slowmoZoom - 1) / (TUNING.SLOWMO_ZOOM - 1), 0, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var barH = Math.round(canvas.height * 0.085 * k);
    ctx.fillStyle = "rgba(24,10,26,.88)";
    ctx.fillRect(0, 0, canvas.width, barH);
    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
    var vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.22,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.72);
    vg.addColorStop(0, "rgba(20,10,40,0)");
    vg.addColorStop(1, "rgba(20,10,40," + (0.5 * k).toFixed(2) + ")");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (G.powerFlash > 0) {
    ctx.setTransform(DPR * VSCALE, 0, 0, DPR * VSCALE, VOX * DPR, 0);
    ctx.fillStyle = "rgba(77,255,166," + (G.powerFlash * 0.16).toFixed(3) + ")";
    ctx.fillRect(0, 0, W, VH);
  }
  if (G.powerBannerT > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(G.powerBannerT, 0, 1);
    ctx.textAlign = "center";
    var ultBanner = G.powerBannerUlt;
    ctx.font = "900 " + (ultBanner ? 46 : 30) + "px -apple-system, system-ui, sans-serif";
    ctx.lineWidth = ultBanner ? 8 : 6; ctx.strokeStyle = "rgba(255,255,255,.95)";
    if (ultBanner) { ctx.shadowColor = "#ffd166"; ctx.shadowBlur = 26; }
    ctx.strokeText(G.powerBannerTxt, BOARD_CX, BANNER_Y);
    ctx.fillStyle = ultBanner ? "#e8930c" : "#1d9e5e";
    ctx.fillText(G.powerBannerTxt, BOARD_CX, BANNER_Y);
    ctx.restore();
  }
}

/* ============================ main loop / boot ============================ */
var lastT = 0;
function frame(ts) {
  if (!lastT) lastT = ts;
  var dt = Math.min(0.05, (ts - lastT) / 1000);
  lastT = ts;
  try { update(dt); } catch (err) { if (global.console) console.error(err); }
  try { render(); } catch (err) { if (global.console) console.error(err); }
  if (global.requestAnimationFrame) global.requestAnimationFrame(frame);
}

function boot() {
  loadSeen();
  G.global = getGlobal();
  Sound.enabled = store.get("peggie_sound") !== "off";
  Sound.setEnabled(Sound.enabled);
  setupCanvas();
  bindInput();
  bindUI();
  updateSoundBtn();
  showMenu();
  if (global.requestAnimationFrame) global.requestAnimationFrame(frame);
}

/* The game boots only on pages that actually host it (index.html). Tooling
 * pages like levels.html load game.js for its generator/scorer without
 * booting the canvas game. */
if (typeof document !== "undefined" && document.getElementById("game")) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}

/* ============================ exports ===================================== */
var Peggie = {
  newRun: newRun,
  continueRun: continueRun,
  showMenu: showMenu,
  logic: Logic,
  tuning: TUNING,
  shapes: SHAPE_RECIPES,
  sim: {
    recipes: SHAPE_RECIPES,
    recipeByName: recipeByName,
    varyRecipe: varyRecipe,
    compileMask: compileMask,
    shapeBoard: shapeBoard,
    physicsStep: physicsStep,
    scoreBoard: scoreBoard,
    validateBoard: validateBoard,
    generateBoard: generateBoard,
    bandOf: bandOf,
    DIFF_BANDS: DIFF_BANDS,
    mulberry32: mulberry32,
    ballisticAngle: simBallisticAngle,
  },
  debug: {
    state: function () { return G; },
    freshRun: freshRun,
    startBattle: startBattle,
    enterNode: enterNode,
    fire: fire,
    update: update,
    setAim: setAim,
    hitPeg: hitPeg,
    firePower: firePower,
    awardCoins: awardCoins,
    showUpgrade: showUpgrade,
    takeUpgrade: takeUpgrade,
    skipUpgrade: skipUpgrade,
    showShop: showShop,
    buyShop: buyShop,
    leaveShop: leaveShop,
    endUpgrade: endUpgrade,
    retryLevel: retryLevel,
    giveUp: giveUp,
    doBossAttack: doBossAttack,
    triggerWin: triggerWin,
    finishWin: finishWin,
    showFail: showFail,
    die: die,
    victory: victory,
    makeBall: makeBall,
    makeEnemy: makeEnemy,
    layoutFor: layoutFor,
    shapeBoard: shapeBoard,
    mapNodes: mapNodes,
    paintMapTrack: paintMapTrack,
    genMap: genMap,
    mapNodeById: mapNodeById,
    mapChoices: mapChoices,
    isMapChoice: isMapChoice,
    migrateRunToMap: migrateRunToMap,
    orangeCount: orangeCount,
    render: render,
    saveRun: saveRun,
    loadRun: loadRun,
    clearSave: clearSave,
    setViewportH: function (vh) { VH = vh; anchorBottom(); }, // tests: emulate a tall/short phone viewport
  },
};
global.Peggie = Peggie;
if (typeof module !== "undefined" && module.exports) module.exports = Peggie;

})(typeof window !== "undefined" ? window : global);
