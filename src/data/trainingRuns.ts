
import type { TrainingRun } from "../types/types.ts";
import {
    addDuplicateSteps,
    addInvalidValues,
    addLossSpike,
    generatePoints,
    removePoints,
    shufflePoints,
} from "./generateTrainingRuns.ts";


export const trainingRuns: TrainingRun[] = [
    {
        id: "Run-01",
        name: "Normal training",
        pointCount: 1000,
        tags: ["normal"],
        generate() {
            return generatePoints({ count: this.pointCount });
        },
    },
    {
        id: "Run-02",
        name: "Loss spikes",
        pointCount: 1000,
        tags: ["spikes"],
        generate() {
            return addLossSpike(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 2.2,
                    decay: 50,
                }),
                [250, 750],
                [100, 200]
            );
        },
    },
    {
        id: "Run-03",
        name: "Invalid values",
        pointCount: 800,
        tags: ["invalid"],
        generate() {
            return addInvalidValues(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 2.8,
                    decay: 100,
                }),
                [
                    { index: 100, metric: "loss", value: NaN },
                    { index: 500, metric: "grad_norm", value: Infinity },
                ]
            );
        },
    },
    {
        id: "Run-04",
        name: "Normal training",
        pointCount: 500,
        tags: ["normal"],
        generate() {
            return generatePoints({
                count: this.pointCount,
                initialLoss: 4,
                decay: 250,
                learningRate: 0.01,
            });
        },
    },
    {
        id: "Run-05",
        name: "Normal training",
        pointCount: 990,
        tags: ["normal"],
        generate() {
            return generatePoints({
                count: this.pointCount,
                initialLoss: 5.5,
                decay: 300,
                learningRate: 0.01,
                gradientAmplitude: 0.05,
            });
        },
    },
    {
        id: "Run-06",
        name: "Missed steps",
        pointCount: 993,
        tags: ["missing"],
        generate() {
            return removePoints(
                generatePoints({
                    count: 1000,
                    initialLoss: 3.5,
                    decay: 150,
                    learningRate: 0.01,
                    gradientAmplitude: 0.05,
                }),
                [102, 103, 104, 105, 106, 107, 108]
            );
        },
    },
    {
        id: "Run-07",
        name: "Duplicate steps",
        pointCount: 890,
        tags: ["duplicate"],
        generate() {
            return addDuplicateSteps(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 3.5,
                    decay: 150,
                    learningRate: 0.01,
                    gradientAmplitude: 0.05,
                }),
                [404, 445, 505, 606]
            );
        },
    },
    {
        id: "Run-08",
        name: "Normal training",
        pointCount: 1_000_000,
        tags: ["normal", "large"],
        generate() {
            return generatePoints({
                count: this.pointCount,
                initialLoss: 6.5,
                decay: 400,
                learningRate: 0.01,
                gradientAmplitude: 0.05,
                gradientPeriod: 100,
            });
        },
    },
    {
        id: "Run-09",
        name: "Unsorted steps",
        pointCount: 840,
        tags: ["unsorted"],
        generate() {
            return shufflePoints(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 2.5,
                    decay: 250,
                    learningRate: 0.001,
                    gradientAmplitude: 0.8,
                }),
                42
            );
        },
    },
    {
        id: "Run-10",
        name: "Missed steps",
        pointCount: 747,
        tags: ["missing"],
        generate() {
            return removePoints(
                generatePoints({
                    count: 750,
                    initialLoss: 4.5,
                    decay: 225,
                    learningRate: 0.001,
                    gradientAmplitude: 0.05,
                    gradientPeriod: 100,
                }),
                [206, 337, 749]
            );
        },
    },
    {
        id: "Run-11",
        name: "Loss spikes",
        pointCount: 1200,
        tags: ["spikes"],
        generate() {
            return addLossSpike(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 3.2,
                    decay: 350,
                    learningRate: 0.0005,
                }),
                [150, 600, 950],
                [12, 35, 18]
            );
        },
    },
    {
        id: "Run-12",
        name: "Invalid values",
        pointCount: 1500,
        tags: ["invalid"],
        generate() {
            return addInvalidValues(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 4.2,
                    decay: 450,
                    learningRate: 0.001,
                }),
                [
                    { index: 200, metric: "loss", value: NaN },
                    { index: 700, metric: "lr", value: Infinity },
                    { index: 1100, metric: "grad_norm", value: -Infinity },
                ]
            );
        },
    },
    {
        id: "Run-13",
        name: "Unsorted and duplicate steps",
        pointCount: 2000,
        tags: ["unsorted", "duplicate"],
        generate() {
            return shufflePoints(
                addDuplicateSteps(
                    generatePoints({
                        count: this.pointCount,
                        initialLoss: 2.7,
                        decay: 300,
                        gradientAmplitude: 0.3,
                    }),
                    [150, 450, 900, 1600]
                ),
                123
            );
        },
    },
    {
        id: "Run-14",
        name: "Missing steps and loss spikes",
        pointCount: 1794,
        tags: ["missing", "spikes"],
        generate() {
            return addLossSpike(
                removePoints(
                    generatePoints({
                        count: 1800,
                        initialLoss: 5,
                        decay: 500,
                        learningRate: 0.0003,
                    }),
                    [100, 101, 102, 700, 701, 1400]
                ),
                [250, 800, 1200],
                [20, 45, 30]
            );
        },
    },
    {
        id: "Run-15",
        name: "Normal training",
        pointCount: 5000,
        tags: ["normal"],
        generate() {
            return generatePoints({
                count: this.pointCount,
                initialLoss: 3.8,
                decay: 700,
                learningRate: 0.0001,
                gradientAmplitude: 0.15,
                gradientPeriod: 40,
            });
        },
    },
    {
        id: "Run-16",
        name: "Duplicate steps",
        pointCount: 3500,
        tags: ["duplicate"],
        generate() {
            return addDuplicateSteps(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 4.6,
                    decay: 600,
                    learningRate: 0.002,
                }),
                [100, 101, 102, 800, 1600, 2400]
            );
        },
    },
    {
        id: "Run-17",
        name: "Unsorted steps",
        pointCount: 10000,
        tags: ["unsorted"],
        generate() {
            return shufflePoints(
                generatePoints({
                    count: this.pointCount,
                    initialLoss: 2.4,
                    decay: 800,
                    learningRate: 0.0008,
                    gradientAmplitude: 0.25,
                }),
                777
            );
        },
    },
    {
        id: "Run-18",
        name: "Multiple anomalies",
        pointCount: 2500,
        tags: ["spikes", "duplicate", "invalid"],
        generate() {
            return addInvalidValues(
                addDuplicateSteps(
                    addLossSpike(
                        generatePoints({
                            count: this.pointCount,
                            initialLoss: 4.8,
                            decay: 550,
                            learningRate: 0.001,
                        }),
                        [300, 1200, 2100],
                        [50, 100, 75]
                    ),
                    [400, 900, 1800]
                ),
                [
                    { index: 500, metric: "loss", value: NaN },
                    { index: 1500, metric: "grad_norm", value: Infinity },
                ]
            );
        },
    },
    {
        id: "Run-19",
        name: "Empty training",
        pointCount: 0,
        tags: ["empty"],
        generate() {
            return [];
        },
    },
    {
        id: "Run-20",
        name: "Million points with anomalies",
        pointCount: 1_000_000,
        tags: ["large", "spikes", "invalid"],
        generate() {
            return addInvalidValues(
                addLossSpike(
                    generatePoints({
                        count: this.pointCount,
                        initialLoss: 5.5,
                        decay: 100_000,
                        learningRate: 0.0005,
                        gradientAmplitude: 0.3,
                        gradientPeriod: 150,
                    }),
                    [250_099, 250_599, 499_999, 750_099, 750_499, 750_899],
                    [80, 120, 500, 90, 140, 110]
                ),
                [
                    { index: 200_000, metric: "loss", value: NaN },
                    { index: 750_000, metric: "grad_norm", value: Infinity },
                ]
            );
        },
    },
];
