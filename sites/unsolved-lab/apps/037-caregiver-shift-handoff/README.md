# Handoff

**Concept:** Shift Handoff  
**Category:** Aging / Caregiving

**One-liner:** 60-second structured handoffs between caregivers: meds given, mood, incidents, open tasks.

## Startup thesis
Shift changes are where care details die — "did she take the evening meds?" A 60-second structured handoff (meds, mood, incidents, open tasks) makes every caregiver handoff complete and auditable. Sold to home-care agencies per caregiver seat.

## Architecture
Single `index.html`. Form state assembles into a handoff card object; copy-to-clipboard via `Kit.copy`; history persists in localStorage with click-to-review modals.

## Magic moment
Hit **Generate handoff card** — the night's notes become a crisp, copyable card with the dizzy-spell incident flagged.

## Monetization
$8/caregiver/mo agency tier; family plan $6/mo; incident-report export add-on.

## Known limitations
Fictional demo content; no photo attachments; no e-signature from incoming caregiver.

## Next 3 features
1. Incoming-caregiver e-signature acknowledgment.
2. Photo/video incident attachments.
3. Auto-flag incident patterns across shifts (3 dizzy spells → alert).

