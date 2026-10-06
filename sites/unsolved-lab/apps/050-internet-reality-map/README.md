# SpeedTruth — Internet Map

**One-liner:** Building-level broadband, cellular, latency, outage, provider intelligence.

## Startup thesis
Advertised speeds are fiction at the building level. Measured-vs-advertised data per address is the wedge; the intelligence layer sells to ISPs (churn defense), landlords (connectivity scores), and remote workers choosing where to live.

## Architecture
Single index.html. Address lookup deterministically generates provider cards (seeded by address hash): advertised vs measured bars, latency, outage counts, and an outage-history timeline. Verdict engine recommends the best provider with the 'ask the landlord' fiber question.

## Magic moment
Type any address: three providers ranked by measured-not-advertised speed, outage history, and a blunt verdict — cable delivers 52% of its promise here.

## Monetization
Free lookups (rate-limited); ISP analytics dashboard ($499/mo) showing building-level underperformance; landlord connectivity certification.

## Known limitations
Measurements are deterministically simulated per address (no real speed-test corpus); outage history is modeled; 3 providers seeded.

## Next 3 features
1. Ingest real crowdsourced speed tests (M-Lab / Ookla)
2. Building wiring database (fiber-to-unit vs to-basement)
3. Outage alerts + ISP SLA claim assistance
