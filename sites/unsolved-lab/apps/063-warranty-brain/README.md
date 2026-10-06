# WarrantyWise

**Concept:** Warranty Brain
**One-liner:** Tracks every product warranty you own and surfaces claims before they expire.

## Startup thesis
Billions in warranty value expire unclaimed each year because nobody tracks 14 different PDFs; a single brain that watches every expiration date captures that value.

## Architecture
Single-file client-side app (`index.html`, vanilla JS, zero network calls). UI built on the shared Kit contract (`window.Kit`: seeded RNG, tables, charts, timelines, modals) with an inline fallback shim since `../../shared/kit.js` was still being built in parallel. Demo data is deterministic via `Kit.rng` seeded per app; user progress persists in `localStorage` through `Kit.store`.

## Magic moment
The dashboard flags your dishwasher: 12 days left — and hands you the exact claim checklist with the receipt already attached.

## Monetization
$4/mo per household for expiry alerts + claim filing; affiliate revenue from extended-warranty partners.

## Known limitations
- Demo data only; claim checklists are guidance, not filed claims.
- Built against the shared Kit contract (window.Kit); a minimal inline shim is retained as fallback if shared/kit.js is ever absent.

## Next 3 features
1. Receipt OCR auto-import from email
2. Manufacturer claim-portal deep links with pre-filled forms
3. Resale mode: transfer warranties to buyers
