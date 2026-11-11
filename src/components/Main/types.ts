import type { DataIssue } from "../../lib/prepareTrainingPoints";
import type { DataWarning } from "../../lib/detectLossWarnings";
import type { RunSummary, StepRange } from "../../lib/runView";
import type { ChartPoint, Metric } from "../../types/types";
import type { RawChartData, ViewMode } from "../../lib/chartPayload";

export type WorkerResponse = {
    requestId: number;
    runId: string;
    data?: Record<Metric, ChartPoint[]>;
    rawData?: RawChartData;
    visibleCount?: number;
    renderedCount?: number;
    sampled?: boolean;
    mode?: ViewMode;
    issues?: DataIssue[];
    warnings?: DataWarning[];
    summary?: RunSummary;
    range?: StepRange;
    fullRange?: StepRange;
    initial?: boolean;
    error?: string;
};
