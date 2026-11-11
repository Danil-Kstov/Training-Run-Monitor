# Training Run Monitor — submission note

**Verdict: DON'T SHIP yet.** The data and interaction code is in place, but the required Chrome Performance trace, tab-memory measurements, visual accessibility check, repository remote, and deployed URL are absent. I would first capture and inspect the trace on Run-20, then check the charts and interaction in a real browser before changing the verdict.

## Truthfulness

Run-20 has 1,000,000 points, two dense 1,000-point regions with two and three loss spikes, and the original spike of 500 at step 500,000. **This no longer meets the original requirement for a million-point run with a single middle spike.** A worker prepares each run once and reuses its raw data for zoom. On a range of at least 100,000 points, Overview uses every 1,000th sorted point plus Warning and Data Issue positions. Run-20 has 1,000 anchor points and seven extra positions per chart. Warning spikes are separate labeled orange markers; their y-position is symbolic when outside the ordinary loss scale. This keeps the trend readable but means **Overview can hide an undetected spike**. All points or Inspect must be used before a stop decision. Invalid values and missing steps break the line; NaN and Infinity appear as red dots at their true step with symbolic y. Duplicate steps are listed with all raw values and plotted as amber markers without a connected line. Original unsorted rows are reported and plotted in step order. Cards use unsampled finite values. The current Warning rule misses adjacent spikes and sustained rises. Axes name step and metric; labels use a fixed locale.

Zoom leaves the previous chart and its old step label visible until the worker returns, then swaps in the new series. A status appears after 200 ms if needed; range errors retain the previous view. Initial load and run changes still show the full loading state.

`npm test -- --run` passes **38 tests in 13 files**. Tests cover Run-20's exact 1,000 anchor points and seven extra positions across all three overview charts, Warning marker values and placement, Issue retention, real gaps, raw data transfer, duplicate values, zoom ranges, summaries, formatting, pagination and axes. They do **not** prove SVG/Canvas pixels, drag behavior, responsive layout, focus order, tooltip placement or perceived contrast. A browser check is still required. Earlier intermediate failures and the historical sampling benchmark remain recorded in the project materials.

## Silent failures checked

Requests carry monotonically increasing IDs. A result is displayed only when both ID and run match the current selection; a previous worker is terminated when the run changes. This addresses the A → B → A stale-result case in code, but it has not been verified by a browser race test. Linear chart segments are used, so smoothing is not applied. The y-axis uses a linear scale, including zero safely; no logarithmic scale is offered. Steps are integers without time-zone conversion. Number display uses an explicit `en-US` locale. Invalid values are counted and visible in the issue list rather than silently averaged away.

## Performance and delivery

The required CPU ×4 before/after numbers and trace file are **not available**. Baseline zoom is N/A because it did not exist. See [PERFORMANCE.md](PERFORMANCE.md) for the exact capture procedure and empty measurement table. `npm run build` and `npm run lint` pass; Vite reports a JavaScript chunk over 500 kB. Vercel configuration is prepared, but no deployment occurred: the local Vercel CLI reported an invalid token and the user chose to deploy later. The repository has no Git remote. No email reply has been sent.

## AI use and reflection

Codex proposed and implemented the worker view pipeline, run UI, sampling changes, tests and documentation. I first accepted min/max preservation, then requested a simpler 1-in-1,000 overview with separate Warning markers after seeing that dense extrema obscured the curves. I verified the pure-data behavior with tests and checked TypeScript, build and lint; I have **not** verified visual or Performance claims. What still concerns me most is an undetected spike hidden by sparse sampling and memory under a real throttled browser session. This paragraph should be reviewed and personalized by the candidate before submission.
