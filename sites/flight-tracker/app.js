/* Live Flight Map — real-time aircraft around major US airports.
 * Data: OpenSky Network (https://opensky-network.org) — free, no key needed.
 * OpenSky state vector fields (index): 0 icao24, 1 callsign, 2 origin_country,
 * 5 longitude, 6 latitude, 7 baro_altitude (m), 8 on_ground, 9 velocity (m/s),
 * 10 true_track (deg), 11 vertical_rate (m/s), 14 squawk.
 */
'use strict';

const AIRPORTS = [
  { iata: 'SFO', name: 'San Francisco Intl', city: 'San Francisco, CA', lat: 37.6213, lon: -122.3790 },
  { iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles, CA', lat: 33.9416, lon: -118.4085 },
  { iata: 'JFK', name: 'John F. Kennedy Intl', city: 'New York, NY', lat: 40.6413, lon: -73.7781 },
  { iata: 'EWR', name: 'Newark Liberty Intl', city: 'Newark, NJ', lat: 40.6895, lon: -74.1745 },
  { iata: 'ORD', name: "O'Hare Intl", city: 'Chicago, IL', lat: 41.9742, lon: -87.9073 },
  { iata: 'MDW', name: 'Midway Intl', city: 'Chicago, IL', lat: 41.7868, lon: -87.7522 },
  { iata: 'ATL', name: 'Hartsfield-Jackson Intl', city: 'Atlanta, GA', lat: 33.6407, lon: -84.4277 },
  { iata: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas, TX', lat: 32.8998, lon: -97.0403 },
  { iata: 'DAL', name: 'Dallas Love Field', city: 'Dallas, TX', lat: 32.8471, lon: -96.8518 },
  { iata: 'DEN', name: 'Denver Intl', city: 'Denver, CO', lat: 39.8561, lon: -104.6737 },
  { iata: 'SEA', name: 'Seattle-Tacoma Intl', city: 'Seattle, WA', lat: 47.4502, lon: -122.3088 },
  { iata: 'PDX', name: 'Portland Intl', city: 'Portland, OR', lat: 45.5898, lon: -122.5951 },
  { iata: 'MIA', name: 'Miami Intl', city: 'Miami, FL', lat: 25.7932, lon: -80.2906 },
  { iata: 'FLL', name: 'Fort Lauderdale Intl', city: 'Fort Lauderdale, FL', lat: 26.0742, lon: -80.1506 },
  { iata: 'MCO', name: 'Orlando Intl', city: 'Orlando, FL', lat: 28.4312, lon: -81.3081 },
  { iata: 'TPA', name: 'Tampa Intl', city: 'Tampa, FL', lat: 27.9755, lon: -82.5332 },
  { iata: 'BOS', name: 'Logan Intl', city: 'Boston, MA', lat: 42.3656, lon: -71.0096 },
  { iata: 'IAD', name: 'Washington Dulles Intl', city: 'Washington, DC', lat: 38.9531, lon: -77.4565 },
  { iata: 'DCA', name: 'Ronald Reagan National', city: 'Washington, DC', lat: 38.8512, lon: -77.0402 },
  { iata: 'CLT', name: 'Charlotte Douglas Intl', city: 'Charlotte, NC', lat: 35.2144, lon: -80.9473 },
  { iata: 'PHX', name: 'Phoenix Sky Harbor Intl', city: 'Phoenix, AZ', lat: 33.4373, lon: -112.0078 },
  { iata: 'LAS', name: 'Harry Reid Intl', city: 'Las Vegas, NV', lat: 36.0840, lon: -115.1537 },
  { iata: 'MSP', name: 'Minneapolis-Saint Paul Intl', city: 'Minneapolis, MN', lat: 44.8848, lon: -93.2223 },
  { iata: 'DTW', name: 'Detroit Metro Wayne County', city: 'Detroit, MI', lat: 42.2162, lon: -83.3554 },
  { iata: 'SLC', name: 'Salt Lake City Intl', city: 'Salt Lake City, UT', lat: 40.7899, lon: -111.9791 },
  { iata: 'SAN', name: 'San Diego Intl', city: 'San Diego, CA', lat: 32.7338, lon: -117.1933 },
  { iata: 'AUS', name: 'Austin-Bergstrom Intl', city: 'Austin, TX', lat: 30.1975, lon: -97.6664 },
  { iata: 'BNA', name: 'Nashville Intl', city: 'Nashville, TN', lat: 36.1302, lon: -86.6774 },
  { iata: 'HOU', name: 'William P. Hobby', city: 'Houston, TX', lat: 29.6454, lon: -95.2789 },
  { iata: 'HNL', name: 'Daniel K. Inouye Intl', city: 'Honolulu, HI', lat: 21.3245, lon: -157.9251 },
];

const OPENSKY = 'https://opensky-network.org/api/states/all';
// OpenSky blocks cross-origin browser requests, so the app falls back through
// public CORS proxies. The first working route is remembered for the session.
const PROXIES = [
  (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
];
const BBOX_LAT = 0.7;   // degrees latitude around airport
const BBOX_LON = 1.0;   // degrees longitude around airport
const REFRESH_MS = 20000;
const TRAIL_POINTS = 6;

const MS_TO_KT = 1.94384;
const M_TO_FT = 3.28084;
const MS_TO_FPM = 196.85;

// ---------- state ----------
let map;
let planeLayer, trailLayer;
let airportMarkers = {};
let planeMarkers = {};   // icao24 -> L.Marker
let trailLines = {};     // icao24 -> L.Polyline
let trailPts = {};       // icao24 -> [[lat, lon], ...]
let selected = 'SFO';
let proxyIndex = -1;     // -1 = direct fetch; >=0 = index into PROXIES of the working proxy
let refreshTimer = null;
let loading = false;

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function fmtInt(n) { return n == null ? '—' : Math.round(n).toLocaleString('en-US'); }
function fmtAlt(m) { return m == null ? '—' : fmtInt(m * M_TO_FT) + ' ft'; }
function fmtSpd(ms) { return ms == null ? '—' : fmtInt(ms * MS_TO_KT) + ' kt'; }
function fmtVs(ms) {
  if (ms == null) return '—';
  const fpm = Math.round(ms * MS_TO_FPM);
  return (fpm > 0 ? '+' : '') + fpm.toLocaleString('en-US') + ' fpm';
}
function colorFor(s) {
  if (s[8]) return '#9aa0a6';                    // on ground
  const ft = (s[7] || 0) * M_TO_FT;
  if (ft < 10000) return '#fbbc04';
  if (ft < 30000) return '#34d399';
  return '#38bdf8';
}
function planeIcon(track, color) {
  const rot = track == null ? 0 : track;
  return L.divIcon({
    className: 'plane-marker',
    html: `<svg width="22" height="22" viewBox="0 0 24 24" style="transform: rotate(${rot}deg); display:block;">` +
          `<path d="M12 2 L19 21 L12 16 L5 21 Z" fill="${color}" stroke="#0b0e14" stroke-width="1.2"/></svg>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
function airportByIata(iata) { return AIRPORTS.find((a) => a.iata === iata); }
function bboxFor(a) {
  return [
    Math.max(-90, a.lat - BBOX_LAT), a.lon - BBOX_LON,
    Math.min(90, a.lat + BBOX_LAT), a.lon + BBOX_LON,
  ];
}

// ---------- data ----------
async function fetchStates(bbox) {
  const q = `lamin=${bbox[0].toFixed(3)}&lomin=${bbox[1].toFixed(3)}&lamax=${bbox[2].toFixed(3)}&lomax=${bbox[3].toFixed(3)}`;
  const direct = `${OPENSKY}?${q}`;
  // Build the attempt list: reuse the last working route first, then try the rest.
  const attempts = [];
  if (proxyIndex >= 0) {
    attempts.push({ url: PROXIES[proxyIndex](direct), via: 'proxy' });
  } else {
    attempts.push({ url: direct, via: 'direct' });
  }
  PROXIES.forEach((p, i) => {
    if (i !== proxyIndex) attempts.push({ url: p(direct), via: 'proxy' });
  });

  let lastErr = null;
  for (const a of attempts) {
    try {
      const res = await fetch(a.url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json || !Array.isArray(json.states)) throw new Error('bad response');
      proxyIndex = a.via === 'direct' ? -1 : PROXIES.findIndex((p) => p(direct) === a.url);
      setConnBadge(a.via === 'direct' ? 'live' : 'proxy');
      return json.states;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('fetch failed');
}

function setConnBadge(mode) {
  const b = $('conn-badge');
  b.classList.remove('ok', 'warn');
  if (mode === 'live') { b.textContent = 'live data'; b.classList.add('ok'); }
  else if (mode === 'proxy') { b.textContent = 'live data (proxy)'; b.classList.add('warn'); }
  else { b.textContent = 'connecting…'; }
}

function showBanner(html) {
  const b = $('banner');
  b.innerHTML = html;
  b.classList.remove('hidden');
}
function hideBanner() { $('banner').classList.add('hidden'); }

// ---------- rendering ----------
function renderAirportList(filter) {
  const ul = $('airport-list');
  ul.innerHTML = '';
  const f = (filter || '').trim().toUpperCase();
  AIRPORTS
    .filter((a) => !f || a.iata.includes(f) || a.name.toUpperCase().includes(f) || a.city.toUpperCase().includes(f))
    .forEach((a) => {
      const li = document.createElement('li');
      li.className = 'airport-row' + (a.iata === selected ? ' active' : '');
      li.innerHTML = `<span class="iata">${a.iata}</span>` +
        `<span class="airport-meta"><span class="airport-name">${a.name}</span><br/><span class="airport-city">${a.city}</span></span>`;
      li.addEventListener('click', () => selectAirport(a.iata, true));
      ul.appendChild(li);
    });
}

function renderPlanes(states) {
  const seen = new Set();
  let airborne = 0, ground = 0, altSum = 0, altN = 0, maxSpd = 0;

  for (const s of states) {
    const [icao, callsign, , , , lon, lat, baroAlt, onGround, vel, track, vs] = s;
    if (lat == null || lon == null) continue;
    seen.add(icao);

    if (onGround) ground++; else airborne++;
    if (baroAlt != null && !onGround) { altSum += baroAlt; altN++; }
    if (vel != null && vel > maxSpd) maxSpd = vel;

    const color = colorFor(s);
    const key = icao;
    if (planeMarkers[key]) {
      planeMarkers[key].setLatLng([lat, lon]);
      planeMarkers[key].setIcon(planeIcon(track, color));
    } else {
      const m = L.marker([lat, lon], { icon: planeIcon(track, color) });
      const cs = (callsign || '').trim() || '(no callsign)';
      m.bindPopup(
        `<b>${cs}</b><br/>` +
        `ICAO24: ${icao}<br/>` +
        `Altitude: ${fmtAlt(baroAlt)}<br/>` +
        `Speed: ${fmtSpd(vel)}<br/>` +
        `Heading: ${track == null ? '—' : Math.round(track) + '°'}<br/>` +
        `Vertical: ${fmtVs(vs)}<br/>` +
        `Squawk: ${s[14] || '—'}${onGround ? '<br/>On ground' : ''}`
      );
      m.addTo(planeLayer);
      planeMarkers[key] = m;
    }

    // trail
    const pts = trailPts[key] || [];
    pts.push([lat, lon]);
    if (pts.length > TRAIL_POINTS) pts.shift();
    trailPts[key] = pts;
    if (pts.length > 1) {
      if (trailLines[key]) trailLines[key].setLatLngs(pts);
      else {
        trailLines[key] = L.polyline(pts, { color, weight: 1.5, opacity: 0.45, interactive: false });
        trailLines[key].addTo(trailLayer);
      }
    }
  }

  // remove planes that left the area
  for (const key of Object.keys(planeMarkers)) {
    if (!seen.has(key)) {
      planeLayer.removeLayer(planeMarkers[key]);
      delete planeMarkers[key];
      if (trailLines[key]) { trailLayer.removeLayer(trailLines[key]); delete trailLines[key]; }
      delete trailPts[key];
    }
  }

  // stats
  $('stats').classList.remove('hidden');
  $('stat-airborne').textContent = fmtInt(airborne);
  $('stat-ground').textContent = fmtInt(ground);
  $('stat-alt').textContent = altN ? fmtInt((altSum / altN) * M_TO_FT) + ' ft' : '—';
  $('stat-speed').textContent = maxSpd ? fmtInt(maxSpd * MS_TO_KT) + ' kt' : '—';

  // flight list (top 40 by altitude)
  const sorted = states
    .filter((s) => s[6] != null && s[5] != null)
    .sort((a, b) => (b[7] || 0) - (a[7] || 0))
    .slice(0, 40);
  $('flight-count').textContent = `(${states.length})`;
  const fl = $('flight-list');
  fl.innerHTML = '';
  if (!sorted.length) {
    fl.innerHTML = '<li class="muted">No flights in range right now.</li>';
    return;
  }
  for (const s of sorted) {
    const cs = (s[1] || '').trim() || s[0].toUpperCase();
    const li = document.createElement('li');
    li.className = 'flight-row';
    li.innerHTML = `<span class="callsign">${cs}</span><span class="flight-sub">${fmtAlt(s[7])} · ${fmtSpd(s[9])}</span>`;
    li.addEventListener('click', () => {
      map.flyTo([s[6], s[5]], Math.max(map.getZoom(), 10), { duration: 0.8 });
      const m = planeMarkers[s[0]];
      if (m) setTimeout(() => m.openPopup(), 850);
    });
    fl.appendChild(li);
  }
}

function clearPlanes() {
  planeLayer.clearLayers();
  trailLayer.clearLayers();
  planeMarkers = {};
  trailLines = {};
  trailPts = {};
}

// ---------- selection & refresh ----------
async function refresh() {
  if (loading) return;
  const a = airportByIata(selected);
  if (!a) return;
  loading = true;
  $('refresh-btn').disabled = true;
  try {
    hideBanner();
    const states = await fetchStates(bboxFor(a));
    renderPlanes(states);
    const t = new Date();
    $('updated').textContent = 'updated ' + t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    setConnBadge('error');
    showBanner(`Couldn’t reach live flight data (${e.message || 'network error'}). ` +
      `<button type="button" id="retry-btn">Retry</button>`);
    const rb = $('retry-btn');
    if (rb) rb.addEventListener('click', refresh);
  } finally {
    loading = false;
    $('refresh-btn').disabled = false;
  }
}

function selectAirport(iata, fly) {
  selected = iata;
  const a = airportByIata(iata);
  renderAirportList($('airport-search').value);
  for (const [code, marker] of Object.entries(airportMarkers)) {
    marker.setIcon(airportPillIcon(code, code === iata));
  }
  $('flights-heading').firstChild.textContent = `Flights around ${iata} `;
  if (fly) map.flyTo([a.lat, a.lon], 9, { duration: 1.0 });
  clearPlanes();
  refresh();
}

function airportPillIcon(iata, active) {
  return L.divIcon({
    className: '',
    html: `<div class="airport-pill${active ? ' active' : ''}">${iata}</div>`,
    iconSize: null,
  });
}

function restartAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
  if ($('autorefresh').checked) {
    refreshTimer = setInterval(() => {
      if (!document.hidden) refresh();
    }, REFRESH_MS);
  }
}

// ---------- init ----------
function init() {
  map = L.map('map', { zoomControl: true }).setView([37.6213, -122.3790], 9);
  // Esri dark-gray basemap: free, no API key required.
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  }).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
  }).addTo(map);

  planeLayer = L.layerGroup().addTo(map);
  trailLayer = L.layerGroup().addTo(map);

  for (const a of AIRPORTS) {
    const m = L.marker([a.lat, a.lon], { icon: airportPillIcon(a.iata, a.iata === selected) });
    m.bindTooltip(`${a.iata} — ${a.name}`, { direction: 'top', offset: [0, -8] });
    m.on('click', () => selectAirport(a.iata, true));
    m.addTo(map);
    airportMarkers[a.iata] = m;
  }

  renderAirportList('');
  $('airport-search').addEventListener('input', (e) => renderAirportList(e.target.value));
  $('refresh-btn').addEventListener('click', refresh);
  $('autorefresh').addEventListener('change', restartAutoRefresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

  selectAirport('SFO', false);
  restartAutoRefresh();
}

document.addEventListener('DOMContentLoaded', init);
