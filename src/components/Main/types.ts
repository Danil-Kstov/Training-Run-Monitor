import type { DataIssue } from "../../lib/prepareTrainingPoints";
import type { DataWarning } from "../../lib/detectLossWarnings";
import type { RunSummary, StepRange } from "../../lib/runView";
import type { ChartPoint, Metric } from "../../types/types";

export type WorkerResponse = {
    requestId: number;
    runId: string;
    data?: Record<Metric, ChartPoint[]>;
    issues?: DataIssue[];
    warnings?: DataWarning[];
    summary?: RunSummary;
    range?: StepRange;
    fullRange?: StepRange;
    initial?: boolean;
    error?: string;
};
