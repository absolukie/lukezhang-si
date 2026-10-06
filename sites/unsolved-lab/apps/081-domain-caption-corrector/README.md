# TermTune

**Concept:** TermTune
**One-liner:** Transcription that understands specialized terminology, names, acronyms.
**Startup thesis:** Generic speech-to-text mangles domain vocabulary (drug names, dosages, eponyms); a specialty-aware post-processing layer that repairs terms before they reach the chart is a wedge into clinical documentation, legal dictation, and engineering standups.

## Architecture
Single-file client app. A terminology engine runs three passes over raw dictation: (1) frequency-phrase normalization ("twice a day" → "twice daily (BID)"), (2) dosage spacing normalization via regex (`500mg` → `500 mg`), (3) term repair via an alias dictionary plus Levenshtein fuzzy matching (distance ≤ 2) against canonical terms. Corrections render as clickable highlights; each opens a review modal with alternatives. Glossary table is searchable.

## Magic moment
Paste a sloppy medical dictation and watch `metforeman 500mg twice a day` become `metformin 500 mg twice daily (BID)` — then click any highlight to accept or override.

## Monetization
Per-seat SaaS for clinics ($29/provider/mo); API for EHR and scribe vendors priced per corrected minute.

## Known limitations
Demo glossary is 15 terms; production needs per-specialty formularies. Fuzzy matching can over-correct rare words — review modal is the safety valve. No audio ingestion in this build (text in only).

## Next 3 features
1. Microphone dictation with live streaming correction.
2. Per-user learned vocabulary ("Dr. Chen always means X").
3. EHR export (FHIR note payload) with correction audit trail.
