# OneForm

**Concept:** Form Fill  
**Category:** Healthcare Administration

**One-liner:** One reusable health profile that auto-fills every repetitive intake form — with time saved.

## Startup thesis
Patients re-type the same health history on every clipboard. A portable, patient-owned profile that one-click fills any intake form saves hours and cuts transcription errors — wedge into dental/PT/urgent-care chains, then become the identity layer for patient intake.

## Architecture
Single `index.html`, vanilla JS. Profile + time-saved persist in localStorage via `Kit.store`. Field-mapping is a per-form field list; autofill writes profile values into disabled inputs.

## Magic moment
Hit **Autofill from profile** on the New Patient form — 11 fields populate in under a second and the time-saved counter jumps.

## Monetization
Free for patients; $49/mo per clinic location for branded forms + analytics; API tier for EHR vendors.

## Known limitations
Fictional demo data; no real FHIR/EHR export; no signature capture; no multi-language forms yet.

## Next 3 features
1. FHIR export to push the profile into any EHR.
2. Photo capture of insurance cards with OCR.
3. Family profiles (fill forms for kids/parents).

