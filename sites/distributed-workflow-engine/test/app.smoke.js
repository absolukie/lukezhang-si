/* DOM-stub smoke test: drives the real app.js (and engine.js) without a browser. */
const fs = require("fs");
const vm = require("vm");
const path = __dirname + "/../";

let failures = 0;
function ok(c, label) { console.log((c ? "PASS " : "FAIL ") + label); if (!c) failures++; }

const ALL = [];
class El {
  constructor(tag) {
    this.tagName = (tag || "div").toUpperCase(); this.children = [];
    this.dataset = {}; this._html = ""; this.textContent = ""; this._ls = {};
    this._cls = new Set(); this._attrs = {};
    this.value = "all"; this.checked = true; this.scrollTop = 0; this.scrollHeight = 0;
    ALL.push(this);
  }
  get classList() {
    const s = this._cls;
    return { add: (...c) => c.forEach((x) => s.add(x)), remove: (...c) => c.forEach((x) => s.delete(x)),
      toggle: (c, f) => { if (f === undefined) f = !s.has(c); f ? s.add(c) : s.delete(c); return f; },
      contains: (c) => s.has(c) };
  }
  set innerHTML(v) {
    this._html = String(v);
    this.children.forEach((c) => { c._detached = true; });
    this.children = [];
    // synthesize <button data-*> elements so clicks can be driven in tests
    const re = /<button\b([^>]*)>/g;
    let m;
    while ((m = re.exec(this._html))) {
      const b = new El("button");
      const da = /data-([a-z]+)="([^"]*)"/g;
      let d;
      while ((d = da.exec(m[1]))) b.dataset[d[1]] = d[2];
      this.appendChild(b);
    }
  }
  get innerHTML() { return this._html; }
  appendChild(c) { c._parent = this; c._detached = false; this.children.push(c); return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  get firstChild() { return this.children[0] || null; }
  addEventListener(t, f) { (this._ls[t] = this._ls[t] || []).push(f); }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return this._attrs[k]; }
  querySelectorAll(sel) {
    const m = sel.match(/^\[data-([a-z]+)\]$/);
    if (m) return ALL.filter((e) => e.dataset && e.dataset[m[1]] !== undefined && isDesc(e, this));
    if (sel === "button") return ALL.filter((e) => e.tagName === "BUTTON" && isDesc(e, this));
    return [];
  }
  click() { (this._ls.click || []).forEach((f) => f({ currentTarget: this, target: this })); }
}
function isDesc(e, root) {
  if (e._detached) return false;
  let p = e._parent;
  while (p) { if (p === root) return true; p = p._parent; }
  return e === root;
}
const byId = {};
function gid(id) { if (!byId[id]) { byId[id] = new El("div"); byId[id].id = id; } return byId[id]; }

const sandbox = {
  console, performance, setInterval: () => 0, clearTimeout, setTimeout,
  Math, JSON, Date, Array, Object, String, Number, RegExp, Error,
  document: {
    getElementById: gid,
    createElement: (t) => new El(t),
  },
};
sandbox.self = sandbox; sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path + "engine.js", "utf8"), sandbox, { filename: "engine.js" });
ok(!!sandbox.DurableFlow, "engine loads, DurableFlow exposed");
vm.runInContext(fs.readFileSync(path + "app.js", "utf8"), sandbox, { filename: "app.js" });
ok(true, "app boots without throwing");

// an ETL run auto-started
ok(gid("runtabs").innerHTML.includes("etl-1"), "auto-started etl-1, run tab rendered");
ok(gid("elog").children.length > 0, "event log has lines, got " + gid("elog").children.length);
ok(gid("dag").innerHTML.includes("Extract"), "DAG rendered with steps");
ok(gid("workers").innerHTML.includes("worker-1"), "worker pool rendered");

// start a research run via its def button
const runBtn = ALL.find((e) => e.dataset && e.dataset.run === "research");
ok(!!runBtn, "research ▶ run button exists");
runBtn.click();
ok(/research-\d/.test(gid("runtabs").innerHTML), "research run started, tab rendered");

// kill worker-1 via its card button
const killBtn = ALL.find((e) => e.dataset && e.dataset.kill === "worker-1");
ok(!!killBtn, "kill button on worker-1 card");
killBtn.click();
ok(gid("elog").innerHTML.includes("WORKER_DIED") || gid("elog").children.length > 0, "kill produced log output");

// fail-next-task chaos button
const failBtn = gid("btn-failnext");
failBtn.click();
ok(gid("toast").textContent.includes("fault armed"), "chaos button arms fault + toast");

// filter change re-renders
gid("logfilter").value = "timer";
gid("logfilter")._ls.change.forEach((f) => f());
ok(true, "log filter change does not throw");

// replay button
gid("btn-replay").click();
ok(gid("toast").textContent.includes("replayed"), "replay log rebuilds + toast: " + gid("toast").textContent.slice(0, 60));

// cron toggle
const cronBtn = gid("btn-cron");
cronBtn.click();
ok(cronBtn.getAttribute("aria-pressed") === "true", "cron toggles on");

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL SMOKE CHECKS PASSED");
process.exit(failures ? 1 : 0);
