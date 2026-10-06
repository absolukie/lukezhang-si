/* DOM-stub smoke test for the Flipside v2 app (no browser). */
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) pass++; else { fail++; console.log('FAIL:', n, x || ''); } }

/* 0. static check: every $('id') in app.js exists in page.html */
(function () {
  const app = fs.readFileSync(path.join(__dirname, 'src', 'app.js'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, 'src', 'page.html'), 'utf8');
  const ids = new Set();
  app.replace(/\$\('([A-Za-z0-9]+)'\)/g, (m, id) => { ids.add(id); return m; });
  let allOk = true;
  for (const id of ids) {
    if (!page.includes('id="' + id + '"')) { allOk = false; console.log('  missing id in page.html:', id); }
  }
  ok(allOk, 'all ' + ids.size + ' getElementById targets exist in page.html');
})();

/* ---- minimal DOM stub ---- */
function makeEl(tag, id) {
  const listeners = {};
  const el = {
    tagName: (tag || 'div').toUpperCase(), id: id || '',
    children: [], style: {}, value: '', checked: false,
    _html: '', textContent: '', className: '', _attrs: {},
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {},
    appendChild(c) { el.children.push(c); return c; },
    getAttribute(n) { return el._attrs[n] != null ? el._attrs[n] : null; },
    setAttribute(n, v) { el._attrs[n] = v; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    _fire(type, ev) {
      const e = Object.assign({ target: el, preventDefault() {}, stopPropagation() {} }, ev || {});
      (listeners[type] || []).forEach(f => f(e));
    }
  };
  Object.defineProperty(el, 'innerHTML', { configurable: true, get() { return el._html; }, set(v) { el._html = v; } });
  return el;
}

const els = {};
const documentStub = {
  readyState: 'complete',
  getElementById(id) { return els[id] || (els[id] = makeEl('div', id)); },
  createElement(tag) { return makeEl(tag); },
  addEventListener() {},
  body: makeEl('body')
};

/* fake glyphs so render() wires click handlers.
 * Like a real browser, setting innerHTML discards old nodes: each render gets
 * FRESH glyph elements, so listeners never accumulate. */
let currentGlyphs = [];
function freshGlyphs() {
  currentGlyphs = [];
  for (let i = 0; i < 5; i++) {
    const g = makeEl('g');
    g._attrs['data-i'] = String(i);
    g.classList.add('glyph');
    currentGlyphs.push(g);
  }
}
els['stageInner'] = makeEl('div', 'stageInner');
freshGlyphs();
(function () {
  const st = els['stageInner'];
  Object.defineProperty(st, 'innerHTML', {
    configurable: true,
    get() { return st._html; },
    set(v) { st._html = v; freshGlyphs(); } // nodes replaced, like real DOM
  });
  st.querySelectorAll = function (sel) { return sel === '.glyph' ? currentGlyphs : []; };
})();

const sandbox = {
  console,
  document: documentStub,
  Blob: function () {}, Image: function () {},
  URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const html = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
ok(scripts.length === 2, 'built html has 2 inline scripts', 'got ' + scripts.length);
try {
  vm.runInContext(scripts[0], sandbox, { filename: 'ambigram.js' });
  vm.runInContext(scripts[1], sandbox, { filename: 'app.js' });
  ok(true, 'engine+app eval without throwing');
} catch (e) { ok(false, 'engine+app eval without throwing', e.message); }

/* 1. boot render */
ok(els['stageInner']._html.includes('<svg'), 'boot renders svg');
ok(els['stageInner']._html.includes('aria-label="ambigram of swims"'), 'default word swims rendered');
ok(els['checkline']._html.includes('upside down'), 'checkline confirms swims ambigram');

/* 2. flip */
els['flipBtn']._fire('click');
ok(els['stageInner'].classList.contains('flipped'), 'flip toggles flipped class');
els['flipBtn']._fire('click');
ok(!els['stageInner'].classList.contains('flipped'), 'flip toggles back');

/* 3. overlay */
els['overlayTog'].checked = true;
els['overlayTog']._fire('change', { target: els['overlayTog'] });
ok(els['stageInner']._html.includes('id="overlayLayer"'), 'overlay layer rendered');
ok(els['stageInner']._html.includes('rotate(180'), 'overlay uses 180 rotation');

/* 4. glyph select via tap */
currentGlyphs[2]._fire('click');
ok(els['selLabel']._html.includes('pos 3'), 'tapping glyph 3 selects it: ' + els['selLabel']._html.slice(0, 60));

/* 5. nudge */
const before = els['stageInner']._html;
els['nRight']._fire('click');
ok(els['stageInner']._html !== before, 'nudge re-renders');
ok(els['stageInner']._html.includes('translate('), 'nudge transform present');

/* 6. bad word honesty */
els['word'].value = 'crack';
els['word']._fire('input', { target: els['word'] });
ok(els['checkline'].className.includes('warn'), 'crack shows warning');
ok(els['checkline']._html.includes('Position 1'), 'crack flags position 1 (c)');

/* 7. hetero mode */
els['word'].value = 'wow';
els['word']._fire('input', { target: els['word'] });
els['hetero'].checked = true;
els['hetero']._fire('change', { target: els['hetero'] });
els['word2'].value = 'mom';
els['word2']._fire('input', { target: els['word2'] });
ok(els['checkline']._html.includes('mom'), 'hetero wow->mom confirmed');

/* 8. gallery chip */
const gal = els['gallery'];
ok(gal.children.length === 13, 'gallery has 13 verified chips', 'got ' + gal.children.length);
gal.children[0]._fire('click');
ok(els['word'].value === 'swims', 'gallery chip sets word');

/* 9. guides */
els['gGrid'].checked = true;
els['gGrid']._fire('change', { target: els['gGrid'] });
ok(els['stageInner']._html.length > 1000, 'guides render');

/* 10. tracking change re-renders with new pivot */
els['tracking'].value = '50';
els['tracking']._fire('input', { target: els['tracking'] });
ok(els['stageInner']._html.includes('viewBox="0 0 700 140"'), 'tracking=50 widens viewBox (5*100+4*50=700)');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
