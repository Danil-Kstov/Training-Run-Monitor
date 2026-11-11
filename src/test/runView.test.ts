import { expect, it } from "vitest";
import { trainingRuns } from "../data/trainingRuns";
import { formatNumber } from "../lib/formatNumber";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import { buildVisibleSeries, createSamplingHints, summarizeRun } from "../lib/runView";
import { detectLossWarnings } from "../lib/detectLossWarnings";
import type { TrainingPoint } from "../types/types";

const point = (step: number, loss: number): TrainingPoint => ({
    step,
    loss,
    lr: 0.001,
    grad_norm: 1,
});

it("retains every Run-20 warning at full range and each enclosing zoom level", () => {
    const run = trainingRuns.find((item) => item.id === "Run-20")!;
    const prepared = prepareTrainingPoints(run.generate());
    const warnings = detectLossWarnings(prepared.points);
    const hints = createSamplingHints(prepared.points, warnings);
    const expectedSteps = [250_100, 250_600, 500_000, 750_100, 750_500, 750_900];

    expect(prepared.points).toHaveLength(1_000_000);
    expect(warnings.map((item) => item.step)).toEqual(expectedSteps);
    expect(hints.denseWindows).toEqual([
        { start: 250_001, end: 251_000 },
        { start: 750_001, end: 751_000 },
    ]);

    for (const [start, end] of [
        [1, 1_000_000],
        [250_001, 251_000],
        [250_099, 250_601],
        [250_000, 750_000],
        [499_000, 501_000],
        [499_999, 500_001],
        [750_001, 751_000],
        [750_499, 750_901],
    ]) {
        const visible = buildVisibleSeries(prepared.points, prepared.issues, { start, end }, 800, hints);
        for (const warning of warnings.filter((item) => item.step >= start && item.step <= end)) {
            expect(visible.loss).toContainEqual(expect.objectContaining({
                step: warning.step,
                loss: warning.loss,
            }));
        }
        expect(visible.loss.every((item) => item.step >= start && item.step <= end)).toBe(true);
    }

    const full = buildVisibleSeries(prepared.points, prepared.issues, { start: 1, end: 1_000_000 }, 800, hints);
    expect(full.loss).toContainEqual(expect.objectContaining({ step: 200_001, loss: null }));
    expect(full.grad_norm).toContainEqual(expect.objectContaining({ step: 750_001, grad_norm: null }));
    expect(full.loss.length).toBeLessThan(10_000);
}, 30_000);

it("retains a single spike across every enclosing integer range in a compact series", () => {
    const prepared = prepareTrainingPoints(
        Array.from({ length: 101 }, (_, index) => point(index + 1, index === 50 ? 500 : 1))
    );

    for (let start = 1; start <= 51; start++) {
        for (let end = 51; end <= 101; end++) {
            const visible = buildVisibleSeries(prepared.points, prepared.issues, { start, end }, 5);
            expect(visible.loss.some((item) => item.step === 51 && item.loss === 500)).toBe(true);
        }
    }
});

it("keeps invalid values and missing steps as gaps, never zero or a joined line", () => {
    const prepared = prepareTrainingPoints([
        point(1, 4),
        point(2, NaN),
        point(3, 3),
        point(5, Infinity),
        point(6, 2),
    ]);
    const visible = buildVisibleSeries(prepared.points, prepared.issues, { start: 1, end: 6 }, 2);

    expect(visible.loss.filter((item) => item.loss === null).map((item) => item.step)).toEqual([2, 4, 5]);
    expect(visible.loss.some((item) => item.loss === 0)).toBe(false);
    expect(visible.loss.filter((item) => item.loss !== null).every((item) =>
        prepared.points.some((raw) => raw.step === item.step && raw.loss === item.loss)
    )).toBe(true);
});

it("preserves warning points and issue gaps together in a refined block", () => {
    const input = Array.from({ length: 1000 }, (_, index) => point(index + 1, 1));
    input[99].loss = 20;
    input[499].loss = 30;
    input[699].loss = NaN;
    input.splice(799, 1);
    const prepared = prepareTrainingPoints(input);
    const warnings = detectLossWarnings(prepared.points);
    const hints = createSamplingHints(prepared.points, warnings);
    const visible = buildVisibleSeries(
        prepared.points,
        prepared.issues,
        { start: 1, end: 1000 },
        10,
        hints
    );

    expect(hints.denseWindows).toEqual([{ start: 1, end: 1000 }]);
    expect(visible.loss.filter((item) => item.loss === 20 || item.loss === 30)
        .map((item) => item.step)).toEqual([100, 500]);
    expect(visible.loss.filter((item) => item.loss === null).map((item) => item.step))
        .toEqual([700, 800]);
});

it("sorts steps but excludes conflicting duplicate values from the connected line", () => {
    const prepared = prepareTrainingPoints([
        point(4, 4),
        point(2, 2),
        point(2, 20),
        point(3, 3),
    ]);
    const visible = buildVisibleSeries(prepared.points, prepared.issues, { start: 2, end: 4 });

    expect(prepared.issues.some((issue) => issue.type === "UNSORTED_STEP")).toBe(true);
    expect(prepared.issues).toContainEqual({
        type: "DUPLICATE_STEP",
        step: 2,
        indices: [1, 2],
        values: [
            { loss: 2, lr: 0.001, grad_norm: 1 },
            { loss: 20, lr: 0.001, grad_norm: 1 },
        ],
    });
    expect(visible.loss.map((item) => [item.step, item.loss])).toEqual([
        [2, null], [3, 3], [4, 4],
    ]);
});

it("uses raw finite values for summary and formats chart values without zeroing small numbers", () => {
    const prepared = prepareTrainingPoints([
        point(1, 4),
        point(2, NaN),
        { ...point(3, 0.000000123), lr: Infinity },
    ]);
    const summary = summarizeRun(prepared.points, prepared.issues);

    expect(summary.latest.loss).toBe(0.000000123);
    expect(summary.latest.lr).toBe(0.001);
    expect(summary.minLoss).toBe(0.000000123);
    expect(summary.maxLoss).toBe(4);
    expect(formatNumber(summary.latest.loss)).not.toBe("0");
    expect(formatNumber(null)).toBe("—");
});
