import { expect, it } from "vitest";
import { getIssueInspectMetric, getIssueInspectRange } from "../lib/inspectIssue";

const fullRange = { start: 1, end: 1000 };

it("centers an invalid value or duplicate step within the run", () => {
    expect(getIssueInspectRange({
        type: "INVALID_VALUE", step: 500, index: 499, metric: "loss", value: NaN,
    }, fullRange)).toEqual({ start: 475, end: 525 });
    expect(getIssueInspectRange({
        type: "DUPLICATE_STEP", step: 1, indices: [0, 1], values: [],
    }, fullRange)).toEqual({ start: 1, end: 26 });
});

it("includes both endpoints of missing and unsorted steps", () => {
    expect(getIssueInspectRange({
        type: "MISSING_STEPS", from: 200, to: 300, count: 101,
    }, fullRange)).toEqual({ start: 175, end: 325 });
    expect(getIssueInspectRange({
        type: "UNSORTED_STEP", index: 2, step: 100, previousStep: 500,
    }, fullRange)).toEqual({ start: 75, end: 525 });
});

it("does not invent a chart position for a non-finite step", () => {
    expect(getIssueInspectRange({
        type: "INVALID_STEP", index: 2, value: Infinity,
    }, fullRange)).toBeNull();
});

it("uses the affected metric chart for invalid values and loss for step issues", () => {
    expect(getIssueInspectMetric({
        type: "INVALID_VALUE", step: 10, index: 9, metric: "grad_norm", value: Infinity,
    })).toBe("grad_norm");
    expect(getIssueInspectMetric({
        type: "MISSING_STEPS", from: 10, to: 20, count: 11,
    })).toBe("loss");
});
