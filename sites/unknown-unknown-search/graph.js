/* UNKNOWN-UNKNOWN — canvas knowledge graph.
   Nodes: papers (cyan) · claims (amber diamonds) · assumptions (magenta hexagons).
   Edges: asserts / contradicts / relies-on (dashed) / tests / cites (faint).
   Force-directed layout, drag nodes, pan background, wheel zoom, click to inspect. */

function KnowledgeGraph(canvas, ix, onSelect) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const nodes = [], edges = [], byId = {};
  function addNode(id, kind, label, sub, weight) {
    const n = { id, kind, label, sub, w: weight || 1, x: 0, y: 0, vx: 0, vy: 0, r: 5 };
    nodes.push(n); byId[id] = n; return n;
  }
  PAPERS.forEach(p => {
    const n = addNode(p.id, "paper", p.title, p.subfield, 1 + ix.citedBy[p.id].length * 0.6);
    n.r = 4 + Math.min(5, ix.citedBy[p.id].length);
    n.paper = p;
  });
  CLAIMS.forEach(c => { const n = addNode(c.id, "claim", c.text, c.subfield, 1.6); n.r = 7; n.claim = c; });
  ASSUMPTIONS.forEach(a => { const n = addNode(a.id, "assumption", a.text, null, 2); n.r = 8; n.assump = a; });

  function link(a, b, kind) { if (byId[a] && byId[b]) edges.push({ a: byId[a], b: byId[b], kind }); }
  PAPERS.forEach(p => {
    (p.asserts || []).forEach(c => link(p.id, c, "asserts"));
    (p.contradicts || []).forEach(c => link(p.id, c, "contradicts"));
    (p.reliesOn || []).forEach(a => link(p.id, a, "relies"));
    (p.tests || []).forEach(a => link(p.id, a, "tests"));
    (p.cites || []).forEach(q => link(p.id, q, "cites"));
  });

  // initial placement: assumptions center, claims ring, papers outer ring
  const R = { assumption: 40, claim: 170, paper: 330 };
  const placed = { assumption: 0, claim: 0, paper: 0 };
  const counts = { assumption: 0, claim: 0, paper: 0 };
  nodes.forEach(n => counts[n.kind]++);
  nodes.forEach(n => {
    const i = placed[n.kind]++, tot = counts[n.kind];
    const ang = (i / tot) * Math.PI * 2 + (n.kind === "paper" ? 0.2 : 0);
    const rad = R[n.kind] * (0.85 + Math.random() * 0.3);
    n.x = Math.cos(ang) * rad; n.y = Math.sin(ang) * rad;
  });

  const REST = { asserts: 90, contradicts: 110, relies: 120, tests: 100, cites: 150 };
  const view = { x: 0, y: 0, k: 1 };
  let selected = null, hover = null, cooled = false;
  const show = { paper: true, claim: true, assumption: true, cites: true };

  function tick() {
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > 90000) continue;
        if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
        const d = Math.sqrt(d2), f = 2600 / d2;
        dx /= d; dy /= d;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
    }
    // springs
    edges.forEach(e => {
      const a = e.a, b = e.b, rest = REST[e.kind] || 120;
      let dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - rest) * 0.012;
      dx /= d; dy /= d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    });
    // gravity + integrate
    let maxV = 0;
    nodes.forEach(n => {
      if (n.fixed) { n.vx = n.vy = 0; return; }
      n.vx -= n.x * 0.004; n.vy -= n.y * 0.004;
      n.vx *= 0.86; n.vy *= 0.86;
      n.x += n.vx; n.y += n.vy;
      const v = Math.abs(n.vx) + Math.abs(n.vy);
      if (v > maxV) maxV = v;
    });
    if (maxV < 0.05) cooled = true;
  }
  for (let t = 0; t < 500 && !cooled; t++) tick();

  const ctx2d = canvas.getContext("2d");
  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    draw();
  }
  function w2s(x, y) {
    const r = canvas.getBoundingClientRect();
    return [(x - view.x) * view.k + r.width / 2, (y - view.y) * view.k + r.height / 2];
  }
  function s2w(sx, sy) {
    const r = canvas.getBoundingClientRect();
    return [(sx - r.width / 2) / view.k + view.x, (sy - r.height / 2) / view.k + view.y];
  }

  const EDGE_STYLE = {
    asserts:    { c: "232,182,76",   a: 0.30, dash: [] },
    contradicts:{ c: "226,109,90",   a: 0.75, dash: [] },
    relies:     { c: "224,108,138",   a: 0.40, dash: [5, 4] },
    tests:      { c: "123,201,111",   a: 0.65, dash: [] },
    cites:      { c: "130,150,170",   a: 0.13, dash: [] },
  };
  const NODE_FILL = { paper: "#59c2d8", claim: "#e8b64c", assumption: "#e06c8a" };

  function drawShape(n, sx, sy) {
    const r = n.r * Math.sqrt(view.k);
    ctx2d.beginPath();
    if (n.kind === "claim") { // diamond
      ctx2d.moveTo(sx, sy - r); ctx2d.lineTo(sx + r, sy); ctx2d.lineTo(sx, sy + r); ctx2d.lineTo(sx - r, sy);
      ctx2d.closePath();
    } else if (n.kind === "assumption") { // hexagon
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + Math.PI / 6;
        const px = sx + r * Math.cos(a), py = sy + r * Math.sin(a);
        i ? ctx2d.lineTo(px, py) : ctx2d.moveTo(px, py);
      }
      ctx2d.closePath();
    } else ctx2d.arc(sx, sy, r, 0, Math.PI * 2);
    ctx2d.fillStyle = NODE_FILL[n.kind];
    ctx2d.globalAlpha = (hover && hover !== n && !connected(hover, n)) ? 0.25 : 0.95;
    ctx2d.fill();
    ctx2d.globalAlpha = 1;
    if (selected === n) { ctx2d.strokeStyle = "#fff"; ctx2d.lineWidth = 2; ctx2d.stroke(); }
  }
  const connCache = {};
  function connected(a, b) {
    if (a === b) return true;
    const k = a.id < b.id ? a.id + "|" + b.id : b.id + "|" + a.id;
    if (!(k in connCache)) connCache[k] = edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    return connCache[k];
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, r.width, r.height);
    // edges
    Object.keys(EDGE_STYLE).forEach(kind => {
      if (kind === "cites" && !show.cites) return;
      const st = EDGE_STYLE[kind];
      ctx2d.strokeStyle = "rgba(" + st.c + "," + st.a + ")";
      ctx2d.lineWidth = kind === "contradicts" ? 1.6 : 1;
      ctx2d.setLineDash(st.dash);
      ctx2d.beginPath();
      edges.forEach(e => {
        if (e.kind !== kind) return;
        if (!show[e.a.kind] || !show[e.b.kind]) return;
        const [x1, y1] = w2s(e.a.x, e.a.y), [x2, y2] = w2s(e.b.x, e.b.y);
        ctx2d.moveTo(x1, y1); ctx2d.lineTo(x2, y2);
      });
      ctx2d.stroke();
      ctx2d.setLineDash([]);
    });
    // nodes
    nodes.forEach(n => {
      if (!show[n.kind]) return;
      const [sx, sy] = w2s(n.x, n.y);
      if (sx < -30 || sy < -30 || sx > r.width + 30 || sy > r.height + 30) return;
      drawShape(n, sx, sy);
    });
    // labels for claims + assumptions (the interesting nodes), papers on hover/select
    ctx2d.font = "10px ui-monospace, monospace";
    ctx2d.fillStyle = "rgba(219,228,238,.75)";
    nodes.forEach(n => {
      if (!show[n.kind]) return;
      if (n.kind === "paper" && n !== hover && n !== selected) return;
      const [sx, sy] = w2s(n.x, n.y);
      if (sx < 0 || sy < 0 || sx > r.width || sy > r.height) return;
      ctx2d.fillText(n.id, sx + n.r * Math.sqrt(view.k) + 4, sy + 3);
    });
  }

  // interaction
  let dragN = null, panning = false, lx = 0, ly = 0, moved = 0;
  function nodeAt(sx, sy) {
    let best = null, bd = 1e9;
    nodes.forEach(n => {
      if (!show[n.kind]) return;
      const [x, y] = w2s(n.x, n.y);
      const d = Math.hypot(x - sx, y - sy);
      if (d < n.r * Math.sqrt(view.k) + 8 && d < bd) { bd = d; best = n; }
    });
    return best;
  }
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    lx = e.clientX; ly = e.clientY; moved = 0;
    const r = canvas.getBoundingClientRect();
    dragN = nodeAt(e.clientX - r.left, e.clientY - r.top);
    if (dragN) dragN.fixed = true; else panning = true;
  });
  canvas.addEventListener("pointermove", e => {
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (dragN) {
      const r = canvas.getBoundingClientRect();
      const [wx, wy] = s2w(e.clientX - r.left, e.clientY - r.top);
      dragN.x = wx; dragN.y = wy; cooled = false;
    } else if (panning) { view.x -= dx / view.k; view.y -= dy / view.k; }
    else {
      const r = canvas.getBoundingClientRect();
      const h = nodeAt(e.clientX - r.left, e.clientY - r.top);
      if (h !== hover) { hover = h; canvas.style.cursor = h ? "pointer" : "grab"; }
    }
    draw();
  });
  canvas.addEventListener("pointerup", e => {
    if (dragN) dragN.fixed = false;
    if (moved < 5 && !dragN) {
      const r = canvas.getBoundingClientRect();
      const n = nodeAt(e.clientX - r.left, e.clientY - r.top);
      selected = (n === selected) ? null : n;
      onSelect(selected);
    } else if (moved < 5 && dragN) {
      selected = (dragN === selected) ? null : dragN;
      onSelect(selected);
    }
    dragN = null; panning = false; draw();
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const [wx, wy] = s2w(sx, sy);
    view.k = Math.min(4, Math.max(0.4, view.k * (e.deltaY < 0 ? 1.12 : 0.89)));
    view.x = wx - (sx - r.width / 2) / view.k;
    view.y = wy - (sy - r.height / 2) / view.k;
    draw();
  }, { passive: false });

  new ResizeObserver(resize).observe(canvas);
  resize();
  (function loop() {
    if (!cooled) { tick(); draw(); }
    requestAnimationFrame(loop);
  })();

  return {
    setLayer(kind, on) { show[kind] = on; draw(); },
    reset() { view.x = 0; view.y = 0; view.k = 1; draw(); },
    zoom(f) { view.k = Math.min(4, Math.max(0.4, view.k * f)); draw(); },
    focus(id) {
      const n = byId[id];
      if (!n) return;
      view.x = n.x; view.y = n.y; view.k = Math.max(view.k, 1.4);
      selected = n; onSelect(n); draw();
    },
  };
}
