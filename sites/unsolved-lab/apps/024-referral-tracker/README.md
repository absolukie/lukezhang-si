# ReferralRadar
**Concept:** Referral Tracker · **Category:** Healthcare Administration

**One-liner:** Track referrals from order through insurance, scheduling, completion, results, follow-up.

## Startup thesis
Referrals die in the gap between 'ordered' and 'scheduled' — 19 days at 'awaiting insurance' with nobody calling. ReferralRadar makes every stage visible and gives stuck referrals one-tap nudge actions.

## Architecture
Vanilla JS. Seeded referrals with stage pipelines, day counters, event logs; nudge actions generate copy-paste call scripts and doctor messages; modal note logging.

## Magic moment
Magic moment: the stuck referral pulses red at 'Insurance — 19 days' with ready-made scripts to call the payer and message the doctor.

## Monetization
Provider SaaS (referral leakage costs practices real revenue); payer care-coordination contracts.

## Known limitations
No real payer status API; stages advance manually in the demo; nudge scripts are templates, not auto-sent.

## Next 3 features
1. Payer auth-status API polling
2. SMS/email nudges to patient when a referral stalls
3. Closed-loop: auto-import results and prompt follow-up booking

---
*All health data in this app is fictional seeded demo data. Built for the Unsolved Lab sprint (worker 3, apps 21–30). Client-side only, no network, no keys.*
