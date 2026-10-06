# Living Textbook

**Concept:** Living Textbook · **Category:** Language / Education

> Every concept can expand, simplify, visualize, simulate, or quiz itself.

## Startup thesis
Static textbooks serve one reading level and zero curiosity. A living chapter morphs: go deeper (derivations), simpler (ELI5), visual (charts), hands-on (parameter simulator), or prove-it (quiz) — same concept, five doors.

## Architecture
Single index.html. Vanilla JS + Kit fallback. Mode tabs (explain/expand/simplify/visualize/simulate/quiz) over a compound-interest chapter. Simulator computes real compound growth with contributions (closed-form yearly loop), renders Kit.line charts + amortization table; quiz checks answers with explanations; state in localStorage.

## Magic moment
Drag the 'Annual return' slider from 4% to 10% in Simulate mode and watch 30 years of compounding bend upward in real time — growth vs contributions split shown live.

## Monetization
Freemium chapters; Pro ($8/mo) unlocks full library + personal simulator presets; institutional licenses for schools ($3/student/yr).

## Known limitations
One complete chapter (compound interest); two more are locked placeholders. Simulator uses annual compounding steps, not continuous.

## Next 3 features
- Full chapter library (inflation, diversification next)
- User-authored chapters with the 5-mode template
- Spaced quiz scheduling across chapters

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
