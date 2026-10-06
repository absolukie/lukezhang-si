# omarchy-web — build contract

Single-page Hyprland-style desktop sim. Final artifact is ONE self-contained
`index.html` (assembled by the coordinator from the files below — workers write
only their assigned files). No external assets, no CDN, no fonts.

## Files

| File | Owner | Contents |
|---|---|---|
| `styles.css` | core worker | ALL CSS. Base styles driven by CSS vars (below). Layout for `#boot`, `#login`, `#desktop`, `#topbar`, `#ws-area`, `.window` (+ titlebar/close), `#launcher`, `#shortcuts`, `#quicksettings`, `#toast`, mobile `@media (max-width:720px)`. Every button/tap target: `touch-action:manipulation`. |
| `core.js` | core worker | Builds all DOM inside `<div id="app">`. Boot → login → desktop. Top bar, tiling WM, launcher, shortcuts overlay, quick settings, clock, toasts, theme application. Defines `window.Omarchy`. |
| `fs.js` | coordinator (already written) | `window.THEMES`, `window.WALLPAPERS`, `window.FS`. Read-only for workers. |
| `terminal.js` | terminal worker | Registers `Omarchy.Apps.terminal`. |
| `apps.js` | apps worker | Registers `Omarchy.Apps.files`, `.settings`, `.browser`. |
| `index.html` | coordinator | Skeleton: `<div id="app">`, `<style>`+styles, `<script>` fs.js, core.js, terminal.js, apps.js in order. |

## CSS variables (themes override all of these on `:root`)

`--bg --bg2 --fg --muted --accent --accent2 --bar-bg --bar-fg --win-bg --win-fg
--titlebar-bg --border --term-bg --term-fg --radius`

`#desktop` background comes from the active wallpaper (`window.WALLPAPERS`
entry `css`, applied as `style.background`).

## window.Omarchy API (implemented by core.js)

```js
window.Omarchy = {
  setTheme(name),            // applies THEMES[name].vars to :root, saves localStorage
  setWallpaper(name),
  notify(msg),               // toast bottom-center
  Apps: {},                  // id -> { title, icon, render(bodyEl, api) }
  WM: {
    open(appId),             // create window running Apps[appId], tile
    gotoWS(n),               // 1..5
    wins: []                 // {id, appId, el, ws}
  }
};
// per-window api passed to render():
api = { close(), setTitle(t), winEl, notify(msg) }
```

FS helpers (core.js): `Omarchy.resolve(path) -> node|null`,
`Omarchy.listDir(node) -> [{name, node}]`. Paths absolute (`/home/omakase`),
`~` expands to `/home/omakase`. FS node: `{type:'dir'|'file', children?, content?}`.

## Behavior spec

- **Boot:** fullscreen overlay, mono font, ~10 fake systemd lines appear over
  ~2.2s, then fades to login.
- **Login:** centered card: avatar circle (SVG/emoji), name "omakase",
  password field (any value accepted, Enter submits), small footer
  "Unofficial fan concept — not affiliated with DHH or the Omarchy project."
- **Top bar:** left: workspace pills 1–5 (click = switch, active highlighted);
  center: clock `HH:MM` updating every 10s; right: tray icons (wifi, volume,
  battery SVG or emoji) — clicking toggles quick-settings panel:
  Wi-Fi toggle, Bluetooth toggle, Volume range slider, Brightness range slider
  (applies `filter:brightness()` to `#desktop`). Also a `?` button opening the
  shortcuts overlay and a grid button opening the launcher.
- **Tiling:** `#ws-area` below topbar. 1 window → fills area. 2+ → master-stack:
  first window left 62%, others stacked right. Window chrome: titlebar with
  title + close (×) button. Click-to-focus raises z-index. Windows are
  per-workspace; switching hides/shows. No dragging needed.
- **Launcher:** fullscreen overlay, big search input (autofocus), grid of all
  `Omarchy.Apps` (icon + title), live filter, Enter/click opens, Esc closes.
- **Shortcuts overlay:** lists: `Super+1..5` workspaces, `Super` launcher,
  `Esc` close, `Super+/` this panel, `Ctrl+Alt+T` terminal. Open via `?` button
  or `Super+/`.
- **Keyboard:** Meta+1..5 → gotoWS; Meta alone (keydown+keyup w/o other key) →
  launcher; Escape → close topmost overlay; Ctrl+Alt+T → open terminal.
  (In real browsers Meta combos may be intercepted — still implement.)
- **Mobile (<=720px):** windows become fullscreen (one visible = focused);
  topbar condenses; launcher grid larger tap targets.

## Constraints

- Zero console errors. Everything tappable. Version badge `#ver` fixed
  bottom-right, text `v2026.10.04`.
- Original copy/art only. The word "Omarchy" may appear descriptively;
  never reproduce their logo or taglines. Terminal ASCII logo must be an
  ORIGINAL geometric mark, not the real Omarchy logo.
