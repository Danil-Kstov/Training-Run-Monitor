import { expect, it } from "vitest";
import { trainingRuns } from "../data/trainingRuns";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import { detectLossWarnings } from "../lib/detectLossWarnings";
import { buildVisibleSeries, createSamplingHints, summarizeRun } from "../lib/runView";
import type { TrainingPoint } from "../types/types";

it("finds isolated spikes even when there are three in every thousand points", () => {
    const spikeSteps: number[] = [];
    const points: TrainingPoint[] = Array.from({ length: 100_000 }, (_, index) => {
        const step = index + 1;
        const isSpike = [100, 450, 800].includes(step % 1000);
        if (isSpike) spikeSteps.push(step);

        return { step, loss: isSpike ? 20 : 1, lr: 0.001, grad_norm: 1 };
    });

    const warnings = detectLossWarnings(points);
    expect(warnings.map((warning) => warning.step)).toEqual(spikeSteps);
    expect(spikeSteps).toHaveLength(300);
    expect(summarizeRun(points, [], warnings).warningCount).toBe(300);
    const hints = createSamplingHints(points, warnings);
    const sampled = buildVisibleSeries(points, [], { start: 1, end: 100_000 }, 80, hints);
    const ordinary = buildVisibleSeries(points, [], { start: 1, end: 100_000 }, 80);
    expect(sampled.loss.filter((item) => item.loss === 20).map((item) => item.step)).toEqual(spikeSteps);
    expect(sampled.lr).toEqual(ordinary.lr);
    expect(sampled.grad_norm).toEqual(ordinary.grad_norm);
});

it("does not call smooth changes, gaps, invalid values or duplicate steps spikes", () => {
    const points: TrainingPoint[] = [
        { step: 1, loss: 1, lr: 0.001, grad_norm: 1 },
        { step: 2, loss: 1.5, lr: 0.001, grad_norm: 1 },
        { step: 3, loss: 2, lr: 0.001, grad_norm: 1 },
        { step: 4, loss: NaN, lr: 0.001, grad_norm: 1 },
        { step: 6, loss: 100, lr: 0.001, grad_norm: 1 },
        { step: 6, loss: 100, lr: 0.001, grad_norm: 1 },
        { step: 7, loss: 1, lr: 0.001, grad_norm: 1 },
    ];

    expect(detectLossWarnings(points)).toEqual([]);
});

it("reports all six known warnings in Run-20", () => {
    const run = trainingRuns.find((item) => item.id === "Run-20")!;
    const prepared = prepareTrainingPoints(run.generate());

    expect(detectLossWarnings(prepared.points).map(({ step, loss }) => [step, loss])).toEqual([
        [250_100, 80], [250_600, 120], [500_000, 500],
        [750_100, 90], [750_500, 140], [750_900, 110],
    ]);
}, 30_000);
