/* omarchy-web data: themes, wallpapers, fake filesystem. Read-only for app workers. */
window.THEMES = {
  "tokyo-night": { label: "Tokyo Night", vars: {
    "--bg":"#1a1b26","--bg2":"#24283b","--fg":"#c0caf5","--muted":"#565f89",
    "--accent":"#7aa2f7","--accent2":"#bb9af7","--bar-bg":"#16161ed9","--bar-fg":"#c0caf5",
    "--win-bg":"#1a1b26","--win-fg":"#c0caf5","--titlebar-bg":"#24283b",
    "--border":"#3b4261","--term-bg":"#101018","--term-fg":"#9eceff","--radius":"10px" }},
  "catppuccin": { label: "Catppuccin Mocha", vars: {
    "--bg":"#1e1e2e","--bg2":"#313244","--fg":"#cdd6f4","--muted":"#6c7086",
    "--accent":"#cba6f7","--accent2":"#f5c2e7","--bar-bg":"#11111bd9","--bar-fg":"#cdd6f4",
    "--win-bg":"#1e1e2e","--win-fg":"#cdd6f4","--titlebar-bg":"#313244",
    "--border":"#45475a","--term-bg":"#11111b","--term-fg":"#a6e3a1","--radius":"12px" }},
  "gruvbox": { label: "Gruvbox Dark", vars: {
    "--bg":"#282828","--bg2":"#3c3836","--fg":"#ebdbb2","--muted":"#928374",
    "--accent":"#fabd2f","--accent2":"#fe8019","--bar-bg":"#1d2021d9","--bar-fg":"#ebdbb2",
    "--win-bg":"#282828","--win-fg":"#ebdbb2","--titlebar-bg":"#3c3836",
    "--border":"#504945","--term-bg":"#1d2021","--term-fg":"#b8bb26","--radius":"6px" }},
  "nord": { label: "Nord", vars: {
    "--bg":"#2e3440","--bg2":"#3b4252","--fg":"#eceff4","--muted":"#616e88",
    "--accent":"#88c0d0","--accent2":"#81a1c1","--bar-bg":"#242933d9","--bar-fg":"#eceff4",
    "--win-bg":"#2e3440","--win-fg":"#eceff4","--titlebar-bg":"#3b4252",
    "--border":"#4c566a","--term-bg":"#242933","--term-fg":"#8fbcbb","--radius":"8px" }},
  "dracula": { label: "Dracula", vars: {
    "--bg":"#282a36","--bg2":"#44475a","--fg":"#f8f8f2","--muted":"#6272a4",
    "--accent":"#bd93f9","--accent2":"#ff79c6","--bar-bg":"#21222cd9","--bar-fg":"#f8f8f2",
    "--win-bg":"#282a36","--win-fg":"#f8f8f2","--titlebar-bg":"#44475a",
    "--border":"#6272a4","--term-bg":"#21222c","--term-fg":"#50fa7b","--radius":"10px" }},
  "rose-pine": { label: "Rosé Pine", vars: {
    "--bg":"#191724","--bg2":"#1f1d2e","--fg":"#e0def4","--muted":"#6e6a86",
    "--accent":"#ebbcba","--accent2":"#c4a7e7","--bar-bg":"#12111ad9","--bar-fg":"#e0def4",
    "--win-bg":"#191724","--win-fg":"#e0def4","--titlebar-bg":"#1f1d2e",
    "--border":"#403d52","--term-bg":"#12111a","--term-fg":"#9ccfd8","--radius":"14px" }}
};

window.WALLPAPERS = [
  { name: "Aurora",   css: "radial-gradient(1200px 800px at 20% 10%, #3b2f6b 0%, transparent 60%), radial-gradient(1000px 700px at 85% 80%, #0f4c5c 0%, transparent 55%), linear-gradient(160deg, #141422, #1d1b2e)" },
  { name: "Ember",    css: "radial-gradient(900px 600px at 80% 20%, #7c2d12 0%, transparent 60%), radial-gradient(700px 500px at 15% 85%, #3b1d5e 0%, transparent 55%), linear-gradient(160deg, #1c1214, #241a20)" },
  { name: "Abyss",    css: "radial-gradient(1100px 750px at 50% 0%, #123a5e 0%, transparent 60%), linear-gradient(180deg, #0b1220, #101a2c)" },
  { name: "Meadow",   css: "radial-gradient(1000px 700px at 15% 15%, #1d5e3a 0%, transparent 60%), radial-gradient(800px 600px at 90% 90%, #5e4a12 0%, transparent 55%), linear-gradient(160deg, #101a12, #16241a)" },
  { name: "Mono",     css: "linear-gradient(160deg, #1a1a1e, #232328)" }
];

/* Fake filesystem. content = plain text shown by cat / Files viewer. */
function __F(content){ return { type:"file", content }; }
function __D(children){ return { type:"dir", children }; }
window.FS = __D({
  home: __D({ omakase: __D({
    "README.md": __F("# omarchy-web\n\nA fan-made concept of the Omarchy desktop, running in your browser.\n\n- Press Super (or click the grid) to open the launcher\n- Super+1..5 switches workspaces\n- Try `omarchyfetch` in the terminal\n- Settings lets you re-skin the whole desktop live\n\nUnofficial concept. Not affiliated with DHH or the Omarchy project.\n"),
    ".config": __D({
      "omarchy": __D({
        "theme.conf": __F("# current theme\ntheme=tokyo-night\nwallpaper=aurora\n"),
        "bindings.conf": __F("# keybindings (concept)\nSUPER        = launcher\nSUPER+1..5   = workspace\nSUPER+RETURN = terminal\nSUPER+/      = shortcuts\n")
      }),
      "hypr": __D({ "hyprland.conf": __F("# hyprland, but make it web\nmaster {\n  new_status = master\n  new_on_top = true\n}\n") })
    }),
    "Documents": __D({
      "manifesto.txt": __F("The malleable OS for the age of agents.\n\nYour computer should bend to you, not the other way around.\nOmarchy starts opinionated and stays hackable: every default\nis a suggestion, every config is yours to change.\n\n(This is a fan-made concept demo. Dream big, theme bigger.)\n"),
      "todo.txt": __F("[ ] pick a theme (Settings)\n[x] open the terminal\n[ ] run omarchyfetch\n[ ] tile three windows like a pro\n[ ] tell a friend this is a web page\n")
    }),
    "Downloads": __D({ "omarchy-iso.torrent": __F("(imagine a 2.4 GB iso here)") }),
    "Pictures": __D({ "wallpapers": __D({ "aurora.png": __F("(gradient, but in your mind)") }) }),
    ".agents": __D({ "SKILLS.md": __F("# agent skills\n\n- theme-switching (instant)\n- window-tiling (master-stack)\n- omarchyfetch (mandatory)\n") })
  })})
});
