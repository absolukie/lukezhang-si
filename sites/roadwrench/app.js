/* RoadWrench: mobile RV repair tech OS. Vanilla JS, localStorage. */
"use strict";

/* ---------- inline SVG icons (no emoji in chrome) ---------- */
const I = {
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14.5 12l-2.6-2.6z"/></svg>',
  jobs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
  printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7L2.3 9.6l6.7-1z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  rv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10"/><path d="M18 9h2a2 2 0 0 1 2 2v6"/><path d="M3 17h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/><path d="M7 7v5h7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M12 13v6M9 16h6"/></svg>'
};
/* self-sizing icons: 1em of surrounding text; explicit CSS sizes still override */
Object.keys(I).forEach(k => { I[k] = I[k].replace('<svg ', '<svg width="1em" height="1em" '); });

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* Photo URL allowlist. dataUrl arrives through sync from other devices, so a
 * hostile peer could inject markup; only real image data URLs may render. */
const IMG_URL_OK = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];
const safeDataUrl = u => {
  const s = String(u == null ? "" : u);
  for (const p of IMG_URL_OK) if (s.indexOf(p) === 0) return s;
  return "";
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const money = n => "$" + (Number(n) || 0).toFixed(2);
const fmtDate = iso => { if (!iso) return "Not provided"; const d = new Date(iso + (iso.length <= 10 ? "T12:00:00" : "")); return isNaN(d) ? "Not provided" : d.toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}); };
const fmtDT = ts => new Date(ts).toLocaleString("en-US", {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
const todayISO = () => new Date().toISOString().slice(0, 10);

let toastTimer = null;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- store ---------- */
const KEY = "roadwrench.v1";
/* localStorage ceiling is ~5MB. Track size on every save and never fail silently. */
const STORAGE_WARN_BYTES = 3.5 * 1024 * 1024;
let lastSaveBytes = 0;
let storageFullToasted = false;
/* P0 latch: once a save throws (quota), the banner must stay visible across
 * navigation until a later save actually succeeds. route() calls
 * updateStorageBanner() with no mode, so without this latch the banner would
 * vanish while the app kept running on unsaved in-memory state. */
let storageFullLatched = false;
function storeBytes() {
  try { return (localStorage.getItem(KEY) || "").length; } catch (e) { return lastSaveBytes; }
}
function updateStorageBanner(mode) {
  const el = document.getElementById("storageBanner");
  if (!el) return;
  const bytes = storeBytes();
  const full = storageFullLatched || mode === "full" || bytes >= STORAGE_WARN_BYTES;
  if (!full) { el.hidden = true; el.innerHTML = ""; return; }
  const mb = (bytes / 1048576).toFixed(1);
  el.hidden = false;
  el.innerHTML = `<span>${mode === "full"
    ? "Device storage is full. New changes are not being saved."
    : "Device storage is nearly full (" + mb + " MB of about 5 MB)."}
    Export a backup from Setup or delete old photos so no work is lost.</span>
    <button class="btn small" id="storageGo">Open Setup</button>`;
  el.querySelector("#storageGo").onclick = () => location.hash = "#/settings";
}
const CLAIM_STATUSES = ["draft", "filed", "approved", "paid", "denied"];
const CLAIM_LABEL = { draft: "Draft", filed: "Filed", approved: "Approved", paid: "Paid", denied: "Denied" };
/* Per-part order status. Diagnosis and install are two trips: the checklist
 * tracks what still needs ordering so the return trip is not wasted. */
const PART_STS = ["have", "need", "ordered"];
const PART_ST_LABEL = { have: "Have", need: "To order", ordered: "Ordered" };
/* Share helper: navigator.share when available, clipboard fallback, honest
 * labeling at every call site (the app never sends anything on its own). */
function shareOrCopy(title, text, copiedMsg) {
  if (navigator.share) {
    navigator.share({ title, text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast(copiedMsg || "Copied"), () => toast("Copy failed"));
  } else { toast("Sharing not supported here"); }
}
const normVin = v => (v || "").trim().toUpperCase();
/* All jobs on the same VIN, except the one the tech is looking at. */
function rigJobs(vin, exceptId) {
  const v = normVin(vin);
  if (!v) return [];
  return S.jobs.filter(j => normVin(j.vin) === v && j.id !== exceptId);
}
function blankState() {
  return {
    company: { name: "Pine Ridge Mobile RV Repair", phone: "(555) 014-2288", email: "", address: "", laborRate: 125, reviewLink: "" },
    jobs: [], reminders: [], settings: { requirePhotos: false }, invoiceSeq: 1
  };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.jobs)) {
      s.jobs.forEach(j => {
        j.claim = j.claim || {};
        if (!CLAIM_STATUSES.includes(j.claim.status)) {
          j.claim.status = j.filedAt ? "filed" : "draft";
          j.claim.statusDate = j.claim.statusDate || j.filedAt || 0;
        }
        (j.parts || []).forEach(p => {
          if (!PART_STS.includes(p.st)) p.st = "have";
        });
      });
      if (!s.settings) s.settings = { requirePhotos: false };
      if (s.invoiceSeq == null) s.invoiceSeq = 1;
      s.company = s.company || {};
      if (typeof s.company.reviewLink !== "string") s.company.reviewLink = "";
      return s;
    }
  } catch (e) {}
  const s = blankState(); seed(s); save(s); return s;
}
/* Local-only usage events: trial/packet/claim milestones for activation and
 * conversion measurement (PRD R-45). Stored on this device only, capped at
 * 500 entries, included in the JSON backup, never transmitted anywhere. */
const EVENTS_KEY = "roadwrench.events.v1";
function logEvent(name, data) {
  try {
    let ev = [];
    try { ev = JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; } catch (e) {}
    ev.push(Object.assign({ name, ts: Date.now() }, data || {}));
    if (ev.length > 500) ev = ev.slice(-500);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(ev));
  } catch (e) {}
}
function readEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; } catch (e) { return []; }
}
function save(s) {
  let raw;  try { raw = JSON.stringify(s); } catch (e) { toast("Could not save: data error"); return; }
  lastSaveBytes = raw.length;
  window.__roadwrench.stateBytes = lastSaveBytes;
  try {
    localStorage.setItem(KEY, raw);
    storageFullToasted = false;
    storageFullLatched = false; /* a real write cleared the pressure */
  } catch (e) {
    storageFullLatched = true;
    updateStorageBanner("full");
    if (!storageFullToasted) { storageFullToasted = true; toast("Storage is full. Export a backup now so no work is lost."); }
    return;
  }
  updateStorageBanner();
  try { if (window.__roadwrenchSync) window.__roadwrenchSync.onSave(); } catch (e) {}
}

/* Sync bridge (sync.js). Local-first: app works fully offline; sync is debounced and never blocks UI.
 * S is reassigned on wipe, so getS/saveLocal read the live binding. */
window.__roadwrench = {
  getS: () => S,
  saveLocal: () => { localStorage.setItem(KEY, JSON.stringify(S)); },
  refresh: () => route()
};
let S = load();

function seed(s) {
  const t = Date.now(), D = 864e5;
  s.jobs = [
    { id: uid(), sample: true, status: "scheduled", customer: "Dana Whitfield", phone: "(555) 902-1174",
      site: "Juniper Campground, Site 22", scheduledAt: todayISO(),
      rvMake: "Grand Design", rvModel: "Reflection 150 260RD", rvYear: "2022", vin: "573FR2628N9X04117",
      complaint: "Dometic AC blows warm after 20 minutes of runtime.", cause: "Low refrigerant; condenser coil caked with road grime.",
      correction: "Cleaned condenser coil, recharged to spec, verified 38F vent temp.",
      parts: [{id: uid(), name: "R-410A refrigerant", partNumber: "R410A-25LB", qty: 1, unitCost: 68, serial: ""}],
      labor: [{id: uid(), desc: "AC diagnosis + recharge", hours: 1.5, rate: 125}], timerStart: 0,
      photos: [], notes: "Customer full-timing; prefers morning appointments.",
      claim: {insurer: "Wholesale Warranties", claimNumber: "", authNumber: "", authBy: "", authDate: "", status: "draft", statusDate: 0},
      customerSig: "", techSig: "", filedAt: 0, completedAt: 0, createdAt: t - 3 * D },
    { id: uid(), sample: true, status: "onsite", customer: "Marcus Tran", phone: "(555) 338-9041",
      site: "Boondocking, BLM mile 12 off Hwy 89", scheduledAt: todayISO(),
      rvMake: "Airstream", rvModel: "Flying Cloud 25RB", rvYear: "2021", vin: "1STVBYU28MJ500923",
      complaint: "Slide-out stalls halfway on extension, grinding noise.", cause: "Worn slide gearbox; rail bolts loose.",
      correction: "",
      parts: [{id: uid(), name: "Slide-out gearbox assembly", partNumber: "LCI-191073", qty: 1, unitCost: 214, serial: "GBX-88412"}],
      labor: [], timerStart: 0, photos: [], notes: "",
      claim: {insurer: "Good Sam ESP", claimNumber: "", authNumber: "", authBy: "", authDate: "", status: "draft", statusDate: 0},
      customerSig: "", techSig: "", filedAt: 0, completedAt: 0, createdAt: t - D },
    { id: uid(), sample: true, status: "complete", customer: "Priya Natarajan", phone: "(555) 771-3302",
      site: "Home driveway, 4410 Cedar Bend Ln", scheduledAt: new Date(t - 2 * D).toISOString().slice(0, 10),
      rvMake: "Winnebago", rvModel: "Minnie Winnie 22R", rvYear: "2019", vin: "1FDXE4FN9KDC11882",
      complaint: "Water pump cycles every 30 seconds, no fixtures open.", cause: "Failed check valve in pump head; small leak at city water inlet.",
      correction: "Replaced pump head assembly, resealed city inlet, pressure-tested system.",
      parts: [
        {id: uid(), name: "Shurflo pump head kit", partNumber: "SH-94-800-00", qty: 1, unitCost: 89, serial: ""},
        {id: uid(), name: "City water inlet, white", partNumber: "JR-CWI-W", qty: 1, unitCost: 24, serial: ""}
      ],
      labor: [{id: uid(), desc: "Pump replacement + leak repair", hours: 2, rate: 125}], timerStart: 0,
      photos: [], notes: "",
      claim: {insurer: "Wholesale Warranties", claimNumber: "WW-88231", authNumber: "AUTH-55190", authBy: "R. Delgado", authDate: new Date(t - 2 * D).toISOString().slice(0, 10), status: "filed", statusDate: t - 2 * D},
      customerSig: "", techSig: "", filedAt: t - 2 * D, completedAt: t - 2 * D, createdAt: t - 4 * D }
  ];
  s.reminders = [
    { id: uid(), sample: true, customer: "Dana Whitfield", rvLabel: "2022 Reflection 260RD", service: "Roof reseal inspection", lastDone: new Date(t - 300 * D).toISOString().slice(0, 10), intervalMonths: 12 },
    { id: uid(), sample: true, customer: "Priya Natarajan", rvLabel: "2019 Minnie Winnie", service: "Bearing repack", lastDone: new Date(t - 700 * D).toISOString().slice(0, 10), intervalMonths: 24 }
  ];
}

/* ---------- derived ---------- */
const STATUSES = ["scheduled", "enroute", "onsite", "complete"];
const STATUS_LABEL = { scheduled: "Scheduled", enroute: "En route", onsite: "On site", complete: "Complete" };
function jobById(id) { return S.jobs.find(j => j.id === id); }
function partsTotal(j) { return j.parts.reduce((a, p) => a + p.qty * p.unitCost, 0); }
function laborTotal(j) { return j.labor.reduce((a, l) => a + l.hours * l.rate, 0); }
function jobTotal(j) { return partsTotal(j) + laborTotal(j); }
function laborHours(j) { return j.labor.reduce((a, l) => a + l.hours, 0); }
function packetChecks(j) {
  const photos = j.photos || [], claim = j.claim || {};
  return [
    { key: "before", label: "Before photo", ok: photos.some(p => p.tag === "before") },
    { key: "after", label: "After photo", ok: photos.some(p => p.tag === "after") },
    { key: "cause", label: "Cause documented", ok: !!(j.cause || "").trim() },
    { key: "correction", label: "Correction documented", ok: !!(j.correction || "").trim() },
    { key: "csig", label: "Customer signature", ok: !!j.customerSig },
    { key: "tsig", label: "Technician signature", ok: !!j.techSig },
    { key: "claim", label: "Claim number or insurer", ok: !!((claim.claimNumber || "").trim() || (claim.insurer || "").trim()) }
  ];
}
function nextDue(r) { const d = new Date(r.lastDone + "T12:00:00"); d.setMonth(d.getMonth() + r.intervalMonths); return d; }

/* ---------- tabs ---------- */
const TABS = [
  { hash: "#/jobs", label: "Jobs", icon: "jobs" },
  { hash: "#/reminders", label: "Reminders", icon: "bell" },
  { hash: "#/dashboard", label: "Money", icon: "chart" },
  { hash: "#/settings", label: "Setup", icon: "gear" }
];
function renderTabs(active) {
  $("#brandIcon").innerHTML = I.wrench;
  $("#tabs").innerHTML = TABS.map(t =>
    `<button class="tab${t.hash === active ? " active" : ""}" data-go="${t.hash}">${I[t.icon]}${t.label}</button>`).join("");
  document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => location.hash = b.dataset.go);
}

/* ---------- router ---------- */
function route() {
  const h = location.hash || "#/jobs";
  const parts = h.replace(/^#\//, "").split("/");
  renderTabs("#/" + parts[0]);
  updateStorageBanner();
  updateOnline();
  window.scrollTo(0, 0);
  if (parts[0] === "jobs") viewJobs();
  else if (parts[0] === "job" && parts[1] === "new") viewJobForm();
  else if (parts[0] === "job" && parts[1]) viewJobDetail(parts[1]);
  else if (parts[0] === "packet" && parts[1]) viewPacket(parts[1]);
  else if (parts[0] === "invoice" && parts[1]) viewInvoice(parts[1]);
  else if (parts[0] === "customer" && parts[1]) viewCustomer(decodeURIComponent(parts[1]));
  else if (parts[0] === "rig" && parts[1]) viewRig(decodeURIComponent(parts[1]));
  else if (parts[0] === "reminders") viewReminders();
  else if (parts[0] === "dashboard") viewDashboard();
  else if (parts[0] === "settings") viewSettings();
  else viewJobs();
}
window.addEventListener("hashchange", route);
/* Offline indicator: subtle banner, never a blocking modal. Local data keeps working. */
function updateOnline() {
  const b = $("#offlineBanner");
  if (b) b.hidden = navigator.onLine !== false;
}
window.addEventListener("online", updateOnline);
window.addEventListener("offline", updateOnline);

/* Print gate: the .packet DOM is hidden in print CSS by default, so Ctrl+P or
 * the browser menu can never print an unapproved document. Only authorized
 * print paths (printBtn when the completeness gate passes, printAnyway, and
 * the invoice print button) add body.print-ok before window.print(). */
function authorizedPrint() {
  document.body.classList.add("print-ok");
  window.print();
}
window.addEventListener("afterprint", () => document.body.classList.remove("print-ok"));

/* ================= JOBS BOARD ================= */
let jobFilter = "today", claimFilter = "all"; /* next-job-first home: today is the default */
function viewJobs() {
  const counts = { all: S.jobs.length, today: S.jobs.filter(j => j.scheduledAt === todayISO()).length };
  STATUSES.forEach(s => counts[s] = S.jobs.filter(j => j.status === s).length);
  const claimCounts = { all: S.jobs.length };
  CLAIM_STATUSES.forEach(s => claimCounts[s] = S.jobs.filter(j => j.claim.status === s).length);
  const isToday = jobFilter === "today";
  const list = S.jobs.filter(j => isToday ? j.scheduledAt === todayISO()
      : (jobFilter === "all" || j.status === jobFilter)
        && (claimFilter === "all" || j.claim.status === claimFilter))
    .sort(isToday
      ? (a, b) => (a.site || "").localeCompare(b.site || "") || (a.customer || "").localeCompare(b.customer || "")
      : (a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
  const hasSample = S.jobs.some(j => j.sample);
  $("#view").innerHTML = `
    ${hasSample ? `<div class="samplebar">${I.doc}<span>Sample jobs shown so you can try the warranty packet. Real jobs you add are kept separate.</span><button class="btn small ghost" id="clearSamples">Clear</button></div>` : ""}
    ${S.samplePurgeOffered && hasSample ? `<div class="card purgeoffer"><h2>Samples</h2>
      <p style="margin:0 0 10px">Your first real job is in. Delete the sample jobs and reminders?</p>
      <div class="row"><button class="btn small" id="purgeSamples">${I.trash}Delete samples</button>
      <button class="btn small ghost" id="keepSamples">Keep them</button></div></div>` : ""}
    <div class="sectionhead"><h2>Jobs</h2><button class="btn small" id="newJob">${I.plus}New job</button></div>
    <div class="chips">
      <button class="chip${jobFilter === "today" ? " active" : ""}" data-f="today">Today (${counts.today})</button>
      <button class="chip${jobFilter === "all" ? " active" : ""}" data-f="all">All (${counts.all})</button>
      ${STATUSES.map(s => `<button class="chip${jobFilter === s ? " active" : ""}" data-f="${s}">${STATUS_LABEL[s]} (${counts[s]})</button>`).join("")}
    </div>
    <div class="filter-label" id="claimFilterLabel">Claim</div>
    <div class="chips" role="group" aria-labelledby="claimFilterLabel">
      <button class="chip${claimFilter === "all" ? " active" : ""}" data-claim-f="all" aria-pressed="${claimFilter === "all"}">All (${claimCounts.all})</button>
      ${CLAIM_STATUSES.map(s => `<button class="chip${claimFilter === s ? " active" : ""}" data-claim-f="${s}" aria-pressed="${claimFilter === s}">${CLAIM_LABEL[s]} (${claimCounts[s]})</button>`).join("")}
    </div>
    <div id="joblist">
      ${list.length ? list.map(j => isToday ? jobCardToday(j) : jobCard(j)).join("") : `<div class="card empty">${I.jobs}<div>${isToday ? "Nothing scheduled for today." : "No jobs here yet.<br>Tap New job to book the first one."}</div>${isToday ? `<button class="btn small secondary" id="newJob2" style="margin-top:10px">${I.plus}New job</button>` : ""}</div>`}
    </div>`;
  document.querySelectorAll("[data-claim-f]").forEach(c => c.onclick = () => { claimFilter = c.dataset.claimF; viewJobs(); });
  document.querySelectorAll("[data-f]").forEach(c => c.onclick = () => { jobFilter = c.dataset.f; viewJobs(); });
  document.querySelectorAll("[data-job]").forEach(el => {
    el.onclick = () => location.hash = "#/job/" + el.dataset.job;
    if (el.tagName !== "BUTTON") el.onkeydown = e => { if (e.key === "Enter") location.hash = "#/job/" + el.dataset.job; };
  });
  document.querySelectorAll("[data-next]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const job = jobById(b.dataset.next);
    if (job) setStatus(job, b.dataset.to, true);
  });
  $("#newJob").onclick = () => location.hash = "#/job/new";
  const nj2 = $("#newJob2"); if (nj2) nj2.onclick = () => location.hash = "#/job/new";
  const clearSamples = () => {
    S.jobs = S.jobs.filter(j => !j.sample); S.reminders = S.reminders.filter(r => !r.sample);
    S.samplePurgeOffered = false; save(S); toast("Sample data cleared"); viewJobs();
  };
  const cs = $("#clearSamples");
  if (cs) cs.onclick = clearSamples;
  const ps = $("#purgeSamples");
  if (ps) ps.onclick = clearSamples;
  const ks = $("#keepSamples");
  if (ks) ks.onclick = () => { S.samplePurgeOffered = false; save(S); viewJobs(); };
}
function jobCard(j) {
  const rv = [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" ");
  return `<button class="jobcard" data-job="${esc(j.id)}">
    <div class="jc-top"><span class="jc-name">${esc(j.customer) || "Unnamed"}</span>
      <span class="pill ${esc(j.status)}">${STATUS_LABEL[j.status]}</span></div>
    ${j.sample ? `<span class="pill sample">Sample</span> ` : ""}<span class="jc-rv">${I.rv} ${esc(rv) || "RV details not set"}</span>
    <div class="jc-meta">
      <span>${I.pin}${esc(j.site) || "No site set"}</span>
      <span>${I.clock}${fmtDate(j.scheduledAt)}</span>
      ${j.status === "complete" ? `<span class="mono">${money(jobTotal(j))}</span>` : ""}
    </div>
  </button>`;
}
/* Today-mode card: a div (not a button, since it nests a quick-action button),
 * with the next status step front and center. */
function jobCardToday(j) {
  const rv = [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" ");
  const next = { scheduled: ["enroute", "En route"], enroute: ["onsite", "On site"], onsite: ["complete", "Mark complete"] }[j.status];
  return `<div class="jobcard" data-job="${j.id}" role="button" tabindex="0" aria-label="Open job for ${esc(j.customer) || "unnamed"}">
    <div class="jc-top"><span class="jc-name">${esc(j.customer) || "Unnamed"}</span>
      <span class="pill ${j.status}">${STATUS_LABEL[j.status]}</span></div>
    ${j.sample ? `<span class="pill sample">Sample</span> ` : ""}<span class="jc-rv">${I.rv} ${esc(rv) || "RV details not set"}</span>
    <div class="jc-meta">
      <span>${I.pin}${esc(j.site) || "No site set"}</span>
      <span>${I.clock}${fmtDate(j.scheduledAt)}</span>
      ${j.status === "complete" ? `<span class="mono">${money(jobTotal(j))}</span>` : ""}
    </div>
    ${next ? `<button class="btn small rust block" data-next="${j.id}" data-to="${next[0]}" style="margin-top:10px">${next[1]}</button>` : ""}
  </div>`;
}

/* ================= JOB FORM ================= */
function viewJobForm() {
  $("#view").innerHTML = `
    <button class="backlink" id="back">${I.back}Jobs</button>
    <div class="sectionhead"><h2>New job</h2></div>
    <div class="card">
      <div class="field" style="position:relative"><label>Customer name</label><input id="f_customer" placeholder="Full name" autocomplete="off"><div id="custSuggest" class="suggest" hidden></div></div>
      <div class="f2">
        <div class="field"><label>Phone</label><input id="f_phone" inputmode="tel" placeholder="(555) 000-0000"></div>
        <div class="field"><label>Date</label><input id="f_date" type="date" value="${todayISO()}"></div>
      </div>
      <div class="field"><label>Site / location</label><input id="f_site" placeholder="Campground + site number"></div>
      <div class="f3">
        <div class="field"><label>Year</label><input id="f_year" inputmode="numeric" placeholder="2022"></div>
        <div class="field"><label>Make</label><input id="f_make" placeholder="Grand Design"></div>
        <div class="field"><label>Model</label><input id="f_model" placeholder="Reflection 260RD"></div>
      </div>
      <div class="field"><label>VIN <span class="muted" style="text-transform:none;letter-spacing:0">(17 chars)</span></label><input id="f_vin" placeholder="17-char VIN" autocapitalize="characters" maxlength="17"></div>
      <div class="field"><label>Complaint (what's wrong)</label><textarea id="f_complaint" placeholder="Customer's words: AC blows warm..."></textarea></div>
      <button class="btn block" id="save">${I.check}Create job</button>
    </div>`;
  $("#back").onclick = () => location.hash = "#/jobs";
  /* customer autocomplete: suggest past customers, prefill rig on tap */
  const custInput = $("#f_customer"), suggBox = $("#custSuggest");
  const pastCustomers = () => {
    const map = new Map();
    [...S.jobs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(j => {
      const n = (j.customer || "").trim();
      if (!n || map.has(n.toLowerCase())) return;
      map.set(n.toLowerCase(), { name: n, phone: j.phone, site: j.site,
        rvYear: j.rvYear, rvMake: j.rvMake, rvModel: j.rvModel, vin: j.vin });
    });
    return [...map.values()];
  };
  custInput.addEventListener("input", () => {
    const q = custInput.value.trim().toLowerCase();
    const matches = q ? pastCustomers().filter(c => c.name.toLowerCase().includes(q)).slice(0, 5) : [];
    if (!matches.length) { suggBox.hidden = true; return; }
    suggBox.innerHTML = matches.map((m, i) => `<button type="button" class="suggest-row" data-i="${i}">
      <span class="t">${esc(m.name)}</span>
      <span class="s">${esc([m.phone, [m.rvYear, m.rvMake, m.rvModel].filter(Boolean).join(" ")].filter(Boolean).join(" · "))}</span>
    </button>`).join("");
    suggBox.hidden = false;
    suggBox.querySelectorAll(".suggest-row").forEach(b => b.addEventListener("mousedown", e => {
      e.preventDefault();
      const m = matches[+b.dataset.i];
      $("#f_customer").value = m.name; $("#f_phone").value = m.phone || "";
      $("#f_site").value = m.site || ""; $("#f_year").value = m.rvYear || "";
      $("#f_make").value = m.rvMake || ""; $("#f_model").value = m.rvModel || "";
      $("#f_vin").value = m.vin || "";
      suggBox.hidden = true; toast("Customer details filled in");
    }));
  });
  custInput.addEventListener("keydown", e => { if (e.key === "Escape") suggBox.hidden = true; });
  custInput.addEventListener("blur", () => setTimeout(() => { suggBox.hidden = true; }, 150));
  $("#save").onclick = () => {
    const j = {
      id: uid(), status: "scheduled",
      customer: $("#f_customer").value.trim(), phone: $("#f_phone").value.trim(),
      site: $("#f_site").value.trim(), scheduledAt: $("#f_date").value || todayISO(),
      rvYear: $("#f_year").value.trim(), rvMake: $("#f_make").value.trim(),
      rvModel: $("#f_model").value.trim(), vin: $("#f_vin").value.trim().toUpperCase(),
      complaint: $("#f_complaint").value.trim(), cause: "", correction: "",
      parts: [], labor: [], timerStart: 0, photos: [], notes: "",
      claim: { insurer: "", claimNumber: "", authNumber: "", authBy: "", authDate: "", status: "draft", statusDate: 0 },
      customerSig: "", techSig: "", filedAt: 0, completedAt: 0, createdAt: Date.now()
    };
    S.jobs.push(j);
    if (S.jobs.filter(x => !x.sample).length === 1 && S.jobs.some(x => x.sample)) S.samplePurgeOffered = true;
    save(S); toast("Job created"); location.hash = "#/job/" + j.id;
  };
}

/* ================= JOB DETAIL ================= */
let timerInt = null;
function viewJobDetail(id) {
  const j = jobById(id);
  if (!j) { location.hash = "#/jobs"; return; }
  clearInterval(timerInt);
  const idx = STATUSES.indexOf(j.status);
  const rv = [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" ");
  const rigPrior = rigJobs(j.vin, j.id);
  $("#view").innerHTML = `
    <button class="backlink" id="back">${I.back}Jobs</button>
    <div class="sectionhead"><h2>${esc(j.customer) || "Unnamed job"}</h2><span class="pill ${esc(j.status)}">${STATUS_LABEL[j.status]}</span></div>
    ${j.sample ? `<div class="samplebar">${I.doc}<span>This is a sample job. Edit freely or clear samples from the Jobs tab.</span></div>` : ""}

    <div class="card"><h2>Job progress</h2>
      <div class="steprow">${STATUSES.map((s, i) =>
        `<button class="stepbtn${i < idx ? "done" : ""}${i === idx ? " now" : ""}" data-status="${s}">${STATUS_LABEL[s]}</button>`).join("")}
      </div>
      <div class="row" style="margin-top:6px">
        <span class="muted">${I.pin} ${esc(j.site) || "No site"}</span>
        <span class="grow"></span>
        ${j.phone ? `<a class="btn small secondary" href="tel:${esc(j.phone.replace(/[^+\d]/g, ""))}">${I.phone}Call</a>` : ""}
      </div>
    </div>

    <div class="card"><h2>RV &amp; customer</h2>
      <div class="row" style="margin-bottom:10px">
        <span class="muted">Past work for this customer:</span><span class="grow"></span>
        <button class="btn small secondary" id="histBtn">${I.clock}History</button>
      </div>
      <div class="row" id="rigRow" style="margin-bottom:10px"${normVin(j.vin) ? "" : " hidden"}>
        <span class="muted" id="rigCount">This VIN${rigPrior.length ? ": " + rigPrior.length + " prior visit" + (rigPrior.length > 1 ? "s" : "") : " (first job on this rig)"}:</span><span class="grow"></span>
        <button class="btn small secondary" id="rigBtn">${I.rv}Rig history</button>
      </div>
      <div class="f2">
        <div class="field"><label>Customer</label><input id="d_customer" value="${esc(j.customer)}"></div>
        <div class="field"><label>Phone</label><input id="d_phone" inputmode="tel" value="${esc(j.phone)}"></div>
      </div>
      <div class="field"><label>Site / location</label><input id="d_site" value="${esc(j.site)}"></div>
      <div class="row" id="mapsRow" style="margin:-6px 0 10px"${j.site ? "" : " hidden"}><span class="grow"></span><a class="btn small secondary" id="mapsLink" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(j.site || "")}">${I.pin}Open in Maps</a></div>
      <div class="f3">
        <div class="field"><label>Year</label><input id="d_year" value="${esc(j.rvYear)}"></div>
        <div class="field"><label>Make</label><input id="d_make" value="${esc(j.rvMake)}"></div>
        <div class="field"><label>Model</label><input id="d_model" value="${esc(j.rvModel)}"></div>
      </div>
      <div class="f2">
        <div class="field"><label>VIN <span class="muted" style="text-transform:none;letter-spacing:0">(17 chars)</span></label><input id="d_vin" value="${esc(j.vin)}" autocapitalize="characters" maxlength="17"></div>
        <div class="field"><label>Scheduled</label><input id="d_date" type="date" value="${esc(j.scheduledAt || todayISO())}"></div>
      </div>
    </div>

    <div class="card"><h2>Diagnosis</h2>
      <div class="field"><label>Complaint</label><textarea id="d_complaint" placeholder="What the customer reports">${esc(j.complaint)}</textarea></div>
      <div class="field"><label>Cause</label><textarea id="d_cause" placeholder="What you found wrong">${esc(j.cause)}</textarea></div>
      <div class="field"><label>Correction</label><textarea id="d_correction" placeholder="What you did to fix it">${esc(j.correction)}</textarea></div>
      <div class="field"><label>Tech notes</label><textarea id="d_notes" placeholder="Anything the claim or customer should know">${esc(j.notes)}</textarea></div>
    </div>

    <div class="card"><h2>Parts</h2>
      <div id="partsList">${j.parts.length ? j.parts.map(p => `
        <div class="item"><div class="grow"><div class="t">${esc(p.name)}</div>
          <div class="s">${esc(p.partNumber)}${p.serial ? " · SN " + esc(p.serial) : ""} · ${esc(p.qty)} × ${money(p.unitCost)}</div></div>
          <button class="stbtn ${esc(p.st)}" data-st="${esc(p.id)}" title="Tap to change: have, to order, ordered" aria-label="Part status: ${esc(PART_ST_LABEL[p.st])}. Tap to change.">${esc(PART_ST_LABEL[p.st])}</button>
          <div class="mono" style="font-weight:800">${money(p.qty * p.unitCost)}</div>
          <button class="iconbtn danger" data-delpart="${esc(p.id)}">${I.trash}</button></div>`).join("")
        : `<div class="muted">No parts logged yet.</div>`}</div>
      <div class="total"><span>Parts total</span><span class="mono">${money(partsTotal(j))}</span></div>
      ${(() => {
        const pending = j.parts.filter(p => p.st === "need" || p.st === "ordered");
        if (!pending.length) return "";
        const need = pending.filter(p => p.st === "need").length;
        const ord = pending.length - need;
        return `<div class="orderbox"><h3>Parts order list</h3>
          <div class="muted" style="margin-bottom:8px">${need ? need + " to order" : ""}${need && ord ? " · " : ""}${ord ? ord + " ordered, waiting" : ""}</div>
          ${pending.map(p => `<div class="item"><div class="grow"><div class="t">${esc(p.name)}</div>
            <div class="s">${esc(p.partNumber) || "No part number"} · qty ${esc(p.qty)} · ${esc(PART_ST_LABEL[p.st])}</div></div></div>`).join("")}
          <button class="btn secondary block" id="copyOrder" style="margin-top:8px">${I.doc}Copy ${need ? "order list" : "ordered-parts list"}</button>
          <div class="muted" style="margin-top:8px">Copies a parts list you send yourself. RoadWrench does not place orders.</div>
        </div>`;
      })()}
      <h3>Add part</h3>
      <div class="f2">
        <div class="field"><label>Part name</label><input id="p_name" placeholder="Water pump"></div>
        <div class="field"><label>Part number</label><input id="p_num" placeholder="SH-94-800-00"></div>
      </div>
      <div class="f3">
        <div class="field"><label>Qty</label><input id="p_qty" inputmode="decimal" value="1"></div>
        <div class="field"><label>Unit cost</label><input id="p_cost" inputmode="decimal" placeholder="0.00"></div>
        <div class="field"><label>Serial #</label><input id="p_serial" placeholder="If tagged"></div>
      </div>
      <button class="btn secondary block" id="addPart">${I.plus}Add part</button>
    </div>

    <div class="card"><h2>Labor</h2>
      <div id="timerBox"></div>
      <div class="field"><label>Task description</label><input id="t_desc" placeholder="e.g. Slide-out gearbox replacement"></div>
      <div id="laborList">${j.labor.length ? j.labor.map(l => `
        <div class="item"><div class="grow"><div class="t">${esc(l.desc) || "Labor"}</div>
          <div class="s">${esc(l.hours)} hrs × ${money(l.rate)}/hr</div></div>
          <div class="mono" style="font-weight:800">${money(l.hours * l.rate)}</div>
          <button class="iconbtn danger" data-dellabor="${esc(l.id)}">${I.trash}</button></div>`).join("")
        : `<div class="muted">No labor logged yet.</div>`}</div>
      <div class="total"><span>Labor total (${laborHours(j).toFixed(2)} hrs)</span><span class="mono">${money(laborTotal(j))}</span></div>
      <h3>Add labor manually</h3>
      <div class="f3">
        <div class="field"><label>Hours</label><input id="l_hours" inputmode="decimal" placeholder="1.5"></div>
        <div class="field"><label>Rate $/hr</label><input id="l_rate" inputmode="decimal" value="${esc(S.company.laborRate)}"></div>
        <div class="field"><label>&nbsp;</label><button class="btn block" id="addLabor">${I.plus}Add</button></div>
      </div>
    </div>

    <div class="card"><h2>Photos</h2>
      ${(() => { const n = j.photos.filter(p => !(p.caption || "").trim()).length;
        return n ? `<div class="nudge">${I.pen}<span>${n} photo${n > 1 ? "s" : ""} missing captions. Captions help the adjuster read your evidence.</span></div>` : ""; })()}
      <div class="tagbtns" id="tagBtns">
        ${["before", "after", "data tag", "part"].map((t, i) =>
          `<button class="tagbtn${i === 0 ? " sel" : ""}" data-tag="${t}">${t}</button>`).join("")}
      </div>
      <div class="field" style="margin-top:8px"><input id="ph_cap" placeholder="Caption (optional)"></div>
      <button class="btn secondary block" id="takePhoto">${I.camera}Take / upload photo</button>
      <input type="file" id="fileInput" class="hiddenfile" accept="image/*" capture="environment">
      <div class="photogrid" id="photoGrid">${j.photos.map(photoHtml).join("")}</div>
      ${j.photos.length ? `<h3>Captions</h3><div id="capList">${j.photos.map(p => `
        <div class="caprow"><img src="${safeDataUrl(p.thumb || p.dataUrl)}" alt="">
          <div class="grow"><div class="s" id="capl-${esc(p.id)}">${esc(p.tag)} · ${fmtDT(p.ts)}${photoMeta(p)}</div>
          <input data-cap="${p.id}" value="${esc(p.caption || "")}" placeholder="Add a caption" aria-label="Caption for ${esc(p.tag)} photo"></div>
        </div>`).join("")}</div>` : ""}
    </div>

    <div class="card"><h2>Warranty / insurance claim</h2>
      <div class="f2">
        <div class="field"><label>Insurer / warranty co.</label><input id="c_insurer" value="${esc(j.claim.insurer)}" placeholder="Wholesale Warranties"></div>
        <div class="field"><label>Claim number</label><input id="c_claim" value="${esc(j.claim.claimNumber)}"></div>
      </div>
      <div class="f3">
        <div class="field"><label>Auth number</label><input id="c_auth" value="${esc(j.claim.authNumber)}"></div>
        <div class="field"><label>Auth by</label><input id="c_authby" value="${esc(j.claim.authBy)}" placeholder="Rep name"></div>
        <div class="field"><label>Auth date</label><input id="c_authdate" type="date" value="${esc(j.claim.authDate)}"></div>
      </div>
    </div>

    <div class="card"><h2>Finish</h2>
      <div class="total" style="padding-top:0"><span>Job total</span><span class="mono">${money(jobTotal(j))}</span></div>
      <button class="btn rust block big" id="buildPacket" style="margin:10px 0">${I.doc}Build warranty packet</button>
      <button class="btn secondary block" id="viewInvoice">${I.doc}Customer invoice</button>
      <button class="btn secondary block" id="shareUpdate">${I.chat}Share customer update</button>
      <div class="muted" style="margin-top:6px">Copies a message you send yourself. RoadWrench does not text customers on its own.</div>
      ${j.status === "complete" && S.company.reviewLink ? `<button class="btn secondary block" id="askReview" style="margin-top:10px">${I.star}Ask for a review</button>` : ""}
      ${j.status !== "complete"
        ? `<button class="btn secondary block big" id="markComplete">${I.check}Mark job complete</button>`
        : `<button class="btn ghost block" id="reopen">${I.back}Reopen job</button>`}
      <button class="btn ghost block danger" id="delJob" style="margin-top:8px; color:var(--danger); border-color:#e5c4bd">${I.trash}Delete job</button>
    </div>`;

  $("#back").onclick = () => location.hash = "#/jobs";
  $("#histBtn").onclick = () => location.hash = "#/customer/" + encodeURIComponent(j.customer || "unnamed");
  const rigBtn = $("#rigBtn");
  if (rigBtn) rigBtn.onclick = () => location.hash = "#/rig/" + encodeURIComponent(normVin(j.vin));
  document.querySelectorAll(".stepbtn").forEach(b => b.onclick = () => { setStatus(j, b.dataset.status); });
  const upd = () => save(S);
  ["d_customer", "d_phone", "d_site", "d_year", "d_make", "d_model", "d_vin", "d_date",
   "d_complaint", "d_cause", "d_correction", "d_notes",
   "c_insurer", "c_claim", "c_auth", "c_authby", "c_authdate"].forEach(fid => {
    const el = document.getElementById(fid); if (el) el.addEventListener("change", upd);
  });
  // live field binding
  const bind = (fid, fn) => { const el = document.getElementById(fid); if (el) el.addEventListener("input", () => { fn(el.value); }); };
  bind("d_customer", v => j.customer = v); bind("d_phone", v => j.phone = v);
  bind("d_site", v => {
    j.site = v;
    const mr = $("#mapsRow");
    if (mr) {
      mr.hidden = !v.trim();
      const ml = $("#mapsLink");
      if (ml) ml.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v.trim());
    }
  }); bind("d_year", v => j.rvYear = v);
  bind("d_make", v => j.rvMake = v); bind("d_model", v => j.rvModel = v);
  bind("d_vin", v => {
    j.vin = v.toUpperCase();
    const rr = $("#rigRow");
    if (rr) {
      rr.hidden = !normVin(j.vin);
      const rc = $("#rigCount");
      if (rc) {
        const n = rigJobs(j.vin, j.id).length;
        rc.textContent = "This VIN" + (n ? ": " + n + " prior visit" + (n > 1 ? "s" : "") : " (first job on this rig)") + ":";
      }
    }
  }); bind("d_date", v => j.scheduledAt = v);
  bind("d_complaint", v => j.complaint = v); bind("d_cause", v => j.cause = v);
  bind("d_correction", v => j.correction = v); bind("d_notes", v => j.notes = v);
  bind("c_insurer", v => j.claim.insurer = v); bind("c_claim", v => j.claim.claimNumber = v);
  bind("c_auth", v => j.claim.authNumber = v); bind("c_authby", v => j.claim.authBy = v);
  bind("c_authdate", v => j.claim.authDate = v);
  window.addEventListener("beforeunload", upd);

  /* parts */
  $("#addPart").onclick = () => {
    const name = $("#p_name").value.trim();
    if (!name) { toast("Enter a part name"); return; }
    j.parts.push({ id: uid(), name, partNumber: $("#p_num").value.trim(),
      qty: parseFloat($("#p_qty").value) || 1, unitCost: parseFloat($("#p_cost").value) || 0,
      serial: $("#p_serial").value.trim(), st: "have" });
    save(S); toast("Part added"); viewJobDetail(j.id);
  };
  document.querySelectorAll("[data-delpart]").forEach(b => b.onclick = () => {
    j.parts = j.parts.filter(p => p.id !== b.dataset.delpart); save(S); viewJobDetail(j.id);
  });
  /* part status toggle: have -> need (to order) -> ordered -> have */
  document.querySelectorAll("[data-st]").forEach(b => b.onclick = () => {
    const p = j.parts.find(x => x.id === b.dataset.st);
    if (!p) return;
    p.st = PART_STS[(PART_STS.indexOf(p.st) + 1) % PART_STS.length];
    save(S); viewJobDetail(j.id);
  });
  const copyOrder = $("#copyOrder");
  if (copyOrder) copyOrder.onclick = () => {
    const toOrder = j.parts.filter(p => p.st === "need");
    const ordered = j.parts.filter(p => p.st === "ordered");
    const line = p => "- " + p.name + (p.partNumber ? " (" + p.partNumber + ")" : "") + " x " + p.qty;
    const text = [
      "PARTS ORDER LIST - " + S.company.name,
      "Job: " + (j.customer || "Not provided") + (rv ? ", " + rv : ""),
      "",
      "TO ORDER:",
      toOrder.length ? toOrder.map(line).join("\n") : "(none)",
      "",
      "ORDERED, WAITING ON DELIVERY:",
      ordered.length ? ordered.map(line).join("\n") : "(none)"
    ].join("\n");
    shareOrCopy("Parts order list", text, "Order list copied");
  };

  /* labor timer */
  renderTimer(j);
  $("#addLabor").onclick = () => {
    const h = parseFloat($("#l_hours").value);
    if (!h || h <= 0) { toast("Enter hours"); return; }
    j.labor.push({ id: uid(), desc: $("#t_desc").value.trim() || "On-site labor",
      hours: Math.round(h * 100) / 100, rate: parseFloat($("#l_rate").value) || S.company.laborRate });
    save(S); toast("Labor added"); viewJobDetail(j.id);
  };
  document.querySelectorAll("[data-dellabor]").forEach(b => b.onclick = () => {
    j.labor = j.labor.filter(l => l.id !== b.dataset.dellabor); save(S); viewJobDetail(j.id);
  });

  /* photos */
  let photoTag = "before";
  document.querySelectorAll("#tagBtns .tagbtn").forEach(b => b.onclick = () => {
    photoTag = b.dataset.tag;
    document.querySelectorAll("#tagBtns .tagbtn").forEach(x => x.classList.toggle("sel", x === b));
  });
  $("#takePhoto").onclick = () => $("#fileInput").click();
  $("#fileInput").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    compressPhoto(f, (dataUrl, thumb) => {
      const photo = { id: uid(), dataUrl, thumb, ts: Date.now(), caption: $("#ph_cap").value.trim(), tag: photoTag, gps: null, hash: "" };
      j.photos.push(photo);
      $("#ph_cap").value = ""; save(S); toast("Photo added"); viewJobDetail(j.id);
      /* Evidence metadata, best-effort: content hash + GPS attach after render. */
      Promise.all([hashPhoto(dataUrl), geoPhoto()]).then(([h, g]) => {
        photo.hash = h || ""; if (g) photo.gps = g; save(S); refreshPhotoMeta(photo);
      }).catch(() => {});
    });
  };
  document.querySelectorAll("[data-delphoto]").forEach(b => b.onclick = () => {
    j.photos = j.photos.filter(p => p.id !== b.dataset.delphoto); save(S); viewJobDetail(j.id);
  });
  document.querySelectorAll("[data-cap]").forEach(inp => inp.addEventListener("change", () => {
    const p = j.photos.find(x => x.id === inp.dataset.cap);
    if (p) { p.caption = inp.value.trim(); save(S); toast("Caption saved"); }
  }));

  /* finish */
  $("#buildPacket").onclick = () => { save(S); location.hash = "#/packet/" + j.id; };
  $("#viewInvoice").onclick = () => { save(S); location.hash = "#/invoice/" + j.id; };
  $("#shareUpdate").onclick = () => {
    const pending = j.parts.filter(p => p.st === "need" || p.st === "ordered");
    const lines = [
      S.company.name + (S.company.phone ? " - " + S.company.phone : ""),
      "Hi " + (j.customer || "there") + ", a quick update on your " + (rv || "RV") + ":",
      "Status: " + STATUS_LABEL[j.status],
      j.correction ? "Work completed: " + j.correction : null,
      "Total so far: " + money(jobTotal(j)),
      pending.length
        ? "Still outstanding: waiting on " + pending.map(p => p.name + (p.st === "need" ? " (to order)" : " (ordered)")).join(", ")
        : (j.status === "complete" ? "All work is done. Thank you!" : null),
      "Reply to this message with any questions."
    ].filter(Boolean).join("\n");
    shareOrCopy("Job update for " + (j.customer || "customer"), lines, "Update copied, send it from your messages app");
  };
  const mc = $("#markComplete");
  if (mc) mc.onclick = () => { setStatus(j, "complete"); };
  const ar = $("#askReview");
  if (ar) ar.onclick = () => {
    const lines = [
      "Hi " + (j.customer || "there") + ", thanks for choosing " + S.company.name + "!",
      "A Google review from a happy customer keeps our little shop rolling:",
      S.company.reviewLink
    ].join("\n");
    logEvent("review_asked", { job_id: j.id });
    shareOrCopy("Review request", lines, "Review request copied, send it from your messages app");
  };
  const ro = $("#reopen");
  if (ro) ro.onclick = () => { j.status = "onsite"; j.completedAt = 0; save(S); viewJobDetail(j.id); };
  $("#delJob").onclick = () => {
    if (confirm("Delete this job and everything on it?")) {
      S.jobs = S.jobs.filter(x => x.id !== j.id); save(S); location.hash = "#/jobs";
    }
  };
}
/* Photo gate: when S.settings.requirePhotos is on, a job cannot be marked
 * complete without at least one before and one after photo. */
function photosGateOk(j) {
  if (!S.settings.requirePhotos) return true;
  const hasBefore = j.photos.some(p => p.tag === "before");
  const hasAfter = j.photos.some(p => p.tag === "after");
  if (!hasBefore || !hasAfter) {
    toast("Add a before photo and an after photo before completing this job");
    return false;
  }
  return true;
}
function setStatus(j, s, stay) {
  if (s === "complete" && !photosGateOk(j)) { stay ? viewJobs() : viewJobDetail(j.id); return; }
  j.status = s;
  if (s === "complete" && !j.completedAt) j.completedAt = Date.now();
  if (s !== "complete") j.completedAt = 0;
  save(S); toast("Status: " + STATUS_LABEL[s]);
  stay ? viewJobs() : viewJobDetail(j.id);
}
function photoHtml(p) {
  return `<div class="photo"><img src="${esc(safeDataUrl(p.dataUrl))}" alt="${esc(p.caption || p.tag)}" loading="lazy">
    <button class="del" data-delphoto="${esc(p.id)}" aria-label="Delete photo">×</button>
    <div class="cap" id="cap-${esc(p.id)}">${esc(p.tag)} · ${fmtDT(p.ts)}${p.caption ? " · " + esc(p.caption) : ""}${photoMeta(p)}</div></div>`;
}
/* Refresh one photo's evidence line in place when its hash/GPS lands. */
function refreshPhotoMeta(photo) {
  const t = photo.tag + " · " + fmtDT(photo.ts) + (photo.caption ? " · " + photo.caption : "") + photoMeta(photo);
  const c1 = document.getElementById("cap-" + photo.id);
  if (c1) c1.textContent = t;
  const c2 = document.getElementById("capl-" + photo.id);
  if (c2) c2.textContent = t;
}
/* Evidence line: GPS (when the device shared it) + short content hash. */
function photoMeta(p) {
  let s = "";
  if (p.gps && isFinite(p.gps.lat) && isFinite(p.gps.lng))
    s += " · " + Number(p.gps.lat).toFixed(5) + ", " + Number(p.gps.lng).toFixed(5);
  if (p.hash) s += " · #" + String(p.hash).slice(0, 8);
  return s;
}
function hashPhoto(dataUrl) {
  try {
    if (!crypto.subtle) return Promise.resolve("");
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataUrl)).then(b =>
      Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join(""));
  } catch (e) { return Promise.resolve(""); }
}
/* Best-effort GPS at capture time. Denied/unavailable = null, never an error. */
function geoPhoto() {
  return new Promise(res => {
    try {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(
        pos => res({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy || 0) }),
        () => res(null),
        { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false });
    } catch (e) { res(null); }
  });
}
function renderTimer(j) {
  const box = $("#timerBox"); if (!box) return;
  const running = !!j.timerStart;
  box.innerHTML = `<div class="timerbar">${I.clock}
    <span class="time" id="timerTime">${running ? elapsed(j.timerStart) : "0:00:00"}</span>
    <span class="muted" style="color:var(--cream);opacity:.7">${running ? "timer running" : "labor timer"}</span>
    <button class="btn small ${running ? "danger" : ""}" id="timerBtn" style="${running ? "" : "background:var(--rust);border-color:var(--rust)"}">${running ? I.stop + "Stop" : I.play + "Start"}</button>
  </div>`;
  $("#timerBtn").onclick = () => {
    if (j.timerStart) {
      const hrs = Math.round(((Date.now() - j.timerStart) / 36e5) * 100) / 100;
      if (hrs > 0) { renderTimerConfirm(j, hrs); }
      else { j.timerStart = 0; save(S); renderTimer(j); }
    } else { j.timerStart = Date.now(); save(S); renderTimer(j); tickTimer(j); }
  };
  if (running) tickTimer(j);
}
/* Confirm panel shown when the timer stops: prefilled hours, description to confirm. */
function renderTimerConfirm(j, hrs) {
  clearInterval(timerInt);
  const box = $("#timerBox"); if (!box) return;
  const pre = $("#t_desc") ? $("#t_desc").value : "";
  const rate = S.company.laborRate;
  box.innerHTML = `<div class="timerconfirm">
    <div class="tc-title">Log <span class="mono">${hrs.toFixed(2)} hrs</span> as labor? (${money(hrs * rate)})</div>
    <div class="field"><label>Task description</label><input id="tc_desc" value="${esc(pre)}" placeholder="What was this time for"></div>
    <div class="row">
      <button class="btn grow" id="tcAdd">${I.check}Add labor</button>
      <button class="btn ghost grow" id="tcDiscard">Discard</button>
    </div>
  </div>`;
  $("#tcAdd").onclick = () => {
    j.labor.push({ id: uid(), desc: $("#tc_desc").value.trim() || "On-site labor",
      hours: hrs, rate });
    j.timerStart = 0; save(S); toast("Logged " + hrs.toFixed(2) + " hrs"); viewJobDetail(j.id);
  };
  $("#tcDiscard").onclick = () => { j.timerStart = 0; save(S); viewJobDetail(j.id); };
}
function tickTimer(j) {
  clearInterval(timerInt);
  timerInt = setInterval(() => {
    const el = $("#timerTime");
    if (!el || !j.timerStart) { clearInterval(timerInt); return; }
    el.textContent = elapsed(j.timerStart);
  }, 1000);
}
function elapsed(start) {
  let s = Math.floor((Date.now() - start) / 1000);
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); const sec = s % 60;
  return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}
function compressPhoto(file, cb) {
  const img = new Image();
  img.onload = () => {
    const max = 1024; let w = img.width, h = img.height;
    if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    const full = c.toDataURL("image/jpeg", 0.8);
    // small thumbnail for sync (full-res dataUrl never leaves this device)
    const tw = 240, th = Math.max(1, Math.round(240 * h / w));
    const tc = document.createElement("canvas"); tc.width = tw; tc.height = th;
    tc.getContext("2d").drawImage(img, 0, 0, tw, th);
    cb(safeDataUrl(full), safeDataUrl(tc.toDataURL("image/jpeg", 0.6)));
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => toast("Could not read that photo");
  img.src = URL.createObjectURL(file);
}

/* ================= WARRANTY PACKET (the magic moment) ================= */
function viewPacket(id) {
  const j = jobById(id);
  if (!j) { location.hash = "#/jobs"; return; }
  clearInterval(timerInt);
  const c = S.company;
  const rv = [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" ");
  const pt = partsTotal(j), lt = laborTotal(j), total = pt + lt;
  const before = j.photos.filter(p => p.tag === "before");
  const after = j.photos.filter(p => p.tag === "after");
  const tags = j.photos.filter(p => p.tag === "data tag" || p.tag === "part");
  const checks = packetChecks(j), missing = checks.filter(check => !check.ok);

  $("#view").innerHTML = `
    <button class="backlink noprint" id="back">${I.back}Back to job</button>
    <div class="sectionhead noprint"><h2>Warranty packet</h2>
      <span class="pill ${esc(j.claim.status)}">${esc(CLAIM_LABEL[j.claim.status])}</span></div>

    <div class="card noprint packet-readiness" id="packetReadiness">
      <h2>Packet readiness</h2>
      <ul class="packet-checks">${checks.map(check => `<li class="packet-check ${check.ok ? "ok" : "missing"}"><span aria-hidden="true">${check.ok ? I.check : I.x}</span><span class="sr-only">${check.ok ? "Complete:" : "Missing:"} </span>${esc(check.label)}</li>`).join("")}</ul>
      <strong>${missing.length ? missing.length + " items missing" : "Ready to print"}</strong>
      ${missing.length ? `<div class="packet-override"><p class="muted">For edge cases only, like non-warranty jobs.</p><button class="btn secondary" id="printAnyway">${I.printer}Print anyway</button></div>` : ""}
    </div>

    <div class="packet" id="packetDoc">
      <div class="p-head">
        <h2>${esc(c.name)}</h2>
        <div class="muted">${esc(c.phone)}${c.email ? " · " + esc(c.email) : ""}${c.address ? "<br>" + esc(c.address) : ""}</div>
        <div style="margin-top:8px;font-size:13px"><strong>WARRANTY / INSURANCE CLAIM PACKET</strong> · Generated ${fmtDT(Date.now())}</div>
      </div>

      <div class="p-sec"><h4>Claim information</h4>
        <dl class="kv">
          <dt>Insurer</dt><dd>${esc(j.claim.insurer) || "Not provided"}</dd>
          <dt>Claim #</dt><dd>${esc(j.claim.claimNumber) || "Not provided"}</dd>
          <dt>Auth #</dt><dd>${esc(j.claim.authNumber) || "Not provided"}</dd>
          <dt>Authorized by</dt><dd>${esc(j.claim.authBy) || "Not provided"}${j.claim.authDate ? " on " + fmtDate(j.claim.authDate) : ""}</dd>
          <dt>Reimburse to</dt><dd>${esc(c.name)}${c.address ? ", " + esc(c.address) : ""}${c.phone ? " · " + esc(c.phone) : ""}</dd>
        </dl>
      </div>

      <div class="p-sec"><h4>Customer &amp; unit</h4>
        <dl class="kv">
          <dt>Customer</dt><dd>${esc(j.customer)}${j.phone ? ' · <span style="white-space:nowrap">' + esc(j.phone) + "</span>" : ""}</dd>
          <dt>Service site</dt><dd>${esc(j.site) || "Not provided"}</dd>
          <dt>Unit</dt><dd>${esc(rv) || "Not provided"}</dd>
          <dt>VIN</dt><dd class="mono">${esc(j.vin) || "Not provided"}</dd>
          <dt>Service date</dt><dd>${fmtDate(j.scheduledAt)}${j.completedAt ? " · completed " + fmtDate(new Date(j.completedAt).toISOString().slice(0, 10)) : ""}</dd>
        </dl>
      </div>

      <div class="p-sec"><h4>Complaint / cause / correction</h4>
        <dl class="kv">
          <dt>Complaint</dt><dd>${esc(j.complaint) || "Not provided"}</dd>
          <dt>Cause</dt><dd>${esc(j.cause) || "Not provided"}</dd>
          <dt>Correction</dt><dd>${esc(j.correction) || "Not provided"}</dd>
        </dl>
        ${j.notes ? `<div class="muted" style="margin-top:6px">Notes: ${esc(j.notes)}</div>` : ""}
      </div>

      <div class="p-sec"><h4>Parts</h4>
        ${j.parts.length ? `<table><tr><th>Part</th><th>Part #</th><th>Serial #</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Total</th></tr>
        ${j.parts.map(p => `<tr><td>${esc(p.name)}</td><td class="mono">${esc(p.partNumber) || "Not provided"}</td><td class="mono">${esc(p.serial) || "Not provided"}</td><td class="r">${esc(p.qty)}</td><td class="r">${money(p.unitCost)}</td><td class="r">${money(p.qty * p.unitCost)}</td></tr>`).join("")}
        <tr><td colspan="5" class="r"><strong>Parts subtotal</strong></td><td class="r"><strong>${money(pt)}</strong></td></tr></table>`
        : `<div class="muted">No parts recorded.</div>`}
      </div>

      <div class="p-sec"><h4>Labor</h4>
        ${j.labor.length ? `<table><tr><th>Description</th><th class="r">Hours</th><th class="r">Rate</th><th class="r">Total</th></tr>
        ${j.labor.map(l => `<tr><td>${esc(l.desc)}</td><td class="r">${esc(l.hours)}</td><td class="r">${money(l.rate)}</td><td class="r">${money(l.hours * l.rate)}</td></tr>`).join("")}
        <tr><td colspan="3" class="r"><strong>Labor subtotal (${laborHours(j).toFixed(2)} hrs)</strong></td><td class="r"><strong>${money(lt)}</strong></td></tr></table>`
        : `<div class="muted">No labor recorded.</div>`}
      </div>

      <div class="p-sec"><h4>Claim total</h4>
        <table><tr><td><strong>Total amount claimed</strong></td><td class="r" style="font-size:20px"><strong>${money(total)}</strong></td></tr></table>
      </div>

      ${before.length || after.length ? `<div class="p-sec"><h4>Condition photos (timestamped)</h4>
        <div class="p-photos">
        ${before.concat(after).map(p => `<figure><img src="${esc(safeDataUrl(p.dataUrl))}" alt="${esc(p.caption || p.tag)}"><figcaption>${esc(p.tag)} · ${fmtDT(p.ts)}${p.caption ? " · " + esc(p.caption) : ""}${p.hash ? " · #" + esc(String(p.hash).slice(0, 8)) : ""}</figcaption></figure>`).join("")}
        </div></div>` : ""}

      ${tags.length ? `<div class="p-sec"><h4>Data tags &amp; part photos</h4>
        <div class="p-photos">
        ${tags.map(p => `<figure><img src="${esc(safeDataUrl(p.dataUrl))}" alt="${esc(p.caption || p.tag)}"><figcaption>${esc(p.tag)} · ${fmtDT(p.ts)}${p.caption ? " · " + esc(p.caption) : ""}${p.hash ? " · #" + esc(String(p.hash).slice(0, 8)) : ""}</figcaption></figure>`).join("")}
        </div></div>` : ""}

      <div class="p-sec"><h4>Signatures</h4>
        <div class="f2">
          <div><div class="muted" style="font-size:12px;margin-bottom:4px">CUSTOMER</div>
            ${j.customerSig ? `<img class="sigimg" src="${esc(safeDataUrl(j.customerSig))}" alt="Customer signature">` : `<div class="muted">Not signed</div>`}
            <div style="font-size:13px;margin-top:4px">${esc(j.customer)}</div></div>
          <div><div class="muted" style="font-size:12px;margin-bottom:4px">TECHNICIAN</div>
            ${j.techSig ? `<img class="sigimg" src="${esc(safeDataUrl(j.techSig))}" alt="Tech signature">` : `<div class="muted">Not signed</div>`}
            <div style="font-size:13px;margin-top:4px">${esc(c.name)}</div></div>
        </div>
      </div>
    </div>

    <div class="card noprint" style="margin-top:12px"><h2>Sign the packet</h2>
      <div class="field"><label>Customer signature: sign below</label>
        <div class="sigwrap"><canvas class="sigpad" id="sigCustomer" width="600" height="150"></canvas>
        <button class="btn small ghost clear" id="clearCSig">Clear</button></div></div>
      <div class="field"><label>Technician signature</label>
        <div class="sigwrap"><canvas class="sigpad" id="sigTech" width="600" height="150"></canvas>
        <button class="btn small ghost clear" id="clearTSig">Clear</button></div></div>
      <button class="btn secondary block" id="saveSigs">${I.pen}Save signatures to packet</button>
    </div>

    <div class="noprint" style="display:grid;gap:10px;margin-top:4px">
      <div class="field"><label for="claimStatus">Claim status</label>
        <select id="claimStatus">${CLAIM_STATUSES.map(s => `<option value="${s}"${j.claim.status === s ? " selected" : ""}>${CLAIM_LABEL[s]}</option>`).join("")}</select>
      </div>
      <button class="btn rust block" id="printBtn">${I.printer}Print / save as PDF</button>
      <button class="btn secondary block" id="shareBtn">${I.doc}Share packet summary</button>
      ${["filed", "approved", "paid"].includes(j.claim.status)
        ? `<div class="card" style="text-align:center"><strong>Claim filed</strong><div class="muted">${fmtDT(j.claim.statusDate || j.filedAt || Date.now())}</div></div>`
        : `<button class="btn block" id="filedBtn">${I.check}Mark claim filed</button>`}
      <button class="btn ghost block" id="backJob">Back to job</button>
    </div>`;

  $("#back").onclick = () => location.hash = "#/job/" + j.id;
  $("#backJob").onclick = () => location.hash = "#/job/" + j.id;
  logEvent("packet_built", { job_id: j.id });
  initSigPad($("#sigCustomer"), j.customerSig);
  initSigPad($("#sigTech"), j.techSig);
  $("#clearCSig").onclick = () => clearSig($("#sigCustomer"));
  $("#clearTSig").onclick = () => clearSig($("#sigTech"));
  $("#saveSigs").onclick = () => {
    const cs = sigData($("#sigCustomer")), ts = sigData($("#sigTech"));
    const feedback = [];
    if ($("#sigCustomer").dataset.used && !cs) feedback.push("Customer signature has no ink, draw it again");
    if ($("#sigTech").dataset.used && !ts) feedback.push("Technician signature has no ink, draw it again");
    j.customerSig = cs; j.techSig = ts;
    save(S); toast(["Signatures saved", ...feedback].join(". ")); viewPacket(j.id);
  };
  const readyToOutput = () => {
    const missing = packetChecks(j).filter(check => !check.ok);
    if (!missing.length) return true;
    toast("Missing: " + missing.map(check => check.label.toLowerCase()).join(", "));
    $("#packetReadiness").scrollIntoView({ behavior: "smooth", block: "start" });
    return false;
  };
  $("#claimStatus").onchange = e => {
    const value = e.target.value;
    if (!CLAIM_STATUSES.includes(value)) return;
    j.claim.status = value; j.claim.statusDate = Date.now();
    if (value === "filed" && !j.filedAt) j.filedAt = j.claim.statusDate;
    save(S); toast("Claim: " + CLAIM_LABEL[value]); viewPacket(j.id);
  };
  const printAnyway = $("#printAnyway");
  if (printAnyway) printAnyway.onclick = () => { logEvent("packet_printed", { job_id: j.id, override_used: true }); authorizedPrint(); };
  $("#printBtn").onclick = () => { if (readyToOutput()) { logEvent("packet_printed", { job_id: j.id, override_used: false }); authorizedPrint(); } };
  $("#shareBtn").onclick = () => {
    if (!readyToOutput()) return;
    const lines = [
      c.name + (c.phone ? " · " + c.phone : ""),
      "WARRANTY CLAIM PACKET",
      "Customer: " + (j.customer || "Not provided"),
      "Unit: " + (rv || "Not provided") + (j.vin ? " · VIN " + j.vin : ""),
      "Complaint: " + (j.complaint || "Not provided"),
      "Cause: " + (j.cause || "Not provided"),
      "Correction: " + (j.correction || "Not provided"),
      "Parts: " + money(pt) + " · Labor: " + money(lt) + " (" + laborHours(j).toFixed(2) + " hrs)",
      "TOTAL CLAIMED: " + money(total),
      j.claim.claimNumber ? "Claim #: " + j.claim.claimNumber : null,
      j.claim.authNumber ? "Auth #: " + j.claim.authNumber + (j.claim.authBy ? " (" + j.claim.authBy + ")" : "") : null,
      "Photos: " + j.photos.length + " timestamped"
    ].filter(Boolean).join("\n");
    if (navigator.share) {
      navigator.share({ title: "Warranty packet: " + (j.customer || "job"), text: lines }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(lines).then(() => toast("Packet summary copied"), () => toast("Copy failed"));
    } else { toast("Sharing not supported here"); }
  };
  const fb = $("#filedBtn");
  if (fb) fb.onclick = () => {
    if (j.status !== "complete") {
      if (!photosGateOk(j)) { viewPacket(j.id); return; }
      setStatusSilent(j, "complete");
    }
    j.claim.status = "filed"; j.claim.statusDate = Date.now();
    j.filedAt = j.claim.statusDate; save(S); logEvent("claim_filed", { job_id: j.id }); toast("Claim marked filed"); viewPacket(j.id);
  };
}
function setStatusSilent(j, s) { j.status = s; if (s === "complete" && !j.completedAt) j.completedAt = Date.now(); }

/* ================= CUSTOMER INVOICE ================= */
/* Invoice numbers are issued on first print/share, never on view. Opening the
 * invoice view and closing it burns nothing; deleting a job with no issued
 * number burns nothing. The number only appears in the UI after issueInvoiceNumber
 * runs, so it is never shown before it exists. */
const INV_LOCK = "roadwrench.invoicelock.v1";
function issueInvoiceNumber(j) {
  if (j.invoiceNumber) return j.invoiceNumber;
  /* Cheap cross-tab lease: if another tab is mid-assignment, its lease is
   * fresh; return null so the user taps again instead of double-assigning.
   * The re-read of the persisted counter below also closes most of the race. */
  try {
    const lease = parseInt(localStorage.getItem(INV_LOCK) || "0", 10) || 0;
    if (Date.now() - lease < 3000) return null;
    localStorage.setItem(INV_LOCK, String(Date.now()));
    try {
      const fresh = JSON.parse(localStorage.getItem(KEY));
      if (fresh && typeof fresh.invoiceSeq === "number") S.invoiceSeq = Math.max(S.invoiceSeq || 1, fresh.invoiceSeq);
    } catch (e) {}
  } catch (e) {}
  j.invoiceNumber = "RW-" + new Date().getFullYear() + "-" + String(S.invoiceSeq).padStart(4, "0");
  S.invoiceSeq++;
  save(S);
  try { localStorage.removeItem(INV_LOCK); } catch (e) {}
  return j.invoiceNumber;
}
function viewInvoice(id) {
  const j = jobById(id);
  if (!j) { location.hash = "#/jobs"; return; }
  clearInterval(timerInt);
  const issued = !!j.invoiceNumber;
  const c = S.company;
  const rv = [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" ");
  const pt = partsTotal(j), lt = laborTotal(j);
  const taxRate = Number(c.taxRate) || 0;
  const sub = pt + lt, tax = sub * taxRate / 100, total = sub + tax;
  $("#view").innerHTML = `
    <button class="backlink noprint" id="back">${I.back}Back to job</button>
    <div class="sectionhead noprint"><h2>Customer invoice</h2>${issued
      ? `<span class="pill complete">${esc(j.invoiceNumber)}</span>`
      : `<span class="pill draft">Not numbered yet</span>`}</div>

    <div class="packet" id="invoiceDoc">
      <div class="p-head">
        <h2>${esc(c.name)}</h2>
        <div class="muted">${esc(c.phone)}${c.email ? " · " + esc(c.email) : ""}${c.address ? "<br>" + esc(c.address) : ""}</div>
        <div style="margin-top:8px;font-size:13px"><strong>${issued ? "INVOICE " + esc(j.invoiceNumber) : "DRAFT INVOICE, number issued on first print or share"}</strong> · ${fmtDate(todayISO())}</div>
      </div>

      <div class="p-sec"><h4>Bill to</h4>
        <dl class="kv">
          <dt>Customer</dt><dd>${esc(j.customer)}${j.phone ? ' · <span style="white-space:nowrap">' + esc(j.phone) + "</span>" : ""}</dd>
          <dt>Service site</dt><dd>${esc(j.site) || "Not provided"}</dd>
          <dt>Unit</dt><dd>${esc(rv) || "Not provided"}</dd>
          ${j.vin ? `<dt>VIN</dt><dd class="mono">${esc(j.vin)}</dd>` : ""}
          <dt>Service date</dt><dd>${fmtDate(j.scheduledAt)}</dd>
        </dl>
      </div>

      <div class="p-sec"><h4>Line items</h4>
        ${(j.parts.length || j.labor.length) ? `<table>
          <tr><th>Description</th><th class="r">Qty / hrs</th><th class="r">Unit</th><th class="r">Total</th></tr>
          ${j.parts.map(p => `<tr><td>${esc(p.name)}${p.partNumber ? '<div class="muted" style="font-size:12px">Part # ' + esc(p.partNumber) + "</div>" : ""}</td><td class="r">${p.qty}</td><td class="r">${money(p.unitCost)}</td><td class="r">${money(p.qty * p.unitCost)}</td></tr>`).join("")}
          ${j.labor.map(l => `<tr><td>${esc(l.desc)}</td><td class="r">${l.hours}</td><td class="r">${money(l.rate)}</td><td class="r">${money(l.hours * l.rate)}</td></tr>`).join("")}
        </table>` : `<div class="muted">No parts or labor recorded yet.</div>`}
      </div>

      <div class="p-sec"><h4>Totals</h4>
        <table>
          <tr><td>Subtotal</td><td class="r">${money(sub)}</td></tr>
          ${taxRate > 0 ? `<tr><td>Tax (${taxRate}%)</td><td class="r">${money(tax)}</td></tr>` : ""}
          <tr><td><strong>Total due</strong></td><td class="r" style="font-size:20px"><strong>${money(total)}</strong></td></tr>
        </table>
        <div class="muted" style="margin-top:8px">Payment due on receipt. Thank you for your business.</div>
      </div>
    </div>

    <div class="noprint" style="display:grid;gap:10px;margin-top:12px">
      <button class="btn rust block" id="printInv">${I.printer}Print / save as PDF</button>
      <button class="btn secondary block" id="shareInv">${I.doc}Share invoice</button>
      <button class="btn ghost block" id="backJob">Back to job</button>
    </div>`;
  $("#back").onclick = () => location.hash = "#/job/" + j.id;
  $("#backJob").onclick = () => location.hash = "#/job/" + j.id;
  $("#printInv").onclick = () => {
    if (!issueInvoiceNumber(j)) { toast("Numbering is busy, tap print again"); return; }
    viewInvoice(j.id); /* re-render so the issued number is on the page */
    authorizedPrint();
  };
  $("#shareInv").onclick = () => {
    if (!issueInvoiceNumber(j)) { toast("Numbering is busy, tap share again"); return; }
    viewInvoice(j.id);
    const lines = [
      "INVOICE " + j.invoiceNumber + " · " + c.name + (c.phone ? " · " + c.phone : ""),
      "Bill to: " + (j.customer || "Not provided"),
      "Unit: " + (rv || "Not provided"),
      "Service date: " + fmtDate(j.scheduledAt),
      "Parts: " + money(pt) + " · Labor: " + money(lt) + " (" + laborHours(j).toFixed(2) + " hrs)",
      taxRate > 0 ? "Tax (" + taxRate + "%): " + money(tax) : null,
      "TOTAL DUE: " + money(total),
      "Payment due on receipt. Thank you for your business."
    ].filter(Boolean).join("\n");
    if (navigator.share) {
      navigator.share({ title: "Invoice " + j.invoiceNumber, text: lines }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(lines).then(() => toast("Invoice copied"), () => toast("Copy failed"));
    } else { toast("Sharing not supported here"); }
  };
}

function initSigPad(canvas, existing) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3d2b";
  canvas.dataset.used = "";
  canvas.dataset.dist = "0";
  canvas._sigPending = null;
  if (safeDataUrl(existing)) {
    const img = new Image();
    canvas._sigPending = img;
    canvas.dataset.used = "1"; canvas.dataset.dist = "9999";
    img.onload = () => {
      if (canvas._sigPending !== img) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.dataset.used = "1"; canvas.dataset.dist = "9999";
      canvas._sigPending = null;
    };
    img.onerror = () => { if (canvas._sigPending === img) clearSig(canvas); };
    img.src = safeDataUrl(existing);
  }
  let drawing = false, last = null;
  const pos = e => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * canvas.width / r.width, y: (p.clientY - r.top) * canvas.height / r.height }; };
  const start = e => { if (canvas._sigPending) return; drawing = true; canvas.dataset.used = "1"; canvas.setPointerCapture(e.pointerId); last = pos(e); e.preventDefault(); };
  const move = e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); canvas.dataset.dist = String(parseFloat(canvas.dataset.dist || "0") + Math.hypot(p.x - last.x, p.y - last.y)); last = p; e.preventDefault(); };
  const end = () => drawing = false;
  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}
function clearSig(canvas) {
  canvas._sigPending = null;
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.used = ""; canvas.dataset.dist = "0";
}
function sigData(canvas) {
  if (!canvas.dataset.used || !(parseFloat(canvas.dataset.dist || "0") > 120)) return "";
  // Preserve existing ink if Save is tapped before its image finishes loading.
  return canvas._sigPending ? safeDataUrl(canvas._sigPending.src) : canvas.toDataURL("image/png");
}

/* ================= CUSTOMER HISTORY ================= */
function viewCustomer(name) {
  clearInterval(timerInt);
  const jobs = S.jobs.filter(j => (j.customer || "unnamed").toLowerCase() === name.toLowerCase())
    .sort((a, b) => (b.scheduledAt || "").localeCompare(a.scheduledAt || ""));
  const spent = jobs.reduce((t, j) => t + jobTotal(j), 0);
  $("#view").innerHTML = `
    <button class="backlink" id="back">${I.back}Back</button>
    <div class="sectionhead"><h2>${esc(name)}</h2></div>
    <div class="statgrid">
      <div class="stat"><div class="v">${jobs.length}</div><div class="l">Jobs</div></div>
      <div class="stat"><div class="v">${money(spent)}</div><div class="l">Lifetime</div></div>
    </div>
    ${jobs.length ? jobs.map(j => `
      <button class="jobcard" data-job="${esc(j.id)}">
        <div class="jc-top"><span class="jc-name">${fmtDate(j.scheduledAt)}</span>
          <span class="pill ${esc(j.status)}">${STATUS_LABEL[j.status]}</span></div>
        <div class="jc-rv">${esc([j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" "))}</div>
        <div class="jc-meta"><span>${esc(j.complaint || "No complaint recorded").slice(0, 60)}</span>
        <span class="mono">${money(jobTotal(j))}</span></div>
      </button>`).join("")
      : `<div class="card empty">${I.user}<div>No jobs for this customer yet.</div></div>`}`;
  $("#back").onclick = () => history.back();
  document.querySelectorAll("[data-job]").forEach(el => el.onclick = () => location.hash = "#/job/" + el.dataset.job);
}

/* ================= RIG SERVICE TIMELINE (VIN-keyed) ================= */
/* Every job on one VIN, newest first. Answers the adjuster's favorite
 * question ("has this unit had this repair before") and gives the owner a
 * service history they can hand to the next buyer. */
function viewRig(vin) {
  clearInterval(timerInt);
  const v = normVin(vin);
  const jobs = S.jobs.filter(j => v && normVin(j.vin) === v)
    .sort((a, b) => (b.scheduledAt || "").localeCompare(a.scheduledAt || ""));
  if (!jobs.length) { toast("No jobs with that VIN yet"); location.hash = "#/jobs"; return; }
  const latest = jobs[0];
  const rv = [latest.rvYear, latest.rvMake, latest.rvModel].filter(Boolean).join(" ");
  const spend = jobs.reduce((t, j) => t + jobTotal(j), 0);
  const hours = jobs.reduce((t, j) => t + laborHours(j), 0);
  const partLine = p => esc(p.name) + (p.partNumber ? " (" + esc(p.partNumber) + ")" : "") + (p.serial ? ", SN " + esc(p.serial) : "") + " x " + esc(p.qty);
  $("#view").innerHTML = `
    <button class="backlink" id="back">${I.back}Back</button>
    <div class="sectionhead"><h2>${esc(rv) || "RV service history"}</h2></div>
    <div class="card"><h2>This rig</h2>
      <dl class="kv">
        <dt>Unit</dt><dd>${esc(rv) || "Not provided"}</dd>
        <dt>VIN</dt><dd class="mono">${esc(v)}</dd>
        <dt>Visits</dt><dd>${jobs.length}</dd>
        <dt>Lifetime spend</dt><dd class="mono">${money(spend)}</dd>
        <dt>Labor logged</dt><dd>${hours.toFixed(2)} hrs</dd>
      </dl>
      <button class="btn secondary block" id="copyHist" style="margin-top:10px">${I.doc}Copy service history</button>
      <div class="muted" style="margin-top:8px">Hand this to the owner for a used-RV listing, or to the adjuster when asked what this unit has had done.</div>
    </div>
    ${jobs.map(j => `
      <div class="card rigvisit">
        <div class="rv-top"><span class="rv-date">${fmtDate(j.scheduledAt)}</span>
          <span class="pill ${esc(j.status)}">${STATUS_LABEL[j.status]}</span></div>
        <div class="muted">${esc(j.customer) || "Unnamed"}${j.site ? " · " + esc(j.site) : ""}</div>
        <div class="rigtl">
          ${j.complaint ? `<div><strong>Complaint:</strong> ${esc(j.complaint)}</div>` : ""}
          ${j.cause ? `<div><strong>Cause:</strong> ${esc(j.cause)}</div>` : ""}
          ${j.correction ? `<div><strong>Correction:</strong> ${esc(j.correction)}</div>` : ""}
          ${j.parts.length ? `<div><strong>Parts:</strong> ${j.parts.map(partLine).join("; ")}</div>` : ""}
          ${j.labor.length ? `<div><strong>Labor:</strong> ${laborHours(j).toFixed(2)} hrs</div>` : ""}
        </div>
        <div class="row">
          <span class="mono" style="font-weight:800">${money(jobTotal(j))}</span>
          <span class="grow"></span>
          <span class="pill ${esc(j.claim.status)}">${esc(CLAIM_LABEL[j.claim.status])}</span>
          <button class="btn small secondary" data-open="${esc(j.id)}">Open job</button>
        </div>
      </div>`).join("")}`;
  $("#back").onclick = () => history.back();
  document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => location.hash = "#/job/" + b.dataset.open);
  $("#copyHist").onclick = () => {
    const lines = [
      "SERVICE HISTORY - " + (rv || "RV"),
      "VIN: " + v,
      jobs.length + " visit" + (jobs.length > 1 ? "s" : "") + ", lifetime spend " + money(spend) + ", " + hours.toFixed(2) + " labor hrs",
      ""
    ];
    jobs.forEach(j => {
      lines.push(fmtDate(j.scheduledAt) + " - " + (j.customer || "Unnamed"));
      if (j.complaint) lines.push("Complaint: " + j.complaint);
      if (j.correction) lines.push("Correction: " + j.correction);
      if (j.parts.length) lines.push("Parts: " + j.parts.map(p => p.name + (p.partNumber ? " (" + p.partNumber + ")" : "")).join("; "));
      if (j.labor.length) lines.push("Labor: " + laborHours(j).toFixed(2) + " hrs");
      lines.push("Claim: " + CLAIM_LABEL[j.claim.status] + " - job total " + money(jobTotal(j)));
      lines.push("");
    });
    lines.push("Recorded by " + S.company.name + (S.company.phone ? ", " + S.company.phone : ""));
    shareOrCopy("Service history " + v, lines.join("\n"), "Service history copied");
  };
}

/* ================= REMINDERS ================= */
function viewReminders() {
  const sorted = [...S.reminders].sort((a, b) => nextDue(a) - nextDue(b));
  const now = new Date(); now.setHours(0, 0, 0, 0);
  $("#view").innerHTML = `
    <div class="sectionhead"><h2>Reminders</h2></div>
    <div class="muted" style="margin-bottom:10px">RoadWrench does not send reminders by itself. Tap the phone icon to text the customer yourself.</div>
    <div class="card"><h2>Recurring maintenance</h2>
      ${sorted.length ? sorted.map(r => {
        const due = nextDue(r); const days = Math.round((due - now) / 864e5);
        const cls = days < 0 ? "over" : days <= 30 ? "soon" : "ok";
        const lbl = days < 0 ? Math.abs(days) + "d overdue" : days === 0 ? "due today" : "in " + days + "d";
        return `<div class="rem">
          <div class="duebadge ${cls}">${lbl}</div>
          <div class="grow"><div style="font-weight:800">${esc(r.service)}</div>
            <div class="muted">${esc(r.customer)} · ${esc(r.rvLabel)}<br>Every ${esc(r.intervalMonths)} mo · last done ${fmtDate(r.lastDone)}</div></div>
          <button class="iconbtn" data-done="${esc(r.id)}" title="Mark done">${I.check}</button>
          <button class="iconbtn" data-sched="${esc(r.id)}" title="Schedule job">${I.cal}</button>
          <a class="iconbtn" title="Text customer" href="sms:?&body=${encodeURIComponent(`Hi ${r.customer}, this is ${S.company.name}: your ${r.service} for your ${r.rvLabel || "RV"} is due. Reply to schedule a visit!`)}">${I.phone}</a>
          <button class="iconbtn danger" data-delrem="${esc(r.id)}">${I.trash}</button>
        </div>`;
      }).join("") : `<div class="empty">${I.bell}<div>No reminders yet.<br>Set one below and never miss a reseal again.</div></div>`}
    </div>
    <div class="card"><h2>Add reminder</h2>
      <div class="f2">
        <div class="field"><label>Customer</label><input id="r_customer" placeholder="Full name"></div>
        <div class="field"><label>RV</label><input id="r_rv" placeholder="2022 Reflection 260RD"></div>
      </div>
      <div class="f2">
        <div class="field"><label>Service</label><input id="r_service" placeholder="Roof reseal inspection"></div>
        <div class="field"><label>Last done</label><input id="r_last" type="date" value="${todayISO()}"></div>
      </div>
      <div class="field"><label>Repeat every (months)</label>
        <select id="r_int">${[3, 6, 12, 24, 36].map(m => `<option value="${m}"${m === 12 ? " selected" : ""}>${m} months</option>`).join("")}</select></div>
      <button class="btn block" id="addRem">${I.plus}Add reminder</button>
    </div>`;
  $("#addRem").onclick = () => {
    const cust = $("#r_customer").value.trim();
    if (!cust) { toast("Enter a customer name"); return; }
    S.reminders.push({ id: uid(), customer: cust, rvLabel: $("#r_rv").value.trim(),
      service: $("#r_service").value.trim() || "Maintenance", lastDone: $("#r_last").value || todayISO(),
      intervalMonths: parseInt($("#r_int").value, 10) });
    save(S); toast("Reminder added"); viewReminders();
  };
  document.querySelectorAll("[data-done]").forEach(b => b.onclick = () => {
    const r = S.reminders.find(x => x.id === b.dataset.done);
    if (r) { r.lastDone = todayISO(); save(S); toast("Marked done: next due reset"); viewReminders(); }
  });
  document.querySelectorAll("[data-delrem]").forEach(b => b.onclick = () => {
    S.reminders = S.reminders.filter(x => x.id !== b.dataset.delrem); save(S); viewReminders();
  });
  document.querySelectorAll("[data-sched]").forEach(b => b.onclick = () => {
    const r = S.reminders.find(x => x.id === b.dataset.sched);
    if (!r) return;
    const prev = [...S.jobs]
      .filter(j => (j.customer || "").toLowerCase() === (r.customer || "").toLowerCase())
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
    let rvYear = "", rvModel = r.rvLabel || "";
    const ym = (r.rvLabel || "").match(/^(\d{4})\s+(.*)$/);
    if (ym) { rvYear = ym[1]; rvModel = ym[2]; }
    const due = nextDue(r);
    const iso = due.getFullYear() + "-" + String(due.getMonth() + 1).padStart(2, "0") + "-" + String(due.getDate()).padStart(2, "0");
    const j = { id: uid(), status: "scheduled", customer: r.customer,
      phone: (prev && prev.phone) || "", site: (prev && prev.site) || "", scheduledAt: iso,
      rvYear, rvMake: "", rvModel, vin: (prev && prev.vin) || "",
      complaint: (r.service || "Maintenance") + " (scheduled maintenance)",
      cause: "", correction: "", parts: [], labor: [], timerStart: 0, photos: [], notes: "",
      claim: { insurer: "", claimNumber: "", authNumber: "", authBy: "", authDate: "", status: "draft", statusDate: 0 },
      customerSig: "", techSig: "", filedAt: 0, completedAt: 0, createdAt: Date.now() };
    S.jobs.push(j); save(S); toast("Job created from reminder"); location.hash = "#/job/" + j.id;
  });
}

/* ================= DASHBOARD ================= */
function viewDashboard() {
  const done = S.jobs.filter(j => j.status === "complete");
  const active = S.jobs.filter(j => j.status !== "complete");
  const rev = done.reduce((a, j) => a + jobTotal(j), 0);
  const now = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const mRev = done.filter(j => j.completedAt >= mStart).reduce((a, j) => a + jobTotal(j), 0);
  const avg = done.length ? rev / done.length : 0;
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
    const r = done.filter(j => j.completedAt >= d.getTime() && j.completedAt < e).reduce((a, j) => a + jobTotal(j), 0);
    months.push({ label: d.toLocaleDateString("en-US", { month: "short" }), rev: r });
  }
  const max = Math.max(...months.map(m => m.rev), 1);
  $("#view").innerHTML = `
    <div class="sectionhead"><h2>Money</h2></div>
    <div class="statgrid">
      <div class="stat"><div class="v">${money(mRev)}</div><div class="l">This month</div></div>
      <div class="stat"><div class="v">${money(rev)}</div><div class="l">All-time revenue</div></div>
      <div class="stat"><div class="v">${done.length}</div><div class="l">Jobs completed</div></div>
      <div class="stat"><div class="v">${money(avg)}</div><div class="l">Avg ticket</div></div>
    </div>
    <div class="card"><h2>Claims pipeline</h2>
      ${CLAIM_STATUSES.map(s => {
        const jobs = S.jobs.filter(j => j.claim.status === s);
        return `<div class="item claim-pipeline-row"><span class="pill ${s}">${CLAIM_LABEL[s]}</span><div class="grow">${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} · <span class="mono">${money(jobs.reduce((sum, j) => sum + jobTotal(j), 0))}</span>${s === "filed" || s === "approved" ? `<div class="muted">Money waiting on the insurer</div>` : ""}</div></div>`;
      }).join("")}
    </div>
    <div class="card"><h2>Revenue: last 6 months</h2>
      <div class="bars">${months.map(m => `<div class="bar" style="height:${Math.max(4, (m.rev / max) * 100)}%" title="${m.label}: ${money(m.rev)}"><span>${m.label}</span></div>`).join("")}</div>
      <div style="height:22px"></div>
    </div>
    <div class="card"><h2>Active jobs (${active.length})</h2>
      ${active.length ? active.slice(0, 5).map(j => `
        <div class="item" data-gojob="${esc(j.id)}" style="cursor:pointer"><div class="grow">
          <div class="t">${esc(j.customer)}</div><div class="s">${esc([j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" "))}</div></div>
          <span class="pill ${esc(j.status)}">${STATUS_LABEL[j.status]}</span></div>`).join("")
        : `<div class="muted">No active jobs. Book one from the Jobs tab.</div>`}
    </div>
    <button class="btn secondary block" id="csvBtn">${I.doc}Export completed jobs (CSV)</button>`;
  document.querySelectorAll("[data-gojob]").forEach(el => el.onclick = () => location.hash = "#/job/" + el.dataset.gojob);
  $("#csvBtn").onclick = () => {
    const rows = [["Date", "Customer", "RV", "VIN", "Parts", "Labor hrs", "Labor", "Total", "Claim #"]];
    done.forEach(j => rows.push([
      j.scheduledAt || "", j.customer || "",
      [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" "), j.vin || "",
      partsTotal(j).toFixed(2), laborHours(j).toFixed(2), laborTotal(j).toFixed(2),
      jobTotal(j).toFixed(2), j.claim.claimNumber || ""
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "roadwrench-jobs.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast("CSV downloaded");
  };
}

/* ================= SETTINGS ================= */
function viewSettings() {
  const c = S.company;
  $("#view").innerHTML = `
    <div class="sectionhead"><h2>Setup</h2></div>
    <div class="card"><h2>Your business</h2>
      <div class="muted" style="margin-bottom:10px">This appears on every warranty packet as the service center.</div>
      <div class="field"><label>Business name</label><input id="s_name" value="${esc(c.name)}"></div>
      <div class="f2">
        <div class="field"><label>Phone</label><input id="s_phone" value="${esc(c.phone)}"></div>
        <div class="field"><label>Email</label><input id="s_email" value="${esc(c.email)}"></div>
      </div>
      <div class="field"><label>Address</label><input id="s_addr" value="${esc(c.address)}" placeholder="Street, city, state, zip"></div>
      <div class="field"><label>Google review link <span class="muted" style="text-transform:none;letter-spacing:0">(optional)</span></label><input id="s_review" value="${esc(c.reviewLink || "")}" inputmode="url" placeholder="https://g.page/your-shop/review"></div>
      <div class="muted" style="margin-bottom:10px">Finished jobs get an "Ask for a review" button that shares this link with the customer.</div>
      <div class="f2">
        <div class="field"><label>Default labor rate ($/hr)</label><input id="s_rate" inputmode="decimal" value="${esc(c.laborRate)}"></div>
        <div class="field"><label>Tax rate (%)</label><input id="s_tax" inputmode="decimal" value="${esc(c.taxRate || 0)}" placeholder="0"></div>
      </div>
      <button class="btn block" id="saveCo">${I.check}Save</button>
    </div>
    <div class="card"><h2>Subscription</h2>
      <div id="billSettingsSlot"></div>
    </div>
    <div class="card"><h2>Quality</h2>
      <label class="checkrow"><input type="checkbox" id="s_reqPhotos"${S.settings.requirePhotos ? " checked" : ""}> Require before and after photos before a job can be marked complete</label>
      <div class="muted" style="margin-top:8px">For warranty-heavy shops. Leave it off for quick jobs like oil changes.</div>
    </div>
    <div class="card"><h2>Data</h2>
      <div class="muted" style="margin-bottom:10px">Your jobs live on this device first. Optional device sync is a prototype convenience, not a backup. Export a backup regularly.</div>
      <div class="row">
        <button class="btn secondary grow" id="exportBtn">Export backup</button>
        <button class="btn ghost danger grow" id="wipeBtn" style="color:var(--danger);border-color:#e5c4bd">Erase all</button>
      </div>
    </div>
    <div id="syncSettings"></div>
    <div class="card"><h2>About</h2>
      <div class="muted">RoadWrench v1: built for mobile RV techs. Job board, parts, labor timer, timestamped photos, and warranty claim packets that adjusters actually accept.</div>
      <div style="margin-top:10px; display:flex; gap:14px; flex-wrap:wrap">
        <a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:absolukie@gmail.com">Contact support</a>
      </div>
    </div>`;
  $("#saveCo").onclick = () => {
    c.name = $("#s_name").value.trim() || c.name;
    c.phone = $("#s_phone").value.trim(); c.email = $("#s_email").value.trim();
    c.address = $("#s_addr").value.trim();
    c.reviewLink = $("#s_review").value.trim();
    c.laborRate = parseFloat($("#s_rate").value) || c.laborRate;
    const tx = parseFloat($("#s_tax").value); c.taxRate = isNaN(tx) || tx < 0 ? 0 : tx;
    save(S); toast("Saved");
  };
  $("#s_reqPhotos").onchange = e => { S.settings.requirePhotos = e.target.checked; save(S); toast("Saved"); };
  $("#exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify({ state: S, events: readEvents() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "roadwrench-backup.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $("#wipeBtn").onclick = () => {
    if (confirm("Erase ALL RoadWrench data on this device?")) {
      localStorage.removeItem(KEY);
      localStorage.removeItem("roadwrench.device_key");
      localStorage.removeItem("roadwrench.syncmeta.v1");
      localStorage.removeItem("roadwrench.lastsync.v1");
      localStorage.removeItem("roadwrench.syncbase.v1");
      localStorage.removeItem("roadwrench.oversized.v1");
      localStorage.removeItem("roadwrench.sync_on.v1");
      localStorage.removeItem("roadwrench.invoicelock.v1");
      localStorage.removeItem("roadwrench.events.v1");
      localStorage.removeItem("roadwrench.billinglog.v1");
      S = blankState(); save(S); toast("Wiped clean"); route();
    }
  };
  try { if (window.__roadwrenchSyncUI) window.__roadwrenchSyncUI(); } catch (e) {}
  try { if (window.__attachBillSettings) window.__attachBillSettings(); } catch (e) {}
}

/* ---------- init ---------- */
/* Keep the shared billing trial banner (position:fixed;top:0) from covering the
   topbar: measure the banner and expose its height as --bill-banner-h, which the
   app-local :has() CSS rules use to offset the app column and sticky topbar. */
function billBannerOffset() {
  var b = document.querySelector(".bill-banner");
  document.documentElement.style.setProperty("--bill-banner-h", (b ? b.offsetHeight : 0) + "px");
}
try {
  new MutationObserver(billBannerOffset).observe(document.body, { childList: true });
  window.addEventListener("resize", billBannerOffset);
  billBannerOffset();
} catch (e) { /* observer unavailable: banner overlap is cosmetic only */ }
document.addEventListener("DOMContentLoaded", () => { route(); });
if (document.readyState !== "loading") route();
