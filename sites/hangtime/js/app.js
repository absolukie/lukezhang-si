/* Hangtime shell: storage, router, tabs, settings, confetti, sfx, theme */
"use strict";
var HT = window.HT || (window.HT = {});

/* ---------- storage ---------- */
HT.store = {
  get: function (k, fb) {
    try { var v = localStorage.getItem("hangtime:" + k); return v == null ? fb : JSON.parse(v); }
    catch (e) { return fb; }
  },
  set: function (k, v) { try { localStorage.setItem("hangtime:" + k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem("hangtime:" + k); } catch (e) {} },
  clearAll: function () {
    Object.keys(localStorage).filter(function (k) { return k.indexOf("hangtime:") === 0; })
      .forEach(function (k) { localStorage.removeItem(k); });
  }
};

/* ---------- settings ---------- */
HT.settings = Object.assign(
  { sound: true, anim: true, theme: "system" },
  HT.store.get("settings", {})
);
HT.saveSettings = function () { HT.store.set("settings", HT.settings); };
HT.applySettings = function () {
  var t = HT.settings.theme;
  var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.documentElement.setAttribute("data-anim", HT.settings.anim ? "on" : "off");
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#0f0e17" : "#f6f5fb";
};

/* ---------- sound (WebAudio blips, no assets) ---------- */
HT.sfx = (function () {
  var ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(f, d, type, v, when) {
    if (!HT.settings.sound) return;
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = f;
    var t = c.currentTime + (when || 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v || 0.12, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + d + 0.05);
  }
  return {
    tap: function () { tone(520, 0.07, "triangle", 0.06); },
    pick: function () { tone(660, 0.09, "triangle", 0.09); tone(880, 0.1, "triangle", 0.07, 0.06); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, "triangle", 0.1, i * 0.09); }); },
    bad: function () { tone(220, 0.16, "sawtooth", 0.05); },
    level: function () { [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.25, "triangle", 0.09, i * 0.08); }); },
    quest: function () { tone(740, 0.12, "square", 0.04); tone(988, 0.18, "triangle", 0.08, 0.08); }
  };
})();

/* ---------- toast ---------- */
HT.toast = function (msg) {
  var root = document.getElementById("toast-root");
  var el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  root.appendChild(el);
  setTimeout(function () { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 2200);
  setTimeout(function () { el.remove(); }, 2600);
};

/* ---------- confetti (tiny canvas impl, no CDN) ---------- */
HT.confetti = (function () {
  var cv, cx, parts = [], raf = null;
  var COLORS = ["#8b5cf6", "#ef4444", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#fbbf24", "#ffffff"];
  function ensure() {
    if (cv) return;
    cv = document.getElementById("confetti-canvas");
    cx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    window.addEventListener("resize", function () { cv.width = window.innerWidth; cv.height = window.innerHeight; });
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(function (p) { return p.y < cv.height + 20 && p.life > 0; });
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.rot += p.vr; p.life -= 0.006;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      cx.fillStyle = p.c;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx.restore();
    });
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = null; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  return {
    burst: function (n) {
      if (!HT.settings.anim) return;
      ensure();
      n = n || 120;
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.3,
          vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3.5,
          w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
          c: COLORS[(Math.random() * COLORS.length) | 0], life: 1
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }
  };
})();

/* ---------- tiny helpers ---------- */
HT.esc = function (s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};
HT.shuffle = function (a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};
HT.pick = function (a) { return a[(Math.random() * a.length) | 0]; };
HT.today = function () { return new Date().toISOString().slice(0, 10); };
HT.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };

/* ---------- router: tabs + per-tab screen stacks ---------- */
HT.router = (function () {
  var stacks = { home: ["home"], duel: ["duel"], match: ["match"], quests: ["quests"] };
  var current = "home";
  var renderers = {};

  function viewEl(tab) { return document.getElementById("view-" + tab); }

  function render() {
    document.querySelectorAll("#tabbar .tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === current);
    });
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    ["home", "duel", "match", "quests", "settings"].forEach(function (t) {
      var el = document.getElementById("view-" + t);
      if (el) el.classList.remove("active");
    });
    var top = stacks[current][stacks[current].length - 1];
    var fn = renderers[top];
    var el = current === "settings" ? document.getElementById("view-settings") : viewEl(current);
    if (fn && el) { el.innerHTML = ""; fn(el); el.classList.add("active"); }
    window.scrollTo(0, 0);
  }

  return {
    on: function (name, fn) { renderers[name] = fn; },
    go: function (tab, screen) {
      if (tab === "settings") { current = "settings"; stacks.settings = ["settings"]; render(); return; }
      current = tab;
      if (screen) stacks[tab] = [screen]; else if (!stacks[tab]) stacks[tab] = [tab];
      render();
    },
    push: function (screen) { stacks[current].push(screen); render(); },
    back: function () {
      if (stacks[current].length > 1) { stacks[current].pop(); render(); }
      else if (current !== "home") { this.go("home"); }
    },
    replace: function (screen) { stacks[current][stacks[current].length - 1] = screen; render(); },
    refresh: render,
    tab: function () { return current; }
  };
})();

/* ---------- shared UI builders ---------- */
HT.ui = {
  back: function (label) {
    var b = document.createElement("button");
    b.className = "back-link"; b.textContent = "‹ " + (label || "Back");
    b.onclick = function () { HT.sfx.tap(); HT.router.back(); };
    return b;
  },
  empty: function (ico, title, sub, btnLabel, btnFn, btnClass) {
    var d = document.createElement("div");
    d.className = "empty";
    d.innerHTML = '<span class="e-ico">' + ico + "</span><h3>" + HT.esc(title) + "</h3><p class='sub'>" + HT.esc(sub) + "</p>";
    if (btnLabel) {
      var b = document.createElement("button");
      b.className = "btn " + (btnClass || "duel"); b.style.maxWidth = "280px"; b.style.margin = "6px auto 0";
      b.textContent = btnLabel;
      b.onclick = function () { HT.sfx.tap(); btnFn(); };
      d.appendChild(b);
    }
    return d;
  },
  header: function (kicker, title, sub) {
    var d = document.createElement("div");
    d.innerHTML = '<div class="kicker">' + HT.esc(kicker) + "</div><h1>" + HT.esc(title) + "</h1>" +
      (sub ? '<p class="sub">' + HT.esc(sub) + "</p>" : "");
    return d;
  }
};

/* ---------- home ---------- */
HT.router.on("home", function (el) {
  el.appendChild(HT.ui.header("🎉 Hangtime", "Game night, in your pocket.", "Three party games. Zero setup. Pick one and pass the phone."));
  var games = [
    { tab: "duel", cls: "hero-duel", ico: "🎵", name: "Song Duel",
      desc: "Head-to-head song battles, 16-song tournaments, and group voting. Settle the aux debate once and for all." },
    { tab: "match", cls: "hero-match", ico: "💞", name: "How Well Do We Match?",
      desc: "Answer 15 questions separately, then get your extremely unofficial compatibility report. Couples and best friends approved." },
    { tab: "quests", cls: "hero-quest", ico: "🗺️", name: "Random Side Quest",
      desc: "Real life becomes a video game. Roll a mission, earn XP, unlock achievements. Touch grass, gain levels." }
  ];
  games.forEach(function (g) {
    var b = document.createElement("button");
    b.className = "hero-card " + g.cls;
    b.innerHTML = '<span class="hc-ico">' + g.ico + "</span><h2>" + g.name + "</h2><p>" + g.desc + "</p>" +
      '<span class="btn small" style="background:rgba(255,255,255,.2)">Play →</span>';
    b.onclick = function () { HT.sfx.pick(); HT.router.go(g.tab); };
    el.appendChild(b);
  });
  var foot = document.createElement("p");
  foot.className = "sub center"; foot.style.marginTop = "8px";
  foot.textContent = "Good friends. Great games. No accounts, no ads — everything stays on this phone.";
  el.appendChild(foot);
});

/* ---------- settings ---------- */
HT.router.on("settings", function (el) {
  el.appendChild(HT.ui.back("Home"));
  el.appendChild(HT.ui.header("Settings", "Tune the vibes.", ""));
  var card = document.createElement("div"); card.className = "card";

  function row(label, ctrl) {
    var r = document.createElement("div"); r.className = "settings-row";
    var s = document.createElement("span"); s.textContent = label;
    r.appendChild(s); r.appendChild(ctrl); card.appendChild(r);
  }
  function sw(val, fn) {
    var b = document.createElement("button");
    b.className = "switch" + (val ? " on" : ""); b.setAttribute("aria-label", "toggle");
    b.onclick = function () { HT.sfx.tap(); fn(!b.classList.contains("on")); b.classList.toggle("on"); };
    return b;
  }
  row("🔊 Sound effects", sw(HT.settings.sound, function (v) { HT.settings.sound = v; HT.saveSettings(); }));
  row("✨ Animations", sw(HT.settings.anim, function (v) { HT.settings.anim = v; HT.saveSettings(); HT.applySettings(); }));
  var seg = document.createElement("div"); seg.className = "seg";
  ["system", "dark", "light"].forEach(function (t) {
    var b = document.createElement("button");
    b.textContent = t[0].toUpperCase() + t.slice(1);
    if (HT.settings.theme === t) b.classList.add("sel");
    b.onclick = function () { HT.sfx.tap(); HT.settings.theme = t; HT.saveSettings(); HT.applySettings(); HT.router.refresh(); };
    seg.appendChild(b);
  });
  row("🌗 Theme", seg);

  var del = document.createElement("button");
  del.className = "btn ghost danger"; del.style.marginTop = "14px"; del.textContent = "🗑 Reset all local data";
  del.onclick = function () {
    if (confirm("Delete ALL Hangtime data (history, XP, achievements, settings)?")) {
      HT.store.clearAll(); location.reload();
    }
  };
  el.appendChild(card); el.appendChild(del);
  var v = document.createElement("p"); v.className = "sub center mt"; v.textContent = "Hangtime v1.0 — made for game night.";
  el.appendChild(v);
});

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", function () {
  HT.applySettings();
  document.querySelectorAll("#tabbar .tab").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.getAttribute("data-tab") === HT.router.tab()) return;
      HT.sfx.tap(); HT.router.go(b.getAttribute("data-tab"));
    });
  });
  document.getElementById("settings-btn").addEventListener("click", function () {
    HT.sfx.tap(); HT.router.go("settings");
  });
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (HT.settings.theme === "system") HT.applySettings();
    });
  }
  HT.router.go("home");
});
