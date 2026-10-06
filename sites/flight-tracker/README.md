# Live Flight Map

An interactive web app showing **real-time aircraft traffic** around major US airports
(SFO, LAX, JFK, ORD, ATL, DFW, … — 30 airports included).

Click any airport (on the map or in the sidebar) to see live planes in the area:
positions, callsigns, altitude, speed, heading, short flight trails, and summary stats.
Data auto-refreshes every 20 seconds.

## Data source

[OpenSky Network](https://opensky-network.org) — free, crowdsourced ADS-B data, no API key required.
The app fetches `https://opensky-network.org/api/states/all` with a bounding box around the
selected airport. If the browser blocks the direct request, it automatically retries through a
public CORS proxy.

Note: anonymous OpenSky access is rate-limited. If you hit limits, the app shows a retry banner.
OpenSky offers free OAuth credentials for higher limits — see their docs.

## Run it

Just open `index.html` in a browser, or serve the folder:

```bash
cd live-flight-map
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy free on GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → branch `main`, folder `/` (or `/live-flight-map`).
3. Open the published URL — live data loads directly in the visitor's browser.

## Files

- `index.html` — page structure
- `styles.css` — dark theme
- `app.js` — map, airport list, OpenSky fetching, plane rendering

Map tiles: © OpenStreetMap contributors © CARTO. Built with [Leaflet](https://leafletjs.com).
