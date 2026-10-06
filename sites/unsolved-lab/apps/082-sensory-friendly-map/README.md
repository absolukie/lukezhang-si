# Sensory Map

**Concept:** Sensory Map
**One-liner:** Map crowding, noise, lighting, seating, bathrooms, sensory conditions.
**Startup thesis:** Google Maps optimizes for distance; neurodivergent people, migraine sufferers, and parents optimize for sensory load. A map layer scoring venues on noise, lighting, crowding-by-hour, seating, and bathrooms owns an underserved planning moment.

## Architecture
Single-file client app. Ten seeded venues in fictional Maplewood carry sensory profiles (noise 1–5, lighting harshness, seating count, bathrooms, fluorescent yes/no, quiet hours, per-hour crowd levels). A scoring function weights crowd-at-selected-hour, noise, and lighting into a 0–99 calm score; filters exclude venues that violate hard needs. SVG street map with color-coded pins; ranked list with per-venue breakdown.

## Magic moment
Set "Saturday 8 AM" with fluorescent lighting excluded and watch Greenway Market surface at 93 — co-op, cork floors, no music before 9 AM. A 3-question calibration quiz tunes the scoring weights to your sensitivities.

## Monetization
Venue "sensory verified" badges (SaaS for retailers); affiliate bookings for quiet-hour slots; API for accessibility trip planners.

## Known limitations
Fictional demo town; real product needs community-verified venue data and live crowd signals. Scoring weights are fixed, not personalized.

## Next 3 features
1. Personal calibration quiz that tunes the scoring weights.
2. Live busyness feed + "leave now for the quiet window" nudges.
3. Community reports with photo verification of lighting/seating.
