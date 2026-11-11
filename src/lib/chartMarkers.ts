import type { Metric } from "../types/types";
import type { DataIssue } from "./prepareTrainingPoints";
import type { StepRange } from "./runView";

export type InvalidMarker = {
    step: number;
    y: number;
    label: string;
    labelPosition: "top" | "bottom";
};

export function getInvalidMarkers(
    issues: DataIssue[],
    metric: Metric,
    range: StepRange,
    domain: [number, number],
    hasFiniteValues: boolean
): InvalidMarker[] {
    const [minimum, maximum] = domain;
    const inset = (maximum - minimum) * 0.06;

    return issues.flatMap((issue) => {
        if (issue.type !== "INVALID_VALUE" || issue.metric !== metric ||
            issue.step < range.start || issue.step > range.end) return [];

        const positiveInfinity = issue.value === Infinity;
        return [{
            step: issue.step,
            y: hasFiniteValues
                ? positiveInfinity ? maximum - inset : minimum + inset
                : (minimum + maximum) / 2,
            label: Number.isNaN(issue.value)
                ? "NaN"
                : positiveInfinity ? "+∞" : "−∞",
            labelPosition: positiveInfinity ? "bottom" as const : "top" as const,
        }];
    });
}
