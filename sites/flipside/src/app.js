/* Flipside v2 app — DOM wiring around the Ambigram pair-glyph engine.
 * Exposes window.FlipsideApp.init(doc) for tests; auto-boots in browsers. */
(function () {
  'use strict';

  var GALLERY = [
    { w: 'swims' }, { w: 'suns' }, { w: 'pod' }, { w: 'dollop' }, { w: 'yeah' },
    { w: 'passed' }, { w: 'sos' }, { w: 'dip' }, { w: 'mow' }, { w: 'lol' },
    { w: 'wow', w2: 'mom' }, { w: 'pip', w2: 'did' }, { w: 'uns', w2: 'sun' }
  ];

  var ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="#d7ff3e" stroke-width="2.4"' +
    ' stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>' +
    '<path d="M8.5 12.5l2.5 2.5 4.5-5.5"/></svg>';
  var ICON_WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.4"' +
    ' stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2.5 20h19L12 3z"/>' +
    '<path d="M12 9.5V14M12 17v.5"/></svg>';

  function init(doc) {
    var A = (typeof window !== 'undefined' ? window.Ambigram : null) ||
            (typeof globalThis !== 'undefined' ? globalThis.Ambigram : null);
    if (!A) throw new Error('Ambigram engine missing');

    function $(id) { return doc.getElementById(id); }

    var state = {
      word: 'swims', word2: 'swims', hetero: false,
      flipped: false, overlay: false, overlayOpacity: 45,
      guides: { center: false, pivot: true, grid: false },
      tracking: 30, selected: -1,
      nudge: {}
    };

    var stageInner = $('stageInner');

    function cleanWord(v) { return (v || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10); }

    function currentLayout() {
      var w2 = state.hetero ? state.word2 : null;
      return A.layoutWord(state.word, w2, state.tracking);
    }

    function updateCheck(lay) {
      var box = $('checkline');
      if (!lay.word) {
        box.className = 'checkline warn';
        box.innerHTML = ICON_WARN + '<div>Type a word above to generate its ambigram.</div>';
        return;
      }
      if (state.hetero && state.word2.length !== state.word.length) {
        box.className = 'checkline warn';
        box.innerHTML = ICON_WARN + '<div>Hetero mode needs both words at the <b>same length</b>.</div>';
        return;
      }
      if (lay.ok) {
        var target = state.hetero ? state.word2 : state.word;
        box.className = 'checkline ok';
        box.innerHTML = ICON_OK + '<div>Reads &ldquo;<b>' + target + '</b>&rdquo; upside down &mdash; ' +
          'pure rotational ambigram, ' + lay.n + ' pair-glyphs, all verified by the engine.</div>';
      } else {
        var items = lay.issues.map(function (it) {
          return '<li>Position ' + (it.index + 1) + ': &ldquo;' + it.upright + '&rdquo; &rarr; &ldquo;' +
            it.rotated + '&rdquo; &mdash; no rotational partner in the table.</li>';
        }).join('');
        box.className = 'checkline warn';
        box.innerHTML = ICON_WARN + '<div><b>Can&rsquo;t be a pure rotational ambigram.</b><ul>' +
          items + '</ul><div style="margin-top:8px">Try paired letters instead: ' +
          '<code>m&harr;w</code> <code>n&harr;u</code> <code>d&harr;p</code> <code>b&harr;q</code> ' +
          '<code>e&harr;a</code> <code>h&harr;y</code> <code>i&harr;t</code> <code>f&harr;j</code></div></div>';
      }
    }

    function render() {
      var lay = currentLayout();
      if (!lay.word) {
        stageInner.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#9a97a3">' +
          'type a word above</div>';
        stageInner.style.aspectRatio = 'auto';
        updateCheck(lay);
        return;
      }
      var svg = A.renderWordSVG(lay, {
        overlay: { on: state.overlay, opacity: state.overlayOpacity },
        guides: state.guides,
        nudge: state.nudge,
        selected: state.selected
      });
      stageInner.innerHTML = svg;
      // The svg viewBox IS the word box, so CSS center == word pivot == flip pivot.
      stageInner.style.aspectRatio = lay.width + ' / 140';
      if (state.flipped) stageInner.classList.add('flipped');
      else stageInner.classList.remove('flipped');

      var glyphs = stageInner.querySelectorAll ? stageInner.querySelectorAll('.glyph') : [];
      for (var i = 0; i < glyphs.length; i++) {
        (function (el) {
          el.addEventListener('click', function (ev) {
            if (ev && ev.stopPropagation) ev.stopPropagation();
            var idx = parseInt(el.getAttribute('data-i'), 10);
            state.selected = (state.selected === idx ? -1 : idx);
            render();
          });
        })(glyphs[i]);
      }
      updateSelLabel(lay);
      updateCheck(lay);
    }

    function updateSelLabel(lay) {
      var el = $('selLabel');
      if (state.selected < 0 || state.selected >= lay.n) { el.textContent = 'none selected'; return; }
      var gl = lay.glyphs[state.selected];
      el.innerHTML = 'letter <b>' + gl.upright + '</b> &middot; pos ' + (state.selected + 1) +
        ' &rarr; <b>' + gl.rotated + '</b>';
    }

    function ensureNudge(i) {
      if (!state.nudge[i]) state.nudge[i] = { dx: 0, dy: 0, rot: 0 };
      return state.nudge[i];
    }

    function setWord(v, which) {
      var clean = cleanWord(v);
      if (which === 2) state.word2 = clean;
      else state.word = clean;
      state.selected = -1;
      render();
    }

    /* ---- events ---- */
    $('word').addEventListener('input', function (e) { setWord(e.target.value, 1); });
    $('word2').addEventListener('input', function (e) { setWord(e.target.value, 2); });
    $('hetero').addEventListener('change', function (e) {
      state.hetero = !!e.target.checked;
      $('word2wrap').classList.toggle('hidden', !state.hetero);
      if (state.hetero && !state.word2) state.word2 = state.word;
      render();
    });

    $('flipBtn').addEventListener('click', function () {
      state.flipped = !state.flipped;
      render();
    });
    $('overlayTog').addEventListener('change', function (e) {
      state.overlay = !!e.target.checked;
      render();
    });
    $('overlayOp').addEventListener('input', function (e) {
      state.overlayOpacity = parseInt(e.target.value, 10);
      $('overlayOpOut').textContent = state.overlayOpacity + '%';
      render();
    });
    $('tracking').addEventListener('input', function (e) {
      state.tracking = parseInt(e.target.value, 10);
      $('trackingOut').textContent = state.tracking;
      render();
    });
    $('gCenter').addEventListener('change', function (e) { state.guides.center = !!e.target.checked; render(); });
    $('gPivot').addEventListener('change', function (e) { state.guides.pivot = !!e.target.checked; render(); });
    $('gGrid').addEventListener('change', function (e) { state.guides.grid = !!e.target.checked; render(); });

    function stepSel(d) {
      var lay = currentLayout();
      if (!lay.n) return;
      state.selected = (state.selected < 0) ? (d > 0 ? 0 : lay.n - 1)
        : (state.selected + d + lay.n) % lay.n;
      render();
    }
    $('prevL').addEventListener('click', function () { stepSel(-1); });
    $('nextL').addEventListener('click', function () { stepSel(1); });

    function nudge(dx, dy) {
      if (state.selected < 0) return;
      var nd = ensureNudge(state.selected);
      nd.dx += dx; nd.dy += dy;
      render();
    }
    $('nUp').addEventListener('click', function () { nudge(0, -4); });
    $('nDown').addEventListener('click', function () { nudge(0, 4); });
    $('nLeft').addEventListener('click', function () { nudge(-4, 0); });
    $('nRight').addEventListener('click', function () { nudge(4, 0); });
    $('rotL').addEventListener('input', function (e) {
      if (state.selected < 0) return;
      ensureNudge(state.selected).rot = parseInt(e.target.value, 10);
      $('rotLOut').textContent = e.target.value + '\u00B0';
      render();
    });
    $('resetL').addEventListener('click', function () {
      if (state.selected >= 0) delete state.nudge[state.selected];
      $('rotL').value = 0; $('rotLOut').textContent = '0\u00B0';
      render();
    });
    $('resetAll').addEventListener('click', function () {
      state.nudge = {}; state.selected = -1;
      $('rotL').value = 0; $('rotLOut').textContent = '0\u00B0';
      render();
    });

    doc.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (state.selected < 0) return;
      var handled = true;
      if (e.key === 'ArrowUp') nudge(0, -4);
      else if (e.key === 'ArrowDown') nudge(0, 4);
      else if (e.key === 'ArrowLeft') nudge(-4, 0);
      else if (e.key === 'ArrowRight') nudge(4, 0);
      else handled = false;
      if (handled && e.preventDefault) e.preventDefault();
    });

    /* gallery — only words the engine itself verifies */
    (function buildGallery() {
      var gal = $('gallery');
      GALLERY.forEach(function (g) {
        var lay = A.layoutWord(g.w, g.w2 || g.w);
        if (!lay.ok) return; // assert mappability, drop failures
        var b = doc.createElement('button');
        b.className = 'btn';
        b.type = 'button';
        b.innerHTML = g.w2 ? g.w + ' <small>\u2192 ' + g.w2 + '</small>' : g.w;
        b.addEventListener('click', function () {
          state.word = g.w;
          state.word2 = g.w2 || g.w;
          state.hetero = !!g.w2;
          state.selected = -1;
          $('word').value = g.w;
          $('word2').value = state.word2;
          $('hetero').checked = state.hetero;
          $('word2wrap').classList.toggle('hidden', !state.hetero);
          var chips = gal.querySelectorAll ? gal.querySelectorAll('.btn') : [];
          for (var i = 0; i < chips.length; i++) chips[i].classList.remove('on');
          b.classList.add('on');
          render();
        });
        gal.appendChild(b);
      });
    })();

    /* pair table display */
    (function buildPairs() {
      var pg = $('pairgrid');
      A.PAIRS.forEach(function (pr) {
        var d = doc.createElement('div');
        var self = pr[0] === pr[1];
        d.className = 'pc' + (self ? ' self' : '');
        d.innerHTML = self ? '<b>' + pr[0] + '</b> ' + pr[0] : pr[0] + ' \u2194 <b>' + pr[1] + '</b>';
        pg.appendChild(d);
      });
    })();

    /* PNG export */
    $('dlBtn').addEventListener('click', function () {
      var lay = currentLayout();
      if (!lay.word) return;
      var svg = A.renderWordSVG(lay, { nudge: state.nudge, selected: -1, markBad: true });
      var W = lay.width, H = 140, PX = 2048;
      var PH = Math.round(H * PX / W);
      svg = svg.replace(/^<svg[^>]*>/,
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + PX + '" height="' + PH +
        '" viewBox="0 0 ' + W + ' ' + H + '">');
      var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        var c = doc.createElement('canvas');
        c.width = PX; c.height = PH;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#0e0e11';
        ctx.fillRect(0, 0, PX, PH);
        ctx.drawImage(img, 0, 0, PX, PH);
        URL.revokeObjectURL(url);
        var a = doc.createElement('a');
        a.download = 'flipside-' + lay.word + (state.hetero ? '-' + lay.word2 : '') + '.png';
        a.href = c.toDataURL('image/png');
        if (a.click) a.click();
      };
      img.src = url;
    });

    render();
    return { state: state, render: render, layout: currentLayout };
  }

  var API = { init: init, GALLERY: GALLERY };
  if (typeof window !== 'undefined') window.FlipsideApp = API;
  else if (typeof globalThis !== 'undefined') globalThis.FlipsideApp = API;

  /* auto-boot in real browsers */
  if (typeof document !== 'undefined' && document.getElementById) {
    var boot = function () { init(document); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
