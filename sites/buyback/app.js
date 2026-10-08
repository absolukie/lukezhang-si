/* Buyback — lemon law case builder. All data stays in localStorage. */
"use strict";

/* ---- Real statute thresholds (researched 2026-10-07) ---- */
const STATES = {
  CA: {
    abbr: "CA", name: "California",
    reviewed: "2026-10-07", reverified: false,
    law: "Song-Beverly Consumer Warranty Act",
    cite: "Cal. Civil Code \u00A71793.22",
    windowMonths: 18, windowMiles: 18000,
    blurb: "4+ repairs, or more than 30 days in the shop",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ failed attempts at the same defect within 18 mo / 18,000 mi." },
      { id: "safety", label: "Safety-defect repairs", need: 2, unit: "repairs", note: "2+ attempts for a defect that could cause death or serious injury." },
      { id: "days", label: "Days out of service", need: 30, strict: true, unit: "days", note: "More than 30 cumulative days in the shop (the statute says \u201Cmore than 30\u201D, so 30 exactly does not count)." }
    ]
  },
  TX: {
    abbr: "TX", name: "Texas",
    reviewed: "2026-10-07", reverified: false,
    law: "Texas Lemon Law",
    cite: "Tex. Occ. Code \u00A72301.605",
    windowMonths: 24, windowMiles: 24000,
    blurb: "4+ repairs (2+2 split), or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ failed attempts for the same problem within 24 mo / 24,000 mi." },
      { id: "safety", label: "Serious safety hazard repairs", need: 2, unit: "repairs", note: "2+ attempts for a serious safety hazard (brakes, steering, fire risk)." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative days out of service for repairs." }
    ],
    extra: "Texas detail: at least 2 of the 4 attempts should fall in the first year/12,000 miles and 2 more in the second. You must file within 6 months after the earliest of warranty expiration, 24 months, or 24,000 miles."
  },
  FL: {
    abbr: "FL", name: "Florida",
    reviewed: "2026-10-07", reverified: false,
    law: 'Motor Vehicle Warranty Enforcement Act',
    cite: "Fla. Stat. ch. 681",
    windowMonths: 24, windowMiles: null,
    blurb: "3+ repairs + notice, or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at the same defect, then written notice to the manufacturer for a final repair attempt." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative days. At 15 days you must send written notice to the manufacturer." }
    ],
    extra: "Florida requires written notice (registered/express mail) to the manufacturer after the 3rd attempt or at 15 cumulative days, giving them a final chance to repair."
  },
  NY: {
    abbr: "NY", name: "New York",
    reviewed: "2026-10-07", reverified: false,
    law: "New Car Lemon Law",
    cite: "N.Y. Gen. Bus. Law \u00A7198-a",
    windowMonths: 24, windowMiles: 18000,
    blurb: "4+ repairs, or 30+ days in the shop",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ attempts for the same defect within 2 years / 18,000 mi." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative calendar days out of service." }
    ]
  },
  OH: {
    abbr: "OH", name: "Ohio",
    reviewed: "2026-10-07", reverified: false,
    law: "Ohio Lemon Law",
    cite: "Ohio Rev. Code \u00A71345.72",
    windowMonths: 12, windowMiles: 18000,
    blurb: "3+ repairs, 8 total, or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at the same defect within 1 year / 18,000 mi." },
      { id: "safety", label: "Safety-defect repairs", need: 1, unit: "repair", note: "Even 1 attempt for a defect likely to cause death or serious injury can trigger the presumption." },
      { id: "total", label: "Total repair attempts", need: 8, unit: "repairs", note: "8+ attempts for any defects that substantially impair use or value." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative calendar days in the shop." }
    ],
    extra: "Ohio's window is the shortest of any state here: 1 year or 18,000 miles. You have 5 years from delivery to file, but the defect must start inside the window."
  },
  IL: {
    abbr: "IL", name: "Illinois",
    reviewed: "2026-10-07", reverified: true,
    law: "Illinois New Vehicle Buyer Protection Act",
    cite: "815 ILCS 380/1 et seq.",
    daysBasis: "business",
    windowMonths: 12, windowMiles: 12000,
    blurb: "4+ repairs, or 30+ business days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ attempts at the same nonconformity, which must still exist." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative business days in the shop." }
    ],
    extra: "Illinois requires prior direct written notice to the manufacturer (and a chance to correct the defect) before the presumption applies. No state-run arbitration: use the manufacturer's dispute process first. You must file within 18 months of delivery."
  },
  PA: {
    abbr: "PA", name: "Pennsylvania",
    reviewed: "2026-10-07", reverified: true,
    law: "Pennsylvania Automobile Lemon Law",
    cite: "73 P.S. \u00A7\u00A71951\u20131963",
    windowMonths: 12, windowMiles: 12000,
    blurb: "3+ repairs, or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at the same nonconformity, which must still exist." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative calendar days (any defects, need not be the same one)." }
    ],
    extra: "Pennsylvania has no state-run arbitration: first use the manufacturer's dispute process if one exists, then you may sue in the court of common pleas. Your dealer must notify the manufacturer when you come in for the second repair of the same defect."
  },
  NJ: {
    abbr: "NJ", name: "New Jersey",
    reviewed: "2026-10-07", reverified: true,
    law: "New Jersey New Car Lemon Law",
    cite: "N.J.S.A. 56:12-29 to -49",
    windowMonths: 24, windowMiles: 24000,
    blurb: "3+ repairs (1 for safety), or 20+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at substantially the same nonconformity." },
      { id: "safety", label: "Safety-defect repairs", need: 1, unit: "repair", note: "1 attempt for a defect likely to cause death or serious bodily injury." },
      { id: "days", label: "Days out of service", need: 20, unit: "days", note: "20+ cumulative calendar days (45+ for motorhomes)." }
    ],
    arb: { name: "NJ Lemon Law Unit", url: "https://www.njconsumeraffairs.gov/llu/Pages/default.aspx" },
    extra: "New Jersey requires certified-mail notice to the manufacturer after 2 attempts or 20 days, giving them one final 10-day repair chance. State arbitration runs through the NJ Lemon Law Unit."
  },
  GA: {
    abbr: "GA", name: "Georgia",
    reviewed: "2026-10-07", reverified: true,
    law: "Georgia Motor Vehicle Warranty Rights Act",
    cite: "O.C.G.A. \u00A7\u00A710-1-780 to -798",
    windowMonths: 24, windowMiles: 24000,
    blurb: "3+ repairs (1 for safety), or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at the same nonconformity." },
      { id: "safety", label: "Safety-defect repairs", need: 1, unit: "repair", note: "1 attempt for a serious safety defect that was not corrected." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative days (the AG's guide says at least 15 must fall inside the rights period)." }
    ],
    arb: { name: "GA AG Lemon Law Arbitration", url: "https://www.law.ga.gov/LemonLaw" },
    extra: "Georgia requires certified-mail/overnight notice after the attempts thresholds, with a 28-day final repair chance (waived for the 30-day route). State arbitration through the Attorney General must start within 1 year after the rights period ends."
  },
  NC: {
    abbr: "NC", name: "North Carolina",
    reviewed: "2026-10-07", reverified: true,
    law: "North Carolina New Motor Vehicles Warranties Act",
    cite: "N.C. Gen. Stat. \u00A7\u00A720-351 to 20-351.8",
    daysBasis: "business",
    windowMonths: 24, windowMiles: 24000,
    blurb: "4+ repairs, or 20+ business days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ attempts at the same nonconformity." },
      { id: "days", label: "Days out of service", need: 20, unit: "days", note: "20+ cumulative business days within any 12-month warranty period." }
    ],
    extra: "North Carolina requires direct written notice to the manufacturer with up to 15 days to cure before the presumption applies (if disclosed in your warranty), plus 10 days' written notice before filing suit. No state arbitration: the remedy is a civil action."
  },
  WA: {
    abbr: "WA", name: "Washington",
    reviewed: "2026-10-07", reverified: true,
    law: "Washington Motor Vehicle Warranty Enforcement Act",
    cite: "Wash. Rev. Code ch. 19.118",
    windowMonths: 24, windowMiles: 24000,
    blurb: "4+ repairs (2 for safety), or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ diagnoses/repairs of the same nonconformity." },
      { id: "safety", label: "Safety-defect repairs", need: 2, unit: "repairs", note: "2+ for the same serious safety defect, or 2+ different serious safety defects within 12 months." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative calendar days (at least 15 within the warranty period)." }
    ],
    arb: { name: "WA Lemon Law Administration (AG)", url: "https://www.atg.wa.gov/general-lemon-law" },
    extra: "Before arbitration, send the manufacturer a written repurchase/replacement request; they have 40 days to respond. State arbitration via the Attorney General must be requested within 30 months of delivery."
  },
  CO: {
    abbr: "CO", name: "Colorado",
    reviewed: "2026-10-07", reverified: true,
    law: "Colorado Lemon Law",
    cite: "Colo. Rev. Stat. \u00A7\u00A742-10-101 to 42-10-108",
    daysBasis: "business",
    windowMonths: 24, windowMiles: 24000,
    blurb: "3+ repairs (2 for safety), or 24+ business days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at the same nonconformity." },
      { id: "safety", label: "Safety-defect repairs", need: 2, unit: "repairs", note: "2+ for a safety-based nonconformity (death/serious injury or fire risk)." },
      { id: "days", label: "Days out of service", need: 24, unit: "days", note: "24+ cumulative business days." }
    ],
    extra: "Colorado requires prior written notice by certified mail, with 10 business days for the manufacturer to cure (the cure attempt counts toward the thresholds). No state-run arbitration: use the manufacturer's dispute process or court. These are the post-August-2024 rules; earlier vehicles use 4 attempts / 30 business days / a 12-month window."
  },
  AZ: {
    abbr: "AZ", name: "Arizona",
    reviewed: "2026-10-07", reverified: true,
    law: "Arizona Motor Vehicle Warranties Act",
    cite: "A.R.S. \u00A7\u00A744-1261 to 44-1267",
    windowMonths: 24, windowMiles: 24000,
    blurb: "4+ repairs, or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 4, unit: "repairs", note: "4+ repairs of the same nonconformity." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative calendar days out of service for repair." }
    ],
    extra: "Arizona requires prior direct written notice to the manufacturer with an opportunity to cure. No state arbitration: use the manufacturer's dispute process first. Note the short 6-month deadline to file after the warranty or 2-year/24,000-mile mark."
  },
  MA: {
    abbr: "MA", name: "Massachusetts",
    reviewed: "2026-10-07", reverified: true,
    law: "Massachusetts New Car Lemon Law",
    cite: "Mass. Gen. Laws ch. 90, \u00A77N\u00BD",
    daysBasis: "business",
    windowMonths: 12, windowMiles: 15000,
    blurb: "3+ repairs, or 15+ business days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ attempts at the same substantial defect." },
      { id: "days", label: "Days out of service", need: 15, unit: "days", note: "15+ cumulative business days (any substantial defects)." }
    ],
    arb: { name: "MA Lemon Law Arbitration (OCABR)", url: "https://www.mass.gov/guides/guide-to-new-and-leased-car-lemon-law" },
    extra: "After the threshold is met you must give the manufacturer a final 7-business-day repair chance. State arbitration runs through the Office of Consumer Affairs and Business Regulation."
  },
  VA: {
    abbr: "VA", name: "Virginia",
    reviewed: "2026-10-07", reverified: true,
    law: "Virginia Motor Vehicle Warranty Enforcement Act",
    cite: "Va. Code \u00A7\u00A759.1-207.9 to 59.1-207.16",
    windowMonths: 18, windowMiles: null,
    blurb: "3+ repairs (1 for safety), or 30+ days",
    routes: [
      { id: "repeat", label: "Same-problem repairs", need: 3, unit: "repairs", note: "3+ repairs of the same nonconformity." },
      { id: "safety", label: "Safety-defect repairs", need: 1, unit: "repair", note: "1+ repair of a serious safety defect." },
      { id: "days", label: "Days out of service", need: 30, unit: "days", note: "30+ cumulative calendar days." }
    ],
    extra: "Virginia's rights period is 18 months with no mileage cap. Written notice to the manufacturer is required before you are eligible for refund/replacement. No state arbitration: the Act is enforced by private civil action."
  }
};
const STATE_ORDER = ["CA", "TX", "FL", "NY", "OH", "IL", "PA", "NJ", "GA", "NC", "WA", "CO", "AZ", "MA", "VA"];

/* Data versions, recorded on every intake snapshot so a firm can see exactly
   which threshold dataset and consent text the submission was built from. */
const THRESHOLD_DATA_VERSION = "2026-10-08";
const CONSENT_VERSION = "consent-v1-2026-10-08";
const CONSENT_TEXT = "I agree that a participating lemon law attorney may contact me about my case using the information listed above. I understand this is not legal advice and no attorney-client relationship is formed by this request.";

/* ---- storage ---- */
const KEY = "buyback.v1";
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* quota: drop photos */ } try { if (window.__buybackSync) window.__buybackSync.onSave(); } catch (e) { /* sync optional */ } }
let db = load() || { state: null, car: null, repairs: [], intake: null };
/* Backward-compatible normalization for fields added after first save. */
function normalizeDb() {
  db.celebrated = db.celebrated || {};
  db.moments = Array.isArray(db.moments) ? db.moments : [];
}
normalizeDb();
let uidc = Date.now();
const uid = () => "r" + (uidc++) + Math.floor(Math.random() * 1e4);

/* ---- helpers ---- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = iso => { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
const fmtMile = m => m ? Number(m).toLocaleString("en-US") + " mi" : "";
/* Calendar-day counter, INCLUSIVE of both endpoints: Feb 3 -> Feb 10 is 8 days.
   Same-day visits count as 1 day. Returns 0 when b < a (used by window clipping). */
const daysBetween = (a, b) => {
  const d = Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
  return d < 0 ? 0 : d + 1;
};
/* Business-day counter for IL, NC, CO, MA day thresholds. Counts Mon-Fri in
   [a, b] inclusive. Federal holidays are NOT excluded (disclosed in the UI).
   Returns 0 when b < a. */
function businessDaysBetween(a, b) {
  let n = 0;
  const d = new Date(a + "T12:00:00"), end = new Date(b + "T12:00:00");
  if (end < d) return 0;
  for (; d <= end; d.setDate(d.getDate() + 1)) { const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}
function todayLocalISO() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function isoDateOf(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function nextDayISO(iso) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + 1); return isoDateOf(d); }
/* Days of [a, b] clipped to the presumption window [ws, we]. */
function clippedDays(a, b, business, ws, we) {
  const s = a < ws ? ws : a, e = b > we ? we : b;
  if (e < s) return 0;
  return business ? businessDaysBetween(s, e) : daysBetween(s, e);
}
/* Union of overlapping/adjacent intervals, clipped to [ws, we].
   Overlapping shop visits count once. intervals: [[inISO, outISO], ...]. */
function unionDays(intervals, business, ws, we) {
  const clipped = [];
  for (const iv of intervals) {
    const s = iv[0] < ws ? ws : iv[0], e = iv[1] > we ? we : iv[1];
    if (s <= e) clipped.push([s, e]);
  }
  clipped.sort((x, y) => x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0);
  const merged = [];
  for (const iv of clipped) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= nextDayISO(last[1])) { if (iv[1] > last[1]) last[1] = iv[1]; }
    else merged.push([iv[0], iv[1]]);
  }
  return merged.reduce((n, iv) => n + (business ? businessDaysBetween(iv[0], iv[1]) : daysBetween(iv[0], iv[1])), 0);
}
/* NC: max business-day union inside any 12-month span of the warranty window. */
function ncRollingDays(intervals, ws, we) {
  let best = 0;
  for (const iv of intervals) {
    let winEnd = isoDateOf(addMonths(iv[0], 12));
    if (winEnd > we) winEnd = we;
    best = Math.max(best, unionDays(intervals, true, iv[0], winEnd));
  }
  return best;
}
function daysOut(r, business, ws, we) {
  const out = r.dateOut || todayLocalISO();
  return clippedDays(r.dateIn, out, business, ws || "0000-01-01", we || "9999-12-31");
}
function addMonths(iso, m) { const d = new Date(iso + "T12:00:00"); d.setMonth(d.getMonth() + m); return d; }
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1100 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = rej; img.src = e.target.result;
    };
    reader.onerror = rej; reader.readAsDataURL(file);
  });
}

/* ---- qualification engine ---- */
function computeCase() {
  const st = STATES[db.state];
  if (!st || !db.car || !db.car.deliveryDate) return null;
  const windowEndD = addMonths(db.car.deliveryDate, st.windowMonths);
  const windowStart = db.car.deliveryDate;
  const windowEnd = isoDateOf(windowEndD);
  const windowStartD = new Date(db.car.deliveryDate + "T12:00:00");
  const inWin = db.repairs.filter(r => { const d = new Date(r.dateIn + "T12:00:00"); return d >= windowStartD && d <= windowEndD; });
  const outWin = db.repairs.length - inWin.length;
  const biz = st.daysBasis === "business";
  const byProblem = Object.create(null);
  inWin.forEach(r => { const k = String(r.problem || "").trim().toLowerCase(); (byProblem[k] = byProblem[k] || []).push(r); });
  const probs = Object.entries(byProblem).map(([k, arr]) => ({
    name: String(arr[0].problem || "").trim() || "(no description)", attempts: arr.length,
    safety: arr.filter(r => r.safety).length
  })).sort((a, b) => b.attempts - a.attempts);
  const intervals = inWin.map(r => [r.dateIn, r.dateOut || todayLocalISO()]);
  /* Overlapping shop visits count once; intervals clip to the presumption window. */
  const totalDays = unionDays(intervals, biz, windowStart, windowEnd);
  const routes = st.routes.map(rt => {
    let val = 0, detail = "";
    if (rt.id === "repeat") { val = probs.length ? probs[0].attempts : 0; detail = probs.length ? "\u201C" + probs[0].name + "\u201D leads with " + val : "Log repairs to start counting"; }
    else if (rt.id === "safety") { val = probs.reduce((m, p) => Math.max(m, p.safety), 0); detail = val ? val + " flagged safety attempt(s)" : "Flag a repair as a safety issue if it applies"; }
    else if (rt.id === "days") {
      /* NC evaluates business days inside any rolling 12-month warranty span. */
      val = (db.state === "NC") ? ncRollingDays(intervals, windowStart, windowEnd) : totalDays;
      detail = val + " cumulative " + (biz ? "business " : "") + "day(s) in the shop" + (db.state === "NC" ? " (best any 12-month span)" : "");
    }
    else if (rt.id === "total") { val = inWin.length; detail = val + " total logged repair(s)"; }
    /* CA's days statute reads "more than 30": strictly greater, not >=. */
    const met = rt.strict ? val > rt.need : val >= rt.need;
    const prog = rt.strict ? val / (rt.need + 1) : val / rt.need;
    return Object.assign({}, rt, { val, detail, met, prog });
  });
  const qualified = routes.some(r => r.met);
  const best = routes.reduce((m, r) => Math.max(m, Math.min(1, r.prog)), 0);
  return { st, routes, qualified, best, probs, totalDays, inWin, outWin, windowEnd, windowStart, biz };
}

/* ---- sample case ---- */
$$(".sampleCaseBtn").forEach(b => b.addEventListener("click", () => {
  if ((db.state || db.car || db.repairs.length) && !confirm("Loading the sample case replaces your current case data. Continue?")) return;
  db.state = "CA";
  db.car = { year: "2024", make: "Ford", model: "F-150", vin: "", deliveryDate: "2025-01-15", miles: "9500" };
  db.repairs = [
    { id: uid(), problem: "Transmission shudder", dateIn: "2025-02-03", dateOut: "2025-02-10", dealer: "Downtown Ford", desc: "Shudder between 3rd and 4th gear. Reprogrammed TCM.", safety: false, photo: null },
    { id: uid(), problem: "Transmission shudder", dateIn: "2025-03-12", dateOut: "2025-03-18", dealer: "Downtown Ford", desc: "Shudder returned. Replaced valve body.", safety: false, photo: null },
    { id: uid(), problem: "Transmission shudder", dateIn: "2025-05-06", dateOut: "2025-05-20", dealer: "Riverside Ford", desc: "Shudder worse. Torque converter replaced.", safety: false, photo: null },
    { id: uid(), problem: "Transmission shudder", dateIn: "2025-07-08", dateOut: "2025-07-15", dealer: "Downtown Ford", desc: "Still shuddering. Dealer states operating as designed.", safety: false, photo: null }
  ];
  save(); goStep("case"); renderCase();
}));

/* ---- wizard ---- */
function goStep(step) {
  $$(".wstep").forEach(el => el.classList.toggle("hidden", el.dataset.step !== step));
  $$("#wizardProgress li").forEach(li => {
    const order = ["state", "car", "case"];
    const liIdx = order.indexOf(li.dataset.sp), cur = order.indexOf(step);
    li.classList.toggle("active", li.dataset.sp === step);
    li.classList.toggle("done", liIdx < cur);
  });
  const app = $("#app");
  if (app) app.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStateGrid() {
  $("#stateGrid").innerHTML = STATE_ORDER.map(k => {
    const s = STATES[k];
    return `<button type="button" class="state-card" data-state="${k}">
      <div class="abbr">${s.abbr}</div><div class="sname">${esc(s.name)}</div>
      <div class="srule">${esc(s.blurb)}</div></button>`;
  }).join("");
  $$("#stateGrid .state-card").forEach(b => b.addEventListener("click", () => {
    db.state = b.dataset.state; save(); goStep("car"); prefillCar();
  }));
}

function renderStateCards() {
  $("#stateCards").innerHTML = STATE_ORDER.map(k => {
    const s = STATES[k];
    const win = s.windowMonths + " months" + (s.windowMiles ? " / " + s.windowMiles.toLocaleString() + " miles" : "");
    return `<div class="scard"><h3>${s.abbr}: ${esc(s.name)}</h3>
      <div class="law">${esc(s.law)}</div>
      <ul>
        <li><svg class="ic"><use href="#i-cal"/></svg><span>Presumption window: <strong>${win}</strong> from delivery</span></li>
        ${s.routes.map(r => `<li><svg class="ic"><use href="#i-check"/></svg><span><strong>${r.strict ? "&gt;" + r.need : r.need + "+"} ${r.unit}</strong>: ${esc(r.label.toLowerCase())}</span></li>`).join("")}
      </ul>
      ${s.extra ? `<p class="micro" style="margin-top:10px">${esc(s.extra)}</p>` : ""}
      ${s.arb ? `<p class="micro" style="margin-top:6px">State dispute program: <a href="${esc(s.arb.url)}" target="_blank" rel="noopener">${esc(s.arb.name)}</a></p>` : ""}
      <div class="cite">${esc(s.cite)}</div>
      <p class="micro reviewed-line">${s.reverified ? "Thresholds last reviewed Oct 7, 2026." : "Thresholds last researched Oct 7, 2026. Not re-verified this round."}</p></div>`;
  }).join("");
}

/* ---- car form ---- */
function prefillCar() {
  if (!db.car) return;
  $("#fYear").value = db.car.year || ""; $("#fMake").value = db.car.make || "";
  $("#fModel").value = db.car.model || ""; $("#fVin").value = db.car.vin || "";
  $("#fDelivery").value = db.car.deliveryDate || ""; $("#fMiles").value = db.car.miles || "";
}
$("#carForm").addEventListener("submit", e => {
  e.preventDefault();
  const err = $("#carErr");
  const year = $("#fYear").value.trim(), make = $("#fMake").value.trim(),
        model = $("#fModel").value.trim(), delivery = $("#fDelivery").value;
  if (!make || !model || !delivery) { err.textContent = "Make, model, and delivery date are required."; return; }
  if (delivery > todayLocalISO()) { err.textContent = "Delivery date can't be in the future."; return; }
  if (year && !/^\d{4}$/.test(year)) { err.textContent = "Year should be 4 digits."; return; }
  err.textContent = "";
  db.car = { year, make, model, vin: $("#fVin").value.trim().toUpperCase(), deliveryDate: delivery, miles: $("#fMiles").value.trim() };
  save(); goStep("case"); renderCase();
});
$$("[data-back]").forEach(b => b.addEventListener("click", () => goStep(b.dataset.back)));

/* ---- repair form ---- */
let editingId = null;
function openRepairForm(r) {
  editingId = r ? r.id : null;
  $("#repairForm").classList.remove("hidden");
  $("#addRepairBtn").classList.add("hidden");
  $("#repairErr").textContent = "";
  $("#saveRepairBtn").textContent = r ? "Save changes" : "Save repair";
  if (r) {
    $("#rProblem").value = r.problem || "";
    $("#rIn").value = r.dateIn || "";
    $("#rOut").value = r.dateOut || "";
    $("#rMile").value = r.mile || "";
    $("#rDealer").value = r.dealer || "";
    $("#rDesc").value = r.desc || "";
    $("#rSafety").checked = !!r.safety;
    $("#photoKeptNote").textContent = r.photo ? "Current repair-order photo is kept unless you choose a new one." : "";
  } else {
    $("#repairForm").reset();
    $("#photoKeptNote").textContent = "";
  }
  $("#rProblem").focus();
}
function closeRepairForm() {
  editingId = null;
  $("#repairForm").reset();
  $("#repairForm").classList.add("hidden");
  $("#addRepairBtn").classList.remove("hidden");
  $("#repairErr").textContent = "";
  $("#photoKeptNote").textContent = "";
  $("#saveRepairBtn").textContent = "Save repair";
}
$("#addRepairBtn").addEventListener("click", () => openRepairForm(null));
$("#cancelRepairBtn").addEventListener("click", closeRepairForm);

$("#repairForm").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("#repairErr");
  const problem = $("#rProblem").value.trim(), dateIn = $("#rIn").value, dateOut = $("#rOut").value;
  const mileRaw = $("#rMile").value.trim();
  if (!problem || !dateIn) { err.textContent = "Describe the problem and pick the drop-off date."; return; }
  if (dateOut && dateOut < dateIn) { err.textContent = "Pick-up date can't be before drop-off."; return; }
  const today = todayLocalISO();
  if (dateIn > today) { err.textContent = "Drop-off date can't be in the future."; return; }
  if (dateOut && dateOut > today) { err.textContent = "Pick-up date can't be in the future."; return; }
  if (mileRaw && !/^\d[\d,]*$/.test(mileRaw)) { err.textContent = "Mileage should be a number, like 12,400."; return; }
  err.textContent = "";
  let photo = null;
  const f = $("#rPhoto").files[0];
  if (f) { try { photo = await fileToDataURL(f); } catch (ex) { photo = null; } }
  if (editingId) {
    const r = db.repairs.find(x => x.id === editingId);
    if (r) {
      r.problem = problem; r.dateIn = dateIn; r.dateOut = dateOut || null;
      r.mile = mileRaw.replace(/,/g, "") || null;
      r.dealer = $("#rDealer").value.trim(); r.desc = $("#rDesc").value.trim();
      r.safety = $("#rSafety").checked;
      if (photo) r.photo = photo;
      r.editedAt = new Date().toISOString();
    }
  } else {
    db.repairs.push({ id: uid(), problem, dateIn, dateOut: dateOut || null, mile: mileRaw.replace(/,/g, "") || null, dealer: $("#rDealer").value.trim(), desc: $("#rDesc").value.trim(), safety: $("#rSafety").checked, photo });
  }
  db.repairs.sort((a, b) => a.dateIn < b.dateIn ? -1 : 1);
  save();
  closeRepairForm();
  renderCase();
});

$("#repairList").addEventListener("click", e => {
  const del = e.target.closest("[data-del]");
  if (del) {
    if (confirm("Delete this repair visit?")) {
      db.repairs = db.repairs.filter(r => r.id !== del.dataset.del);
      save(); renderCase();
    }
    return;
  }
  const edt = e.target.closest("[data-edit]");
  if (edt) {
    const r = db.repairs.find(x => x.id === edt.dataset.edit);
    if (r) openRepairForm(r);
  }
});
$("#changeStateBtn").addEventListener("click", () => goStep("state"));
$("#resetBtn").addEventListener("click", () => {
  if (confirm("Delete your car, repairs, and everything stored on this device?")) {
    db = { state: null, car: null, repairs: [], intake: null };
    normalizeDb();
    save();
    ["buyback.device_key", "buyback.syncmeta.v1", "buyback.lastsync.v1"].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    goStep("state"); renderStateGrid();
  }
});

/* ---- case rendering ---- */
function renderCase() {
  const c = computeCase();
  if (!c) { goStep(db.state ? "car" : "state"); return; }
  const car = db.car;
  $("#lawCite").innerHTML = `Your state's law: <strong>${esc(c.st.law)}</strong> (${esc(c.st.cite)}). Presumption window: ${c.st.windowMonths} months${c.st.windowMiles ? " / " + c.st.windowMiles.toLocaleString() + " miles" : ""} from delivery.`;

  // status banner
  const banner = $("#statusBanner");
  if (c.qualified) {
    const met = c.routes.filter(r => r.met);
    banner.className = "status-banner qualify";
    banner.innerHTML = `<h3>You likely qualify.</h3><p>Your case meets the <strong>${esc(met.map(r => r.label.toLowerCase()).join(" + "))}</strong> route under ${esc(c.st.name)} law. Next steps are on the right. An attorney should confirm before you act.</p>`;
  } else {
    const pct = Math.round(c.best * 100);
    banner.className = "status-banner building";
    const next = c.routes.slice().sort((a, b) => b.prog - a.prog)[0];
    banner.innerHTML = `<h3>Building your case: ${pct}% of the way there</h3><p>Closest route: <strong>${esc(next.label)}</strong> (${next.val}/${next.need} ${next.unit}). ${c.inWin.length === 0 ? "Log your first repair below to start the meter." : "Keep logging every visit. Each one moves the needle."}</p>`;
  }

  // meters
  $("#routeMeters").innerHTML = c.routes.map(r => {
    const pct = Math.min(100, Math.round(r.prog * 100));
    return `<div class="route${r.met ? " met" : ""}">
      <div class="route-top"><strong>${esc(r.label)}${r.met ? '<span class="met-tag">THRESHOLD MET</span>' : ""}</strong><span class="frac">${r.val}/${r.strict ? "&gt;" + r.need : r.need} ${r.unit}</span></div>
      <div class="meter" role="progressbar" aria-valuenow="${r.val}" aria-valuemax="${r.need}" aria-label="${esc(r.label)}"><div style="width:${pct}%"></div></div>
      <div class="rnote">${esc(r.detail)}. ${esc(r.note)}</div></div>`;
  }).join("");

  // state-specific procedural alerts
  const sa = $("#stateAlert");
  let alertHtml = "";
  const daysRoute = c.routes.find(r => r.id === "days");
  if (db.state === "FL" && c.totalDays >= 15 && daysRoute && !daysRoute.met) {
    alertHtml = `<div class="note" style="border:2px solid var(--red);background:var(--red-soft);color:var(--ink)"><strong>Florida notice required now.</strong> At 15 cumulative days out of service you must send written notice to the manufacturer (registered or express mail) giving them a final repair opportunity. Miss this and the 30-day presumption may not apply.</div>`;
  }
  if (db.state === "TX") {
    const rep = c.routes.find(r => r.id === "repeat");
    if (rep && rep.val >= 2 && !rep.met) {
      alertHtml += `<div class="note"><strong>Texas timing rule:</strong> at least 2 of the 4 attempts should fall in the first year/12,000 miles and 2 more in the second year. Also remember the 6-month filing deadline after warranty/24 months/24,000 miles.</div>`;
    }
  }
  sa.innerHTML = alertHtml;

  // window note
  let wn = "";
  if (c.outWin > 0) wn += `<strong>${c.outWin} repair(s)</strong> fall outside the ${c.st.windowMonths}-month presumption window and don't count toward it. `;
  if (c.st.windowMiles && car.miles && parseInt(car.miles.replace(/\D/g, ""), 10) > c.st.windowMiles)
    wn += `<strong>Mileage check:</strong> your current mileage may exceed the ${c.st.windowMiles.toLocaleString()}-mile window. A lawyer can still evaluate your case outside the presumption.`;
  if (c.st.extra) wn += (wn ? "<br>" : "") + esc(c.st.extra);
  if (c.biz) wn += (wn ? "<br>" : "") + `<strong>Business-day counting:</strong> Mon\u2013Fri only; federal holidays are <strong>not</strong> excluded, so this total can differ from your state's official count (${esc(c.st.cite)}).`;
  $("#windowNote").innerHTML = wn;
  $("#windowNote").style.display = wn ? "" : "none";

  // repair list
  $("#repairCount").textContent = db.repairs.length;
  const list = $("#repairList");
  if (!db.repairs.length) {
    list.innerHTML = `<div class="empty"><svg class="ic big"><use href="#i-wrench"/></svg><p><strong>No repairs logged yet.</strong><br>Every visit counts, even the ones where they "couldn't reproduce" the problem.</p></div>`;
  } else {
  const open = db.repairs.filter(r => !r.dateOut);
  let openHtml = "";
  if (open.length) {
    openHtml = `<div class="inshop"><h4><svg class="ic"><use href="#i-wrench"/></svg> In the shop now</h4>` +
      open.map(r => {
        const n = daysOut(r, c.biz, c.windowStart, c.windowEnd);
        return `<div class="inshop-row"><span><strong>${esc(r.problem)}</strong>${r.dealer ? " at " + esc(r.dealer) : ""} <span class="micro">since ${fmtDate(r.dateIn)}</span></span><span class="inshop-days">In the shop, ${n} ${(c.biz ? "business " : "")}day${n === 1 ? "" : "s"} and counting</span></div>`;
      }).join("") + `</div>`;
  }
  if (!db.repairs.length) {
    list.innerHTML = `<div class="empty"><svg class="ic big"><use href="#i-wrench"/></svg><p><strong>No repairs logged yet.</strong><br>Every visit counts, even the ones where they "couldn't reproduce" the problem.</p></div>`;
  } else {
    list.innerHTML = openHtml + db.repairs.map(r => `
      <div class="repair-item">
        ${r.photo ? `<img class="ri-photo" src="${r.photo}" alt="Repair order photo">` : ""}
        <div class="ri-body">
          <div class="ri-problem">${esc(r.problem)}${r.safety ? '<span class="safety-tag">SAFETY</span>' : ""}${r.editedAt ? '<span class="edited-tag">edited</span>' : ""}</div>
          <div class="ri-meta">${fmtDate(r.dateIn)}${r.dateOut ? " \u2192 " + fmtDate(r.dateOut) : " \u2192 in shop now"} \u00B7 ${daysOut(r, c.biz, c.windowStart, c.windowEnd)} ${(c.biz ? "business " : "")}day(s)${r.mile ? " \u00B7 " + fmtMile(r.mile) : ""}${r.dealer ? " \u00B7 " + esc(r.dealer) : ""}</div>
          ${r.desc ? `<div class="ri-meta">${esc(r.desc)}</div>` : ""}
        </div>
        <div class="ri-actions">
          <button class="linklike ri-edit" data-edit="${r.id}">Edit</button>
          <button class="ri-del" data-del="${r.id}" aria-label="Delete repair"><svg class="ic"><use href="#i-trash"/></svg></button>
        </div>
      </div>`).join("");
  }
  /* problem-name assistance: datalist of existing labels */
  const seen = {};
  const labels = db.repairs.map(r => String(r.problem || "").trim()).filter(x => x && !seen[x] && (seen[x] = 1));
  $("#problemHints").innerHTML = labels.map(x => `<option value="${esc(x)}">`).join("");
  }

  // timeline
  const tl = $("#timeline");
  tl.innerHTML = db.repairs.length ? db.repairs.map(r => `
    <div class="tl-item"><div class="tl-date">${fmtDate(r.dateIn)}</div>
    <div class="tl-what">${esc(r.problem)}</div>
    <div class="tl-days">${daysOut(r, c.biz, c.windowStart, c.windowEnd)} ${(c.biz ? "business " : "")}day(s) out of service${r.mile ? " \u00B7 " + fmtMile(r.mile) : ""}${r.dealer ? " \u00B7 " + esc(r.dealer) : ""}</div></div>`).join("")
    : `<p class="micro">Your timeline will appear here as you log repairs.</p>`;

  // next steps
  const ns = $("#nextStepsBody"), card = $("#nextStepsCard");
  if (c.qualified) {
    card.classList.remove("locked"); card.classList.add("qualify-now");
    ns.innerHTML = `
      <div class="ns-item"><svg class="ic"><use href="#i-check"/></svg><span><strong>Talk to a lemon law attorney.</strong> Most work on contingency and offer free reviews.</span></div>
      <button class="btn btn-block" id="nsIntakeBtn">Get matched with an attorney</button>
      <div class="ns-item"><svg class="ic"><use href="#i-doc"/></svg><span><strong>Draft your demand letter.</strong> A starting point for the manufacturer, attorney-reviewed before sending.</span></div>
      <button class="btn btn-ghost btn-block" id="nsLetterBtn">Draft demand letter</button>
      <div class="ns-item"><svg class="ic"><use href="#i-print"/></svg><span><strong>Print your case summary</strong> and bring every repair order to the consultation.</span></div>`;
    $("#nsIntakeBtn").addEventListener("click", openIntake);
    $("#nsLetterBtn").addEventListener("click", openLetter);
    ns.insertAdjacentHTML("beforeend", `<button class="linklike" id="nsMomentBtn" style="margin-top:8px">View your qualification moment</button>`);
    $("#nsMomentBtn").addEventListener("click", () => { if (db.moments.length) openMoment(db.moments[db.moments.length - 1]); });
  } else {
    card.classList.add("locked"); card.classList.remove("qualify-now");
    ns.innerHTML = `
      <div class="ns-item"><svg class="ic"><use href="#i-wrench"/></svg><span>Keep every repair order. The date-in and date-out on each invoice is your evidence.</span></div>
      <div class="ns-item"><svg class="ic"><use href="#i-alert"/></svg><span>Use identical wording for the same problem each visit so attempts group correctly.</span></div>
      <div class="ns-item"><svg class="ic"><use href="#i-cal"/></svg><span>Watch the clock: your presumption window runs ${c.st.windowMonths} months from delivery.</span></div>
      <button class="btn btn-ghost btn-block" id="nsIntakeBtn2">Ask an attorney anyway</button>`;
    $("#nsIntakeBtn2").addEventListener("click", openIntake);
  }
  checkCrossings(c);
}

/* ---- threshold-crossing magic moment ---- */
function fmtMoment(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}
function routeNeedText(r) { return (r.strict ? "more than " : "") + r.need + " " + r.unit; }
/* After every case render, check for newly crossed routes, freeze a timestamped
   snapshot, and celebrate once per route. */
function checkCrossings(c) {
  const fresh = [];
  c.routes.forEach(r => {
    if (r.met && !db.celebrated[r.id]) {
      db.celebrated[r.id] = new Date().toISOString();
      fresh.push(r);
    }
  });
  if (!fresh.length) return;
  const at = new Date().toISOString();
  const moment = {
    routes: fresh.map(r => ({ id: r.id, label: r.label, val: r.val, need: r.need, unit: r.unit, strict: !!r.strict })),
    at, state: db.state, law: c.st.law, cite: c.st.cite, stateName: c.st.name,
    car: JSON.parse(JSON.stringify(db.car)),
    repairs: JSON.parse(JSON.stringify(db.repairs)),
    totalDays: c.totalDays, biz: c.biz
  };
  db.moments.push(moment);
  if (db.moments.length > 20) db.moments = db.moments.slice(-20);
  save();
  openMoment(moment);
}
function momentShareText(m) {
  const car = m.car ? `${m.car.year || ""} ${m.car.make || ""} ${m.car.model || ""}`.trim() : "my car";
  return `My ${car} crossed a lemon law threshold (${m.routes.map(r => r.label + ": " + r.val + " of " + routeNeedText(r)).join("; ")}) under ${m.law}. Case snapshot frozen ${fmtMoment(m.at)}.`;
}
function openMoment(m) {
  const car = m.car ? `${esc(m.car.year || "")} ${esc(m.car.make || "")} ${esc(m.car.model || "")}`.trim() : "your car";
  $("#momentBody").innerHTML = `
    <div class="moment-badge"><svg class="ic"><use href="#i-shield"/></svg></div>
    <h3>You crossed a lemon law threshold</h3>
    <p class="hint">${car} meets the presumption trigger under <strong>${esc(m.law)}</strong> (${esc(m.cite)}).</p>
    <div class="moment-routes">
      ${m.routes.map(r => `<div class="moment-route"><span class="met-tag">THRESHOLD MET</span><strong>${esc(r.label)}</strong><span class="frac">${r.val} of ${esc(routeNeedText(r))}</span></div>`).join("")}
    </div>
    <p class="micro">Crossed ${esc(fmtMoment(m.at))}. This snapshot of your case is frozen at that moment.</p>
    <p class="micro">This is a presumption trigger, not a legal conclusion. An attorney should confirm before you act.</p>
    <div class="btn-row moment-actions">
      <button type="button" class="btn" id="momentIntakeBtn">Request free attorney case review</button>
      <button type="button" class="btn btn-ghost" id="momentPrintBtn"><svg class="ic"><use href="#i-print"/></svg> Print case summary</button>
      <button type="button" class="btn btn-ghost" id="momentShareBtn"><svg class="ic"><use href="#i-arrow"/></svg> Save or share this moment</button>
    </div>`;
  window.__moment = m;
  $("#momentIntakeBtn").addEventListener("click", () => { closeModals(); openIntake(m); });
  $("#momentPrintBtn").addEventListener("click", () => doPrint(printableSummary()));
  $("#momentShareBtn").addEventListener("click", () => shareMoment(m));
  openModal("#momentModal");
}
function wrapText(g, text, x, y, maxW, lh) {
  const words = String(text).split(" ");
  let line = "", yy = y;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; }
    else line = t;
  }
  g.fillText(line, x, yy);
  return yy + lh;
}
/* Screenshot-worthy qualification card, drawn on canvas, no libraries. */
function momentPNG(m) {
  const W = 1080, H = 1400, pad = 90;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = "#1C1A15"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#FFC531"; g.fillRect(0, 0, W, 26);
  g.fillStyle = "#FFC531";
  g.font = "800 44px system-ui, sans-serif";
  g.fillText("BUYBACK", pad, 130);
  g.fillStyle = "#FFFFFF";
  g.font = "800 64px system-ui, sans-serif";
  let y = wrapText(g, "You crossed a lemon law threshold.", pad, 230, W - pad * 2, 78);
  const car = m.car ? `${m.car.year || ""} ${m.car.make || ""} ${m.car.model || ""}`.trim() : "your car";
  g.fillStyle = "#B9B2A4"; g.font = "400 38px system-ui, sans-serif";
  y = wrapText(g, `${car} meets the presumption trigger under ${m.law} (${m.cite}).`, pad, y + 30, W - pad * 2, 52) + 20;
  m.routes.forEach(r => {
    g.fillStyle = "#2A2620";
    const rh = 170;
    if (y + rh > H - 220) return;
    g.fillRect(pad, y, W - pad * 2, rh);
    g.fillStyle = "#7BD88F"; g.font = "800 30px system-ui, sans-serif";
    g.fillText("THRESHOLD MET", pad + 36, y + 58);
    g.fillStyle = "#FFFFFF"; g.font = "700 42px system-ui, sans-serif";
    g.fillText(r.label, pad + 36, y + 112);
    g.fillStyle = "#FFC531"; g.font = "800 40px system-ui, sans-serif";
    g.fillText(`${r.val} of ${routeNeedText(r)}`, pad + 36, y + 156);
    y += rh + 24;
  });
  g.fillStyle = "#B9B2A4"; g.font = "400 34px system-ui, sans-serif";
  y = wrapText(g, `Crossed ${fmtMoment(m.at)}. Snapshot frozen at that moment.`, pad, Math.min(y + 20, H - 200), W - pad * 2, 48);
  g.fillStyle = "#6E675C"; g.font = "400 28px system-ui, sans-serif";
  wrapText(g, "A presumption trigger, not a legal conclusion. An attorney should confirm before you act. buyback", pad, H - 120, W - pad * 2, 40);
  return new Promise(res => cv.toBlob(res, "image/png"));
}
async function shareMoment(m) {
  const btn = $("#momentShareBtn");
  const orig = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.innerHTML = "Preparing image..."; }
  try {
    const blob = await momentPNG(m);
    if (!blob) throw new Error("render failed");
    const file = new File([blob], "buyback-qualification.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "My lemon law qualification", text: momentShareText(m) }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "buyback-qualification.png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch (e) {
    try { await navigator.clipboard.writeText(momentShareText(m)); if (btn) btn.innerHTML = "Copied to clipboard"; }
    catch (ce) { if (btn) btn.innerHTML = "Could not share"; }
  } finally {
    if (btn) setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 1800);
  }
}

/* ---- modals ---- */
function openModal(id) { $(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function closeModals() { $$(".modal").forEach(m => m.classList.add("hidden")); document.body.style.overflow = ""; }
$$("[data-close-modal]").forEach(b => b.addEventListener("click", closeModals));
$$(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) closeModals(); }));
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModals(); });

function caseSummaryText() {
  const c = computeCase(); if (!c) return "";
  const car = db.car;
  const lines = c.inWin.map(r => `${fmtDate(r.dateIn)}${r.dateOut ? " to " + fmtDate(r.dateOut) : " (in shop)"}: ${r.problem} (${daysOut(r, c.biz, c.windowStart, c.windowEnd)}${c.biz ? " business days" : " days"}${r.mile ? ", " + fmtMile(r.mile) : ""})${r.dealer ? " @ " + r.dealer : ""}${r.safety ? " [SAFETY]" : ""}${r.editedAt ? " [edited]" : ""}`);
  return { c, car, lines };
}
function latestMoment() {
  for (let i = db.moments.length - 1; i >= 0; i--) {
    if (db.moments[i].state === db.state) return db.moments[i];
  }
  return null;
}
function openIntake(moment) {
  $("#intakeForm").classList.remove("hidden"); $("#intakeDone").classList.add("hidden");
  const m = (moment && moment.routes) ? moment : latestMoment();
  window.__intakeMoment = m || null;
  const note = $("#momentNote");
  if (m && !$("#iSummary").value) {
    const car = `${m.car.year || ""} ${m.car.make || ""} ${m.car.model || ""}`.trim();
    $("#iSummary").value = `${car} (${m.stateName}): case snapshot frozen ${fmtMoment(m.at)}. ` +
      m.routes.map(r => `${r.label}: ${r.val}/${r.need}${r.met ? " MET" : ""}`).join("; ") + ". " +
      `${m.repairs.length} repair(s) logged, ${m.totalDays} ${m.biz ? "business " : ""}days out of service.`;
  } else if (!m) {
    const { c, car } = caseSummaryText();
    if (c && !$("#iSummary").value) {
      $("#iSummary").value = `${car.year} ${car.make} ${car.model} (${c.st.name}): ${c.inWin.length} repair(s), ${c.totalDays} ${c.biz ? "business " : ""}days out of service. ` +
        c.routes.map(r => `${r.label}: ${r.val}/${r.need}${r.met ? " MET" : ""}`).join("; ") + ".";
    }
  }
  if (note) {
    if (m) { note.textContent = `This request carries a frozen snapshot of your case from the moment you crossed the threshold (${fmtMoment(m.at)}). Later edits are not included.`; note.classList.remove("hidden"); }
    else note.classList.add("hidden");
  }
  if (db.intake) { $("#iName").value = db.intake.name || ""; $("#iPhone").value = db.intake.phone || ""; $("#iEmail").value = db.intake.email || ""; }
  openModal("#intakeModal");
}
/* Immutable intake snapshot: frozen at submit, never regenerated from live state. */
function buildIntakeSnapshot(name, phone, email) {
  const c = computeCase();
  const repairs = db.repairs.map(r => {
    const copy = Object.assign({}, r);
    copy.photoAttached = !!r.photo;
    delete copy.photo;
    return copy;
  });
  return {
    name, phone, email,
    submittedAt: new Date().toISOString(),
    thresholdDataVersion: THRESHOLD_DATA_VERSION,
    consentVersion: CONSENT_VERSION,
    consentText: CONSENT_TEXT,
    recipient: "a participating lemon law attorney",
    state: db.state,
    car: JSON.parse(JSON.stringify(db.car || null)),
    repairs,
    photoCount: db.repairs.filter(r => r.photo).length,
    routes: c ? c.routes.map(r => ({ id: r.id, label: r.label, val: r.val, need: r.need, unit: r.unit, strict: !!r.strict, met: r.met })) : [],
    windowStart: c ? c.windowStart : null,
    windowEnd: c ? c.windowEnd : null,
    momentRef: window.__intakeMoment ? window.__intakeMoment.at : null,
    summary: $("#iSummary").value.trim()
  };
}
function renderIntakeReceipt(snap) {
  const car = snap.car ? `${esc(snap.car.year || "")} ${esc(snap.car.make || "")} ${esc(snap.car.model || "")}`.trim() : "n/a";
  const st = STATES[snap.state];
  $("#intakeReceipt").innerHTML = `
    <ul>
      <li><strong>Contact:</strong> ${esc(snap.name)}, ${esc(snap.phone)}, ${esc(snap.email)}</li>
      <li><strong>Recipient:</strong> ${esc(snap.recipient)}</li>
      <li><strong>State:</strong> ${st ? esc(st.name) : esc(snap.state || "n/a")}</li>
      <li><strong>Car:</strong> ${car}</li>
      <li><strong>Repairs:</strong> ${snap.repairs.length} logged visit(s)${snap.windowStart ? `, presumption window ${fmtDate(snap.windowStart)} to ${fmtDate(snap.windowEnd)}` : ""}</li>
      ${snap.routes.map(r => `<li><strong>${esc(r.label)}:</strong> ${r.val} of ${esc(routeNeedText(r))} ${r.met ? '<span class="met-tag">MET</span>' : "(not yet)"}</li>`).join("")}
      <li><strong>Photos:</strong> ${snap.photoCount} repair-order photo(s), kept on this device until a firm is selected</li>
      <li><strong>Submitted:</strong> ${esc(fmtMoment(snap.submittedAt))}</li>
      <li><strong>Threshold data:</strong> ${esc(snap.thresholdDataVersion)} &middot; <strong>Consent:</strong> ${esc(snap.consentVersion)}</li>
      ${snap.momentRef ? `<li><strong>Attached moment:</strong> threshold crossed ${esc(fmtMoment(snap.momentRef))}</li>` : ""}
    </ul>`;
}
$("#intakeForm").addEventListener("submit", e => {
  e.preventDefault();
  const err = $("#intakeErr");
  const name = $("#iName").value.trim(), phone = $("#iPhone").value.trim(), email = $("#iEmail").value.trim();
  if (!name || !phone || !email) { err.textContent = "Name, phone, and email are required."; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "That email doesn't look right."; return; }
  if (!$("#iConsent").checked) { err.textContent = "Please check the consent box so a participating attorney may contact you."; return; }
  err.textContent = "";
  const snap = buildIntakeSnapshot(name, phone, email);
  db.intake = { name, phone, email, summary: snap.summary, at: snap.submittedAt, snapshot: snap };
  save();
  renderIntakeReceipt(snap);
  $("#intakeForm").classList.add("hidden"); $("#intakeDone").classList.remove("hidden");
});

function demandLetterText() {
  const { c, car, lines } = caseSummaryText();
  const met = c.routes.filter(r => r.met).map(r => (r.id === "days" && c.biz ? "business days out of service" : r.label.toLowerCase())).join("; ");
  return `DEMAND FOR REPURCHASE / REPLACEMENT UNDER STATE LEMON LAW
(Draft only. Have an attorney review before sending)

Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

To: [Manufacturer Name], via [Manufacturer's designated lemon law / customer care address]

From: [Your Full Name]
      [Your Address]
      [Phone] \u00B7 [Email]

Re: Demand for repurchase or replacement: ${car.year} ${car.make} ${car.model}${car.vin ? ", VIN " + car.vin : ""}
    Delivery date: ${fmtDate(car.deliveryDate)} \u00B7 Current mileage: ${car.miles || "[ ]"}

Dear Sir or Madam:

I am writing to demand that you repurchase or replace my vehicle under ${c.st.law} (${c.st.cite}).

Since delivery, the vehicle has exhibited the following recurring defect(s), each reported to your authorized dealers during the warranty period:

${lines.map((l, i) => `  ${i + 1}. ${l}`).join("\n")}

This history meets the statutory presumption of a reasonable number of repair attempts in ${c.st.name}: ${met || "[thresholds not yet met: see attached log]"}.

I request that you promptly repurchase the vehicle (full purchase price, taxes, fees, and incidental costs, less any lawful offset) or replace it with a comparable new vehicle, at my option, as provided by law.

Please respond within 14 days of receipt. If I do not receive a satisfactory response, I intend to pursue all remedies available under ${c.st.cite}, which may include civil penalties and attorney's fees.

Sincerely,

[Your Signature]
[Your Printed Name]

Enclosures: repair orders, purchase/lease agreement
---
This draft was generated by Buyback, a consumer-education prototype. It is not legal advice.`;
}
function openLetter() { $("#letterBody").textContent = demandLetterText(); openModal("#letterModal"); }
$("#demandLetterBtn").addEventListener("click", openLetter);

/* ---- print ---- */
function printableSummary() {
  const { c, car, lines } = caseSummaryText();
  const rows = lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l)}</td></tr>`).join("");
  const meters = c.routes.map(r => `<tr><td>${esc(r.label)}</td><td>${r.val} / ${r.need} ${r.unit}</td><td>${r.met ? "THRESHOLD MET" : "not yet"}</td></tr>`).join("");
  return `<h1>Buyback Case Summary</h1>
  <p><strong>${esc(car.year)} ${esc(car.make)} ${esc(car.model)}</strong>${car.vin ? " \u00B7 VIN " + esc(car.vin) : ""}<br>
  Delivery: ${fmtDate(car.deliveryDate)} \u00B7 State: ${esc(c.st.name)} (${esc(c.st.law)}, ${esc(c.st.cite)})<br>
  Generated ${new Date().toLocaleDateString()} by Buyback (prototype, not legal advice).</p>
  <h2>Qualification routes</h2><table><tr><th>Route</th><th>Progress</th><th>Status</th></tr>${meters}</table>
  <h2>Repair history (${c.inWin.length} in-window)</h2><table><tr><th>#</th><th>Visit</th></tr>${rows}</table>
  <p>Bring this summary plus every original repair order to a lemon law attorney. Most offer free reviews and work on contingency.</p>`;
}
function doPrint(html) { $("#printArea").innerHTML = html; window.print(); }
$("#printSummaryBtn").addEventListener("click", () => doPrint(printableSummary()));
$("#printLetterBtn").addEventListener("click", () => doPrint(`<div style="white-space:pre-wrap">${esc(demandLetterText())}</div>`));

/* ---- JSON export / import: real data portability ---- */
$("#exportJsonBtn").addEventListener("click", () => {
  const payload = { format: "buyback.case/v1", exportedAt: new Date().toISOString(), state: db.state, car: db.car, repairs: db.repairs, intake: db.intake, celebrated: db.celebrated, moments: db.moments };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const d = new Date(), p2 = n => String(n).padStart(2, "0");
  a.download = `buyback-case-${db.state || "nostate"}-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
$("#importJsonBtn").addEventListener("click", () => { $("#importErr").textContent = ""; $("#importJsonFile").click(); });
$("#importJsonFile").addEventListener("change", e => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  const err = $("#importErr");
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== "object" || !Array.isArray(data.repairs)) throw new Error("Not a Buyback case file: the repair list is missing.");
      if (data.state != null && !STATES[data.state]) throw new Error("Not a Buyback case file: unknown state code.");
      data.repairs.forEach((r, i) => {
        if (!r || typeof r.problem !== "string" || typeof r.dateIn !== "string") throw new Error("Repair #" + (i + 1) + " is missing its problem or drop-off date.");
      });
      if (!confirm("Importing replaces your current case on this device. Continue?")) return;
      db = { state: data.state || null, car: data.car || null, repairs: data.repairs, intake: data.intake || null };
      normalizeDb();
      if (data.celebrated && typeof data.celebrated === "object") db.celebrated = data.celebrated;
      if (Array.isArray(data.moments)) db.moments = data.moments;
      save();
      window.__buyback.refresh();
      err.textContent = "";
    } catch (ex) {
      err.textContent = ex.message || "Could not read that file.";
    }
  };
  reader.onerror = () => { err.textContent = "Could not read that file."; };
  reader.readAsText(f);
});

/* ---- init ---- */
renderStateGrid();
renderStateCards();
if (db.state && db.car) { goStep("case"); renderCase(); }
else if (db.state) { goStep("car"); prefillCar(); }

/* ---- sync bridge (consumed by sync.js; local-first, sync never blocks UI) ---- */
window.__buyback = {
  getS: () => db,
  saveLocal: () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} },
  refresh: () => {
    if (db.state && db.car) { goStep("case"); renderCase(); }
    else if (db.state) { goStep("car"); prefillCar(); }
    else { goStep("state"); renderStateGrid(); }
  }
};
