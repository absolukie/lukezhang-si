/* provenance auth UI - PROTOTYPE.
 * Optional sign-in: email magic link, Sign in with Apple, Sign in with Google, phone OTP.
 * The app works fully without sign-in. Signing in links this device to the
 * user so sync spans all of their devices.
 * Server: https://sync-proto.lukezhang.si (see builds/backend/auth/AUTH.md).
 * Security notes: the session token is a bearer credential. It is stored in
 * localStorage next to the device key, never logged, and never placed in a URL.
 */
(function(){
"use strict";

/* ---- per-app config (generated) ---- */
var SLUG = "provenance";
var HOST_SEL = "#sheet";
var CARD_CLASS = "card";
var APP_COPY = "Provenance works fully without an account. Sign in to sync your items across your devices.";

var WORKER = "https://sync-proto.lukezhang.si";
var LS_DEVICE = SLUG + ".device_key";
var LS_SESSION = SLUG + ".session_token";
var LS_WHO = SLUG + ".user_identity";
var LS_PENDING = SLUG + ".auth_pending";
var HEX64 = /^[0-9a-f]{64}$/i;

function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }
function getDeviceKey(){ return lsGet(LS_DEVICE); }
function getSession(){ return lsGet(LS_SESSION); }
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function esc(s){
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function authFetch(path, opts){
  opts = opts || {};
  var res = await fetch(WORKER + path, {
    method: opts.method || "GET",
    headers: { "content-type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  var data = null;
  try { data = await res.json(); } catch(e){}
  if (!res.ok){
    var err = new Error("auth http " + res.status);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}
async function authedFetch(path, opts){
  opts = opts || {};
  var st = getSession();
  var res = await fetch(WORKER + path, {
    method: opts.method || "GET",
    headers: { "content-type": "application/json",
      "authorization": st ? "Bearer " + st : "" },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  var data = null;
  try { data = await res.json(); } catch(e){}
  if (!res.ok){
    var err = new Error("auth http " + res.status);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

/* ---------- pending magic-link / OAuth code capture (runs at load) ---------- */
(function capturePending(){
  try {
    var q = new URLSearchParams(location.search);
    var magic = q.get("magic") || "";
    var code = q.get("auth_code") || "";
    var p = null;
    if (HEX64.test(magic)) p = { type: "magic", value: magic.toLowerCase() };
    else if (HEX64.test(code)) p = { type: "oauth", value: code.toLowerCase() };
    if (p){
      lsSet(LS_PENDING, JSON.stringify(p));
      try { history.replaceState(null, "", location.pathname + location.hash); }
      catch(e){}
    }
  } catch(e){}
})();

/* Called from the app's sync.js boot() after device registration.
 * hooks.repull(): reset sync cursors so the next pull spans all devices. */
window.__authBoot = async function(hooks){
  var p = null;
  try { p = JSON.parse(lsGet(LS_PENDING) || "null"); } catch(e){}
  if (!p || (p.type !== "magic" && p.type !== "oauth")) return null;
  var dk = getDeviceKey(), tries = 0;
  while (!dk && tries < 40){ await sleep(500); dk = getDeviceKey(); tries++; }
  var res = null, gotHttp = false, claimed = null;
  try {
    if (p.type === "magic"){
      var b = { token: p.value };
      if (dk) b.device_key = dk;
      res = await authFetch("/v1/auth/verify", { method: "POST", body: b });
    } else {
      var b2 = { code: p.value };
      if (dk) b2.device_key = dk;
      res = await authFetch("/v1/auth/oauth/exchange", { method: "POST", body: b2 });
    }
    gotHttp = true;
  } catch(e){
    if (e && e.status) gotHttp = true; /* HTTP error: token is dead, drop it */
  }
  if (gotHttp) lsDel(LS_PENDING);
  if (res && res.ok && res.session_token){
    lsSet(LS_SESSION, res.session_token);
    var who = (res.user && (res.user.email || res.user.phone)) || "";
    if (who) lsSet(LS_WHO, who);
    claimed = res.claimed || null;
    if (claimed === "linked" && hooks && typeof hooks.repull === "function"){
      try { hooks.repull(); } catch(e){}
    }
    if (claimed === "claimed_by_other") cardNote =
      "Note: this device is already linked to another account. Sign-in still works on your other devices.";
  }
  try { paintCard(); } catch(e){}
  try { validateSession(); } catch(e){}
  return claimed;
};

async function validateSession(){
  var st = getSession();
  if (!st) return;
  try {
    var me = await authedFetch("/v1/auth/me");
    if (me && me.user){
      var who = me.user.email || me.user.phone || "";
      if (who) lsSet(LS_WHO, who);
    }
  } catch(e){
    if (e && e.status === 401){ lsDel(LS_SESSION); lsDel(LS_WHO); }
  }
  try { paintCard(); } catch(e){}
}

/* ---------- settings card ---------- */
var phoneState = null; /* {phone, sent} while in the phone flow */
var cardMsg = "";
var cardNote = "";

function hostEl(){ try { return document.querySelector(HOST_SEL); } catch(e){ return null; } }

function ensureCard(){
  var host = hostEl();
  if (!host || host.querySelector("#authBox")) return;
  var box = document.createElement("div");
  box.id = "authBox";
  box.className = CARD_CLASS;
  box.style.marginTop = "12px";
  try {
    var sib = host.querySelector("#syncBox");
    if (sib && sib.parentNode === host && sib.nextSibling) host.insertBefore(box, sib.nextSibling);
    else host.appendChild(box);
  } catch(e){ host.appendChild(box); }
  paintCard();
}

function btnStyle(){
  return "display:block;width:100%;box-sizing:border-box;min-height:44px;margin:8px 0 0;" +
    "padding:10px 14px;font-size:16px;border-radius:10px;" +
    "border:1px solid rgba(128,128,128,.45);background:rgba(128,128,128,.14);" +
    "color:inherit;touch-action:manipulation;cursor:pointer;";
}
function ghostStyle(){
  return "display:block;width:100%;box-sizing:border-box;min-height:44px;margin:8px 0 0;" +
    "padding:10px 14px;font-size:16px;border-radius:10px;" +
    "border:1px solid transparent;background:transparent;" +
    "color:inherit;touch-action:manipulation;cursor:pointer;opacity:.8;";
}
function inputStyle(){
  return "display:block;width:100%;box-sizing:border-box;min-height:44px;margin:8px 0 0;" +
    "padding:10px 14px;font-size:16px;border-radius:10px;" +
    "border:1px solid rgba(128,128,128,.45);background:rgba(0,0,0,.25);color:inherit;";
}
function mutedStyle(){ return "font-size:12px;opacity:.65;margin:8px 0 0;line-height:1.45;"; }
function titleStyle(){ return "font-weight:700;font-size:15px;"; }

function paintCard(){
  var box = document.getElementById("authBox");
  if (!box) return;
  var st = getSession();
  var who = lsGet(LS_WHO) || "";
  var h = '<div style="' + titleStyle() + '">Sign in ' +
    '<span style="font-weight:400;font-size:12px;opacity:.65;">(optional)</span></div>';
  if (st){
    h += '<p style="' + mutedStyle() + '">Signed in as <b>' + esc(who || "this device") + '</b></p>' +
      '<button id="authSignOut" style="' + btnStyle() + '">Sign out</button>' +
      '<p style="' + mutedStyle() + '">Signing out keeps your data on this device.</p>';
  } else {
    h += '<p style="' + mutedStyle() + '">' + esc(APP_COPY) + '</p>';
    if (cardNote) h += '<p style="' + mutedStyle() + '">' + esc(cardNote) + '</p>';
    if (phoneState){
      h += '<div id="authPhoneStep">' +
        (phoneState.sent
          ? '<p style="' + mutedStyle() + '">Enter the 6-digit code sent to ' +
            esc(phoneState.phone) + '</p>' +
            '<input id="authCode" inputmode="numeric" pattern="[0-9]*" maxlength="6" ' +
            'placeholder="123456" autocomplete="one-time-code" style="' + inputStyle() + '">' +
            '<button id="authVerifyCode" style="' + btnStyle() + '">Verify code</button>' +
            '<p style="' + mutedStyle() + '">Demo mode: no text is sent yet. ' +
            'Phone verification goes live with Twilio.</p>'
          : '<p style="' + mutedStyle() + '">Enter your phone number</p>' +
            '<input id="authPhone" type="tel" inputmode="tel" placeholder="+1 555 010 2030" ' +
            'autocomplete="tel" style="' + inputStyle() + '">' +
            '<button id="authSendCode" style="' + btnStyle() + '">Text me a code</button>') +
        '<p style="' + mutedStyle() + '" id="authMsg">' + esc(cardMsg) + '</p>' +
        '<button id="authPhoneBack" style="' + ghostStyle() + '">Back</button>' +
        '</div>';
    } else {
      h += '<div id="authMain">' +
        '<input id="authEmail" type="email" inputmode="email" placeholder="you@example.com" ' +
        'autocomplete="email" style="' + inputStyle() + '">' +
        '<button id="authEmailGo" style="' + btnStyle() + '">Email me a sign-in link</button>' +
        '<p style="' + mutedStyle() + '" id="authMsg">' + esc(cardMsg) + '</p>' +
        '<div style="text-align:center;font-size:12px;opacity:.55;margin:10px 0 2px;">' +
        'or continue with</div>' +
        '<button id="authApple" style="' + btnStyle() + '">Continue with Apple</button>' +
        '<button id="authGoogle" style="' + btnStyle() + '">Continue with Google</button>' +
        '<button id="authPhoneGo" style="' + ghostStyle() + '">Use a phone number instead</button>' +
        '</div>';
    }
  }
  box.innerHTML = h;
  bindCard(box);
}

function setMsg(t){
  cardMsg = t;
  var m = document.getElementById("authMsg");
  if (m) m.textContent = t;
}

function bindCard(box){
  if (getSession()){
    var so = box.querySelector("#authSignOut");
    if (so) so.onclick = async function(){
      so.disabled = true;
      try { await authedFetch("/v1/auth/logout", { method: "POST" }); } catch(e){}
      lsDel(LS_SESSION); lsDel(LS_WHO);
      paintCard();
    };
    return;
  }
  if (phoneState){
    var back = box.querySelector("#authPhoneBack");
    if (back) back.onclick = function(){ phoneState = null; cardMsg = ""; paintCard(); };
    var send = box.querySelector("#authSendCode");
    if (send) send.onclick = async function(){
      var inp = box.querySelector("#authPhone");
      var phone = inp ? inp.value.trim() : "";
      if (!/^\+?[0-9][0-9\s().-]{5,}$/.test(phone)){
        setMsg("Enter a valid phone number, like +1 555 010 2030."); return;
      }
      send.disabled = true;
      try {
        await authFetch("/v1/auth/phone/request", { method: "POST",
          body: { phone: phone, app_slug: SLUG } });
        phoneState = { phone: phone, sent: true };
        setMsg("");
        paintCard();
      } catch(e){
        setMsg("Could not send a code. Check your connection and try again.");
        send.disabled = false;
      }
    };
    var vc = box.querySelector("#authVerifyCode");
    if (vc) vc.onclick = async function(){
      var inp = box.querySelector("#authCode");
      var code = inp ? inp.value.trim() : "";
      if (!/^[0-9]{4,8}$/.test(code)){ setMsg("Enter the code from the text message."); return; }
      vc.disabled = true;
      try {
        var b = { phone: phoneState.phone, code: code };
        var dk = getDeviceKey();
        if (dk) b.device_key = dk;
        var res = await authFetch("/v1/auth/phone/verify", { method: "POST", body: b });
        if (res && res.ok && res.session_token){
          lsSet(LS_SESSION, res.session_token);
          lsSet(LS_WHO, phoneState.phone);
          phoneState = null; cardMsg = "";
          paintCard(); validateSession();
        } else {
          setMsg("That code did not work. Try again.");
          vc.disabled = false;
        }
      } catch(e){
        if (e && e.status === 409) setMsg("This number is already on another account.");
        else setMsg("That code did not work. Try again.");
        vc.disabled = false;
      }
    };
    return;
  }
  var go = box.querySelector("#authEmailGo");
  if (go) go.onclick = async function(){
    var inp = box.querySelector("#authEmail");
    var email = inp ? inp.value.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
      setMsg("Enter a valid email address."); return;
    }
    go.disabled = true;
    try {
      await authFetch("/v1/auth/request", { method: "POST",
        body: { email: email, app_slug: SLUG } });
      setMsg("Check your email for the sign-in link. It expires in 15 minutes.");
    } catch(e){
      setMsg("Could not send the link. Check your connection and try again.");
    }
    go.disabled = false;
  };
  var ap = box.querySelector("#authApple");
  if (ap) ap.onclick = function(){ oauthStart("apple"); };
  var gg = box.querySelector("#authGoogle");
  if (gg) gg.onclick = function(){ oauthStart("google"); };
  var ph = box.querySelector("#authPhoneGo");
  if (ph) ph.onclick = function(){ phoneState = { phone: "", sent: false }; cardMsg = ""; paintCard(); };
}

function oauthStart(provider){
  var dk = getDeviceKey() || "";
  location.href = WORKER + "/v1/auth/oauth/" + provider +
    "?app_slug=" + encodeURIComponent(SLUG) +
    (dk ? "&device_key=" + encodeURIComponent(dk) : "");
}

/* ---------- boot: render card, validate any existing session ---------- */
function boot(){
  ensureCard();
  try { validateSession(); } catch(e){}
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

/* Re-inject the card if the settings UI re-renders (e.g. the sheet rebuilds). */
try {
  var __authMO = new MutationObserver(function(){ ensureCard(); });
  __authMO.observe(document.documentElement, { childList: true, subtree: true });
} catch(e){}

})();
