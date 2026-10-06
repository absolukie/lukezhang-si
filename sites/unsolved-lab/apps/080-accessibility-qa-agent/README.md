# A11y QA

**Concept:** A11y QA · **Category:** Bureaucracy / Accessibility

> Automatically test websites from multiple accessibility perspectives.

## Startup thesis
Accessibility audits are expensive, slow, and usually skipped. 24 automated DOM checks across 7 perspectives (images, controls, forms, vision, keyboard, structure, code) — each failure shipped with a copy-paste code fix — make a11y testing as routine as spellcheck.

## Architecture
Single index.html. Vanilla JS + Kit fallback. A live (intentionally flawed) sample page renders in-DOM; the engine runs 24 real checks against it — computed-style contrast math, heading-order walk, label association, touch-target measurement, duplicate IDs, landmark presence — with an animated run log, score dashboard, category filters, and per-failure fix modals with copy buttons.

## Magic moment
Hit 'Run all 24 checks' and watch the terminal-style log stream PASS/FAIL in real time, then click any ✕ row to get the exact code snippet that fixes it.

## Monetization
CI integration ($49/mo per repo: fail builds on a11y regressions); agency white-label reports; free tier for open source.

## Known limitations
Static checks only — no screen-reader simulation, keyboard-trap path testing, or dynamic SPA state coverage. Sample page is fixed; custom URL testing needs a backend crawler.

## Next 3 features
- Paste-URL testing via headless crawl service
- CI GitHub Action with regression diffing
- WCAG 2.2 criterion mapping per check

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
