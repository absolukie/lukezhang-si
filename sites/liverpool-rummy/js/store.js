/* BoyGames IAP bridge — window.BoyGames.store
 *
 * Native wrapper contract (the future app shell injects window.BoyGamesNative):
 *   window.BoyGamesNative.store = {
 *     getProducts(): Promise<[{ id, title, price }]>,  // price = localized string
 *     purchase(productId): Promise<{ owned: bool }>,   // StoreKit 2 / Play Billing
 *     restore(): Promise<{ ownedIds: string[] }>
 *   }
 *
 * Web fallback (plain browser, no wrapper):
 *   - getProducts() returns a static list with USD prices.
 *   - purchase() flips the local entitlement ONLY under ?dev=1 (demo mode —
 *     it charges nothing and is clearly labeled as such below).
 *   - restore() reads the local entitlement cache.
 *
 * Entitlement persisted at localStorage "boygames.liverpoolrummy.entitlements"
 * as { remove_ads: true }.
 */
(function () {
  if (typeof window === "undefined") return;
  window.BoyGames = window.BoyGames || {};
  if (window.BoyGames.store) return;

  var PRODUCT_REMOVE_ADS = "boygames.liverpoolrummy.remove_ads";
  var LS_ENT = "boygames.liverpoolrummy.entitlements";

  function nativeStore() {
    return (window.BoyGamesNative && window.BoyGamesNative.store) || null;
  }
  function readEnt() {
    try { return JSON.parse(localStorage.getItem(LS_ENT) || "{}"); }
    catch (e) { return {}; }
  }
  function writeEnt(ent) {
    try { localStorage.setItem(LS_ENT, JSON.stringify(ent)); } catch (e) {}
  }
  function isDev() {
    try { return /(?:[?#&])dev=1\b/.test(location.search + location.hash); }
    catch (e) { return false; }
  }

  window.BoyGames.store = {
    PRODUCT_REMOVE_ADS: PRODUCT_REMOVE_ADS,
    isNative: function () { return !!nativeStore(); },
    getProducts: function () {
      var n = nativeStore();
      if (n && n.getProducts) return n.getProducts();
      return Promise.resolve([{ id: PRODUCT_REMOVE_ADS, title: "Remove Ads", price: "$2.99" }]);
    },
    purchase: function (productId) {
      var n = nativeStore();
      if (n && n.purchase) return n.purchase(productId).then(function (r) {
        if (r && r.owned) { var e = readEnt(); e.remove_ads = true; writeEnt(e); }
        return r;
      });
      /* DEMO MODE (web only, ?dev=1): flip the local entitlement so the flow
         can be exercised in the browser. Charges nothing, persists nothing
         server-side — the real purchase happens via StoreKit 2 / Play Billing
         in the native wrapper. */
      if (isDev()) {
        var e2 = readEnt(); e2.remove_ads = true; writeEnt(e2);
        return Promise.resolve({ owned: true, demo: true });
      }
      return Promise.resolve({ owned: false, error: "not-native" });
    },
    restore: function () {
      var n = nativeStore();
      if (n && n.restore) return n.restore().then(function (r) {
        var ids = (r && r.ownedIds) || [];
        if (ids.indexOf(PRODUCT_REMOVE_ADS) >= 0) {
          var e = readEnt(); e.remove_ads = true; writeEnt(e);
        }
        return r;
      });
      return Promise.resolve({ ownedIds: readEnt().remove_ads ? [PRODUCT_REMOVE_ADS] : [] });
    },
    isOwned: function (productId) {
      if (productId === PRODUCT_REMOVE_ADS) return !!readEnt().remove_ads;
      return false;
    }
  };
})();
