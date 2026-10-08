/* StayLegal app logic. Vanilla JS, no dependencies. */
"use strict";

(function () {
  var DATA = (typeof STAYLEGAL_DATA !== "undefined")
    ? STAYLEGAL_DATA
    : { cities: [], demoAddresses: [], lastChecked: "" };

  var form = document.getElementById("searchForm");
  var input = document.getElementById("addressInput");
  var resultSection = document.getElementById("resultSection");
  var unknownSection = document.getElementById("unknownSection");
  var savedSection = document.getElementById("savedSection");

  var currentCity = null;
  var currentAddress = "";
  var perspective = "investor"; // or "hosted"

  /* ---------- jurisdiction matching ---------- */
  function normalize(s) {
    return (s || "").toLowerCase().replace(/[.,#]/g, " ").replace(/\s+/g, " ").trim();
  }

  function matchCity(address) {
    var n = normalize(address);
    if (!n) return null;
    // 3-digit entries in keywords are ZIP prefixes: only match them against
    // real 5-digit ZIP codes in the address, never as loose substrings
    // (e.g. "100 Main St" must not match NYC's "100" prefix).
    var zips = n.match(/\b\d{5}(?:-\d{4})?\b/g) || [];
    var best = null, bestLen = 0;
    DATA.cities.forEach(function (c) {
      (c.keywords || []).forEach(function (kw) {
        var k = normalize(kw);
        if (!k) return;
        var hit;
        if (/^\d{3}$/.test(k)) {
          hit = zips.some(function (z) { return z.indexOf(k) === 0; });
        } else {
          hit = n.indexOf(k) !== -1;
        }
        if (hit && k.length > bestLen) {
          best = c; bestLen = k.length;
        }
      });
    });
    return best;
  }

  /* ---------- storage ---------- */
  function loadJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  function removeLocal(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function checkId(address, cityId, p) {
    var value = normalize(address) + "|" + cityId + "|" + p;
    var hash = 2166136261;
    for (var i = 0; i < value.length; i++) {
      hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
    }
    return "check-" + (hash >>> 0).toString(16);
  }

  function savedChecks() {
    var checks = loadJSON("staylegal.checks", []);
    return Array.isArray(checks) ? checks : [];
  }

  function liveKey(cityId, p) {
    return "staylegal.checklist.live." + cityId + "." + p;
  }

  function propId(city) {
    var id = checkId(currentAddress, city.id, perspective);
    return savedChecks().some(function (c) { return c.id === id; })
      ? id : "live." + city.id + "." + perspective;
  }

  function checklistKey(city) {
    return "staylegal.checklist." + propId(city);
  }

  function hoaKey(city) {
    return "staylegal.hoa." + (city ? propId(city) : "general");
  }

  function migrateStorage() {
    var checks = savedChecks(), migrated = [];
    checks.forEach(function (c) {
      if (!c || !c.cityId) return;
      var p = c.perspective === "hosted" ? "hosted" : "investor";
      var address = c.address || "";
      var id = c.id || checkId(address, c.cityId, p);
      if (migrated.some(function (item) { return item.id === id; })) return;
      migrated.push({
        id: id, cityId: c.cityId, cityLabel: c.cityLabel || c.cityId,
        verdict: verdictKey(c.verdict), address: address,
        name: c.name || address, perspective: p,
        dataVersion: c.dataVersion || "2026-10-07",
        savedAt: c.savedAt != null ? c.savedAt : (c.at != null ? c.at : Date.now())
      });
    });
    if (JSON.stringify(checks) !== JSON.stringify(migrated)) saveJSON("staylegal.checks", migrated);
    DATA.cities.forEach(function (city) {
      var oldKey = "staylegal.checklist." + city.id;
      var old = loadJSON(oldKey, null);
      if (!old || typeof old !== "object") return;
      var key = liveKey(city.id, "investor");
      var done = loadJSON(key, {});
      city.steps.forEach(function (step, index) {
        if (!Object.prototype.hasOwnProperty.call(done, step.id)) {
          done[step.id] = !!(old[step.id] || old[index]);
        }
      });
      // Old city-wide progress cannot be attributed to a particular property.
      if (saveJSON(key, done)) removeLocal(oldKey);
    });
  }

  /* ---------- verdict labels ---------- */
  var VERDICTS = {
    legal:  { stamp: "Legal", short: "Legal" },
    permit: { stamp: "Legal with permit", short: "Permit needed" },
    banned: { stamp: "Not allowed", short: "Not allowed" },
    unknown: { stamp: "Needs manual review", short: "Needs manual review" }
  };

  function verdictKey(value) {
    return value === "legal" || value === "permit" || value === "banned" ? value : "unknown";
  }

  /* ---------- render ---------- */
  function kv(el, rows) {
    el.innerHTML = "";
    rows.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "row";
      var dt = document.createElement("dt"); dt.textContent = r.label;
      var dd = document.createElement("dd"); dd.textContent = r.value;
      row.appendChild(dt); row.appendChild(dd);
      el.appendChild(row);
    });
  }

  function currentView(city) {
    if (perspective === "hosted" && city.hosted) {
      return {
        verdict: city.hosted.verdict,
        headline: city.hosted.headline,
        summary: city.hosted.summary,
        permit: city.hosted.permit || city.permit
      };
    }
    return { verdict: city.verdict, headline: city.headline, summary: city.summary, permit: city.permit };
  }

  function setPerspective(p, repaint) {
    perspective = p;
    var inv = document.getElementById("segInvestor");
    var hos = document.getElementById("segHosted");
    inv.classList.toggle("on", p === "investor");
    hos.classList.toggle("on", p === "hosted");
    inv.setAttribute("aria-pressed", p === "investor" ? "true" : "false");
    hos.setAttribute("aria-pressed", p === "hosted" ? "true" : "false");
    if (currentCity && repaint !== false) paintVerdict(currentCity, currentAddress, false);
  }

  document.getElementById("segInvestor").addEventListener("click", function () { setPerspective("investor"); });
  document.getElementById("segHosted").addEventListener("click", function () { setPerspective("hosted"); });

  function paintVerdict(city, address, scroll) {
    var view = currentView(city);
    var verdict = verdictKey(view.verdict);
    var v = VERDICTS[verdict];

    document.getElementById("resultCity").textContent = city.city + ", " + city.state;
    var card = document.getElementById("verdictCard");
    card.className = "verdict " + verdict;
    var stamp = document.getElementById("verdictStamp");
    stamp.textContent = v.stamp;
    stamp.classList.remove("pop");
    void stamp.offsetWidth; /* restart the pop animation */
    stamp.classList.add("pop");
    var verified = city.confidence === "verified";
    var confidence = document.getElementById("confidencePill");
    confidence.className = "confidence " + (verified ? "verified" : "secondary");
    confidence.textContent = verified ? "Verified research" : "Secondary sources";
    document.getElementById("researchedLine").textContent = "Researched " + (city.researched || DATA.lastChecked);
    document.getElementById("verdictHeadline").textContent = verdict === "unknown" ? "Needs manual review" : view.headline;
    document.getElementById("verdictSummary").textContent = verdict === "unknown"
      ? "We could not map this address to a clear verdict from our research. Treat this as unresolved and confirm with the city directly."
      : view.summary;
    document.getElementById("permitLead").textContent = "Permit: " + view.permit.name + ", " + view.permit.cost;
    document.getElementById("verdictAddr").textContent = address
      ? "Address entered: " + address : "City-level overview, no address checked.";

    kv(document.getElementById("permitKv"), [
      { label: "Permit", value: view.permit.name },
      { label: "Issued by", value: view.permit.issuer },
      { label: "Cost", value: view.permit.cost },
      { label: "Renewal", value: view.permit.renewal }
    ]);
    kv(document.getElementById("limitsKv"), city.limits);
    kv(document.getElementById("taxesKv"), city.taxes);

    renderSteps(city);
    renderChanges(city);

    var src = document.getElementById("sourcesList");
    src.innerHTML = "";
    (city.sources || []).forEach(function (s, i) {
      if (i > 0) src.appendChild(document.createTextNode(" · "));
      var a = document.createElement("a");
      a.href = s.url; a.textContent = s.label;
      a.target = "_blank"; a.rel = "noopener";
      src.appendChild(a);
    });
    document.getElementById("checkedLine").textContent =
      "Rules researched " + DATA.lastChecked + ". They change, verify with the city before you buy.";

    renderNeighborWarning(city);
    renderReminderUI();

    resultSection.classList.remove("hidden");
    unknownSection.classList.add("hidden");
    if (scroll !== false) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCity(city, address, warning) {
    currentCity = city;
    currentAddress = address || "";
    document.getElementById("includeAddress").checked = false;
    document.getElementById("sharePopover").open = false;
    var banner = document.getElementById("linkWarning");
    banner.textContent = warning || "";
    banner.classList.toggle("hidden", !warning);

    try {
      history.replaceState(null, "",
        "#/check/" + city.id + (address ? "?address=" + encodeURIComponent(address) : ""));
    } catch (e) {}

    paintVerdict(city, address, true);
    renderHoa();
  }

  function renderSteps(city) {
    var list = document.getElementById("stepsList");
    list.innerHTML = "";
    var key = checklistKey(city);
    var done = loadJSON(key, {});
    var total = city.steps.length, doneCount = 0;

    city.steps.forEach(function (s, i) {
      var li = document.createElement("li");
      var checked = !!done[s.id];
      if (checked) { li.classList.add("done"); doneCount++; }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "check";
      btn.setAttribute("role", "checkbox");
      btn.setAttribute("aria-checked", checked ? "true" : "false");
      btn.setAttribute("aria-label", "Mark step done: " + s.title);
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">' +
        '<path d="M2.5 7.5l3.2 3.2L11.5 4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
      btn.addEventListener("click", function () {
        var d = loadJSON(key, {});
        d[s.id] = !d[s.id];
        saveJSON(key, d);
        renderSteps(city);
        renderSaved();
      });
      var body = document.createElement("div");
      var t = document.createElement("div"); t.className = "t"; t.textContent = (i + 1) + ". " + s.title;
      var d = document.createElement("div"); d.className = "d"; d.textContent = s.detail;
      if (i === 0) {
        li.classList.add("start-here");
        var start = document.createElement("div");
        start.className = "start-label"; start.textContent = "Start here";
        body.appendChild(start);
      }
      body.appendChild(t); body.appendChild(d);
      var permit = currentView(city).permit;
      if (i === 0 && permit.url) {
        var link = document.createElement("a");
        link.href = permit.url; link.target = "_blank"; link.rel = "noopener";
        link.textContent = "Start at " + permit.issuer;
        body.appendChild(link);
      }
      li.appendChild(btn); li.appendChild(body);
      list.appendChild(li);
    });

    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    document.getElementById("checkProgress").style.width = pct + "%";
  }

  function renderChanges(city) {
    var box = document.getElementById("changesList");
    box.innerHTML = "";
    (city.changes || []).forEach(function (c) {
      var div = document.createElement("div");
      div.className = "change";
      var t = document.createElement("div"); t.className = "t"; t.textContent = c.title;
      var d = document.createElement("div"); d.className = "d"; d.textContent = c.detail;
      div.appendChild(t); div.appendChild(d);
      box.appendChild(div);
    });
  }

  /* ---------- neighbor-city warning (B6) ---------- */
  function renderNeighborWarning(city) {
    var box = document.getElementById("neighborWarning");
    var neighbors = city.neighbors || [];
    if (!neighbors.length) { box.classList.add("hidden"); box.textContent = ""; return; }
    var names = neighbors.map(function (n) { return n.city; });
    var list = names.length > 2
      ? names.slice(0, -1).join(", ") + ", and " + names[names.length - 1]
      : names.join(" and ");
    var notes = [];
    neighbors.forEach(function (n) { if (notes.indexOf(n.note) === -1) notes.push(n.note); });
    box.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = "Border check";
    box.appendChild(strong);
    box.appendChild(document.createTextNode(
      "Your address matched " + city.city + ". If the property is actually in " + list +
      ", this verdict does not apply. " + notes.join(" ")));
    box.classList.remove("hidden");
  }

  /* ---------- renewal reminders, local only (B3) ---------- */
  function getReminders() { return loadJSON("staylegal.reminders", {}); }

  function daysUntil(dateStr) {
    var parts = (dateStr || "").split("-");
    if (parts.length !== 3) return null;
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (isNaN(d.getTime())) return null;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }

  function reminderText(days) {
    if (days === null) return "";
    if (days < 0) return "Overdue by " + (-days) + (days === -1 ? " day" : " days");
    if (days === 0) return "Renews today";
    if (days === 1) return "Renews tomorrow";
    return "Renews in " + days + " days";
  }

  function reminderBanner(checkId, permitName) {
    var r = getReminders()[checkId];
    if (!r || !r.date) return null;
    var days = daysUntil(r.date);
    if (days === null) return null;
    var div = document.createElement("div");
    div.className = "remind-banner" + (days <= 7 ? " overdue" : "");
    div.textContent = (r.label || (permitName ? permitName + " renewal" : "Renewal")) + ": " + reminderText(days);
    return div;
  }

  function renderReminderUI() {
    var slot = document.getElementById("remindBannerSlot");
    if (!slot) return;
    slot.innerHTML = "";
    if (!currentCity) return;
    var id = checkId(currentAddress, currentCity.id, perspective);
    var isSaved = savedChecks().some(function (c) { return c.id === id; });
    var r = getReminders()[id];
    document.getElementById("remindDate").value = (r && r.date) || "";
    if (isSaved) {
      var banner = reminderBanner(id, currentView(currentCity).permit.name);
      if (banner) slot.appendChild(banner);
    }
    renderNotifOptIn();
  }

  function renderNotifOptIn() {
    var slot = document.getElementById("notifSlot");
    if (!slot) return;
    slot.innerHTML = "";
    if (!("Notification" in window)) return;
    try {
      if (Notification.permission === "granted") {
        if (!loadJSON("staylegal.notif", false)) saveJSON("staylegal.notif", true);
        return;
      }
      if (Notification.permission === "denied") return;
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "btn ghost";
      btn.style.padding = "8px 12px"; btn.style.fontSize = "13px";
      btn.textContent = "Enable browser reminders";
      btn.addEventListener("click", function () {
        try {
          Notification.requestPermission().then(function (perm) {
            if (perm === "granted") { saveJSON("staylegal.notif", true); checkDueReminders(); }
            renderNotifOptIn();
          });
        } catch (e) {}
      });
      slot.appendChild(btn);
    } catch (e) {}
  }

  function checkDueReminders() {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      if (!loadJSON("staylegal.notif", false)) return;
      var rems = getReminders();
      var checks = savedChecks();
      Object.keys(rems).forEach(function (id) {
        var days = daysUntil(rems[id].date);
        if (days !== null && days >= 0 && days <= 7) {
          var c = null;
          checks.forEach(function (item) { if (item.id === id) c = item; });
          var label = (c && (c.name || c.address)) || rems[id].label || "Permit";
          try {
            new Notification("StayLegal: " + label,
              { body: reminderText(days) + " (" + (rems[id].label || "renewal") + ")" });
          } catch (e) {}
        }
      });
    } catch (e) {}
  }

  function saveCurrentCheck() {
    if (!currentCity) return null;
    var checks = savedChecks();
    var id = checkId(currentAddress, currentCity.id, perspective);
    var existing = null;
    checks.forEach(function (c) { if (c.id === id) existing = c; });
    if (existing) return existing;
    var c = {
      id: id,
      cityId: currentCity.id,
      cityLabel: currentCity.city + ", " + currentCity.state,
      verdict: verdictKey(currentView(currentCity).verdict),
      address: currentAddress,
      name: currentAddress,
      perspective: perspective,
      dataVersion: DATA.version,
      savedAt: Date.now()
    };
    checks.push(c);
    var live = liveKey(currentCity.id, perspective);
    if (saveJSON("staylegal.checks", checks)) {
      if (saveJSON("staylegal.checklist." + id, loadJSON(live, {}))) removeLocal(live);
      var liveHoaKey = "staylegal.hoa.live." + currentCity.id + "." + perspective;
      var liveHoa = loadJSON(liveHoaKey, null);
      if (liveHoa) {
        saveJSON("staylegal.hoa." + id, liveHoa);
        removeLocal(liveHoaKey);
      }
    }
    return c;
  }

  function rerunCheck(c) {
    var city = null;
    DATA.cities.forEach(function (cc) { if (cc.id === c.cityId) city = cc; });
    if (!city) return;
    setPerspective(c.perspective === "hosted" ? "hosted" : "investor", false);
    input.value = c.address || "";
    var matched = c.address ? matchCity(c.address) : null;
    renderCity(matched || city, c.address || "");
    var all = savedChecks();
    all.forEach(function (item) {
      if (item.id === c.id) {
        item.dataVersion = DATA.version;
        item.verdict = verdictKey(currentView(city).verdict);
        item.savedAt = Date.now();
      }
    });
    saveJSON("staylegal.checks", all);
    renderSaved();
  }

  function renderUnknown(address) {
    currentCity = null;
    document.getElementById("coveredCount").textContent = DATA.cities.length;
    var guess = "";
    var parts = (address || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (parts.length) guess = parts[parts.length - 1];
    document.getElementById("reqCity").value = guess;
    document.getElementById("reqOk").classList.add("hidden");
    var chips = document.getElementById("cityChips");
    chips.innerHTML = "";
    DATA.cities.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.style.color = "var(--blue)";
      b.style.borderColor = "var(--line)"; b.style.background = "#fff";
      b.textContent = c.city + ", " + c.state;
      b.addEventListener("click", function () {
        var demo = "1 Main St, " + c.city + ", " + c.state;
        input.value = demo;
        doCheck(demo);
      });
      chips.appendChild(b);
    });
    resultSection.classList.add("hidden");
    unknownSection.classList.remove("hidden");
    unknownSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- saved checks ---------- */
  function renderSaved() {
    var checks = savedChecks();
    var box = document.getElementById("savedList");
    box.innerHTML = "";
    if (!checks.length) { savedSection.classList.add("hidden"); return; }
    savedSection.classList.remove("hidden");
    checks.slice().reverse().forEach(function (c) {
      var city = DATA.cities.find(function (item) { return item.id === c.cityId; });
      var div = document.createElement("div");
      div.className = "saved-item";
      var verdict = verdictKey(c.verdict);
      var pill = document.createElement("span");
      pill.className = "pill " + verdict; pill.textContent = VERDICTS[verdict].short;
      var a = document.createElement("div"); a.className = "a";
      var name = document.createElement("input");
      name.type = "text"; name.className = "saved-name"; name.value = c.name || c.address;
      name.setAttribute("aria-label", "Rename saved check for " + (c.address || c.cityLabel));
      name.addEventListener("change", function () {
        var all = savedChecks();
        all.forEach(function (item) {
          if (item.id === c.id) item.name = name.value.trim() || item.address;
        });
        saveJSON("staylegal.checks", all);
        name.value = name.value.trim() || c.address;
      });
      name.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { event.preventDefault(); name.blur(); }
      });
      var meta = document.createElement("div"); meta.className = "s";
      meta.textContent = c.cityLabel + " · " + (c.perspective === "hosted" ? "Hosted" : "Investor") + " · rules v" + c.dataVersion;
      var address = document.createElement("div"); address.className = "s";
      address.textContent = c.address || "City-level overview, no address checked.";
      var steps = city ? city.steps : [];
      var done = loadJSON("staylegal.checklist." + c.id, {});
      var count = steps.filter(function (step) { return !!done[step.id]; }).length;
      var pct = steps.length ? Math.round(count / steps.length * 100) : 0;
      var progress = document.createElement("div"); progress.className = "progress";
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-label", "Checklist for " + (c.name || c.address || c.cityLabel));
      progress.setAttribute("aria-valuemin", "0"); progress.setAttribute("aria-valuemax", "100");
      progress.setAttribute("aria-valuenow", String(pct));
      var bar = document.createElement("i"); bar.style.width = pct + "%";
      progress.appendChild(bar);
      var status = document.createElement("div"); status.className = "s";
      status.textContent = pct + "% of checklist complete";
      a.appendChild(name); a.appendChild(meta); a.appendChild(address); a.appendChild(progress); a.appendChild(status);
      if (c.dataVersion !== DATA.version) {
        var upd = document.createElement("div");
        upd.className = "update-banner";
        upd.appendChild(document.createTextNode(
          "The rules data was updated after you saved this check (saved v" + c.dataVersion +
          ", current v" + DATA.version + "). "));
        var updBtn = document.createElement("button");
        updBtn.type = "button"; updBtn.className = "btn ghost";
        updBtn.style.padding = "8px 12px"; updBtn.style.fontSize = "13px";
        updBtn.textContent = "Re-run check";
        updBtn.addEventListener("click", function () { rerunCheck(c); });
        upd.appendChild(updBtn);
        a.appendChild(upd);
      }
      if (city) {
        var nowVerdict = verdictKey(c.perspective === "hosted" && city.hosted ? city.hosted.verdict : city.verdict);
        if (nowVerdict !== verdict) {
          var vc = document.createElement("div");
          vc.className = "verdict-change";
          vc.textContent = "Verdict changed since you saved this: was " + VERDICTS[verdict].short +
            ", now " + VERDICTS[nowVerdict].short + ".";
          a.appendChild(vc);
        }
      }
      var rbanner = reminderBanner(c.id, null);
      if (rbanner) a.appendChild(rbanner);
      var actions = document.createElement("div");
      actions.className = "saved-actions";
      var open = document.createElement("button");
      open.type = "button"; open.className = "btn ghost";
      open.style.padding = "8px 12px"; open.style.fontSize = "13px";
      open.textContent = "Open";
      open.addEventListener("click", function () {
        if (city) {
          setPerspective(c.perspective, false);
          input.value = c.address;
          renderCity(city, c.address);
        }
      });
      var rerun = document.createElement("button");
      rerun.type = "button"; rerun.className = "btn ghost";
      rerun.style.padding = "8px 12px"; rerun.style.fontSize = "13px";
      rerun.textContent = "Re-run";
      rerun.setAttribute("aria-label", "Re-run check for " + (c.address || c.cityLabel));
      rerun.addEventListener("click", function () { rerunCheck(c); });
      actions.appendChild(open); actions.appendChild(rerun);
      var del = document.createElement("button");
      del.type = "button"; del.className = "linklike"; del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove saved check for " + (c.address || c.cityLabel));
      del.addEventListener("click", function () {
        var all = savedChecks().filter(function (item) { return item.id !== c.id; });
        if (saveJSON("staylegal.checks", all)) {
          removeLocal("staylegal.checklist." + c.id);
          removeLocal("staylegal.hoa." + c.id);
          var rems = getReminders();
          if (rems[c.id]) { delete rems[c.id]; saveJSON("staylegal.reminders", rems); }
        }
        renderSaved();
        if (currentCity) renderSteps(currentCity);
      });
      div.appendChild(pill); div.appendChild(a); div.appendChild(actions); div.appendChild(del);
      box.appendChild(div);
    });
  }

  document.getElementById("copyLinkBtn").addEventListener("click", function () {
    var btn = document.getElementById("copyLinkBtn");
    function done(label) {
      btn.textContent = label;
      setTimeout(function () { btn.textContent = "Copy link"; }, 1600);
    }
    if (!currentCity) return;
    var url = location.origin + location.pathname + "#/check/" + currentCity.id;
    if (document.getElementById("includeAddress").checked && currentAddress) {
      url += "?address=" + encodeURIComponent(currentAddress);
    }
    function legacyCopy(ok, fail) {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        if (document.execCommand("copy")) ok(); else fail();
      } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { done("Copied"); },
        function () { legacyCopy(function () { done("Copied"); }, function () { done("Copy failed"); }); }
      );
    } else {
      legacyCopy(function () { done("Copied"); }, function () { done("Copy failed"); });
    }
  });

  document.getElementById("saveBtn").addEventListener("click", function () {
    if (!currentCity) return;
    saveCurrentCheck();
    renderSteps(currentCity);
    renderReminderUI();
    renderSaved();
    savedSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("remindSetBtn").addEventListener("click", function () {
    if (!currentCity) return;
    var dateInput = document.getElementById("remindDate");
    var date = dateInput.value;
    if (!date) { dateInput.focus(); return; }
    var c = saveCurrentCheck();
    if (!c) return;
    var rems = getReminders();
    rems[c.id] = { date: date, label: currentView(currentCity).permit.name + " renewal" };
    saveJSON("staylegal.reminders", rems);
    renderReminderUI();
    renderSaved();
  });

  /* ---------- compare cities (B5) ---------- */
  function limitValue(city, re) {
    var found = null;
    (city.limits || []).forEach(function (r) { if (!found && re.test(r.label)) found = r.value; });
    return found || "See city guide";
  }

  function initCompare() {
    var a = document.getElementById("cmpA"), b = document.getElementById("cmpB"), c = document.getElementById("cmpC");
    if (!a || !b || !c) return;
    var selects = [a, b, c];
    var defaults = ["los-angeles-ca", "new-york-ny", ""];
    selects.forEach(function (sel, i) {
      sel.innerHTML = "";
      if (i === 2) {
        var none = document.createElement("option");
        none.value = ""; none.textContent = "Pick a third (optional)";
        sel.appendChild(none);
      }
      DATA.cities.forEach(function (city) {
        var o = document.createElement("option");
        o.value = city.id; o.textContent = city.city + ", " + city.state;
        if (city.id === defaults[i]) o.selected = true;
        sel.appendChild(o);
      });
    });
    document.getElementById("cmpBtn").addEventListener("click", renderCompare);
  }

  function renderCompare() {
    var out = document.getElementById("cmpOut");
    out.innerHTML = "";
    var ids = ["cmpA", "cmpB", "cmpC"].map(function (id) { return document.getElementById(id).value; })
      .filter(Boolean);
    var seen = [];
    ids.forEach(function (id) { if (seen.indexOf(id) === -1) seen.push(id); });
    if (seen.length < 2) {
      var p = document.createElement("p"); p.className = "empty";
      p.textContent = "Pick at least two different cities to compare.";
      out.appendChild(p);
      return;
    }
    var cities = [];
    seen.forEach(function (id) {
      DATA.cities.forEach(function (c) { if (c.id === id) cities.push(c); });
    });
    var table = document.createElement("table");
    table.className = "cmp";
    var head = document.createElement("tr");
    head.appendChild(document.createElement("th"));
    cities.forEach(function (c) {
      var th = document.createElement("th");
      var link = document.createElement("a");
      link.href = "cities/" + c.id + "/";
      link.textContent = c.city + ", " + c.state;
      th.appendChild(link);
      head.appendChild(th);
    });
    table.appendChild(head);
    var rows = [
      { label: "Verdict", fn: function (c) {
        var v = verdictKey(c.verdict);
        return { pill: true, cls: v, text: VERDICTS[v].short };
      } },
      { label: "Permit", fn: function (c) { return c.permit.name; } },
      { label: "Permit cost", fn: function (c) { return c.permit.cost; } },
      { label: "Renewal", fn: function (c) { return c.permit.renewal; } },
      { label: "Night cap", fn: function (c) { return limitValue(c, /night cap/i); } },
      { label: "Primary residence", fn: function (c) { return limitValue(c, /primary residence|owner.?occup/i); } },
      { label: "Top tax", fn: function (c) { return (c.taxes && c.taxes[0]) ? c.taxes[0].value : "See city guide"; } }
    ];
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      var th = document.createElement("th"); th.textContent = r.label;
      tr.appendChild(th);
      cities.forEach(function (c) {
        var td = document.createElement("td");
        var val = r.fn(c);
        if (val && val.pill) {
          var pill = document.createElement("span");
          pill.className = "pill " + val.cls;
          pill.textContent = val.text;
          td.appendChild(pill);
        } else {
          td.textContent = val;
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    out.appendChild(table);
  }

  /* ---------- HOA red-flag triage (B8) ---------- */
  var HOA_QUESTIONS = [
    {
      id: "h1",
      q: "Do your CC&Rs, deed, or bylaws mention rentals under 30 days, transient use, or short stays?",
      answers: {
        yes: { flag: true, t: "Red flag: possible rental restriction.", d: "Pull the CC&Rs or bylaws, article on use restrictions. Search: 'transient', 'short-term', '30 days', 'lease'." },
        no: { flag: false, t: "No mention found.", d: "Good sign, but keep reading: bans sometimes hide in 'commercial use' or 'nuisance' clauses." },
        unsure: { flag: false, t: "Not sure yet.", d: "Pull the resale package or CC&Rs from your title company or HOA portal and search the same phrases." }
      }
    },
    {
      id: "h2",
      q: "Does your building require board approval for any lease or guest stay?",
      answers: {
        yes: { flag: true, t: "Red flag: board approval needed.", d: "Pull the lease and guest approval section. Ask the board in writing whether short stays need approval, and keep the reply." },
        no: { flag: false, t: "No board approval needed.", d: "One less hurdle. The CC&Rs answer still rules." },
        unsure: { flag: false, t: "Not sure yet.", d: "Ask the property manager or board secretary where lease approvals are documented." }
      }
    },
    {
      id: "h3",
      q: "Does your city require an HOA approval letter as part of the STR permit application?",
      answers: {
        yes: { flag: true, t: "Red flag: extra paperwork.", d: "Pull the permit application checklist from the city site. Get the HOA letter before you pay the permit fee, since some fees are non-refundable." },
        no: { flag: false, t: "No HOA letter required.", d: "One less document to chase." },
        unsure: { flag: false, t: "Not sure yet.", d: "Check the permit application on the city site. It lists every required attachment." }
      }
    }
  ];

  function hoaAnswers() {
    return loadJSON(hoaKey(currentCity), {});
  }

  function renderHoa() {
    var box = document.getElementById("hoaQuestions");
    if (!box) return;
    box.innerHTML = "";
    var answers = hoaAnswers();
    HOA_QUESTIONS.forEach(function (item) {
      var qd = document.createElement("div");
      qd.className = "hoa-q";
      var qt = document.createElement("div");
      qt.className = "qt";
      qt.textContent = item.q;
      qd.appendChild(qt);
      var ab = document.createElement("div");
      ab.className = "hoa-a";
      [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]].forEach(function (pair) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = pair[1];
        b.setAttribute("aria-pressed", answers[item.id] === pair[0] ? "true" : "false");
        b.addEventListener("click", function () {
          var a = hoaAnswers();
          if (a[item.id] === pair[0]) delete a[item.id];
          else a[item.id] = pair[0];
          saveJSON(hoaKey(currentCity), a);
          renderHoa();
        });
        ab.appendChild(b);
      });
      qd.appendChild(ab);
      box.appendChild(qd);
    });
    renderHoaOutcome();
  }

  function renderHoaOutcome() {
    var out = document.getElementById("hoaOutcome");
    if (!out) return;
    out.innerHTML = "";
    var answers = hoaAnswers();
    var flags = 0, answered = 0;
    HOA_QUESTIONS.forEach(function (item) {
      var a = answers[item.id];
      if (!a) return;
      answered++;
      var res = item.answers[a];
      var div = document.createElement("div");
      div.className = res.flag ? "hoa-flag" : "hoa-note";
      var t = document.createElement(res.flag ? "strong" : "span");
      t.textContent = res.t;
      div.appendChild(t);
      div.appendChild(document.createTextNode(" "));
      var d = document.createElement("div");
      d.textContent = res.d;
      div.appendChild(d);
      out.appendChild(div);
      if (res.flag) flags++;
    });
    if (!answered) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Answer above to get your document pull list.";
      out.appendChild(p);
    } else if (flags === 0) {
      var ok = document.createElement("div");
      ok.className = "hoa-note";
      ok.textContent = "No red flags from your answers. The CC&Rs still get the final word: read the use-restriction article end to end before you buy.";
      out.appendChild(ok);
    }
  }

  /* ---------- unknown-city request capture (B4) ---------- */
  function initRequestForm() {
    var requestForm = document.getElementById("requestForm");
    if (!requestForm) return;
    requestForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var cityField = document.getElementById("reqCity");
      var city = cityField.value.trim();
      if (!city) { cityField.focus(); return; }
      var reqs = loadJSON("staylegal.requests", []);
      reqs.push({
        city: city,
        state: document.getElementById("reqState").value.trim(),
        email: document.getElementById("reqEmail").value.trim(),
        at: Date.now()
      });
      if (saveJSON("staylegal.requests", reqs)) {
        requestForm.reset();
        document.getElementById("reqOk").classList.remove("hidden");
      }
    });
    document.getElementById("reqExportBtn").addEventListener("click", function () {
      var reqs = loadJSON("staylegal.requests", []);
      var blob = new Blob([JSON.stringify(reqs, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "staylegal-city-requests.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { URL.revokeObjectURL(a.href); } catch (e) {}
        a.remove();
      }, 500);
    });
  }

  /* ---------- search ---------- */
  function doCheck(address) {
    var city = matchCity(address);
    if (city) renderCity(city, address);
    else renderUnknown(address);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) {
      input.focus();
      input.setAttribute("placeholder", "Type an address first, e.g. 123 Main St, Austin, TX");
      return;
    }
    doCheck(v);
  });

  /* ---------- demo chips ---------- */
  var demoBox = document.getElementById("demoChips");
  (DATA.demoAddresses || []).forEach(function (d) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = d.label;
    b.addEventListener("click", function () {
      input.value = d.address;
      doCheck(d.address);
    });
    demoBox.appendChild(b);
  });

  migrateStorage();
  renderSaved();
  initCompare();
  initRequestForm();
  renderHoa();
  checkDueReminders();

  /* deep link: #/check/<city-id>?address=... */
  function applyDeepLink() {
    var h = location.hash || "";
    var m = h.match(/^#\/check\/([^?]+)(?:\?(.*))?$/);
    if (!m) return false;
    var cityId;
    try { cityId = decodeURIComponent(m[1]); } catch (e) { return false; }
    var city = DATA.cities.find(function (c) { return c.id === cityId; });
    if (!city) return false;
    var addr = new URLSearchParams(m[2] || "").get("address") || "";
    addr = addr.trim();
    var matched = matchCity(addr);
    var warning = "";
    if (matched && matched.id !== city.id) {
      warning = "Heads up: this link pairs an address that matches " + matched.city +
        " with a saved verdict for " + city.city + ". We re-checked below.";
      city = matched;
    }
    input.value = addr;
    setPerspective("investor", false);
    renderCity(city, addr, warning);
    return true;
  }
  applyDeepLink();
  window.addEventListener("hashchange", applyDeepLink);

})();
