import {it, expect} from "vitest";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import type {TrainingPoint} from "../data/trainingRuns";

it("sorts points and preserves duplicate steps", () => {
    const data: TrainingPoint[] = [
        {step: 3, loss: 0.7, lr: 0.01, grad_norm: 1.2},
        {step: 1, loss: 0.9, lr: 0.01, grad_norm: 1.5},
        {step: 3, loss: 0.65, lr: 0.01, grad_norm: 1.1},
        {step: 4, loss: NaN, lr: 0.01, grad_norm: 1.0},
    ];

    const result = prepareTrainingPoints(data);

    expect(result.points.map((point) => point.step))
        .toEqual([1, 3, 3, 4]);

    expect(
        result.points
            .filter((point) => point.step === 3)
            .map((point) => point.loss)
    ).toEqual([0.7, 0.65]);

    expect(
        result.issues
    ).toContainEqual({
        type: "DUPLICATE_STEP",
        step: 3,
        indices: [0, 2],
    })
});

it("tracking NaN and Infinity", () => {
    const data: TrainingPoint[] = [
        {step: 1, loss: 0.9, lr: 0.01, grad_norm: 1.5},
        {step: 2, loss: NaN, lr: 0.01, grad_norm: 1.4},
        {step: 3, loss: Infinity, lr: 0.01, grad_norm: 1.3},
        {step: 4, loss: 0.8, lr: 0.01, grad_norm: NaN},
    ];

    const result = prepareTrainingPoints(data);

    expect(result.issues).toEqual([
        {
            type: "INVALID_VALUE",
            step: 2,
            index: 1,
            metric: "loss",
            value: NaN,
        },
        {
            type: "INVALID_VALUE",
            step: 3,
            index: 2,
            metric: "loss",
            value: Infinity,
        },
        {
            type: "INVALID_VALUE",
            step: 4,
            index: 3,
            metric: "grad_norm",
            value: NaN,
        },
    ]);

    expect(result.points).toHaveLength(4);
    expect(result.points[1].loss).toBeNaN();
    expect(result.points[2].loss).toBe(Infinity);
    expect(result.points[3].grad_norm).toBeNaN();
})

it("handles invalid steps", () => {
    const data: TrainingPoint[] = [
        { step: 1, loss: 0.9, lr: 0.01, grad_norm: 1.5 },
        { step: NaN, loss: 0.8, lr: 0.01, grad_norm: 1.4 },
        { step: 3, loss: 0.7, lr: 0.01, grad_norm: 1.3 },
    ];

    const result = prepareTrainingPoints(data);

    expect(result.issues).toContainEqual({
        type: "INVALID_STEP",
        index: 1,
        value: NaN,
    });

    expect(result.points.map(point => point.step)).toEqual([1, 3]);
})