/* ============================================================
   WHAT SHOULD WE DO TONIGHT? — engine.js
   Weighted recommendation engine. Pure logic, no DOM.
   Works in browser (window.DATA) and node (require).

   answers = {
     energy: 1-5, timeMin, budget: 'free'|'cheap'|'normal'|'nice'|'treat'|'surprise',
     maxDrive, food: 'ate'|'snack'|'quick'|'dinner'|'activity'|'unknown'|'surprise',
     cuisines: [], notThat: [], vibes: [], social: 'low'|'med'|'high',
     setting: 'indoor'|'outdoor'|'either'|'mix', thinking: 'yes'|'alittle'|'no',
     leave: 'no'|'maybe'|'yes'|'out', faith: bool, chaos: 1-5,
     mode: 'full'|'decide'|'now'|'home', _unusualBoost: bool, _dropLast: bool
   }
   ctx = {
     now: Date, seed: number, favorites: [ids or names],
     bucket: [{text, pinned}], recent: {id: timestamp},
     rejected: [ids], weather: {tempF, code} | null, homeBase: string
   }
   ============================================================ */
(function () {
  var DATA = (typeof require === "function" && typeof module !== "undefined")
    ? require("./data.js")
    : (typeof window !== "undefined" ? window.DATA : null);

  var BANDS = {
    free:     { lo: 0,   hi: 20 },
    cheap:    { lo: 0,   hi: 50 },
    normal:   { lo: 0,   hi: 100 },
    nice:     { lo: 0,   hi: 200 },
    treat:    { lo: 120, hi: 9999 },
    surprise: { lo: 0,   hi: 200 }
  };
  var DIST_STEPS = [10, 25, 60, 90];
  var RAIN_CODES = [51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,95,96,99];

  /* ---------- seeded rng ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(rng, arr) {
    arr = arr.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function resolveBand(answers, rng) {
    if (answers.budget === "surprise") {
      return pick(rng, ["cheap", "normal", "normal", "nice"]);
    }
    return answers.budget;
  }

  function seasonNow(ctx) { return DATA.seasonOf(ctx.now || new Date()); }

  /* ---------- hard filters ---------- */
  function venuePasses(v, a, band, ctx) {
    if (v.d > a.maxDrive) return false;
    if (v.c[1] > band.hi) return false;
    if (band.lo > 0 && v.c[1] < band.lo * 0.5) return false; // treat band: nothing dirt cheap
    if (v.t + v.d > a.timeMin) return false; // can't possibly fit even solo
    if (a.energy < v.e[0] - 1 || a.energy > v.e[1] + 1) return false;
    if (a.setting === "indoor" && v.s === "outdoor") return false;
    if (a.setting === "outdoor" && v.s === "indoor") return false;
    if (!a.faith && v.faith) return false;
    if (v.seas && v.seas.indexOf(seasonNow(ctx)) === -1) return false;
    // food vetoes
    if (v.f && a.notThat && a.notThat.length) {
      for (var i = 0; i < v.f.length; i++) {
        if (a.notThat.indexOf(v.f[i]) !== -1) return false;
      }
    }
    return true;
  }

  function favMatch(v, ctx) {
    if (!ctx.favorites) return false;
    var name = v.n.toLowerCase();
    for (var i = 0; i < ctx.favorites.length; i++) {
      var f = String(ctx.favorites[i]).toLowerCase();
      if (f === v.id || name.indexOf(f) !== -1 || f.indexOf(name) !== -1) return true;
    }
    return false;
  }

  /* ---------- soft scoring ---------- */
  function scoreVenue(v, a, band, ctx, rng) {
    var s = 20 + rng() * 10; // base + jitter
    var i;
    // vibe overlap
    var overlap = 0;
    for (i = 0; i < (a.vibes || []).length; i++) {
      if (v.v.indexOf(a.vibes[i]) !== -1) overlap++;
    }
    s += Math.min(overlap * 12, 32);
    // energy fit
    if (a.energy >= v.e[0] && a.energy <= v.e[1]) s += 15;
    else s += 6;
    if (a.energy <= 2 && v.e[0] <= 2) s += 8;             // low energy: favor gentle
    if (a.energy >= 4 && v.e[1] >= 4) s += 8;             // high energy: favor lively
    // food
    var needsFood = (a.food === "dinner" || a.food === "activity");
    if (needsFood && (v.kind === "food")) s += 15;
    if (a.food === "quick" && v.kind === "food" && v.t <= 50) s += 12;
    if (a.food === "snack" && (v.kind === "dessert" || v.kind === "drink")) s += 15;
    if (a.cuisines && a.cuisines.length && v.f) {
      var cm = 0;
      for (i = 0; i < a.cuisines.length; i++) {
        if (v.f.indexOf(a.cuisines[i]) !== -1) cm++;
      }
      s += Math.min(cm * 8, 16);
    }
    // social / thinking
    if (v.so === a.social) s += 8;
    if (a.thinking === "yes" && v.th !== "low") s += 8;
    if (a.thinking === "no" && v.th === "low") s += 8;
    if (a.thinking === "alittle" && v.th === "med") s += 4;
    // setting preference lean
    if (a.setting === "mix" && v.s === "mix") s += 6;
    // chaos loves unusual; low energy fears it
    var chaos = a.chaos || 3;
    s += v.u * chaos * 4;
    if (a._unusualBoost) s += v.u * 12;
    if (a.energy <= 2) s -= v.u * 8;
    // favorites
    if (favMatch(v, ctx)) s += 20;
    // novelty: penalize recently seen (14-day decay), hard-penalize rejected
    if (ctx.recent && ctx.recent[v.id]) {
      var daysAgo = ((ctx.now || new Date()).getTime() - ctx.recent[v.id]) / 86400000;
      if (daysAgo < 14) s -= 25 * (1 - daysAgo / 14);
    }
    if (ctx.rejected && ctx.rejected.indexOf(v.id) !== -1) s -= 100;
    // seasonal
    if (v.seas && v.seas.indexOf(seasonNow(ctx)) !== -1) s += 10;
    // weather nudge
    if (ctx.weather) {
      var w = ctx.weather;
      var rainy = RAIN_CODES.indexOf(w.code) !== -1;
      if ((rainy || w.tempF < 50) && v.s === "outdoor") s -= 25;
      if (!rainy && w.tempF >= 60 && w.tempF <= 80 && v.s === "outdoor") s += 6;
    }
    return s;
  }

  function rankVenues(a, band, ctx, rng, extraFilter) {
    var out = [];
    for (var i = 0; i < DATA.VENUES.length; i++) {
      var v = DATA.VENUES[i];
      if (!venuePasses(v, a, band, ctx)) continue;
      if (extraFilter && !extraFilter(v)) continue;
      out.push({ v: v, s: scoreVenue(v, a, band, ctx, rng) });
    }
    out.sort(function (x, y) { return y.s - x.s; });
    return out;
  }

  function topPick(ranked, rng, n) {
    // pick from top n for variety
    var pool = ranked.slice(0, Math.max(1, Math.min(n || 5, ranked.length)));
    return pick(rng, pool).v;
  }

  /* ---------- itinerary assembly ---------- */
  function legDrive(fromArea, toV) {
    if (!fromArea) return toV.d;
    return fromArea === toV.area ? 6 : Math.max(8, Math.round(toV.d * 0.6));
  }

  function assemble(a, bandKey, ctx, rng, bandOverride) {
    var band = bandOverride || BANDS[bandKey];
    var stops = [];
    var used = {};
    var timeLeft = a.timeMin;
    var budgetLeft = band.hi;
    // Travel is budgeted during assembly (not just venue durations),
    // so the plan — including the drive home — fits the time window.
    var prevArea = null, driveTotal = 0, legs = [];

    function take(v) {
      var leg = legDrive(prevArea, v);
      legs.push(leg);
      stops.push(v); used[v.id] = true;
      timeLeft -= (v.t + leg); budgetLeft -= v.c[1];
      driveTotal += leg; prevArea = v.area;
    }
    function dropLast() {
      var d = stops.pop(), l = legs.pop();
      timeLeft += d.t + l; budgetLeft += d.c[1]; driveTotal -= l;
      prevArea = stops.length ? stops[stops.length - 1].area : null;
    }
    function ranked(filterFn, excludeUsed) {
      function run(withAvoid) {
        return rankVenues(a, band, ctx, rng, function (v) {
          if (excludeUsed !== false && used[v.id]) return false;
          if (withAvoid && ctx.avoidIds && ctx.avoidIds[v.id]) return false;
          return !filterFn || filterFn(v);
        });
      }
      // hard-exclude venues already shown this session; if that empties the
      // pool, fall back to the full pool and flag it so the UI can say so
      var r = run(true);
      if (!r.length) { r = run(false); if (r.length) ctx._recycled = true; }
      return r;
    }

    var needsDinner = (a.food === "dinner" || a.food === "activity");
    var wantsQuick = (a.food === "quick");
    var wantsSnack = (a.food === "snack");

    // 1. anchor — must fit the time window including drive there AND back
    function fitsTime(v) { return v.t + legDrive(null, v) + v.d <= timeLeft; }
    var anchor;
    if (needsDinner) {
      var r = ranked(function (v) { return v.kind === "food" && v.c[1] <= budgetLeft && fitsTime(v); });
      anchor = r.length ? topPick(r, rng) : null;
    } else if (wantsQuick) {
      var r2 = ranked(function (v) { return v.kind === "food" && v.t <= 55 && v.c[1] <= budgetLeft && fitsTime(v); });
      anchor = r2.length ? topPick(r2, rng) : null;
    } else if (wantsSnack) {
      var r3 = ranked(function (v) { return (v.kind === "dessert" || v.kind === "drink") && v.c[1] <= budgetLeft && fitsTime(v); });
      anchor = r3.length ? topPick(r3, rng) : null;
    }
    if (!anchor) {
      var r4 = ranked(function (v) {
        return v.kind !== "food" && v.kind !== "dessert" && v.kind !== "drink" && v.c[1] <= budgetLeft && fitsTime(v);
      });
      anchor = r4.length ? topPick(r4, rng) : null;
    }
    if (!anchor) {
      // last resort: among budget-fitting venues, prefer ones that also fit
      // the clock — and among those, the priciest (a short "treat" beats a
      // long one there's no time for)
      var r5 = ranked(function (v) { return v.c[1] <= budgetLeft; });
      if (r5.length) {
        r5.sort(function (x, y) {
          var xf = (x.v.t + 2 * x.v.d) <= timeLeft ? 0 : 1;
          var yf = (y.v.t + 2 * y.v.d) <= timeLeft ? 0 : 1;
          return (xf - yf) || (y.v.c[1] - x.v.c[1]) || ((x.v.t + 2 * x.v.d) - (y.v.t + 2 * y.v.d));
        });
        anchor = r5[0].v;
      }
    }
    if (!anchor) return null;
    take(anchor);

    // 2. supporting stops to fill the evening
    var maxStops = a.energy >= 4 && a.timeMin >= 240 ? 4 : 3;
    if (a.mode === "now") maxStops = 2;

    function tryAdd(filterFn, kinds) {
      if (stops.length >= maxStops || timeLeft < 50) return;
      var r = ranked(function (v) {
        if (kinds && kinds.indexOf(v.kind) === -1) return false;
        if (v.c[1] > budgetLeft) return false;
        // venue time + travel leg to get there must fit
        if (v.t + legDrive(prevArea, v) > timeLeft - 10) return false;
        return !filterFn || filterFn(v);
      });
      if (r.length) take(topPick(r, rng));
    }

    var hadFood = anchor.kind === "food";
    var hadDessert = anchor.kind === "dessert" || anchor.kind === "drink";
    // dessert after dinner (or as a sweet stop)
    if (!hadDessert && (hadFood || a.food !== "ate" || rng() < 0.4)) {
      tryAdd(null, ["dessert", "drink"]);
      hadDessert = stops.some(function (v) { return v.kind === "dessert" || v.kind === "drink"; });
    }
    // a walk or view if there's time and setting allows
    if (a.setting !== "indoor") {
      tryAdd(null, ["walk", "view"]);
    }
    // one more activity for big-energy, big-time nights
    if (stops.length < maxStops && timeLeft >= 70 && a.energy >= 3) {
      tryAdd(null, ["activity", "entertainment", "culture", "creative", "explore"]);
    }
    if (a._dropLast && stops.length > 1) dropLast();

    // make sure the drive home fits inside the time window too
    while (stops.length > 1 && timeLeft < stops[stops.length - 1].d) dropLast();

    // 3. times + travel
    var start = new Date((ctx.now || new Date()).getTime());
    if (a.mode === "now") start = new Date(start.getTime() + 30 * 60000);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    var t = start.getTime();
    var timed = stops.map(function (v, i) {
      var leg = legs[i]; // counted in driveTotal during assembly
      t += leg * 60000;
      var stop = { venue: v, start: new Date(t), end: new Date(t + v.t * 60000), leg: leg };
      t += v.t * 60000;
      return stop;
    });
    // drive home (budgeted above, added to the driving total for display)
    var homeLeg = stops.length ? stops[stops.length - 1].d : 0;
    driveTotal += homeLeg;

    var costLo = stops.reduce(function (s, v) { return s + v.c[0]; }, 0);
    var costHi = stops.reduce(function (s, v) { return s + v.c[1]; }, 0);
    var durMin = Math.round((t - start.getTime()) / 60000);
    var effort = Math.max(1, Math.min(5, Math.round(
      stops.reduce(function (s, v) { return s + (v.e[0] + v.e[1]) / 2; }, 0) / stops.length
    )));

    return {
      stops: timed, start: start, costLo: costLo, costHi: costHi,
      durMin: durMin, driveMin: driveTotal, effort: effort,
      band: bandKey, anchorId: anchor.id
    };
  }

  /* ---------- title ---------- */
  function titleFor(plan, a, rng) {
    var tags = {};
    if (a.energy <= 2) tags.lowenergy = 1;
    if (a.energy >= 4) tags.highenergy = 1;
    if (plan.band === "free" || plan.band === "cheap") tags.cheap = 1;
    if (plan.band === "treat") tags.treat = 1;
    if ((a.chaos || 3) >= 4) tags.chaos = 1;
    if (a.faith) tags.faith = 1;
    if (a.timeMin <= 120) tags.short = 1;
    plan.stops.forEach(function (s) {
      var v = s.venue;
      if (v.area === "San Francisco") tags.sf = 1;
      if (v.kind === "dessert" || v.kind === "drink") tags.dessert = 1;
      if (v.kind === "food") tags.food = 1;
      if (v.s === "outdoor") tags.outdoor = 1;
      v.v.forEach(function (x) { tags[x] = 1; });
    });
    var scored = DATA.TITLES.map(function (e) {
      var sc = 0;
      e.tags.forEach(function (tg) { if (tags[tg]) sc++; });
      return { t: e.t, sc: sc };
    });
    scored.sort(function (x, y) { return y.sc - x.sc; });
    var best = scored.filter(function (x) { return x.sc === scored[0].sc; });
    return pick(rng, best).t;
  }

  /* ---------- why this fits ---------- */
  function whyFits(plan, a, ctx) {
    var bits = [];
    var eWord = { 1: "running on fumes", 2: "pretty low-energy", 3: "feeling normal", 4: "feeling energetic", 5: "fully charged" }[a.energy];
    bits.push("You're " + eWord + ", so " + (a.energy <= 2
      ? "we kept everything gentle, close, and decision-free."
      : a.energy >= 4
        ? "we built you something with actual momentum."
        : "we balanced going out with not overdoing it."));
    var bWord = { free: "basically free", cheap: "cheap", normal: "a normal date budget", nice: "a nice night out", treat: "a treat-yourselves budget" }[plan.band];
    bits.push("Total lands around " + fmtCost(plan.costLo, plan.costHi) + " (" + bWord + ").");
    if (a.leave === "no" || plan.stops.every(function (s) { return s.venue.d <= 10; })) {
      // stay close
    } else if (plan.driveMin > 60) {
      bits.push("Yes, there's driving (" + plan.driveMin + " min total) — but the payoff is worth it.");
    } else {
      bits.push("Everything stays within about " + a.maxDrive + " minutes of " + (ctx.homeBase || DATA.HOME_BASE.name) + ".");
    }
    if (a.food === "dinner" || a.food === "activity") bits.push("Dinner is the anchor, exactly like you asked.");
    else if (a.food === "snack") bits.push("Kept it to snacks and dessert — no full dinner commitment.");
    else if (a.food === "ate") bits.push("Since you already ate, food is strictly a bonus round.");
    if (a.vibes && a.vibes.length) {
      var vl = a.vibes.slice(0, 2).join(" + ");
      bits.push("Vibe check: " + vl + ".");
    }
    if (ctx.weather) {
      var w = ctx.weather;
      var rainy = RAIN_CODES.indexOf(w.code) !== -1;
      if (rainy) bits.push("It's rainy out, so we leaned indoors.");
      else if (w.tempF < 50) bits.push("It's chilly tonight, so we kept you warm.");
    }
    return bits.join(" ");
  }

  function fmtCost(lo, hi) {
    if (lo === 0 && hi === 0) return "free";
    if (lo === hi) return "$" + lo;
    return "$" + lo + "–" + hi;
  }
  function fmtDur(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return m + " min";
    return m ? h + "h " + m + "m" : h + "h";
  }
  function fmtTime(d) {
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  }

  /* ---------- fake stats ---------- */
  function fakeStats(plan, a, rng) {
    var out = [];
    var leaveP = plan.stops.length && plan.stops[0].venue.d > 0
      ? 60 + Math.floor(rng() * 35) : 5 + Math.floor(rng() * 20);
    out.push(["Leaving-the-house probability", leaveP + "%"]);
    out.push(["Snack probability", (85 + Math.floor(rng() * 14)) + "%"]);
    var dessert = plan.stops.some(function (s) { return s.venue.kind === "dessert" || s.venue.kind === "drink"; });
    out.push(["Likelihood we get dessert anyway", dessert ? "100%" : (70 + Math.floor(rng() * 29)) + "%"]);
    out.push(["Chance we say “this was actually fun”", (82 + Math.floor(rng() * 17)) + "%"]);
    out.push(["Effort required", plan.effort + "/5"]);
    return out;
  }

  function maybeChallenge(plan, a, rng) {
    if (rng() > 0.45) return null;
    var tags = {};
    plan.stops.forEach(function (s) {
      var v = s.venue;
      if (v.kind === "food" || v.kind === "dessert") tags.food = 1;
      if (v.kind === "dessert" || v.kind === "drink") tags.dessert = 1;
      if (v.s === "outdoor") tags.outdoor = 1;
      v.v.forEach(function (x) { tags[x] = 1; });
    });
    var cands = DATA.CHALLENGES.filter(function (c) {
      return c.tags.length === 0 || c.tags.some(function (t) { return tags[t]; });
    });
    return cands.length ? pick(rng, cands).t : null;
  }

  function maybeConvo(rng) {
    return rng() < 0.3 ? pick(rng, DATA.CONVOS) : null;
  }

  /* ---------- bucket list injection ---------- */
  function bucketStop(a, ctx, rng) {
    if (!ctx.bucket || !ctx.bucket.length) return null;
    if (rng() > 0.25) return null;
    var pinned = ctx.bucket.filter(function (b) { return b.pinned; });
    var item = pinned.length ? pick(rng, pinned) : pick(rng, ctx.bucket);
    return {
      id: "bucket-" + item.text.slice(0, 12),
      n: item.text, kind: "activity", area: "Your bucket list",
      d: Math.min(a.maxDrive, 25), c: [20, 60], t: 60, e: [1, 5],
      v: ["adventurous"], s: "mix", so: "med", th: "low", f: [], u: 2,
      desc: "From your bucket list. Tonight's the night.", q: item.text + " Bay Area",
      _bucket: true
    };
  }

  /* ---------- main entry points ---------- */
  function finalize(plan, a, ctx, rng) {
    // optional bucket injection: swap a supporting stop.
    // The bucket item inherits the replaced stop's time slot and drive
    // estimate so the itinerary math (times, window fit) stays intact.
    var bs = bucketStop(a, ctx, rng);
    if (bs && plan.stops.length > 1) {
      var idx = 1 + Math.floor(rng() * (plan.stops.length - 1));
      var old = plan.stops[idx].venue;
      bs.t = old.t; bs.d = old.d;
      plan.stops[idx].venue = bs;
      plan.costLo += bs.c[0] - old.c[0];
      plan.costHi += bs.c[1] - old.c[1];
    }
    var title = titleFor(plan, a, rng);
    return {
      title: title,
      mode: a.mode,
      stops: plan.stops.map(function (s) {
        return {
          time: fmtTime(s.start), end: fmtTime(s.end),
          name: s.venue.n, area: s.venue.area, desc: s.venue.desc,
          cost: fmtCost(s.venue.c[0], s.venue.c[1]),
          maps: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.venue.q || s.venue.n),
          venueId: s.venue.id, driveLeg: s.leg, kind: s.venue.kind,
          bucket: !!s.venue._bucket, foodKinds: s.venue.f || []
        };
      }),
      totalCost: fmtCost(plan.costLo, plan.costHi),
      duration: fmtDur(plan.durMin),
      durMin: plan.durMin,
      driveMin: plan.driveMin,
      effort: plan.effort,
      energyMatch: a.energy <= 2
        ? "Gentle enough for energy level " + a.energy + "."
        : a.energy >= 4
          ? "Built for energy level " + a.energy + ". Go get it."
          : "Perfect for energy level " + a.energy + ".",
      why: whyFits(plan, a, ctx),
      stats: fakeStats(plan, a, rng),
      challenge: maybeChallenge(plan, a, rng),
      convo: maybeConvo(rng),
      venueIds: plan.stops.map(function (s) { return s.venue.id; }),
      nowFraming: a.mode === "now"
    };
  }

  function fillDecideDefaults(a) {
    var vibes = shuffle(Math.random, ["cozy", "food", "romantic", "playful", "explore", "peaceful"]).slice(0, 2);
    return Object.assign({
      maxDrive: 25, food: "unknown", cuisines: [], notThat: [], vibes: vibes,
      social: "med", setting: "either", thinking: "alittle",
      leave: "maybe", faith: false, chaos: 3
    }, a);
  }

  function generate(answers, ctx) {
    ctx = ctx || {};
    var rng = mulberry32(ctx.seed || ((Math.random() * 1e9) | 0));
    var a = Object.assign({}, answers);
    if (a.mode === "decide") a = fillDecideDefaults(a);
    if (a.leave === "no") a.mode = "home";
    if (a.mode === "home") { var hp = homePlan(a, ctx, rng); hp.recycled = !!ctx._recycled; return hp; }
    if (a.mode === "trip") return tripPlan(a, ctx, rng);
    var bandKey = resolveBand(a, rng);
    var plan = assemble(a, bandKey, ctx, rng);
    if (!plan) {
      // relax: widen drive + drop the budget floor (a "treat" can be
      // short and sweet too), then try once more
      a = Object.assign({}, a, { maxDrive: Math.max(a.maxDrive, 60) });
      var band = BANDS[bandKey];
      plan = assemble(a, bandKey, ctx, rng, { lo: 0, hi: band.hi });
    }
    if (!plan) return { error: "no-plan" };
    var out = finalize(plan, a, ctx, rng);
    out.recycled = !!ctx._recycled;
    return out;
  }

  /* ---------------- 3-day weekend trips ---------------- */
  function tripPlan(a, ctx, rng) {
    ctx = ctx || {};
    rng = rng || mulberry32(ctx.seed || ((Math.random() * 1e9) | 0));
    var trip = (DATA.TRIPS || {})[a.dest] || (DATA.TRIPS || {}).tahoe;
    var tesla = !!a.tesla, camp = !!a.camp;
    var days = trip.days.map(function (day) {
      var stops = day.stops.filter(function (s) { return !s.tesla || tesla; });
      var alt = null;
      if (day.alt && day.alt.length) {
        var altCands = day.alt.filter(function (s) { return !s.tesla || tesla; });
        if (altCands.length) alt = pick(rng, altCands);
      }
      return { title: day.title, stops: stops, alt: alt };
    });
    var costLo = 0, costHi = 0;
    days.forEach(function (d) {
      d.stops.forEach(function (s) { costLo += s.c[0]; costHi += s.c[1]; });
    });
    var stayLine = camp ? trip.campStay : trip.stay;
    if (tesla) {
      var chargeNote = "Tesla mode on: charging stops are folded into the plan. " +
        "Think of them as built-in snack breaks — check the Tesla app for live charger status before you roll.";
      stayLine += " " + chargeNote;
    }
    var pseudo = { stops: [] };
    days.forEach(function (d) {
      d.stops.forEach(function (s) {
        pseudo.stops.push({ venue: {
          kind: s.tag === "food" ? "food" : s.tag,
          s: (s.tag === "view" || s.tag === "activity") ? "outdoor" : "indoor",
          v: []
        } });
      });
    });
    return {
      title: trip.emoji + " " + trip.n + " — 3-Day Weekend",
      mode: "trip",
      trip: {
        id: trip.id, name: trip.n, emoji: trip.emoji, tagline: trip.tagline,
        tesla: tesla, camp: camp,
        days: days, stay: stayLine,
        budgetStay: trip.budgetStay,
        totalCost: fmtCost(costLo, costHi)
      },
      challenge: maybeChallenge(pseudo, a, rng),
      convo: maybeConvo(rng)
    };
  }

  function homePlan(a, ctx, rng) {
    ctx = ctx || {};
    rng = rng || mulberry32(ctx.seed || ((Math.random() * 1e9) | 0));
    var bandKey = resolveBand(a, rng);
    var band = BANDS[bandKey];
    function candPass(h, withAvoid) {
      if (h.c[1] > band.hi) return false;
      if (band.lo > 0 && h.c[1] < band.lo * 0.5) return false;
      if (!a.faith && h.faith) return false;
      if (a.energy < h.e[0] - 1 || a.energy > h.e[1] + 1) return false;
      if (h.t > a.timeMin - 15) return false;
      if (ctx.rejected && ctx.rejected.indexOf(h.id) !== -1) return false;
      if (withAvoid && ctx.avoidIds && ctx.avoidIds[h.id]) return false;
      return true;
    }
    var cands = DATA.HOME_IDEAS.filter(function (h) { return candPass(h, true); });
    if (!cands.length) {
      cands = DATA.HOME_IDEAS.filter(function (h) { return candPass(h, false); });
      if (cands.length) ctx._recycled = true;
    }
    if (!cands.length) return { error: "no-plan" };
    var scored = cands.map(function (h) {
      var s = 20 + rng() * 10, i, ov = 0;
      for (i = 0; i < (a.vibes || []).length; i++) if (h.v.indexOf(a.vibes[i]) !== -1) ov++;
      s += Math.min(ov * 12, 30);
      if (a.energy >= h.e[0] && a.energy <= h.e[1]) s += 12;
      if (ctx.recent && ctx.recent[h.id]) {
        var d = ((ctx.now || new Date()).getTime() - ctx.recent[h.id]) / 86400000;
        if (d < 14) s -= 25 * (1 - d / 14);
      }
      if ((a.chaos || 3) >= 4 && /challenge|battle|showdown|test|experiment/i.test(h.n + h.twist)) s += 10;
      return { h: h, s: s };
    });
    scored.sort(function (x, y) { return y.s - x.s; });
    var main = pick(rng, scored.slice(0, Math.min(3, scored.length))).h;
    var stops = [main];
    var timeLeft = a.timeMin - main.t;
    // maybe a second, lighter home activity
    if (timeLeft >= 60 && rng() < 0.6) {
      var second = scored.filter(function (x) {
        return x.h.id !== main.id && x.h.t <= timeLeft - 10 && x.h.e[0] <= 3;
      })[0];
      if (second) stops.push(second.h);
    }
    var start = new Date((ctx.now || new Date()).getTime());
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    var t = start.getTime();
    var timed = stops.map(function (h) {
      var s = { venue: null, start: new Date(t), end: new Date(t + h.t * 60000), leg: 0 };
      t += h.t * 60000;
      s.home = h;
      return s;
    });
    var plan = {
      stops: timed.map(function (s) {
        return {
          venue: {
            id: s.home.id, n: s.home.n, kind: "home", area: "Home",
            d: 0, c: s.home.c, t: s.home.t, e: s.home.e, v: s.home.v,
            s: "indoor", so: "low", th: "low", f: [], u: 1,
            desc: s.home.desc + " " + s.home.twist,
            q: "", _home: true
          },
          start: s.start, end: s.end, leg: 0
        };
      }),
      start: start,
      costLo: stops.reduce(function (x, h) { return x + h.c[0]; }, 0),
      costHi: stops.reduce(function (x, h) { return x + h.c[1]; }, 0),
      durMin: Math.round((t - start.getTime()) / 60000),
      driveMin: 0,
      effort: Math.max(1, Math.min(3, a.energy <= 2 ? 1 : 2)),
      band: bandKey, anchorId: main.id
    };
    var out = finalize(plan, a, ctx, rng);
    out.title = pick(rng, DATA.TITLES.filter(function (x) { return x.tags.indexOf("home") !== -1; }).map(function (x) { return x.t; })) || out.title;
    out.energyMatch = "Zero driving. Maximum couch.";
    return out;
  }

  /* ---------- reroll reasons & modifiers ---------- */
  var DIST_DOWN = { 90: 60, 60: 25, 25: 10, 10: 10 };
  var BAND_DOWN = { treat: "nice", nice: "normal", normal: "cheap", cheap: "free", free: "free", surprise: "normal" };
  var BAND_UP = { free: "cheap", cheap: "normal", normal: "nice", nice: "treat", treat: "treat", surprise: "nice" };

  function transformAnswers(answers, action, plan) {
    var a = Object.assign({}, answers, {
      cuisines: (answers.cuisines || []).slice(),
      notThat: (answers.notThat || []).slice(),
      vibes: (answers.vibes || []).slice()
    });
    switch (action) {
      case "too-far": a.maxDrive = DIST_DOWN[a.maxDrive] || 10; break;
      case "too-expensive": a.budget = BAND_DOWN[a.budget] || "cheap"; break;
      case "too-effort": a.energy = Math.max(1, a.energy - 1); break;
      case "not-food":
        if (plan && plan.stops) plan.stops.forEach(function (s) {
          // veto via venue name keywords — app passes foodKinds through plan
          (s.foodKinds || []).forEach(function (fk) {
            if (a.notThat.indexOf(fk) === -1) a.notThat.push(fk);
          });
        });
        break;
      case "boring": a.chaos = Math.min(5, (a.chaos || 3) + 2); a._unusualBoost = true; break;
      case "easier":
        a.energy = Math.max(1, a.energy - 1);
        a.maxDrive = DIST_DOWN[a.maxDrive] || 10;
        a._dropLast = true;
        break;
      case "cheaper": a.budget = BAND_DOWN[a.budget] || "cheap"; break;
      case "interesting": a.chaos = Math.min(5, (a.chaos || 3) + 2); a._unusualBoost = true; break;
      case "upgrade": a.budget = BAND_UP[a.budget] || "nice"; break;
      case "stayhome": a.mode = "home"; a.leave = "no"; break;
    }
    return a;
  }

  var Engine = {
    generate: generate,
    homePlan: homePlan,
    transformAnswers: transformAnswers,
    // exposed for tests
    _venuePasses: venuePasses, _scoreVenue: scoreVenue,
    _rankVenues: rankVenues, _BANDS: BANDS
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Engine;
  else if (typeof window !== "undefined") window.Engine = Engine;
})();
