/* Deep Reader — static Bible reader with ask-as-you-read AI (BYOK Gemini). */
"use strict";

/* One-line model constant. Change here if Google retires/renames the flash model. */
const MODEL = "gemini-3.8-flash";
const AI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

/* ESV via Crossway's api.esv.org (BYOK). Terms: non-commercial use, fetched on
   demand only — ESV text lives in memory (esvCache) and is NEVER persisted to
   localStorage or the repo. Attribution must accompany displayed ESV text. */
const ESV_API = "https://api.esv.org/v3/passage/text/";
const ESV_KEY_URL = "https://api.esv.org/account/create-application/";
const ESV_ATTRIB = "Scripture quotations are from the ESV\u00ae Bible (The Holy Bible, English Standard Version\u00ae), \u00a9 2001 by Crossway, a publishing ministry of Good News Publishers. ESV Text Edition: 2025. Used by permission. All rights reserved.";

const translationName = (t) => t === "ESV" ? "English Standard Version" : "King James Version";

function systemPromptFor(translation) {
  return `You are a thoughtful Bible study companion inside the Deep Reader app. The user has highlighted a passage from the ${translationName(translation)}, shown below between triple quotes.

Rules:
1. Ground every answer in the highlighted passage. Quote from it directly when you make a point.
2. You may add brief historical or literary context, but clearly separate it from what the passage itself says.
3. If the user's question goes beyond what the passage supports, say so honestly in one sentence, then answer from what the passage does say.
4. Keep answers concise and warm: a few short paragraphs at most. Plain language, no academic jargon.
5. Never invent verse text. Only quote what is provided.
6. Format with short paragraphs. You may use **bold** sparingly for emphasis.`;
}

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let BIBLE = null;          // {b:[{n, c:[[verses]]}]}
let cur = { b: 42, c: 2 }; // default: John 3
let askPassage = null;     // {ref, text, translation}
let streaming = false;

const store = {
  get k() { try { return localStorage.getItem("dr_key") || ""; } catch (e) { return ""; } },
  set k(v) { try { localStorage.setItem("dr_key", v); } catch (e) {} },
  get esv() { try { return localStorage.getItem("dr_esv_key") || ""; } catch (e) { return ""; } },
  set esv(v) { try { localStorage.setItem("dr_esv_key", v); } catch (e) {} },
  get model() { try { return localStorage.getItem("dr_model") || MODEL; } catch (e) { return MODEL; } },
  set model(v) { try { localStorage.setItem("dr_model", v); } catch (e) {} },
  get pos() { try { return JSON.parse(localStorage.getItem("dr_pos") || "null"); } catch (e) { return null; } },
  set pos(v) { try { localStorage.setItem("dr_pos", JSON.stringify(v)); } catch (e) {} },
};

/* ---------- views ---------- */
const views = ["view-library", "view-chapters", "view-reader", "view-search"];
function show(id) {
  views.forEach((v) => $(v).hidden = v !== id);
  $("search-bar").hidden = id !== "view-search";
  hideFab();
  window.scrollTo(0, 0);
}

/* ---------- library ---------- */
function renderLibrary() {
  const ot = $("ot-grid"), nt = $("nt-grid");
  ot.innerHTML = ""; nt.innerHTML = "";
  BIBLE.b.forEach((book, i) => {
    const btn = document.createElement("button");
    btn.className = "book-btn";
    btn.textContent = book.n;
    btn.onclick = () => openChapters(i);
    (i < 39 ? ot : nt).appendChild(btn);
  });
  // continue-reading card
  const pos = store.pos;
  const old = document.querySelector(".continue-card");
  if (old) old.remove();
  if (pos && BIBLE.b[pos.b] && BIBLE.b[pos.b].c[pos.c]) {
    const card = document.createElement("button");
    card.className = "book-btn continue-card";
    card.style.gridColumn = "1 / -1";
    card.style.borderColor = "var(--accent)";
    card.textContent = "Continue: " + ref(pos.b, pos.c);
    card.onclick = () => openReader(pos.b, pos.c);
    $("view-library").insertBefore(card, $("view-library").querySelector(".testament-head"));
  }
}

const ref = (b, c) => BIBLE.b[b].n + " " + (c + 1);

/* ---------- chapters ---------- */
function openChapters(b) {
  cur.b = b;
  $("chapters-title").textContent = BIBLE.b[b].n;
  const g = $("chapters-grid");
  g.innerHTML = "";
  BIBLE.b[b].c.forEach((_, c) => {
    const btn = document.createElement("button");
    btn.className = "chapter-btn";
    btn.textContent = c + 1;
    btn.onclick = () => openReader(b, c);
    g.appendChild(btn);
  });
  show("view-chapters");
}

/* ---------- ESV (Crossway api.esv.org, BYOK) ---------- */
// In-memory only. Per Crossway's terms, ESV passage text is fetched on demand
// and NEVER written to localStorage, the repo, or any persistent store.
const esvCache = new Map(); // "b:c" -> parsed blocks

function parseESV(text) {
  // Parses the plain-text passage (include-verse-numbers=true) into blocks:
  // {type:'heading', text} | {type:'verse', n, text}
  const blocks = [];
  let curVerse = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^\[(\d+)\]\s*(.*)$/);
    if (m) {
      curVerse = { type: "verse", n: parseInt(m[1], 10), text: m[2] };
      blocks.push(curVerse);
    } else if (curVerse) {
      curVerse.text += " " + line; // wrapped / poetry continuation lines
    } else {
      blocks.push({ type: "heading", text: line });
    }
  }
  return blocks;
}

async function fetchESV(b, c) {
  const cacheKey = b + ":" + c;
  if (esvCache.has(cacheKey)) return esvCache.get(cacheKey);
  const key = store.esv;
  if (!key) { const e = new Error("no-key"); e.code = "no-key"; throw e; }
  const params = new URLSearchParams({
    q: BIBLE.b[b].n + " " + (c + 1),
    "include-passage-references": "false",
    "include-verse-numbers": "true",
    "include-footnotes": "false",
    "include-headings": "true",
    "include-short-copyright": "false",
  });
  const resp = await fetch(ESV_API + "?" + params.toString(), {
    headers: { Authorization: "Token " + key },
  });
  if (!resp.ok) { const e = new Error("esv-http-" + resp.status); e.status = resp.status; throw e; }
  const j = await resp.json();
  const text = (j.passages || []).join("\n").trim();
  const blocks = parseESV(text);
  if (!blocks.some((x) => x.type === "verse")) { const e = new Error("esv-empty"); e.code = "empty"; throw e; }
  esvCache.set(cacheKey, blocks);
  return blocks;
}

/* ---------- reader ---------- */
let curTranslation = "KJV"; // "ESV" | "KJV" — which text is on screen

async function openReader(b, c) {
  cur = { b, c };
  store.pos = cur;
  const book = BIBLE.b[b];
  const title = book.n + " " + (c + 1);
  $("reader-title").textContent = title;
  const t = $("reader-text");
  const notice = $("reader-notice"), attrib = $("reader-attrib");
  notice.hidden = true; attrib.hidden = true;
  const isFirst = b === 0 && c === 0;
  const isLast = b === BIBLE.b.length - 1 && c === book.c.length - 1;
  $("prev-ch").disabled = isFirst;
  $("next-ch").disabled = isLast;
  show("view-reader");

  if (store.esv) {
    $("reader-sub").textContent = "English Standard Version \u00b7 loading\u2026";
    t.innerHTML = '<p class="loading">Loading ESV\u2026</p>';
    try {
      const blocks = await fetchESV(b, c);
      if (cur.b !== b || cur.c !== c) return; // user navigated away mid-fetch
      renderESV(blocks);
      return;
    } catch (err) {
      if (cur.b !== b || cur.c !== c) return;
      notice.hidden = false;
      if (err && err.status === 403) notice.textContent = "ESV API key was rejected \u2014 check it in Settings. Showing KJV.";
      else if (err && err.code === "no-key") notice.textContent = "Add an ESV API key in Settings for ESV. Showing KJV.";
      else notice.textContent = "ESV is unavailable right now \u2014 showing KJV.";
    }
  }
  renderKJV(b, c);
}

function renderKJV(b, c) {
  curTranslation = "KJV";
  const book = BIBLE.b[b];
  $("reader-sub").textContent = "King James Version \u00b7 " + book.c[c].length + " verses";
  const t = $("reader-text");
  t.innerHTML = "";
  book.c[c].forEach((verse, v) => {
    const p = document.createElement("p");
    p.className = "verse";
    p.dataset.v = v + 1;
    const num = document.createElement("span");
    num.className = "verse-num";
    num.textContent = v + 1;
    p.appendChild(num);
    p.appendChild(document.createTextNode(verse));
    t.appendChild(p);
  });
}

function renderESV(blocks) {
  curTranslation = "ESV";
  const n = blocks.filter((x) => x.type === "verse").length;
  $("reader-sub").textContent = "English Standard Version \u00b7 " + n + " verses";
  const t = $("reader-text");
  t.innerHTML = "";
  blocks.forEach((blk) => {
    if (blk.type === "heading") {
      const h = document.createElement("h3");
      h.className = "esv-heading";
      h.textContent = blk.text;
      t.appendChild(h);
    } else {
      const p = document.createElement("p");
      p.className = "verse";
      p.dataset.v = blk.n;
      const num = document.createElement("span");
      num.className = "verse-num";
      num.textContent = blk.n;
      p.appendChild(num);
      p.appendChild(document.createTextNode(blk.text));
      t.appendChild(p);
    }
  });
  const attrib = $("reader-attrib");
  attrib.textContent = ESV_ATTRIB;
  attrib.hidden = false;
}

function stepChapter(dir) {
  let { b, c } = cur;
  c += dir;
  if (c < 0) { b -= 1; c = BIBLE.b[b].c.length - 1; }
  if (c >= BIBLE.b[b].c.length) { b += 1; c = 0; }
  openReader(b, c);
}

/* ---------- selection → Ask FAB ---------- */
const fab = $("ask-fab");
function hideFab() { fab.hidden = true; }

function verseOf(node) {
  let el = node.nodeType === 1 ? node : node.parentElement;
  while (el && !el.classList?.contains("verse")) el = el.parentElement;
  return el ? parseInt(el.dataset.v, 10) : null;
}

function checkSelection() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.toString().trim().length < 3) { hideFab(); return; }
  const reader = $("reader-text");
  if (!reader.contains(sel.anchorNode) || !reader.contains(sel.focusNode)) { hideFab(); return; }
  const text = sel.toString().trim().replace(/\s+/g, " ");
  const v1 = verseOf(sel.anchorNode), v2 = verseOf(sel.focusNode);
  let vref = "";
  if (v1 && v2) vref = ":" + (v1 <= v2 ? (v1 === v2 ? v1 : v1 + "–" + v2) : v2 + "–" + v1);
  else if (v1 || v2) vref = ":" + (v1 || v2);
  askPassage = { ref: ref(cur.b, cur.c) + vref, text, translation: curTranslation };
  try {
    const r = sel.getRangeAt(0).getBoundingClientRect();
    fab.style.left = (r.left + r.width / 2) + "px";
    fab.style.top = Math.max(r.top, 70) + "px";
  } catch (e) { fab.style.left = "50%"; fab.style.top = "40%"; }
  fab.hidden = false;
}

let selTimer = null;
document.addEventListener("selectionchange", () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    if (!$("view-reader").hidden) checkSelection(); else hideFab();
  }, 250);
});
document.addEventListener("scroll", hideFab, { passive: true });

/* ---------- ask sheet ---------- */
function openAsk() {
  if (!askPassage) return;
  if (!store.k) { openSettings(); toast("Add your Gemini API key first"); return; }
  $("ask-passage-text").textContent = askPassage.ref + " — “" + askPassage.text + "”";
  $("ask-answer").hidden = true;
  $("ask-answer").innerHTML = "";
  $("ask-input").value = "";
  $("sheet-scrim").hidden = false;
  $("ask-sheet").hidden = false;
  hideFab();
  setTimeout(() => $("ask-input").focus(), 100);
}
function closeAsk() {
  $("sheet-scrim").hidden = true;
  $("ask-sheet").hidden = true;
}

function renderMD(src) {
  let h = esc(src).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return h.split(/\n{2,}/).map((p) => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
}

async function streamGemini(passage, question, onToken) {
  const model = (store.model || MODEL).trim() || MODEL;
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) + ":streamGenerateContent?alt=sse&key=" + encodeURIComponent(store.k);
  const body = {
    systemInstruction: { parts: [{ text: systemPromptFor(passage.translation) }] },
    contents: [{
      role: "user",
      parts: [{ text: "PASSAGE (" + passage.ref + ", " + translationName(passage.translation) + "):\n\"\"\"" + passage.text + "\"\"\"\n\nQUESTION: " + question }],
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let msg = "Request failed (" + resp.status + ").";
    try {
      const j = await resp.json();
      if (j.error && j.error.message) msg = j.error.message;
    } catch (e) {}
    if (resp.status === 400 && /key/i.test(msg)) msg = "That API key was rejected. Check it in Settings.";
    throw new Error(msg);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const m = line.match(/^data:\s*(.*)$/);
      if (!m) continue;
      const s = m[1].trim();
      if (!s || s === "[DONE]") continue;
      try {
        const j = JSON.parse(s);
        const t = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
        if (t) onToken(t);
      } catch (e) { /* partial chunk, ignore */ }
    }
  }
}

async function ask(question) {
  question = question.trim();
  if (!question || streaming || !askPassage) return;
  const box = $("ask-answer");
  box.hidden = false;
  box.innerHTML = '<p class="typing">Thinking…</p>';
  streaming = true;
  $("ask-form").querySelector(".send-btn").disabled = true;
  let raw = "";
  try {
    await streamGemini(askPassage, question, (tok) => {
      raw += tok;
      box.innerHTML = renderMD(raw);
      box.scrollTop = box.scrollHeight;
    });
    if (!raw) box.innerHTML = "<p>No answer returned. Try again.</p>";
  } catch (err) {
    box.innerHTML = "<p>Something went wrong: " + esc(err.message) + "</p>";
  }
  streaming = false;
  $("ask-form").querySelector(".send-btn").disabled = false;
}

/* ---------- search ---------- */
let searchTimer = null;
function doSearch(q) {
  q = q.trim().toLowerCase();
  const box = $("search-results");
  if (q.length < 2) { box.innerHTML = ""; $("search-status").textContent = "Type at least 2 characters."; return; }
  const t0 = performance.now();
  const out = [];
  outer:
  for (let b = 0; b < BIBLE.b.length; b++) {
    const book = BIBLE.b[b];
    for (let c = 0; c < book.c.length; c++) {
      const ch = book.c[c];
      for (let v = 0; v < ch.length; v++) {
        if (ch[v].toLowerCase().includes(q)) {
          out.push({ b, c, v, t: ch[v] });
          if (out.length >= 60) break outer;
        }
      }
    }
  }
  const ms = Math.round(performance.now() - t0);
  $("search-status").textContent = out.length + (out.length >= 60 ? "+" : "") + " results · " + ms + "ms";
  box.innerHTML = "";
  out.forEach((r) => {
    const d = document.createElement("div");
    d.className = "result";
    const idx = r.t.toLowerCase().indexOf(q);
    const snip = r.t.length > 160
      ? "…" + r.t.slice(Math.max(0, idx - 60), idx + 100) + "…"
      : r.t;
    d.innerHTML = '<div class="result-ref">' + esc(BIBLE.b[r.b].n + " " + (r.c + 1) + ":" + (r.v + 1)) +
      '</div><div class="result-text">' + esc(snip) + "</div>";
    d.onclick = () => { openReader(r.b, r.c); };
    box.appendChild(d);
  });
}

/* ---------- settings ---------- */
function openSettings() {
  $("key-input").value = store.k;
  $("esv-input").value = store.esv;
  $("model-input").value = store.model;
  $("settings-modal").hidden = false;
}
function closeSettings() { $("settings-modal").hidden = true; }

function renderVersionLine() {
  const el = $("version-line");
  el.textContent = store.esv
    ? "English Standard Version via Crossway API \u00b7 KJV offline fallback"
    : "King James Version \u00b7 add an ESV API key in Settings for ESV";
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- wiring ---------- */
function init() {
  $("home-btn").onclick = () => show("view-library");
  $("chapters-back").onclick = () => show("view-library");
  $("reader-back").onclick = () => openChapters(cur.b);
  $("prev-ch").onclick = () => stepChapter(-1);
  $("next-ch").onclick = () => stepChapter(1);
  $("search-btn").onclick = () => { show("view-search"); setTimeout(() => $("search-input").focus(), 50); };
  $("settings-btn").onclick = openSettings;
  $("settings-close").onclick = closeSettings;
  $("settings-save").onclick = () => {
    store.k = $("key-input").value.trim();
    store.esv = $("esv-input").value.trim();
    store.model = $("model-input").value.trim() || MODEL;
    closeSettings();
    renderVersionLine();
    toast(store.k || store.esv ? "Settings saved" : "Keys removed");
    // re-render current chapter so a newly added ESV key takes effect
    if (!$("view-reader").hidden) openReader(cur.b, cur.c);
  };
  $("key-clear").onclick = () => { $("key-input").value = ""; store.k = ""; toast("Gemini key removed"); };
  $("esv-clear").onclick = () => {
    $("esv-input").value = ""; store.esv = ""; renderVersionLine(); toast("ESV key removed");
    if (!$("view-reader").hidden) openReader(cur.b, cur.c);
  };
  $("settings-modal").addEventListener("click", (e) => { if (e.target.id === "settings-modal") closeSettings(); });

  $("search-input").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(e.target.value), 300);
  });

  fab.onclick = openAsk;
  $("sheet-scrim").onclick = closeAsk;
  $("ask-key-link").onclick = () => { closeAsk(); openSettings(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAsk(); closeSettings(); hideFab(); } });

  document.querySelectorAll(".chip").forEach((ch) => {
    ch.onclick = () => ask(ch.dataset.q);
  });
  $("ask-form").addEventListener("submit", (e) => {
    e.preventDefault();
    ask($("ask-input").value);
    $("ask-input").value = "";
  });

  fetch("bible.json")
    .then((r) => { if (!r.ok) throw new Error("bible.json failed to load"); return r.json(); })
    .then((j) => {
      BIBLE = j;
      renderLibrary();
      renderVersionLine();
      show("view-library");
    })
    .catch((err) => {
      document.querySelector("main").innerHTML =
        "<p style='color:var(--danger);padding:40px 0'>Could not load the Bible text: " + esc(err.message) + "</p>";
    });
}

document.addEventListener("DOMContentLoaded", init);
