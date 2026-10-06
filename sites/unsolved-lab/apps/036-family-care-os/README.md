# Kinship

**Concept:** Family Care OS  
**Category:** Aging / Caregiving

**One-liner:** Command center for an aging parent: today's agenda, who's covering what, meds, tasks, bills.

## Startup thesis
Caring for an aging parent is a distributed ops job run over text threads. A shared command center — agenda, coverage, meds, tasks, bills — ends the "I thought you were handling that" era. Land via adult children, expand to home-care agencies.

## Architecture
Single `index.html`. Med/task checklists persist in localStorage via `Kit.store`; KPIs and progress bars derive live from state; `Kit.timeline` renders today's agenda.

## Magic moment
Check off the last evening med — the progress bar fills and the KPI flips to "All done ✓".

## Monetization
$14.99/mo per family; $29/mo agency tier with multi-client dashboard + aide scheduling.

## Known limitations
Fictional demo family; single-day view; no real calendar sync or bill-pay.

## Next 3 features
1. Two-way calendar sync (Google/Apple) for appointments.
2. Bill tracking with due-date nudges.
3. Aide shift scheduling + payroll export.

