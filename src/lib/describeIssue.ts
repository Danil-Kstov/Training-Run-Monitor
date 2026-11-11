import type { DataIssue } from "./prepareTrainingPoints";

export function describeIssue(issue: DataIssue): string {
    switch (issue.type) {
        case "INVALID_VALUE":
            return `Step ${issue.step}: ${issue.metric} is ${String(issue.value)}`;
        case "INVALID_STEP":
            return `Input row ${issue.index + 1}: invalid step ${String(issue.value)}`;
        case "MISSING_STEPS":
            return `Missing steps ${issue.from}–${issue.to} (${issue.count})`;
        case "UNSORTED_STEP":
            return `Input row ${issue.index + 1}: step ${issue.step} follows ${issue.previousStep}`;
        case "DUPLICATE_STEP":
            return `Step ${issue.step}: ${issue.values.map((value) =>
                `loss ${String(value.loss)}, lr ${String(value.lr)}, grad_norm ${String(value.grad_norm)}`
            ).join("; ")}`;
    }
}
