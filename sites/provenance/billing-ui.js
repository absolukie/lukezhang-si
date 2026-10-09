/* Shared billing UI for Luke's apps. Vanilla JS, no dependencies.
 *
 * One include per app:
 *   <script src="billing-ui.js"></script>
 *   <script>
 *     function hookSettings(b){   // attach in BOTH boot paths below
 *       document.getElementById("settingsBtn").addEventListener("click",
 *         function(){ setTimeout(function(){ b.injectSettings(); }, 0); });
 *     }
 *     var PLANS = [
 *       { lookupKey: "price_curbside_solo", name: "Solo", price: "$50/mo",
 *         blurb: "1 truck: permits, spots, commissary, events, revenue." },
 *       { lookupKey: "price_curbside_fleet", name: "Fleet", price: "$80/mo",
 *         blurb: "2 to 3 trucks, one login: per-truck compliance plus combined revenue." },
 *     ];
 *     initBilling({ appSlug: "curbside", plans: PLANS }).then(function(b){
 *       window.__billing = b;
 *       b.ensurePaywall();          // overlay when not entitled
 *       hookSettings(b);
 *     }).catch(function(){
 *       // Billing must never break the app. Fail open with a status-less
 *       // client so Settings > Subscription still renders; its trial button
 *       // re-probes billing, so the retry works in both failure modes.
 *       var b2 = new BillingClient({ appSlug: "curbside", plans: PLANS });
 *       window.__billing = b2;
 *       hookSettings(b2);
 *     });
 *   </script>
 *
 * If `plans` is omitted, they are fetched from GET /v1/billing/plans.
 * Identity reuses the sync system's key: <slug>.session_token if signed in,
 * else <slug>.device_key (registered on demand). Billing user_key is
 * "user:<id>" or "dev:<device_key>", matching the backend.
 *
 * Theming: override these CSS vars in the app to match its style:
 *   --bill-accent, --bill-bg, --bill-text, --bill-muted, --bill-line
 *
 * Until STRIPE_SECRET_KEY is set on the Worker, /v1/billing/* returns
 * billing_not_configured and this module treats everyone as entitled
 * (billing inert). That keeps apps shippable before secrets exist.
 */
(function(){
"use strict";

var DEFAULT_BACKEND = "https://sync-proto.lukezhang.si";
var PENDING_PLAN_KEY = ".billing.pending_plan.v1";

function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }

/* Fetch with a hard timeout. Without this, a stalled network (e.g. a proxy
 * hanging the POST) leaves the trial CTA disabled forever with no feedback.
 * Aborts surface as normal errors through the existing catch paths (fail open
 * / friendly message). Canonical: merged from the roadwrench/fineprint passes. */
function fetchWithTimeout(url, opts, ms) {
  ms = ms || 15000;
  try {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      var o2 = {};
      for (var k in opts) o2[k] = opts[k];
      o2.signal = AbortSignal.timeout(ms);
      return fetch(url, o2);
    }
    if (typeof AbortController !== "undefined") {
      var ctrl = new AbortController();
      var timer = setTimeout(function(){ try { ctrl.abort(); } catch(e){} }, ms);
      var o3 = {};
      for (var k2 in opts) o3[k2] = opts[k2];
      o3.signal = ctrl.signal;
      var pr = fetch(url, o3);
      if (pr && pr.then) pr.then(function(){ clearTimeout(timer); }, function(){ clearTimeout(timer); });
      return pr;
    }
  } catch(e){}
  return fetch(url, opts);
}

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

var ICONS = {
  lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  card: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  warn: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 17H2z"/><path d="M12 10v4M12 17.5v.5"/></svg>'
};

var CSS = [
".bill-banner{position:fixed;top:0;left:0;right:0;z-index:9000;display:flex;align-items:center;gap:10px;",
" padding:10px 14px;font-size:14px;line-height:1.35;background:var(--bill-accent,#B73220);color:#fff;",
" box-shadow:0 2px 10px rgba(0,0,0,.18);}",
".bill-banner.warn{background:#8a5a00;}",
".bill-banner .bill-bmsg{flex:1;min-width:0;}",
".bill-banner button{flex:none;border:none;border-radius:999px;padding:8px 16px;min-height:44px;font-size:14px;font-weight:700;",
" background:#fff;color:#23201B;touch-action:manipulation;cursor:pointer;}",
".bill-banner .bill-bx{background:transparent;color:#fff;padding:8px 12px;min-height:44px;font-size:16px;}",
".bill-banner .bill-berr{flex:1 1 100%;font-size:13px;font-weight:600;}",
".bill-overlay{position:fixed;inset:0;z-index:9500;display:flex;align-items:flex-start;justify-content:center;",
" overflow-y:auto;background:var(--bill-scrim,rgba(24,19,12,.62));padding:24px 16px;}",
".bill-overlay[hidden]{display:none;}",
".bill-card{width:100%;max-width:520px;background:var(--bill-bg,#FFFDF7);color:var(--bill-text,#23201B);",
" border-radius:20px;padding:28px 24px;margin:auto;box-shadow:0 18px 60px rgba(0,0,0,.35);}",
".bill-eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;color:var(--bill-accent,#B73220);margin-bottom:8px;}",
".bill-card h2{font-size:24px;margin:0 0 8px;letter-spacing:-.01em;}",
".bill-sub{font-size:15px;color:var(--bill-muted,#6b6257);margin:0 0 18px;}",
".bill-plans{display:grid;gap:12px;margin-bottom:14px;}",
".bill-plan{border:2px solid var(--bill-line,#EADFC8);border-radius:14px;padding:16px;text-align:left;",
" background:transparent;width:100%;touch-action:manipulation;cursor:pointer;font-size:16px;color:inherit;}",
".bill-plan:hover{border-color:var(--bill-accent,#B73220);}",
".bill-plan.sel{border-color:var(--bill-accent,#B73220);background:color-mix(in srgb,var(--bill-accent,#B73220) 6%,transparent);}",
".bill-plan .bp-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:4px;}",
".bill-plan .bp-name{font-weight:800;font-size:17px;}",
".bill-plan .bp-price{font-weight:800;font-size:17px;color:var(--bill-accent,#B73220);white-space:nowrap;}",
".bill-plan .bp-blurb{font-size:14px;color:var(--bill-muted,#6b6257);}",
".bill-cta{width:100%;border:none;border-radius:999px;padding:15px;font-size:17px;font-weight:800;",
" background:var(--bill-accent,#B73220);color:#fff;touch-action:manipulation;cursor:pointer;margin-top:4px;}",
".bill-cta:active{transform:scale(.98);}",
".bill-cta[disabled]{opacity:.6;}",
".bill-fine{font-size:13px;color:var(--bill-muted,#6b6257);text-align:center;margin:12px 0 0;}",
".bill-linkrow{text-align:center;margin-top:10px;}",
".bill-link{background:none;border:none;color:var(--bill-muted,#6b6257);font-size:14px;text-decoration:underline;",
" touch-action:manipulation;cursor:pointer;padding:8px;}",
".bill-err{background:#fdeceb;color:#8f1d0e;border-radius:10px;padding:10px 12px;font-size:14px;margin-bottom:12px;}",
".bill-err[hidden]{display:none;}",
".bill-set{border-top:1px solid var(--bill-line,#EADFC8);margin-top:14px;padding-top:14px;}",
".bill-set .bs-row{display:flex;align-items:center;gap:10px;font-size:15px;margin-bottom:10px;}",
".bill-set .bs-row .grow{flex:1;}",
".bill-set .bs-btn{border:2px solid var(--bill-line,#EADFC8);background:transparent;border-radius:999px;",
" padding:10px 18px;font-size:15px;font-weight:700;touch-action:manipulation;cursor:pointer;color:inherit;}",
".bill-set input{font-size:16px;}",
"@media (max-width:420px){.bill-card{padding:22px 18px;}.bill-card h2{font-size:21px;}}"
].join("\n");

var cssInjected = false;
function injectCSS(){
  if (cssInjected) return;
  cssInjected = true;
  var s = document.createElement("style");
  s.setAttribute("data-billing", "1");
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ---------------- client ---------------- */

function BillingClient(opts){
  opts = opts || {};
  this.appSlug = opts.appSlug;
  this.backend = String(opts.backendBase || DEFAULT_BACKEND).replace(/\/+$/, "");
  this.plans = opts.plans || null;
  this.trialDays = opts.trialDays || 14;
  this.auth = null;
  this.status = null;
  this.entitled = true;      // fail open until the backend answers
  this.trialUsed = false;
  this.unconfigured = false;
  this._banner = null;
  this._overlay = null;
  this._selPlan = 0;
}

BillingClient.prototype.api = async function(path, opts){
  opts = opts || {};
  var headers = { "authorization": this.auth };
  var body;
  if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  var res = await fetchWithTimeout(this.backend + path, {
    method: opts.method || "GET", headers: headers, body: body
  });
  var data = null;
  try { data = await res.json(); } catch(e){}
  if (!res.ok || (data && data.ok === false)) {
    var code = (data && data.code) || "";
    var msg = (data && data.error) || ("http " + res.status);
    if (/billing_not_configured/.test(msg)) {
      var e1 = new Error(msg); e1.code = "BILLING_NOT_CONFIGURED"; throw e1;
    }
    var e2 = new Error(msg); e2.code = code; e2.status = res.status; throw e2;
  }
  return data;
};

BillingClient.prototype.ensureIdentity = async function(){
  var sess = lsGet(this.appSlug + ".session_token");
  if (sess) { this.auth = "Bearer " + sess; return; }
  var dk = lsGet(this.appSlug + ".device_key");
  if (!dk) {
    var res = await fetchWithTimeout(this.backend + "/v1/devices", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ app_slug: this.appSlug })
    });
    var d = await res.json().catch(function(){ return {}; });
    if (!res.ok || !d.device_key) throw new Error("could not register device");
    dk = d.device_key;
    lsSet(this.appSlug + ".device_key", dk);
  }
  this.auth = "Bearer " + dk;
};

BillingClient.prototype.refresh = async function(){
  try {
    var s = await this.api("/v1/billing/status?app_slug=" + encodeURIComponent(this.appSlug));
    this.status = s;
    this.unconfigured = false;
    this.entitled = (s.state === "trialing" || s.state === "active" || s.state === "past_due");
    this.trialUsed = !!s.trial_used;
  } catch(e) {
    if (e && e.code === "BILLING_NOT_CONFIGURED") {
      // Billing inert until secrets are set: everyone is entitled.
      this.unconfigured = true;
      this.entitled = true;
      this.status = { state: "unconfigured" };
    } else {
      throw e;
    }
  }
  this.renderBanner();
  /* P1-1 (red2): every billing-state change re-renders the paywall. The old
   * code only hid the overlay when entitled, so after a mid-session "Refresh
   * status" flipped trialUsed to true, the stale fail-open overlay kept its
   * X and the expired-trial block could be dismissed. */
  this.ensurePaywall();
  return this.status;
};

BillingClient.prototype.isEntitled = function(){ return this.entitled; };

BillingClient.prototype.daysLeft = function(){
  if (!this.status || !this.status.trial_ends_at) return 0;
  return Math.max(0, Math.ceil((this.status.trial_ends_at - Date.now()) / 86400000));
};

/* ---------------- trial / card / portal ---------------- */

// Invisible Cloudflare Turnstile, active only when the app sets
// window.__BILLING_TURNSTILE_SITEKEY (Curbside reads it from a
// <meta name="turnstile-sitekey"> tag; other apps add one line when wiring
// billing). No key configured -> resolves "" and the trial proceeds without
// it. Never hangs the trial: 15s cap, then proceeds tokenless.
BillingClient.prototype.turnstileToken = function(){
  var sitekey = (typeof window !== "undefined" && window.__BILLING_TURNSTILE_SITEKEY) || "";
  if (!sitekey) return Promise.resolve("");
  return new Promise(function(resolve){
    var done = false;
    function finish(t){ if (!done) { done = true; resolve(t || ""); } }
    function run(){
      try {
        var host = document.createElement("div");
        host.setAttribute("aria-hidden", "true");
        host.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;";
        document.body.appendChild(host);
        var wid = window.turnstile.render(host, {
          sitekey: sitekey,
          size: "invisible",
          callback: function(tok){ try { host.remove(); } catch(e){} finish(tok); },
          "error-callback": function(){ try { host.remove(); } catch(e){} finish(""); }
        });
        window.turnstile.execute(wid);
      } catch(e){ finish(""); }
    }
    function load(){
      if (window.turnstile && window.turnstile.render) { run(); return; }
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true; s.defer = true;
      s.onload = run;
      s.onerror = function(){ finish(""); };
      document.head.appendChild(s);
    }
    setTimeout(function(){ finish(""); }, 15000);
    try { load(); } catch(e){ finish(""); }
  });
};

BillingClient.prototype.startTrial = async function(lookupKey){
  var body = { app_slug: this.appSlug, price_lookup_key: lookupKey };
  var tsToken = await this.turnstileToken().catch(function(){ return ""; });
  if (tsToken) body.turnstile_token = tsToken;
  var r = await this.api("/v1/billing/start-trial", {
    method: "POST",
    body: body
  }).catch(async function(e){
    if (e && e.code === "NEEDS_CARD") {
      lsSet(this.appSlug + PENDING_PLAN_KEY, lookupKey);
      await this.setupCard();
      return null; // redirecting to Stripe
    }
    throw e;
  }.bind(this));
  if (!r) return null;
  await this.refresh();
  this.hidePaywall();
  return r;
};

BillingClient.prototype.setupCard = async function(){
  var returnUrl = location.origin + location.pathname + "?billing=card_added";
  var r = await this.api("/v1/billing/setup-card", {
    method: "POST",
    body: { app_slug: this.appSlug, return_url: returnUrl }
  });
  location.href = r.url;
  return null;
};

BillingClient.prototype.portal = async function(){
  var returnUrl = location.origin + location.pathname;
  var r = await this.api("/v1/billing/portal", {
    method: "POST",
    body: { app_slug: this.appSlug, return_url: returnUrl }
  });
  location.href = r.url;
  return null;
};

BillingClient.prototype.checkoutOnce = async function(lookupKey){
  var returnUrl = location.origin + location.pathname;
  var r = await this.api("/v1/billing/checkout-once", {
    method: "POST",
    body: { app_slug: this.appSlug, price_lookup_key: lookupKey, return_url: returnUrl }
  });
  location.href = r.url;
  return null;
};

/* ---------------- banner ---------------- */

BillingClient.prototype.renderBanner = function(){
  if (this._banner) { this._banner.remove(); this._banner = null; }
  if (this.unconfigured || !this.status) return;
  var st = this.status.state, html = null, warn = false;
  if (st === "trialing") {
    var d = this.daysLeft();
    html = ICONS.clock + '<span class="bill-bmsg">' + esc(d) +
      (d === 1 ? " day" : " days") +
      ' left in your free trial. Add a card so nothing interrupts your work.</span>';
  } else if (st === "past_due") {
    warn = true;
    html = ICONS.warn + '<span class="bill-bmsg">Your last payment failed. ' +
      'Update your card to keep your subscription active.</span>';
  }
  if (!html) return;
  var self = this;
  var bar = document.createElement("div");
  bar.className = "bill-banner" + (warn ? " warn" : "");
  bar.setAttribute("role", "status");
  bar.innerHTML = html;
  var btn = document.createElement("button");
  btn.textContent = st === "past_due" ? "Update card" : "Add card";
  // Default-deny: nothing a backend, network, or SDK hands us reaches the
  // banner. One generic line for every failure, whatever the cause (the old
  // blocklist let novel backend strings render raw).
  function bannerFriendlyErr(e){
    return "Something went wrong. Please try again.";
  }
  btn.onclick = function(){
    if (btn.disabled) return;
    btn.disabled = true;
    self.setupCard().then(function(){ btn.disabled = false; }, function(e){
      btn.disabled = false;
      if (!bar.querySelector(".bill-berr")) {
        var em = document.createElement("span");
        em.className = "bill-berr";
        em.setAttribute("role", "alert");
        em.textContent = bannerFriendlyErr(e);
        bar.appendChild(em);
      }
    });
  };
  bar.appendChild(btn);
  document.body.appendChild(bar);
  this._banner = bar;
};

/* ---------------- paywall overlay ---------------- */

BillingClient.prototype.buildOverlay = function(){
  var self = this;
  var plans = this.plans || [];
  var ov = document.createElement("div");
  ov.className = "bill-overlay";
  ov.setAttribute("hidden", "");
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Subscription required");

  var trialCta = this.trialUsed ? "Subscribe" : "Start my free trial";
  var head = this.trialUsed
    ? "Your trial has ended"
    : "Start your free " + esc(String(this.trialDays)) + "-day trial";
  var sub = this.trialUsed
    ? "Pick a plan to keep going. Your data is right where you left it."
    : "Full access, no credit card required. Cancel anytime.";

  var plansHtml = plans.map(function(p, i){
    return '<button class="bill-plan' + (i === 0 ? " sel" : "") + '" data-i="' + i + '">' +
      '<span class="bp-top"><span class="bp-name">' + esc(p.name) + '</span>' +
      '<span class="bp-price">' + esc(p.price) + "</span></span>" +
      '<span class="bp-blurb">' + esc(p.blurb) + "</span></button>";
  }).join("");

  ov.innerHTML =
    '<div class="bill-card">' +
      '<div class="bill-eyebrow">' + esc(this.appSlug.toUpperCase()) + "</div>" +
      "<h2>" + head + "</h2>" +
      '<p class="bill-sub">' + sub + "</p>" +
      '<div class="bill-err" hidden></div>' +
      '<div class="bill-plans">' + plansHtml + "</div>" +
      '<button class="bill-cta">' + esc(trialCta) + "</button>" +
      '<p class="bill-fine">After your trial, billing starts automatically only if you add a card. ' +
      "30-day money-back guarantee.</p>" +
      '<div class="bill-linkrow"><button class="bill-link">Already subscribed? Refresh status</button></div>' +
    "</div>";

  var errBox = ov.querySelector(".bill-err");
  function showErr(m){ errBox.textContent = m; errBox.hidden = false; }
  /* Default-deny: nothing a backend, network, or SDK hands us reaches the
   * screen. One generic line for every failure, whatever the cause. (The old
   * blocklist let novel backend strings, like account refs, render raw.) */
  function friendlyErr(e){
    var code = e && e.code;
    if (code === "BILLING_NOT_CONFIGURED") return "Payments are not switched on yet. Please check back soon.";
    return "Something went wrong. Please try again.";
  }
  ov.querySelectorAll(".bill-plan").forEach(function(b){
    b.addEventListener("click", function(){
      ov.querySelectorAll(".bill-plan").forEach(function(x){ x.classList.remove("sel"); });
      b.classList.add("sel");
      self._selPlan = +b.getAttribute("data-i");
    });
  });
  ov.querySelector(".bill-cta").addEventListener("click", async function(ev){
    var btn = ev.currentTarget;
    btn.disabled = true;
    errBox.hidden = true;
    try {
      var p = plans[self._selPlan] || plans[0];
      if (!p) { showErr("No plans configured yet."); btn.disabled = false; return; }
      await self.startTrial(p.lookupKey);
    } catch(e) {
      showErr(friendlyErr(e));
      btn.disabled = false;
    }
  });
  ov.querySelector(".bill-link").addEventListener("click", async function(ev){
    var link = ev.currentTarget; // currentTarget nulls after await; capture now
    link.textContent = "Checking...";
    try {
      await self.refresh();
      if (self.entitled) self.hidePaywall();
      else link.textContent = "Still no active subscription";
    } catch(e) {
      link.textContent = "Could not reach billing. Try again.";
    }
  });
  // The overlay is a fixed full-screen layer above the app, so nothing
  // behind it can receive clicks. No stopPropagation needed here: one on the
  // overlay itself would also swallow clicks on the plan cards and CTA.
  document.body.appendChild(ov);
  this._overlay = ov;
  return ov;
};

BillingClient.prototype.ensurePaywall = function(){
  if (this.entitled || this.unconfigured) { this.hidePaywall(); return; }
  if (!this._overlay) this.buildOverlay();
  this._overlay.hidden = false;
};

BillingClient.prototype.hidePaywall = function(){
  if (this._overlay) this._overlay.hidden = true;
};

/* ---------------- settings section ---------------- */

BillingClient.prototype.settingsHTML = function(){
  if (this.unconfigured) return "";
  var st = this.status ? this.status.state : "none";
  var line;
  if (st === "trialing") {
    var d = this.daysLeft();
    line = "Free trial: " + d + (d === 1 ? " day" : " days") + " left";
  } else if (st === "active") {
    line = "Subscribed" + (this.status.plan && this.status.plan.name ? ": " + this.status.plan.name : "");
  } else if (st === "past_due") {
    line = "Payment failed: update your card";
  } else if (this.trialUsed) {
    line = "No active subscription";
  } else {
    line = "Free trial available";
  }
  var btn = (st === "trialing" || st === "past_due")
    ? '<button class="bs-btn" data-act="card">' + ICONS.card + ' Add card</button>'
    : (st === "active"
      ? '<button class="bs-btn" data-act="portal">Manage subscription</button>'
      : '<button class="bs-btn" data-act="trial">Start free trial</button>');
  return '<div class="bill-set" data-bill-settings>' +
    '<div class="bs-row"><span class="grow"><strong>Subscription</strong><br>' +
    '<span style="color:var(--bill-muted,#6b6257);font-size:14px;">' + esc(line) + "</span></span>" +
    btn + "</div></div>";
};

BillingClient.prototype.bindSettings = function(root){
  var self = this;
  root.querySelectorAll("[data-act]").forEach(function(b){
    b.addEventListener("click", function(){
      var act = b.getAttribute("data-act");
      var pr = null;
      if (act === "portal") pr = self.portal();
      else if (act === "card") pr = self.setupCard();
      else if (act === "trial") {
        /* P2-2 (red2): the settings trial button re-probes billing before
         * showing the overlay, so it works as a retry in every failure mode
         * (including billing status failing at boot, where a status-less
         * fail-open client renders the section). Failure is reported honestly
         * in the section line instead of failing silently. */
        var rowEl = b.closest ? b.closest(".bs-row") : null;
        var lineEl = rowEl ? rowEl.querySelector(".grow span") : null;
        var prevLine = lineEl ? lineEl.textContent : "";
        if (lineEl) lineEl.textContent = "Checking billing" + "\u2026";
        self.refresh().then(function(){
          if (lineEl) lineEl.textContent = prevLine;
          self.ensurePaywall();
        }, function(){
          if (lineEl) lineEl.textContent = "Could not reach billing. Try again.";
        });
        return;
      }
      // A dead backend must not surface as an unhandled rejection: show a
      // brief honest line on the button itself, then restore it.
      if (pr && pr.catch) pr.catch(function(){
        var old = b.innerHTML;
        b.textContent = "Could not reach billing";
        setTimeout(function(){ try { b.innerHTML = old; } catch(e){} }, 4000);
      });
    });
  });
};

BillingClient.prototype.injectSettings = function(){
  var sheet = document.getElementById("sheet");
  if (!sheet || sheet.querySelector("[data-bill-settings]")) return;
  var html = this.settingsHTML();
  if (!html) return;
  var div = document.createElement("div");
  div.innerHTML = html;
  sheet.appendChild(div.firstChild);
  this.bindSettings(sheet);
};

/* ---------------- entry ---------------- */

window.initBilling = async function(opts){
  opts = opts || {};
  if (!opts.appSlug) throw new Error("initBilling: appSlug required");
  injectCSS();
  var c = new BillingClient(opts);
  await c.ensureIdentity();
  if (!c.plans) {
    try {
      var p = await c.api("/v1/billing/plans?app_slug=" + encodeURIComponent(c.appSlug));
      c.plans = p.plans || [];
      c.trialDays = p.trial_days || 14;
    } catch(e){ c.plans = []; }
  }
  await c.refresh();

  // Returning from Stripe card setup: activate the pending subscription.
  var q = null;
  try { q = new URLSearchParams(location.search); } catch(e){}
  if (q && q.get("billing") === "card_added") {
    var pending = lsGet(c.appSlug + PENDING_PLAN_KEY);
    try { history.replaceState(null, "", location.pathname + location.hash); } catch(e){}
    if (pending && !c.entitled) {
      lsDel(c.appSlug + PENDING_PLAN_KEY);
      try { await c.startTrial(pending); } catch(e2){}
    } else {
      await c.refresh().catch(function(){});
    }
  }
  // One-time purchase return (FinePrint): just refresh, the app decides.
  if (q && q.get("billing") === "paid") {
    try { history.replaceState(null, "", location.pathname + location.hash); } catch(e){}
  }
  return c;
};

window.BillingClient = BillingClient;
})();
