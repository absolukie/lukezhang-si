# Care Circle — Respite Coordinator

**One-liner:** Distribute caregiving duties across family and helpers.

## Startup thesis
40M+ unpaid family caregivers burn out because coverage is coordinated in group texts. A shared, fairness-aware coverage calendar is the wedge; the platform becomes the OS for family care (scheduling, payments to aides, respite marketplaces).

## Architecture
Single index.html. Seeded family roster with per-day/per-slot availability matrix. Greedy auto-builder assigns 21 weekly shifts minimizing per-person load variance; click any slot to reassign from available members. State in localStorage via Kit.store. Renders with Kit.nav/kpi/bars/table/modal.

## Magic moment
Tap 'Auto-build week' and all 21 shifts fill instantly — respecting real availability, flagging open shifts, and naming the busiest caregiver.

## Monetization
Freemium: free for families; $8/mo 'Circle Plus' for backup-aide marketplace access, schedule SMS reminders, and multi-elder coordination.

## Known limitations
Greedy assignment isn't optimal for large teams; availability is self-reported (no calendar sync); single-elder only; demo data seeded locally.

## Next 3 features
1. Two-way SMS/email shift reminders and confirmations
2. Backup aide marketplace for open shifts
3. Fairness engine v2: skill matching (meds, driving) + true optimization
