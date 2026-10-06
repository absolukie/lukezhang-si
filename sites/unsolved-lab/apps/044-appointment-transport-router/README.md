# RideLine — Transport Router

**One-liner:** Coordinate appointments, rides, mobility devices, caregivers, timing.

## Startup thesis
Medical transport for seniors is a coordination nightmare across clinics, drivers, and mobility needs. The wedge is family-planned multi-appointment days; the business is a dispatch layer that books wheelchair-capable rides with proper loading buffers.

## Architecture
Single index.html. Seeded Tuesday appointments with time windows, a travel-time matrix, and a plan builder that sequences stops, pads wheelchair loading, and flags lateness. 'Optimize route' brute-forces all 6 permutations scoring lateness then total time. Van/sedan toggle recomputes.

## Magic moment
Hit 'Optimize route' — 6 sequences evaluated, the on-time order wins, wheelchair loading buffers appear, and the day's timeline just works.

## Monetization
Free planning; $4/trip or $29/mo dispatch subscription — we book vetted wheelchair-capable drivers and take a margin.

## Known limitations
Travel times are seeded estimates (no live traffic); no real driver booking; single-day, single-passenger scope.

## Next 3 features
1. Live traffic + real ride booking via NEMT partners
2. Recurring appointments (weekly PT) with auto-scheduling
3. Caregiver companion seat + cost splitting
