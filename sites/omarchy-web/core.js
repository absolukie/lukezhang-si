/* Desktop shell for an unofficial, entirely simulated Omarchy web concept. */
(function () {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
  const themes = window.THEMES || {};
  const wallpapers = window.WALLPAPERS || [];
  const wins = [];
  const workspaceFocus = new Map();
  const overlays = [];
  let workspace = 1, serial = 0, focusOrder = 0, overlayOrder = 500;
  let loggedIn = false, toastTimer, metaPressed = false, metaUsed = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, className, action) {
    const node = el('button', className, label);
    node.type = 'button';
    if (action) node.addEventListener('click', action);
    return node;
  }
  const paths = {
    wifi: '<path d="M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1"/>',
    volume: '<path d="M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M23 10v4M5 10h10v4H5z"/>',
    grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    bluetooth: '<path d="m7 7 10 10-5 4V3l5 4L7 17"/>'
  };
  function icon(name) {
    const wrapper = el('span');
    wrapper.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
    return wrapper.firstElementChild;
  }
  function readSetting(key) {
    try { return localStorage.getItem('omarchy-' + key); } catch (_) { return null; }
  }
  function saveSetting(key, value) {
    try { localStorage.setItem('omarchy-' + key, value); } catch (_) { /* Storage can be disabled. */ }
  }

  const desktop = el('main');
  desktop.id = 'desktop';
  desktop.hidden = true;
  desktop.setAttribute('aria-label', 'Simulated Omarchy desktop');
  const topbar = el('header');
  topbar.id = 'topbar';
  const workspaces = el('nav', 'workspaces');
  workspaces.setAttribute('aria-label', 'Workspaces');
  const workspaceButtons = Array.from({ length: 5 }, (_, i) => {
    const node = button(String(i + 1), 'workspace-pill', () => gotoWS(i + 1));
    node.setAttribute('aria-label', 'Workspace ' + (i + 1));
    node.title = 'Workspace ' + (i + 1) + ' · Super+' + (i + 1);
    workspaces.append(node);
    return node;
  });
  const clock = el('time');
  clock.id = 'clock';
  function updateClock() {
    const now = new Date();
    clock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    clock.dateTime = now.toISOString();
    clock.title = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  updateClock();
  window.setInterval(updateClock, 10000);
  const tray = el('nav', 'tray');
  tray.setAttribute('aria-label', 'Desktop controls');
  const trayButton = button('', 'tray-status', () => toggleOverlay(quicksettings));
  trayButton.setAttribute('aria-label', 'Quick settings');
  trayButton.title = 'Quick settings';
  const wifiIcon = icon('wifi');
  trayButton.append(wifiIcon, icon('volume'), icon('battery'));
  const shortcutsButton = button('?', 'icon-button', () => toggleOverlay(shortcuts));
  shortcutsButton.setAttribute('aria-label', 'Keyboard shortcuts');
  shortcutsButton.title = 'Keyboard shortcuts · Super+/';
  const launcherButton = button('', 'icon-button', () => toggleOverlay(launcher));
  launcherButton.append(icon('grid'));
  launcherButton.setAttribute('aria-label', 'Open launcher');
  launcherButton.title = 'Applications · Super';
  tray.append(trayButton, shortcutsButton, launcherButton);
  topbar.append(workspaces, clock, tray);
  const area = el('section');
  area.id = 'ws-area';
  area.setAttribute('aria-label', 'Workspace 1 windows');
  const empty = el('div', 'desktop-empty');
  const mark = el('div', 'empty-mark');
  mark.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 9; i++) mark.append(el('span'));
  empty.append(mark, el('span', 'eyebrow', 'A desktop, reimagined in the browser'), el('h1', '', 'Make room for your next idea.'), el('p', '', 'Five workspaces. A few familiar tools. Your own little corner of the web.'), button('Open applications', '', () => toggleOverlay(launcher)));
  area.append(empty);
  desktop.append(topbar, area);

  function panel(id, className, title) {
    const node = el('section', className);
    node.id = id;
    node.hidden = true;
    node.tabIndex = -1;
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', title);
    return node;
  }
  function heading(title, node) {
    const row = el('div', 'overlay-heading');
    const close = button('×', 'icon-button', () => closeOverlay(node));
    close.setAttribute('aria-label', 'Close ' + title.toLowerCase());
    row.append(el('h2', '', title), close);
    return row;
  }
  const launcher = panel('launcher', 'overlay', 'Applications');
  const launcherContent = el('div', 'launcher-content');
  const search = el('input');
  search.id = 'launcher-search';
  search.type = 'search';
  search.placeholder = 'Find an application…';
  search.autocomplete = 'off';
  search.spellcheck = false;
  search.setAttribute('aria-label', 'Search applications');
  const grid = el('div', 'launcher-grid');
  grid.setAttribute('aria-label', 'Applications');
  launcherContent.append(heading('Applications', launcher), search, grid, el('p', 'launcher-help', 'Enter to launch · Esc to return to your workspace'));
  launcher.append(launcherContent);
  search.addEventListener('input', renderLauncher);
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      const first = grid.querySelector('button');
      if (first) first.click();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const first = grid.querySelector('button');
      if (first) first.focus();
    }
  });
  function renderLauncher() {
    const query = search.value.trim().toLowerCase();
    grid.replaceChildren();
    Object.entries(window.Omarchy.Apps).forEach(([id, entry]) => {
      if (!entry || typeof entry.render !== 'function') return;
      const title = String(entry.title || id);
      if (!(title + ' ' + id).toLowerCase().includes(query)) return;
      const tile = button('', 'launcher-app', () => {
        closeOverlay(launcher, false);
        open(id);
      });
      tile.dataset.app = id;
      tile.append(el('span', 'app-icon', entry.icon || '◇'), el('span', 'launcher-title', title));
      grid.append(tile);
    });
    if (!grid.childElementCount) grid.append(el('p', 'launcher-no-results', 'No applications found. Try another search.'));
  }

  const shortcuts = panel('shortcuts', 'overlay', 'Keyboard shortcuts');
  const shortcutsPanel = el('div', 'shortcuts-panel');
  const shortcutList = el('dl', 'shortcut-list');
  [ ['Switch workspaces', 'Super+1..5'], ['Open launcher', 'Super'], ['Close overlay', 'Esc'], ['This panel', 'Super+/'], ['Open terminal', 'Ctrl+Alt+T'] ].forEach(([label, keys]) => {
    const row = el('div', 'shortcut-row');
    const definition = el('dd');
    definition.append(el('kbd', '', keys));
    row.append(el('dt', '', label), definition);
    shortcutList.append(row);
  });
  shortcutsPanel.append(heading('Keyboard shortcuts', shortcuts), shortcutList, el('p', 'shortcuts-note', 'Super is the Windows or Command key. Some shortcuts may be reserved by your browser or operating system.'));
  shortcuts.append(shortcutsPanel);
  const quicksettings = panel('quicksettings', '', 'Quick settings');
  quicksettings.append(heading('Quick settings', quicksettings));
  const toggles = el('div', 'quick-toggles');
  function toggle(label, iconName, initial, onChange) {
    let enabled = initial;
    const node = button('', 'quick-toggle', () => {
      enabled = !enabled;
      node.setAttribute('aria-pressed', String(enabled));
      if (onChange) onChange(enabled);
    });
    node.setAttribute('aria-pressed', String(enabled));
    node.append(icon(iconName), el('span', '', label));
    return node;
  }
  toggles.append(toggle('Wi-Fi', 'wifi', true, enabled => wifiIcon.classList.toggle('offline', !enabled)), toggle('Bluetooth', 'bluetooth', false));
  quicksettings.append(toggles);
  function slider(label, value, min, onChange) {
    const wrapper = el('label', 'slider-control');
    const row = el('span', 'slider-heading');
    const output = el('output', '', value + '%');
    const input = el('input');
    input.type = 'range';
    input.min = String(min);
    input.max = '100';
    input.value = String(value);
    input.setAttribute('aria-label', label);
    input.addEventListener('input', () => {
      output.value = input.value + '%';
      onChange(Number(input.value));
    });
    row.append(el('span', '', label), output);
    wrapper.append(row, input);
    return wrapper;
  }
  quicksettings.append(slider('Volume', 65, 0, value => {
    trayButton.setAttribute('aria-label', 'Quick settings · Volume ' + value + '%');
  }), slider('Brightness', 100, 20, value => {
    desktop.style.filter = 'brightness(' + value / 100 + ')';
  }), el('p', 'quick-note', 'Simulated controls · changes stay in this desktop.'));
  const overlayTriggers = new Map([[launcher, launcherButton], [shortcuts, shortcutsButton], [quicksettings, trayButton]]);
  overlayTriggers.forEach((trigger, node) => {
    trigger.setAttribute('aria-controls', node.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'dialog');
    node.addEventListener('click', event => {
      if (event.target === node && node !== quicksettings) closeOverlay(node);
    });
  });
  function openOverlay(node) {
    if (!loggedIn || !node.hidden) return;
    if (node === launcher) { search.value = ''; renderLauncher(); }
    node._returnFocus = document.activeElement;
    node.hidden = false;
    node.style.zIndex = String(++overlayOrder);
    overlays.push(node);
    overlayTriggers.get(node).setAttribute('aria-expanded', 'true');
    (node === launcher ? search : node.querySelector('button') || node).focus();
  }
  function closeOverlay(node, restoreFocus = true) {
    if (node.hidden) return;
    node.hidden = true;
    const index = overlays.indexOf(node);
    if (index !== -1) overlays.splice(index, 1);
    overlayTriggers.get(node).setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      const target = node._returnFocus;
      if (target && target.isConnected && !target.closest('[hidden]')) target.focus();
      else focusCurrentWindow();
    }
  }
  function toggleOverlay(node) { if (node.hidden) openOverlay(node); else closeOverlay(node); }
  document.addEventListener('pointerdown', event => {
    if (overlays[overlays.length - 1] === quicksettings && !quicksettings.contains(event.target) && !trayButton.contains(event.target)) closeOverlay(quicksettings, false);
  });

  const toast = el('div');
  toast.id = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = String(message);
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => { toast.classList.remove('visible'); toast.textContent = ''; }, 3500);
  }
  function setTheme(name) {
    if (!own(themes, name) || !themes[name].vars) return false;
    Object.entries(themes[name].vars).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    document.documentElement.dataset.theme = name;
    saveSetting('theme', name);
    return true;
  }
  function setWallpaper(name) {
    const entries = Array.isArray(wallpapers) ? wallpapers : Object.values(wallpapers);
    const wallpaper = entries.find(entry => entry.name.toLowerCase() === String(name).toLowerCase());
    if (!wallpaper) return false;
    desktop.style.background = wallpaper.css;
    desktop.dataset.wallpaper = wallpaper.name;
    saveSetting('wallpaper', wallpaper.name);
    return true;
  }
  function resolve(path) {
    if (typeof path !== 'string' || !path) return null;
    path = path.replace(/^~(?=\/|$)/, '/home/omakase');
    if (!path.startsWith('/')) return null;
    let node = window.FS;
    const parents = [];
    for (const part of path.split('/').filter(Boolean)) {
      if (!node || node.type !== 'dir') return null;
      if (part === '.') continue;
      if (part === '..') { node = parents.length ? parents.pop() : node; continue; }
      if (!own(node.children, part)) return null;
      parents.push(node);
      node = node.children[part];
    }
    if (path.endsWith('/') && node && node.type !== 'dir') return null;
    return node || null;
  }
  function listDir(node) {
    return node && node.type === 'dir' ? Object.entries(node.children || {}).map(([name, child]) => ({ name, node: child })) : [];
  }
  function focusWindow(win) {
    if (!wins.includes(win) || win.ws !== workspace) return;
    workspaceFocus.set(workspace, win.id);
    wins.forEach(item => item.el.classList.toggle('focused', item.ws === workspace && item.id === win.id));
    win.el.style.zIndex = String(++focusOrder);
  }
  function focusCurrentWindow() {
    const win = wins.find(item => item.id === workspaceFocus.get(workspace));
    if (!win) return;
    const target = win.el.querySelector('.window-body input:not([disabled]), .window-body textarea:not([disabled]), .window-body button:not([disabled])');
    (target || win.el).focus({ preventScroll: true });
  }
  function tile() {
    const visible = wins.filter(win => win.ws === workspace);
    if (!visible.some(win => win.id === workspaceFocus.get(workspace)) && visible.length) workspaceFocus.set(workspace, visible[visible.length - 1].id);
    wins.forEach(win => {
      win.el.hidden = win.ws !== workspace;
      win.el.classList.toggle('focused', win.ws === workspace && win.id === workspaceFocus.get(workspace));
    });
    visible.forEach((win, index) => {
      const style = win.el.style;
      if (visible.length === 1) Object.assign(style, { left: '0', top: '0', width: '100%', height: '100%' });
      else if (index === 0) Object.assign(style, { left: '0', top: '0', width: 'calc(62% - 6px)', height: '100%' });
      else {
        const count = visible.length - 1;
        Object.assign(style, {
          left: 'calc(62% + 6px)', width: 'calc(38% - 6px)',
          top: 'calc(' + ((index - 1) * 100 / count) + '% + ' + ((index - 1) * 12 / count) + 'px)',
          height: 'calc(' + (100 / count) + '% - ' + ((count - 1) * 12 / count) + 'px)'
        });
      }
    });
    empty.hidden = visible.length > 0;
    workspaceButtons.forEach((node, i) => {
      node.classList.toggle('active', i + 1 === workspace);
      node.classList.toggle('occupied', wins.some(win => win.ws === i + 1));
      node.setAttribute('aria-current', i + 1 === workspace ? 'true' : 'false');
    });
    area.setAttribute('aria-label', 'Workspace ' + workspace + ' windows');
  }
  function gotoWS(n) {
    n = Number(n);
    if (!Number.isInteger(n) || n < 1 || n > 5) return;
    workspace = n;
    tile();
    if (!overlays.length) focusCurrentWindow();
  }
  function open(appId) {
    if (!own(window.Omarchy.Apps, appId)) { notify('Application not found: ' + appId); return null; }
    const entry = window.Omarchy.Apps[appId];
    if (!entry || typeof entry.render !== 'function') { notify('This application is unavailable.'); return null; }
    const node = el('article', 'window');
    node.tabIndex = -1;
    const id = 'window-' + (++serial);
    node.id = id;
    const titlebar = el('header', 'titlebar window-titlebar');
    const title = el('span', 'window-title', entry.title || appId);
    title.id = id + '-title';
    node.setAttribute('aria-labelledby', title.id);
    const body = el('div', 'window-body');
    const win = { id, appId, el: node, ws: workspace };
    function close() {
      const index = wins.indexOf(win);
      if (index === -1) return;
      wins.splice(index, 1);
      node.remove();
      tile();
      if (!overlays.length) focusCurrentWindow();
    }
    const closeButton = button('×', 'window-close', close);
    closeButton.setAttribute('aria-label', 'Close ' + (entry.title || appId));
    titlebar.append(title, closeButton);
    node.append(titlebar, body);
    node.addEventListener('pointerdown', () => focusWindow(win));
    node.addEventListener('focusin', () => focusWindow(win));
    wins.push(win);
    area.append(node);
    focusWindow(win);
    tile();
    try {
      entry.render(body, { close, setTitle(text) { title.textContent = String(text); }, winEl: node, notify });
    } catch (_) {
      body.replaceChildren(el('p', 'app-error', 'This application could not start. Close it and try again.'));
      notify('Could not open ' + (entry.title || appId) + '.');
    }
    if (!overlays.length && !node.contains(document.activeElement)) focusCurrentWindow();
    return win;
  }
  window.Omarchy = { setTheme, setWallpaper, notify, Apps: {}, WM: { open, gotoWS, wins }, resolve, listDir };

  const login = el('section');
  login.id = 'login';
  login.hidden = true;
  const loginForm = el('form', 'login-card');
  const avatar = el('div', 'avatar');
  avatar.append(icon('user'));
  const passwordLabel = el('label', '', 'Password');
  passwordLabel.htmlFor = 'login-password';
  const password = el('input');
  password.id = 'login-password';
  password.type = 'password';
  password.autocomplete = 'current-password';
  password.placeholder = 'Enter any password';
  const submit = button('Sign in →', 'primary-button');
  submit.type = 'submit';
  loginForm.append(avatar, el('h1', '', 'omakase'), el('p', 'login-caption', 'Your browser desktop awaits.'), passwordLabel, password, submit, el('p', 'login-hint', 'A simulation. Any password works.'));
  login.append(loginForm, el('footer', 'login-footer', 'Unofficial fan concept — not affiliated with DHH or the Omarchy project.'));
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    password.value = '';
    login.hidden = true;
    desktop.hidden = false;
    loggedIn = true;
    tile();
    launcherButton.focus();
  });
  const boot = el('section');
  boot.id = 'boot';
  boot.setAttribute('aria-label', 'Starting simulated desktop');
  boot.append(el('h1', 'boot-heading', 'omarchy-web / simulated startup'));
  const bootLog = el('div', 'boot-log');
  boot.append(bootLog, el('span', 'boot-cursor', '▌'));
  const version = el('span', '', 'v2026.10.04');
  version.id = 'ver';
  app.replaceChildren(desktop, launcher, shortcuts, quicksettings, login, boot, toast, version);
  if (!setTheme(readSetting('theme'))) setTheme(own(themes, 'tokyo-night') ? 'tokyo-night' : Object.keys(themes)[0]);
  if (!setWallpaper(readSetting('wallpaper'))) setWallpaper(Array.isArray(wallpapers) && wallpapers[0] ? wallpapers[0].name : 'Aurora');
  tile();
  const bootLines = [
    'Reached target Local File Systems.', 'Started Virtual Device Manager.',
    'Mounted /home/omakase.', 'Started Simulated Network Service.',
    'Loaded desktop color palette.', 'Started User Session Manager.',
    'Prepared five virtual workspaces.', 'Started Browser Compositor.',
    'Reached target Graphical Interface.', 'Ready. Welcome, omakase.'
  ];
  bootLines.forEach((line, i) => window.setTimeout(() => {
    const row = el('div', 'boot-line');
    row.append(el('span', 'boot-ok', '[  OK  ] '), document.createTextNode(line));
    bootLog.append(row);
  }, i * 220));
  window.setTimeout(() => {
    login.hidden = false;
    boot.classList.add('leaving');
    window.setTimeout(() => { boot.remove(); password.focus(); }, 350);
  }, 2200);

  document.addEventListener('keydown', event => {
    if (!loggedIn || event.isComposing) return;
    if (event.key === 'Meta') {
      if (!event.repeat) { metaPressed = true; metaUsed = event.ctrlKey || event.altKey || event.shiftKey; }
      return;
    }
    if (metaPressed || event.metaKey) metaUsed = true;
    if (event.metaKey && /^[1-5]$/.test(event.key)) {
      event.preventDefault();
      if (!event.repeat) gotoWS(Number(event.key));
    } else if (event.metaKey && (event.key === '/' || event.code === 'Slash')) {
      event.preventDefault();
      if (!event.repeat) toggleOverlay(shortcuts);
    } else if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      if (!event.repeat) {
        overlays.slice().reverse().forEach(node => closeOverlay(node, false));
        open('terminal');
      }
    } else if (event.key === 'Escape' && overlays.length) {
      event.preventDefault();
      closeOverlay(overlays[overlays.length - 1]);
    } else if (event.key === 'Tab' && overlays.length) {
      const top = overlays[overlays.length - 1];
      const focusable = Array.from(top.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !top.contains(document.activeElement))) {
        event.preventDefault();
        if (last) last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !top.contains(document.activeElement))) {
        event.preventDefault();
        if (first) first.focus();
      }
    }
  });
  document.addEventListener('keyup', event => {
    if (event.key !== 'Meta') return;
    if (loggedIn && metaPressed && !metaUsed) { event.preventDefault(); toggleOverlay(launcher); }
    metaPressed = false;
    metaUsed = false;
  });
  window.addEventListener('blur', () => { metaPressed = false; metaUsed = false; });
})();
