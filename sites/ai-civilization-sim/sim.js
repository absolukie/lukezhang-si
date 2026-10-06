"use strict";
/* ============================================================================
   AI CIVILIZATION SIMULATOR — agent-based model
   120 agents · firms · labor market · consumption · social influence ·
   government · policy shocks. Inequality EMERGES from the rules (skill gaps ×
   firm wage gaps × capital returns), it is never scripted.
   Units: money in $k (thousands). 1 tick = 1 month.
   ============================================================================ */

/* ============================================================================
   CALIBRATION — real-world anchors (see calibration.json for sources)
   Sector wages: relative pay gaps match BLS Current Employment Statistics,
   average hourly earnings, Aug 2026. Sim wage ($k/mo) =
   3.08 * sector_hourly / mean_hourly_of_5_sectors — the 3.08 mean preserves
   the sim's tuned balance while every inter-sector gap is empirical.
   Initial wealth spread tuned so founding Gini == World Bank US Gini 2024.
   `routine` (automation exposure) remains a model parameter, not empirical.
   ============================================================================ */
const CALIBRATION = {
  retrieved: "2026-09-29",
  giniTarget: 0.418, giniLabel: "World Bank US Gini, 2024",
  wageLabel: "BLS avg hourly earnings, Aug 2026",
  baseScale: 3.08,
};
const WEALTH_INIT = { median: 22, spread: 1.45 }; // spread tuned → founding Gini ≈ 0.418

const SECTORS = [
  { name: "Technology",    color: "#22d3ee", routine: 0.30, wage: 3.88, hourly: 55.53, bls: "Information" },
  { name: "Finance",       color: "#fbbf24", routine: 0.40, wage: 3.48, hourly: 49.82, bls: "Financial activities" },
  { name: "Manufacturing", color: "#fb923c", routine: 0.80, wage: 2.58, hourly: 36.92, bls: "Manufacturing" },
  { name: "Services",      color: "#f472b6", routine: 0.60, wage: 2.52, hourly: 35.99, bls: "Services blend (empl.-weighted)" },
  { name: "Energy",        color: "#a3e635", routine: 0.50, wage: 2.93, hourly: 41.93, bls: "Mining & logging" },
];

/* Apply a calibration snapshot (e.g. freshly fetched from the live APIs):
   rescales sector wages from real hourly earnings, keeping baseScale mean. */
function applyCalibration(data) {
  if (!data || !Array.isArray(data.sectors) || !data.sectors.length) return false;
  const mean = data.sectors.reduce((s, x) => s + x.hourly, 0) / data.sectors.length;
  const scale = (data.base_scale || CALIBRATION.baseScale) / mean;
  data.sectors.forEach((cs) => {
    const sec = SECTORS.find((s) => s.name === cs.name);
    if (sec) {
      sec.hourly = cs.hourly;
      sec.wage = +(cs.hourly * scale).toFixed(2);
      sec.bls = cs.bls || sec.bls;
    }
  });
  if (data.gini_target) CALIBRATION.giniTarget = data.gini_target;
  if (data.retrieved) CALIBRATION.retrieved = data.retrieved;
  return true;
}

const FIRST = ["Maya","Liam","Sofia","Noah","Ava","Ethan","Mila","Lucas","Zoe","Kai","Nora","Ezra",
  "Ivy","Owen","Lena","Mateo","Aria","Finn","Elif","Ravi","June","Theo","Nadia","Omar","Tara",
  "Felix","Ines","Ruth","Dario","Sana"];
const LAST = ["Chen","Okafor","Garcia","Kim","Novak","Haddad","Silva","Tanaka","Muller","Ali",
  "Rossi","Dubois","Khan","Moreau","Ito","Larsen","Costa","Weber","Nakamura","Petrov",
  "Singh","Adeyemi","Lindqvist","Marsh","Vidal","Osei","Kaur","Brandt","Sato","Reyes"];
const FIRM_PRE = ["Nova","Helix","Vertex","Lumen","Axiom","Kestrel","Onyx","Solace","Drift","Ember",
  "Tide","Quarry","Beacon","Mesa","Vanta","Juniper","Cobalt","Fern"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function giniOf(arr) {
  const n = arr.length;
  if (!n) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const tot = s.reduce((a, b) => a + b, 0);
  if (tot <= 0) return 0;
  let cum = 0;
  for (let i = 0; i < n; i++) cum += (i + 1) * s[i];
  return (2 * cum) / (n * tot) - (n + 1) / n;
}
function stdOf(arr) {
  const n = arr.length;
  if (!n) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) * (b - m), 0) / n);
}
// rank correlation between two arrays (for social mobility)
function rankCorr(a, b) {
  const n = a.length;
  if (!n) return 0;
  const rank = (v) => {
    const idx = v.map((x, i) => i).sort((p, q) => v[p] - v[q]);
    const r = new Array(n);
    idx.forEach((orig, pos) => { r[orig] = pos; });
    return r;
  };
  const ra = rank(a), rb = rank(b);
  const ma = ra.reduce((x, y) => x + y, 0) / n, mb = rb.reduce((x, y) => x + y, 0) / n;
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (ra[i] - ma) * (rb[i] - mb);
    va += (ra[i] - ma) * (ra[i] - ma);
    vb += (rb[i] - mb) * (rb[i] - mb);
  }
  return (va && vb) ? cov / Math.sqrt(va * vb) : 0;
}

function createSim(seed) {
  const R = makeRng(seed == null ? (Math.random() * 1e9) | 0 : seed);
  const rand = (a, b) => a + R() * (b - a);
  const randn = () => (R() + R() + R() + R() - 2) / 1.15;
  const pick = (arr) => arr[(R() * arr.length) | 0];

  const W = 1200, H = 800;
  const districts = [
    { x: W * 0.24, y: H * 0.30, name: "Northgate" },
    { x: W * 0.76, y: H * 0.30, name: "Harbor" },
    { x: W * 0.24, y: H * 0.72, name: "Old Town" },
    { x: W * 0.76, y: H * 0.72, name: "Foundry" },
  ];
  const plaza = { x: W / 2, y: H / 2 };

  const S = {
    tick: 0, month: 0, year: 2026,
    agents: [], firms: [],
    events: [], effects: [],
    gov: { fund: 500, debt: 0 },
    policy: { tax: 0.25, ubi: false, ubiAmount: 1.0, benefits: 0.8 },
    sectorDemand: [1, 1, 1, 1, 1],
    history: [], metrics: {},
    baselineSpend: 300,
    nextFirmId: 1,
    founded: 0, bankrupt: 0,
  };
  const agents = S.agents, firms = S.firms;

  S.dateStr = () => MONTHS[S.month] + " " + S.year;
  S.log = (text) => {
    S.events.unshift({ t: S.dateStr(), text });
    if (S.events.length > 80) S.events.pop();
  };
  const remember = (a, text) => {
    a.memory.unshift(S.dateStr() + " — " + text);
    if (a.memory.length > 4) a.memory.pop();
  };

  /* ---------------- agents ---------------- */
  for (let i = 0; i < 120; i++) {
    const d = districts[i % 4];
    const skill = Math.min(1, Math.max(0.08, 0.5 + randn() * 0.16));
    const a = {
      id: i,
      name: pick(FIRST) + " " + pick(LAST),
      age: 19 + ((R() * 44) | 0),
      skill,
      wealth: Math.max(2, WEALTH_INIT.median * Math.exp(randn() * WEALTH_INIT.spread)),
      income: 0,
      employer: null, ownerOf: null,
      belief: Math.max(-1, Math.min(1, randn() * 0.35)), // -1 left … +1 right
      trust: 0.55 + R() * 0.3,
      conformity: R(), ambition: R(), openness: R(),
      friends: [],
      hx: d.x + rand(-150, 150), hy: d.y + rand(-95, 95),
      x: 0, y: 0, tx: 0, ty: 0,
      memory: [],
      unemployedMonths: 0,
      district: d.name,
      wealthHist: [],
    };
    a.x = a.tx = a.hx; a.y = a.ty = a.hy;
    agents.push(a);
  }
  // small-world-ish social graph: mostly same-district + belief homophily
  agents.forEach((a) => {
    const n = 4 + ((R() * 4) | 0);
    let guard = 0;
    while (a.friends.length < n && guard++ < 60) {
      const b = (R() * agents.length) | 0;
      if (b === a.id || a.friends.includes(b)) continue;
      const ob = agents[b];
      const sameD = ob.district === a.district;
      const close = Math.abs(ob.belief - a.belief) < 0.55;
      if ((sameD && R() < 0.75) || (close && R() < 0.5) || R() < 0.12) a.friends.push(b);
    }
  });

  /* ---------------- firms ---------------- */
  function addFirm(sectorIdx, opts) {
    opts = opts || {};
    const sec = SECTORS[sectorIdx];
    const f = {
      id: S.nextFirmId++,
      name: pick(FIRM_PRE) + " " + sec.name.slice(0, 4),
      sector: sectorIdx,
      x: opts.x != null ? opts.x : rand(90, W - 90),
      y: opts.y != null ? opts.y : rand(90, H - 90),
      employees: [],
      cash: opts.cash != null ? opts.cash : rand(150, 320),
      productivity: opts.productivity != null ? opts.productivity : rand(0.85, 1.2),
      baseWage: sec.wage,
      laborNeed: opts.laborNeed != null ? opts.laborNeed : 6 + ((R() * 8) | 0),
      automation: opts.automation || 0,
      owner: null, age: 0, flash: 0,
    };
    if (opts.owner != null) {
      f.owner = opts.owner;
      agents[opts.owner].ownerOf = f.id;
    } else {
      const o = agents[(R() * agents.length) | 0];
      f.owner = o.id; o.ownerOf = f.id;
      o.wealth = Math.max(o.wealth, 90); // seed capital class
    }
    firms.push(f);
    return f;
  }
  for (let i = 0; i < 10; i++) addFirm((R() * 5) | 0);
  // initial staffing
  firms.forEach((f) => {
    const pool = agents.filter((a) => !a.employer && !a.ownerOf && a.id !== f.owner);
    pool.sort((a, b) => (b.skill + R() * 0.3) - (a.skill + R() * 0.3));
    const n = Math.min(f.laborNeed, pool.length);
    for (let k = 0; k < n; k++) {
      const a = pool[k];
      a.employer = f.id; f.employees.push(a.id);
    }
  });
  S.log("Civilization founded — 120 citizens, " + firms.length + " firms.");

  const firmById = (id) => firms.find((f) => f.id === id);

  function bankrupt(f) {
    S.bankrupt++;
    const owner = agents[f.owner];
    if (owner) { owner.wealth *= 0.5; owner.ownerOf = null; remember(owner, f.name + " went bankrupt"); }
    f.employees.forEach((id) => {
      const a = agents[id];
      a.employer = null; a.unemployedMonths = 1;
      remember(a, "Lost job at " + f.name);
    });
    S.log("💀 " + f.name + " (" + SECTORS[f.sector].name + ") went bankrupt — " + f.employees.length + " jobs lost.");
    const i = firms.indexOf(f);
    if (i >= 0) firms.splice(i, 1);
  }

  function tryFoundFirm(a) {
    if (a.ownerOf || a.wealth < 30 || a.ambition < 0.55 || firms.length >= 18) return;
    if (R() > 0.006 + a.ambition * 0.012) return;
    const sec = (R() * 5) | 0;
    a.wealth -= 30;
    if (a.employer) { // quit to found
      const old = firmById(a.employer);
      if (old) { const i = old.employees.indexOf(a.id); if (i >= 0) old.employees.splice(i, 1); }
      a.employer = null;
      remember(a, "Quit to start a company");
    }
    const f = addFirm(sec, { owner: a.id, cash: 120, laborNeed: 3 + ((R() * 4) | 0) });
    f.x = Math.max(90, Math.min(W - 90, a.hx + rand(-60, 60)));
    f.y = Math.max(90, Math.min(H - 90, a.hy + rand(-60, 60)));
    S.founded++;
    remember(a, "Founded " + f.name);
    S.log("🏭 " + a.name + " founded " + f.name + " (" + SECTORS[sec].name + ").");
  }

  /* ---------------- policy actions ---------------- */
  function effectActive(kind) { return S.effects.some((e) => e.kind === kind); }

  S.setTax = (v) => { S.policy.tax = Math.max(0, Math.min(0.6, v)); };
  S.setUBI = (on, amt) => {
    const was = S.policy.ubi;
    S.policy.ubi = !!on;
    if (amt != null) S.policy.ubiAmount = Math.max(0, Math.min(3, amt));
    if (on && !was) S.log("🏛️ Universal Basic Income enacted — $" + S.policy.ubiAmount.toFixed(1) + "k/mo per citizen.");
    if (!on && was) S.log("🏛️ UBI repealed.");
  };

  S.techShock = () => {
    let displaced = 0;
    firms.forEach((f) => {
      const routine = SECTORS[f.sector].routine;
      if (routine > 0.30 && R() < routine + 0.25) {
        f.automation = Math.min(1, f.automation + 0.5 + R() * 0.3);
        f.productivity *= 1 + 0.35 * f.automation;
        const target = Math.round(f.laborNeed * (1 - 0.55 * f.automation));
        while (f.employees.length > target && f.employees.length > 1) {
          f.employees.sort((x, y) => agents[x].skill - agents[y].skill);
          const id = f.employees.shift();
          agents[id].employer = null; agents[id].unemployedMonths = 1;
          remember(agents[id], "Job automated at " + f.name);
          displaced++;
        }
      }
    });
    // new AI-sector firms rise
    const n = 1 + ((R() * 2) | 0);
    for (let k = 0; k < n; k++) {
      const f = addFirm(0, { cash: 220, productivity: rand(1.5, 1.9), laborNeed: 3 + ((R() * 3) | 0) });
      f.flash = 3;
    }
    S.effects.push({ kind: "tech-boom", left: 24 });
    S.effects.push({ kind: "disruption", left: 12 }); // hiring freeze while labor market re-prices
    S.log("🤖 TECH BREAKTHROUGH — automation sweeps routine work. " + displaced + " jobs displaced, productivity +35%.");
  };

  S.misinformation = () => {
    S.effects.push({ kind: "misinfo", left: 14 });
    S.log("📢 MISINFORMATION WAVE — trust collapsing, beliefs radicalizing.");
  };

  S.disaster = () => {
    const hit = [];
    const pool = firms.slice();
    for (let k = 0; k < Math.min(3, pool.length); k++) {
      const f = pool.splice((R() * pool.length) | 0, 1)[0];
      hit.push(f);
    }
    hit.forEach((f) => {
      f.cash -= rand(80, 160);
      f.productivity *= 0.85;
      f.flash = 3;
    });
    agents.forEach((a) => {
      if (R() < 0.35) { a.wealth *= rand(0.7, 0.9); a.trust = Math.max(0, a.trust - 0.08); }
    });
    S.effects.push({ kind: "disaster", left: 10 });
    S.log("🌪️ NATURAL DISASTER — " + hit.map((f) => f.name).join(", ") + " damaged. Wealth destroyed.");
  };

  S.recession = () => {
    S.effects.push({ kind: "recession", left: 14 });
    S.log("📉 RECESSION — demand collapsing across all sectors.");
  };

  S.stimulus = () => {
    const amt = 2.0;
    agents.forEach((a) => { a.wealth += amt; });
    S.gov.debt += amt * agents.length;
    S.log("💸 STIMULUS — $" + amt + "k helicopter money per citizen. National debt grows.");
  };

  S.preset = (name) => {
    if (name === "laissez") {
      S.setTax(0.10); S.setUBI(false);
      S.log("⚖️ Preset: LAISSEZ-FAIRE — low tax, no safety net.");
    } else if (name === "nordic") {
      S.setTax(0.45); S.setUBI(true, 1.2);
      S.log("⚖️ Preset: NORDIC MODEL — high tax, generous UBI.");
    } else if (name === "automation") {
      S.setTax(0.15); S.setUBI(false);
      S.techShock();
      S.log("⚖️ Preset: AUTOMATION CRISIS — tech shock, thin safety net.");
    } else if (name === "postscarcity") {
      S.techShock(); S.setTax(0.50); S.setUBI(true, 2.4);
      S.log("⚖️ Preset: POST-SCARCITY — automation dividend shared via UBI.");
    }
  };

  /* ---------------- the tick ---------------- */
  function shockDemandMult() {
    let m = 1;
    S.effects.forEach((e) => {
      if (e.kind === "recession") m *= 0.62;
      if (e.kind === "disaster") m *= 0.88;
      if (e.kind === "tech-boom") m *= 1.10;
    });
    return m;
  }

  S.tickOnce = function () {
    S.tick++; S.month++;
    if (S.month >= 12) { S.month = 0; S.year++; }
    S.effects.forEach((e) => e.left--);
    S.effects = S.effects.filter((e) => e.left > 0);
    // random sector slumps → genuine business cycles
    if (R() < 0.02) {
      const s = (R() * 5) | 0;
      S.effects.push({ kind: "slump", sector: s, left: 12 + ((R() * 12) | 0) });
      S.log("📉 " + SECTORS[s].name + " sector slump — demand collapsing.");
    }
    const misinfo = effectActive("misinfo");
    // central bank: automatic stabilizer — cheap credit props up demand when jobs vanish
    const empRatePre = agents.filter((a) => a.employer || a.ownerOf).length / agents.length;
    const stab = 1 + Math.max(0, 0.88 - empRatePre) * 1.2;
    const dMult = shockDemandMult() * stab;
    const tax = S.policy.tax;

    // --- firms: produce, pay, hire/fire ---
    let totalRevenue = 0;
    const empRate = agents.filter((a) => a.employer || a.ownerOf).length / agents.length;
    const firmsSnapshot = firms.slice();
    firmsSnapshot.forEach((f) => {
      if (!firms.includes(f)) return;
      f.age++; if (f.flash > 0) f.flash--;
      // Phillips curve: tight labor markets bid wages up, slack pushes them down
      const secWage = SECTORS[f.sector].wage;
      f.baseWage = Math.min(secWage * 2.2, Math.max(secWage * 0.55, f.baseWage * (1 + 0.010 * (empRate - 0.87))));
      const dem0 = Math.min(1.7, Math.max(0.4, S.sectorDemand[f.sector] * dMult));
      let dem = dem0;
      S.effects.forEach((e) => { if (e.kind === "slump" && e.sector === f.sector) dem *= 0.55; });
      const effNeed = Math.max(1, Math.round(f.laborNeed * (1 - 0.4 * f.automation)));
      // lay off surplus from automation first
      while (f.employees.length > effNeed && f.employees.length > 1) {
        f.employees.sort((x, y) => agents[x].skill - agents[y].skill);
        const id = f.employees.shift();
        agents[id].employer = null; agents[id].unemployedMonths = 1;
        remember(agents[id], "Laid off from " + f.name);
      }
      const rev = f.employees.length * f.productivity * 6.0 * dem;
      totalRevenue += rev;
      let wageBill = 0;
      const wages = [];
      f.employees.forEach((id) => {
        const a = agents[id];
        const gross = f.baseWage * (0.5 + a.skill);
        wageBill += gross; wages.push([a, gross]);
      });
      const pbt = rev - wageBill;
      const pTax = Math.max(0, pbt) * tax;
      S.gov.fund += pTax;
      f.cash += pbt - pTax;
      f.cash -= 4 + f.employees.length * 0.2; // overhead: rent, utilities — zombies bleed out
      // pay workers
      wages.forEach(([a, gross]) => {
        const t = gross * tax;
        const net = gross - t;
        S.gov.fund += t;
        a.income += net; a.wealth += net;
        a.unemployedMonths = 0;
      });
      // owner dividend
      const owner = agents[f.owner];
      if (pbt > 0 && owner) {
        const div = pbt * 0.5;
        f.cash -= div;
        owner.income += div; owner.wealth += div;
      }
      // hire / fire on cash position
      if (f.cash < wageBill * 1.2 && f.employees.length > 1) {
        f.employees.sort((x, y) => agents[x].skill - agents[y].skill);
        const n = Math.max(1, Math.ceil(f.employees.length * 0.25));
        for (let k = 0; k < n; k++) {
          const id = f.employees.shift();
          if (id == null) break;
          agents[id].employer = null; agents[id].unemployedMonths = 1;
          remember(agents[id], "Laid off from " + f.name);
        }
        if (n > 2) S.log("📉 " + f.name + " laid off " + n + " workers.");
      } else if (f.cash > Math.max(30, wageBill * 1.5) && f.employees.length < effNeed && dem > 0.95 && !effectActive("disruption")) {
        const cand = agents
          .filter((a) => !a.employer && !a.ownerOf)
          .sort((a, b) => (b.skill + b.ambition * 0.3) - (a.skill + a.ambition * 0.3))
          .slice(0, 2);
        cand.forEach((a) => {
          a.employer = f.id; f.employees.push(a.id);
          a.unemployedMonths = 0;
          remember(a, "Hired by " + f.name);
        });
        if (cand.length) f.flash = 2;
      }
      if (f.cash < -40) bankrupt(f);
    });

    // --- government: UBI + benefits ---
    if (S.policy.ubi) {
      const amt = S.policy.ubiAmount;
      agents.forEach((a) => { a.wealth += amt; a.income += amt * 0.0; });
      S.gov.fund -= amt * agents.length;
    }
    agents.forEach((a) => {
      if (!a.employer && !a.ownerOf) {
        a.wealth += S.policy.benefits;
        a.income += S.policy.benefits;
        S.gov.fund -= S.policy.benefits;
        a.unemployedMonths++;
      }
    });
    if (S.gov.fund < 0) { S.gov.debt -= S.gov.fund; S.gov.fund = 0; }

    // --- agents: consume, beliefs, founding ---
    let totalSpend = 0;
    agents.forEach((a) => {
      const spend = Math.min(a.wealth + a.income, 0.80 * a.income + 0.02 * a.wealth);
      a.wealth = Math.max(0, a.wealth - spend);
      totalSpend += spend;
      // capital returns: invested wealth compounds (r > g — the engine of inequality)
      if (a.wealth > 40) a.wealth *= 1.004;
      // social influence
      let fa = 0;
      a.friends.forEach((fid) => { fa += agents[fid].belief; });
      fa /= Math.max(1, a.friends.length);
      let nb = a.belief + a.conformity * 0.03 * (fa - a.belief);
      if (!a.employer && !a.ownerOf) nb -= 0.005;      // hardship drifts left
      else nb += 0.002;                               // security drifts right
      if (a.wealth > 150) nb += 0.004;                 // wealth drifts right
      if (misinfo) {
        nb += Math.sign(nb || randn()) * 0.03 * (0.4 + a.openness) + randn() * 0.07;
        a.trust = Math.max(0, a.trust - 0.03);
      } else {
        a.trust = Math.min(1, a.trust + 0.003);
      }
      a.belief = Math.max(-1, Math.min(1, nb));
      a.income = 0;
      tryFoundFirm(a);
    });

    // --- demand follows consumption (business cycle) ---
    const spendRatio = totalSpend / S.baselineSpend;
    S.baselineSpend = S.baselineSpend * 0.95 + totalSpend * 0.05;
    S.sectorDemand = S.sectorDemand.map((d) =>
      Math.min(1.6, Math.max(0.5, d * 0.97 + (0.80 + 0.35 * spendRatio) * 0.03 + randn() * 0.02))
    );

    // --- metrics ---
    const wealths = agents.map((a) => a.wealth);
    const employed = agents.filter((a) => a.employer || a.ownerOf).length;
    const m = {
      gini: giniOf(wealths),
      employment: employed / agents.length,
      polarization: stdOf(agents.map((a) => a.belief)),
      avgWealth: wealths.reduce((x, y) => x + y, 0) / wealths.length,
      medianWealth: wealths.slice().sort((a, b) => a - b)[60],
      poverty: wealths.filter((w) => w < 8).length / wealths.length,
      firms: firms.length,
      productivity: totalRevenue,
      trust: agents.reduce((x, a) => x + a.trust, 0) / agents.length,
      debt: S.gov.debt,
    };
    // social mobility: 1 - rank correlation of wealth vs 24 ticks ago
    if (S.tick % 12 === 0) {
      const now = agents.map((a) => a.wealth);
      const past = agents.map((a) => (a.wealthHist.length ? a.wealthHist[0] : a.wealth));
      m.mobility = Math.max(0, Math.min(1, 1 - rankCorr(now, past)));
      agents.forEach((a) => {
        a.wealthHist.push(a.wealth);
        if (a.wealthHist.length > 3) a.wealthHist.shift(); // 3 × 12 ticks = 36-month window
      });
    } else {
      m.mobility = S.metrics.mobility != null ? S.metrics.mobility : 0.5;
    }
    S.metrics = m;
    S.history.push({
      gini: m.gini, emp: m.employment, pol: m.polarization,
      avgW: m.avgWealth, firms: m.firms, prod: m.productivity, trust: m.trust,
    });
    if (S.history.length > 300) S.history.shift();

    // 🗳️ elections every 4 years: politics feeds back into the economy
    if (S.tick % 48 === 0) {
      const votes = agents.map((a) => {
        let v = a.belief + randn() * 0.25;
        if (!a.employer && !a.ownerOf) v -= 0.12;  // the jobless lean left
        if (a.wealth > 200) v += 0.08;             // the rich lean right
        return v;
      });
      const left = votes.filter((v) => v < 0).length;
      const right = agents.length - left;
      if (left >= right) {
        S.policy.tax = Math.min(0.6, S.policy.tax + 0.05);
        if (!S.policy.ubi && m.gini > 0.5 && R() < 0.5) S.setUBI(true, 1.0);
        S.log("🗳️ ELECTION — Solidarity coalition wins " + left + "–" + right + ". Taxes → " + Math.round(S.policy.tax * 100) + "%.");
      } else {
        S.policy.tax = Math.max(0.05, S.policy.tax - 0.05);
        S.log("🗳️ ELECTION — Market coalition wins " + right + "–" + left + ". Taxes → " + Math.round(S.policy.tax * 100) + "%.");
      }
    }
    // ambient events
    if (S.tick % 24 === 0 && R() < 0.7) {
      const richest = agents.slice().sort((a, b) => b.wealth - a.wealth)[0];
      const poorest = agents.slice().sort((a, b) => a.wealth - b.wealth)[0];
      if (m.gini > 0.48) S.log("⚠️ Inequality at historic highs — richest citizen holds $" + richest.wealth.toFixed(0) + "k vs $" + poorest.wealth.toFixed(0) + "k poorest.");
      else if (m.employment < 0.8) S.log("😟 Unemployment crisis — " + Math.round((1 - m.employment) * 100) + "% of citizens out of work.");
      else if (m.employment > 0.96) S.log("🌤️ Full employment — firms competing for workers.");
      else if (m.polarization > 0.35) S.log("🗣️ Society deeply polarized — neighbors stop talking to neighbors.");
    }
  };

  // initial metrics pass (so UI has data before first tick)
  S.tickOnce();

  return S;
}

if (typeof module !== "undefined") module.exports = { createSim, SECTORS, giniOf, applyCalibration, CALIBRATION, WEALTH_INIT };
