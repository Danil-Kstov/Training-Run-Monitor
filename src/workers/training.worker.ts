import { trainingRuns } from "../data/trainingRuns";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import { buildVisibleSeries, createSamplingHints, summarizeRun } from "../lib/runView";
import type { StepRange } from "../lib/runView";
import type { TrainingPoint } from "../types/types";
import type { DataIssue } from "../lib/prepareTrainingPoints";
import type { RunSummary } from "../lib/runView";
import { detectLossWarnings } from "../lib/detectLossWarnings";
import type { DataWarning } from "../lib/detectLossWarnings";
import type { SamplingHints } from "../lib/runView";

type Request = { requestId: number; runId: string; range?: StepRange };

let cachedRunId = "";
let cachedPoints: TrainingPoint[] = [];
let cachedIssues: DataIssue[] = [];
let cachedSummary: RunSummary | null = null;
let cachedWarnings: DataWarning[] = [];
let cachedSamplingHints: SamplingHints | null = null;

self.onmessage = (event: MessageEvent<Request>) => {
    const { requestId, runId, range } = event.data;

    try {
        if (cachedRunId !== runId) {
            const run = trainingRuns.find((item) => item.id === runId);
            if (!run) throw new Error("Training run not found");

            const prepared = prepareTrainingPoints(run.generate());
            const warnings = detectLossWarnings(prepared.points);
            const hints = createSamplingHints(prepared.points, warnings);
            const summary = summarizeRun(prepared.points, prepared.issues, warnings);
            cachedRunId = runId;
            cachedPoints = prepared.points;
            cachedIssues = prepared.issues;
            cachedWarnings = warnings;
            cachedSamplingHints = hints;
            cachedSummary = summary;
        }

        if (!cachedSamplingHints || !cachedSummary) throw new Error("Run cache unavailable");
        const summary = cachedSummary;
        const fullRange = {
            start: summary.firstStep ?? 0,
            end: summary.lastStep ?? 0,
        };
        const visibleRange = range ?? fullRange;

        self.postMessage({
            requestId,
            runId,
            range: visibleRange,
            fullRange,
            initial: range === undefined,
            summary,
            issues: cachedIssues,
            warnings: cachedWarnings,
            data: buildVisibleSeries(cachedPoints, cachedIssues, visibleRange, 800, cachedSamplingHints),
        });
    } catch (error) {
        self.postMessage({
            requestId,
            runId,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
