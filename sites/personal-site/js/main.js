/* Personal site: theme toggle + scroll reveal */
(function () {
  "use strict";

  var root = document.documentElement;

  // Theme: stored preference wins, else system, default light
  function currentTheme() {
    try {
      var saved = localStorage.getItem("luke-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) { /* storage unavailable */ }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#121110" : "#faf8f5");
    try { localStorage.setItem("luke-theme", t); } catch (e) { /* ignore */ }
  }
  applyTheme(currentTheme());

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  // Scroll reveal
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("visible"); });
  }
})();
