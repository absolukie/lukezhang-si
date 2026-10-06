/* unsolved-lab shared kit — window.Kit, vanilla JS, zero dependencies. */
(function () {
  'use strict';

  var Kit = {};

  /* ---------- RNG ---------- */
  // Deterministic PRNG: FNV-1a string hash -> mulberry32
  Kit.rng = function (seedStr) {
    var s = String(seedStr === undefined ? 'unsolved' : seedStr);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  Kit.pick = function (fn, arr) {
    if (!arr || !arr.length) return undefined;
    return arr[Math.floor(fn() * arr.length)];
  };

  Kit.int = function (fn, a, b) { // inclusive
    a = Math.ceil(a); b = Math.floor(b);
    return a + Math.floor(fn() * (b - a + 1));
  };

  Kit.shuffle = function (fn, arr) {
    var out = (arr || []).slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(fn() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  };

  var _uidN = 0;
  Kit.uid = function (p) {
    _uidN++;
    var r = Math.floor(Math.random() * 0xffffff).toString(36);
    return (p || 'k') + '-' + Date.now().toString(36) + '-' + _uidN.toString(36) + r;
  };

  /* ---------- DOM helpers ---------- */
  Kit.esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  Kit.el = function (html) {
    var t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  };

  /* ---------- store ---------- */
  Kit.store = function (ns) {
    var prefix = 'ulab:' + ns + ':';
    function read(k) {
      try {
        var raw = localStorage.getItem(prefix + k);
        if (raw === null || raw === undefined) return undefined;
        return JSON.parse(raw);
      } catch (e) { return undefined; }
    }
    return {
      get: function (k, fallback) {
        var v = read(k);
        return v === undefined ? fallback : v;
      },
      set: function (k, v) {
        try { localStorage.setItem(prefix + k, JSON.stringify(v)); } catch (e) {}
      },
      del: function (k) {
        try { localStorage.removeItem(prefix + k); } catch (e) {}
      }
    };
  };

  /* ---------- nav ---------- */
  Kit.nav = function (o) {
    o = o || {};
    var actions = (o.actions || []).map(function (a) {
      return '<a class="k-btn" href="' + Kit.esc(a.href || '#') + '">' + Kit.esc(a.label || '') + '</a>';
    }).join('');
    var bar = Kit.el(
      '<header class="k-nav">' +
      '<div class="k-nav-inner">' +
      '<div class="k-nav-title">' + Kit.esc(o.title || '') +
      (o.sub ? '<span class="k-nav-sub">' + Kit.esc(o.sub) + '</span>' : '') +
      '</div>' +
      '<nav class="k-nav-actions">' + actions + '</nav>' +
      '</div></header>'
    );
    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  };

  /* ---------- toast ---------- */
  var _toastHost = null;
  function toastHost() {
    if (!_toastHost) {
      _toastHost = document.createElement('div');
      _toastHost.className = 'k-toasts';
      _toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(_toastHost);
    }
    return _toastHost;
  }
  Kit.toast = function (msg, kind) {
    kind = kind || 'info';
    var t = Kit.el('<div class="k-toast k-toast-' + Kit.esc(kind) + '">' + Kit.esc(msg) + '</div>');
    toastHost().appendChild(t);
    requestAnimationFrame(function () { t.classList.add('k-toast-show'); });
    setTimeout(function () {
      t.classList.remove('k-toast-show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
    }, 2600);
    return t;
  };

  /* ---------- modal ---------- */
  Kit.modal = function (o) {
    o = o || {};
    var overlay = Kit.el('<div class="k-modal-overlay"></div>');
    var actions = (o.actions || []).map(function (a, i) {
      return '<button class="k-btn' + (a.primary ? ' k-primary' : '') + '" data-kact="' + i + '">' +
        Kit.esc(a.label || 'OK') + '</button>';
    }).join('');
    var box = Kit.el(
      '<div class="k-modal" role="dialog" aria-modal="true">' +
      '<div class="k-modal-head"><h3>' + Kit.esc(o.title || '') + '</h3>' +
      '<button class="k-modal-x" aria-label="Close">&times;</button></div>' +
      '<div class="k-modal-body">' + (o.body || '') + '</div>' +
      (actions ? '<div class="k-modal-actions">' + actions + '</div>' : '') +
      '</div>'
    );
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      overlay.classList.add('k-modal-hide');
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
    }
    box.querySelector('.k-modal-x').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    (o.actions || []).forEach(function (a, i) {
      box.querySelector('[data-kact="' + i + '"]').addEventListener('click', function () {
        if (typeof a.fn === 'function') a.fn();
        close();
      });
    });
    requestAnimationFrame(function () { overlay.classList.add('k-modal-show'); });
    return close;
  };

  /* ---------- tabs ---------- */
  Kit.tabs = function (host, tabs) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    host.innerHTML = '';
    var bar = Kit.el('<div class="k-tabs" role="tablist"></div>');
    var pane = Kit.el('<div class="k-tab-pane"></div>');
    host.appendChild(bar); host.appendChild(pane);
    var selected = null;
    (tabs || []).forEach(function (t, i) {
      var b = Kit.el('<button class="k-tab" role="tab">' + Kit.esc(t.label || '') + '</button>');
      b.addEventListener('click', function () {
        if (selected === t.id) return;
        selected = t.id;
        var all = bar.querySelectorAll('.k-tab');
        for (var k = 0; k < all.length; k++) all[k].classList.remove('k-active');
        b.classList.add('k-active');
        pane.innerHTML = '';
        if (typeof t.render === 'function') t.render(pane);
      });
      bar.appendChild(b);
      if (i === 0) b.click();
    });
    return host;
  };

  /* ---------- table ---------- */
  Kit.table = function (host, cols, rows, opts) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    opts = opts || {};
    var searchOn = opts.search !== false;
    var pageSize = opts.pageSize || 25;
    var page = 0, sortKey = null, sortDir = 1, q = '';

    function fmtVal(c, r) {
      var v = r[c.key];
      if (typeof c.fmt === 'function') return c.fmt(v, r);
      return v === undefined || v === null ? '' : String(v);
    }
    function filtered() {
      var out = (rows || []).slice();
      if (q) {
        var lq = q.toLowerCase();
        out = out.filter(function (r) {
          return cols.some(function (c) { return fmtVal(c, r).toLowerCase().indexOf(lq) !== -1; });
        });
      }
      if (sortKey) {
        var c = cols.filter(function (x) { return x.key === sortKey; })[0];
        out.sort(function (a, b) {
          var va = a[sortKey], vb = b[sortKey];
          var cmp = (c && c.num) ? (Number(va) - Number(vb))
            : String(va === undefined ? '' : va).localeCompare(String(vb === undefined ? '' : vb));
          return cmp * sortDir;
        });
      }
      return out;
    }
    function render() {
      var data = filtered();
      var pages = Math.max(1, Math.ceil(data.length / pageSize));
      if (page >= pages) page = pages - 1;
      var slice = data.slice(page * pageSize, page * pageSize + pageSize);

      host.innerHTML = '';
      if (searchOn) {
        var s = Kit.el('<input class="k-input k-table-search" type="search" placeholder="Search…" value="' + Kit.esc(q) + '">');
        s.addEventListener('input', function () {
          q = s.value; page = 0; render();
          var s2 = host.querySelector('.k-table-search');
          if (s2) { s2.focus(); var v = s2.value; s2.value = ''; s2.value = v; }
        });
        host.appendChild(s);
      }
      var wrap = Kit.el('<div class="k-table"><table></table></div>');
      var tbl = wrap.querySelector('table');
      var thead = '<thead><tr>' + cols.map(function (c) {
        var arrow = (sortKey === c.key) ? (sortDir > 0 ? ' ▲' : ' ▼') : '';
        return '<th data-key="' + Kit.esc(c.key) + '" class="' + (c.num ? 'k-num' : '') + '">' +
          Kit.esc(c.label || '') + arrow + '</th>';
      }).join('') + '</tr></thead>';
      var tbody = '<tbody>' + slice.map(function (r) {
        return '<tr>' + cols.map(function (c) {
          return '<td class="' + (c.num ? 'k-num' : '') + '">' + fmtVal(c, r) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
      tbl.innerHTML = thead + tbody;
      var ths = tbl.querySelectorAll('th');
      cols.forEach(function (c, i) {
        ths[i].addEventListener('click', function () {
          if (sortKey === c.key) sortDir = -sortDir;
          else { sortKey = c.key; sortDir = 1; }
          page = 0; render();
        });
      });
      host.appendChild(wrap);

      var pager = Kit.el('<div class="k-table-pager"></div>');
      var info = Kit.el('<span class="k-muted">' + data.length + ' row' + (data.length === 1 ? '' : 's') +
        ' · page ' + (page + 1) + ' of ' + pages + '</span>');
      var prev = Kit.el('<button class="k-btn" ' + (page === 0 ? 'disabled' : '') + '>‹ Prev</button>');
      var next = Kit.el('<button class="k-btn" ' + (page >= pages - 1 ? 'disabled' : '') + '>Next ›</button>');
      prev.addEventListener('click', function () { if (page > 0) { page--; render(); } });
      next.addEventListener('click', function () { if (page < pages - 1) { page++; render(); } });
      pager.appendChild(info); pager.appendChild(prev); pager.appendChild(next);
      host.appendChild(pager);
    }
    render();
    return host;
  };

  /* ---------- bars ---------- */
  Kit.bars = function (host, items, opts) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    opts = opts || {};
    var height = opts.height || 220;
    items = items || [];
    host.innerHTML = '';
    var max = Math.max.apply(null, items.map(function (d) { return d.value; }).concat([0]));
    if (max <= 0) max = 1;
    var rowH = 34, labelW = 150, pad = 10;
    var w = Math.max(320, host.clientWidth || 600);
    var svgH = Math.max(height, items.length * rowH + 20);
    var s = '';
    items.forEach(function (d, i) {
      var y = 10 + i * rowH;
      var bw = Math.max(2, (w - labelW - pad * 2 - 70) * (d.value / max));
      var color = d.color || 'var(--accent)';
      s += '<text x="0" y="' + (y + 13) + '" class="k-chart-label">' + Kit.esc(d.label) + '</text>';
      s += '<rect x="' + labelW + '" y="' + y + '" width="' + bw + '" height="20" rx="4" fill="' + Kit.esc(color) + '"/>';
      s += '<text x="' + (labelW + bw + 8) + '" y="' + (y + 14) + '" class="k-chart-val">' + Kit.esc(Kit.num(d.value)) + '</text>';
    });
    var svg = Kit.el('<svg class="k-chart" viewBox="0 0 ' + w + ' ' + svgH + '" width="100%" height="' + svgH + '">' + s + '</svg>');
    host.appendChild(svg);
    return host;
  };

  /* ---------- line ---------- */
  Kit.line = function (host, series, opts) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    opts = opts || {};
    var height = opts.height || 220;
    series = series || [];
    host.innerHTML = '';
    var w = Math.max(320, host.clientWidth || 600);
    var padL = 46, padR = 14, padT = 14, padB = 26;
    var iw = w - padL - padR, ih = height - padT - padB;
    var all = [];
    series.forEach(function (s) { (s.points || []).forEach(function (p) { all.push(p); }); });
    var max = Math.max.apply(null, all.concat([0]));
    var min = Math.min.apply(null, all.concat([0]));
    if (max === min) { max += 1; min -= 1; }
    var n = Math.max.apply(null, series.map(function (s) { return (s.points || []).length; }).concat([1]));
    function X(i) { return padL + (n <= 1 ? iw / 2 : iw * i / (n - 1)); }
    function Y(v) { return padT + ih * (1 - (v - min) / (max - min)); }
    var s = '';
    // gridlines + y labels
    for (var g = 0; g <= 4; g++) {
      var gv = min + (max - min) * g / 4;
      var gy = Y(gv);
      s += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" class="k-gridline"/>';
      s += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" class="k-chart-val" text-anchor="end">' + Kit.esc(Kit.num(gv)) + '</text>';
    }
    if (opts.ylabel) {
      s += '<text x="12" y="' + (padT + ih / 2) + '" class="k-chart-label" transform="rotate(-90 12 ' + (padT + ih / 2) + ')" text-anchor="middle">' + Kit.esc(opts.ylabel) + '</text>';
    }
    var defs = ['var(--accent)', 'var(--accent2)', 'var(--good)', 'var(--warn)', 'var(--bad)'];
    series.forEach(function (sr, si) {
      var color = sr.color || defs[si % defs.length];
      var pts = (sr.points || []).map(function (p, i) { return X(i).toFixed(1) + ',' + Y(p).toFixed(1); });
      if (pts.length) {
        s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + Kit.esc(color) +
          '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
        (sr.points || []).forEach(function (p, i) {
          s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p).toFixed(1) + '" r="3" fill="' + Kit.esc(color) + '"/>';
        });
      }
      s += '<circle cx="' + (padL + si * 90) + '" cy="' + (height - 8) + '" r="4" fill="' + Kit.esc(color) + '"/>';
      s += '<text x="' + (padL + si * 90 + 9) + '" y="' + (height - 4) + '" class="k-chart-label">' + Kit.esc(sr.name || '') + '</text>';
    });
    var svg = Kit.el('<svg class="k-chart" viewBox="0 0 ' + w + ' ' + height + '" width="100%" height="' + height + '">' + s + '</svg>');
    host.appendChild(svg);
    return host;
  };

  /* ---------- donut ---------- */
  Kit.donut = function (host, items, opts) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    opts = opts || {};
    var height = opts.height || 220;
    items = items || [];
    host.innerHTML = '';
    var size = Math.max(180, height);
    var w = Math.max(size + 170, host.clientWidth || 600);
    var cx = size / 2, cy = size / 2, r = size / 2 - 18, ir = r * 0.62;
    var total = items.reduce(function (a, d) { return a + d.value; }, 0);
    var s = '';
    var a0 = -Math.PI / 2;
    items.forEach(function (d) {
      var frac = total > 0 ? d.value / total : 0;
      var a1 = a0 + frac * Math.PI * 2;
      if (frac <= 0) { a0 = a1; return; }
      var large = frac > 0.5 ? 1 : 0;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
      var xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
      s += '<path d="M' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' +
        x1.toFixed(1) + ',' + y1.toFixed(1) + ' L' + xi1.toFixed(1) + ',' + yi1.toFixed(1) +
        ' A' + ir.toFixed(1) + ',' + ir.toFixed(1) + ' 0 ' + large + ' 0 ' + xi0.toFixed(1) + ',' + yi0.toFixed(1) +
        ' Z" fill="' + Kit.esc(d.color || 'var(--accent)') + '" stroke="var(--bg)" stroke-width="2"/>';
      a0 = a1;
    });
    s += '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" class="k-donut-total">' + Kit.esc(Kit.num(total)) + '</text>';
    s += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" class="k-chart-label">total</text>';
    var ly = 30;
    items.forEach(function (d) {
      s += '<rect x="' + (size + 14) + '" y="' + (ly - 9) + '" width="12" height="12" rx="3" fill="' + Kit.esc(d.color || 'var(--accent)') + '"/>';
      s += '<text x="' + (size + 34) + '" y="' + ly + '" class="k-chart-label">' + Kit.esc(d.label) + ' (' + Kit.esc(Kit.pct(total > 0 ? d.value / total : 0)) + ')</text>';
      ly += 22;
    });
    var svg = Kit.el('<svg class="k-chart" viewBox="0 0 ' + w + ' ' + size + '" width="100%" height="' + size + '">' + s + '</svg>');
    host.appendChild(svg);
    return host;
  };

  /* ---------- timeline ---------- */
  var _kindColor = { info: 'var(--accent)', ok: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' };
  Kit.timeline = function (host, events) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    host.innerHTML = '';
    var wrap = Kit.el('<div class="k-timeline"></div>');
    (events || []).forEach(function (e) {
      var color = _kindColor[e.kind] || 'var(--accent)';
      var item = Kit.el(
        '<div class="k-tl-item">' +
        '<div class="k-tl-dot" style="background:' + Kit.esc(color) + '"></div>' +
        '<div class="k-tl-body">' +
        '<div class="k-tl-t">' + Kit.esc(e.t || '') + '</div>' +
        '<div class="k-tl-title">' + Kit.esc(e.title || '') + '</div>' +
        (e.body ? '<div class="k-tl-desc">' + e.body + '</div>' : '') +
        '</div></div>'
      );
      wrap.appendChild(item);
    });
    host.appendChild(wrap);
    return host;
  };

  /* ---------- graph (layered DAG) ---------- */
  Kit.graph = function (host, data) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    data = data || {};
    var nodes = data.nodes || [], edges = data.edges || [];
    host.innerHTML = '';
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    // layer assignment: longest-path layering from roots (nodes with no incoming edges)
    var incoming = {};
    nodes.forEach(function (n) { incoming[n.id] = 0; });
    edges.forEach(function (e) { if (byId[e.a] && byId[e.b]) incoming[e.b]++; });
    var layer = {}, layers = [];
    function assign(id, l) {
      if (layer[id] === undefined || layer[id] < l) {
        layer[id] = l;
        edges.forEach(function (e) { if (e.a === id && byId[e.b]) assign(e.b, l + 1); });
      }
    }
    nodes.forEach(function (n) { if (incoming[n.id] === 0) assign(n.id, 0); });
    nodes.forEach(function (n) { if (layer[n.id] === undefined) assign(n.id, 0); }); // cycles fall back to 0
    nodes.forEach(function (n) {
      var l = layer[n.id] || 0;
      layers[l] = layers[l] || [];
      layers[l].push(n);
    });
    var nodeW = 170, nodeH = 54, hGap = 40, vGap = 90;
    var maxCols = Math.max.apply(null, layers.map(function (l) { return l.length; }).concat([1]));
    var W = maxCols * (nodeW + hGap) + hGap;
    var H = layers.length * (nodeH + vGap) + vGap;
    var pos = {};
    layers.forEach(function (l, li) {
      var rowW = l.length * (nodeW + hGap) - hGap;
      l.forEach(function (n, ci) {
        pos[n.id] = { x: (W - rowW) / 2 + ci * (nodeW + hGap), y: vGap + li * (nodeH + vGap) };
      });
    });
    var s = '<defs><marker id="k-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>';
    edges.forEach(function (e) {
      if (!pos[e.a] || !pos[e.b]) return;
      var x1 = pos[e.a].x + nodeW / 2, y1 = pos[e.a].y + nodeH;
      var x2 = pos[e.b].x + nodeW / 2, y2 = pos[e.b].y;
      var my = (y1 + y2) / 2;
      s += '<path d="M' + x1 + ',' + y1 + ' C' + x1 + ',' + my + ' ' + x2 + ',' + my + ' ' + x2 + ',' + (y2 - 4) +
        '" fill="none" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#k-arrow)"/>';
      if (e.label) {
        s += '<text x="' + ((x1 + x2) / 2 + 6) + '" y="' + (my + 4) + '" class="k-chart-val">' + Kit.esc(e.label) + '</text>';
      }
    });
    nodes.forEach(function (n) {
      var p = pos[n.id];
      var sub = n.sub ? '<text x="' + (p.x + nodeW / 2) + '" y="' + (p.y + 38) + '" text-anchor="middle" class="k-chart-label">' + Kit.esc(n.sub) + '</text>' : '';
      s += '<g><rect x="' + p.x + '" y="' + p.y + '" width="' + nodeW + '" height="' + nodeH + '" rx="10" class="k-graph-node" style="stroke:' + Kit.esc(n.color || 'var(--line)') + ';stroke-width:2"/>' +
        '<text x="' + (p.x + nodeW / 2) + '" y="' + (p.y + 22) + '" text-anchor="middle" class="k-graph-label">' + Kit.esc(n.label || n.id) + '</text>' + sub + '</g>';
    });
    var svg = Kit.el('<svg class="k-chart k-graph" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + Math.min(H, 1000) + '">' + s + '</svg>');
    host.appendChild(svg);
    return host;
  };

  /* ---------- badge / kpi / empty ---------- */
  Kit.badge = function (txt, kind) {
    kind = kind || 'info';
    return '<span class="k-badge k-badge-' + Kit.esc(kind) + '">' + Kit.esc(txt) + '</span>';
  };

  Kit.kpi = function (host, o) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    o = o || {};
    var delta = '';
    if (o.delta !== undefined && o.delta !== null && o.delta !== '') {
      var neg = String(o.delta).trim().charAt(0) === '-';
      delta = '<div class="k-kpi-delta ' + (neg ? 'k-neg' : 'k-pos') + '">' + Kit.esc(o.delta) + '</div>';
    }
    var card = Kit.el(
      '<div class="k-kpi">' +
      '<div class="k-kpi-label">' + Kit.esc(o.label || '') + '</div>' +
      '<div class="k-kpi-value">' + Kit.esc(o.value === undefined ? '' : o.value) + '</div>' +
      delta +
      (o.hint ? '<div class="k-muted k-kpi-hint">' + Kit.esc(o.hint) + '</div>' : '') +
      '</div>'
    );
    host.appendChild(card);
    return card;
  };

  Kit.empty = function (host, title, sub, actionLabel, actionFn) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    var box = Kit.el(
      '<div class="k-empty">' +
      '<div class="k-empty-title">' + Kit.esc(title || 'Nothing here yet') + '</div>' +
      (sub ? '<div class="k-muted">' + Kit.esc(sub) + '</div>' : '') +
      (actionLabel ? '<button class="k-btn k-primary k-empty-action">' + Kit.esc(actionLabel) + '</button>' : '') +
      '</div>'
    );
    if (actionLabel && typeof actionFn === 'function') {
      box.querySelector('.k-empty-action').addEventListener('click', actionFn);
    }
    host.appendChild(box);
    return box;
  };

  /* ---------- formatting ---------- */
  Kit.money = function (n) {
    var neg = n < 0;
    var s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-$' : '$') + s;
  };

  Kit.num = function (n) {
    var a = Math.abs(n);
    if (a >= 1e9) return trim((n / 1e9)) + 'B';
    if (a >= 1e6) return trim((n / 1e6)) + 'M';
    if (a >= 1e3) return trim((n / 1e3)) + 'k';
    return String(n);
    function trim(v) { return (Math.round(v * 10) / 10).toString(); }
  };

  Kit.pct = function (x) {
    return Math.round(x * 100) + '%';
  };

  var _months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  Kit.when = function (d) {
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    return _months[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
  };

  Kit.initials = function (name) {
    return String(name || '').trim().split(/\s+/).filter(Boolean)
      .slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  };

  /* ---------- copy ---------- */
  Kit.copy = function (txt) {
    txt = String(txt === undefined || txt === null ? '' : txt);
    function done() { Kit.toast('Copied to clipboard', 'ok'); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { Kit.toast('Copy failed', 'bad'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else {
      fallback();
    }
  };

  window.Kit = Kit;
})();
