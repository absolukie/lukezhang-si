# PlainSpeak

**Concept:** PlainSpeak · **Category:** Bureaucracy / Accessibility

> Explain government, insurance, tax, immigration, school, and legal notices — and the required actions.

## Startup thesis
Official notices are written to be defensible, not understandable — so people miss deadlines and rights. Paste any notice; get plain-English meaning, the required actions ranked, deadlines extracted, and jargon decoded on hover. All client-side, so sensitive mail never leaves the browser.

## Architecture
Single index.html. Vanilla JS + Kit fallback. Pipeline: doc-type classifier (keyword scoring) → date parser (Month DD, YYYY + MM/DD/YYYY regex with context snippets) → imperative-sentence extractor (must/shall/bring/appear…) → jargon highlighter (28-term glossary with hover tooltips) → deadline timeline + action cards + copyable summary. Sample jury summons + rent notice preloaded.

## Magic moment
Paste the jury summons and hit Translate: 'venire' and 'voir dire' become hoverable plain-English, 3 action cards appear, and the Oct 19 confirm-by deadline lands on a timeline.

## Monetization
Free consumer tool; API for legal-aid nonprofits + HR/immigration platforms ($0.02/translation); white-label for government agencies modernizing notices.

## Known limitations
Rule-based parsing (regex + keyword lists), not a language model — unusual phrasing may misclassify. Date extraction is English-only. Not legal advice.

## Next 3 features
- Photo/scan input via on-device OCR
- Multi-language output (starting with Spanish)
- Deadline reminders via calendar export

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
