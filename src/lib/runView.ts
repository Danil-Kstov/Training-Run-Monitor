import type { ChartPoint, Metric, TrainingPoint } from "../types/types";
import type { DataIssue } from "./prepareTrainingPoints";
import type { DataWarning } from "./detectLossWarnings";
import { downsampleForChart } from "./downsampleForChart";

export type RunSummary = {
    pointCount: number;
    firstStep: number | null;
    lastStep: number | null;
    latest: Record<Metric, number | null>;
    minLoss: number | null;
    maxLoss: number | null;
    issueCount: number;
    warningCount: number;
};

export type StepRange = { start: number; end: number };

export type SamplingHints = {
    warningSteps: ReadonlySet<number>;
    denseWindows: StepRange[];
};

const metrics = ["loss", "lr", "grad_norm"] as const;

export function summarizeRun(
    points: TrainingPoint[],
    issues: DataIssue[],
    warnings: DataWarning[] = []
): RunSummary {
    const latest: RunSummary["latest"] = { loss: null, lr: null, grad_norm: null };
    let minLoss: number | null = null;
    let maxLoss: number | null = null;

    for (const point of points) {
        for (const metric of metrics) {
            if (Number.isFinite(point[metric])) {
                latest[metric] = point[metric];
            }
        }

        if (Number.isFinite(point.loss)) {
            minLoss = minLoss === null ? point.loss : Math.min(minLoss, point.loss);
            maxLoss = maxLoss === null ? point.loss : Math.max(maxLoss, point.loss);
        }
    }

    return {
        pointCount: points.length,
        firstStep: points[0]?.step ?? null,
        lastStep: points.at(-1)?.step ?? null,
        latest,
        minLoss,
        maxLoss,
        issueCount: issues.length,
        warningCount: warnings.length,
    };
}

function lowerBound(points: TrainingPoint[], step: number): number {
    let low = 0;
    let high = points.length;

    while (low < high) {
        const middle = (low + high) >>> 1;
        if (points[middle].step < step) low = middle + 1;
        else high = middle;
    }

    return low;
}

function upperBound(points: TrainingPoint[], step: number): number {
    let low = 0;
    let high = points.length;

    while (low < high) {
        const middle = (low + high) >>> 1;
        if (points[middle].step <= step) low = middle + 1;
        else high = middle;
    }

    return low;
}

export function createSamplingHints(points: TrainingPoint[], warnings: DataWarning[]): SamplingHints {
    const warningSteps = new Set(warnings.map((warning) => warning.step));
    const windowCounts = new Map<number, number>();

    for (const warning of warnings) {
        const index = lowerBound(points, warning.step);
        if (points[index]?.step !== warning.step) continue;
        const windowIndex = Math.floor(index / 1000);
        windowCounts.set(windowIndex, (windowCounts.get(windowIndex) ?? 0) + 1);
    }

    const denseWindows = [...windowCounts]
        .filter(([, count]) => count >= 2)
        .sort(([left], [right]) => left - right)
        .map(([windowIndex]) => ({
            start: points[windowIndex * 1000].step,
            end: points[Math.min((windowIndex + 1) * 1000, points.length) - 1].step,
        }));

    return { warningSteps, denseWindows };
}

export function buildVisibleSeries(
    points: TrainingPoint[],
    issues: DataIssue[],
    range: StepRange,
    targetBuckets = 800,
    hints?: SamplingHints
): Record<Metric, ChartPoint[]> {
    if (!Number.isFinite(range.start) || !Number.isFinite(range.end) ||
        range.start > range.end || !Number.isSafeInteger(targetBuckets) || targetBuckets < 1) {
        throw new Error("Invalid chart range");
    }

    const visible = points.slice(
        lowerBound(points, range.start),
        upperBound(points, range.end)
    );
    const duplicateSteps = new Set(
        issues.filter((issue) => issue.type === "DUPLICATE_STEP")
            .map((issue) => issue.step)
    );
    const bucketSize = Math.max(1, Math.ceil(visible.length / targetBuckets));

    return {
        loss: downsampleForChart(
            visible,
            bucketSize,
            "loss",
            duplicateSteps,
            hints?.warningSteps,
            hints?.denseWindows
        ),
        lr: downsampleForChart(visible, bucketSize, "lr", duplicateSteps),
        grad_norm: downsampleForChart(visible, bucketSize, "grad_norm", duplicateSteps),
    };
}
