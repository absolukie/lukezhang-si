# Obligation Graph

**Concept:** Obligation Graph
**One-liner:** Turn contracts into obligations, deadlines, renewals, SLAs, responsibilities.
**Startup thesis:** Contracts are write-only: nobody re-reads the MSA until the auto-renewal bites. Parsing agreements into a live obligation graph with renewal tripwires turns legal paper into operational data.

## Architecture
Single-file client app. A clause splitter finds numbered sections; 12 extraction rules (regex over clause text) pull out term, auto-renewal, fees, SLA, support, breach-notification, termination, liability cap, and governing law — each tagged with who owes it and severity. Outputs: a radial obligation graph, a critical-dates timeline, a searchable obligation table, and a clause viewer where clicking any row scrolls to and flashes the source clause. The 60-day non-renewal tripwire is flagged as a prominent alert.

## Magic moment
Paste the demo MSA, hit Analyze, and the buried §1 auto-renewal surfaces as a red alert: "60 days' written notice before Sep 30, 2027 or you're locked in another year" — with one click to the clause.

## Monetization
$49/mo per company for contract intake + renewal alerts; legal-ops API; white-label for procurement platforms.

## Known limitations
Extraction is regex rules tuned to the demo MSA's phrasing; exotic drafting will miss. Not legal advice — attorney review mode is on the roadmap.

## Next 3 features
1. Clause-level NLP for arbitrary contract language.
2. Renewal calendar sync (Google/Outlook) with 90/60/30-day warnings.
3. Redline suggestions ("ask for 30-day non-renewal instead of 60").
