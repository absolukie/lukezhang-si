/* worker.js — lukezhang.si edge router.
 *
 * This is the Worker's entrypoint, wired via wrangler.toml ("main").
 * NEVER name it _worker.js — that is a Pages-only convention; on a Workers
 * project wrangler tries to upload it as a static asset and the build fails.
 *
 * Host-based routing for Luke's sites. One Cloudflare Worker project, zero new
 * project slots per site.
 *
 *   lukezhang.si, www.lukezhang.si  → existing static site (cat + /blog/*). Untouched.
 *   projects.lukezhang.si           → project hub: /<site>/ serves sites/<site>/ from Static Assets.
 *   <site>.lukezhang.si             → launch subdomains: serves sites/<site>/ directly.
 *                                     (Each needs its custom domain added in the Cloudflare
 *                                     dashboard once per launch — DNS/SSL is automatic.)
 *   anything else                   → today's behavior (env.ASSETS passthrough), untouched.
 *
 * Adding a site: drop its files in sites/<name>/ (index.html required), add <name>
 * to SITES below, push. See ROUTER.md.
 */

const SITES = ["america-gov-render", "leetcode-games", "ergosphere", "illusion-bowling", "shotgrep", "ui-candy", "takes", "rust-vs-go", "toptext", "america-gov-privacy", "ballz-1000-decisions", "ballz-recreation", "boygames-hub", "cat-cafe-tycoon", "coffee-game", "comeback-kit", "company-site", "comparison-lab", "design-docs", "desk-setup-showdown", "emotion-engine", "fall-foliage-sim", "foil-cards", "grok-bot-recreation", "leetcode-games-browser", "liquid-glass-demo", "make-100k", "model-bench-site", "nicomachus-visual", "oobleck-lab", "reaction-studio", "screenshot-ctrl-f", "skill-tree",
  "ballz-1000-levels",
  "theme-names",
  "swipe-cards-yes-no",
  "notes-triage-oct-5",
  "comparison-slider",
  "ab-toggle",
  "hairball",
  "peggie",
  "rebalancer-lab", "yc-s26", "get-clocked",
  "black-hole-post-doc",
  "china-korea-hq",
  "draw-guess",
  "liverpool-rummy",
  "redemption-post-doc",
  "us-book-dr",
  "wikimari",
  "blackbox",
  "wiggle-room-brand",
  "skill-tree-directions",
  "sysdesign-build-a-job-scheduler",
  "sysdesign-build-a-tokenizer",
  "sysdesign-design-a-chat-system",
  "sysdesign-design-a-distributed-cache",
  "sysdesign-design-a-key-value-store",
  "sysdesign-design-a-leaderboard",
  "sysdesign-design-a-notification-system",
  "sysdesign-design-a-payment-system",
  "sysdesign-design-a-rate-limiter",
  "sysdesign-design-a-social-feed",
  "sysdesign-design-a-url-shortener",
  "sysdesign-design-a-web-crawler",
  "sysdesign-design-autocomplete",
  "sysdesign-design-distributed-storage",
  "sysdesign-design-dropbox",
  "sysdesign-design-food-delivery",
  "sysdesign-design-metrics-system",
  "sysdesign-design-ticket-booking",
  "sysdesign-design-uber",
  "sysdesign-design-youtube",
  "ai-hedge-fund-lab",
  "claw",
  "debate-club",
  "dictation-pad",
  "flight-tracker",
  "fridge-portfolio",
  "omarchy-web",
  "paint-timeline-demo",
  "points-of-view",
  "step-through-lab",
  "swipe-cards-lab",
  "todo-autopilot",
  "tokenizer-from-scratch",
  "what-should-we-do-tonight",
  "what-weights-look-like",
  "ai-civilization-sim",
  "before-after-lab",
  "bench-lab",
  "claw-cookbook",
  "distributed-workflow-engine",
  "flipside",
  "frontier-agent-platform",
  "govmap",
  "how-llm-works",
  "mcp-diagram",
  "pour-decisions",
  "random-side-quest",
  "teaching-tools-lab",
  "trade-compass",
  "unknown-unknown-search",
  "autonomous-scientist",
  "bench-lab-rpc",
  "deep-reader",
  "dlss-lab",
  "hangtime",
  "how-well-do-we-match",
  "how-x-algorithm-works",
  "musk-emails",
  "personal-digital-twin",
  "personal-site",
  "song-duel",
  "spf-showdown",
  "tesla-commute-tco",
  "what-should-we-talk-about",
  "world-todo",
  "fifty-tracks",
  "spf-blog-post",
  "birds-of-a-feather",
  "unsolved-lab",
  "second-brain-search",
  "todo-1000",
  "peggie-preview", "shazam-lab", "wasm-craft", "vibe-check", "model-atlas"];
// Trade Compass: proxies Yahoo Finance quotes via v8 chart API.
async function handleTradeCompassQuotes(request) {
  const url = new URL(request.url);
  const syms = (url.searchParams.get("s") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 25);
  if (!syms.length) {
    return new Response(JSON.stringify({ error: "missing s param" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const quotes = await Promise.all(
    syms.map(async (sym) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        if (!res.ok) return { symbol: sym, error: "fetch failed" };
        const data = await res.json();
        const m = data.chart?.result?.[0]?.meta;
        if (!m) return { symbol: sym, error: "no data" };
        return {
          symbol: sym,
          name: m.shortName || m.longName || sym,
          price: m.regularMarketPrice,
          prevClose: m.chartPreviousClose || m.previousClose,
          change: m.regularMarketPrice != null && m.chartPreviousClose != null
            ? m.regularMarketPrice - m.chartPreviousClose
            : null,
          changePct: m.regularMarketPrice != null && m.chartPreviousClose
            ? ((m.regularMarketPrice - m.chartPreviousClose) / m.chartPreviousClose) * 100
            : null,
        };
      } catch (e) {
        return { symbol: sym, error: "exception" };
      }
    })
  );
  return new Response(JSON.stringify({ quotes }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
}

const PROJECTS_HOST = "projects.lukezhang.si";
const SITE_HOST_RE = /^([a-z0-9-]+)\.lukezhang\.si$/;

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found — projects.lukezhang.si</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 50% 42%, #4a3226 0%, #2a1d18 45%, #100d0e 100%);
    color: #ece9e2;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    text-align: center; padding: 24px;
  }
  h1 { font-size: 28px; font-weight: 600; margin-bottom: 12px; }
  p { opacity: .65; font-size: 16px; margin-bottom: 24px; }
  a {
    color: #ece9e2; text-decoration: none; font-size: 16px;
    border: 1px solid rgba(236,233,226,.35); border-radius: 999px;
    padding: 10px 22px; touch-action: manipulation;
  }
</style>
</head>
<body>
  <main>
    <h1>Nothing here</h1>
    <p>That project doesn't exist (yet).</p>
    <a href="/">Back to the hub</a>
  </main>
</body>
</html>`;

function notFound() {
  return new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

// Fetch a static asset by path, following the asset system's one-hop
// canonicalization redirect (e.g. /sites/x/index.html → /sites/x/).
async function fetchAsset(request, env, path) {
  const url = new URL(request.url);
  let res = await env.ASSETS.fetch(new Request(new URL(path, url), request));
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (loc) {
      res = await env.ASSETS.fetch(new Request(new URL(loc, url), request));
    }
  }
  return res;
}

// ---- TakeTemp API (inlined from absolukie/take-temp/worker-api.js) ----
// Needs the TAKES_KV namespace binding on the Worker.
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
function err(msg, status) { return json({ error: msg }, status || 400); }

async function rateLimit(kv, key, limit, windowSec) {
  var now = Date.now();
  var raw = await kv.get("tt:rl:" + key);
  var rec = raw ? JSON.parse(raw) : { count: 0, reset: now + windowSec * 1000 };
  if (now > rec.reset) rec = { count: 0, reset: now + windowSec * 1000 };
  rec.count++;
  await kv.put("tt:rl:" + key, JSON.stringify(rec), { expirationTtl: windowSec + 60 });
  return rec.count <= limit;
}

var ROOM_RE = /^[a-z0-9-]{1,32}$/;
var VOTER_RE = /^[a-zA-Z0-9-]{8,64}$/;

async function handleTakeTemp(request, env) {
  var kv = env.TAKES_KV;
  if (!kv) return err("KV not configured", 500);
  var url = new URL(request.url);
  var parts = url.pathname.split("/").filter(Boolean); // ["api","takes",room,action]
  var room = (parts[2] || "lobby").toLowerCase();
  if (!ROOM_RE.test(room)) return err("bad room", 400);
  var action = parts[3];

  // ---- list posts ----
  if (request.method === "GET" && action === "posts") {
    var sort = url.searchParams.get("sort") === "new" ? "new" : "top";
    var idx = JSON.parse((await kv.get("tt:room:" + room + ":index")) || "[]");
    var posts = [];
    for (var i = 0; i < Math.min(idx.length, 200); i++) {
      var p = await kv.get("tt:post:" + room + ":" + idx[i], "json");
      if (p) posts.push(p);
    }
    posts.sort(function (a, b) {
      var sa = a.likes - a.dislikes, sb = b.likes - b.dislikes;
      return sort === "new" ? b.createdAt - a.createdAt : sb - sa || b.createdAt - a.createdAt;
    });
    return json({ posts: posts });
  }

  // ---- create post ----
  if (request.method === "POST" && action === "posts") {
    var ip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!(await rateLimit(kv, "post:" + ip, 10, 3600))) return err("slow down — 10 posts/hour", 429);
    var body = await request.json().catch(function () { return null; });
    var text = ((body && body.text) || "").trim().slice(0, 280);
    var author = ((body && body.author) || "").trim().slice(0, 24) || "anon";
    if (!text) return err("empty take", 400);
    var id = (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10));
    var post = { id: id, text: text, author: author, likes: 0, dislikes: 0, createdAt: Date.now() };
    await kv.put("tt:post:" + room + ":" + id, JSON.stringify(post));
    var list = JSON.parse((await kv.get("tt:room:" + room + ":index")) || "[]");
    list.unshift(id);
    await kv.put("tt:room:" + room + ":index", JSON.stringify(list.slice(0, 500)));
    return json({ post: post }, 201);
  }

  // ---- vote ----
  if (request.method === "POST" && action === "vote") {
    var vip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!(await rateLimit(kv, "vote:" + vip, 120, 60))) return err("slow down", 429);
    var vbody = await request.json().catch(function () { return null; });
    var vid = vbody && vbody.id, dir = vbody && vbody.dir, voter = vbody && vbody.voter;
    if (!vid || (dir !== 1 && dir !== -1 && dir !== 0) || !voter || !VOTER_RE.test(voter))
      return err("bad vote", 400);
    var pkey = "tt:post:" + room + ":" + vid;
    var existing = await kv.get(pkey, "json");
    if (!existing) return err("not found", 404);
    var vkey = "tt:voter:" + voter;
    var votes = JSON.parse((await kv.get(vkey)) || "{}");
    var vprop = room + ":" + vid;
    var prev = votes[vprop] || 0;
    if (prev === dir) return json({ post: existing }); // no-op
    if (prev === 1) existing.likes--;
    if (prev === -1) existing.dislikes--;
    if (dir === 1) existing.likes++;
    if (dir === -1) existing.dislikes++;
    if (dir === 0) delete votes[vprop]; else votes[vprop] = dir;
    await kv.put(pkey, JSON.stringify(existing));
    await kv.put(vkey, JSON.stringify(votes));
    return json({ post: existing });
  }

  return err("not found", 404);
}

// ---- Trade Compass quotes (unsolved-lab) ----
// GET /unsolved-lab/api/quotes?symbol=X → Yahoo Finance v8 chart API.
// Same-origin proxy so the static site never needs a key or CORS.
// (The Trade Compass client itself hasn't landed yet; this route waits for it.)
var QUOTE_SYMBOL_RE = /^[A-Za-z0-9.\-=^]{1,24}$/;
var YAHOO_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function handleUnsolvedQuotes(request, env) {
  if (request.method !== "GET") return err("method not allowed", 405);
  var url = new URL(request.url);
  var symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!QUOTE_SYMBOL_RE.test(symbol)) return err("bad symbol", 400);
  var target = "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) + "?interval=1d&range=1mo";
  var upstream;
  try {
    upstream = await fetch(target, { headers: { "User-Agent": YAHOO_UA } });
  } catch (e) {
    return err("quote upstream unreachable", 502);
  }
  if (!upstream.ok) return err("quote upstream error", 502);
  var body = await upstream.text();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
}

// ---- Decision-doc submissions ----
// POST /api/decision/submit  {slug, picks, notes}  → stores in KV (rate-limited)
// GET  /api/decision/responses?slug=X&key=READ_KEY  → newest-first (private read key)
var DD_READ_KEY = "06cdb441cc779c7932779fb2e8b97639";
var SLUG_RE = /^[a-z0-9-]{1,48}$/;

async function handleDecision(request, env) {
  var kv = env.DD_KV;
  if (!kv) return err("KV not configured", 500);
  var url = new URL(request.url);
  var parts = url.pathname.split("/").filter(Boolean); // ["api","decision",action]
  var action = parts[2];

  if (request.method === "POST" && action === "submit") {
    var ip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!(await rateLimit(kv, "dd:sub:" + ip, 20, 3600))) return err("slow down", 429);
    var body = await request.json().catch(function () { return null; });
    var slug = body && body.slug;
    if (!slug || !SLUG_RE.test(slug)) return err("bad slug", 400);
    var picks = body.picks && typeof body.picks === "object" ? body.picks : {};
    var notes = body.notes && typeof body.notes === "object" ? body.notes : {};
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var rec = { id: id, slug: slug, picks: picks, notes: notes, createdAt: Date.now() };
    await kv.put("dd:sub:" + slug + ":" + id, JSON.stringify(rec).slice(0, 20000));
    var idx = JSON.parse((await kv.get("dd:idx:" + slug)) || "[]");
    idx.unshift(id);
    await kv.put("dd:idx:" + slug, JSON.stringify(idx.slice(0, 50)));
    return json({ ok: true, id: id }, 201);
  }

  if (request.method === "GET" && action === "responses") {
    if (url.searchParams.get("key") !== DD_READ_KEY) return err("forbidden", 403);
    var rslug = url.searchParams.get("slug") || "";
    if (!SLUG_RE.test(rslug)) return err("bad slug", 400);
    var ridx = JSON.parse((await kv.get("dd:idx:" + rslug)) || "[]");
    var out = [];
    for (var i = 0; i < Math.min(ridx.length, 20); i++) {
      var r = await kv.get("dd:sub:" + rslug + ":" + ridx[i], "json");
      if (r) out.push(r);
    }
    return json({ slug: rslug, responses: out });
  }

  return err("not found", 404);
}

// ---- TRACE RACE shared leaderboards ----
// POST /api/trace-race/submit {challenge, name, total, scores[5], drawings?} → stores in KV (rate-limited)
// GET  /api/trace-race/scores?challenge=X → public top-20 + per-round bests
// GET  /api/trace-race/rival?challenge=X → top-3 entries with drawings, for per-round rival replays
var TR_CHALLENGE_RE = /^[cd][A-Za-z0-9-]{1,31}$/;
async function handleTraceRace(request, env) {
  var kv = env.TAKES_KV;
  if (!kv) return err("KV not configured", 500);
  var url = new URL(request.url);
  var parts = url.pathname.split("/").filter(Boolean); // ["api","trace-race",action]
  var action = parts[2];

  if (request.method === "POST" && action === "submit") {
    var ip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!(await rateLimit(kv, "tr:sub:" + ip, 20, 3600))) return err("slow down", 429);
    var body = await request.json().catch(function () { return null; });
    var challenge = body && body.challenge;
    var name = body && typeof body.name === "string" ? body.name.trim().slice(0, 16) : "";
    var total = body && body.total;
    var scores = body && body.scores;
    if (!challenge || !TR_CHALLENGE_RE.test(challenge)) return err("bad challenge", 400);
    if (!name) return err("bad name", 400);
    if (!Number.isInteger(total) || total < 0 || total > 500) return err("bad total", 400);
    if (!Array.isArray(scores) || scores.length !== 5 ||
        !scores.every(function (s) { return Number.isInteger(s) && s >= 0 && s <= 100; }))
      return err("bad scores", 400);
    if (scores.reduce(function (a, b) { return a + b; }, 0) !== total) return err("bad total", 400);
    // optional drawings: 5 rounds x up to 128 normalized [x,y] pairs, for rival replays
    var drawings = body && body.drawings;
    if (drawings !== undefined && drawings !== null) {
      if (!Array.isArray(drawings) || drawings.length !== 5) return err("bad drawings", 400);
      for (var d = 0; d < 5; d++) {
        var pts = drawings[d];
        if (!Array.isArray(pts) || pts.length === 0 || pts.length > 128) return err("bad drawings", 400);
        for (var q = 0; q < pts.length; q++) {
          var pt = pts[q];
          if (!Array.isArray(pt) || pt.length !== 2 ||
              !isFinite(pt[0]) || !isFinite(pt[1]) ||
              Math.abs(pt[0]) > 2 || Math.abs(pt[1]) > 2) return err("bad drawings", 400);
        }
      }
    } else { drawings = null; }
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var rec = { id: id, challenge: challenge, name: name, total: total, scores: scores, createdAt: Date.now() };
    if (drawings) rec.drawings = drawings;
    await kv.put("tr:sub:" + challenge + ":" + id, JSON.stringify(rec).slice(0, 30000));
    var idx = JSON.parse((await kv.get("tr:idx:" + challenge)) || "[]");
    idx.unshift(id);
    await kv.put("tr:idx:" + challenge, JSON.stringify(idx.slice(0, 200)));
    return json({ ok: true, id: id }, 201);
  }

  if (request.method === "GET" && action === "rival") {
    var ch2 = url.searchParams.get("challenge") || "";
    if (!TR_CHALLENGE_RE.test(ch2)) return err("bad challenge", 400);
    var idx2 = JSON.parse((await kv.get("tr:idx:" + ch2)) || "[]");
    var all = [];
    for (var m = 0; m < Math.min(idx2.length, 60); m++) {
      var rec2 = await kv.get("tr:sub:" + ch2 + ":" + idx2[m], "json");
      if (rec2 && rec2.id && typeof rec2.total === "number") all.push(rec2);
    }
    all.sort(function (a, b) { return b.total - a.total; });
    var top = all.slice(0, 3).map(function (s) {
      var o = { id: s.id, name: s.name, total: s.total, scores: s.scores };
      if (s.drawings) o.drawings = s.drawings;
      return o;
    });
    return json({ challenge: ch2, count: all.length, top: top });
  }

  if (request.method === "GET" && action === "scores") {
    var ch = url.searchParams.get("challenge") || "";
    if (!TR_CHALLENGE_RE.test(ch)) return err("bad challenge", 400);
    var ridx = JSON.parse((await kv.get("tr:idx:" + ch)) || "[]");
    var out = [];
    for (var i = 0; i < Math.min(ridx.length, 60); i++) {
      var r = await kv.get("tr:sub:" + ch + ":" + ridx[i], "json");
      if (r && r.id && typeof r.total === "number") out.push(r);
    }
    out.sort(function (a, b) { return b.total - a.total; });
    var roundBest = [0, 0, 0, 0, 0], k;
    out.forEach(function (s) {
      for (k = 0; k < 5; k++) {
        if (s.scores && s.scores[k] > roundBest[k]) roundBest[k] = s.scores[k];
      }
    });
    return json({
      challenge: ch,
      count: out.length,
      roundBest: roundBest,
      scores: out.slice(0, 20).map(function (s) {
        return { id: s.id, name: s.name, total: s.total, scores: s.scores };
      })
    });
  }

  return err("not found", 404);
}

// ---- Game backend proxies ----
// Lets backend-backed games live on projects.lukezhang.si with same-origin
// API calls. The backends keep running where they are; the router forwards.
// No CORS issues, no secret migration.

// Wikimari: Grokipedia sends no CORS headers, so fetch it server-side.
// (Logic mirrored from absolukie/wikimari functions/api/grok.js.)
function grokiJson(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
async function handleWikimariApi(request) {
  var url = new URL(request.url);
  if (url.pathname === "/wikimari/api/grok") {
    var slug = url.searchParams.get("slug") || "";
    if (!slug || slug.length > 200 || !/^[A-Za-z0-9_()%,.'!-]+$/.test(slug)) {
      return grokiJson({ found: false, error: "bad slug" }, 400);
    }
    try {
      var r = await fetch(
        "https://grokipedia.com/api/page-preview?slug=" + encodeURIComponent(slug),
        { headers: { "User-Agent": "Wikimari/1.0 (+https://projects.lukezhang.si/wikimari/)" } }
      );
      if (!r.ok) return grokiJson({ found: false, error: "upstream " + r.status }, 502);
      return grokiJson(await r.json(), 200);
    } catch (e) {
      return grokiJson({ found: false, error: "upstream unreachable" }, 502);
    }
  }
  if (url.pathname === "/wikimari/api/grok-search") {
    var q = url.searchParams.get("q") || "";
    if (!q || q.length > 100) return grokiJson({ results: [] }, 400);
    try {
      var rs = await fetch(
        "https://grokipedia.com/api/typeahead?v=2&query=" + encodeURIComponent(q),
        { headers: { "User-Agent": "Wikimari/1.0 (+https://projects.lukezhang.si/wikimari/)" } }
      );
      if (!rs.ok) return grokiJson({ results: [] }, 502);
      var data = await rs.json();
      var results = Array.isArray(data.results)
        ? data.results.slice(0, 5).map(function (x) {
            return {
              slug: x.slug,
              title: String(x.title || "").replace(/[*_~`#]+/g, ""),
              snippet: String(x.snippet || "").slice(0, 140),
            };
          })
        : [];
      return grokiJson({ results: results }, 200);
    } catch (e) {
      return grokiJson({ results: [] }, 502);
    }
  }
  return notFound();
}

// Dumb reverse proxy: forwards method, headers (minus host), and body.
// WebSocket upgrades pass through transparently.
async function proxyTo(request, backend, stripPrefix) {
  var url = new URL(request.url);
  var target = backend + url.pathname.slice(stripPrefix.length) + url.search;
  var headers = new Headers();
  request.headers.forEach(function (v, k) {
    if (k.toLowerCase() !== "host") headers.append(k, v);
  });
  var init = { method: request.method, headers: headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  return fetch(target, init);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // Never expose the worker source as a static file. (worker.js lives inside
    // the assets directory, so the router itself must refuse to serve it.)
    if (url.pathname === "/_worker.js" || url.pathname === "/worker.js") return notFound();

    // Decision-doc submissions: /api/decision/* → handleDecision (needs DD_KV).
    if (
      url.pathname.startsWith("/api/decision/") &&
      host === PROJECTS_HOST
    ) {
      return handleDecision(request, env);
    }

    // TRACE RACE leaderboards: /api/trace-race/* → handleTraceRace (uses TAKES_KV).
    if (
      url.pathname.startsWith("/api/trace-race/") &&
      host === PROJECTS_HOST
    ) {
      return handleTraceRace(request, env);
    }

    // Trade Compass: /trade-compass/api/quotes -> Yahoo Finance proxy.
    if (url.pathname === "/trade-compass/api/quotes" && host === PROJECTS_HOST) {
      return handleTradeCompassQuotes(request);
    }

    // TakeTemp API: /api/takes/* → handleTakeTemp (needs the TAKES_KV binding).
    if (
      url.pathname.startsWith("/api/takes/") &&
      (host === PROJECTS_HOST || host === "takes.lukezhang.si")
    ) {
      return handleTakeTemp(request, env);
    }

    // Trade Compass quotes: /unsolved-lab/api/quotes?symbol=X → Yahoo Finance chart API.
    if (url.pathname === "/unsolved-lab/api/quotes" && host === PROJECTS_HOST) {
      return handleUnsolvedQuotes(request, env);
    }

    // Game backend APIs (same-origin for the ported games).
    if (host === PROJECTS_HOST) {
      if (
        url.pathname === "/wikimari/api/grok" ||
        url.pathname === "/wikimari/api/grok-search"
      ) {
        return handleWikimariApi(request);
      }
      if (url.pathname.startsWith("/draw-guess/api/")) {
        return proxyTo(request, "https://draw-and-guess-103.pages.dev/api", "/draw-guess/api");
      }
      if (url.pathname.startsWith("/liverpool-rummy/api/")) {
        return proxyTo(
          request,
          "https://liverpool-rummy-rooms.absolukie.workers.dev",
          "/liverpool-rummy/api"
        );
      }
    }

    let site = null;      // sites/<site>/… to serve
    let sitePath = null;  // path inside the site folder, always starts with "/"

    if (host === PROJECTS_HOST) {
      const segs = url.pathname.split("/").filter(Boolean);
      if (segs.length === 0) {
        // Hub landing page.
        const landing = await fetchAsset(request, env, "/sites/index.html");
        return landing.status === 404 ? notFound() : landing;
      }
      site = segs[0].toLowerCase();
      if (!SITES.includes(site)) return notFound();
      const rest = segs.slice(1).join("/");
      if (site === "takes") {
        // SPA: every /takes/* path serves the app shell; the client reads the
        // room from the URL path.
        if (!url.pathname.endsWith("/")) {
          return Response.redirect(url.origin + url.pathname + "/" + url.search, 301);
        }
        sitePath = "/index.html";
      } else if (!rest) {
        if (!url.pathname.endsWith("/")) {
          // /<site> → /<site>/ so relative asset URLs (./logic.mjs etc.) resolve.
          return Response.redirect(url.origin + "/" + site + "/" + url.search, 301);
        }
        sitePath = "/index.html";
      } else {
        sitePath = "/" + rest;
      }
    } else {
      const m = host.match(SITE_HOST_RE);
      if (m && SITES.includes(m[1])) {
        site = m[1];
        // SPA on the launch domain too.
        sitePath =
          site === "takes"
            ? "/index.html"
            : url.pathname.endsWith("/")
              ? url.pathname + "index.html"
              : url.pathname;
      } else {
        // Main domain and every other host: today's behavior, untouched.
        return env.ASSETS.fetch(request);
      }
    }

    if (!SITES.includes(site)) return notFound();

    // Belt and braces: keep every asset read inside this site's folder.
    const finalPath = "/sites/" + site + sitePath;
    if (!finalPath.startsWith("/sites/" + site + "/") || finalPath.includes("..")) {
      return notFound();
    }

    const res = await fetchAsset(request, env, finalPath);
    if (res.status === 404) return notFound();
    return res;
  },
};
