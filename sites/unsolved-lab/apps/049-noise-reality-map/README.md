# HushHunt — Noise Map

**One-liner:** Estimate actual noise around potential homes.

## Startup thesis
Noise is the #1 post-move regret and listings never disclose it. Modeled dB-by-hour from flight paths, freight schedules, and traffic is the wedge; the data layer (block-level quiet scores) licenses to portals like Zillow.

## Architecture
Single index.html. Two seeded apartments with deterministic 24h dB profiles (SJC flight-path peaks vs 3:40am freight horn). SVG line chart via Kit.line with toggleable series, day/night/peak stats, WHO-guideline comparison table, and a quietest-8h-window solver shown in a modal.

## Magic moment
'Find quietest 8h window' solves the sleep schedule — and reveals the freight horn lands inside every window.

## Monetization
Free consumer tool; B2B quiet-score API for listing portals ($0.02/lookup at volume); sponsored 'verified quiet' building badges.

## Known limitations
Profiles are modeled estimates, not microphone measurements; only 2 locations seeded; no user-contributed readings.

## Next 3 features
1. Crowdsourced phone-mic measurements to calibrate models
2. City-wide quiet-score map with search
3. Landlord 'verified quiet hours' certification
