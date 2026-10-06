# HelpButton — Senior Tech Support

**One-liner:** Extremely simple trusted remote technical assistance.

## Startup thesis
Seniors don't need better tutorials — they need a panic button that summons someone they trust. The product is the trusted-helper network + huge-type guided fixes; monetize via family subscriptions and white-label for senior living facilities.

## Architecture
Single index.html. Two views: senior (4 huge issue buttons) and helper (request queue + trusted-helper roster). Requests flow into a step-by-step walkthrough engine with progress, back/next, and fix confirmation. State in localStorage.

## Magic moment
One tap on a giant button → a trusted helper is 'on the way' and the fix unfolds in huge type, one step at a time.

## Monetization
$12/mo family plan (up to 4 seniors + unlimited helpers); B2B white-label for assisted-living chains per-resident pricing.

## Known limitations
Helpers are simulated from a seeded roster (no real calling/messaging); no remote screen-sharing; fixes are scripted walkthroughs, not diagnostics.

## Next 3 features
1. Real voice/video call handoff (WebRTC) with screen-share
2. Scam-detection: screenshot OCR that flags known scam patterns
3. Proactive check-ins: 'haven't heard from Dad in 3 days' nudges
