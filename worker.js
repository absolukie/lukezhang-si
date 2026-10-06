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

const SITES = ["leetcode-games", "ergosphere", "illusion-bowling", "shotgrep", "ui-candy", "takes", "rust-vs-go", "toptext", "america-gov-privacy", "ballz-1000-decisions", "ballz-recreation", "boygames-hub", "cat-cafe-tycoon", "coffee-game", "comeback-kit", "company-site", "comparison-lab", "design-docs", "desk-setup-showdown", "emotion-engine", "fall-foliage-sim", "foil-cards", "grok-bot-recreation", "leetcode-games-browser", "liquid-glass-demo", "make-100k", "model-bench-site", "nicomachus-visual", "oobleck-lab", "reaction-studio", "screenshot-ctrl-f", "skill-tree",
  "ballz-1000-levels",
  "theme-names",
  "swipe-cards-yes-no",
  "notes-triage-oct-5",
  "comparison-slider",
  "ab-toggle",
  "hairball",
  "peggie",
  "get-clocked",
  "redemption-post-doc", "black-hole-post-doc"];
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

    // TakeTemp API: /api/takes/* → handleTakeTemp (needs the TAKES_KV binding).
    if (
      url.pathname.startsWith("/api/takes/") &&
      (host === PROJECTS_HOST || host === "takes.lukezhang.si")
    ) {
      return handleTakeTemp(request, env);
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
