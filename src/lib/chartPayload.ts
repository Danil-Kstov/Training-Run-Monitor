import type { DataIssue } from "./prepareTrainingPoints";
import type { DataWarning } from "./detectLossWarnings";
import type { StepRange } from "./runView";
import type { ChartPoint, Metric, TrainingPoint } from "../types/types";

export type ViewMode = "overview" | "all";

export type RawChartData = {
    steps: Float64Array;
    loss: Float64Array;
    lr: Float64Array;
    grad_norm: Float64Array;
    breaks: Uint8Array;
    duplicates: Uint8Array;
};

export type ChartPayload = {
    data?: Record<Metric, ChartPoint[]>;
    rawData?: RawChartData;
    visibleCount: number;
    renderedCount: number;
    sampled: boolean;
};

const metrics = ["loss", "lr", "grad_norm"] as const;
export const overviewThreshold = 100_000;
const canvasThreshold = 5_000;
const stride = 1_000;

export function getRawStepValues(
    raw: RawChartData,
    metric: Metric,
    target: number
): { step: number; values: number[] } | null {
    const steps = raw.steps;
    if (steps.length === 0) return null;
    let low = 0;
    let high = steps.length;

    while (low < high) {
        const middle = (low + high) >>> 1;
        if (steps[middle] < target) low = middle + 1;
        else high = middle;
    }

    let index = low === steps.length ? steps.length - 1 : low;
    if (index > 0 && Math.abs(steps[index - 1] - target) <=
        Math.abs(steps[index] - target)) index--;
    const step = steps[index];
    let start = index;
    let end = index + 1;
    while (start > 0 && steps[start - 1] === step) start--;
    while (end < steps.length && steps[end] === step) end++;

    return { step, values: Array.from(raw[metric].subarray(start, end)) };
}

export function lowerBoundStep(points: TrainingPoint[], step: number): number {
    let low = 0;
    let high = points.length;

    while (low < high) {
        const middle = (low + high) >>> 1;
        if (points[middle].step < step) low = middle + 1;
        else high = middle;
    }

    return low;
}

export function upperBoundStep(points: TrainingPoint[], step: number): number {
    let low = 0;
    let high = points.length;

    while (low < high) {
        const middle = (low + high) >>> 1;
        if (points[middle].step <= step) low = middle + 1;
        else high = middle;
    }

    return low;
}

function issueSteps(issues: DataIssue[], warnings: DataWarning[]): Set<number> {
    const steps = new Set(warnings.map((warning) => warning.step));

    for (const issue of issues) {
        if ("step" in issue) steps.add(issue.step);
    }

    return steps;
}

function selectedIndices(
    points: TrainingPoint[],
    first: number,
    last: number,
    issues: DataIssue[],
    warnings: DataWarning[]
): Uint8Array {
    const selected = new Uint8Array(last - first);
    const requiredSteps = issueSteps(issues, warnings);
    const duplicateSteps = new Set(
        issues.filter((issue) => issue.type === "DUPLICATE_STEP")
            .map((issue) => issue.step)
    );

    const include = (index: number) => {
        if (index < first || index >= last) return;
        selected[index - first] = 1;
    };

    include(first);
    include(last - 1);

    for (let index = Math.ceil(first / stride) * stride; index < last; index += stride) {
        include(index);
    }

    for (let index = first; index < last; index++) {
        const point = points[index];
        const previous = index > first ? points[index - 1] : null;
        const next = index + 1 < last ? points[index + 1] : null;
        const invalid = metrics.some((metric) => !Number.isFinite(point[metric]));
        const duplicate = duplicateSteps.has(point.step);

        if (requiredSteps.has(point.step) || invalid || duplicate) {
            include(index);
        }

        if (previous && point.step - previous.step > 1) {
            include(index - 1);
            include(index);
        }

        if (next && next.step - point.step > 1) {
            include(index);
            include(index + 1);
        }
    }

    return selected;
}

function buildSeries(
    points: TrainingPoint[],
    first: number,
    last: number,
    selected: Uint8Array | null,
    issues: DataIssue[],
    warnings: DataWarning[]
): Record<Metric, ChartPoint[]> {
    const duplicateSteps = new Set(
        issues.filter((issue) => issue.type === "DUPLICATE_STEP")
            .map((issue) => issue.step)
    );
    const result: Record<Metric, ChartPoint[]> = { loss: [], lr: [], grad_norm: [] };
    const warningSteps = new Set(warnings.map((warning) => warning.step));

    for (let index = first; index < last; index++) {
        const point = points[index];
        const previous = index > first ? points[index - 1] : null;

        for (const metric of metrics) {
            if (selected && !selected[index - first]) continue;
            if (previous && point.step - previous.step > 1) {
                result[metric].push({
                    step: previous.step + 1,
                    loss: null,
                    lr: null,
                    grad_norm: null,
                });
            }

            result[metric].push({
                step: point.step,
                anchor: selected ? index % stride === 0 : undefined,
                loss: metric === "loss" && !(selected && warningSteps.has(point.step)) &&
                    !duplicateSteps.has(point.step) && Number.isFinite(point.loss)
                    ? point.loss : null,
                lr: metric === "lr" && !duplicateSteps.has(point.step) && Number.isFinite(point.lr)
                    ? point.lr : null,
                grad_norm: metric === "grad_norm" && !duplicateSteps.has(point.step) && Number.isFinite(point.grad_norm)
                    ? point.grad_norm : null,
            });
        }
    }

    return result;
}

function buildRaw(
    points: TrainingPoint[],
    first: number,
    last: number,
    issues: DataIssue[]
): RawChartData {
    const length = last - first;
    const raw: RawChartData = {
        steps: new Float64Array(length),
        loss: new Float64Array(length),
        lr: new Float64Array(length),
        grad_norm: new Float64Array(length),
        breaks: new Uint8Array(length),
        duplicates: new Uint8Array(length),
    };
    const duplicateSteps = new Set(
        issues.filter((issue) => issue.type === "DUPLICATE_STEP")
            .map((issue) => issue.step)
    );

    for (let offset = 0; offset < length; offset++) {
        const point = points[first + offset];
        raw.steps[offset] = point.step;
        raw.loss[offset] = point.loss;
        raw.lr[offset] = point.lr;
        raw.grad_norm[offset] = point.grad_norm;
        raw.duplicates[offset] = Number(duplicateSteps.has(point.step));
        raw.breaks[offset] = Number(offset > 0 && point.step - points[first + offset - 1].step > 1);
    }

    return raw;
}

export function buildChartPayload(
    points: TrainingPoint[],
    issues: DataIssue[],
    warnings: DataWarning[],
    range: StepRange,
    mode: ViewMode
): ChartPayload {
    if (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) ||
        range.start > range.end || (mode !== "overview" && mode !== "all")) {
        throw new Error("Invalid chart request");
    }

    const first = lowerBoundStep(points, range.start);
    const last = upperBoundStep(points, range.end);
    const visibleCount = last - first;
    const sampled = mode === "overview" && visibleCount >= overviewThreshold;

    if (!sampled && visibleCount > canvasThreshold) {
        return {
            rawData: buildRaw(points, first, last, issues),
            visibleCount,
            renderedCount: visibleCount,
            sampled: false,
        };
    }

    const selected = sampled ? selectedIndices(points, first, last, issues, warnings) : null;
    const renderedCount = selected
        ? selected.reduce((count, value) => count + value, 0)
        : visibleCount;

    return {
        data: buildSeries(points, first, last, selected, issues, warnings),
        visibleCount,
        renderedCount,
        sampled,
    };
}
