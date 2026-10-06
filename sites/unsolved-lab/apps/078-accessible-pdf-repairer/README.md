# A11y Fixer

**Concept:** A11y Fixer · **Category:** Bureaucracy / Accessibility

> Turn inaccessible PDFs into properly structured accessible documents.

## Startup thesis
Most PDFs are flat scans — gibberish to screen readers. An automated repair pass (tag tree generation, reading-order correction, alt-text authoring, table header promotion, language declaration) makes any document PDF/UA-ready in seconds.

## Architecture
Single index.html. Vanilla JS + Kit fallback. Simulated scan: 7 content blocks in scrambled detected order; 'Run repair' animates a 10-step repair log, then renders the corrected tag tree (H1→P×5, Table, Figure) with verified reading-order numbers; clicking a tag highlights its region in the scan; 6-issue report with per-issue fixes + copyable accessibility report.

## Magic moment
Hit 'Run repair' and watch the scan's red order badges flip to green 1–7 while the log narrates each fix — then click <Table> to see the headerless grid become scoped <TH> cells.

## Monetization
Pay-per-document API ($0.10/page) for enterprises with PDF backlogs; compliance dashboard for universities/government ($499/mo); batch folder processing.

## Known limitations
Demo simulates the scan + repair pipeline in the browser; production would need real PDF parsing (pdf.js) and OCR (Tesseract) stages. Alt text is authored from demo metadata.

## Next 3 features
- Real PDF upload via pdf.js parsing
- On-device OCR with Tesseract.js
- Batch mode + PDF/UA validation report export

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
