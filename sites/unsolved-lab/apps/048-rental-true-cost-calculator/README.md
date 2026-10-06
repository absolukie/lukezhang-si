# TrueRent — True-Cost Calculator

**One-liner:** Realistic monthly housing cost beyond rent.

## Startup thesis
Headline rent lies — parking, utilities, insurance, and commute routinely add 30%+. The calculator is top-of-funnel content marketing; the business is lead-gen to movers, insurers, and ISPs at the moment of comparison.

## Architecture
Single index.html. Rent slider + 8 toggleable cost line-items with sliders; true total recomputed live with donut breakdown and annualized view. Head-to-head mode compares two seeded listings on true cost and declares a verdict. All client-side, instant.

## Magic moment
Drag sliders and watch $2,400 become $3,180 — then the head-to-head reveals the 'cheaper' apartment actually costs more.

## Monetization
Lead-gen: movers/insurance/ISP affiliate revenue at comparison moment; landlord API to publish certified true-cost badges ($49/mo).

## Known limitations
Cost defaults are Bay-Area-flavored estimates; commute cost is a rough input; no geocoded utility-rate lookup.

## Next 3 features
1. Address-based utility + insurance rate lookup
2. Commute cost from real route + transit fares
3. Save/share comparisons; landlord true-cost certification
