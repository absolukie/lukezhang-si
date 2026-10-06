# FormGraph

**Concept:** FormGraph · **Category:** Bureaucracy / Accessibility

> Map paperwork dependencies and prerequisites.

## Startup thesis
Permit applications get rejected because people file step 6 before step 3. Modeling bureaucracy as a dependency graph — with topological ordering, per-form details, and a prerequisite-gated checklist — turns months of back-and-forth into one clean pass.

## Architecture
Single index.html. Vanilla JS + Kit fallback. 9-form building-permit dataset with levels + prereq edges; topological sort drives both the Kit.graph dependency view and the ordered checklist (checkboxes gated until prerequisites complete); click any node for time/cost/where-to-file/tip detail; progress in localStorage.

## Magic moment
Click 'Structural calculations' in the graph — see it unlock only after Building plans, read the '$1.5k–$5k, hire early' tip, then check it off and watch the permit application node unblock.

## Monetization
Free single-project maps; Pro ($12/mo) for contractors managing many projects; lead-gen for architects/engineers listed as 'where to file' providers.

## Known limitations
One demo domain (CA residential building permit); timelines/costs are illustrative ranges. No jurisdiction-specific rule engine yet.

## Next 3 features
- More domains: LLC formation, immigration visas, home buying
- Jurisdiction picker with local fee schedules
- Shareable project checklists for contractors

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
