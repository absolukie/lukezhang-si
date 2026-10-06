# CareLoop

**Concept:** Care-Team Inbox  
**Category:** Healthcare Administration

**One-liner:** Structured, role-aware messaging for the whole care team — with read receipts and escalation.

## Startup thesis
Care coordination still runs on phone tag and fax. A shared, role-aware inbox with read receipts and escalation turns a scattered care team into one accountable thread per issue — sellable to home-health agencies and ACOs per-seat.

## Architecture
Single `index.html`, vanilla JS, zero network. Seeded demo threads in memory; `Kit.store` persists sent messages/escalations to localStorage. Fallback Kit implements nav/toast/modal/esc/initials.

## Magic moment
Open the med-change thread: four roles debate a metformin titration with read receipts — then hit **Escalate** and watch the on-call get paged.

## Monetization
$12/user/mo for home-health agencies; $499/mo per practice for the Pro tier (EHR write-back, audit export).

## Known limitations
Demo data is fictional and local-only; no real EHR integration, no push notifications, no true HIPAA hosting.

## Next 3 features
1. EHR write-back (note sync to the chart).
2. SMS fallback for family members without the app.
3. SLA timers per thread with auto-escalation.

