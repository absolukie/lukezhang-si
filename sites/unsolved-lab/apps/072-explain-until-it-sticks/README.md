# Sticky Explainer

**Concept:** Sticky Explainer · **Category:** Language / Education

> Learn which explanations work best for each person.

## Startup thesis
The same explanation lands differently on different brains. By having learners rate analogy / step-by-step / visual explanations per concept, the app learns each person's style profile and leads with what sticks.

## Architecture
Single index.html. Vanilla JS + Kit fallback. localStorage profile (style score arrays) + per-concept ratings. Profile verdict = highest average rating; 'Explain it my way' jumps to the winning tab. 3 concepts × 3 hand-written explanation styles.

## Magic moment
Rate the three explanations for 'How does a neural network learn?' — the profile panel updates live and declares 'You learn best through analogies', then reorders future explanations accordingly.

## Monetization
B2C: free for learners; B2B SaaS for course creators ($29/mo) — analytics on which explanation styles work for each cohort, A/B testing of lesson variants.

## Known limitations
Style preference is self-reported via star ratings, not measured via retention. Only 3 concepts ship in the demo; no quiz-based comprehension validation yet.

## Next 3 features
- Comprehension quizzes to validate ratings vs actual retention
- More concepts + community-contributed explanations
- Cohort analytics dashboard for educators

## Demo
Open `index.html` in a browser (or serve the folder). All client-side, zero network, zero keys. Demo data is seeded and deterministic.
