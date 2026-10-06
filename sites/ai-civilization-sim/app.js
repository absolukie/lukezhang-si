"use strict";
/* AI CIVILIZATION SIMULATOR — god-game UI: canvas world, charts, policy lab */

let S = null;
let selectedId = null;
let colorMode = "sector"; // 'sector' | 'wealth'
let lastTickSeen = 0;
let lastEventsSeen = 0;

/* ---------- real-data calibration ---------- */
async function fetchWorldBankGini() {
  const r = await fetch("https://api.worldbank.org/v2/country/USA/indicator/SI.POV.GINI?format=json&per_page=12");
  const j = await r.json();
  const obs = (j[1] || []).find((o) => o.value != null);
  if (!obs) throw new Error("no gini obs");
  return { value: obs.value / 100, year: +obs.date };
}
const BLS_EARN = {
  Technology: "CES5000000003", Finance: "CES5500000003", Manufacturing: "CES3000000003",
  Energy: "CES1000000003", ProfBiz: "CES6000000003", Leisure: "CES7000000003", OtherSvc: "CES8000000003",
};
const BLS_EMP = { ProfBiz: "CES6000000001", Leisure: "CES7000000001", OtherSvc: "CES8000000001" };
const BLS_NAMES = {
  Technology: "Information", Finance: "Financial activities", Manufacturing: "Manufacturing",
  Energy: "Mining & logging", Services: "Services blend (empl.-weighted)",
};
async function fetchBLSWages() {
  const ids = [...Object.values(BLS_EARN), ...Object.values(BLS_EMP)];
  const r = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seriesid: ids, startyear: "2025", endyear: "2026" }),
  });
  const j = await r.json();
  if (j.status !== "REQUEST_SUCCEEDED") throw new Error("BLS " + j.status);
  const val = (sid) => {
    const s = (j.Results.series || []).find((x) => x.seriesID === sid);
    const d = s && s.data && s.data[0];
    return d ? +d.value : null;
  };
  const hourly = {
    Technology: val(BLS_EARN.Technology), Finance: val(BLS_EARN.Finance),
    Manufacturing: val(BLS_EARN.Manufacturing), Energy: val(BLS_EARN.Energy),
  };
  const w = { p: val(BLS_EMP.ProfBiz), l: val(BLS_EMP.Leisure), o: val(BLS_EMP.OtherSvc) };
  const e = { p: val(BLS_EARN.ProfBiz), l: val(BLS_EARN.Leisure), o: val(BLS_EARN.OtherSvc) };
  if (Object.values(hourly).some((v) => v == null) || Object.values(w).some((v) => v == null) || Object.values(e).some((v) => v == null))
    throw new Error("BLS incomplete");
  hourly.Services = (e.p * w.p + e.l * w.l + e.o * w.o) / (w.p + w.l + w.o);
  const s0 = (j.Results.series[0].data[0]);
  return { hourly, period: s0.year + "-" + s0.period.slice(1) };
}
function buildCalibration(gini, wages) {
  const order = ["Technology", "Finance", "Manufacturing", "Services", "Energy"];
  const mean = order.reduce((s, k) => s + wages.hourly[k], 0) / order.length;
  return {
    retrieved: new Date().toISOString().slice(0, 10),
    base_scale: 3.08, wealth_spread: 1.45, gini_target: +gini.value.toFixed(3),
    sectors: order.map((k) => ({
      name: k, hourly: +wages.hourly[k].toFixed(2),
      wage: +(wages.hourly[k] / mean * 3.08).toFixed(2), bls: BLS_NAMES[k],
      routine: (SECTORS.find((s) => s.name === k) || {}).routine,
    })),
    sources: {
      gini: { name: "World Bank, Gini index (SI.POV.GINI), United States", value: +gini.value.toFixed(3), year: gini.year },
      wages: { name: "BLS Current Employment Statistics, average hourly earnings", period: wages.period },
    },
  };
}
async function loadCalibration() {
  // 1) user-refreshed copy, 2) shipped snapshot, 3) baked-in defaults
  try {
    const cached = JSON.parse(localStorage.getItem("civsim.calibration") || "null");
    if (cached && applyCalibration(cached)) return;
  } catch (e) { /* fall through */ }
  try {
    const r = await fetch("calibration.json");
    if (r.ok && applyCalibration(await r.json())) return;
  } catch (e) { /* fall through — baked-in defaults already in sim.js */ }
}
function updateCalLabel() {
  const el = $("cal-note");
  if (!el) return;
  el.innerHTML = `📡 Calibrated · Gini <b>${CALIBRATION.giniTarget.toFixed(3)}</b> (${CALIBRATION.giniLabel}) · wages ${CALIBRATION.wageLabel} · snapshot ${CALIBRATION.retrieved}`;
}
async function refreshCalibration() {
  const btn = $("btn-cal-refresh");
  btn.disabled = true;
  btn.textContent = "⟳ fetching…";
  try {
    const [gini, wages] = await Promise.all([fetchWorldBankGini(), fetchBLSWages()]);
    const data = buildCalibration(gini, wages);
    applyCalibration(data);
    CALIBRATION.giniLabel = `World Bank US Gini, ${gini.year}`;
    CALIBRATION.wageLabel = `BLS avg hourly earnings, ${wages.period}`;
    try { localStorage.setItem("civsim.calibration", JSON.stringify(data)); } catch (e) {}
    updateCalLabel();
    S.log(`📡 Recalibrated — wages ${wages.period}, Gini ${gini.value.toFixed(3)} (${gini.year}).`);
  } catch (err) {
    S.log("⚠️ Recalibration failed (network?) — keeping " + CALIBRATION.retrieved + " snapshot.");
  }
  btn.disabled = false;
  btn.textContent = "⟳ Refresh data";
  refreshUI();
}

const $ = (id) => document.getElementById(id);
const world = $("world");
const wctx = world.getContext("2d");
const WW = 1200, WH = 800;

/* ---------- canvas sizing ---------- */
function fitCanvas(cv) {
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  return dpr;
}
let wdpr = 1;
function sizeWorld() { wdpr = fitCanvas(world); }
window.addEventListener("resize", () => { sizeWorld(); sizeCharts(); });

/* ---------- charts ---------- */
const charts = {};
function sizeCharts() {
  document.querySelectorAll("canvas.chart").forEach((cv) => {
    const dpr = fitCanvas(cv);
    charts[cv.id] = { ctx: cv.getContext("2d"), dpr };
  });
}
function spark(id, vals, color, fmt, ref) {
  const c = charts[id];
  if (!c) return;
  const { ctx, dpr } = c;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (vals.length < 2) return;
  let mn = Math.min(...vals), mx = Math.max(...vals);
  if (ref != null) { mn = Math.min(mn, ref); mx = Math.max(mx, ref); }
  if (mx - mn < 1e-6) { mx = mn + 1; }
  const px = (i) => (i / (vals.length - 1)) * (w - 8 * dpr) + 4 * dpr;
  const py = (v) => h - 8 * dpr - ((v - mn) / (mx - mn)) * (h - 26 * dpr);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + "55");
  grad.addColorStop(1, color + "00");
  ctx.beginPath();
  ctx.moveTo(px(0), h - 4 * dpr);
  vals.forEach((v, i) => ctx.lineTo(px(i), py(v)));
  ctx.lineTo(px(vals.length - 1), h - 4 * dpr);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  vals.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6 * dpr;
  ctx.stroke();
  // last value dot + label
  const lv = vals[vals.length - 1];
  ctx.beginPath();
  ctx.arc(px(vals.length - 1), py(lv), 3 * dpr, 0, 7);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#e8edf7";
  ctx.font = `${11 * dpr}px system-ui`;
  ctx.fillText(fmt(lv), 6 * dpr, 14 * dpr);
  // reference line: real-world anchor (e.g. actual US Gini)
  if (ref != null) {
    const ry = py(ref);
    ctx.save();
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.strokeStyle = "rgba(232,237,247,0.55)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(4 * dpr, ry);
    ctx.lineTo(w - 4 * dpr, ry);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(232,237,247,0.75)";
    ctx.font = `${9.5 * dpr}px system-ui`;
    const rl = "US actual " + ref.toFixed(2);
    ctx.fillText(rl, w - ctx.measureText(rl).width - 5 * dpr, ry - 4 * dpr);
  }
}
function drawHist() {
  const c = charts["hist"];
  if (!c) return;
  const { ctx, dpr } = c;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  const ws = S.agents.map((a) => a.wealth);
  const max = Math.max(10, ...ws);
  const NB = 22, bins = new Array(NB).fill(0);
  ws.forEach((v) => { bins[Math.min(NB - 1, (v / max * NB) | 0)]++; });
  const bmax = Math.max(...bins);
  const bw = w / NB;
  for (let i = 0; i < NB; i++) {
    const bh = (bins[i] / bmax) * (h - 24 * dpr);
    const g = ctx.createLinearGradient(0, h - bh, 0, h);
    g.addColorStop(0, "#e8b64c");
    g.addColorStop(1, "#7a5a1e");
    ctx.fillStyle = g;
    const x = i * bw + 1.5 * dpr;
    ctx.fillRect(x, h - 4 * dpr - bh, bw - 3 * dpr, bh);
  }
  ctx.fillStyle = "#8b93a7";
  ctx.font = `${10 * dpr}px system-ui`;
  ctx.fillText("$0", 4 * dpr, h - 6 * dpr);
  const lbl = "$" + (max >= 1000 ? (max / 1000).toFixed(1) + "M" : max.toFixed(0) + "k");
  ctx.fillText(lbl, w - ctx.measureText(lbl).width - 4 * dpr, h - 6 * dpr);
  ctx.fillStyle = "#e8edf7";
  ctx.font = `${11 * dpr}px system-ui`;
  ctx.fillText("Wealth distribution — " + S.agents.length + " citizens", 6 * dpr, 14 * dpr);
}

/* ---------- world rendering ---------- */
function wealthColor(w) {
  // poor (red) → middle (teal) → rich (gold)
  const t = Math.min(1, Math.log10(1 + w / 12) / 2.2);
  if (t < 0.5) {
    const k = t / 0.5;
    return `rgb(${Math.round(244 - k * 130)},${Math.round(90 + k * 110)},${Math.round(90 - k * 20)})`;
  }
  const k = (t - 0.5) / 0.5;
  return `rgb(${Math.round(114 + k * 118)},${Math.round(200 + k * 56)},${Math.round(70 + k * 10)})`;
}
function agentColor(a) {
  if (colorMode === "wealth") return wealthColor(a.wealth);
  if (!a.employer && !a.ownerOf) return "#5b6478";
  if (a.ownerOf) return "#e8b64c";
  const f = S.firms.find((f) => f.id === a.employer);
  return f ? SECTORS[f.sector].color : "#5b6478";
}

const DISTRICTS = [
  { x: 1200 * 0.24, y: 800 * 0.30, name: "Northgate" },
  { x: 1200 * 0.76, y: 800 * 0.30, name: "Harbor" },
  { x: 1200 * 0.24, y: 800 * 0.72, name: "Old Town" },
  { x: 1200 * 0.76, y: 800 * 0.72, name: "Foundry" },
];

function drawWorld() {
  const w = world.width, h = world.height;
  const sx = w / WW, sy = h / WH;
  const s = Math.min(sx, sy);
  const ox = (w - WW * s) / 2, oy = (h - WH * s) / 2;
  // bg
  const bg = wctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#070b16");
  bg.addColorStop(1, "#04060d");
  wctx.fillStyle = bg;
  wctx.fillRect(0, 0, w, h);
  wctx.save();
  wctx.translate(ox, oy);
  wctx.scale(s, s);
  // grid dots
  wctx.fillStyle = "rgba(120,140,180,0.10)";
  for (let gx = 40; gx < WW; gx += 80)
    for (let gy = 40; gy < WH; gy += 80) {
      wctx.fillRect(gx, gy, 2, 2);
    }
  // plaza
  wctx.strokeStyle = "rgba(232,182,76,0.18)";
  wctx.lineWidth = 2;
  wctx.beginPath();
  wctx.arc(WW / 2, WH / 2, 70, 0, 7);
  wctx.stroke();
  wctx.fillStyle = "rgba(232,182,76,0.35)";
  wctx.font = "13px system-ui";
  wctx.textAlign = "center";
  wctx.fillText("C I V I C   P L A Z A", WW / 2, WH / 2 + 95);
  // districts
  wctx.fillStyle = "rgba(140,155,185,0.30)";
  wctx.font = "12px system-ui";
  DISTRICTS.forEach((d) => wctx.fillText(d.name.toUpperCase(), d.x, d.y - 118));
  // firms
  S.firms.forEach((f) => {
    const col = SECTORS[f.sector].color;
    const flash = f.flash > 0 ? (0.5 + 0.5 * Math.sin(Date.now() / 150)) : 0;
    wctx.fillStyle = "rgba(10,16,30,0.92)";
    wctx.strokeStyle = col;
    wctx.lineWidth = 2 + flash * 2;
    const bw2 = 52, bh2 = 34;
    wctx.beginPath();
    if (wctx.roundRect) wctx.roundRect(f.x - bw2 / 2, f.y - bh2 / 2, bw2, bh2, 7);
    else wctx.rect(f.x - bw2 / 2, f.y - bh2 / 2, bw2, bh2);
    wctx.fill();
    wctx.stroke();
    wctx.fillStyle = "#dfe6f5";
    wctx.font = "bold 10px system-ui";
    wctx.fillText(f.name, f.x, f.y - 2);
    wctx.fillStyle = col;
    wctx.font = "9px system-ui";
    wctx.fillText(f.employees.length + " workers", f.x, f.y + 11);
  });
  // agents
  S.agents.forEach((a) => {
    const col = agentColor(a);
    const r = a.ownerOf ? 5 : 3.4;
    wctx.beginPath();
    wctx.arc(a.x, a.y, r * 2.1, 0, 7);
    wctx.fillStyle = col + "22";
    wctx.fill();
    wctx.beginPath();
    wctx.arc(a.x, a.y, r, 0, 7);
    wctx.fillStyle = col;
    wctx.fill();
    if (a.ownerOf) {
      wctx.strokeStyle = "#ffe9a8";
      wctx.lineWidth = 1.4;
      wctx.beginPath();
      wctx.arc(a.x, a.y, r + 2.6, 0, 7);
      wctx.stroke();
    }
    if (a.id === selectedId) {
      wctx.strokeStyle = "#ffffff";
      wctx.lineWidth = 1.6;
      wctx.beginPath();
      wctx.arc(a.x, a.y, r + 5.5, 0, 7);
      wctx.stroke();
    }
  });
  wctx.restore();
  world._view = { s, ox, oy };
}

function moveAgents() {
  const t = Date.now() / 1000;
  S.agents.forEach((a, i) => {
    if (a.employer) {
      const f = S.firms.find((f) => f.id === a.employer);
      if (f) {
        const slot = (i * 37) % 10;
        a.tx = f.x - 34 + (slot % 5) * 17;
        a.ty = f.y + 30 + Math.floor(slot / 5) * 10;
      }
    } else if (a.ownerOf) {
      const f = S.firms.find((f) => f.id === a.ownerOf);
      if (f) { a.tx = f.x + 34; a.ty = f.y - 24; }
    } else {
      // unemployed drift around the plaza
      if (!a._wt || t > a._wt) {
        a._wt = t + 4 + Math.random() * 6;
        const ang = Math.random() * Math.PI * 2, rr = 40 + Math.random() * 130;
        a.tx = WW / 2 + Math.cos(ang) * rr;
        a.ty = WH / 2 + Math.sin(ang) * rr * 0.7;
      }
    }
    const k = 0.045;
    a.x += (a.tx - a.x) * k + (Math.random() - 0.5) * 0.7;
    a.y += (a.ty - a.y) * k + (Math.random() - 0.5) * 0.7;
  });
}

/* ---------- UI refresh ---------- */
const fmt$ = (v) => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "M" : v.toFixed(0) + "k");
/* MONTHS comes from sim.js (shared global scope) — do not redeclare here */

function refreshUI() {
  const m = S.metrics;
  $("date").textContent = MONTHS[S.month] + " " + S.year;
  $("ticknote").textContent = "month " + S.tick;
  $("chip-gini").textContent = m.gini.toFixed(2);
  $("chip-emp").textContent = Math.round(m.employment * 100) + "%";
  $("chip-wealth").textContent = fmt$(m.avgWealth);
  $("chip-gini").parentElement.classList.toggle("warn", m.gini > 0.6);
  $("chip-emp").parentElement.classList.toggle("warn", m.employment < 0.85);
  // charts
  const H = S.history;
  spark("sp-gini", H.map((h) => h.gini), "#e8b64c", (v) => "Gini " + v.toFixed(2), CALIBRATION.giniTarget);
  spark("sp-emp", H.map((h) => h.emp * 100), "#7bc96f", (v) => "Employment " + v.toFixed(1) + "%");
  spark("sp-pol", H.map((h) => h.pol), "#f472b6", (v) => "Polarization " + v.toFixed(2));
  spark("sp-prod", H.map((h) => h.prod), "#22d3ee", (v) => "Output $" + v.toFixed(0) + "k/mo");
  drawHist();
  // stat grid
  $("st-firms").textContent = m.firms;
  $("st-poverty").textContent = Math.round(m.poverty * 100) + "%";
  $("st-mobility").textContent = m.mobility.toFixed(2);
  $("st-trust").textContent = Math.round(m.trust * 100) + "%";
  $("st-debt").textContent = fmt$(m.debt);
  $("st-median").textContent = fmt$(m.medianWealth);
  // policy readouts (sync if elections moved them and user isn't dragging)
  if (document.activeElement !== $("tax")) $("tax").value = Math.round(S.policy.tax * 100);
  if (document.activeElement !== $("ubi-toggle")) $("ubi-toggle").checked = S.policy.ubi;
  if (document.activeElement !== $("ubi-amt")) $("ubi-amt").value = Math.round(S.policy.ubiAmount * 10);
  $("tax-val").textContent = Math.round(S.policy.tax * 100) + "%";
  $("ubi-val").textContent = "$" + S.policy.ubiAmount.toFixed(1) + "k";
  $("gov-fund").textContent = fmt$(S.gov.fund);
  // active effects
  const ef = $("effects");
  ef.innerHTML = "";
  S.effects.forEach((e) => {
    const d = document.createElement("span");
    d.className = "effect";
    const names = { "misinfo": "📢 Misinformation", "recession": "📉 Recession", "disaster": "🌪️ Disaster", "tech-boom": "🤖 Tech boom", "disruption": "❄️ Hiring freeze", "slump": "📉 Sector slump" };
    d.textContent = (names[e.kind] || e.kind) + " · " + e.left + "mo";
    ef.appendChild(d);
  });
  if (!S.effects.length) ef.innerHTML = '<span class="mut">No active shocks</span>';
  drainLog();
  if (selectedId != null) renderAgentCard();
  renderRichest();
}

function drainLog() {
  const ul = $("log");
  const fresh = S.events.slice(0, S.events.length - lastEventsSeen);
  lastEventsSeen = S.events.length;
  fresh.reverse().forEach((e) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="lt">${e.t}</span> ${e.text}`;
    ul.prepend(li);
  });
  while (ul.children.length > 80) ul.lastChild.remove();
}

/* ---------- agent inspector ---------- */
function renderAgentCard() {
  const a = S.agents[selectedId];
  const card = $("agent-card");
  if (!a) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  const f = a.employer ? S.firms.find((f) => f.id === a.employer)
    : a.ownerOf ? S.firms.find((f) => f.id === a.ownerOf) : null;
  const job = a.ownerOf ? "👑 Founder, " + (f ? f.name : "")
    : a.employer ? (f ? f.name + " · " + SECTORS[f.sector].name : "Employed")
    : "Unemployed";
  const pol = a.belief < -0.33 ? "Left" : a.belief > 0.33 ? "Right" : "Centrist";
  $("ac-name").textContent = a.name;
  $("ac-job").textContent = job;
  $("ac-wealth").textContent = fmt$(a.wealth);
  $("ac-skill").style.width = Math.round(a.skill * 100) + "%";
  $("ac-pol").textContent = pol + " (" + a.belief.toFixed(2) + ")";
  $("ac-friends").textContent = a.friends.length + " friends · " + Math.round(a.trust * 100) + "% trust";
  $("ac-mem").innerHTML = a.memory.length
    ? a.memory.map((m) => "<div>· " + m + "</div>").join("")
    : '<div class="mut">No memories yet</div>';
}
function renderRichest() {
  const ol = $("richest");
  ol.innerHTML = "";
  S.agents.slice().sort((a, b) => b.wealth - a.wealth).slice(0, 5).forEach((a, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="rk">${i + 1}</span> ${a.name} <span class="rw">${fmt$(a.wealth)}</span>`;
    li.onclick = () => { selectedId = a.id; renderAgentCard(); };
    ol.appendChild(li);
  });
}

/* ---------- sim loop ---------- */
let acc = 0, lastT = 0;
const SPEEDS = { 1: 650, 2: 320, 4: 160 };
let speedKey = 1;
function loop(t) {
  requestAnimationFrame(loop);
  if (!lastT) lastT = t;
  const dt = t - lastT;
  lastT = t;
  moveAgents();
  drawWorld();
  if (!S.paused) {
    acc += dt;
    const interval = SPEEDS[speedKey];
    while (acc >= interval) {
      acc -= interval;
      S.tickOnce();
      lastTickSeen = S.tick;
      refreshUI();
    }
  }
}

/* ---------- wiring ---------- */
function setSpeed(k) {
  speedKey = k;
  document.querySelectorAll(".spd").forEach((b) => b.classList.toggle("on", +b.dataset.s === k));
}
function setPaused(p) {
  S.paused = p;
  $("btn-pause").textContent = p ? "▶" : "⏸";
  $("btn-pause").classList.toggle("on", !p);
}

document.querySelectorAll(".tab").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"));
    document.querySelectorAll(".tabpage").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    $("tab-" + b.dataset.tab).classList.add("on");
    sizeCharts();
  };
});

$("btn-pause").onclick = () => setPaused(!S.paused);
document.querySelectorAll(".spd").forEach((b) => { b.onclick = () => setSpeed(+b.dataset.s); });
$("btn-reset").onclick = () => {
  S = createSim();
  selectedId = null;
  lastEventsSeen = 0;
  $("log").innerHTML = "";
  $("agent-card").classList.add("hidden");
  setPaused(false);
  refreshUI();
};
$("btn-launch").onclick = () => {
  $("welcome").classList.add("hidden");
  setPaused(false);
};

$("tax").oninput = (e) => { S.setTax(e.target.value / 100); refreshUI(); };
$("ubi-toggle").onchange = (e) => { S.setUBI(e.target.checked); refreshUI(); };
$("ubi-amt").oninput = (e) => { S.setUBI(S.policy.ubi, e.target.value / 10); refreshUI(); };
$("shock-tech").onclick = () => { S.techShock(); refreshUI(); };
$("shock-misinfo").onclick = () => { S.misinformation(); refreshUI(); };
$("shock-disaster").onclick = () => { S.disaster(); refreshUI(); };
$("shock-recession").onclick = () => { S.recession(); refreshUI(); };
$("shock-stimulus").onclick = () => { S.stimulus(); refreshUI(); };
document.querySelectorAll(".preset").forEach((b) => {
  b.onclick = () => {
    S.preset(b.dataset.p);
    // sync controls
    $("tax").value = Math.round(S.policy.tax * 100);
    $("ubi-toggle").checked = S.policy.ubi;
    $("ubi-amt").value = Math.round(S.policy.ubiAmount * 10);
    refreshUI();
  };
});
$("color-toggle").onclick = (e) => {
  colorMode = colorMode === "sector" ? "wealth" : "sector";
  e.target.textContent = colorMode === "sector" ? "🎨 Sector colors" : "🎨 Wealth colors";
};
$("ac-close").onclick = () => { selectedId = null; $("agent-card").classList.add("hidden"); };

// click-to-inspect
function canvasPos(ev) {
  const r = world.getBoundingClientRect();
  const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
  const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
  const v = world._view || { s: 1, ox: 0, oy: 0 };
  return { x: (cx * (world.width / r.width) - v.ox) / v.s, y: (cy * (world.height / r.height) - v.oy) / v.s };
}
world.addEventListener("click", (ev) => {
  const p = canvasPos(ev);
  let best = null, bd = 26;
  S.agents.forEach((a) => {
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (d < bd) { bd = d; best = a; }
  });
  selectedId = best ? best.id : null;
  if (best) renderAgentCard();
  else $("agent-card").classList.add("hidden");
});

/* ---------- boot ---------- */
async function boot() {
  await loadCalibration();
  S = createSim();
  updateCalLabel();
  sizeWorld();
  sizeCharts();
  setSpeed(1);
  setPaused(true); // welcome overlay releases
  refreshUI();
  requestAnimationFrame(loop);
  setTimeout(() => { sizeWorld(); sizeCharts(); }, 300);
}
const calBtn = document.getElementById("btn-cal-refresh");
if (calBtn) calBtn.onclick = refreshCalibration;
boot();
