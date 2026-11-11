import type { TrainingPoint } from "../types/types";

export type DataWarning = {
    type: "LOSS_SPIKE";
    step: number;
    loss: number;
    neighborMax: number;
};

export function detectLossWarnings(points: TrainingPoint[]): DataWarning[] {
    const warnings: DataWarning[] = [];

    for (let index = 1; index < points.length - 1; index++) {
        const previous = points[index - 1];
        const current = points[index];
        const next = points[index + 1];

        if (current.step - previous.step !== 1 || next.step - current.step !== 1 ||
            !Number.isFinite(previous.loss) || !Number.isFinite(current.loss) ||
            !Number.isFinite(next.loss)) continue;

        const neighborMax = Math.max(previous.loss, next.loss);
        if (neighborMax > 0 && current.loss >= neighborMax * 3 &&
            current.loss - neighborMax >= 1) {
            warnings.push({
                type: "LOSS_SPIKE",
                step: current.step,
                loss: current.loss,
                neighborMax,
            });
        }
    }

    return warnings;
}
