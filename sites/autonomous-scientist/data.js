/* Autonomous Scientist — seed question prompts.
   These are just starting queries. The user can type ANY research question;
   papers come live from OpenAlex and trials from ClinicalTrials.gov.
   No papers, trials, results, or numbers are seeded here — that was the old
   fictional corpus, now removed. */
const DB = {
questions: [
  {
    id: "sunlight-sleep",
    title: "Does morning sunlight improve sleep quality?",
    field: "SLEEP SCIENCE · CIRCADIAN RHYTHMS",
    icon: "🌅",
    blurb: "A minimal, zero-cost light protocol — mapped against the real literature.",
    meta: [["source", "live"], ["papers", "OpenAlex"], ["trials", "CT.gov"]]
  },
  {
    id: "exercise-snacks",
    title: "Do short exercise snacks beat one long workout for focus?",
    field: "EXERCISE PHYSIOLOGY · COGNITION",
    icon: "⚡",
    blurb: "Brief bouts vs one long session — what does the registered evidence say?",
    meta: [["source", "live"], ["papers", "OpenAlex"], ["trials", "CT.gov"]]
  },
  {
    id: "phone-free-focus",
    title: "Does a phone-free deep-work block improve task completion?",
    field: "ATTENTION SCIENCE · PRODUCTIVITY",
    icon: "📵",
    blurb: "Phone in another room vs on the desk — mapped, not made up.",
    meta: [["source", "live"], ["papers", "OpenAlex"], ["trials", "CT.gov"]]
  }
]
};
