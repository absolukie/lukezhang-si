const WORDS = {
  "🍕 Food & Drink": ["pizza","sushi","taco","spaghetti","hamburger","pancake","ice cream","donut","sandwich","popcorn","watermelon","banana","strawberry","pineapple","coffee","cupcake","cheese","fried egg","bacon","hot dog","fries","salad","soup","cake","cookie","bread","apple","grapes","carrot","avocado"],
  "🐶 Animals": ["dog","cat","elephant","lion","tiger","monkey","giraffe","zebra","kangaroo","penguin","fish","shark","octopus","butterfly","bee","spider","snake","frog","rabbit","horse","cow","pig","chicken","duck","owl","bear","fox","deer","mouse","whale"],
  "🏠 Everyday": ["chair","table","lamp","phone","book","key","umbrella","shoe","hat","glasses","clock","mirror","candle","pillow","toothbrush","scissors","guitar","camera","bicycle","car","airplane","boat","train","house","door","window","bed","sofa","wallet","backpack"],
  "🏃 Actions": ["running","swimming","dancing","singing","cooking","reading","writing","driving","flying","climbing","jumping","sleeping","eating","laughing","crying","painting","skiing","surfing","fishing","hiking","shopping","cleaning","brushing teeth","waving","clapping","sneezing","yawning","texting","juggling","yoga"],
  "🈶 Chinese": [
    { p: "nihao", en: "hello" },
    { p: "xiexie", en: "thank you" },
    { p: "zaijian", en: "goodbye" },
    { p: "duibuqi", en: "sorry" },
    { p: "meiguanxi", en: "it's okay" },
    { p: "qing", en: "please" },
    { p: "wo", en: "I / me" },
    { p: "ni", en: "you" },
    { p: "ta", en: "he / she" },
    { p: "women", en: "we / us" },
    { p: "tamen", en: "they" },
    { p: "yi", en: "one" },
    { p: "er", en: "two" },
    { p: "san", en: "three" },
    { p: "si", en: "four" },
    { p: "wu", en: "five" },
    { p: "liu", en: "six" },
    { p: "qi", en: "seven" },
    { p: "ba", en: "eight" },
    { p: "jiu", en: "nine" },
    { p: "shi", en: "ten" },
    { p: "shenme", en: "what" },
    { p: "shei", en: "who" },
    { p: "nar", en: "where" },
    { p: "zenme", en: "how" },
    { p: "duoshao", en: "how much" },
    { p: "you", en: "to have" },
    { p: "qu", en: "to go" },
    { p: "lai", en: "to come" },
    { p: "chi", en: "to eat" },
    { p: "he", en: "to drink" },
    { p: "kan", en: "to look" },
    { p: "shuo", en: "to speak" },
    { p: "xuexi", en: "to study" },
    { p: "xihuan", en: "to like" },
    { p: "ai", en: "to love" },
    { p: "mai", en: "to buy" },
    { p: "ren", en: "person" },
    { p: "pengyou", en: "friend" },
    { p: "jia", en: "home / family" },
    { p: "xuexiao", en: "school" },
    { p: "laoshi", en: "teacher" },
    { p: "xuesheng", en: "student" },
    { p: "shu", en: "book" },
    { p: "shui", en: "water" },
    { p: "fan", en: "rice / meal" },
    { p: "cha", en: "tea" },
    { p: "baba", en: "dad" },
    { p: "mama", en: "mom" },
    { p: "gege", en: "older brother" },
    { p: "didi", en: "younger brother" },
    { p: "jiejie", en: "older sister" },
    { p: "meimei", en: "younger sister" },
    { p: "jintian", en: "today" },
    { p: "mingtian", en: "tomorrow" },
    { p: "zuotian", en: "yesterday" },
    { p: "hao", en: "good" },
    { p: "da", en: "big" },
    { p: "xiao", en: "small" },
    { p: "duo", en: "many" },
    { p: "hen", en: "very" }
  ]
};

/* Firebase backend for online multiplayer (draw-and-guess project).
   The config is served at runtime by /api/config from Cloudflare env vars —
   never hardcode keys in this repo. */
let FIREBASE_CONFIG = null;
async function ensureFirebaseConfig() {
  if (FIREBASE_CONFIG) return true;
  try {
    const r = await fetch("/draw-guess/api/config");
    const j = await r.json();
    if (!j.apiKey) return false;
    FIREBASE_CONFIG = j;
    return true;
  } catch (e) { return false; }
}

const state = {
  names: ["Luke", "Player 2"],
  rounds: 6,
  timeLimit: 60,
  cats: [],
  deck: [],
  round: 0,
  drawer: 0,
  scores: [0, 0],
  word: "",
  wordCat: "",
  wordEn: "",
  timerId: null,
  timeLeft: 0,
  mode: "solo", // "solo" | "ai" | "aidraw" (online uses net.active instead)
};

const $ = (id) => document.getElementById(id);
const screens = ["screen-mode","screen-setup","screen-online","screen-reveal","screen-draw","screen-result","screen-over"];
function show(id) {
  screens.forEach(s => $(s).classList.toggle("active", s === id));
  window.scrollTo(0, 0);
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rnd = (n) => Math.floor(Math.random() * n);

/* ================= setup (same phone) ================= */
function buildCatChecks() {
  const box = $("cat-checks");
  Object.keys(WORDS).forEach((cat, i) => {
    const lab = document.createElement("label");
    lab.className = "check" + (i < 2 ? " sel" : "");
    lab.innerHTML = `<input type="checkbox"${i < 2 ? " checked" : ""}> ${cat}`;
    lab.querySelector("input").addEventListener("change", (e) => {
      lab.classList.toggle("sel", e.target.checked);
    });
    box.appendChild(lab);
  });
}
function pillGroup(id, cb) {
  const el = $(id);
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    el.querySelectorAll("button").forEach(x => x.classList.remove("sel"));
    b.classList.add("sel");
    cb(parseInt(b.dataset.v, 10));
  });
}

$("btn-mode-solo").addEventListener("click", () => { state.mode = "solo"; showSetup("solo"); });
$("btn-mode-ai").addEventListener("click", () => { state.mode = "ai"; showSetup("ai"); });
$("btn-mode-aidraw").addEventListener("click", () => { state.mode = "aidraw"; showSetup("aidraw"); });
function showSetup(mode) {
  const ai = mode === "ai", aidraw = mode === "aidraw";
  $("setup-sub").textContent = ai
    ? "You draw, the AI tries to guess it. Stump it to score!"
    : aidraw
    ? "The AI sketches the word — you guess it! Great for learning Chinese."
    : "One phone. Take turns drawing, the other guesses out loud.";
  $("name1-label").textContent = (ai || aidraw) ? "Your name" : "Player 1";
  $("name2-wrap").style.display = (ai || aidraw) ? "none" : "";
  show("screen-setup");
}
$("btn-mode-online").addEventListener("click", async () => {
  if (!await initFirebase()) return;
  show("screen-online");
});
$("btn-setup-back").addEventListener("click", () => show("screen-mode"));
$("btn-online-back").addEventListener("click", () => { netLeave(); show("screen-mode"); });

$("btn-start").addEventListener("click", () => {
  const n1 = $("name1").value.trim();
  state.cats = [...$("cat-checks").querySelectorAll("label")]
    .filter(l => l.querySelector("input").checked)
    .map(l => l.textContent.trim());
  if (!state.cats.length) state.cats = Object.keys(WORDS);
  state.round = 0;
  state.scores = [0, 0];
  buildDeck();
  if (state.mode === "ai") {
    state.names = [n1 || "You", "🤖 AI"];
    state.drawer = 0;
    aiNextRound();
  } else if (state.mode === "aidraw") {
    state.names = [n1 || "You", "🎨 AI"];
    state.drawer = 1;
    aidrawNextRound();
  } else {
    const n2 = $("name2").value.trim();
    state.names = [n1 || "Player 1", n2 || "Player 2"];
    state.drawer = rnd(2);
    startReveal();
  }
});

function buildDeck() {
  let pool = [];
  state.cats.forEach(c => WORDS[c].forEach(e => {
    if (typeof e === "string") pool.push({ w: e, c });
    else pool.push({ w: e.p, c, en: e.en }); // Chinese pack: pinyin + English meaning
  }));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  state.deck = pool;
}
function drawWord() {
  if (!state.deck.length) buildDeck();
  const { w, c, en } = state.deck.pop();
  state.word = w; state.wordCat = c; state.wordEn = en || "";
}
// strip accents/diacritics, spaces & punctuation so "nǐ hǎo" matches "nihao"
const normTxt = (t) => (t || "").toLowerCase().trim()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/g, "");

/* ---- letter hints: blanks up front, letters revealed as time passes ---- */
const HINT_EVERY = 12; // seconds between letter reveals
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// deterministic reveal order so drawer and guesser see the same letters
function hintShown(word, round, elapsed) {
  const letters = [...word].map((_, i) => i).filter(i => word[i] !== " ");
  const rand = mulberry32(hashStr(word + "#" + round));
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const maxShow = Math.max(0, letters.length - 1); // never give away the whole word
  return new Set(letters.slice(0, Math.min(Math.floor(elapsed / HINT_EVERY), maxShow)));
}
function renderHint(word, round, elapsed) {
  const shown = hintShown(word, round, elapsed);
  return [...word].map((ch, i) =>
    ch === " " ? "  " : (shown.has(i) ? ch.toUpperCase() : "_")
  ).join(" ");
}
function updateHint(word, round, elapsed) {
  const el = $("hint-display");
  if (!word) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.textContent = renderHint(word, round, elapsed);
}

/* ================= reveal ================= */
function startReveal() {
  state.round++;
  drawWord();
  $("reveal-pass").textContent = "📱 Hand the phone to";
  $("reveal-warn").classList.remove("hidden");
  $("reveal-solo").classList.remove("hidden");
  $("reveal-online-wait").classList.add("hidden");
  $("reveal-drawer").textContent = state.names[state.drawer];
  $("reveal-hidden").classList.remove("hidden");
  $("reveal-shown").classList.add("hidden");
  show("screen-reveal");
}
$("btn-reveal").addEventListener("click", () => {
  $("reveal-cat").textContent = state.wordCat;
  $("reveal-word").textContent = cap(state.word);
  const en = $("reveal-en");
  if (state.wordEn) { en.textContent = `💬 means “${state.wordEn}” — draw it!`; en.classList.remove("hidden"); }
  else en.classList.add("hidden");
  $("reveal-hidden").classList.add("hidden");
  $("reveal-shown").classList.remove("hidden");
});
$("btn-draw-start").addEventListener("click", () => {
  if (net.active) netStartDraw();
  else if (state.mode === "ai") startAiDraw();
  else startDraw();
});

/* ================= drawing (shared canvas) ================= */
const canvas = $("canvas"), ctx = canvas.getContext("2d");
let drawing = false, last = null, undoStack = [];
let curColor = "#1a1a1a", curSize = 9;
let curPts = null; // normalized points of the stroke in progress (online drawer)

function sizeCanvas() {
  const wrap = $("canvas-wrap");
  const r = wrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.max(50, r.width * dpr);
  canvas.height = Math.max(50, r.height * dpr);
  canvas.style.width = r.width + "px";
  canvas.style.height = r.height + "px";
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  undoStack = [];
  if (net.active && !net.isDrawer) netRedrawGuesser();
}
function snapshot() {
  try {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > 25) undoStack.shift();
  } catch (e) {}
}
function pos(e) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
}
function npos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
canvas.addEventListener("pointerdown", (e) => {
  if (net.active && !net.isDrawer) return;
  e.preventDefault();
  if (!net.active) snapshot();
  if (state.mode === "ai" && !net.active) aiStrokes++;
  drawing = true; last = pos(e);
  curPts = net.active ? [npos(e)] : null;
  canvas.setPointerCapture(e.pointerId);
  dot(last);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  if (net.active && !net.isDrawer) return;
  e.preventDefault();
  const p = pos(e);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  ctx.strokeStyle = curColor; ctx.lineWidth = curSize * dpr;
  ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  last = p;
  if (curPts) curPts.push(npos(e));
});
const stopDraw = (e) => {
  if (!drawing) return;
  drawing = false;
  if (net.active && net.isDrawer && curPts && curPts.length) {
    const r = canvas.getBoundingClientRect();
    // send points as [x, y] arrays (normalized 0..1) so the guesser can render them
    netPushStroke({ pts: curPts.map(p => [p.x, p.y]), color: curColor, size: curSize / r.width });
  }
  curPts = null;
};
canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointercancel", stopDraw);
function dot(p) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  ctx.fillStyle = curColor;
  ctx.beginPath(); ctx.arc(p.x, p.y, curSize * dpr / 2, 0, 7); ctx.fill();
}
function drawStrokeOnCanvas(s) {
  // s: {pts:[[nx,ny]..], color, size(frac of width)}
  if (!s.pts || !s.pts.length) return;
  const W = canvas.width, H = canvas.height;
  ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
  ctx.lineWidth = Math.max(1, s.size * W);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const P = s.pts.map(([nx, ny]) => [nx * W, ny * H]);
  if (P.length === 1) {
    ctx.beginPath(); ctx.arc(P[0][0], P[0][1], ctx.lineWidth / 2, 0, 7); ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
  ctx.stroke();
}

const COLORS = ["#1a1a1a","#e53e3e","#dd6b20","#d69e2e","#38a169","#3182ce","#805ad5","#d53f8c","#4a3728","#ffffff"];
function buildColors() {
  const box = $("colors");
  COLORS.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "swatch" + (i === 0 ? " sel" : "") + (c === "#ffffff" ? " eraser" : "");
    b.style.background = c;
    b.title = c === "#ffffff" ? "Eraser" : c;
    b.addEventListener("click", () => {
      curColor = c;
      box.querySelectorAll(".swatch").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
    });
    box.appendChild(b);
  });
}
$("sizes").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  curSize = parseInt(b.dataset.s, 10);
  $("sizes").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel");
});
$("btn-undo").addEventListener("click", () => {
  const img = undoStack.pop();
  if (img) ctx.putImageData(img, 0, 0);
});
$("btn-clear").addEventListener("click", () => {
  if (net.active) { if (net.isDrawer) netClear(); return; }
  snapshot();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

/* ================= round flow (same phone) ================= */
function startDraw() {
  show("screen-draw");
  setupDrawScreenSolo();
  requestAnimationFrame(() => {
    sizeCanvas();
    $("draw-round").textContent = `Round ${state.round}/${state.rounds}`;
    $("draw-word").textContent = cap(state.word);
    $("draw-cat").textContent = state.wordCat;
    const den = $("draw-en");
    if (state.wordEn) { den.textContent = `“${state.wordEn}”`; den.classList.remove("hidden"); }
    else den.classList.add("hidden");
    updateScores();
    state.timeLeft = state.timeLimit;
    tick();
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 200);
  });
}
function setupDrawScreenSolo() {
  $("secret-word").classList.remove("hidden");
  $("draw-guesser-label").classList.add("hidden");
  $("tools").style.display = "";
  $("btn-undo").style.display = "";
  $("guess-feed").classList.add("hidden");
  $("guesser-bar").classList.add("hidden");
  $("draw-actions").style.display = "";
  $("btn-gotit").style.display = "";
}
function updateScores() {
  $("draw-scores").textContent = `${state.scores[0]} – ${state.scores[1]}`;
}
function tick() {
  state.timeLeft = Math.max(0, state.timeLeft - 0.2);
  $("timer-num").textContent = Math.ceil(state.timeLeft);
  $("timer-bar").style.width = (100 * state.timeLeft / state.timeLimit) + "%";
  $("timer-bar").classList.toggle("low", state.timeLeft <= 10);
  if (state.mode === "ai") {
    if (state.timeLeft <= 0) aiEndRound("you"); // stumped the AI!
    return;
  }
  if (state.mode === "aidraw") {
    if (state.timeLeft <= 0) aidrawEndRound("ai"); // the AI stumped you!
    return;
  }
  updateHint(state.word, state.round, state.timeLimit - state.timeLeft);
  if (state.timeLeft <= 0) endRound(false);
}
function endRound(guessed) {
  clearInterval(state.timerId);
  if (guessed) state.scores[state.drawer]++;
  const lastRound = state.round >= state.rounds;
  if (lastRound) {
    gameOver();
  } else {
    $("result-emoji").textContent = guessed ? "🎉" : "⏰";
    $("result-title").textContent = guessed
      ? `Point for ${state.names[state.drawer]}!`
      : "Time's up!";
    const answer = state.wordEn
      ? `"${cap(state.word)}" — “${state.wordEn}”`
      : `"${cap(state.word)}"`;
    $("result-sub").textContent = guessed
      ? `Nice drawing — ${answer} it was.`
      : `The word was ${answer}. No point this time.`;
    $("btn-next").textContent = `Next: ${state.names[1 - state.drawer]} draws →`;
    $("btn-next").style.display = "";
    show("screen-result");
  }
}

/* ================= solo vs AI: you draw, the AI guesses ================= */
const AI_GUESS_EVERY = 7; // seconds between AI guesses
let aiTimer = null, aiAsking = false, aiStrokes = 0, aiWords = [], aiOver = false;

function aiNextRound() {
  startReveal();
  $("reveal-pass").textContent = "🤖 You draw, the AI guesses";
  $("reveal-warn").classList.add("hidden");
  aiWords = aiWordChoices();
}
function aiWordChoices() {
  const cur = state.wordEn ? `${state.word} (${state.wordEn})` : state.word;
  const set = new Set([cur]);
  state.cats.forEach(c => WORDS[c].forEach(e => {
    set.add(typeof e === "string" ? e : `${e.p} (${e.en})`);
  }));
  const others = [...set].filter(w => w !== cur);
  for (let i = others.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [others[i], others[j]] = [others[j], others[i]];
  }
  return [cur, ...others.slice(0, 149)];
}
function setupDrawScreenAi() {
  $("secret-word").classList.remove("hidden");
  $("hint-display").classList.add("hidden");
  const lbl = $("draw-guesser-label");
  lbl.textContent = "🤖 AI is guessing…";
  lbl.classList.remove("hidden");
  $("tools").style.display = "";
  $("btn-undo").style.display = "";
  const feed = $("guess-feed");
  feed.innerHTML = "";
  feed.classList.remove("hidden");
  feed.classList.add("ai");
  $("guesser-bar").classList.add("hidden");
  $("draw-actions").style.display = "";
  $("btn-gotit").style.display = "none";
  $("btn-skip").style.display = "";
  canvas.style.pointerEvents = "";
}
function startAiDraw() {
  show("screen-draw");
  setupDrawScreenAi();
  requestAnimationFrame(() => {
    sizeCanvas();
    $("draw-round").textContent = `Round ${state.round}/${state.rounds}`;
    $("draw-word").textContent = cap(state.word);
    $("draw-cat").textContent = state.wordCat;
    const den = $("draw-en");
    if (state.wordEn) { den.textContent = `“${state.wordEn}”`; den.classList.remove("hidden"); }
    else den.classList.add("hidden");
    updateScores();
    state.timeLeft = state.timeLimit;
    aiStrokes = 0; aiAsking = false; aiGuessCount = 0; aiOver = false; aiUpdateLabel();
    aiFeed("Draw something and I'll start guessing! ✏️");
    clearInterval(state.timerId); clearInterval(aiTimer);
    tick();
    state.timerId = setInterval(tick, 200);
    aiTimer = setInterval(aiAsk, AI_GUESS_EVERY * 1000);
    setTimeout(aiAsk, 4000); // first guess comes fast so it doesn't feel dead
  });
}
function aiFeed(text, cls) {
  const feed = $("guess-feed");
  const div = document.createElement("div");
  div.className = "guess" + (cls ? " " + cls : "");
  div.textContent = `🤖 ${text}`;
  feed.appendChild(div);
  while (feed.children.length > 30) feed.removeChild(feed.firstChild);
  feed.scrollTop = feed.scrollHeight;
}
let aiGuessCount = 0;
function aiUpdateLabel() {
  const lbl = $("draw-guesser-label");
  lbl.textContent = aiGuessCount
    ? `🤖 AI is guessing… (${aiGuessCount} ${aiGuessCount === 1 ? "guess" : "guesses"} so far)`
    : "🤖 AI is guessing…";
}
function smallSnapshot() {
  const max = 512;
  const scale = Math.min(1, max / Math.max(canvas.width, canvas.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(canvas.width * scale));
  c.height = Math.max(1, Math.round(canvas.height * scale));
  c.getContext("2d").drawImage(canvas, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}
function aiAsk() {
  if (state.mode !== "ai" || !$("screen-draw").classList.contains("active")) return;
  if (aiAsking || !aiStrokes) return;
  aiAsking = true;
  aiFeed("studying your drawing… 👀");
  (async () => {
    try {
      const r = await fetch("/draw-guess/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: smallSnapshot(), words: aiWords })
      });
      if (!$("screen-draw").classList.contains("active")) return; // round already over
      const j = await r.json().catch(() => ({}));
      if (j.error === "missing_key") {
        aiFeed("I need an API key to play — ask Luke to add it! 🔑");
        clearInterval(aiTimer);
      } else {
        const guess = (j.guess || "").trim();
        if (!guess) aiFeed("hmm… keep drawing, I'm thinking! 🤔");
        else if (normTxt(guess) === normTxt(state.word) ||
                 (state.wordEn && normTxt(guess) === normTxt(state.wordEn))) {
          aiGuessCount++; aiUpdateLabel();
          aiFeed(`Got it — “${cap(guess)}”! ✅`, "correct");
          setTimeout(() => aiEndRound("ai"), 1200); // let the ✅ show before the result
          return;
        } else { aiGuessCount++; aiUpdateLabel(); aiFeed(`My guess: “${cap(guess)}” ❌`, "wrong"); }
      }
    } catch (e) {
      aiFeed("my eyes glitched — keep drawing! 😅");
    }
    aiAsking = false;
  })();
}
function aiEndRound(result) { // "ai" | "you" | "skip"
  if (aiOver) return;
  aiOver = true;
  clearInterval(state.timerId); clearInterval(aiTimer);
  if (result === "ai") state.scores[1]++;
  else if (result === "you") state.scores[0]++;
  if (state.round >= state.rounds) { gameOver(); return; }
  const answer = state.wordEn ? `"${cap(state.word)}" — “${state.wordEn}”` : `"${cap(state.word)}"`;
  $("result-emoji").textContent = result === "ai" ? "🤖" : "🎉";
  $("result-title").textContent =
    result === "ai" ? "AI got it!" : result === "you" ? "You stumped the AI!" : "Skipped!";
  $("result-sub").textContent = result === "ai"
    ? `Nice drawing — ${answer} it was.`
    : result === "you"
    ? `The word was ${answer}. You earned a point! 🎉`
    : `The word was ${answer}. No point this time.`;
  $("btn-next").textContent = "Next round →";
  $("btn-next").style.display = "";
  show("screen-result");
}
/* ================= AI draws, you guess ================= */
let aidrawTimer = null, aidrawLoading = false, aidrawOver = false;

function aidrawNextRound() {
  state.round++;
  drawWord();
  startAidraw();
}
function startAidraw() {
  show("screen-draw");
  aidrawOver = false;
  $("secret-word").classList.add("hidden"); // the word stays secret from the guesser!
  $("hint-display").classList.add("hidden");
  const lbl = $("draw-guesser-label");
  lbl.textContent = "🎨 AI is drawing…";
  lbl.classList.remove("hidden");
  $("tools").style.display = "none";
  const feed = $("guess-feed");
  feed.innerHTML = "";
  feed.classList.remove("hidden");
  feed.classList.add("ai");
  $("guesser-bar").classList.remove("hidden");
  $("guess-input").value = "";
  $("draw-actions").style.display = "";
  $("btn-gotit").style.display = "none";
  $("btn-skip").style.display = "";
  canvas.style.pointerEvents = "none";
  requestAnimationFrame(() => {
    sizeCanvas();
    $("draw-round").textContent = `Round ${state.round}/${state.rounds}`;
    $("draw-cat").textContent = state.wordCat;
    updateScores();
    state.timeLeft = state.timeLimit;
    aidrawLoading = true;
    aiFeed("🎨 Thinking of what to draw…");
    clearInterval(state.timerId); clearInterval(aidrawTimer);
    tick();
    state.timerId = setInterval(tick, 200);
    aidrawFetch();
  });
}
async function aidrawFetch() {
  const drawThis = state.wordEn || state.word; // draw the meaning for Chinese words
  try {
    const r = await fetch("/draw-guess/api/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: drawThis })
    });
    if (state.mode !== "aidraw" || !$("screen-draw").classList.contains("active")) return;
    const j = await r.json().catch(() => ({}));
    aidrawLoading = false;
    if (j.error === "missing_key") {
      aiFeed("I need an API key to draw — ask Luke to add it! 🔑");
    } else if (!j.strokes || !j.strokes.length) {
      aiFeed("🎨 My pencil broke 😅 — tap Skip for a new word!");
    } else {
      aiFeed("✏️ Drawing… guess anytime!");
      animateAidraw(j.strokes);
    }
  } catch (e) {
    aidrawLoading = false;
    if (state.mode !== "aidraw" || !$("screen-draw").classList.contains("active")) return;
    aiFeed("🎨 My pencil broke 😅 — tap Skip for a new word!");
  }
}
function animateAidraw(strokes) {
  const sx = canvas.width / 400, sy = canvas.height / 300;
  let i = 0;
  clearInterval(aidrawTimer);
  aidrawTimer = setInterval(() => {
    if (state.mode !== "aidraw" || !$("screen-draw").classList.contains("active") || aidrawOver) {
      clearInterval(aidrawTimer); return;
    }
    if (i >= strokes.length) {
      clearInterval(aidrawTimer);
      $("draw-guesser-label").textContent = "🔍 Done — what's your guess?";
      return;
    }
    const pts = strokes[i++];
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = Math.max(3, 8 * Math.min(sx, sy));
    ctx.beginPath();
    pts.forEach((p, k) => { k ? ctx.lineTo(p[0] * sx, p[1] * sy) : ctx.moveTo(p[0] * sx, p[1] * sy); });
    ctx.stroke();
    $("draw-guesser-label").textContent = `🎨 AI is drawing… (${i}/${strokes.length})`;
  }, 1200);
}
function aidrawGuess() {
  const inp = $("guess-input");
  const text = inp.value.trim();
  if (!text || aidrawLoading || aidrawOver) return;
  if (normTxt(text) === normTxt(state.word) ||
      (state.wordEn && normTxt(text) === normTxt(state.wordEn))) {
    aiFeed(`“${cap(text)}” — correct! ✅`, "correct");
    inp.value = "";
    aidrawOver = true; // lock so the timer can't also end the round
    setTimeout(() => aidrawEndRound("you"), 900);
  } else {
    aiFeed(`“${cap(text)}” — nope, keep guessing! ❌`, "wrong");
    inp.value = "";
  }
}
function aidrawEndRound(result) { // "you" | "ai" | "skip"
  if (aidrawOver && result !== "you") return;
  aidrawOver = true;
  clearInterval(state.timerId); clearInterval(aidrawTimer);
  aidrawLoading = false;
  if (result === "you") state.scores[0]++;
  else if (result === "ai") state.scores[1]++;
  if (state.round >= state.rounds) { gameOver(); return; }
  const answer = state.wordEn ? `"${cap(state.word)}" — “${state.wordEn}”` : `"${cap(state.word)}"`;
  $("result-emoji").textContent = result === "you" ? "🎉" : result === "ai" ? "🎨" : "⏭️";
  $("result-title").textContent =
    result === "you" ? "You got it!" : result === "ai" ? "The AI stumped you!" : "Skipped!";
  $("result-sub").textContent =
    result === "you" ? `Nice guessing — ${answer} it was!` : `The word was ${answer}.`;
  $("btn-next").textContent = "Next round →";
  $("btn-next").style.display = "";
  show("screen-result");
}
$("btn-gotit").addEventListener("click", () => {
  if (net.active || state.mode === "ai") return;
  endRound(true);
});
$("btn-skip").addEventListener("click", () => {
  if (net.active) { netSkip(); return; }
  if (state.mode === "ai") { aiEndRound("skip"); return; }
  if (state.mode === "aidraw") { aidrawEndRound("skip"); return; }
  endRound(false);
});
$("btn-next").addEventListener("click", () => {
  if (net.active) { netNextRound(); return; }
  if (state.mode === "ai") { aiNextRound(); return; }
  if (state.mode === "aidraw") { aidrawNextRound(); return; }
  state.drawer = 1 - state.drawer;
  startReveal();
});

/* ================= game over ================= */
function gameOver() {
  const [a, b] = state.scores;
  const [n1, n2] = state.names;
  $("over-title").textContent =
    a === b ? "It's a tie! 🤝" : `${a > b ? n1 : n2} wins!`;
  $("over-scores").innerHTML =
    `<div class="frow"><span>${n1}</span><b>${a}</b></div>` +
    `<div class="frow"><span>${n2}</span><b>${b}</b></div>`;
  $("btn-again").style.display = "";
  $("btn-new").textContent = "New setup";
  $("over-wait").classList.add("hidden");
  show("screen-over");
}
$("btn-again").addEventListener("click", () => {
  if (net.active) { netPlayAgain(); return; }
  state.round = 0; state.scores = [0, 0];
  buildDeck();
  if (state.mode === "ai") { state.drawer = 0; aiNextRound(); return; }
  if (state.mode === "aidraw") { state.drawer = 1; aidrawNextRound(); return; }
  state.drawer = rnd(2);
  startReveal();
});
$("btn-new").addEventListener("click", () => {
  if (net.active) { netLeave(); show("screen-mode"); return; }
  show("screen-setup");
});

/* ================= online multiplayer ================= */
const net = {
  active: false, db: null, roomRef: null, gameRef: null,
  code: null, pid: null, name: "", isHost: false, isDrawer: false,
  players: {}, game: null, settings: { rounds: 6, timeLimit: 60, packs: null },
  timerId: null, strokes: [], unsubs: [],
};

async function initFirebase() {
  try {
    if (typeof firebase === "undefined") { onlineError("Couldn't reach the game server. Check your connection and try again."); return false; }
    if (!await ensureFirebaseConfig()) { onlineError("Online play isn't configured yet — try again in a bit."); return false; }
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    net.db = firebase.database();
    return true;
  } catch (e) { onlineError("Couldn't reach the game server. Try again."); return false; }
}
function onlineError(msg) {
  const el = $("online-error");
  el.textContent = msg; el.classList.remove("hidden");
}
function genCode() {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += A[rnd(A.length)];
  return s;
}
const roomURL = () => `${location.origin}${location.pathname}?room=${net.code}`;

$("btn-create").addEventListener("click", async () => {
  const name = $("online-name").value.trim() || "Player 1";
  $("online-error").classList.add("hidden");
  const code = genCode();
  const pid = "p" + Date.now().toString(36) + rnd(99);
  try {
    const ref = net.db.ref("rooms/" + code);
    await ref.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      settings: net.settings,
      players: { [pid]: { name } },
      game: { phase: "lobby" }
    });
    netEnterRoom(code, pid, name, true);
  } catch (e) { onlineError("Couldn't create the room. Try again."); }
});
$("btn-join").addEventListener("click", async () => {
  const name = $("online-name").value.trim() || "Player 2";
  const code = $("join-code").value.trim().toUpperCase();
  $("online-error").classList.add("hidden");
  if (code.length !== 4) { onlineError("Enter the 4-letter room code."); return; }
  try {
    const snap = await net.db.ref("rooms/" + code).get();
    if (!snap.exists()) { onlineError("No room with that code. Check it and try again."); return; }
    const players = snap.val().players || {};
    if (Object.keys(players).length >= 2) { onlineError("That room is full."); return; }
    const g = snap.val().game || {};
    if (g.phase && g.phase !== "lobby") { onlineError("That game already started."); return; }
    const pid = "p" + Date.now().toString(36) + rnd(99);
    await net.db.ref(`rooms/${code}/players/${pid}`).set({ name });
    netEnterRoom(code, pid, name, false);
  } catch (e) { onlineError("Couldn't join the room. Try again."); }
});
$("btn-copy").addEventListener("click", async () => {
  const link = roomURL();
  try {
    if (navigator.share) { await navigator.share({ title: "Draw & Guess", text: `Join my Draw & Guess room! Code: ${net.code}`, url: link }); }
    else { await navigator.clipboard.writeText(link); $("btn-copy").textContent = "✅ Link copied!"; setTimeout(() => $("btn-copy").textContent = "📋 Copy invite link", 2000); }
  } catch (e) {
    try { await navigator.clipboard.writeText(link); $("btn-copy").textContent = "✅ Link copied!"; }
    catch (e2) { prompt("Copy this invite link:", link); }
  }
});
pillGroup("online-rounds", v => net.settings.rounds = v);
pillGroup("online-time", v => net.settings.timeLimit = v);

/* host picks word packs; synced to the room so the guest sees them too */
function readOnlineCats() {
  return [...$("online-cat-checks").querySelectorAll("label")]
    .filter(l => l.querySelector("input").checked)
    .map(l => l.textContent.trim());
}
function buildOnlineCatChecks() {
  const box = $("online-cat-checks");
  Object.keys(WORDS).forEach((cat, i) => {
    const lab = document.createElement("label");
    lab.className = "check" + (i < 2 ? " sel" : "");
    lab.innerHTML = `<input type="checkbox"${i < 2 ? " checked" : ""}> ${cat}`;
    lab.querySelector("input").addEventListener("change", (e) => {
      if (!readOnlineCats().length) e.target.checked = true; // keep at least one pack
      lab.classList.toggle("sel", e.target.checked);
      net.settings.packs = readOnlineCats();
      if (net.active && net.roomRef) net.roomRef.child("settings/packs").set(net.settings.packs);
    });
    box.appendChild(lab);
  });
  net.settings.packs = readOnlineCats();
}
function renderLobbyPacks() {
  const el = $("lobby-packs");
  const packs = (net.settings && net.settings.packs && net.settings.packs.length)
    ? net.settings.packs : Object.keys(WORDS);
  if (net.isHost) { el.classList.add("hidden"); return; }
  el.textContent = `Word packs: ${packs.join(" · ")}`;
  el.classList.remove("hidden");
}

function netEnterRoom(code, pid, name, isHost) {
  net.active = true; net.code = code; net.pid = pid; net.name = name; net.isHost = isHost;
  net.roomRef = net.db.ref("rooms/" + code);
  net.gameRef = net.db.ref(`rooms/${code}/game`);
  net.roomRef.child("players").child(pid).onDisconnect().remove();
  $("online-join-ui").classList.add("hidden");
  $("lobby-room").classList.remove("hidden");
  $("room-code").textContent = code;
  $("host-controls").classList.toggle("hidden", !isHost);
  $("lobby-wait").classList.toggle("hidden", isHost);
  const unsubP = net.roomRef.child("players").on("value", (s) => {
    net.players = s.val() || {};
    renderLobbyPlayers();
  });
  const unsubG = net.gameRef.on("value", (s) => {
    net.game = s.val() || { phase: "lobby" };
    netOnGame(net.game);
  });
  const unsubS = net.roomRef.child("settings").on("value", (s) => {
    const v = s.val();
    if (v) { net.settings = v; renderLobbyPacks(); }
  });
  net.unsubs.push(() => net.roomRef.child("players").off("value", unsubP));
  net.unsubs.push(() => net.gameRef.off("value", unsubG));
  net.unsubs.push(() => net.roomRef.child("settings").off("value", unsubS));
  renderLobbyPacks();
  window.addEventListener("beforeunload", netLeaveBeacon);
}
function netLeaveBeacon() {
  if (net.roomRef && net.pid) net.roomRef.child("players").child(net.pid).remove();
}
function netLeave() {
  try {
    net.unsubs.forEach(u => u());
    if (net.roomRef && net.pid) net.roomRef.child("players").child(net.pid).remove();
  } catch (e) {}
  clearInterval(net.timerId); clearInterval(state.timerId);
  Object.assign(net, { active: false, roomRef: null, gameRef: null, code: null, pid: null, isHost: false, isDrawer: false, players: {}, game: null, strokes: [], unsubs: [] });
  window.removeEventListener("beforeunload", netLeaveBeacon);
  $("online-join-ui").classList.remove("hidden");
  $("lobby-room").classList.add("hidden");
  $("online-error").classList.add("hidden");
}
function renderLobbyPlayers() {
  const ids = Object.keys(net.players);
  $("lobby-players").innerHTML = ids.map(id =>
    `<div class="lobby-player">${net.players[id].name}${id === net.pid ? " (you)" : ""}${id === hostPid() ? " 👑" : ""}</div>`
  ).join("") || `<div class="sub">Waiting…</div>`;
  const btn = $("btn-online-start");
  if (net.isHost) {
    const ready = ids.length >= 2;
    btn.disabled = !ready;
    btn.textContent = ready ? "Start game 🚀" : "Waiting for player…";
  }
}
const hostPid = () => Object.keys(net.players)[0] || null;

$("btn-online-start").addEventListener("click", () => {
  if (!net.isHost) return;
  net.db.ref(`rooms/${net.code}/strokes`).remove();
  net.db.ref(`rooms/${net.code}/guesses`).remove();
  net.gameRef.set({
    phase: "reveal", round: 1, drawerId: net.pid,
    scores: {}, word: "", wordCat: "", wordEn: "", result: null, roundStartAt: 0,
    settings: net.settings
  });
});

/* ---- game state machine ---- */
function netOnGame(g) {
  if (!net.active) return;
  net.isDrawer = g.drawerId === net.pid;
  clearInterval(net.timerId);
  if (g.phase === "reveal") netShowReveal(g);
  else if (g.phase === "draw") netShowDraw(g);
  else if (g.phase === "result") netShowResult(g);
  else if (g.phase === "over") netShowOver(g);
}
function netDrawerName() {
  const p = net.players[(net.game || {}).drawerId];
  return p ? p.name : "The drawer";
}
function netShowReveal(g) {
  $("reveal-solo").classList.add("hidden");
  if (net.isDrawer) {
    if (!g.word) {
      const gp = g.settings && g.settings.packs;
      state.cats = (gp && gp.length) ? gp.filter(c => WORDS[c]) : Object.keys(WORDS);
      if (!state.cats.length) state.cats = Object.keys(WORDS);
      buildDeck(); drawWord();
      net.gameRef.update({ word: state.word, wordCat: state.wordCat, wordEn: state.wordEn });
    } else { state.word = g.word; state.wordCat = g.wordCat; state.wordEn = g.wordEn || ""; }
    $("reveal-online-wait").classList.add("hidden");
    $("reveal-hidden").classList.remove("hidden");
    $("reveal-shown").classList.add("hidden");
  } else {
    $("reveal-online-wait").textContent = `${netDrawerName()} is looking at the word… 🙈`;
    $("reveal-online-wait").classList.remove("hidden");
    $("reveal-hidden").classList.add("hidden");
    $("reveal-shown").classList.add("hidden");
  }
  show("screen-reveal");
}
function netStartDraw() {
  net.db.ref(`rooms/${net.code}/strokes`).remove();
  net.db.ref(`rooms/${net.code}/guesses`).remove();
  net.db.ref(`rooms/${net.code}/clearCount`).set(0);
  net.gameRef.update({ phase: "draw", roundStartAt: firebase.database.ServerValue.TIMESTAMP });
}
function netShowDraw(g) {
  const s = g.settings || net.settings;
  show("screen-draw");
  setupDrawScreenOnline();
  requestAnimationFrame(() => {
    sizeCanvas();
    $("draw-round").textContent = `Round ${g.round}/${s.rounds}`;
    netUpdateScores(g);
    net.strokes = [];
    attachNetListeners();
    clearInterval(net.timerId);
    net.timerId = setInterval(() => netTick(g, s), 200);
    netTick(g, s);
  });
}
function setupDrawScreenOnline() {
  $("guess-feed").innerHTML = "";
  $("guess-feed").classList.remove("hidden");
  if (net.isDrawer) {
    $("secret-word").classList.remove("hidden");
    $("draw-guesser-label").classList.add("hidden");
    $("draw-word").textContent = cap(state.word || (net.game && net.game.word) || "");
    $("draw-cat").textContent = (net.game && net.game.wordCat) || "";
    const den2 = $("draw-en");
    const wen = state.wordEn || (net.game && net.game.wordEn) || "";
    if (wen) { den2.textContent = `“${wen}”`; den2.classList.remove("hidden"); }
    else den2.classList.add("hidden");
    $("tools").style.display = "";
    $("btn-undo").style.display = "none";
    $("guesser-bar").classList.add("hidden");
    $("draw-actions").style.display = "";
    $("btn-gotit").style.display = "none";
    $("btn-skip").style.display = "";
  } else {
    $("secret-word").classList.add("hidden");
    const lbl = $("draw-guesser-label");
    lbl.textContent = `${netDrawerName()} is drawing… ✏️`;
    lbl.classList.remove("hidden");
    $("tools").style.display = "none";
    $("guesser-bar").classList.remove("hidden");
    $("draw-actions").style.display = "none";
    canvas.style.pointerEvents = "none";
  }
  if (net.isDrawer) canvas.style.pointerEvents = "";
}
function netUpdateScores(g) {
  const ids = Object.keys(net.players);
  const sc = g.scores || {};
  const parts = ids.map(id => `${net.players[id] ? net.players[id].name : "?"}: ${sc[id] || 0}`);
  $("draw-scores").textContent = parts.join(" · ") || "0 – 0";
  $("draw-scores").style.fontSize = ".85rem";
}
function netTick(g, s) {
  if (!net.game || net.game.phase !== "draw") { clearInterval(net.timerId); return; }
  const startAt = g.roundStartAt || Date.now();
  const elapsed = (Date.now() - startAt) / 1000;
  const left = Math.max(0, s.timeLimit - elapsed);
  $("timer-num").textContent = Math.ceil(left);
  $("timer-bar").style.width = (100 * left / s.timeLimit) + "%";
  $("timer-bar").classList.toggle("low", left <= 10);
  updateHint(g.word || "", g.round, elapsed);
  if (left <= 0 && net.isDrawer) netEndRound(false, null);
}
function netEndRound(guessed, byName) {
  clearInterval(net.timerId);
  const g = net.game, s = g.settings || net.settings;
  const scores = Object.assign({}, g.scores);
  if (guessed && byName) {
    const pid = Object.keys(net.players).find(id => net.players[id] && net.players[id].name === byName);
    if (pid) scores[pid] = (scores[pid] || 0) + 1;
  }
  const lastRound = g.round >= s.rounds;
  net.gameRef.update({
    phase: lastRound ? "over" : "result",
    scores,
    result: { guessed, by: byName, word: g.word, wordEn: g.wordEn || "" }
  });
}
function netShowResult(g) {
  clearInterval(net.timerId);
  const r = g.result || {};
  $("result-emoji").textContent = r.guessed ? "🎉" : "⏰";
  $("result-title").textContent = r.guessed ? `Point for ${r.by}!` : "Time's up!";
  const answer = r.wordEn ? `"${cap(r.word || "")}" — “${r.wordEn}”` : `"${cap(r.word || "")}"`;
  $("result-sub").textContent = r.guessed
    ? `Nice drawing — ${answer} it was.`
    : `The word was ${answer}. No point this time.`;
  const btn = $("btn-next");
  if (net.isDrawer) {
    btn.style.display = "";
    const ids = Object.keys(net.players);
    const other = ids.find(id => id !== net.pid);
    const otherName = other && net.players[other] ? net.players[other].name : "other player";
    btn.textContent = g.round >= (g.settings || net.settings).rounds ? "See results →" : `Next: ${otherName} draws →`;
  } else {
    btn.style.display = "none";
    $("result-sub").textContent += ` Waiting for ${netDrawerName()}…`;
  }
  show("screen-result");
}
function netNextRound() {
  const g = net.game, s = g.settings || net.settings;
  const ids = Object.keys(net.players);
  const other = ids.find(id => id !== net.pid) || net.pid;
  net.db.ref(`rooms/${net.code}/strokes`).remove();
  net.db.ref(`rooms/${net.code}/guesses`).remove();
  net.gameRef.update({
    phase: "reveal", round: g.round + 1, drawerId: other,
    word: "", wordCat: "", wordEn: "", result: null, roundStartAt: 0
  });
}
function netSkip() {
  if (net.isDrawer) netEndRound(false, null);
}
function netShowOver(g) {
  clearInterval(net.timerId);
  const ids = Object.keys(net.players);
  const sc = g.scores || {};
  const rows = ids.map(id => ({ name: (net.players[id] || {}).name || "?", score: sc[id] || 0 }));
  rows.sort((a, b) => b.score - a.score);
  $("over-title").textContent =
    rows.length > 1 && rows[0].score === rows[1].score ? "It's a tie! 🤝" : `${rows[0].name} wins!`;
  $("over-scores").innerHTML = rows.map(r =>
    `<div class="frow"><span>${r.name}</span><b>${r.score}</b></div>`).join("");
  const again = $("btn-again");
  if (net.isHost) {
    again.style.display = "";
    again.textContent = "Play again";
    $("over-wait").classList.add("hidden");
  } else {
    again.style.display = "none";
    $("over-wait").classList.remove("hidden");
  }
  $("btn-new").textContent = "Leave room";
  show("screen-over");
}
function netPlayAgain() {
  if (!net.isHost) return;
  net.db.ref(`rooms/${net.code}/strokes`).remove();
  net.db.ref(`rooms/${net.code}/guesses`).remove();
  net.gameRef.set({
    phase: "reveal", round: 1, drawerId: net.pid,
    scores: {}, word: "", wordCat: "", wordEn: "", result: null, roundStartAt: 0,
    settings: net.settings
  });
}

/* ---- strokes + guesses sync ---- */
function netPushStroke(s) {
  net.db.ref(`rooms/${net.code}/strokes`).push({ pts: s.pts, color: s.color, size: s.size });
}
function netClear() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ref = net.db.ref(`rooms/${net.code}/clearCount`);
  ref.transaction(c => (c || 0) + 1);
}
function attachNetListeners() {
  const base = `rooms/${net.code}`;
  // strokes (guesser renders)
  net.db.ref(base + "/strokes").off();
  net.strokes = [];
  if (!net.isDrawer) {
    net.db.ref(base + "/strokes").on("child_added", (s) => {
      const st = s.val();
      net.strokes.push(st);
      drawStrokeOnCanvas(st);
    });
    net.db.ref(base + "/clearCount").off();
    net.db.ref(base + "/clearCount").on("value", (s) => {
      if (s.val() > 0) {
        net.strokes = [];
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  }
  // guesses (both render feed; drawer judges)
  net.db.ref(base + "/guesses").off();
  net.db.ref(base + "/guesses").on("child_added", (s) => {
    const gu = s.val();
    if (!gu) return;
    addGuessFeed(gu);
    if (net.isDrawer && net.game && net.game.phase === "draw" && !gu.correct) {
      if (normTxt(gu.text) === normTxt(net.game.word)) {
        net.db.ref(base + "/guesses/" + s.key).update({ correct: true });
        netEndRound(true, gu.name);
      }
    }
  });
}
function netRedrawGuesser() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  (net.strokes || []).forEach(drawStrokeOnCanvas);
}
function addGuessFeed(gu) {
  const feed = $("guess-feed");
  const div = document.createElement("div");
  div.className = "guess" + (gu.correct ? " correct" : "");
  div.textContent = `${gu.name}: ${gu.text}`;
  feed.appendChild(div);
  while (feed.children.length > 30) feed.removeChild(feed.firstChild);
  feed.scrollTop = feed.scrollHeight;
}
function submitGuess() {
  const inp = $("guess-input");
  const text = inp.value.trim();
  if (!text) return;
  if (state.mode === "aidraw" && !net.active) { aidrawGuess(); return; }
  if (!net.active) return;
  net.db.ref(`rooms/${net.code}/guesses`).push({ name: net.name, text, correct: false, ts: Date.now() });
  inp.value = "";
}
$("btn-guess").addEventListener("click", submitGuess);
$("guess-input").addEventListener("keydown", (e) => { if (e.key === "Enter") submitGuess(); });

/* ================= init ================= */
buildCatChecks();
buildOnlineCatChecks();
buildColors();
pillGroup("rounds-pills", v => state.rounds = v);
pillGroup("time-pills", v => state.timeLimit = v);
window.addEventListener("resize", () => {
  if ($("screen-draw").classList.contains("active")) sizeCanvas();
});
// join via ?room=CODE
(() => {
  const m = location.search.match(/[?&]room=([A-Za-z0-9]{4})/);
  if (m && initFirebase()) {
    show("screen-online");
    $("join-code").value = m[1].toUpperCase();
  }
})();
