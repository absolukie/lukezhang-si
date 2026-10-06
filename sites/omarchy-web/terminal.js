/* omash: a small, read-only shell for the simulated desktop. */
(function () {
  'use strict';

  const HOME = '/home/omakase';
  const startedAt = Date.now();
  const commands = [
    'help', 'omarchyfetch', 'neofetch', 'ls', 'cd', 'pwd', 'cat', 'echo',
    'whoami', 'date', 'theme', 'clear', 'sudo', 'vim', 'nvim', 'rm',
    'exit', 'hack', 'about', 'motd'
  ];

  // Parse words without evaluating JavaScript, shell substitutions, or HTML.
  function words(source) {
    const result = [];
    let word = '', quote = '', escaped = false, active = false;
    for (const character of source) {
      if (escaped) {
        word += character;
        escaped = false;
      } else if (character === '\\' && quote !== "'") {
        escaped = true;
        active = true;
      } else if (quote) {
        if (character === quote) quote = '';
        else word += character;
      } else if (character === '"' || character === "'") {
        quote = character;
        active = true;
      } else if (/\s/.test(character)) {
        if (active) result.push(word);
        word = '';
        active = false;
      } else {
        word += character;
        active = true;
      }
    }
    if (quote) throw new Error('Unclosed quote — close it and try again.');
    if (escaped) throw new Error('Trailing backslash — finish the escape and try again.');
    if (active) result.push(word);
    return result;
  }

  Omarchy.Apps.terminal = {
    title: 'Terminal',
    icon: '⌨️',
    render(body, api) {
      let cwd = HOME, previous = HOME, historyIndex = 0, draft = '';
      let busy = false;
      const history = [], timers = [];

      function element(tag, className, text, style) {
        const el = document.createElement(tag);
        el.className = className;
        if (text !== undefined) el.textContent = text;
        if (style) Object.assign(el.style, style);
        return el;
      }

      // Keep this app's layout local; desktop/window styling belongs to core.
      const terminal = element('div', 'terminal', undefined, {
        display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
        flex: '1 1 0%', minHeight: '0', minWidth: '0', boxSizing: 'border-box',
        background: 'var(--term-bg)', color: 'var(--term-fg)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '13px', lineHeight: '1.65', padding: '16px',
        overflow: 'hidden', touchAction: 'manipulation'
      });
      terminal.setAttribute('aria-label', 'Terminal running omash, a simulated shell');
      const screen = element('div', 'terminal-screen', undefined, {
        flex: '1 1 auto', minHeight: '0', overflow: 'auto',
        overscrollBehavior: 'contain', scrollbarWidth: 'thin'
      });
      const output = element('div', 'terminal-output');
      output.setAttribute('role', 'log');
      output.setAttribute('aria-label', 'Terminal output');
      output.setAttribute('aria-live', 'polite');
      output.setAttribute('aria-relevant', 'additions');
      const form = element('form', 'terminal-input-line', undefined, {
        display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 8px',
        padding: '4px 0 8px', margin: '0', minHeight: '32px'
      });
      const prompt = element('span', 'terminal-prompt', undefined, {
        whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxWidth: '100%'
      });
      const input = element('input', 'terminal-input', undefined, {
        flex: '1 1 120px', width: '120px', minWidth: '80px', minHeight: '32px',
        padding: '0', margin: '0', border: '0', borderRadius: '0', outline: 'none',
        background: 'transparent', color: 'var(--term-fg)',
        caretColor: 'var(--accent)', fontFamily: 'inherit', fontSize: '16px',
        lineHeight: 'inherit', boxShadow: 'none', touchAction: 'manipulation'
      });
      input.type = 'text';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('enterkeyhint', 'send');
      input.setAttribute('aria-label', 'Shell command');
      form.append(prompt, input);
      screen.append(output, form);
      terminal.append(screen);
      body.replaceChildren(terminal);

      const shortPath = () => cwd === HOME ? '~' : cwd.startsWith(HOME + '/') ? '~' + cwd.slice(HOME.length) : cwd;
      function fillPrompt(target) {
        target.replaceChildren(
          element('span', 'terminal-user', 'omakase@omarchy', { color: 'var(--accent)', fontWeight: '600' }),
          document.createTextNode(':'),
          element('span', 'terminal-path', shortPath(), { color: 'var(--muted)' }),
          document.createTextNode('$')
        );
      }
      function refreshPrompt() {
        fillPrompt(prompt);
        input.setAttribute('aria-label', 'Shell command in ' + shortPath());
        if (api && typeof api.setTitle === 'function') api.setTitle('Terminal — ' + shortPath());
      }
      function scroll() { screen.scrollTop = screen.scrollHeight; }
      function append(node) {
        output.append(node);
        while (output.childElementCount > 800) output.firstElementChild.remove();
        scroll();
        return node;
      }
      function print(text, color) {
        return append(element('div', 'terminal-line', String(text), {
          whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', minHeight: '1.65em',
          ...(color ? { color: color } : {})
        }));
      }
      const fail = text => print(text, 'var(--accent2)');
      function record(command) {
        const line = element('div', 'terminal-command', undefined, {
          whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: '6px'
        });
        fillPrompt(line);
        line.append(document.createTextNode(' ' + command));
        append(line);
      }
      function absolute(path) {
        let value = path;
        if (value === '~' || value.startsWith('~/')) value = HOME + value.slice(1);
        if (!value.startsWith('/')) value = cwd + '/' + value;
        const parts = [];
        for (const part of value.split('/')) {
          if (part === '..') parts.pop();
          else if (part && part !== '.') parts.push(part);
        }
        return '/' + parts.join('/');
      }
      function lookup(path, command) {
        if (!path) { fail(command + ': No such file or directory'); return null; }
        const node = Omarchy.resolve(absolute(path));
        if (!node) fail(command + ': ' + path + ': No such file or directory');
        else if (path.endsWith('/') && node.type !== 'dir') {
          fail(command + ': ' + path + ': Not a directory');
          return null;
        }
        return node;
      }
      function currentTheme() {
        const style = window.getComputedStyle(document.documentElement);
        const keys = ['--term-bg', '--accent', '--bg'];
        const found = Object.entries(window.THEMES).find(([, theme]) =>
          keys.every(key => style.getPropertyValue(key).trim().toLowerCase() === theme.vars[key].trim().toLowerCase())
        );
        return found ? found[0] : 'custom';
      }
      function uptime() {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        return Math.floor(seconds / 3600) + 'h ' + Math.floor(seconds % 3600 / 60) + 'm ' + seconds % 60 + 's';
      }
      function fetch() {
        const card = element('div', 'terminal-fetch', undefined, {
          display: 'flex', flexWrap: 'wrap', gap: '12px 28px', margin: '10px 0 14px', alignItems: 'center'
        });
        // Original offset crystal lattice: drawn specifically for this demo.
        card.append(element('pre', 'terminal-logo', [
          '       +-----+',
          '      /     /|',
          '  +--+-----+ |',
          ' /  /|     | +',
          '+--+ |  +--+/ ',
          '|  | +--+  /  ',
          '|  |/   | /   ',
          '+--+----+/    '
        ].join('\n'), {
          margin: '0', font: 'inherit', lineHeight: '1.25', color: 'var(--accent)', userSelect: 'text'
        }));
        const specs = element('div', 'terminal-specs', undefined, { minWidth: '0', overflowWrap: 'anywhere' });
        specs.append(element('div', '', 'omakase@omarchy', { color: 'var(--accent)', fontWeight: '700' }));
        const theme = currentTheme();
        const entries = [
          ['OS', 'Omarchy Web'], ['Kernel', 'Linux 6.14-web (simulated)'],
          ['Shell', 'omash'], ['DE', 'Hyprland (simulated)'],
          ['Theme', window.THEMES[theme] ? window.THEMES[theme].label + ' (' + theme + ')' : theme],
          ['Uptime', uptime()], ['CPU', '1 × imagination @ 5.0 GHz (simulated)'],
          ['Memory', '128 MiB / unlimited possibility (simulated)']
        ];
        for (const [label, value] of entries) {
          const row = element('div', '');
          row.append(element('span', '', label + ': ', { color: 'var(--accent2)' }), document.createTextNode(value));
          specs.append(row);
        }
        const palette = element('div', 'terminal-palette', undefined, { display: 'flex', gap: '4px', marginTop: '8px' });
        palette.setAttribute('aria-hidden', 'true');
        for (const color of ['--accent', '--accent2', '--term-fg', '--muted', '--fg', '--border']) {
          palette.append(element('span', '', '  ', { background: 'var(' + color + ')', width: '22px', height: '8px' }));
        }
        specs.append(palette);
        card.append(specs);
        append(card);
      }
      function motd() {
        print('Welcome to omash. Small shell. Big desktop energy.', 'var(--accent)');
        print("Try 'help', 'ls -a', or 'theme list'. Tab completes; ↑/↓ recall; Ctrl+L clears.", 'var(--muted)');
      }
      function stopHack() {
        timers.forEach(timer => window.clearTimeout(timer));
        timers.length = 0;
        busy = false;
        input.readOnly = false;
        input.placeholder = '';
        input.removeAttribute('aria-busy');
      }
      function hack() {
        const lines = [
          '[simulated] Locating the mainframe…',
          '[████░░░░░░] Negotiating with the coffee machine…',
          '[███████░░░] Bypassing absolutely no security…',
          '[██████████] ACCESS GRANTED: the coffee is decaf.',
          'Hack complete. No packets sent. One illusion shattered.'
        ];
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          lines.forEach(line => print(line));
          return;
        }
        busy = true;
        input.readOnly = true;
        input.placeholder = 'Working… Ctrl+C to cancel';
        input.setAttribute('aria-busy', 'true');
        print(lines[0], 'var(--accent)');
        lines.slice(1).forEach((line, index) => {
          timers.push(window.setTimeout(() => {
            if (!terminal.isConnected) { stopHack(); return; }
            print(line, index === 3 ? 'var(--accent2)' : undefined);
            if (index === 3) stopHack();
          }, 300 * (index + 1)));
        });
      }
      function run(source) {
        let tokens;
        try { tokens = words(source); }
        catch (error) { fail('omash: ' + error.message); return; }
        if (!tokens.length) return;
        const [command, ...args] = tokens;
        switch (command) {
          case 'help':
            print([
              'omash — a friendly simulated shell',
              '',
              'EXPLORE  ls [-a] [path] · cd [dir] · pwd · cat <file>…',
              'DESKTOP  theme [list|name] · omarchyfetch (or neofetch)',
              'BASICS   echo <text> · whoami · date · clear',
              'EXTRAS   about · motd · hack · sudo · vim / nvim · rm · exit',
              '',
              '↑/↓ history · Tab completion · Ctrl+L clear · Ctrl+C cancel',
              'Paths support ~, .., and quotes. cd - returns to the last directory.',
              'This tiny shell has no pipes, redirects, or real system access.'
            ].join('\n'));
            break;
          case 'omarchyfetch': case 'neofetch': fetch(); break;
          case 'motd': motd(); break;
          case 'about':
            print('Omarchy Web — an unofficial fan-made desktop concept.');
            print('Not affiliated with DHH or the Omarchy project. Everything here runs in your browser.');
            break;
          case 'pwd': print(cwd); break;
          case 'whoami': print('omakase'); break;
          case 'date': print(new Date().toString()); break;
          case 'echo': print(args.join(' ')); break;
          case 'clear': output.replaceChildren(); break;
          case 'cd': {
            if (args.length > 1) { fail('cd: too many arguments'); break; }
            const path = args.length ? args[0] === '-' ? previous : args[0] : HOME;
            const node = lookup(path, 'cd');
            if (!node) break;
            if (node.type !== 'dir') { fail('cd: ' + path + ': Not a directory'); break; }
            previous = cwd;
            cwd = absolute(path);
            if (args[0] === '-') print(cwd);
            refreshPrompt();
            break;
          }
          case 'ls': {
            let hidden = false, options = true;
            const paths = [];
            for (const arg of args) {
              if (options && arg === '--') options = false;
              else if (options && (arg === '-a' || arg === '-A' || arg === '--all')) hidden = true;
              else if (options && arg.startsWith('-')) { fail('ls: unsupported option ' + arg + ' — try ls -a'); return; }
              else paths.push(arg);
            }
            if (!paths.length) paths.push('.');
            paths.forEach((path, index) => {
              if (index) print('');
              const node = lookup(path, 'ls');
              if (!node) return;
              if (paths.length > 1) print(path + ':', 'var(--muted)');
              if (node.type === 'file') { print(path); return; }
              const entries = Omarchy.listDir(node).filter(entry => hidden || !entry.name.startsWith('.'));
              entries.sort((a, b) => (a.node.type === 'dir' ? 0 : 1) - (b.node.type === 'dir' ? 0 : 1) || a.name.localeCompare(b.name));
              const listing = element('div', 'terminal-listing', undefined, { display: 'flex', flexWrap: 'wrap', gap: '0 20px' });
              entries.forEach(entry => listing.append(element('span', '', entry.name + (entry.node.type === 'dir' ? '/' : ''), {
                color: entry.node.type === 'dir' ? 'var(--accent)' : 'var(--term-fg)', overflowWrap: 'anywhere'
              })));
              if (entries.length) append(listing);
            });
            break;
          }
          case 'cat':
            if (!args.length) { fail('cat: usage: cat <file>…'); break; }
            args.forEach(path => {
              const node = lookup(path, 'cat');
              if (!node) return;
              if (node.type === 'dir') fail('cat: ' + path + ': Is a directory');
              else print(node.content == null ? '' : node.content);
            });
            break;
          case 'theme': {
            if (args.length > 1) { fail('theme: usage: theme [list|name]'); break; }
            if (!args.length || args[0] === 'list') {
              const current = currentTheme();
              Object.entries(window.THEMES).forEach(([name, theme]) =>
                print((name === current ? '● ' : '  ') + name.padEnd(14) + theme.label, name === current ? 'var(--accent)' : undefined)
              );
              print('Apply with: theme <name>', 'var(--muted)');
            } else if (Object.prototype.hasOwnProperty.call(window.THEMES, args[0])) {
              Omarchy.setTheme(args[0]);
              print('Theme set to ' + window.THEMES[args[0]].label + '. Looking sharp.', 'var(--accent)');
            } else fail('theme: ' + args[0] + ": unknown theme — try 'theme list'");
            break;
          }
          case 'sudo': fail('omakase is not in the sudoers file. This incident has been reported to the houseplant.'); break;
          case 'vim': case 'nvim':
            print(command + ': You have entered the editor in spirit. For once, :q actually works.');
            print('Your files are safe. Your muscle memory is confused.');
            break;
          case 'rm': fail('rm: refused. This filesystem is a museum; please leave the exhibits attached.'); break;
          case 'exit': print('There is no escape. There is, however, a close button.'); break;
          case 'hack': hack(); break;
          default: fail(command + ": command not found — try 'help'");
        }
      }

      function setInput(value) {
        input.value = value;
        input.setSelectionRange(value.length, value.length);
      }
      function complete() {
        // Leave quoted/escaped input intact; simple paths cover the built-in FS.
        const prefix = input.value.slice(0, input.selectionStart);
        if (input.selectionStart !== input.value.length || /["'\\]/.test(prefix)) return;
        const parts = prefix.split(/\s+/);
        const partial = parts.pop();
        let choices = [];
        if (!parts.length) choices = commands.filter(command => command.startsWith(partial));
        else if (parts[0] === 'theme') choices = ['list', ...Object.keys(window.THEMES)].filter(name => name.startsWith(partial));
        else {
          const slash = partial.lastIndexOf('/');
          const base = slash < 0 ? '' : partial.slice(0, slash + 1);
          const leaf = partial.slice(slash + 1);
          const node = Omarchy.resolve(absolute(base || '.'));
          if (node && node.type === 'dir') choices = Omarchy.listDir(node)
            .filter(entry => entry.name.startsWith(leaf) && (!entry.name.startsWith('.') || leaf.startsWith('.')) && (parts[0] !== 'cd' || entry.node.type === 'dir'))
            .map(entry => base + entry.name + (entry.node.type === 'dir' ? '/' : ''));
        }
        choices.sort();
        if (!choices.length) return;
        let common = choices[0];
        while (!choices.every(choice => choice.startsWith(common))) common = common.slice(0, -1);
        if (choices.length === 1 || common.length > partial.length) {
          setInput(prefix.slice(0, prefix.length - partial.length) + common + (choices.length === 1 && !common.endsWith('/') ? ' ' : ''));
        } else {
          record(input.value);
          print(choices.join('  '), 'var(--muted)');
        }
        scroll();
      }
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (busy) return;
        const source = input.value;
        record(source);
        input.value = '';
        if (source.trim() && history[history.length - 1] !== source) {
          history.push(source);
          if (history.length > 300) history.shift();
        }
        historyIndex = history.length;
        draft = '';
        run(source);
        scroll();
      });
      input.addEventListener('keydown', event => {
        if (event.isComposing) return;
        if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'l') {
          event.preventDefault();
          event.stopPropagation();
          output.replaceChildren();
          scroll();
        } else if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'c') {
          if (window.getSelection().toString() || input.selectionStart !== input.selectionEnd) return;
          event.preventDefault();
          stopHack();
          record(input.value + '^C');
          input.value = '';
          historyIndex = history.length;
          draft = '';
        } else if (!busy && !event.ctrlKey && !event.altKey && !event.metaKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          event.preventDefault();
          if (historyIndex === history.length) draft = input.value;
          historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
          setInput(historyIndex === history.length ? draft : history[historyIndex]);
        } else if (!busy && event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
          event.preventDefault();
          complete();
        }
      });
      terminal.addEventListener('click', event => {
        if (event.target !== input && !window.getSelection().toString()) input.focus({ preventScroll: true });
      });
      refreshPrompt();
      fetch();
      motd();
      input.focus({ preventScroll: true });
      scroll();
    }
  };
})();
