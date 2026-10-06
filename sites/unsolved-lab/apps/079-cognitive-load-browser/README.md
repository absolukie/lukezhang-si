# Calm Browser

**Concept:** Calm Browser · **Category:** Bureaucracy / Accessibility

> Simplify complicated websites into focused workflows.

## Startup thesis
Checkout pages are obstacle courses of timers, upsells, and popups — hostile to anyone with cognitive overload, ADHD, or just low patience. Calm Browser detects distractions, strips them, and rebuilds the task as a short focused step wizard.

## Architecture
Single index.html. Vanilla JS + Kit fallback. Toggle between a deliberately cluttered checkout mock (12 catalogued distractions, fake countdown, popups) and Calm Mode: a 4-step wizard (cart → shipping → payment → confirm) with per-field validation, progress dots, breathing interstitial, and an order-success screen; distraction inventory panel lists everything removed.

## Magic moment
Hit 'Simplify this page' — 12 popups, timers, and upsells vanish, replaced by one calm question per screen; place the order and get a '12 → 0 distractions' receipt.

## Monetization
Browser extension freemium ($5/mo Pro: custom site rules, focus profiles); enterprise accessibility overlay licensing; affiliate-free — trust is the product.

## Known limitations
Demo operates on a mock page, not real websites; production needs a content-script engine per site. Form validation is demo-grade.

## Next 3 features
- Real extension MVP for top-20 checkout flows
- Per-site simplification rule marketplace
- Focus profiles (ADHD, low-vision, elderly)

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
