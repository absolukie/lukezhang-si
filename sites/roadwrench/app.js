/* RoadWrench — mobile RV repair tech OS. Vanilla JS, localStorage. */
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
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  rv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10"/><path d="M18 9h2a2 2 0 0 1 2 2v6"/><path d="M3 17h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/><path d="M7 7v5h7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'
};
/* self-sizing icons: 1em of surrounding text; explicit CSS sizes still override */
Object.keys(I).forEach(k => { I[k] = I[k].replace('<svg ', '<svg width="1em" height="1em" '); });

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const money = n => "$" + (Number(n) || 0).toFixed(2);
const fmtDate = iso => { if (!iso) return "—"; const d = new Date(iso + (iso.length <= 10 ? "T12:00:00" : "")); return isNaN(d) ? "—" : d.toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}); };
const fmtDT = ts => new Date(ts).toLocaleString("en-US", {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
const todayISO = () => new Date().toISOString().slice(0, 10);

let toastTimer = null;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- store ---------- */
const KEY = "roadwrench.v1";
function blankState() {
  return {
    company: { name: "Pine Ridge Mobile RV Repair", phone: "(555) 014-2288", email: "", address: "", laborRate: 125 },
    jobs: [], reminders: []
  };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.jobs) return s; } catch (e) {}
  const s = blankState(); seed(s); save(s); return s;
}
function save(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
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
      claim: {insurer: "Wholesale Warranties", claimNumber: "", authNumber: "", authBy: "", authDate: ""},
      customerSig: "", techSig: "", filedAt: 0, completedAt: 0, createdAt: t - 3 * D },
    { id: uid(), sample: true, status: "onsite", customer: "Marcus Tran", phone: "(555) 338-9041",
      site: "Boondocking, BLM mile 12 off Hwy 89", scheduledAt: todayISO(),
      rvMake: "Airstream", rvModel: "Flying Cloud 25RB", rvYear: "2021", vin: "1STVBYU28MJ500923",
      complaint: "Slide-out stalls halfway on extension, grinding noise.", cause: "Worn slide gearbox; rail bolts loose.",
      correction: "",
      parts: [{id: uid(), name: "Slide-out gearbox assembly", partNumber: "LCI-191073", qty: 1, unitCost: 214, serial: "GBX-88412"}],
      labor: [], timerStart: 0, photos: [], notes: "",
      claim: {insurer: "Good Sam ESP", claimNumber: "", authNumber: "", authBy: "", authDate: ""},
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
      claim: {insurer: "Wholesale Warranties", claimNumber: "WW-88231", authNumber: "AUTH-55190", authBy: "R. Delgado", authDate: new Date(t - 2 * D).toISOString().slice(0, 10)},
      customerSig: "", techSig: "", filedAt: 0, completedAt: t - 2 * D, createdAt: t - 4 * D }
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
  window.scrollTo(0, 0);
  if (parts[0] === "jobs") viewJobs();
  else if (parts[0] === "job" && parts[1] === "new") viewJobForm();
  else if (parts[0] === "job" && parts[1]) viewJobDetail(parts[1]);
  else if (parts[0] === "packet" && parts[1]) viewPacket(parts[1]);
  else if (parts[0] === "customer" && parts[1]) viewCustomer(decodeURIComponent(parts[1]));
  else if (parts[0] === "reminders") viewReminders();
  else if (parts[0] === "dashboard") viewDashboard();
  else if (parts[0] === "settings") viewSettings();
  else viewJobs();
}
window.addEventListener("hashchange", route);

/* ================= JOBS BOARD ================= */
let jobFilter = "all";
function viewJobs() {
  const counts = { all: S.jobs.length };
  STATUSES.forEach(s => counts[s] = S.jobs.filter(j => j.status === s).length);
  const list = S.jobs.filter(j => jobFilter === "all" || j.status === jobFilter)
    .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
  const hasSample = S.jobs.some(j => j.sample);
  $("#view").innerHTML = `
    ${hasSample ? `<div class="samplebar">${I.doc}<span>Sample jobs shown so you can try the warranty packet. Real jobs you add are kept separate.</span><button class="btn small ghost" id="clearSamples">Clear</button></div>` : ""}
    <div class="sectionhead"><h2>Jobs</h2><button class="btn small" id="newJob">${I.plus}New job</button></div>
    <div class="chips">
      <button class="chip${jobFilter === "all" ? " active" : ""}" data-f="all">All (${counts.all})</button>
      ${STATUSES.map(s => `<button class="chip${jobFilter === s ? " active" : ""}" data-f="${s}">${STATUS_LABEL[s]} (${counts[s]})</button>`).join("")}
    </div>
    <div id="joblist">
      ${list.length ? list.map(jobCard).join("") : `<div class="card empty">${I.jobs}<div>No jobs here yet.<br>Tap New job to book the first one.</div></div>`}
    </div>`;
  document.querySelectorAll(".chip").forEach(c => c.onclick = () => { jobFilter = c.dataset.f; viewJobs(); });
  document.querySelectorAll("[data-job]").forEach(el => el.onclick = () => location.hash = "#/job/" + el.dataset.job);
  $("#newJob").onclick = () => location.hash = "#/job/new";
  const cs = $("#clearSamples");
  if (cs) cs.onclick = () => { S.jobs = S.jobs.filter(j => !j.sample); S.reminders = S.reminders.filter(r => !r.sample); save(S); toast("Sample data cleared"); viewJobs(); };
}
function jobCard(j) {
  const rv = [j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" ");
  return `<button class="jobcard" data-job="${j.id}">
    <div class="jc-top"><span class="jc-name">${esc(j.customer) || "Unnamed"}</span>
      <span class="pill ${j.status}">${STATUS_LABEL[j.status]}</span></div>
    ${j.sample ? `<span class="pill sample">Sample</span> ` : ""}<span class="jc-rv">${I.rv} ${esc(rv) || "RV details not set"}</span>
    <div class="jc-meta">
      <span>${I.pin}${esc(j.site) || "No site set"}</span>
      <span>${I.clock}${fmtDate(j.scheduledAt)}</span>
      ${j.status === "complete" ? `<span class="mono">${money(jobTotal(j))}</span>` : ""}
    </div>
  </button>`;
}

/* ================= JOB FORM ================= */
function viewJobForm() {
  $("#view").innerHTML = `
    <button class="backlink" id="back">${I.back}Jobs</button>
    <div class="sectionhead"><h2>New job</h2></div>
    <div class="card">
      <div class="field"><label>Customer name</label><input id="f_customer" placeholder="Full name" autocomplete="off"></div>
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
  $("#save").onclick = () => {
    const j = {
      id: uid(), status: "scheduled",
      customer: $("#f_customer").value.trim(), phone: $("#f_phone").value.trim(),
      site: $("#f_site").value.trim(), scheduledAt: $("#f_date").value || todayISO(),
      rvYear: $("#f_year").value.trim(), rvMake: $("#f_make").value.trim(),
      rvModel: $("#f_model").value.trim(), vin: $("#f_vin").value.trim().toUpperCase(),
      complaint: $("#f_complaint").value.trim(), cause: "", correction: "",
      parts: [], labor: [], timerStart: 0, photos: [], notes: "",
      claim: { insurer: "", claimNumber: "", authNumber: "", authBy: "", authDate: "" },
      customerSig: "", techSig: "", filedAt: 0, completedAt: 0, createdAt: Date.now()
    };
    S.jobs.push(j); save(S); toast("Job created"); location.hash = "#/job/" + j.id;
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
  $("#view").innerHTML = `
    <button class="backlink" id="back">${I.back}Jobs</button>
    <div class="sectionhead"><h2>${esc(j.customer) || "Unnamed job"}</h2><span class="pill ${j.status}">${STATUS_LABEL[j.status]}</span></div>
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
      <div class="f2">
        <div class="field"><label>Customer</label><input id="d_customer" value="${esc(j.customer)}"></div>
        <div class="field"><label>Phone</label><input id="d_phone" inputmode="tel" value="${esc(j.phone)}"></div>
      </div>
      <div class="field"><label>Site / location</label><input id="d_site" value="${esc(j.site)}"></div>
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
          <div class="s">${esc(p.partNumber)}${p.serial ? " · SN " + esc(p.serial) : ""} · ${p.qty} × ${money(p.unitCost)}</div></div>
          <div class="mono" style="font-weight:800">${money(p.qty * p.unitCost)}</div>
          <button class="iconbtn danger" data-delpart="${p.id}">${I.trash}</button></div>`).join("")
        : `<div class="muted">No parts logged yet.</div>`}</div>
      <div class="total"><span>Parts total</span><span class="mono">${money(partsTotal(j))}</span></div>
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
          <div class="s">${l.hours} hrs × ${money(l.rate)}/hr</div></div>
          <div class="mono" style="font-weight:800">${money(l.hours * l.rate)}</div>
          <button class="iconbtn danger" data-dellabor="${l.id}">${I.trash}</button></div>`).join("")
        : `<div class="muted">No labor logged yet.</div>`}</div>
      <div class="total"><span>Labor total (${laborHours(j).toFixed(2)} hrs)</span><span class="mono">${money(laborTotal(j))}</span></div>
      <h3>Add labor manually</h3>
      <div class="f3">
        <div class="field"><label>Hours</label><input id="l_hours" inputmode="decimal" placeholder="1.5"></div>
        <div class="field"><label>Rate $/hr</label><input id="l_rate" inputmode="decimal" value="${S.company.laborRate}"></div>
        <div class="field"><label>&nbsp;</label><button class="btn block" id="addLabor">${I.plus}Add</button></div>
      </div>
    </div>

    <div class="card"><h2>Photos</h2>
      <div class="tagbtns" id="tagBtns">
        ${["before", "after", "data tag", "part"].map((t, i) =>
          `<button class="tagbtn${i === 0 ? " sel" : ""}" data-tag="${t}">${t}</button>`).join("")}
      </div>
      <div class="field" style="margin-top:8px"><input id="ph_cap" placeholder="Caption (optional)"></div>
      <button class="btn secondary block" id="takePhoto">${I.camera}Take / upload photo</button>
      <input type="file" id="fileInput" class="hiddenfile" accept="image/*" capture="environment">
      <div class="photogrid" id="photoGrid">${j.photos.map(photoHtml).join("")}</div>
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
      <button class="btn rust block" id="buildPacket" style="margin:10px 0">${I.doc}Build warranty packet</button>
      ${j.status !== "complete"
        ? `<button class="btn secondary block" id="markComplete">${I.check}Mark job complete</button>`
        : `<button class="btn ghost block" id="reopen">${I.back}Reopen job</button>`}
      <button class="btn ghost block danger" id="delJob" style="margin-top:8px; color:var(--danger); border-color:#e5c4bd">${I.trash}Delete job</button>
    </div>`;

  $("#back").onclick = () => location.hash = "#/jobs";
  $("#histBtn").onclick = () => location.hash = "#/customer/" + encodeURIComponent(j.customer || "unnamed");
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
  bind("d_site", v => j.site = v); bind("d_year", v => j.rvYear = v);
  bind("d_make", v => j.rvMake = v); bind("d_model", v => j.rvModel = v);
  bind("d_vin", v => j.vin = v.toUpperCase()); bind("d_date", v => j.scheduledAt = v);
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
      serial: $("#p_serial").value.trim() });
    save(S); toast("Part added"); viewJobDetail(j.id);
  };
  document.querySelectorAll("[data-delpart]").forEach(b => b.onclick = () => {
    j.parts = j.parts.filter(p => p.id !== b.dataset.delpart); save(S); viewJobDetail(j.id);
  });

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
      j.photos.push({ id: uid(), dataUrl, thumb, ts: Date.now(), caption: $("#ph_cap").value.trim(), tag: photoTag });
      $("#ph_cap").value = ""; save(S); toast("Photo added"); viewJobDetail(j.id);
    });
  };
  document.querySelectorAll("[data-delphoto]").forEach(b => b.onclick = () => {
    j.photos = j.photos.filter(p => p.id !== b.dataset.delphoto); save(S); viewJobDetail(j.id);
  });

  /* finish */
  $("#buildPacket").onclick = () => { save(S); location.hash = "#/packet/" + j.id; };
  const mc = $("#markComplete");
  if (mc) mc.onclick = () => { setStatus(j, "complete"); };
  const ro = $("#reopen");
  if (ro) ro.onclick = () => { j.status = "onsite"; j.completedAt = 0; save(S); viewJobDetail(j.id); };
  $("#delJob").onclick = () => {
    if (confirm("Delete this job and everything on it?")) {
      S.jobs = S.jobs.filter(x => x.id !== j.id); save(S); location.hash = "#/jobs";
    }
  };
}
function setStatus(j, s) {
  j.status = s;
  if (s === "complete" && !j.completedAt) j.completedAt = Date.now();
  if (s !== "complete") j.completedAt = 0;
  save(S); toast("Status: " + STATUS_LABEL[s]); viewJobDetail(j.id);
}
function photoHtml(p) {
  return `<div class="photo"><img src="${p.dataUrl}" alt="${esc(p.caption || p.tag)}" loading="lazy">
    <button class="del" data-delphoto="${p.id}" aria-label="Delete photo">×</button>
    <div class="cap">${esc(p.tag)} · ${fmtDT(p.ts)}${p.caption ? " · " + esc(p.caption) : ""}</div></div>`;
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
      j.timerStart = 0;
      if (hrs > 0) {
        j.labor.push({ id: uid(), desc: $("#t_desc").value.trim() || "On-site labor", hours: hrs, rate: S.company.laborRate });
        toast("Logged " + hrs.toFixed(2) + " hrs");
      }
      save(S); viewJobDetail(j.id);
    } else { j.timerStart = Date.now(); save(S); renderTimer(j); tickTimer(j); }
  };
  if (running) tickTimer(j);
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
    cb(full, tc.toDataURL("image/jpeg", 0.6));
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

  $("#view").innerHTML = `
    <button class="backlink noprint" id="back">${I.back}Back to job</button>
    <div class="sectionhead noprint"><h2>Warranty packet</h2>
      <span class="pill ${j.filedAt ? "complete" : "scheduled"}">${j.filedAt ? "Claim filed" : "Draft"}</span></div>

    <div class="packet" id="packetDoc">
      <div class="p-head">
        <h2>${esc(c.name)}</h2>
        <div class="muted">${esc(c.phone)}${c.email ? " · " + esc(c.email) : ""}${c.address ? "<br>" + esc(c.address) : ""}</div>
        <div style="margin-top:8px;font-size:13px"><strong>WARRANTY / INSURANCE CLAIM PACKET</strong> · Generated ${fmtDT(Date.now())}</div>
      </div>

      <div class="p-sec"><h4>Claim information</h4>
        <dl class="kv">
          <dt>Insurer</dt><dd>${esc(j.claim.insurer) || "—"}</dd>
          <dt>Claim #</dt><dd>${esc(j.claim.claimNumber) || "—"}</dd>
          <dt>Auth #</dt><dd>${esc(j.claim.authNumber) || "—"}</dd>
          <dt>Authorized by</dt><dd>${esc(j.claim.authBy) || "—"}${j.claim.authDate ? " on " + fmtDate(j.claim.authDate) : ""}</dd>
          <dt>Reimburse to</dt><dd>${esc(c.name)}${c.address ? ", " + esc(c.address) : ""}${c.phone ? " · " + esc(c.phone) : ""}</dd>
        </dl>
      </div>

      <div class="p-sec"><h4>Customer &amp; unit</h4>
        <dl class="kv">
          <dt>Customer</dt><dd>${esc(j.customer)}${j.phone ? ' · <span style="white-space:nowrap">' + esc(j.phone) + "</span>" : ""}</dd>
          <dt>Service site</dt><dd>${esc(j.site) || "—"}</dd>
          <dt>Unit</dt><dd>${esc(rv) || "—"}</dd>
          <dt>VIN</dt><dd class="mono">${esc(j.vin) || "—"}</dd>
          <dt>Service date</dt><dd>${fmtDate(j.scheduledAt)}${j.completedAt ? " · completed " + fmtDate(new Date(j.completedAt).toISOString().slice(0, 10)) : ""}</dd>
        </dl>
      </div>

      <div class="p-sec"><h4>Complaint / cause / correction</h4>
        <dl class="kv">
          <dt>Complaint</dt><dd>${esc(j.complaint) || "—"}</dd>
          <dt>Cause</dt><dd>${esc(j.cause) || "—"}</dd>
          <dt>Correction</dt><dd>${esc(j.correction) || "—"}</dd>
        </dl>
        ${j.notes ? `<div class="muted" style="margin-top:6px">Notes: ${esc(j.notes)}</div>` : ""}
      </div>

      <div class="p-sec"><h4>Parts</h4>
        ${j.parts.length ? `<table><tr><th>Part</th><th>Part #</th><th>Serial #</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Total</th></tr>
        ${j.parts.map(p => `<tr><td>${esc(p.name)}</td><td class="mono">${esc(p.partNumber) || "—"}</td><td class="mono">${esc(p.serial) || "—"}</td><td class="r">${p.qty}</td><td class="r">${money(p.unitCost)}</td><td class="r">${money(p.qty * p.unitCost)}</td></tr>`).join("")}
        <tr><td colspan="5" class="r"><strong>Parts subtotal</strong></td><td class="r"><strong>${money(pt)}</strong></td></tr></table>`
        : `<div class="muted">No parts recorded.</div>`}
      </div>

      <div class="p-sec"><h4>Labor</h4>
        ${j.labor.length ? `<table><tr><th>Description</th><th class="r">Hours</th><th class="r">Rate</th><th class="r">Total</th></tr>
        ${j.labor.map(l => `<tr><td>${esc(l.desc)}</td><td class="r">${l.hours}</td><td class="r">${money(l.rate)}</td><td class="r">${money(l.hours * l.rate)}</td></tr>`).join("")}
        <tr><td colspan="3" class="r"><strong>Labor subtotal (${laborHours(j).toFixed(2)} hrs)</strong></td><td class="r"><strong>${money(lt)}</strong></td></tr></table>`
        : `<div class="muted">No labor recorded.</div>`}
      </div>

      <div class="p-sec"><h4>Claim total</h4>
        <table><tr><td><strong>Total amount claimed</strong></td><td class="r" style="font-size:20px"><strong>${money(total)}</strong></td></tr></table>
      </div>

      ${before.length || after.length ? `<div class="p-sec"><h4>Condition photos (timestamped)</h4>
        <div class="p-photos">
        ${before.concat(after).map(p => `<figure><img src="${p.dataUrl}" alt="${esc(p.caption || p.tag)}"><figcaption>${esc(p.tag)} · ${fmtDT(p.ts)}${p.caption ? " · " + esc(p.caption) : ""}</figcaption></figure>`).join("")}
        </div></div>` : ""}

      ${tags.length ? `<div class="p-sec"><h4>Data tags &amp; part photos</h4>
        <div class="p-photos">
        ${tags.map(p => `<figure><img src="${p.dataUrl}" alt="${esc(p.caption || p.tag)}"><figcaption>${esc(p.tag)} · ${fmtDT(p.ts)}${p.caption ? " · " + esc(p.caption) : ""}</figcaption></figure>`).join("")}
        </div></div>` : ""}

      <div class="p-sec"><h4>Signatures</h4>
        <div class="f2">
          <div><div class="muted" style="font-size:12px;margin-bottom:4px">CUSTOMER</div>
            ${j.customerSig ? `<img class="sigimg" src="${j.customerSig}" alt="Customer signature">` : `<div class="muted">Not signed</div>`}
            <div style="font-size:13px;margin-top:4px">${esc(j.customer)}</div></div>
          <div><div class="muted" style="font-size:12px;margin-bottom:4px">TECHNICIAN</div>
            ${j.techSig ? `<img class="sigimg" src="${j.techSig}" alt="Tech signature">` : `<div class="muted">Not signed</div>`}
            <div style="font-size:13px;margin-top:4px">${esc(c.name)}</div></div>
        </div>
      </div>
    </div>

    <div class="card noprint" style="margin-top:12px"><h2>Sign the packet</h2>
      <div class="field"><label>Customer signature — sign below</label>
        <div class="sigwrap"><canvas class="sigpad" id="sigCustomer" width="600" height="150"></canvas>
        <button class="btn small ghost clear" id="clearCSig">Clear</button></div></div>
      <div class="field"><label>Technician signature</label>
        <div class="sigwrap"><canvas class="sigpad" id="sigTech" width="600" height="150"></canvas>
        <button class="btn small ghost clear" id="clearTSig">Clear</button></div></div>
      <button class="btn secondary block" id="saveSigs">${I.pen}Save signatures to packet</button>
    </div>

    <div class="noprint" style="display:grid;gap:10px;margin-top:4px">
      <button class="btn rust block" id="printBtn">${I.printer}Print / save as PDF</button>
      <button class="btn secondary block" id="shareBtn">${I.doc}Share packet summary</button>
      ${j.filedAt
        ? `<div class="card" style="text-align:center"><strong>Claim filed</strong><div class="muted">${fmtDT(j.filedAt)}</div></div>`
        : `<button class="btn block" id="filedBtn">${I.check}Mark claim filed</button>`}
      <button class="btn ghost block" id="backJob">Back to job</button>
    </div>`;

  $("#back").onclick = () => location.hash = "#/job/" + j.id;
  $("#backJob").onclick = () => location.hash = "#/job/" + j.id;
  initSigPad($("#sigCustomer"), j.customerSig);
  initSigPad($("#sigTech"), j.techSig);
  $("#clearCSig").onclick = () => clearSig($("#sigCustomer"));
  $("#clearTSig").onclick = () => clearSig($("#sigTech"));
  $("#saveSigs").onclick = () => {
    const cs = sigData($("#sigCustomer")), ts = sigData($("#sigTech"));
    if (cs) j.customerSig = cs;
    if (ts) j.techSig = ts;
    save(S); toast("Signatures saved"); viewPacket(j.id);
  };
  $("#printBtn").onclick = () => window.print();
  $("#shareBtn").onclick = () => {
    const lines = [
      c.name + (c.phone ? " · " + c.phone : ""),
      "WARRANTY CLAIM PACKET",
      "Customer: " + (j.customer || "—"),
      "Unit: " + (rv || "—") + (j.vin ? " · VIN " + j.vin : ""),
      "Complaint: " + (j.complaint || "—"),
      "Cause: " + (j.cause || "—"),
      "Correction: " + (j.correction || "—"),
      "Parts: " + money(pt) + " · Labor: " + money(lt) + " (" + laborHours(j).toFixed(2) + " hrs)",
      "TOTAL CLAIMED: " + money(total),
      j.claim.claimNumber ? "Claim #: " + j.claim.claimNumber : null,
      j.claim.authNumber ? "Auth #: " + j.claim.authNumber + (j.claim.authBy ? " (" + j.claim.authBy + ")" : "") : null,
      "Photos: " + j.photos.length + " timestamped"
    ].filter(Boolean).join("\n");
    if (navigator.share) {
      navigator.share({ title: "Warranty packet — " + (j.customer || "job"), text: lines }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(lines).then(() => toast("Packet summary copied"), () => toast("Copy failed"));
    } else { toast("Sharing not supported here"); }
  };
  const fb = $("#filedBtn");
  if (fb) fb.onclick = () => {
    if (j.status !== "complete") setStatusSilent(j, "complete");
    j.filedAt = Date.now(); save(S); toast("Claim marked filed"); viewPacket(j.id);
  };
}
function setStatusSilent(j, s) { j.status = s; if (s === "complete" && !j.completedAt) j.completedAt = Date.now(); }

function initSigPad(canvas, existing) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3d2b";
  if (existing) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height); img.src = existing; }
  let drawing = false, last = null;
  const pos = e => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * canvas.width / r.width, y: (p.clientY - r.top) * canvas.height / r.height }; };
  const start = e => { drawing = true; last = pos(e); e.preventDefault(); };
  const move = e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; e.preventDefault(); };
  const end = () => drawing = false;
  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.dataset.used = existing ? "1" : "";
  canvas.addEventListener("pointerdown", () => { canvas.dataset.used = "1"; });
}
function clearSig(canvas) { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); canvas.dataset.used = ""; }
function sigData(canvas) { return canvas.dataset.used ? canvas.toDataURL("image/png") : ""; }

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
      <button class="jobcard" data-job="${j.id}">
        <div class="jc-top"><span class="jc-name">${fmtDate(j.scheduledAt)}</span>
          <span class="pill ${j.status}">${STATUS_LABEL[j.status]}</span></div>
        <div class="jc-rv">${esc([j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" "))}</div>
        <div class="jc-meta"><span>${esc(j.complaint || "No complaint recorded").slice(0, 60)}</span>
        <span class="mono">${money(jobTotal(j))}</span></div>
      </button>`).join("")
      : `<div class="card empty">${I.user}<div>No jobs for this customer yet.</div></div>`}`;
  $("#back").onclick = () => history.back();
  document.querySelectorAll("[data-job]").forEach(el => el.onclick = () => location.hash = "#/job/" + el.dataset.job);
}

/* ================= REMINDERS ================= */
function viewReminders() {
  const sorted = [...S.reminders].sort((a, b) => nextDue(a) - nextDue(b));
  const now = new Date(); now.setHours(0, 0, 0, 0);
  $("#view").innerHTML = `
    <div class="sectionhead"><h2>Reminders</h2></div>
    <div class="card"><h2>Recurring maintenance</h2>
      ${sorted.length ? sorted.map(r => {
        const due = nextDue(r); const days = Math.round((due - now) / 864e5);
        const cls = days < 0 ? "over" : days <= 30 ? "soon" : "ok";
        const lbl = days < 0 ? Math.abs(days) + "d overdue" : days === 0 ? "due today" : "in " + days + "d";
        return `<div class="rem">
          <div class="duebadge ${cls}">${lbl}</div>
          <div class="grow"><div style="font-weight:800">${esc(r.service)}</div>
            <div class="muted">${esc(r.customer)} · ${esc(r.rvLabel)}<br>Every ${r.intervalMonths} mo · last done ${fmtDate(r.lastDone)}</div></div>
          <button class="iconbtn" data-done="${r.id}" title="Mark done">${I.check}</button>
          <a class="iconbtn" title="Text customer" href="sms:?&body=${encodeURIComponent(`Hi ${r.customer}, this is ${S.company.name}: your ${r.service} for your ${r.rvLabel || "RV"} is due. Reply to schedule a visit!`)}">${I.phone}</a>
          <button class="iconbtn danger" data-delrem="${r.id}">${I.trash}</button>
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
    if (r) { r.lastDone = todayISO(); save(S); toast("Marked done — next due reset"); viewReminders(); }
  });
  document.querySelectorAll("[data-delrem]").forEach(b => b.onclick = () => {
    S.reminders = S.reminders.filter(x => x.id !== b.dataset.delrem); save(S); viewReminders();
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
    <div class="card"><h2>Revenue — last 6 months</h2>
      <div class="bars">${months.map(m => `<div class="bar" style="height:${Math.max(4, (m.rev / max) * 100)}%" title="${m.label}: ${money(m.rev)}"><span>${m.label}</span></div>`).join("")}</div>
      <div style="height:22px"></div>
    </div>
    <div class="card"><h2>Active jobs (${active.length})</h2>
      ${active.length ? active.slice(0, 5).map(j => `
        <div class="item" data-gojob="${j.id}" style="cursor:pointer"><div class="grow">
          <div class="t">${esc(j.customer)}</div><div class="s">${esc([j.rvYear, j.rvMake, j.rvModel].filter(Boolean).join(" "))}</div></div>
          <span class="pill ${j.status}">${STATUS_LABEL[j.status]}</span></div>`).join("")
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
      <div class="field"><label>Default labor rate ($/hr)</label><input id="s_rate" inputmode="decimal" value="${c.laborRate}"></div>
      <button class="btn block" id="saveCo">${I.check}Save</button>
    </div>
    <div class="card"><h2>Data</h2>
      <div class="muted" style="margin-bottom:10px">Everything lives in this browser (localStorage). No account, works offline in a campground.</div>
      <div class="row">
        <button class="btn secondary grow" id="exportBtn">Export backup</button>
        <button class="btn ghost danger grow" id="wipeBtn" style="color:var(--danger);border-color:#e5c4bd">Erase all</button>
      </div>
    </div>
    <div id="syncSettings"></div>
    <div class="card"><h2>About</h2>
      <div class="muted">RoadWrench v1 — built for mobile RV techs. Job board, parts, labor timer, timestamped photos, and warranty claim packets that adjusters actually accept.</div>
    </div>`;
  $("#saveCo").onclick = () => {
    c.name = $("#s_name").value.trim() || c.name;
    c.phone = $("#s_phone").value.trim(); c.email = $("#s_email").value.trim();
    c.address = $("#s_addr").value.trim();
    c.laborRate = parseFloat($("#s_rate").value) || c.laborRate;
    save(S); toast("Saved");
  };
  $("#exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
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
      S = blankState(); save(S); toast("Wiped clean"); route();
    }
  };
  try { if (window.__roadwrenchSyncUI) window.__roadwrenchSyncUI(); } catch (e) {}
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", () => { route(); });
if (document.readyState !== "loading") route();
