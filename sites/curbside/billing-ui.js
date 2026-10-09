/* Shared billing UI for Luke's apps. Vanilla JS, no dependencies.
 *
 * One include per app:
 *   <script src="billing-ui.js"></script>
 *   <script>
 *     initBilling({ appSlug: "curbside", plans: [
 *       { lookupKey: "price_curbside_solo", name: "Solo", price: "$50/mo",
 *         blurb: "1 truck: permits, spots, commissary, events, revenue." },
 *       { lookupKey: "price_curbside_fleet", name: "Fleet", price: "$80/mo",
 *         blurb: "2 to 3 trucks, one login: per-truck compliance plus combined revenue." },
 *     ]}).then(function(b){
 *       window.__billing = b;
 *       b.ensurePaywall();          // overlay when not entitled
 *       // settings sheet hook (app-specific; curbside example):
 *       // document.getElementById("settingsBtn").addEventListener("click",
 *       //   function(){ setTimeout(function(){ b.injectSettings(); }, 0); });
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
".bill-banner button{flex:none;border:none;border-radius:999px;padding:8px 16px;font-size:14px;font-weight:700;",
" background:#fff;color:#23201B;touch-action:manipulation;cursor:pointer;}",
".bill-banner .bill-bx{background:transparent;color:#fff;padding:8px;font-size:16px;",
" min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;}",
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
" touch-action:manipulation;cursor:pointer;padding:8px;min-height:44px;display:inline-block;}",
".bill-close{position:absolute;top:10px;right:10px;width:44px;height:44px;border:none;border-radius:12px;",
" background:transparent;color:var(--bill-muted,#6b6257);touch-action:manipulation;cursor:pointer;",
" display:inline-flex;align-items:center;justify-content:center;}",
".bill-close:active{background:rgba(0,0,0,.06);}",
".bill-card{position:relative;}",
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
  var res = await fetch(this.backend + path, {
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
    var res = await fetch(this.backend + "/v1/devices", {
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
  if (this.entitled) this.hidePaywall();
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
  if (this.unconfigured || !this.status || this._bannerGone) return;
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
  btn.onclick = function(){ self.setupCard(); };
  bar.appendChild(btn);
  /* P2-5: the trial banner is dismissable. The X is a real 44px control;
   * dismissal lasts for this page session (the banner re-renders on reload,
   * which is honest since the trial state is still live). */
  var x = document.createElement("button");
  x.className = "bill-bx";
  x.setAttribute("aria-label", "Dismiss trial banner");
  x.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  x.onclick = function(){ self._bannerGone = true; self.renderBanner(); };
  bar.appendChild(x);
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

  /* Fail-open: a billing outage must never lock a new owner out. When the
   * trial was never used (fresh owner, trial could not start), the overlay
   * gets a real dismiss path: an X close control, Escape, and (after a
   * failed trial attempt) a "Continue without trial for now" link. The
   * trial stays retryable from Settings > Subscription. A genuinely expired
   * trial (trialUsed) keeps the blocking paywall per the product rules. */
  var failOpen = !this.trialUsed;

  var trialCta = this.trialUsed ? "Subscribe" : "Start my free trial";
  var head = this.trialUsed
    ? "Your trial has ended"
    : "Start your free " + esc(String(this.trialDays)) + "-day trial";
  var sub = this.trialUsed
    ? "Pick a plan to keep going. Your data is right where you left it, and you can export it any time."
    : "Full access, no credit card required. Cancel anytime.";

  var plansHtml = plans.map(function(p, i){
    return '<button class="bill-plan' + (i === 0 ? " sel" : "") + '" data-i="' + i + '">' +
      '<span class="bp-top"><span class="bp-name">' + esc(p.name) + '</span>' +
      '<span class="bp-price">' + esc(p.price) + "</span></span>" +
      '<span class="bp-blurb">' + esc(p.blurb) + "</span></button>";
  }).join("");

  var canExport = (typeof window.__exportBackup === "function");
  ov.innerHTML =
    '<div class="bill-card">' +
      (failOpen ? '<button class="bill-close" id="billClose" aria-label="Close for now">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : "") +
      '<div class="bill-eyebrow">' + esc(this.appSlug.toUpperCase()) + "</div>" +
      "<h2>" + head + "</h2>" +
      '<p class="bill-sub">' + sub + "</p>" +
      '<div class="bill-err" hidden></div>' +
      '<div class="bill-plans">' + plansHtml + "</div>" +
      '<button class="bill-cta">' + esc(trialCta) + "</button>" +
      (canExport ? '<div class="bill-linkrow"><button class="bill-link" id="billExport">Export my data (JSON)</button></div>' : "") +
      (failOpen ? '<div class="bill-linkrow" id="billDismissRow" hidden><button class="bill-link" id="billDismiss">Continue without trial for now</button></div>' : "") +
      '<p class="bill-fine">After your trial, billing starts automatically only if you add a card. ' +
      "30-day money-back guarantee.</p>" +
      '<div class="bill-linkrow"><button class="bill-link" id="billRefresh">Already subscribed? Refresh status</button></div>' +
    "</div>";

  var errBox = ov.querySelector(".bill-err");
  function showErr(m){ errBox.textContent = m; errBox.hidden = false; }
  // Never show raw backend codes or internal references to users.
  // Anything that does not match is masked as well: backend strings are
  // internal identifiers by default, and only the generic message ships.
  function friendlyErr(e){
    var code = e && e.code;
    if (code === "BILLING_NOT_CONFIGURED") return "Payments are not switched on yet. Please check back soon.";
    var m = (e && e.message) || "";
    if (/billing_|whsec|rk_test|rk_live|sk_test|sk_live|SECRETS\.md|Worker|price.*not found|no such price|unknown plan|lookup|failed to fetch|networkerror|load failed|ERR_|http\s*\d{3}|price_[a-z0-9_]+|device_key|session|bearer|token/i.test(m)) return "Something went wrong. Please try again.";
    return m || "Something went wrong. Please try again.";
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
      if (failOpen) {
        var dr = ov.querySelector("#billDismissRow");
        if (dr) dr.hidden = false;
      }
      btn.disabled = false;
    }
  });
  /* P1-2 fix: the refresh handler used querySelector(".bill-link"), which
   * matched the FIRST link (the export button). It now targets #billRefresh,
   * and the label element is captured before the await (ev.currentTarget is
   * nulled after an await boundary). */
  ov.querySelector("#billRefresh").addEventListener("click", async function(ev){
    var link = ev.currentTarget;
    link.textContent = "Checking...";
    try {
      await self.refresh();
      if (self.entitled) self.hidePaywall();
      else link.textContent = "Still no active subscription";
    } catch(e) {
      link.textContent = "Could not reach billing. Try again.";
    }
  });
  var exBtn = ov.querySelector("#billExport");
  if (exBtn) exBtn.addEventListener("click", function(){
    try { window.__exportBackup(); } catch(e){}
  });
  if (failOpen) {
    var closeBtn = ov.querySelector("#billClose");
    if (closeBtn) closeBtn.addEventListener("click", function(){ self.hidePaywall(); });
    var dismissBtn = ov.querySelector("#billDismiss");
    if (dismissBtn) dismissBtn.addEventListener("click", function(){ self.hidePaywall(); });
    var escHandler = function(e){
      if (e && e.key === "Escape" && !ov.hidden) self.hidePaywall();
    };
    ov._escHandler = escHandler;
    document.addEventListener("keydown", escHandler);
  }
  // The overlay is a fixed full-screen layer above the app, so nothing
  // behind it can receive clicks. No stopPropagation needed here: one on the
  // overlay itself would also swallow clicks on the plan cards and CTA.
  document.body.appendChild(ov);
  this._overlay = ov;
  return ov;
};

/* P2-13 fix: the overlay copy was frozen at build time. If entitlement state
 * changed mid-session (trial used, trial started, expired without a reload),
 * the old overlay is torn down and rebuilt so the headline and CTA always
 * match the current state. */
BillingClient.prototype.ensurePaywall = function(){
  if (this.entitled || this.unconfigured) { this.hidePaywall(); return; }
  var key = (this.trialUsed ? "1" : "0") + "|" + String(this.trialDays);
  if (this._overlay && this._overlayState !== key) {
    try { document.removeEventListener("keydown", this._overlay._escHandler); } catch(e){}
    try { this._overlay.remove(); } catch(e){}
    this._overlay = null;
  }
  if (!this._overlay) { this.buildOverlay(); this._overlayState = key; }
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
      if (act === "portal") self.portal();
      else if (act === "card") self.setupCard();
      else if (act === "trial") { self.ensurePaywall(); }
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
