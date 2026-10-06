# Evalsmith
**Concept:** Eval Studio · **Category:** AI Agents / Infrastructure

## One-liner
Automatically turn production failures into reproducible eval cases with grading rubrics — then run them.

## Startup thesis
Every production failure is a free test case nobody writes down. Evalsmith closes the loop: failure in, reproducible eval out, graded on every deploy. It's the flywheel that makes agents compound in reliability.

## Architecture
Single-file app. Four production failures; selecting one generates an eval case (prompt, context, expected behavior, weighted rubric); running the eval produces deterministic criterion-by-criterion scores with pass/fail at an 80-point threshold; evals can be saved to a library that gates deploys.

## Magic moment
Pick the $214 out-of-window refund failure, generate the eval, run it — and watch the agent fail 'Policy compliance' the same way it did in production, now captured forever as a regression test.

## Monetization
Per-eval-run pricing + enterprise for private failure ingestion (connect your incident tracker, evals write themselves).

## Known limitations
Grading is simulated/deterministic, not a live judge model; failure catalog is hand-authored; no real agent runtime plugged in.

## Next 3 features
1. LLM-as-judge grading with real rubric evaluation
2. Ingest failures from PagerDuty/Linear/Zendesk automatically
3. A/B grading across model versions on the same eval

## Verification
- Opened via Playwright (`file://`), zero console errors and zero page errors.
- Core interaction clicked and confirmed working; `shot.jpg` (1280x800, q70) captured post-interaction.
- Built against the shared kit contract (`../../shared/kit.js` / `kit.css`); embeds a local Kit fallback so the app also runs standalone.
