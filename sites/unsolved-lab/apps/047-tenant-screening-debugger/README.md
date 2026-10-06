# ClearName — Screening Debugger

**One-liner:** Explain likely rejection reasons and help dispute incorrect data.

## Startup thesis
1 in 5 screening reports has a material error and renters never see why they were rejected. Decoding reports + auto-drafting FCRA disputes is the wedge; the platform becomes the renter's credit-health advocate with re-application tracking.

## Architecture
Single index.html. Seeded adverse-action notice; 'Analyze' decodes 4 report lines into verdicts (wrong-person, disputable, accurate, scoring quirk) each with an action plan. Generates a full FCRA §611 dispute letter with copy button; post-dispute timeline. Findings rendered as verdict cards.

## Magic moment
Run analysis: the eviction belongs to 'Jonathon Reyes, DOB 1984' — a different human — and a ready-to-send dispute letter appears.

## Monetization
Free analysis; $19/dispute for certified-mail filing + tracking; $9/mo credit-health monitoring for renters.

## Known limitations
Report parsing is demo-seeded (no OCR/upload of real reports); letter is a template, not legal advice; no filing integration.

## Next 3 features
1. Upload + OCR real screening reports (PDF parsing)
2. Certified-mail dispute filing with deadline tracking
3. Re-application kit: corrected report + landlord explanation pack
