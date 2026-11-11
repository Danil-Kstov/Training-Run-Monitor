import { expect, it } from "vitest";
import { buildChartPayload, getRawStepValues } from "../lib/chartPayload";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import { detectLossWarnings } from "../lib/detectLossWarnings";
import { trainingRuns } from "../data/trainingRuns";
import type { TrainingPoint } from "../types/types";

const point = (step: number, loss = 1): TrainingPoint => ({
    step,
    loss,
    lr: step / 1_000_000,
    grad_norm: step / 100,
});

it("switches at 100,000 visible points and keeps the exact global 1,000th positions", () => {
    const input = Array.from({ length: 100_000 }, (_, index) => point(index + 1));
    input[1_500].loss = 50;
    input[1_233].lr = 99;
    input[54_320].loss = NaN;
    input[60_000].step = 60_000;
    [input[12_344], input[12_345]] = [input[12_345], input[12_344]];
    const prepared = prepareTrainingPoints(input);
    const warnings = detectLossWarnings(prepared.points);
    const overview = buildChartPayload(
        prepared.points,
        prepared.issues,
        warnings,
        { start: 1, end: 100_000 },
        "overview"
    );

    expect(overview.sampled).toBe(true);
    expect(overview.visibleCount).toBe(100_000);
    expect(overview.data?.loss.some((item) => item.step === 1)).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 1_001)).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 1_235)).toBe(false);
    expect(overview.data?.lr.some((item) => item.step === 1_234)).toBe(false);
    expect(overview.data?.loss.some((item) => item.step === 1_234)).toBe(false);
    expect(overview.data?.loss.filter((item) => item.anchor).slice(0, 3)
        .map((item) => item.step)).toEqual([1, 1_001, 2_001]);
    expect(warnings.some((warning) => warning.step === 1_501 && warning.loss === 50)).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 1_501 && item.loss === null)).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 54_321 && item.loss === null)).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 100_000)).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 60_000 && item.loss === null)).toBe(true);
    expect(prepared.issues.some((issue) => issue.type === "UNSORTED_STEP")).toBe(true);
    expect(overview.data?.loss.some((item) => item.step === 12_345)).toBe(true);
    expect(overview.renderedCount).toBeLessThan(2_000);

    const underThreshold = buildChartPayload(
        prepared.points,
        prepared.issues,
        warnings,
        { start: 2, end: 100_000 },
        "overview"
    );
    expect(underThreshold.sampled).toBe(false);
    expect(underThreshold.visibleCount).toBe(99_999);
    expect(underThreshold.rawData?.steps.length).toBe(99_999);
});

it("transfers every real point in All mode, retaining invalids and duplicate values", () => {
    const input = Array.from({ length: 100_000 }, (_, index) => point(index + 1));
    input[20_000].loss = Infinity;
    input[60_000].step = 60_000;
    const prepared = prepareTrainingPoints(input);
    const all = buildChartPayload(
        prepared.points,
        prepared.issues,
        [],
        { start: 1, end: 100_000 },
        "all"
    );
    const raw = all.rawData!;

    expect(all.renderedCount).toBe(100_000);
    expect(raw.steps.length).toBe(100_000);
    expect(raw.loss[20_000]).toBe(Infinity);
    expect(raw.duplicates[59_999]).toBe(1);
    expect(raw.duplicates[60_000]).toBe(1);
    expect(raw.breaks[60_001]).toBe(1);
    expect(getRawStepValues(raw, "loss", 60_000)).toEqual({
        step: 60_000,
        values: [1, 1],
    });
    expect(getRawStepValues(raw, "loss", 20_001)).toEqual({
        step: 20_001,
        values: [Infinity],
    });
});

it("uses real gap boundaries rather than gaps introduced by overview sampling", () => {
    const input = Array.from({ length: 100_000 }, (_, index) => point(index + 1));
    input[40_000].step = 40_002;
    const prepared = prepareTrainingPoints(input);
    const overview = buildChartPayload(
        prepared.points,
        prepared.issues,
        [],
        { start: 1, end: 100_000 },
        "overview"
    );
    const nullSteps = overview.data!.loss.filter((item) => item.loss === null)
        .map((item) => item.step);

    expect(nullSteps).toContain(40_001);
    expect(nullSteps).not.toContain(1_002);
    expect(nullSteps).not.toContain(2_002);
});

it("keeps every Run-20 warning and invalid point in the actual worker overview payload", () => {
    const run = trainingRuns.find((item) => item.id === "Run-20")!;
    const prepared = prepareTrainingPoints(run.generate());
    const warnings = detectLossWarnings(prepared.points);
    const overview = buildChartPayload(
        prepared.points,
        prepared.issues,
        warnings,
        { start: 1, end: 1_000_000 },
        "overview"
    );

    expect(overview.sampled).toBe(true);
    expect(overview.renderedCount).toBe(1_007);
    for (const metric of ["loss", "lr", "grad_norm"] as const) {
        expect(overview.data![metric].filter((item) => item.anchor)).toHaveLength(1_000);
        expect(overview.data![metric]).toHaveLength(1_007);
    }
    for (const warning of warnings) {
        expect(overview.data!.loss).toContainEqual(expect.objectContaining({
            step: warning.step,
            loss: null,
        }));
        expect(overview.data!.lr.some((item) => item.step === warning.step)).toBe(true);
    }
    expect(overview.data!.loss).toContainEqual(expect.objectContaining({
        step: 200_001,
        loss: null,
    }));
    expect(overview.data!.grad_norm).toContainEqual(expect.objectContaining({
        step: 750_001,
        grad_norm: null,
    }));
    expect(overview.renderedCount).toBeLessThan(10_000);

    const wideZoom = buildChartPayload(
        prepared.points,
        prepared.issues,
        warnings,
        { start: 250_001, end: 350_000 },
        "overview"
    );
    expect(wideZoom.sampled).toBe(true);
    expect(wideZoom.data!.loss.some((item) => item.step === 251_001)).toBe(true);
    expect(wideZoom.data!.loss.some((item) => item.step === 250_100 && item.loss === null)).toBe(true);
    expect(wideZoom.data!.loss.some((item) => item.step === 250_600 && item.loss === null)).toBe(true);

    const inspect = buildChartPayload(
        prepared.points,
        prepared.issues,
        warnings,
        { start: 250_075, end: 250_125 },
        "overview"
    );
    expect(inspect.sampled).toBe(false);
    expect(inspect.renderedCount).toBe(51);
    expect(inspect.data!.loss).toContainEqual(expect.objectContaining({
        step: 250_100,
        loss: warnings[0].loss,
    }));
}, 30_000);
