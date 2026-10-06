/* BoyGames AdManager — window.BoyGames.ads
 *
 * Kill switch: ads render ONLY when BoyGames.config.adsEnabled is true
 * (default false — flip config.json to true and redeploy to go live).
 * Remove Ads IAP is independent: isRemoved() skips ALL rendering silently,
 * even when the kill switch is on.
 *
 * Native wrapper contract (future app shell):
 *   window.BoyGamesNative.ads = {
 *     showBanner(): void,          // native SDK owns its banner view
 *     hideBanner(): void,
 *     showInterstitial(context): void  // native handles its own capping
 *   }
 *
 * Web fallback: house ads — cross-promo cards for his other apps, styled to
 * look intentional (never blank/broken).
 */
(function () {
  if (typeof window === "undefined") return;
  window.BoyGames = window.BoyGames || {};
  if (window.BoyGames.ads) return;

  var INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000; /* at most 1 per 3 minutes */

  var HOUSE = [
    { emoji: "\u23F1\uFE0F", name: "Get Clocked", tag: "The pass-the-phone party game", url: "https://get-clocked.pages.dev" },
    { emoji: "\uD83C\uDFE0", name: "Luke HQ", tag: "All of Luke's apps in one place", url: "https://my-hq-ct5.pages.dev" }
  ];
  var houseIdx = 0;
  var lastInterstitialAt = 0;

  function adsOn() {
    var cfg = window.BoyGames.config;
    return !!(cfg && cfg.adsEnabled);
  }
  function nativeAds() {
    return (window.BoyGamesNative && window.BoyGamesNative.ads) || null;
  }
  function isRemoved() {
    var s = window.BoyGames.store;
    return !!(s && s.isOwned && s.isOwned(s.PRODUCT_REMOVE_ADS));
  }
  function canShow() { return adsOn() && !isRemoved(); }

  function houseCard() {
    var h = HOUSE[houseIdx % HOUSE.length]; houseIdx++;
    var a = document.createElement("a");
    a.className = "ad-house";
    a.href = h.url; a.target = "_blank"; a.rel = "noopener";
    var e = document.createElement("span"); e.className = "ad-e"; e.textContent = h.emoji;
    var tx = document.createElement("span"); tx.className = "ad-tx";
    var b = document.createElement("b"); b.textContent = h.name;
    var i = document.createElement("i"); i.textContent = h.tag;
    tx.appendChild(b); tx.appendChild(i);
    var go = document.createElement("span"); go.className = "ad-go"; go.textContent = "\u203A";
    a.appendChild(e); a.appendChild(tx); a.appendChild(go);
    return a;
  }

  window.BoyGames.ads = {
    isRemoved: isRemoved,
    /* Renders into the provided container element. No-op (returns false) when
       ads are off, removed, or el is missing. */
    showBanner: function (el) {
      if (!el || !canShow()) return false;
      var n = nativeAds();
      if (n && n.showBanner) { n.showBanner(); return true; }
      el.innerHTML = "";
      el.appendChild(houseCard());
      el.classList.add("ad-on");
      return true;
    },
    hideBanner: function () {
      var n = nativeAds();
      if (n && n.hideBanner) { try { n.hideBanner(); } catch (e) {} }
      if (!document.querySelectorAll) return;
      var els = document.querySelectorAll(".ad-banner"), i;
      for (i = 0; i < els.length; i++) { els[i].innerHTML = ""; els[i].classList.remove("ad-on"); }
    },
    /* Frequency-capped interstitial for between-deals / between-games moments.
       Never call this mid-turn. Returns true when an ad was shown. */
    maybeInterstitial: function (context) {
      if (!canShow()) return false;
      var now = Date.now();
      if (now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
      var n = nativeAds();
      if (n && n.showInterstitial) { lastInterstitialAt = now; n.showInterstitial(context); return true; }
      /* Web fallback: house-ad overlay with a dismiss button. */
      lastInterstitialAt = now;
      var ov = document.createElement("div");
      ov.className = "ad-inter";
      var card = document.createElement("div");
      card.className = "ad-inter-card";
      card.appendChild(houseCard());
      var x = document.createElement("button");
      x.className = "btn ghost"; x.textContent = "\u2715 Close";
      x.addEventListener("click", function () { if (ov.parentNode) ov.parentNode.removeChild(ov); });
      card.appendChild(x);
      ov.appendChild(card);
      document.body.appendChild(ov);
      return true;
    }
  };
})();
