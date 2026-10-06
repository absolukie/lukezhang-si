/* ============================================================
   WHAT SHOULD WE DO TONIGHT? — app.js
   UI flow: home → quiz → loading → result, plus
   history / favorites / bucket list / settings.
   Engine (engine.js) does all recommendation logic; this file
   only handles screens, input, and localStorage.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- storage ---------- */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function show(id) {
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
    $(id).classList.add("active");
    window.scrollTo(0, 0);
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); setTimeout(function(){ t.remove(); }, 300); }, 2200);
  }

  /* ---------- weather (optional, fails silently) ----------
     Hook: open-meteo, no key needed. If it fails or is slow,
     we just generate without weather nudges. */
  var WeatherCache = { data: null };
  function fetchWeather() {
    return new Promise(function (resolve) {
      var done = false;
      function fin(d) { if (!done) { done = true; WeatherCache.data = d; resolve(); } }
      setTimeout(function () { fin(null); }, 4500);
      try {
        fetch("https://api.open-meteo.com/v1/forecast?latitude=37.4530&longitude=-122.1817&current=temperature_2m,weather_code&temperature_unit=fahrenheit")
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j && j.current) fin({ tempF: Math.round(j.current.temperature_2m), code: j.current.weather_code });
            else fin(null);
          })
          .catch(function () { fin(null); });
      } catch (e) { fin(null); }
    });
  }

  /* ---------- quiz definitions ---------- */
  function homeBase() { return store.get("wsdwt_homebase", DATA.HOME_BASE.name); }

  var QDEF = {
    energy: { title: "How alive are we?", sub: "Be honest. There are no wrong answers, only cozy ones.", type: "single", key: "energy", options: [
      { v: 1, e: "🪫", t: "Barely functioning", s: "Get us out of decision-making mode immediately." },
      { v: 2, e: "😴", t: "Very tired", s: "Something easy." },
      { v: 3, e: "🙂", t: "Normal", s: "We can go somewhere." },
      { v: 4, e: "⚡", t: "Energetic", s: "We want to do something." },
      { v: 5, e: "🔥", t: "LET'S GO", s: "Give us an adventure." } ] },
    time: { title: "How much time do we have?", type: "single", key: "timeMin", options: [
      { v: 60, e: "⏱️", t: "1 hour" }, { v: 120, e: "🕑", t: "2 hours" },
      { v: 180, e: "🕒", t: "3 hours" }, { v: 270, e: "🌆", t: "4–5 hours" },
      { v: 360, e: "🌃", t: "All evening" }, { v: 420, e: "🤷", t: "We don't care when we get home" } ] },
    budget: { title: "What are we willing to spend tonight?", type: "single", key: "budget", options: [
      { v: "free", e: "💸", t: "Basically free", s: "$0–20 total" },
      { v: "cheap", e: "💵", t: "Cheap", s: "$20–50 total" },
      { v: "normal", e: "💵💵", t: "Normal date", s: "$50–100 total" },
      { v: "nice", e: "💵💵💵", t: "Nice night", s: "$100–200 total" },
      { v: "treat", e: "✨", t: "Treat ourselves", s: "$200+" },
      { v: "surprise", e: "🎲", t: "Surprise us" } ] },
    distance: { title: "How far will we go?", sub: "From {home}.", type: "single", key: "maxDrive", options: [
      { v: 0, e: "🏠", t: "Stay home", s: "The couch is the destination." },
      { v: 10, e: "🚶", t: "Very close", s: "Under ~10 minutes" },
      { v: 25, e: "🚗", t: "Nearby", s: "Under ~25 minutes" },
      { v: 60, e: "🌉", t: "Bay Area adventure", s: "Under ~60 minutes" },
      { v: 90, e: "🗺️", t: "Anywhere", s: "Convince us." } ] },
    food: { title: "What's happening with food?", type: "single", key: "food", options: [
      { v: "ate", e: "🍽️", t: "We already ate" },
      { v: "snack", e: "🧁", t: "Snack / dessert only" },
      { v: "quick", e: "🍔", t: "Quick food" },
      { v: "dinner", e: "🍜", t: "Dinner" },
      { v: "activity", e: "👨‍🍳", t: "Food IS the activity" },
      { v: "unknown", e: "🤷", t: "We don't know" },
      { v: "surprise", e: "🎲", t: "Surprise us" } ] },
    cuisines: { title: "What sounds good?", sub: "Tap what sounds good. Toggle NOT THAT, then tap to ban.", type: "cuisines" },
    vibe: { title: "What's tonight's vibe?", sub: "Pick up to 3.", type: "multimax", max: 3, key: "vibes",
      options: DATA.VIBES.map(function (x) { return { v: x[0], e: x[1], t: x[2] }; }) },
    social: { title: "People?", type: "single", key: "social", options: [
      { v: "low", e: "🏠", t: "Please don't make us interact with anyone" },
      { v: "med", e: "🙂", t: "Normal amount of humanity" },
      { v: "high", e: "🎉", t: "We want energy and people around" } ] },
    setting: { title: "Indoors or outdoors?", type: "single", key: "setting", options: [
      { v: "indoor", e: "🏠", t: "Indoors" }, { v: "outdoor", e: "🌳", t: "Outdoors" },
      { v: "either", e: "🤷", t: "Either" }, { v: "mix", e: "🔀", t: "Mix both" } ] },
    thinking: { title: "Do we want to use our brains tonight?", type: "single", key: "thinking", options: [
      { v: "yes", e: "🧠", t: "Yes", s: "Give us something to chew on." },
      { v: "alittle", e: "🙂", t: "A little" },
      { v: "no", e: "🚫", t: "Absolutely not", s: "The brain is off-duty." } ] },
    leave: { title: "Do we want to leave the house?", sub: "Sometimes this is the real question.", type: "single", key: "leave", options: [
      { v: "no", e: "🏠", t: "Absolutely not" }, { v: "maybe", e: "🤷", t: "Maybe" },
      { v: "yes", e: "🚗", t: "Yes" }, { v: "out", e: "🔥", t: "Get us out" } ] },
    faith: { title: "Include something meaningful?", sub: "Faith is part of who we are — want a thread of that tonight?", type: "single", key: "faith", options: [
      { v: true, e: "🙏", t: "Yes, please" }, { v: false, e: "💫", t: "Not tonight" } ] },
    chaos: { title: "How chaotic are we feeling?", sub: "🎲 Wildcard question! Nothing unsafe — just increasingly spontaneous.", type: "single", key: "chaos", options: [
      { v: 1, e: "😇", t: "1 — Extremely responsible" },
      { v: 2, e: "🙂", t: "2 — Normal adults" },
      { v: 3, e: "😏", t: "3 — Slightly spontaneous" },
      { v: 4, e: "😈", t: "4 — Bad influences on each other" },
      { v: 5, e: "🌪️", t: "5 — MAKE A MEMORY" } ] },
    dest: { title: "Where are we headed?", sub: "Friday evening through Sunday.", type: "single", key: "dest", options: [
      { v: "tahoe", e: "🌲", t: "Lake Tahoe", s: "~3.5 hrs · alpine lake, big adventure" },
      { v: "hmb", e: "🌊", t: "Half Moon Bay", s: "~35 min · coast, chill, sunsets" },
      { v: "bigsur", e: "🏔️", t: "Big Sur", s: "~2.5 hrs · dramatic cliffs" } ] },
    tesla: { title: "Taking the Tesla?", sub: "Charging stops become snack breaks.", type: "single", key: "tesla", options: [
      { v: true, e: "🔌", t: "Yes", s: "Charging stops built into the plan." },
      { v: false, e: "⛽", t: "No", s: "Gas or borrowed car." } ] },
    camp: { title: "Sleeping situation?", sub: "Car camping = Tesla camp mode + sleeping pads.", type: "single", key: "camp", options: [
      { v: true, e: "🏕️", t: "Car camping!", s: "Sleep in the car, under the stars." },
      { v: false, e: "🛏️", t: "Real beds", s: "Cabin, inn, or Airbnb." } ] },
    tripvibe: { title: "What's the weekend's vibe?", sub: "Pick up to 3.", type: "multimax", max: 3, key: "vibes",
      options: DATA.VIBES.map(function (x) { return { v: x[0], e: x[1], t: x[2] }; }) }
  };

  function buildQuestions(mode) {
    if (mode === "trip") return ["dest", "tesla", "camp", "tripvibe"];
    if (mode === "decide") return ["energy", "budget", "time"];
    if (mode === "now") return ["energy", "budget", "food"];
    if (mode === "home") return ["energy", "time", "vibe"];
    var q = ["energy", "time", "budget", "distance", "food",
             "vibe", "social", "setting", "thinking", "leave", "faith"];
    if (Math.random() < 0.3) q.push("chaos");
    return q;
  }
  function baseAnswers(mode) {
    var a = { mode: mode, chaos: 3, faith: false, cuisines: [], notThat: [], vibes: [],
              social: "med", setting: "either", thinking: "alittle", leave: "maybe",
              maxDrive: 25, food: "unknown", timeMin: 180, budget: "normal", energy: 3 };
    if (mode === "now") { a.leave = "out"; a.maxDrive = 20; }
    if (mode === "home") { a.leave = "no"; a.maxDrive = 0; a.setting = "indoor"; a.social = "low"; }
    if (mode === "trip") { a.dest = "tahoe"; a.tesla = true; a.camp = false; a.maxDrive = 210; }
    return a;
  }

  var Quiz = null;
  function startQuiz(mode) {
    Quiz = { mode: mode, questions: buildQuestions(mode), idx: 0, answers: baseAnswers(mode) };
    show("screen-quiz");
    renderQ();
  }

  function renderQ() {
    var qid = Quiz.questions[Quiz.idx];
    var def = QDEF[qid];
    var total = Quiz.questions.length;
    $("progress-fill").style.width = Math.round((Quiz.idx / total) * 100) + "%";
    var html = '<h2 class="q-title">' + def.title + "</h2>";
    if (def.sub) html += '<p class="q-sub">' + def.sub.replace("{home}", esc(homeBase())) + "</p>";

    if (def.type === "single") {
      html += '<div class="opt-grid">';
      def.options.forEach(function (o, i) {
        var sel = Quiz.answers[def.key] === o.v ? " sel" : "";
        html += '<button class="opt' + sel + '" data-i="' + i + '" style="animation-delay:' + (i * 40) + 'ms">' +
          '<span class="e">' + o.e + '</span><span><span class="tt">' + o.t + "</span>" +
          (o.s ? '<div class="ss">' + o.s + "</div>" : "") + "</span></button>";
      });
      html += "</div>";
    } else if (def.type === "multimax") {
      html += '<div class="chip-row" id="vibe-chips">';
      def.options.forEach(function (o) {
        var sel = Quiz.answers.vibes.indexOf(o.v) !== -1 ? " sel" : "";
        html += '<button class="chip' + sel + '" data-v="' + o.v + '">' + o.e + " " + o.t + "</button>";
      });
      html += '</div><button class="quiz-cta" id="vibe-next" ' +
        (Quiz.answers.vibes.length ? "" : "disabled") + ">Continue →</button>";
    } else if (def.type === "cuisines") {
      html += '<div class="sect-label">Sounds good 😋</div><div class="chip-row" id="cui-good">';
      DATA.CUISINES.forEach(function (c) {
        var sel = Quiz.answers.cuisines.indexOf(c) !== -1 ? " sel" : "";
        html += '<button class="chip' + sel + '" data-c="' + esc(c) + '">' + esc(c) + "</button>";
      });
      html += '</div><div class="sect-label">🚫 NOT THAT</div><div class="chip-row" id="cui-bad">';
      DATA.CUISINES.forEach(function (c) {
        var ex = Quiz.answers.notThat.indexOf(c) !== -1 ? " excl" : "";
        html += '<button class="chip' + ex + '" data-c="' + esc(c) + '">' + esc(c) + "</button>";
      });
      html += '</div><button class="quiz-cta" id="cui-next">Continue →</button>';
    }
    $("quiz-body").innerHTML = html;

    // wire up
    var body = $("quiz-body");
    if (def.type === "single") {
      body.querySelectorAll(".opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var o = def.options[+btn.getAttribute("data-i")];
          Quiz.answers[def.key] = o.v;
          advance();
        });
      });
    } else if (def.type === "multimax") {
      body.querySelectorAll("#vibe-chips .chip").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var v = btn.getAttribute("data-v");
          var arr = Quiz.answers.vibes;
          var i = arr.indexOf(v);
          if (i !== -1) arr.splice(i, 1);
          else if (arr.length < def.max) arr.push(v);
          else { toast("Up to 3 — unpick one first!"); return; }
          btn.classList.toggle("sel");
          $("vibe-next").disabled = arr.length === 0;
        });
      });
      $("vibe-next").addEventListener("click", advance);
    } else if (def.type === "cuisines") {
      function wire(rowId, listKey, otherKey, cls) {
        body.querySelectorAll("#" + rowId + " .chip").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var c = btn.getAttribute("data-c");
            var list = Quiz.answers[listKey];
            var i = list.indexOf(c);
            if (i !== -1) { list.splice(i, 1); btn.classList.remove(cls); }
            else {
              list.push(c); btn.classList.add(cls);
              // can't be in both lists
              var oi = Quiz.answers[otherKey].indexOf(c);
              if (oi !== -1) {
                Quiz.answers[otherKey].splice(oi, 1);
                var other = body.querySelector("#" + (rowId === "cui-good" ? "cui-bad" : "cui-good") + ' .chip[data-c="' + c + '"]');
                if (other) other.classList.remove(rowId === "cui-good" ? "excl" : "sel");
              }
            }
          });
        });
      }
      wire("cui-good", "cuisines", "notThat", "sel");
      wire("cui-bad", "notThat", "cuisines", "excl");
      $("cui-next").addEventListener("click", advance);
    }
  }

  function advance() {
    var cur = Quiz.questions[Quiz.idx];
    // insert cuisines question after food when relevant
    if (cur === "food") {
      var f = Quiz.answers.food;
      if ((f === "dinner" || f === "activity" || f === "quick" || f === "snack") &&
          Quiz.questions.indexOf("cuisines") === -1) {
        Quiz.questions.splice(Quiz.idx + 1, 0, "cuisines");
      }
    }
    // staying home → switch to home mode, drop the leave question
    if (cur === "distance" && Quiz.answers.maxDrive === 0) {
      Quiz.answers.leave = "no";
      Quiz.answers.mode = "home";
      Quiz.questions = Quiz.questions.filter(function (q) { return q !== "leave"; });
    }
    Quiz.idx++;
    if (Quiz.idx >= Quiz.questions.length) { finishQuiz(); return; }
    renderQ();
  }

  $("quiz-back").addEventListener("click", function () {
    if (!Quiz) return;
    if (Quiz.idx > 0) { Quiz.idx--; renderQ(); }
    else show("screen-home");
  });
  $("quiz-quit").addEventListener("click", function () { show("screen-home"); });

  /* ---------- context + generation ---------- */
  function buildCtx(seed) {
    return {
      now: new Date(),
      seed: seed,
      favorites: store.get("wsdwt_favs", []),
      bucket: store.get("wsdwt_bucket", []),
      recent: store.get("wsdwt_recent", {}),
      rejected: store.get("wsdwt_rejected", []),
      avoidIds: Current.avoidIds,
      weather: WeatherCache.data,
      homeBase: homeBase()
    };
  }
  function markSeen(plan) {
    if (!plan || !plan.venueIds) return;
    var recent = store.get("wsdwt_recent", {});
    var now = Date.now();
    plan.venueIds.forEach(function (id) { recent[id] = now; });
    // prune entries older than 30 days
    Object.keys(recent).forEach(function (k) {
      if (now - recent[k] > 30 * 86400000) delete recent[k];
    });
    store.set("wsdwt_recent", recent);
  }

  var Current = { plan: null, answers: null, seed: 0, avoidIds: {} };

  function finishQuiz() {
    show("screen-loading");
    var li = 0;
    var shuffled = DATA.LOADING.slice().sort(function () { return Math.random() - 0.5; });
    $("loading-line").textContent = shuffled[0];
    var lineTimer = setInterval(function () {
      li = (li + 1) % shuffled.length;
      $("loading-line").textContent = shuffled[li];
    }, 900);
    var seed = (Math.random() * 1e9) | 0;
    Promise.all([fetchWeather(), new Promise(function (r) { setTimeout(r, 2600); })])
      .then(function () {
        clearInterval(lineTimer);
        Current.seed = seed;
        Current.answers = Quiz.answers;
        Current.avoidIds = {}; // fresh quiz → fresh exclusion set
        var plan = Engine.generate(Quiz.answers, buildCtx(seed));
        if (!plan || plan.error) { toast("Hmm, nothing fit — try loosening a filter!"); show("screen-home"); return; }
        markSeen(plan);
        Current.plan = plan;
        renderResult(plan);
      });
  }

  function regen(action) {
    // action: 'reroll' | reason | modifier
    var answers = Current.answers;
    if (action !== "reroll") answers = Engine.transformAnswers(answers, action, Current.plan);
    if (action === "stayhome") answers.mode = "home";
    // every regen avoids the current plan's venues: soft 14-day penalty via
    // markSeen plus hard session exclusion so rerolls never just repeat
    markSeen(Current.plan);
    (Current.plan.venueIds || []).forEach(function (id) { Current.avoidIds[id] = true; });
    if (action === "done-it") {
      var rej = store.get("wsdwt_rejected", []);
      (Current.plan.venueIds || []).forEach(function (id) {
        if (rej.indexOf(id) === -1) rej.push(id);
      });
      store.set("wsdwt_rejected", rej.slice(-60));
    }
    Current.answers = answers;
    Current.seed = (Math.random() * 1e9) | 0;
    var plan = Engine.generate(answers, buildCtx(Current.seed));
    if (!plan || plan.error) { toast("Nothing fit with that tweak — try another!"); return; }
    if (plan.recycled) {
      toast("Cycled through all the fresh picks — showing the best matches again 🔁");
      Current.avoidIds = {}; // pool was exhausted; start the exclusion cycle over
    }
    markSeen(plan);
    Current.plan = plan;
    renderResult(plan);
  }

  /* ---------- result screen ---------- */
  function isFav(id) {
    var favs = store.get("wsdwt_favs", []);
    return favs.indexOf(id) !== -1;
  }
  function toggleFav(id, name) {
    var favs = store.get("wsdwt_favs", []);
    var i = favs.indexOf(id);
    if (i !== -1) { favs.splice(i, 1); toast("Removed from favorites"); }
    else {
      // store named favorites by name so hand-added ones match too
      favs.push(name && id.indexOf("bucket-") === 0 ? name : id);
      toast("❤️ Added to favorites");
    }
    store.set("wsdwt_favs", favs);
  }

  function renderTrip(plan) {
    var t = plan.trip;
    function costStr(c) { return (c[0] === 0 && c[1] === 0) ? "Free" : "$" + c[0] + "–$" + c[1]; }
    function tagEmoji(tag) {
      return { drive: "🚗", charge: "🔌", food: "🍽️", view: "🌅", activity: "🎯", chill: "😌" }[tag] || "✨";
    }
    var html = "";
    html += '<div class="res-kicker">The 3-day weekend</div>';
    html += '<h2 class="res-title">' + esc(plan.title) + "</h2>";
    html += '<div class="res-date">Friday evening → Sunday</div>';
    html += '<p class="page-sub" style="text-align:center">' + esc(t.tagline) + "</p>";
    html += '<div class="trip-badges">';
    if (t.tesla) html += "<span>🔌 Tesla mode</span>";
    if (t.camp) html += "<span>🏕️ Car camping</span>";
    html += "<span>💰 ~" + esc(t.totalCost) + " total</span></div>";

    t.days.forEach(function (d) {
      html += '<h3 class="day-title">' + esc(d.title) + "</h3>";
      html += '<div class="timeline">';
      d.stops.forEach(function (s) {
        html += '<div class="stop"><div class="stop-time">' + esc(s.time) + "</div>" +
          '<div class="stop-name">' + tagEmoji(s.tag) + " " + esc(s.n) + "</div>" +
          '<div class="stop-area">' + esc(s.area) + "</div>" +
          '<p class="stop-desc">' + esc(s.desc) + "</p>" +
          '<div class="stop-meta"><span class="cost">' + esc(costStr(s.c)) + "</span>" +
          '<a class="maps-link" href="https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(s.q || s.n) + '" target="_blank" rel="noopener">📍 Maps</a></div></div>';
      });
      html += "</div>";
      if (d.alt) {
        html += '<div class="alt-box"><div class="lbl">🔀 ALT OPTION</div>' +
          '<div class="stop-name">' + tagEmoji(d.alt.tag) + " " + esc(d.alt.n) + " — " + esc(d.alt.time) + "</div>" +
          '<p class="stop-desc">' + esc(d.alt.desc) + "</p>" +
          '<div class="stop-meta"><span class="cost">' + esc(costStr(d.alt.c)) + "</span>" +
          '<a class="maps-link" href="https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(d.alt.q || d.alt.n) + '" target="_blank" rel="noopener">📍 Maps</a></div></div>';
      }
    });

    html += '<div class="stay-box"><div class="lbl">🛏️ WHERE WE SLEEP</div><p>' + esc(t.stay) + "</p>" +
      '<p style="margin-top:10px"><b>On a budget?</b> ' + esc(t.budgetStay) + "</p></div>";

    if (plan.challenge) {
      html += '<div class="extra-box challenge"><div class="lbl">🎯 WEEKEND CHALLENGE</div><p>' + esc(plan.challenge) + "</p></div>";
    }
    if (plan.convo) {
      html += '<div class="extra-box convo"><div class="lbl">💬 WEEKEND QUESTION</div><p>' + esc(plan.convo) + "</p></div>";
    }

    html += '<div class="res-actions">';
    html += '<button class="btn-love" id="act-do">❤️ DO THIS</button>';
    html += '<div class="btn-row2"><button class="btn-ghost" id="act-reroll">🎲 Shuffle options</button>' +
      '<button class="btn-ghost" id="act-tesla">' + (t.tesla ? "⛽ Switch off Tesla" : "🔌 Switch on Tesla") + "</button></div>";
    html += '<div class="btn-row2"><button class="btn-ghost" id="act-camp">' + (t.camp ? "🛏️ Real beds instead" : "🏕️ Try car camping") + "</button>" +
      '<button class="btn-ghost" id="act-dest">🗺️ Change destination</button></div>';
    html += "</div>";
    html += '<button class="home-link" id="act-home">← back to home</button>';

    $("result-body").innerHTML = html;
    show("screen-result");

    $("act-do").addEventListener("click", function () { saveTripPlan(plan); });
    $("act-reroll").addEventListener("click", function () { regen("reroll"); });
    $("act-tesla").addEventListener("click", function () { tripToggle("tesla"); });
    $("act-camp").addEventListener("click", function () { tripToggle("camp"); });
    $("act-dest").addEventListener("click", function () { startQuiz("trip"); });
    $("act-home").addEventListener("click", function () { show("screen-home"); });
  }

  function tripToggle(field) {
    Current.answers[field] = !Current.answers[field];
    Current.seed = (Math.random() * 1e9) | 0;
    var plan = Engine.generate(Current.answers, buildCtx(Current.seed));
    if (!plan || plan.error) { toast("Nothing fit with that tweak — try another!"); return; }
    Current.plan = plan;
    renderResult(plan);
  }

  function saveTripPlan(plan) {
    var hist = store.get("wsdwt_history", []);
    var stops = [];
    plan.trip.days.forEach(function (d) {
      d.stops.forEach(function (s) { stops.push({ name: s.n, area: s.area, time: s.time }); });
    });
    hist.unshift({
      id: "d" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      title: plan.title,
      mode: "trip",
      totalCost: plan.trip.totalCost,
      duration: "3 days",
      stops: stops,
      venueIds: [],
      rating: 0, tags: [], again: null
    });
    store.set("wsdwt_history", hist.slice(0, 100));
    toast("Saved to Our Dates 📅");
  }

  function renderResult(plan) {
    if (plan.mode === "trip") { renderTrip(plan); return; }
    var html = "";
    html += '<div class="res-kicker">Tonight\'s plan</div>';
    html += '<h2 class="res-title">' + esc(plan.title) + "</h2>";
    html += '<div class="res-date">' + new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + "</div>";
    if (plan.nowFraming) {
      html += '<div class="now-banner">⚡ Leave in ~30 minutes. No reservations, no fuss — just go.</div>';
    }
    html += '<div class="stat-chips"><span>💰 ' + esc(plan.totalCost) + ' total</span>' +
      "<span>⏱ " + esc(plan.duration) + "</span>" +
      (plan.driveMin ? "<span>🚗 ~" + plan.driveMin + " min driving</span>" : "<span>🏠 zero driving</span>") +
      "<span>⚡ effort " + plan.effort + "/5</span></div>";
    html += '<div class="why-box"><div class="lbl">Why this fits tonight</div><p>' + esc(plan.why) + "</p></div>";
    html += '<div class="energy-match">' + esc(plan.energyMatch) + "</div>";

    html += '<div class="timeline">';
    plan.stops.forEach(function (s, i) {
      var favOn = isFav(s.venueId) ? " on" : "";
      var favIcon = isFav(s.venueId) ? "❤️" : "🤍";
      html += '<div class="stop"><div class="stop-time">' + esc(s.time) + " → " + esc(s.end) + "</div>" +
        '<div class="stop-name">' + esc(s.name) + "</div>" +
        '<div class="stop-area">' + esc(s.area) + (s.driveLeg ? " · ~" + s.driveLeg + " min away" : "") + "</div>" +
        (s.bucket ? '<div class="bucket-tag">📌 FROM YOUR BUCKET LIST</div>' : "") +
        '<p class="stop-desc">' + esc(s.desc) + "</p>" +
        '<div class="stop-meta"><span class="cost">' + esc(s.cost) + "</span>";
      if (s.kind !== "home") {
        html += '<a class="maps-link" href="' + s.maps + '" target="_blank" rel="noopener">📍 Maps</a>';
      }
      html += '<button class="fav-btn' + favOn + '" data-fav="' + esc(s.venueId) + '" data-name="' + esc(s.name) + '">' + favIcon + "</button>";
      html += "</div></div>";
    });
    html += "</div>";

    html += '<div class="fake-stats"><div class="lbl">📊 TONIGHT\'S (TOTALLY SCIENTIFIC) STATS</div>';
    plan.stats.forEach(function (st) {
      html += '<div class="row"><span>' + esc(st[0]) + "</span><b>" + esc(st[1]) + "</b></div>";
    });
    html += '<div class="fine">* not scientifically measured. at all.</div></div>';

    if (plan.challenge) {
      html += '<div class="extra-box challenge"><div class="lbl">🎯 MINI CHALLENGE</div><p>' + esc(plan.challenge) + "</p></div>";
    }
    if (plan.convo) {
      html += '<div class="extra-box convo"><div class="lbl">💬 TONIGHT\'S QUESTION</div><p>' + esc(plan.convo) + "</p></div>";
    }

    html += '<div class="res-actions">';
    html += '<button class="btn-love" id="act-do">❤️ DO THIS</button>';
    html += '<div class="btn-row2"><button class="btn-ghost" id="act-reroll">🎲 REROLL</button>' +
      '<button class="btn-ghost" id="act-reasons">↩️ Reroll, but…</button></div>';
    html += '<div class="reasons" id="reasons">' +
      '<button data-r="too-far">Too far</button><button data-r="too-expensive">Too expensive</button>' +
      '<button data-r="too-effort">Too much effort</button><button data-r="not-food">Don\'t want that food</button>' +
      '<button data-r="done-it">Already done it</button><button data-r="not-tonight">Not tonight</button>' +
      '<button data-r="boring" style="grid-column:1/-1">Sounds boring</button></div>';
    html += '<div class="btn-row2"><button class="btn-ghost" id="act-easier">😴 Make it easier</button>' +
      '<button class="btn-ghost" id="act-interesting">🔥 More interesting</button></div>';
    html += '<div class="btn-row2"><button class="btn-ghost" id="act-cheaper">💰 Make it cheaper</button>' +
      '<button class="btn-ghost" id="act-upgrade">✨ Upgrade it</button></div>';
    if (plan.mode !== "home") {
      html += '<button class="btn-ghost" id="act-stayhome" style="width:100%">🏠 JUST STAY HOME</button>';
    }
    html += "</div>";
    html += '<button class="home-link" id="act-home">← back to home</button>';

    $("result-body").innerHTML = html;
    show("screen-result");

    // wire
    $("result-body").querySelectorAll(".fav-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        toggleFav(b.getAttribute("data-fav"), b.getAttribute("data-name"));
        var on = isFav(b.getAttribute("data-fav"));
        b.classList.toggle("on", on);
        b.textContent = on ? "❤️" : "🤍";
      });
    });
    $("act-do").addEventListener("click", saveCurrentPlan);
    $("act-reroll").addEventListener("click", function () { regen("reroll"); });
    $("act-reasons").addEventListener("click", function () { $("reasons").classList.toggle("open"); });
    $("reasons").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { regen(b.getAttribute("data-r")); });
    });
    $("act-easier").addEventListener("click", function () { regen("easier"); });
    $("act-interesting").addEventListener("click", function () { regen("interesting"); });
    $("act-cheaper").addEventListener("click", function () { regen("cheaper"); });
    $("act-upgrade").addEventListener("click", function () { regen("upgrade"); });
    var sh = $("act-stayhome");
    if (sh) sh.addEventListener("click", function () { regen("stayhome"); });
    $("act-home").addEventListener("click", function () { show("screen-home"); });
  }

  function saveCurrentPlan() {
    var plan = Current.plan;
    if (!plan) return;
    var hist = store.get("wsdwt_history", []);
    hist.unshift({
      id: "d" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      title: plan.title,
      mode: plan.mode,
      totalCost: plan.totalCost,
      duration: plan.duration,
      stops: plan.stops.map(function (s) { return { name: s.name, area: s.area, time: s.time }; }),
      venueIds: plan.venueIds,
      rating: 0, tags: [], again: null
    });
    store.set("wsdwt_history", hist.slice(0, 100));
    toast("Saved to Our Dates 📅");
  }

  /* ---------- history ---------- */
  var RATE_TAGS = ["Food", "Romantic", "Relaxing", "Funny", "Interesting", "Adventurous", "Good conversation", "Worth the drive", "Great value"];

  function renderHistory() {
    var hist = store.get("wsdwt_history", []);
    var el = $("history-list");
    if (!hist.length) {
      el.innerHTML = '<div class="empty">No dates yet.<br>Go plan something wonderful. 💫</div>';
      return;
    }
    el.innerHTML = hist.map(function (h, i) {
      var stars = "";
      for (var s = 1; s <= 5; s++) {
        stars += '<button data-s="' + s + '" class="' + (h.rating >= s ? "lit" : "") + '">⭐</button>';
      }
      var tags = RATE_TAGS.map(function (t) {
        return '<button class="chip' + (h.tags.indexOf(t) !== -1 ? " sel" : "") + '" data-t="' + t + '">' + t + "</button>";
      }).join("");
      var stops = h.stops.map(function (x) { return x.time + " — " + x.name; }).join("<br>");
      return '<div class="card" data-i="' + i + '"><h3>' + esc(h.title) + "</h3>" +
        '<div class="meta">' + esc(h.date) + " · " + esc(h.totalCost) + " · " + esc(h.duration) + "</div>" +
        '<p class="desc">' + stops + "</p>" +
        '<div class="sect-label">How was it?</div><div class="stars">' + stars + "</div>" +
        '<div class="tag-row">' + tags + "</div>" +
        '<div class="sect-label">Would you do it again?</div>' +
        '<div class="again-row">' +
        '<button data-a="yes" class="' + (h.again === "yes" ? "sel-yes" : "") + '">Absolutely</button>' +
        '<button data-a="maybe" class="' + (h.again === "maybe" ? "sel-maybe" : "") + '">Maybe</button>' +
        '<button data-a="no" class="' + (h.again === "no" ? "sel-no" : "") + '">Probably not</button></div>' +
        '<button class="del">Delete</button></div>';
    }).join("");

    el.querySelectorAll(".card").forEach(function (card) {
      var i = +card.getAttribute("data-i");
      function save() {
        var hist = store.get("wsdwt_history", []);
        store.set("wsdwt_history", hist);
      }
      card.querySelectorAll(".stars button").forEach(function (b) {
        b.addEventListener("click", function () {
          var hist = store.get("wsdwt_history", []);
          hist[i].rating = +b.getAttribute("data-s");
          store.set("wsdwt_history", hist);
          card.querySelectorAll(".stars button").forEach(function (x) {
            x.classList.toggle("lit", +x.getAttribute("data-s") <= hist[i].rating);
          });
          toast(hist[i].rating >= 4 ? "A keeper! 💛" : "Noted. We'll aim higher next time.");
        });
      });
      card.querySelectorAll(".tag-row .chip").forEach(function (b) {
        b.addEventListener("click", function () {
          var hist = store.get("wsdwt_history", []);
          var t = b.getAttribute("data-t");
          var ix = hist[i].tags.indexOf(t);
          if (ix !== -1) hist[i].tags.splice(ix, 1); else hist[i].tags.push(t);
          store.set("wsdwt_history", hist);
          b.classList.toggle("sel");
        });
      });
      card.querySelectorAll(".again-row button").forEach(function (b) {
        b.addEventListener("click", function () {
          var hist = store.get("wsdwt_history", []);
          hist[i].again = b.getAttribute("data-a");
          store.set("wsdwt_history", hist);
          card.querySelectorAll(".again-row button").forEach(function (x) { x.className = ""; });
          b.className = hist[i].again === "yes" ? "sel-yes" : hist[i].again === "no" ? "sel-no" : "sel-maybe";
        });
      });
      card.querySelector(".del").addEventListener("click", function () {
        var hist = store.get("wsdwt_history", []);
        hist.splice(i, 1);
        store.set("wsdwt_history", hist);
        renderHistory();
      });
    });
  }

  /* ---------- favorites ---------- */
  function renderFavs() {
    var favs = store.get("wsdwt_favs", []);
    var el = $("fav-list");
    if (!favs.length) {
      el.innerHTML = '<div class="empty">No favorites yet.<br>Tap 🤍 on any result stop to heart it.</div>';
      return;
    }
    el.innerHTML = favs.map(function (f, i) {
      return '<div class="card bucket-item"><span class="txt">❤️ ' + esc(f) + '</span>' +
        '<button class="del" data-i="' + i + '">Remove</button></div>';
    }).join("");
    el.querySelectorAll(".del").forEach(function (b) {
      b.addEventListener("click", function () {
        var favs = store.get("wsdwt_favs", []);
        favs.splice(+b.getAttribute("data-i"), 1);
        store.set("wsdwt_favs", favs);
        renderFavs();
      });
    });
  }

  /* ---------- bucket list ---------- */
  function renderBucket() {
    var items = store.get("wsdwt_bucket", []);
    var el = $("bucket-list");
    if (!items.length) {
      el.innerHTML = '<div class="empty">Empty bucket.<br>Add that restaurant, park, or class you keep talking about. 🪣</div>';
      return;
    }
    el.innerHTML = items.map(function (it, i) {
      return '<div class="card bucket-item"><button class="pin-btn' + (it.pinned ? " on" : "") + '" data-p="' + i + '" title="Prioritize">📌</button>' +
        '<span class="txt">' + esc(it.text) + "</span>" +
        '<button class="del" data-i="' + i + '">Remove</button></div>';
    }).join("");
    el.querySelectorAll(".pin-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var items = store.get("wsdwt_bucket", []);
        var it = items[+b.getAttribute("data-p")];
        it.pinned = !it.pinned;
        store.set("wsdwt_bucket", items);
        renderBucket();
        if (it.pinned) toast("📌 Pinned — we'll sneak it in soon");
      });
    });
    el.querySelectorAll(".del").forEach(function (b) {
      b.addEventListener("click", function () {
        var items = store.get("wsdwt_bucket", []);
        items.splice(+b.getAttribute("data-i"), 1);
        store.set("wsdwt_bucket", items);
        renderBucket();
      });
    });
  }

  /* ---------- home + tabs + settings wiring ---------- */
  $("btn-plan").addEventListener("click", function () { startQuiz("full"); });
  $("btn-trip").addEventListener("click", function () { startQuiz("trip"); });
  $("btn-decide").addEventListener("click", function () { startQuiz("decide"); });
  $("btn-now").addEventListener("click", function () { startQuiz("now"); });
  $("btn-home").addEventListener("click", function () { startQuiz("home"); });

  document.querySelectorAll(".tabbar button").forEach(function (b) {
    b.addEventListener("click", function () {
      var tab = b.getAttribute("data-tab");
      if (tab === "history") renderHistory();
      if (tab === "favorites") renderFavs();
      if (tab === "bucket") renderBucket();
      if (tab === "settings") $("set-homebase").value = homeBase();
      show("screen-" + tab);
    });
  });
  document.querySelectorAll(".back-home").forEach(function (b) {
    b.addEventListener("click", function () { show("screen-home"); });
  });

  $("fav-add").addEventListener("click", function () {
    var v = $("fav-input").value.trim();
    if (!v) return;
    var favs = store.get("wsdwt_favs", []);
    if (favs.indexOf(v) === -1) favs.push(v);
    store.set("wsdwt_favs", favs);
    $("fav-input").value = "";
    renderFavs();
    toast("❤️ Added to favorites");
  });
  $("bucket-add").addEventListener("click", function () {
    var v = $("bucket-input").value.trim();
    if (!v) return;
    var items = store.get("wsdwt_bucket", []);
    items.push({ text: v, pinned: false });
    store.set("wsdwt_bucket", items);
    $("bucket-input").value = "";
    renderBucket();
    toast("🪣 Added to bucket list");
  });
  [$("fav-input"), $("bucket-input")].forEach(function (inp) {
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") inp.nextElementSibling.click();
    });
  });

  $("set-save").addEventListener("click", function () {
    var v = $("set-homebase").value.trim() || DATA.HOME_BASE.name;
    store.set("wsdwt_homebase", v);
    toast("Home base set to " + v + " 🏠");
  });
  $("set-reset").addEventListener("click", function () {
    if (confirm("Clear all history, favorites, bucket list, and learned preferences?")) {
      ["wsdwt_history", "wsdwt_favs", "wsdwt_bucket", "wsdwt_recent", "wsdwt_rejected", "wsdwt_homebase"]
        .forEach(function (k) { store.del(k); });
      toast("Fresh start ✨");
      show("screen-home");
    }
  });

  // init
  show("screen-home");

  // Test hook (node only — lets a harness drive the quiz flow).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      _test: {
        startQuiz: startQuiz, renderQ: renderQ, advance: advance,
        finishQuiz: finishQuiz, renderResult: renderResult, regen: regen,
        buildQuestions: buildQuestions, baseAnswers: baseAnswers,
        getQuiz: function () { return Quiz; }, Current: Current, store: store
      }
    };
  }
})();
