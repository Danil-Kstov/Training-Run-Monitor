import type { DataIssue } from "./prepareTrainingPoints";
import type { StepRange } from "./runView";
import type { Metric } from "../types/types";

const margin = 25;

function around(start: number, end: number, fullRange: StepRange): StepRange {
    return {
        start: Math.max(fullRange.start, start - margin),
        end: Math.min(fullRange.end, end + margin),
    };
}

export function getIssueInspectRange(
    issue: DataIssue,
    fullRange: StepRange
): StepRange | null {
    switch (issue.type) {
        case "INVALID_STEP":
            return null;
        case "MISSING_STEPS":
            return around(issue.from, issue.to, fullRange);
        case "UNSORTED_STEP":
            return around(
                Math.min(issue.step, issue.previousStep),
                Math.max(issue.step, issue.previousStep),
                fullRange
            );
        case "INVALID_VALUE":
        case "DUPLICATE_STEP":
            return around(issue.step, issue.step, fullRange);
    }
}

export function getIssueInspectMetric(issue: DataIssue): Metric {
    return issue.type === "INVALID_VALUE" ? issue.metric : "loss";
}
