import {expect, it} from "vitest";
import downsample from "../lib/downsample.ts";
import type {TrainingPoint} from "../types/types.ts";

it('preserves min and max loss in each bucket', () => {
    const data: TrainingPoint[] = [
        {step: 1, loss: 4, lr: 0.01, grad_norm: 1.2},
        {step: 2, loss: 90, lr: 0.01, grad_norm: 1.5},
        {step: 3, loss: 3, lr: 0.01, grad_norm: 1.1},
        {step: 4, loss: 2, lr: 0.01, grad_norm: 1.0},
        {step: 5, loss: 1.5, lr: 0.01, grad_norm: 1.2},
        {step: 6, loss: 1.4, lr: 0.01, grad_norm: 1.5},
        {step: 7, loss: 66, lr: 0.01, grad_norm: 1.1},
        {step: 8, loss: 1.2, lr: 0.01, grad_norm: 1.0},
    ];

    const result = downsample(data, 4, "loss")

    expect(result.map(point => point.loss)).toEqual([90, 2, 66, 1.2]);
});

it("testing with an incomplete group", () => {
    const data: TrainingPoint[] = [
        {step: 1, loss: 4, lr: 0.01, grad_norm: 1.2},
        {step: 2, loss: 90, lr: 0.01, grad_norm: 1.5},
        {step: 3, loss: 3, lr: 0.01, grad_norm: 1.1},
        {step: 4, loss: 2, lr: 0.01, grad_norm: 1.0},
        {step: 5, loss: 1.5, lr: 0.01, grad_norm: 1.2},
        {step: 6, loss: 1.4, lr: 0.01, grad_norm: 1.5},
    ];

    const result = downsample(data, 4, "loss")

    expect(result.map(point => point.loss)).toEqual([90, 2, 1.5, 1.4]);
})

it("testing with a huge bucket", () => {
    const data: TrainingPoint[] = [
        {step: 1, loss: 4, lr: 0.01, grad_norm: 1.2},
        {step: 2, loss: 90, lr: 0.01, grad_norm: 1.5},
        {step: 3, loss: 3, lr: 0.01, grad_norm: 1.1},
        {step: 4, loss: 2, lr: 0.01, grad_norm: 1.0},
    ];

    const result = downsample(data, 100, "loss")

    expect(result.map(point => point.loss)).toEqual([90, 2]);
})

it("testing with an incorrect bucket", () => {
    const data: TrainingPoint[] = [
        {step: 1, loss: 4, lr: 0.01, grad_norm: 1.2},
        {step: 2, loss: 90, lr: 0.01, grad_norm: 1.5},
        {step: 3, loss: 3, lr: 0.01, grad_norm: 1.1},
        {step: 4, loss: 2, lr: 0.01, grad_norm: 1.0},
        {step: 5, loss: 1.5, lr: 0.01, grad_norm: 1.2},
        {step: 6, loss: 1.4, lr: 0.01, grad_norm: 1.5},
    ];

    expect(() => downsample(data, 0, "loss")).toThrow(
        "bucketSize must be a positive integer"
    );
    expect(() => downsample(data, NaN, "loss")).toThrow();
    expect(() => downsample(data, 1.5, "loss")).toThrow();
})