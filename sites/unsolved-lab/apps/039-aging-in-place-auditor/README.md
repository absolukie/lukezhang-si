# SafeHome

**Concept:** Home Auditor  
**Category:** Aging / Caregiving

**One-liner:** Room-by-room home safety audit with costed fixes ranked by fall-risk reduction.

## Startup thesis
Falls are the #1 cause of injury for seniors — and most are preventable with cheap fixes. A guided room-by-room audit that ranks fixes by risk-reduced-per-dollar turns worry into a shoppable plan. Channel: occupational therapists, senior-living move-in assessments, insurers.

## Architecture
Single `index.html`. Room/fix dataset with cost + risk points; risk scores derive live from completion state; `Kit.bars` visualizes room risk; completion persists via `Kit.store`.

## Magic moment
Hit **Mark top-priority fix done** — watch the room's risk score and the home total drop in real time.

## Monetization
$29 one-time per home audit; $499/mo OT/agency tier (branded reports, contractor dispatch); affiliate revenue on grab bars, rails, lighting.

## Known limitations
Fictional demo audit; risk points are illustrative, not actuarial; no photo-based room scanning.

## Next 3 features
1. Photo upload → AI-detected hazards per room.
2. Contractor quotes + booking for top fixes.
3. Re-audit reminders every 6 months.

