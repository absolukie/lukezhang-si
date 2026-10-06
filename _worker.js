/* _worker.js — lukezhang.si edge router.
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

const SITES = ["ergosphere", "illusion-bowling", "shotgrep"];
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // Never expose the worker source as a static file.
    if (url.pathname === "/_worker.js") return notFound();

    let site = null;      // sites/<site>/… to serve
    let sitePath = null;  // path inside the site folder, always starts with "/"

    if (host === PROJECTS_HOST) {
      const segs = url.pathname.split("/").filter(Boolean);
      if (segs.length === 0) {
        // Hub landing page.
        const landing = await env.ASSETS.fetch(new Request(new URL("/sites/index.html", url), request));
        return landing.status === 404 ? notFound() : landing;
      }
      site = segs[0].toLowerCase();
      if (!SITES.includes(site)) return notFound();
      const rest = segs.slice(1).join("/");
      if (!rest) {
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
        sitePath = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
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

    const res = await env.ASSETS.fetch(new Request(new URL(finalPath, url), request));
    if (res.status === 404) return notFound();
    return res;
  },
};
