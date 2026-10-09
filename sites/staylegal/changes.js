/* StayLegal rule-change feed: dated, sourced, plain-factual summaries of
   short-term rental rule changes we are watching. Research summaries, not
   legal advice. Every entry carries its source and our confidence in it. */
"use strict";

var STAYLEGAL_CHANGES = [
  {
    date: "September 2026",
    city: "Atlanta, GA",
    guide: "atlanta-ga",
    status: "pending",
    statusLabel: "Taking effect",
    title: "Council votes to drop the live-on-site rule, effective January 1, 2027",
    detail: "Atlanta's city council voted 9-5 to remove the rule that the host live on the property or an adjacent unit. Until January 1, 2027, whole-home investor rentals remain not allowed; from that date the restriction lifts.",
    confidence: "secondary",
    source: { label: "Rioo: Atlanta STR license rule changes", url: "https://riooapp.com/blog/atlanta-short-term-rental-license" }
  },
  {
    date: "June 2026",
    city: "Cleveland, OH",
    guide: "cleveland-oh",
    status: "pending",
    statusLabel: "Taking effect",
    title: "New license law (Ordinance 561-2026) takes effect late November 2026",
    detail: "Cleveland passed a $150 annual license with a 10% per-block density cap, $500,000 in liability insurance, and a local contact who can reach the property within an hour. The law takes effect around late November 2026.",
    confidence: "secondary",
    source: { label: "BNBCalc: Cleveland STR guide (2026)", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/cleveland-ohio-guide" }
  },
  {
    date: "March 2026",
    city: "Dallas, TX",
    guide: "dallas-tx",
    status: "frozen",
    statusLabel: "Court-frozen",
    title: "Ban still blocked by court order; Texas Supreme Court takes the case",
    detail: "Dallas's 2023 single-family STR ban and registration scheme remain frozen by a court injunction in place since December 2023. In March 2026 the Texas Supreme Court ordered merits briefing, so the ban could return.",
    confidence: "secondary",
    source: { label: "AvantStay: Dallas STR rules 2026", url: "https://avantstay.com/str-management/dallas/rules" }
  },
  {
    date: "December 2025",
    city: "Maui, HI",
    guide: "maui-hi",
    status: "enacted",
    statusLabel: "Enacted",
    title: "Bill 9 signed: apartment vacation rentals phase out by 2029 and 2031",
    detail: "Maui's Bill 9 phases out transient vacation rentals in apartment districts: West Maui by January 1, 2029, and the rest of the island by January 1, 2031. Only hotel and resort-zoned properties remain a legal investor path.",
    confidence: "secondary",
    source: { label: "Avalara: Bill 9 phase-out explainer", url: "https://www.avalara.com/mylodgetax/en/blog/2025/12/new-maui-law-could-phase-out-more-than-6000-short-term-rentals.html" }
  },
  {
    date: "October 2026",
    city: "Breckenridge, CO",
    guide: "breckenridge-co",
    status: "current",
    statusLabel: "In force now",
    title: "Residential zone over its license cap; 205-person waitlist",
    detail: "Breckenridge's residential STR zone is over its 390-license cap with a 205-applicant waitlist. New licenses only open through attrition, and licenses do not transfer when a home sells.",
    confidence: "secondary",
    source: { label: "StaySTRA: Breckenridge STR regulations", url: "https://staystra.com/location/colorado/breckenridge/" }
  }
];
