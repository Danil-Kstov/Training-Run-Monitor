# Performance trace capture

The required Chrome Performance trace and tab-memory reading have **not** been captured. Do not replace them with Node timings or estimated numbers. The measurements below predate the new Overview / All points modes and are retained as historical evidence, not measurements of the current code.

## Local sampling proxy, 2026-11-11

On the same dense Run-20 fixture (six detected Warnings), a Vitest/Node 22 run measured `buildVisibleSeries` plus `structuredClone` of the response. Each result follows one warm-up and three timed repetitions; the median is shown below. This is **not** browser worker response time, CPU ×4 latency, a trace, or tab memory. Raw outputs are in [sampling-before.json](sampling-before.json) and [sampling-after.json](sampling-after.json).

| Measure | Before | After |
|---|---:|---:|
| Loss points sent | 1,604 | 1,615 |
| lr / grad_norm points sent | 1,600 / 3,197 | 1,600 / 3,197 |
| Sampling + clone median | 207.43 ms | 228.05 ms |

The local proxy got slower while retaining all six warning points. Browser measurements remain required to establish the user-visible cost.

1. Deploy or run the production build (`npm run build`, then `npm run preview`). Open the million-point Run-08 in Chrome with a fresh profile or incognito window. Use Run-08 for the before/after comparison because its data did not change; use Run-20 separately for the spike check.
2. In DevTools Performance, set **CPU throttling: 4× slowdown**. Record from before navigation until the three charts and cards appear. Save the trace file and note first-render duration from navigation to the completed UI.
3. Record a drag zoom around step 500,000, then hover on Run-08. Also repeat on Run-20 around steps 250,100 and 750,500 to inspect the dense spikes. Save the trace and note interaction-to-next-paint latency for zoom and hover.
4. In Chrome Task Manager or DevTools Memory, record the tab's memory with Run-08 loaded. State which metric was read, because JavaScript heap and process memory differ.
5. Repeat on the baseline commit `cf676fd` for first render and hover. Baseline zoom is **N/A: the feature did not exist**. Use the same browser version, viewport, machine and throttling. Preserve failed or aborted traces and describe them.

| Measurement | Baseline | Current implementation |
|---|---:|---:|
| First render, CPU ×4 | Not captured | Not captured |
| Zoom response, CPU ×4 | N/A | Not captured |
| Hover response, CPU ×4 | Not captured | Not captured |
| Tab memory, Run-08 | Not captured | Not captured |

The local browser automation available to this session could not access the Vite server. A later attempt to inspect the already open Firefox Developer Edition window was stopped because browser URL policy enforcement is unsupported for that Windows browser. No trace file or screenshot is claimed. Before submission, capture separate first-render, Zoom, hover, and tab-memory measurements for Overview and All points on Run-20, including the first switch to All points.
