import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';

const TRANSFORMERS_VERSION = '3.5.1';

const MODELS = {
  tiny: { id: 'Xenova/whisper-tiny.en', label: 'Fast', size: '~75 MB' },
  base: { id: 'Xenova/whisper-base.en', label: 'Accurate', size: '~150 MB' },
};
const MAX_REC_SECS = 300; // 5-minute hard cap per recording
const LS_SETTINGS = 'dp_settings_v1';
const LS_HISTORY  = 'dp_history_v1';
const LS_ONBOARD  = 'dp_onboarded_v1';

// ---------- tiny dom helpers ----------
const $ = (id) => document.getElementById(id);
const statusPill = $('statusPill'), statusText = $('statusText');
const micBtn = $('micBtn'), micLabel = $('micLabel'), micZone = $('micZone');
const meter = $('meter'), meterFill = $('meterFill');
const ta = $('transcript');

let toastT = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- settings ----------
let settings = { model: 'tiny' };
try { Object.assign(settings, JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}')); } catch (_) {}
if (!MODELS[settings.model]) settings.model = 'tiny';
function saveSettings() { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }

// ---------- status ----------
function setStatus(kind, text) {
  statusPill.className = 'status ' + kind;
  statusText.innerHTML = text;
}

// ---------- history ----------
let history = [];
try { history = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch (_) { history = []; }
function saveHistory() { localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 50))); }
function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay ? time : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + time;
}
function renderHistory() {
  const list = $('historyList');
  list.innerHTML = '';
  $('clearAllBtn').hidden = history.length === 0;
  if (!history.length) {
    list.innerHTML = '<p class="empty-hint" style="margin:4px 0">Nothing yet — your dictations will land here.</p>';
    return;
  }
  history.forEach((h) => {
    const item = document.createElement('div');
    item.className = 'hist-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    const snippet = (h.text || '').trim().split('\n')[0] || '(empty)';
    item.innerHTML =
      '<div class="txt"><div class="snippet"></div><div class="meta"></div></div>' +
      '<button class="hist-del" aria-label="Delete entry">×</button>';
    item.querySelector('.snippet').textContent = snippet;
    item.querySelector('.meta').textContent =
      fmtTime(h.ts) + ' · ' + h.secs + 's' + (MODELS[h.model] ? ' · ' + MODELS[h.model].label : '');
    const load = () => { ta.value = h.text || ''; ta.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); toast('Loaded into transcript'); };
    item.addEventListener('click', (e) => { if (!e.target.classList.contains('hist-del')) load(); });
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); } });
    item.querySelector('.hist-del').addEventListener('click', (e) => {
      e.stopPropagation();
      history = history.filter((x) => x.id !== h.id);
      saveHistory(); renderHistory(); toast('Deleted');
    });
    list.appendChild(item);
  });
}
let clearAllArmed = false, clearAllT = null;
$('clearAllBtn').addEventListener('click', () => {
  const b = $('clearAllBtn');
  if (!clearAllArmed) {
    clearAllArmed = true; b.classList.add('armed'); b.textContent = 'Tap again to confirm';
    clearAllT = setTimeout(() => { clearAllArmed = false; b.classList.remove('armed'); b.textContent = 'Clear all history'; }, 3000);
  } else {
    clearTimeout(clearAllT); clearAllArmed = false;
    b.classList.remove('armed'); b.textContent = 'Clear all history';
    history = []; saveHistory(); renderHistory(); toast('History cleared');
  }
});

// ---------- transcript actions ----------
$('copyBtn').addEventListener('click', async () => {
  const t = ta.value;
  if (!t.trim()) { toast('Nothing to copy yet'); return; }
  try { await navigator.clipboard.writeText(t); toast('Copied — paste it anywhere'); }
  catch (_) {
    ta.focus(); ta.select();
    try { document.execCommand('copy'); toast('Copied — paste it anywhere'); }
    catch (_) { toast('Copy failed — select the text manually'); }
  }
});
let clearArmed = false, clearT = null;
$('clearBtn').addEventListener('click', () => {
  const b = $('clearBtn');
  if (!ta.value) return;
  if (!clearArmed) {
    clearArmed = true; b.classList.add('armed'); b.textContent = 'Sure?';
    clearT = setTimeout(() => { clearArmed = false; b.classList.remove('armed'); b.textContent = 'Clear'; }, 3000);
  } else {
    clearTimeout(clearT); clearArmed = false;
    b.classList.remove('armed'); b.textContent = 'Clear';
    ta.value = ''; toast('Cleared');
  }
});

// ---------- settings sheet ----------
function syncModelUI() {
  $('optTiny').classList.toggle('sel', settings.model === 'tiny');
  $('optBase').classList.toggle('sel', settings.model === 'base');
  document.querySelector('input[name="model"][value="' + settings.model + '"]').checked = true;
}
document.querySelectorAll('input[name="model"]').forEach((r) => {
  r.addEventListener('change', async () => {
    if (recording || transcribing) { toast('Finish the current recording first'); syncModelUI(); return; }
    settings.model = r.value; saveSettings(); syncModelUI();
    toast('Switched to ' + MODELS[settings.model].label + ' — loading…');
    try { await ensureModel(); toast(MODELS[settings.model].label + ' model ready'); }
    catch (e) { /* status already shows the error */ }
  });
});
$('settingsBtn').addEventListener('click', () => { syncModelUI(); document.body.classList.add('sheet-open'); });
$('sheetBack').addEventListener('click', () => document.body.classList.remove('sheet-open'));

// ---------- onboarding ----------
if (!localStorage.getItem(LS_ONBOARD)) $('onbBack').hidden = false;
$('onbGo').addEventListener('click', () => {
  localStorage.setItem(LS_ONBOARD, '1');
  $('onbBack').hidden = true;
});

// ---------- model loading ----------
let transcriber = null, loadedModelKey = null, loadingPromise = null;

function dlProgressUI(pct, label) {
  $('dlWrap').hidden = pct == null;
  if (pct != null) {
    $('dlFill').style.width = Math.round(pct * 100) + '%';
    $('dlText').textContent = label || ('Downloading model ' + Math.round(pct * 100) + '%…');
  }
}

async function ensureModel() {
  if (transcriber && loadedModelKey === settings.model) return transcriber;
  if (loadingPromise) return loadingPromise;
  const key = settings.model, id = MODELS[key].id;
  setStatus('busy', 'Downloading model <span class="sub">' + MODELS[key].size + ' — first time only</span>');
  micBtn.disabled = true;
  loadingPromise = (async () => {
    const onProgress = (p) => {
      if (p.status === 'progress') {
        const pct = Math.round((p.progress || 0) * 100);
        const file = (p.file || '').split('/').pop();
        setStatus('busy', 'Downloading model <span class="sub">' + pct + '% · ' + file + '</span>');
        dlProgressUI(p.progress, 'Downloading ' + file + ' — ' + pct + '%');
      } else if (p.status === 'done') {
        dlProgressUI(null);
      }
    };
    if (transcriber) { try { await transcriber.dispose(); } catch (_) {} transcriber = null; }
    // Prefer WebGPU where available; fall back silently to WASM.
    try {
      transcriber = await pipeline('automatic-speech-recognition', id, { device: 'webgpu', progress_callback: onProgress });
    } catch (_) {
      transcriber = await pipeline('automatic-speech-recognition', id, { progress_callback: onProgress });
    }
    loadedModelKey = key;
    dlProgressUI(null);
    setStatus('ready', 'Ready <span class="sub">· ' + MODELS[key].label + ' model · tap the mic</span>');
    micBtn.disabled = false;
    micLabel.textContent = 'Tap the mic to dictate';
    return transcriber;
  })();
  try { return await loadingPromise; }
  catch (e) {
    console.error('model load failed', e);
    setStatus('error', 'Model failed to load <span class="sub">· check your connection, then tap the mic to retry</span>');
    dlProgressUI(null);
    micBtn.disabled = false;
    micLabel.textContent = 'Tap the mic to retry';
    throw e;
  } finally { loadingPromise = null; }
}

// ---------- recording ----------
let recording = false, transcribing = false;
let mediaStream = null, mediaRecorder = null, chunks = [];
let audioCtx = null, analyser = null, rafId = null;
let recStart = 0, timerId = null, autoStopId = null;

function fmtDur(s) { return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }

function startMeter() {
  const AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();
  const src = audioCtx.createMediaStreamSource(mediaStream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  meter.hidden = false;
  micZone.classList.add('recording-row');
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
    meterFill.style.width = Math.min(100, Math.round(peak * 220)) + '%';
    rafId = requestAnimationFrame(tick);
  };
  tick();
}
function stopMeter() {
  cancelAnimationFrame(rafId);
  meter.hidden = true; meterFill.style.width = '0%';
  micZone.classList.remove('recording-row');
  if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
}

async function startRecording() {
  try { await ensureModel(); }
  catch (_) { return; } // status already explains
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (_) {
    setStatus('error', 'Microphone blocked <span class="sub">· allow mic access in Settings → Safari → Microphone</span>');
    toast('Microphone permission was denied');
    return;
  }
  mediaStream = stream;
  let mimeType = '';
  if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
  try {
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  } catch (_) {
    stream.getTracks().forEach((t) => t.stop());
    toast('Recording is not supported in this browser');
    return;
  }
  chunks = [];
  mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  mediaRecorder.onstop = onRecorderStopped;
  mediaRecorder.start(250);
  recording = true;
  recStart = Date.now();
  micBtn.classList.add('recording');
  micBtn.setAttribute('aria-label', 'Stop recording');
  $('micIcon').innerHTML = '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/>';
  setStatus('recording', 'Recording…');
  micLabel.textContent = '0:00 — tap to stop';
  timerId = setInterval(() => { micLabel.textContent = fmtDur((Date.now() - recStart) / 1000) + ' — tap to stop'; }, 250);
  autoStopId = setTimeout(() => { if (recording) { stopRecording(); toast('Stopped at the 5-minute cap'); } }, MAX_REC_SECS * 1000);
  startMeter();
}

function stopRecording() {
  if (!recording || !mediaRecorder) return;
  recording = false;
  clearInterval(timerId); clearTimeout(autoStopId);
  stopMeter();
  setStatus('busy', 'Finishing recording…');
  micLabel.textContent = 'Working…';
  try { mediaRecorder.stop(); } catch (_) { onRecorderStopped(); }
  if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
}

async function to16kMono(arrayBuffer) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  try {
    const buf = await ac.decodeAudioData(arrayBuffer.slice(0));
    const len = Math.max(1, Math.ceil(buf.duration * 16000));
    const off = new OfflineAudioContext(1, len, 16000);
    const src = off.createBufferSource();
    src.buffer = buf; src.connect(off.destination); src.start(0);
    const out = await off.startRendering();
    return out.getChannelData(0);
  } finally { ac.close().catch(() => {}); }
}

async function onRecorderStopped() {
  const secs = Math.round((Date.now() - recStart) / 1000);
  micBtn.classList.remove('recording');
  micBtn.setAttribute('aria-label', 'Start recording');
  $('micIcon').innerHTML = '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/>';
  const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/mp4' });
  chunks = [];
  if (!blob.size) {
    setStatus('ready', 'Ready <span class="sub">· tap the mic</span>');
    micLabel.textContent = 'Tap the mic to dictate';
    return;
  }
  transcribing = true;
  micBtn.disabled = true;
  setStatus('busy', 'Transcribing <span class="sub">· on your phone, takes a few seconds</span>');
  micLabel.textContent = 'Transcribing…';
  try {
    const float32 = await to16kMono(await blob.arrayBuffer());
    const t = await ensureModel();
    const out = await t(float32, { chunk_length_s: 30, stride_length_s: 5 });
    const text = (out.text || '').trim();
    ta.value = text ? (ta.value ? ta.value.replace(/\s+$/, '') + ' ' + text : text) : ta.value;
    if (text) {
      history.unshift({ id: Date.now(), ts: Date.now(), model: settings.model, text, secs });
      saveHistory(); renderHistory();
      toast('Transcribed — saved to history');
    } else {
      toast('Could not hear any speech');
    }
  } catch (e) {
    console.error('transcribe failed', e);
    toast('Transcription failed — try a shorter clip');
  } finally {
    transcribing = false;
    micBtn.disabled = false;
    setStatus('ready', 'Ready <span class="sub">· ' + MODELS[settings.model].label + ' model · tap the mic</span>');
    micLabel.textContent = 'Tap the mic to dictate';
  }
}

micBtn.addEventListener('click', () => {
  if (transcribing) return;
  recording ? stopRecording() : startRecording();
});

// ---------- service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ---------- init ----------
renderHistory();
if (localStorage.getItem(LS_ONBOARD)) {
  // Warm the model cache quietly in the background so the first tap is instant.
  // Failures are silent here; ensureModel() will retry with UI on tap.
  ensureModel().catch(() => {});
} else {
  setStatus('ready', 'Welcome <span class="sub">· tap the mic when ready</span>');
}
console.log('[dictation-pad] transformers.js v' + TRANSFORMERS_VERSION);
