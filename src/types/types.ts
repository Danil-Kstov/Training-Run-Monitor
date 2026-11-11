export type Metric = "loss" | "lr" | "grad_norm";

export type GeneratePointsOptions = {
    count: number;
    initialLoss?: number;
    decay?: number;
    learningRate?: number;
    gradientAmplitude?: number;
    gradientPeriod?: number;
};

export type TrainingPoint = {
    step: number;
    loss: number;
    lr: number;
    grad_norm: number;
};

export type TrainingRun = {
    id: string;
    name: string;
    pointCount: number;
    tags: string[];
    generate(this: TrainingRun): TrainingPoint[];
};

export type ChartPoint = {
    step: number;
    loss: number | null;
    lr: number | null;
    grad_norm: number | null;
    anchor?: boolean;
};
