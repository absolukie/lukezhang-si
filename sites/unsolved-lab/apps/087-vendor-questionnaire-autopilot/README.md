# QuestPilot

**Concept:** QuestPilot
**One-liner:** Complete security/compliance questionnaires from verified company information.
**Startup thesis:** Every enterprise deal stalls on the 300-question security review. Auto-filling from a verified company knowledge base — with citations, confidence scores, and a human review queue for the edge cases — compresses weeks of back-and-forth into an afternoon.

## Architecture
Single-file client app. 40 SIG Lite-style questions across 5 categories, each auto-answered from a Northwind Cloud company profile with source citation, excerpt, and confidence. 3 questions are flagged "needs human review" (breach history nuance, law-enforcement coordination, bus-factor gap). Approve/override per question with localStorage persistence; one-click JSON export of the completed questionnaire.

## Magic moment
37 of 40 answers filled instantly, each with a clickable citation — and the review queue honestly surfaces the 3 it wouldn't answer on its own.

## Monetization
$199/questionnaire or $999/mo per vendor for the knowledge base + auto-fill API; marketplace for auditor-verified company profiles.

## Known limitations
Demo knowledge base is fictional; production needs a live, versioned document vault. No multi-questionnaire dedup yet.

## Next 3 features
1. Document vault ingestion (PDF policies → cited answers).
2. Questionnaire importer (Excel/Word → structured).
3. Auditor mode: spot-check citations against source docs.
