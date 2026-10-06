// ============================================================================
// Illusion Bowling — pure game logic (no three.js, no DOM).
// Testable in node: `node test.mjs`
//
// Core trick ("if object is close connect"): levels are authored in
// SCREEN SPACE (camera-right / camera-up axes of the locked orthographic
// camera). Track segments that must "connect" share the same screen-space
// position but sit at different depths along the view direction — from the
// locked camera they align perfectly; in 3D they are separate. The ball
// follows one baked 3D path whose depth varies invisibly.
// ============================================================================

export const BALL_R = 0.42;
export const PIN_H = 1.05;
export const HIT_R = BALL_R + 0.34; // ball radius + pin body allowance
export const PERFECT_BONUS = 250;
export const POINTS_PER_PIN = 100;

// ---------------- vector helpers (plain [x,y,z] arrays) ----------------
export const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vcross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
export const vnorm = (a) => {
  const l = vlen(a) || 1;
  return vmul(a, 1 / l);
};
export const vdist = (a, b) => vlen(vsub(a, b));
export const vlerp = (a, b, t) => vadd(a, vmul(vsub(b, a), t));

// ---------------- locked-camera frame ----------------
// az/el in degrees. Returns basis + project/unproject.
export function makeFrame({ az = 32, el = 26, target = [0, 0.3, 0] } = {}) {
  const azr = (az * Math.PI) / 180;
  const elr = (el * Math.PI) / 180;
  const off = [
    Math.cos(elr) * Math.sin(azr),
    Math.sin(elr),
    Math.cos(elr) * Math.cos(azr),
  ];
  const d = vmul(off, -1); // view direction (into the scene)
  const up = [0, 1, 0];
  const r = vnorm(vcross(d, up)); // screen right
  const u = vcross(r, d); // screen up (unit: r,d orthonormal)
  const T = target.slice();
  return {
    r,
    u,
    d,
    T,
    project: (P) => {
      const rel = vsub(P, T);
      return [vdot(rel, r), vdot(rel, u), vdot(rel, d)];
    },
    unproject: (sx, sy, sz) =>
      vadd(T, vadd(vmul(r, sx), vadd(vmul(u, sy), vmul(d, sz)))),
  };
}

// spec point [sx, sy, z(depth), y(world height)] -> world [x,y,z]
export function specPoint(frame, s) {
  const P = frame.unproject(s[0], s[1], s[2]);
  P[1] = s[3];
  return P;
}

// ---------------- paths ----------------
export function catmullRom(pts, closed, per = 20) {
  const n = pts.length;
  const get = (i) =>
    closed ? pts[((i % n) + n) % n] : pts[Math.min(Math.max(i, 0), n - 1)];
  const out = [];
  const segs = closed ? n : n - 1;
  for (let s = 0; s < segs; s++) {
    const p0 = get(s - 1),
      p1 = get(s),
      p2 = get(s + 1),
      p3 = get(s + 2);
    for (let j = 0; j < per; j++) {
      const t = j / per,
        t2 = t * t,
        t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        0.5 * (2 * p1[2] + (-p0[2] + p2[2]) * t +
          (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 +
          (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3),
      ]);
    }
  }
  out.push(closed ? out[0].slice() : pts[n - 1].slice());
  return out;
}

export function buildPath(worldPts, closed) {
  const cum = [0];
  for (let i = 1; i < worldPts.length; i++)
    cum.push(cum[i - 1] + vdist(worldPts[i], worldPts[i - 1]));
  const length = cum[cum.length - 1];
  function at(s) {
    s = Math.max(0, Math.min(s, length));
    let lo = 0,
      hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < s) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const s0 = cum[i - 1],
      s1 = cum[i];
    const t = s1 > s0 ? (s - s0) / (s1 - s0) : 0;
    const seg = vsub(worldPts[i], worldPts[i - 1]);
    return {
      pos: vadd(worldPts[i - 1], vmul(seg, t)),
      tan: vnorm(seg),
    };
  }
  return { points: worldPts, length, at, closed: !!closed };
}

// ride points along a beam (screen-space a->b, world y ya->yb, depth za->zb)
export function beamRide(frame, beam, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(
      specPoint(frame, [
        beam.a[0] + (beam.b[0] - beam.a[0]) * t,
        beam.a[1] + (beam.b[1] - beam.a[1]) * t,
        beam.za + (beam.zb - beam.za) * t,
        beam.ya + (beam.yb - beam.ya) * t + beam.h / 2 + BALL_R,
      ])
    );
  }
  return pts;
}

export function nearestS(path, p) {
  let best = 0,
    bd = Infinity;
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const s = (path.length * i) / steps;
    const d = vdist(path.at(s).pos, p);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return { s: best, dist: bd };
}

// ---------------- pins ----------------
// pin kinds: static | pendulum | osc
// static/osc: base = world pos of pin base (on track top)
// pendulum: pivot (world), len, axis (unit world), amp (rad), freq (hz), phase
export function pinHitPos(pin, t) {
  if (pin.kind === "pendulum") {
    const ang = pin.amp * Math.sin(2 * Math.PI * pin.freq * t + pin.phase);
    const bob = vadd(
      pin.pivot,
      vadd(vmul(pin.axis, Math.sin(ang) * pin.len), [0, -Math.cos(ang) * pin.len, 0])
    );
    return vadd(bob, [0, -PIN_H * 0.65, 0]); // mid-body of hanging pin
  }
  const p = pin.base.slice();
  if (pin.kind === "osc") {
    const o = pin.amp * Math.sin(2 * Math.PI * pin.freq * t + pin.phase);
    p[0] += pin.axis[0] * o;
    p[1] += pin.axis[1] * o;
    p[2] += pin.axis[2] * o;
  }
  return [p[0], p[1] + PIN_H * 0.35, p[2]];
}

export function pinRest(pin) {
  // rest hit-position (moving pins centered)
  if (pin.kind === "pendulum") {
    const bob = vadd(pin.pivot, [0, -pin.len, 0]);
    return vadd(bob, [0, -PIN_H * 0.65, 0]);
  }
  const p = pin.base.slice();
  return [p[0], p[1] + PIN_H * 0.35, p[2]];
}

// ---------------- simulation ----------------
// Game clock starts at level load; ball is released at tRelease.
export function simulate(level, { tRelease = 0, dt = 1 / 120 } = {}) {
  const path = level.path;
  const hits = [];
  const hitSet = new Set();
  let s = 0,
    t = tRelease;
  const total = path.length;
  let guard = 0;
  while (s < total && guard++ < 200000) {
    s += level.speed * dt;
    t += dt;
    const bp = path.at(Math.min(s, total)).pos;
    for (const pin of level.pins) {
      if (hitSet.has(pin.id)) continue;
      if (vdist(bp, pinHitPos(pin, t)) < HIT_R) {
        hitSet.add(pin.id);
        hits.push({ pinId: pin.id, t, s });
      }
    }
  }
  const score =
    hits.length * POINTS_PER_PIN +
    (hits.length === level.pins.length ? PERFECT_BONUS : 0);
  return {
    hits,
    hitCount: hits.length,
    totalPins: level.pins.length,
    perfect: hits.length === level.pins.length && level.pins.length > 0,
    score,
    endT: t,
  };
}

// ---------------- level construction ----------------
function finalize(frame, def) {
  const samples = catmullRom(def.ridePts, def.closed, 20);
  const path = buildPath(samples, def.closed);
  for (const pin of def.pins) {
    const near = nearestS(path, pinRest(pin));
    pin.sPin = near.s;
    pin.minDist = near.dist;
  }
  // tune moving-pin phases so a release at t=0 hits (tests + default fairness)
  for (const pin of def.pins) {
    if (pin.kind === "static" || pin.tuned) continue;
    const tArr = pin.sPin / def.speed;
    pin.phase = -2 * Math.PI * pin.freq * tArr + (pin.phase0 || 0);
    pin.tuned = true;
  }
  return { ...def, path };
}

const BEAM_W = 1.15;
const BEAM_H = 0.95;

function beam(a, b, o = {}) {
  return {
    kind: "beam",
    a,
    b,
    ya: o.ya ?? 0,
    yb: o.yb ?? 0,
    za: o.za ?? 0,
    zb: o.zb ?? 0,
    w: o.w ?? BEAM_W,
    h: o.h ?? BEAM_H,
  };
}
function box(cx, cy, o = {}) {
  return {
    kind: "box",
    c: [cx, cy],
    z: o.z ?? 0,
    y: o.y ?? 0,
    size: o.size ?? [1, 1, 1], // [screenW, worldH, depth]
  };
}

function chainRides(frame, beams, per = 10) {
  const pts = [];
  for (const bm of beams) {
    const rp = beamRide(frame, bm, per);
    if (pts.length) rp.shift(); // avoid duplicate joint points
    pts.push(...rp);
  }
  return pts;
}

export function buildLevels(frame) {
  const levels = [];

  // ============ LEVEL 1 — Penrose triangle ============
  {
    const A = [-3.3, -2.3],
      B = [3.3, -2.3],
      C = [0, 3.5];
    // Impossible depth cycle: at each corner the incoming beam end sits
    // BEHIND the outgoing beam (larger z = farther). Screen positions coincide.
    const beams = [
      beam(A, B, { za: -0.55, zb: 0.55 }), // bottom — front at A, behind at B
      beam(B, C, { za: -0.55, zb: 0.55 }), // right
      beam(C, A, { za: -0.55, zb: 0.55 }), // left
    ];
    const ridePts = chainRides(frame, beams);
    const pinZ = -0.55 + 1.1 * ((0.7 - A[0]) / (B[0] - A[0]));
    const pinBase = specPoint(frame, [0.7, -2.3, pinZ, BEAM_H / 2]);
    levels.push(
      finalize(frame, {
        id: "penrose",
        name: "Impossible Triangle",
        sub: "The loop that can't exist. Tap to release.",
        beams,
        boxes: [],
        ridePts,
        closed: true,
        speed: 3.0,
        pins: [{ id: "p1", kind: "static", base: pinBase }],
        connects: [],
        trail: null,
        twist: "No twist — just feel the loop.",
      })
    );
    // subtle connect pulses at the 3 corners
    const L = levels[levels.length - 1];
    L.connects = [A, B, C].map((c) => nearestS(L.path, specPoint(frame, [c[0], c[1], 0, BEAM_H / 2 + BALL_R])).s);
  }

  // ============ LEVEL 2 — Impossible staircase loop ============
  {
    const H = 2.2,
      W = 2.6;
    const corners = [
      [-W, -H],
      [W, -H],
      [W, H],
      [-W, H],
    ];
    const beams = [
      beam(corners[0], corners[1], {}),
      beam(corners[1], corners[2], {}),
      beam(corners[2], corners[3], {}),
      beam(corners[3], corners[0], {}),
    ];
    // Escher skirt: 16 step boxes under the outer edge, tops descending
    // around the loop so the last step can't meet the first.
    const boxes = [];
    const rideTop = BEAM_H / 2;
    for (let e = 0; e < 4; e++) {
      const p = corners[e],
        q = corners[(e + 1) % 4];
      for (let k = 0; k < 4; k++) {
        const t0 = k / 4,
          t1 = (k + 1) / 4;
        const mx = (p[0] + (q[0] - p[0]) * (t0 + t1)) / 2;
        const my = (p[1] + (q[1] - p[1]) * (t0 + t1)) / 2;
        // push outward from loop center
        const cx = mx === 0 ? 0 : Math.sign(mx);
        const cy = my === 0 ? 0 : Math.sign(my);
        const idx = e * 4 + k;
        const stepTop = rideTop - 0.12 - 0.17 * idx;
        boxes.push({
          kind: "box",
          c: [mx + cx * (BEAM_W / 2 + 0.28), my + cy * (BEAM_W / 2 + 0.28)],
          z: 0,
          y: stepTop - 0.35,
          size: [0.62, 0.7, 1.7],
          edge: e,
        });
      }
    }
    // Arch over the north edge; pendulum pin hangs across the track.
    const edgeY = H;
    const archTop = rideTop + 2.35;
    const arch = [
      beam([-1.5, edgeY], [-1.5, edgeY], { ya: rideTop, yb: archTop, w: 0.28, h: 0.28, za: 0, zb: 0 }),
      beam([1.5, edgeY], [1.5, edgeY], { ya: rideTop, yb: archTop, w: 0.28, h: 0.28, za: 0, zb: 0 }),
      beam([-1.5, edgeY], [1.5, edgeY], { ya: archTop, yb: archTop, w: 0.28, h: 0.28, za: 0, zb: 0 }),
    ];
    const ridePts = chainRides(frame, beams);
    // pendulum: pivot above track center of north edge, swings across track
    const pivot = specPoint(frame, [0, edgeY, 0, archTop]);
    const edgeTan = vnorm(vsub(specPoint(frame, [1, edgeY, 0, 0]), specPoint(frame, [-1, edgeY, 0, 0])));
    const swingAxis = vnorm(vcross([0, 1, 0], edgeTan)); // horizontal, across track
    levels.push(
      finalize(frame, {
        id: "stairs",
        name: "Staircase Loop",
        sub: "The steps never stop climbing. Time the swinging pin.",
        beams: [...beams, ...arch],
        boxes,
        ridePts,
        closed: true,
        speed: 3.2,
        pins: [
          {
            id: "p1",
            kind: "pendulum",
            pivot,
            len: 1.9,
            axis: swingAxis,
            amp: 0.5,
            freq: 0.45,
            phase: 0,
          },
        ],
        connects: [],
        trail: null,
        twist: "NEW: the pin swings — release when it crosses the track.",
      })
    );
  }

  // ============ LEVEL 3 — The Connect (impossible A-ramp) ============
  {
    const J = [-0.2, 0.5]; // the impossible joint (screen-space)
    const high = beam([-3.5, 2.7], J, { ya: 3.3, yb: 1.3, za: -0.6, zb: -0.6 });
    const low = beam(J, [3.3, -1.9], { ya: 1.3, yb: -0.7, za: 0.6, zb: 0.6 });
    const ridePts = chainRides(frame, [high, low]);
    const path = buildPath(catmullRom(ridePts, false, 20), false);
    // pins near the end of the low ramp
    const pins = [0.74, 0.92].map((tt, i) => {
      const sx = J[0] + (3.3 - J[0]) * tt;
      const sy = J[1] + (-1.9 - J[1]) * tt;
      const y = 1.3 + (-0.7 - 1.3) * tt + BEAM_H / 2;
      return { id: "p" + (i + 1), kind: "static", base: specPoint(frame, [sx, sy, 0.6, y]) };
    });
    const level = finalize(frame, {
      id: "connect",
      name: "The Connect",
      sub: "Two ramps. One impossible joint. If it's close — it connects.",
      beams: [high, low],
      boxes: [],
      ridePts,
      closed: false,
      speed: 3.4,
      pins,
      connects: [],
      trail: null,
      twist: "NEW: the CONNECT joint — watch the ball snap across.",
      connectText: true,
    });
    level.connects = [nearestS(level.path, specPoint(frame, [J[0], J[1], 0, 1.3 + BEAM_H / 2 + BALL_R])).s];
    levels.push(level);
  }

  // ============ LEVEL 4 — Sky Gap ============
  {
    const g = 14;
    // ramp with an upturned ski-jump lip (last segment curves upward)
    const rampPts2 = [
      [-3.7, 2.9, -0.4, 3.5],
      [-2.4, 1.9, -0.4, 2.45],
      [-1.5, 1.0, -0.4, 1.6],
      [-1.05, 0.62, -0.4, 1.3],
      [-0.5, 0.22, -0.4, 1.52], // lip (upturned)
    ];
    const rampBeams = [
      beam([-3.7, 2.9], [-2.4, 1.9], { ya: 3.5, yb: 2.45, za: -0.4, zb: -0.4 }),
      beam([-2.4, 1.9], [-1.5, 1.0], { ya: 2.45, yb: 1.6, za: -0.4, zb: -0.4 }),
      beam([-1.5, 1.0], [-1.05, 0.62], { ya: 1.6, yb: 1.3, za: -0.4, zb: -0.4 }),
      beam([-1.05, 0.62], [-0.5, 0.22], { ya: 1.3, yb: 1.52, za: -0.4, zb: -0.4 }),
    ];
    const ridePts = chainRides(frame, rampBeams);
    // launch solve: find speed along lip tangent landing nearest platform target
    const lip = ridePts[ridePts.length - 1];
    const pre = ridePts[ridePts.length - 3];
    const dir = vnorm(vsub(lip, pre));
    const platTopY = 0.15;
    const landY = platTopY + BALL_R;
    const target = specPoint(frame, [1.9, -1.05, 0.2, landY]);
    let best = null;
    for (let sp = 3.0; sp <= 7.5; sp += 0.05) {
      const v = vmul(dir, sp);
      const a = -0.5 * g,
        b = v[1],
        c = lip[1] - landY;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      if (!(t > 0.15)) continue;
      const land = [lip[0] + v[0] * t, landY, lip[2] + v[2] * t];
      const err = vdist([land[0], 0, land[2]], [target[0], 0, target[2]]);
      if (!best || err < best.err) best = { sp, t, land, err };
    }
    const flight = [];
    const FT = best.t;
    const vv = vmul(dir, best.sp);
    for (let i = 1; i <= 26; i++) {
      const t = (FT * i) / 26;
      flight.push([
        lip[0] + vv[0] * t,
        lip[1] + vv[1] * t - 0.5 * g * t * t,
        lip[2] + vv[2] * t,
      ]);
    }
    // landing roll to pins
    const landPt = flight[flight.length - 1];
    const rollEnd = specPoint(frame, [3.1, -1.6, 0.2, landY]);
    const rollPts = [];
    for (let i = 1; i <= 8; i++) rollPts.push(vlerp(landPt, rollEnd, i / 8));
    const fullRide = [...ridePts, ...flight, ...rollPts];
    const sLip = buildPath(catmullRom(ridePts, false, 20), false).length;
    const pins = [
      [2.35, -1.28],
      [3.0, -1.58],
    ].map(([sx, sy], i) => ({
      id: "p" + (i + 1),
      kind: "static",
      base: specPoint(frame, [sx, sy, 0.2, platTopY]),
    }));
    const level = finalize(frame, {
      id: "skygap",
      name: "Sky Gap",
      sub: "No track. No problem. Mind the gap.",
      beams: rampBeams,
      boxes: [
        {
          kind: "box",
          c: [2.0, -1.1],
          z: 0.2,
          y: platTopY - 0.3,
          size: [3.8, 0.6, 2.6],
        },
      ],
      ridePts: fullRide,
      closed: false,
      speed: 4.1,
      pins,
      connects: [],
      trail: null,
      twist: "NEW: the gap jump — with a motion-blur trail.",
    });
    // trail window: from lip to landing
    const sLand = sLip + best.t * best.sp; // approx arc length of flight
    level.trail = { s0: sLip * 0.92, s1: sLand * 1.02 };
    level.gapDebug = { err: best.err, flightT: FT };
    levels.push(level);
  }

  // ============ LEVEL 5 — Cube Weave ============
  {
    // impossible cube: front square + back square (offset in screen space)
    const F = 2.1,
      o = [1.15, 0.95];
    const fs = [
      [-F, -F],
      [F, -F],
      [F, F],
      [-F, F],
    ];
    const bs = fs.map(([x, y]) => [x + o[0], y + o[1]]);
    const cubeBeams = [];
    for (let i = 0; i < 4; i++) {
      cubeBeams.push(
        beam(fs[i], fs[(i + 1) % 4], { ya: 0.8, yb: 0.8, za: -1.3, zb: -1.3, w: 0.3, h: 0.3 })
      );
      cubeBeams.push(
        beam(bs[i], bs[(i + 1) % 4], { ya: 0.8, yb: 0.8, za: 1.3, zb: 1.3, w: 0.3, h: 0.3 })
      );
      cubeBeams.push(
        beam(fs[i], bs[i], { ya: 0.8, yb: 0.8, za: -1.3, zb: 1.3, w: 0.3, h: 0.3 })
      );
    }
    // track weaves around the cube: rounded square, alternating depth
    const T = 2.95,
      corners = [
        [-T, -2.75, -2.0],
        [T, -2.75, 2.0],
        [T, 2.75, -2.0],
        [-T, 2.75, 2.0],
      ];
    const trackBeams = corners.map((c, i) => {
      const n = corners[(i + 1) % 4];
      return beam([c[0], c[1]], [n[0], n[1]], {
        ya: 0.9,
        yb: 0.9,
        za: c[2],
        zb: n[2],
        w: BEAM_W,
        h: BEAM_H,
      });
    });
    const ridePts = chainRides(frame, trackBeams);
    const yRide = 0.9 + BEAM_H / 2;
    // static pins on two edges
    const pins = [
      { id: "p1", kind: "static", base: specPoint(frame, [-1.2, -2.75, -2.0 + 4.0 * 0.3, yRide - BEAM_H / 2]) },
      { id: "p2", kind: "static", base: specPoint(frame, [T, 1.1, 0, yRide - BEAM_H / 2]) },
    ];
    // oscillator across the far edge (z varies; use mid)
    const oscBase = specPoint(frame, [0.4, 2.75, 0, yRide - BEAM_H / 2]);
    const e0 = specPoint(frame, [-1, 2.75, 0, 0]),
      e1 = specPoint(frame, [1, 2.75, 0, 0]);
    const tanE = vnorm(vsub(e1, e0));
    const oscAxis = vnorm(vcross([0, 1, 0], tanE));
    pins.push({
      id: "p3",
      kind: "osc",
      base: oscBase,
      axis: oscAxis,
      amp: 0.85,
      freq: 0.5,
      phase: 0,
    });
    const level = finalize(frame, {
      id: "cube",
      name: "Cube Weave",
      sub: "In front of the cube. Behind it. Both. Neither.",
      beams: [...trackBeams, ...cubeBeams],
      boxes: [],
      ridePts,
      closed: true,
      speed: 3.4,
      pins,
      connects: [],
      trail: null,
      twist: "NEW: 3 pins — one slides across the track. Thread the needle.",
    });
    // connect pulses where the track weaves past the cube
    level.connects = [0, 2].map((i) =>
      nearestS(level.path, specPoint(frame, [corners[i][0], corners[i][1], 0, yRide + BALL_R])).s
    );
    levels.push(level);
  }

  return levels;
}
