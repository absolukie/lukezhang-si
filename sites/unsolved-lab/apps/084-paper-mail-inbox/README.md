# MailBox

**Concept:** MailBox
**One-liner:** Digitize physical mail and extract urgency, deadlines, tasks.
**Startup thesis:** Paper mail is where deadlines go to die — IRS notices, jury summons, HOA dues. A scan-and-triage layer that extracts dates, amounts, and action items turns the mail pile into a sorted task list.

## Architecture
Single-file client app. Six realistic scanned letters; a real extraction pass parses dates ("October 31, 2026") and dollar amounts via regex, highlights them in the scanned view, and feeds an urgency scorer (deadline proximity + government sender + penalty language + money involved → 0–99). Sort by urgency/deadline/sender; per-letter task checklists persist in localStorage.

## Magic moment
Open the inbox and the IRS balance-due notice sits on top at 99/99 with "$1,284.00" and "October 31, 2026" highlighted in the scan — deadlines you never retyped.

## Monetization
$6/mo consumer (scan + triage + reminders); partnership with mail-scanning services; API for property managers handling tenant mail.

## Known limitations
Demo letters are pre-scanned text; production needs OCR. Date parser handles "Month D, YYYY" only. Urgency weights are heuristic.

## Next 3 features
1. Phone-camera capture with on-device OCR.
2. One-tap bill pay from extracted amounts.
3. Household inbox — assign letters to family members.
