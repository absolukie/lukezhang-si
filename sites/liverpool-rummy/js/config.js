/* BoyGames shared config — ad kill switch.
 *
 * Exposes window.BoyGames.config = { adsEnabled: bool, load(): Promise<bool> }
 *
 * Resolution order (first hit wins):
 *   1. ?ads=1 URL param forces ads ON (testing override).
 *   2. localStorage "boygames.liverpoolrummy.adsOverride" = "on"/"off" (testing).
 *   3. Remote flag service (BoyGames Flags):
 *      GET https://boygames-flags.absolukie.workers.dev/api/flags?app=liverpool-rummy
 *      -> { flags: { adsEnabled: bool } }. Result cached in localStorage for
 *      5 minutes (stale-while-revalidate); network failure falls through.
 *   4. /config.json { "adsEnabled": bool } — shipped with the app. Local
 *      fallback if the flag service is unreachable.
 *   5. Default false — ads stay off (fail closed).
 *
 * The result is cached; load() is safe to call repeatedly.
 */
(function () {
  if (typeof window === "undefined") return;
  window.BoyGames = window.BoyGames || {};
  if (window.BoyGames.config) return;
  var LS_OVERRIDE = "boygames.liverpoolrummy.adsOverride";
  var LS_REMOTE = "boygames.liverpoolrummy.flagsCache"; /* {v: bool, at: ms} */
  var REMOTE_TTL_MS = 5 * 60 * 1000;
  var FLAGS_URL = "https://boygames-flags.absolukie.workers.dev/api/flags?app=liverpool-rummy";

  var state = { adsEnabled: false, _loaded: false, _promise: null };

  function urlForced() {
    try { return /(?:[?#&])ads=1\b/.test(location.search + location.hash); }
    catch (e) { return false; }
  }
  function lsOverride() {
    try {
      var v = localStorage.getItem(LS_OVERRIDE);
      if (v === "on") return true;
      if (v === "off") return false;
    } catch (e) {}
    return null;
  }
  function readRemoteCache() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_REMOTE) || "null");
      if (c && typeof c.v === "boolean" && (Date.now() - c.at) < REMOTE_TTL_MS) return c.v;
    } catch (e) {}
    return null;
  }
  function writeRemoteCache(v) {
    try { localStorage.setItem(LS_REMOTE, JSON.stringify({ v: !!v, at: Date.now() })); } catch (e) {}
  }
  /* Returns Promise<bool|null> — null when the service is unreachable or the
     flag is absent (caller falls through to config.json). Fail closed. */
  function fetchRemote() {
    if (typeof fetch !== "function") return Promise.resolve(null);
    return fetch(FLAGS_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var v = (d && d.flags && typeof d.flags.adsEnabled === "boolean") ? d.flags.adsEnabled : null;
        if (v !== null) writeRemoteCache(v);
        return v;
      })
      .catch(function () { return null; });
  }
  function load() {
    if (state._promise) return state._promise;
    state._promise = new Promise(function (resolve) {
      if (urlForced()) { state.adsEnabled = true; state._loaded = true; return resolve(true); }
      var ov = lsOverride();
      if (ov !== null) { state.adsEnabled = ov; state._loaded = true; return resolve(ov); }
      var cached = readRemoteCache();
      if (cached !== null) {
        /* Stale-while-revalidate: use the cached flag now, refresh quietly. */
        state.adsEnabled = cached; state._loaded = true;
        fetchRemote().then(function (v) { if (v !== null) state.adsEnabled = v; });
        return resolve(cached);
      }
      fetchRemote().then(function (v) {
        if (v !== null) { state.adsEnabled = v; state._loaded = true; return resolve(v); }
        if (typeof fetch !== "function") { state._loaded = true; return resolve(false); }
        fetch("config.json", { cache: "no-store" }).then(function (r) { return r.json(); })
          .then(function (d) { state.adsEnabled = !!(d && d.adsEnabled); })
          .catch(function () { state.adsEnabled = false; }) /* fail closed */
          .then(function () { state._loaded = true; resolve(state.adsEnabled); });
      });
    });
    return state._promise;
  }
  state.load = load;
  window.BoyGames.config = state;
})();
