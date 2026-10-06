/* App layout belongs to styles.css. Dynamic previews use the supplied theme data. */
(function () {
  'use strict';
  const O = window.Omarchy;
  const HOME = '/home/omakase';
  const VERSION = 'v2026.10.04';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, action, className) {
    const node = el('button', className || 'app-button', text);
    node.type = 'button';
    node.style.touchAction = 'manipulation';
    node.addEventListener('click', action);
    return node;
  }
  function mount(body, name) {
    body.replaceChildren();
    const root = el('section', 'app-content ' + name + '-app');
    body.append(root);
    return root;
  }
  function palette(theme) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 28');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '28');
    svg.setAttribute('aria-hidden', 'true');
    ['--bg', '--fg', '--accent', '--accent2'].forEach((key, i) => {
      const dot = document.createElementNS(svg.namespaceURI, 'circle');
      dot.setAttribute('cx', String(15 + i * 30));
      dot.setAttribute('cy', '14');
      dot.setAttribute('r', '10');
      dot.setAttribute('fill', theme.vars[key]);
      svg.append(dot);
    });
    return svg;
  }

  O.Apps.files = {
    title: 'Files', icon: '📁',
    render(body, api) {
      const root = mount(body, 'files');
      const toolbar = el('div', 'files-toolbar app-toolbar');
      const crumbs = el('nav', 'files-breadcrumbs');
      crumbs.setAttribute('aria-label', 'Folder path');
      const up = button('↑ Up', () => open(parent(path)));
      toolbar.append(up, crumbs);
      const layout = el('div', 'files-layout');
      const sidebar = el('nav', 'files-sidebar');
      sidebar.setAttribute('aria-label', 'Places');
      const main = el('div', 'files-main');
      const places = [];
      let path = HOME;
      function parent(value) { return value.slice(0, value.lastIndexOf('/')) || '/'; }
      ['Home', 'Documents', 'Downloads', 'Pictures', '.config'].forEach(name => {
        const target = name === 'Home' ? HOME : HOME + '/' + name;
        const entry = button(name, () => open(target), 'files-place');
        places.push({ entry, target });
        sidebar.append(entry);
      });
      layout.append(sidebar, main);
      root.append(toolbar, layout);
      function open(target) {
        const node = O.resolve(target);
        if (!node) { api.notify('That path is unavailable.'); return; }
        path = target;
        api.setTitle('Files — ' + path);
        up.disabled = path === '/';
        crumbs.replaceChildren(button('/', () => open('/'), 'breadcrumb'));
        let cumulative = '';
        path.split('/').filter(Boolean).forEach(part => {
          cumulative += '/' + part;
          const destination = cumulative;
          crumbs.append(el('span', 'breadcrumb-separator', ' / '),
            button(part, () => open(destination), 'breadcrumb'));
        });
        places.forEach(({ entry, target: place }) => {
          const active = path === place || (place !== HOME && path.startsWith(place + '/'));
          entry.classList.toggle('active', active);
          entry.setAttribute('aria-current', active ? 'location' : 'false');
        });
        main.replaceChildren();
        if (node.type === 'file') {
          const viewer = el('section', 'files-viewer');
          const back = button('← Back to folder', () => open(parent(target)));
          viewer.append(back, el('h2', '', target.split('/').pop()),
            el('pre', 'files-content', String(node.content == null ? '' : node.content)));
          main.append(viewer);
          return;
        }
        const entries = O.listDir(node).slice().sort((a, b) =>
          Number(b.node.type === 'dir') - Number(a.node.type === 'dir') || a.name.localeCompare(b.name));
        main.append(el('p', 'files-summary', entries.length + ' items'));
        const grid = el('div', 'files-grid');
        entries.forEach(entry => {
          const targetPath = (path === '/' ? '' : path) + '/' + entry.name;
          const item = button('', () => open(targetPath), 'file-item');
          const icon = el('span', 'file-icon', entry.node.type === 'dir' ? '📁' : '📄');
          icon.setAttribute('aria-hidden', 'true');
          item.append(icon, el('span', 'file-name', entry.name));
          item.title = (entry.node.type === 'dir' ? 'Open folder: ' : 'Read file: ') + entry.name;
          grid.append(item);
        });
        if (!entries.length) grid.append(el('p', 'empty-state', 'This folder is empty.'));
        main.append(grid);
      }
      open(HOME);
    }
  };

  O.Apps.settings = {
    title: 'Settings', icon: '⚙️',
    render(body, api) {
      const root = mount(body, 'settings');
      root.append(el('h1', '', 'Make room for your taste'),
        el('p', '', 'A different mood is one click away. Changes apply across the desktop.'));
      root.append(el('h2', '', 'Themes'));
      const themes = el('div', 'theme-grid settings-grid');
      Object.entries(window.THEMES).forEach(([name, theme]) => {
        const card = button('', () => {
          O.setTheme(name);
          themes.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === card)));
          api.notify(theme.label + ' applied');
        }, 'theme-card');
        card.append(palette(theme), el('span', 'theme-name', theme.label));
        themes.append(card);
      });
      root.append(themes, el('h2', '', 'Wallpapers'));
      const wallpapers = el('div', 'wallpaper-grid settings-grid');
      window.WALLPAPERS.forEach(wallpaper => {
        const card = button('', () => {
          O.setWallpaper(wallpaper.name);
          wallpapers.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === card)));
        }, 'wallpaper-card');
        const preview = el('div', 'wallpaper-preview', '\u00a0');
        preview.style.background = wallpaper.css;
        preview.setAttribute('aria-hidden', 'true');
        card.append(preview, el('span', '', wallpaper.name));
        wallpapers.append(card);
      });
      root.append(wallpapers, el('h2', '', 'Motion'));
      // Shared stylesheet hook: body.no-animations disables animations/transitions.
      const motion = button('', () => {
        document.body.classList.toggle('no-animations');
        updateMotion();
      }, 'settings-toggle');
      motion.setAttribute('role', 'switch');
      function updateMotion() {
        const enabled = !document.body.classList.contains('no-animations');
        motion.setAttribute('aria-checked', String(enabled));
        motion.textContent = 'Animations: ' + (enabled ? 'on' : 'off');
      }
      updateMotion();
      root.append(motion, el('h2', '', 'About'),
        el('p', '', 'omarchy-web — unofficial fan-made concept demo. Not affiliated with DHH or the Omarchy project.'),
        el('p', 'settings-version', VERSION));
    }
  };

  O.Apps.browser = {
    title: 'Browser', icon: '🌐',
    render(body, api) {
      const root = mount(body, 'browser');
      const toolbar = el('form', 'browser-toolbar app-toolbar');
      const history = [];
      let current = null;
      const back = button('← Back', () => {
        if (history.length) navigate(history.pop(), false);
      });
      const home = button('⌂ Home', () => navigate('home'));
      const address = el('input', 'browser-address');
      address.type = 'text';
      address.setAttribute('aria-label', 'Demo address');
      address.autocomplete = 'off';
      address.spellcheck = false;
      address.style.touchAction = 'manipulation';
      const go = button('Go', () => navigate(address.value));
      toolbar.append(back, home, address, go);
      toolbar.addEventListener('submit', event => { event.preventDefault(); navigate(address.value); });
      const page = el('article', 'browser-page');
      root.append(toolbar, page);
      function route(input) {
        const value = String(input).trim();
        if (['home', 'themes', 'download'].includes(value)) return value;
        try {
          const url = new URL(value.startsWith('/') ? 'https://omarchy.local' + value :
            (/^[a-z][a-z\d+.-]*:/i.test(value) ? value : 'https://' + value));
          if (!['http:', 'https:'].includes(url.protocol) || !['omarchy.local', 'omarchy.org', 'www.omarchy.org'].includes(url.hostname)) return 'missing';
          const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
          return pathname === '' ? 'home' : ['home', 'themes', 'download'].includes(pathname) ? pathname : 'missing';
        } catch (_) { return 'missing'; }
      }
      function link(text, destination) {
        const anchor = el('a', 'browser-link', text);
        anchor.href = 'https://omarchy.local/' + (destination === 'home' ? '' : destination);
        anchor.style.touchAction = 'manipulation';
        anchor.addEventListener('click', event => { event.preventDefault(); navigate(destination); });
        return anchor;
      }
      function navigate(input, push = true) {
        const next = route(input);
        if (push && current !== null && current !== next) history.push(current);
        current = next;
        address.value = next === 'missing' ? String(input) : 'https://omarchy.local/' + (next === 'home' ? '' : next);
        back.disabled = !history.length;
        api.setTitle('Browser — ' + ({ home: 'A desktop of your own', themes: 'Themes', download: 'Download', missing: 'Page unavailable' }[next]));
        page.replaceChildren();
        const nav = el('nav', 'browser-nav');
        nav.setAttribute('aria-label', 'Demo website');
        nav.append(link('omarchy-web', 'home'), document.createTextNode(' · '), link('Themes', 'themes'), document.createTextNode(' · '), link('Download', 'download'));
        page.append(nav, el('p', 'browser-notice', 'Unofficial concept · simulated website · no external browsing'));
        if (next === 'home') {
          page.append(el('p', 'browser-eyebrow', 'A little order. A lot of possibility.'),
            el('h1', 'browser-headline', 'A desktop that leaves room for you.'),
            el('p', 'browser-description', 'Arrange a few windows. Find your favorite colors. Follow a thought from a blank terminal to something worth keeping. This browser-sized playground imagines a day on an Omarchy-inspired desktop.'),
            link('Find your colors →', 'themes'), el('h2', '', 'Small defaults, open possibilities'),
            el('p', '', 'Files you can explore, windows that fall into place, and a new atmosphere whenever you feel like it.'),
            link('Get the imaginary edition →', 'download'));
        } else if (next === 'themes') {
          page.append(el('h1', '', 'Six ways to set the mood'), el('p', '', 'Preview the collection here. Open Settings to dress the whole desktop in your favorite palette.'));
          const grid = el('div', 'browser-theme-grid theme-grid');
          Object.values(window.THEMES).forEach(theme => {
            const card = el('section', 'browser-theme-card');
            card.append(palette(theme), el('h2', '', theme.label));
            grid.append(card);
          });
          page.append(grid, button('Open Settings', () => O.WM.open('settings')));
        } else if (next === 'download') {
          page.append(el('h1', '', 'Your download is already here.'),
            el('p', '', 'The imaginary ISO weighs exactly zero bytes. We compressed it by leaving out the operating system.'),
            el('p', '', 'This is a web demo, so there is nothing to install. Your real disks can enjoy the afternoon off.'),
            button('Download 0 bytes of possibility', () => api.notify('Download complete: one fresh idea. No files were saved.')));
        } else {
          page.append(el('h1', '', 'That address is beyond this little world.'),
            el('p', '', 'Try omarchy.local, omarchy.local/themes, or omarchy.local/download.'), link('Return home', 'home'));
        }
        page.scrollTop = 0;
      }
      navigate('home');
    }
  };
})();
