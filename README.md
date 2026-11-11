# Training Run Monitor

React, TypeScript, Vite, Recharts, and a Web Worker. The app generates 20 deterministic training runs and exposes `/runs/:id` pages with loss, learning-rate, and gradient-norm charts.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL shown by Vite. Choose a run from the list. Drag across a chart or enter integer step bounds and press **Zoom**. Quick zoom buttons take 1/2, 1/4, or 1/10 of the range currently entered in From step and To step, keeping From step fixed. For example, 500–1000 becomes 500–750 with 1/2. Use **Reset zoom** to restore the full run. The input fields, buttons, and run links are keyboard accessible. The **Overview / All points** buttons change detail without changing the selected range; switching runs resets to Overview.

## Checks

```sh
npm test -- --run
npm run lint
npm run build
```

The worker prepares each selected run once and retains the sorted points. An Overview range with at least 100,000 points connects every 1,000th point by global sorted position, plus the visible endpoint and locatable Warning and Data Issue positions. Run-20 therefore has 1,000 anchor points and seven extra positions in each of its three overview charts. Warning spikes are shown as labeled orange markers at their true steps; out-of-scale marker heights are symbolic so the ordinary loss trend remains readable. The Warnings list and Inspect reveal exact values. Smaller ranges include every point automatically. All points mode includes every point in the selected range. Large unabridged ranges use transferable typed arrays and Canvas rather than a million SVG points. Invalid values and genuine missing steps break the line; duplicate steps are excluded from connected lines and displayed as amber markers with their raw values in the issue list. Summary cards use unsampled finite values.

Run-20 has two 1,000-point regions with two and three loss spikes, plus the original spike at step 500,000. All six detected Warning points are shown as overview markers. Issue gaps and markers remain visible. This intentionally departs from the take-home requirement for a million-point run with only one spike. The sparse Overview may hide undetected changes or alias fast oscillations; use All points or Inspect before making a stop decision.

Zoom keeps the previous chart and its displayed step range until the worker returns the new series. A small "Updating charts…" status appears only if the request takes more than 200 ms. A failed zoom shows an error while keeping the previous chart; changing runs still shows the full loading state.

Red dots mark the step of a NaN or Infinity value on its affected metric chart. Their vertical placement is symbolic because the invalid value has no finite y-coordinate; the text label and Data issues list provide its actual type. The line remains broken at that step.

Loss spikes appear in a separate **Warnings** section, calculated from the full prepared run before chart sampling. The current rule flags an isolated positive loss value that is at least three times both adjacent values and at least one unit above them. Warnings are inspection cues, not invalid data or an automatic stop decision; adjacent spikes and sustained divergence may need other detection rules.

Each Data issue with a numeric step has an **Inspect** button that opens its chart range and scrolls to the affected metric chart after loading. Missing-step ranges and both steps involved in an ordering issue are included; step-wide issues use the loss chart. An invalid step has no chart position and is identified as such in the list. Warning inspection scrolls to loss.

The [submission note](docs/SUBMISSION.md) records test evidence, known gaps, and the current verdict. [Test output](docs/TEST_OUTPUT.txt) is saved separately. [Performance capture instructions](docs/PERFORMANCE.md) describe the still-needed browser trace and memory measurement.

## Deploy

The repository includes `vercel.json` for direct `/runs/:id` links. Once authenticated with Vercel, run `vercel --prod` from the repository root. Verify a direct link such as `/runs/Run-20` after deployment.
