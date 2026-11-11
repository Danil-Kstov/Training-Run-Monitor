import type {TrainingPoint} from "../types/types.ts";

const metrics = ["loss", "lr", "grad_norm"] as const;

export type DataIssue =
    | {
    type: "DUPLICATE_STEP";
    step: number;
    indices: number[];
}
    | {
    type: "INVALID_VALUE";
    step: number;
    index: number;
    metric: "loss" | "lr" | "grad_norm";
    value: number;
}
    | {
    type: "INVALID_STEP";
    index: number;
    value: number;
}
    | {
    type: "MISSING_STEPS";
    from: number;
    to: number;
    count: number;
};

type PreparedTrainingData = {
    points: TrainingPoint[];
    issues: DataIssue[];
};

function prepareTrainingPoints(
    input: TrainingPoint[]
): PreparedTrainingData {
    const issues: DataIssue[] = [];

    const validSteps: Array<{
        point: TrainingPoint;
        originalIndex: number;
    }> = [];

    input.forEach((point, index) => {
        if (!Number.isFinite(point.step)) {
            issues.push({
                type: "INVALID_STEP",
                index,
                value: point.step,
            });
            return;
        }

        for (const metric of metrics) {
            if (!Number.isFinite(point[metric])) {
                issues.push({
                    type: "INVALID_VALUE",
                    step: point.step,
                    index,
                    metric,
                    value: point[metric],
                });
            }
        }

        validSteps.push({
            point: { ...point },
            originalIndex: index,
        });
    });

    validSteps.sort(
        (a, b) =>
            a.point.step - b.point.step ||
            a.originalIndex - b.originalIndex,
    );

    for (let i = 1; i < validSteps.length; i++) {
        const previousStep = validSteps[i - 1].point.step;
        const currentStep = validSteps[i].point.step;

        if (currentStep - previousStep > 1) {
            issues.push({
                type: "MISSING_STEPS",
                from: previousStep + 1,
                to: currentStep - 1,
                count: currentStep - previousStep - 1,
            });
        }
    }

    const indicesByStep = new Map<number, number[]>();

    for (const { point, originalIndex } of validSteps) {
        const indices = indicesByStep.get(point.step) ?? [];
        indices.push(originalIndex);
        indicesByStep.set(point.step, indices);
    }

    for (const [step, indices] of indicesByStep) {
        if (indices.length > 1) {
            issues.push({
                type: "DUPLICATE_STEP",
                step,
                indices,
            });
        }
    }

    return {
        points: validSteps.map(({ point }) => point),
        issues,
    };
}

export default prepareTrainingPoints;