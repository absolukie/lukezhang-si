# PlainNote

**Concept:** Note Translator  
**Category:** Healthcare Administration

**One-liner:** Click any jargon in a medical note for a plain-English explanation linked to its source line.

## Startup thesis
Patients can't act on notes they can't read. A translator that explains jargon *in place* while preserving a link to the source line builds the trust that pure AI summaries destroy — sell to patient portals and post-visit outreach tools.

## Architecture
Single `index.html`. A glossary map drives term highlighting via regex; popovers position from the clicked term's bounding rect and link back to numbered source lines.

## Magic moment
Click **SOB** in the note — the popover explains it plainly and offers "jump to line" back to the source.

## Monetization
$0.04/note API for portal vendors; $9/mo consumer tier for chronic-care patients.

## Known limitations
Glossary is hand-curated for the demo note, not NLP-derived; no real EHR note import.

## Next 3 features
1. Auto-glossary generation from real notes via on-device NLP.
2. Spanish / Chinese plain-language mode.
3. "Ask a nurse" escalation on confusing lines.

