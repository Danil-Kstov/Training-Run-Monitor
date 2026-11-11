import { trainingRuns } from "../data/trainingRuns";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import { summarizeRun } from "../lib/runView";
import { buildChartPayload } from "../lib/chartPayload";
import type { ViewMode } from "../lib/chartPayload";
import type { StepRange } from "../lib/runView";
import type { TrainingPoint } from "../types/types";
import type { DataIssue } from "../lib/prepareTrainingPoints";
import type { RunSummary } from "../lib/runView";
import { detectLossWarnings } from "../lib/detectLossWarnings";
import type { DataWarning } from "../lib/detectLossWarnings";

type Request = { requestId: number; runId: string; range?: StepRange; mode?: ViewMode };

let cachedRunId = "";
let cachedPoints: TrainingPoint[] = [];
let cachedIssues: DataIssue[] = [];
let cachedSummary: RunSummary | null = null;
let cachedWarnings: DataWarning[] = [];

self.onmessage = (event: MessageEvent<Request>) => {
    const { requestId, runId, range, mode = "overview" } = event.data;

    try {
        if (cachedRunId !== runId) {
            const run = trainingRuns.find((item) => item.id === runId);
            if (!run) throw new Error("Training run not found");

            const prepared = prepareTrainingPoints(run.generate());
            const warnings = detectLossWarnings(prepared.points);
            const summary = summarizeRun(prepared.points, prepared.issues, warnings);
            cachedRunId = runId;
            cachedPoints = prepared.points;
            cachedIssues = prepared.issues;
            cachedWarnings = warnings;
            cachedSummary = summary;
        }

        if (!cachedSummary) throw new Error("Run cache unavailable");
        const summary = cachedSummary;
        const fullRange = {
            start: summary.firstStep ?? 0,
            end: summary.lastStep ?? 0,
        };
        const visibleRange = range ?? fullRange;

        const payload = buildChartPayload(
            cachedPoints,
            cachedIssues,
            cachedWarnings,
            visibleRange,
            mode
        );
        const transfer = payload.rawData
            ? Object.values(payload.rawData).map((array) => array.buffer)
            : [];

        self.postMessage({
            requestId,
            runId,
            range: visibleRange,
            fullRange,
            initial: range === undefined,
            mode,
            summary,
            issues: cachedIssues,
            warnings: cachedWarnings,
            ...payload,
        }, { transfer });
    } catch (error) {
        self.postMessage({
            requestId,
            runId,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
