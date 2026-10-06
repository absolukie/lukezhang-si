# MedLedger
**Concept:** Med Ledger · **Category:** Healthcare Administration

**One-liner:** Maintain a reliable history of medication changes and reasons.

## Startup thesis
'Why did I stop that pill?' has no good answer today. MedLedger is the git log for your meds: every start, stop, and dose change with the reason — plus interaction checks on every new entry.

## Architecture
Vanilla JS + localStorage. Seeded 2-year change history; current-meds derived from starts minus stops; rule-based interaction checker runs on latest change and on new entries; high-severity modal gate; Doctor-visit handoff button renders a one-page summary (current meds, change history with reasons, interaction flags) with Print and Copy actions.

## Magic moment
Magic moment: the latest change (aspirin) immediately shows a Medium interaction warning against lisinopril — the ledger doesn't just record, it watches.

## Monetization
Consumer freemium ($4/mo for family profiles); pharmacy integration; caregiver sharing.

## Known limitations
Interaction rules are a tiny demo set, not a real drug database; not medical advice; manual entry only.

## Next 3 features
1. Full drug-interaction database (First Databank style)
2. Pharmacy fill-history auto-import
3. Family/caregiver sharing view with read-only handoff link

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
