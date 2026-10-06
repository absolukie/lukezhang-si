# FairShare — Load Balancer

**One-liner:** Identify and redistribute unequal caregiving workloads.

## Startup thesis
Caregiving inequality destroys families silently — one sibling does 80% and burns out. Quantifying hours and proposing concrete task moves turns resentment into a plan; the platform can layer paid respite to fill gaps.

## Architecture
Single index.html. Seeded task list with hours, owners, and movability flags. Load index = share vs fair share; fairness score = 100 - CV%. 'Propose rebalance' greedily moves flexible tasks off the overloaded member to nearest-target receivers; apply rewrites assignments. Bars/table/ KPIs via Kit.

## Magic moment
'Propose rebalance' generates a task-by-task move list — apply it and watch Elena drop from 80% to fair share as the fairness score jumps.

## Monetization
Free; $9/mo for ongoing load tracking, burnout-risk alerts, and one-tap booking of vetted respite aides for the gap hours.

## Known limitations
Hours are self-reported estimates; no time-tracking integration; fairness metric is simple CV-based; task list is seeded.

## Next 3 features
1. Passive time tracking (check-in/check-out per task)
2. Burnout-risk model from load trends + self-reported strain
3. Respite aide booking to cover rebalanced gaps
