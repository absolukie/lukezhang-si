# Proof of Skill

**Concept:** Proof of Skill · **Category:** Language / Education

> Infer skills from actual work instead of credentials.

## Startup thesis
Résumés are unverified claims. Parsing work history into a skill graph — where every skill links to the roles and artifacts that prove it, with a confidence score — gives hiring a trustable signal that degrees can't.

## Architecture
Single index.html. Vanilla JS + Kit fallback. Seeded 5-entry work history in localStorage; skill extraction maps roles→skills; confidence = f(roles, evidence count); Kit.graph renders jobs→skills; click any skill for its evidence modal; add-work form rebuilds the graph live.

## Magic moment
Click 'Data visualization' in the graph — a modal shows 3 concrete evidence bullets (options-chain heatmap, hackathon finalist, 12 merged echarts PRs) and a 97% confidence score.

## Monetization
Talent marketplace: candidates free; employers pay per verified-skill search ($199/mo seat). Verification tier: artifact checks via GitHub/API integrations.

## Known limitations
Skills are self-declared per work entry; evidence bullets are curated demo text, not fetched from real APIs. No identity verification.

## Next 3 features
- GitHub/LinkedIn import to auto-extract evidence
- Peer endorsements weighted into confidence
- Employer search + skill-gap reports

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
