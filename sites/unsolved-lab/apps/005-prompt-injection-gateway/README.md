# Snare
**Concept:** Injection Gateway · **Category:** AI Agents / Infrastructure

## One-liner
Intercept malicious instructions hiding in webpages, email, PDFs, and tool outputs before they reach your agent.

## Startup thesis
Prompt injection is the XSS of the agent era. Every agent that browses or reads email needs a sanitization layer. Snare is that layer — a gateway that quarantines payloads and passes clean content through.

## Architecture
Single-file app. Three detectors (hidden HTML comments, invisible/tiny/display-none text, imperative-instruction phrasing) scan pasted content with an animated scan pass; findings list the technique, severity, and rationale; extracted payloads are quarantined; a sanitizer strips them and the agent receives the clean copy.

## Magic moment
The demo page looks like an innocent trail guide — one scan later, three injections are exposed: an HTML comment ordering email exfiltration, white-on-white text demanding the system prompt, and a hidden span ordering rm -rf.

## Monetization
API gateway pricing: per-1k scans, with an enterprise tier for inline deployment (the agent never sees untrusted content directly).

## Known limitations
Detectors are regex/heuristic, not a trained classifier — novel obfuscation will slip through; no PDF/DOCX parsing yet, HTML/text only.

## Next 3 features
1. ML classifier trained on real injection corpora
2. PDF/DOCX/OCR text extraction before scanning
3. Inline proxy mode: scan-then-forward for live agent traffic

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
