# lukezhang.si sites router

One Cloudflare Worker project hosts all of Luke's web builds. No new Cloudflare
project is ever needed per site (the account hit the 100-project soft cap).

## Convention (decided 2026-10-05)

- `lukezhang.si/` — the cat site. **Untouched by the router.**
- `lukezhang.si/blog/*` — the blog. **Untouched by the router.**
- `projects.lukezhang.si/<site>/` — project hub. This is where most sites live.
- `<site>.lukezhang.si/` — reserved for major launches only. Each needs its custom
  domain added once in the Cloudflare dashboard (see below); the router already
  serves it with zero code changes.

## How it works

- `worker.js` (repo root) is the Worker's entrypoint, wired via `wrangler.toml`
  (`main = "worker.js"`). It routes by `Host` header and serves static files
  through the automatic `env.ASSETS` binding.
- **Never name the entrypoint `_worker.js`.** That is a Pages-only convention —
  on this Workers project wrangler tries to upload it as a static asset and the
  build fails ("Uploading a Pages _worker.js file as an asset"). (Hit 2026-10-05,
  fixed by renaming to `worker.js`.)
- The entrypoint lives inside the assets directory, so the router itself refuses
  to serve `/worker.js` (returns 404) — the source is never exposed.
- Site files live in `sites/<name>/` (`index.html` required).
- `lukezhang.si`, `www.lukezhang.si`, and every other host fall through to
  `env.ASSETS.fetch(request)` — byte-for-byte today's behavior. The router only
  takes over for `projects.lukezhang.si` and `<site>.lukezhang.si`.
- `/_worker.js` is never served (returns 404) so the source isn't exposed.
- Unknown site names and path-traversal attempts get a styled 404 page.

## Adding a new site

1. Put the site's files in `sites/<name>/` with `index.html` at its root.
2. Add `"<name>"` to the `SITES` array at the top of `worker.js`.
3. Fix the subpath gotcha (below).
4. Push with `~/workspace/skills/github/bin/gh_push.py --repo lukezhang-si --dir <dir>`
   (additive — existing files are preserved). Verify via API read-back, then
   cache-busted `curl` the live URL.
5. It is live at `https://projects.lukezhang.si/<name>/` (once the custom domain
   is attached — see Dashboard steps).

## The subpath gotcha

Sites were built to run at domain root. Under `/<site>/`, absolute asset paths
(`/style.css`, `/app.js`) break. Before porting:

- Prefer **relative** paths (`./style.css`, `style.css`) — they resolve correctly
  under any subpath.
- Or add `<base href="/<site>/">` in `<head>` (careful: it affects all relative
  URLs including anchors).
- Always redirect `/<site>` → `/<site>/` (the router does this) — without the
  trailing slash, `./x.js` resolves to `/x.js` and breaks.

The three ported sites needed no changes: ergosphere and shotgrep are single
self-contained files; illusion-bowling imports `./logic.mjs` (relative).

## Reserved paths (never shadow these)

On `lukezhang.si`: `/` (cat), `/blog/*`, `/design`, `/atlas`, `/draw`, `/polish`,
`/frames/*`. The router never intercepts these — it only acts on the
`projects.lukezhang.si` host and `<site>.lukezhang.si` hosts.

## Dashboard steps (needs the Cloudflare dashboard — no API token exists)

1. Workers & Pages → open the **lukezhang-si** worker → Settings → **Domains & Routes**.
2. **Add custom domain**: `projects.lukezhang.si`. DNS and SSL are automatic
   (lukezhang.si is on Cloudflare nameservers).
3. For each launch subdomain: **Add custom domain** `<site>.lukezhang.si`.
   No code or redeploy needed — the router picks it up by hostname.

## If something breaks

The change is two additive files (`worker.js`, `wrangler.toml`) plus new `sites/`
folders; the default path is a pure passthrough. To roll back: Workers & Pages →
lukezhang-si → Deployments → roll back to the previous deployment.

## Limits (verified 2026-10-05)

- Workers Static Assets: 20,000 files, 25 MiB per file — fine for this use.
- Custom domains per project (free plan): 100 — the practical ceiling on
  launch subdomains. Path-based sites (`projects.lukezhang.si/<site>`) are
  unlimited.
- The 100-project account soft cap is why this exists; the limit-increase form
  remains the fallback for launches that need dedicated projects.
