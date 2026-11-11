import type {GeneratePointsOptions, Metric, TrainingPoint} from "../types/types.ts";

export function generatePoints({
   count,
   initialLoss = 2,
   decay = 200,
   learningRate = 0.001,
   gradientAmplitude = 0.2,
   gradientPeriod = 20
} : GeneratePointsOptions
): TrainingPoint[] {
    return Array.from({length: count}, (_, index) => ({
        step: index + 1,
        loss: initialLoss * Math.exp(-index / decay) + 0.1,
        lr: learningRate,
        grad_norm: 1 + Math.sin(index / gradientPeriod) * gradientAmplitude,
    }));
}

export function addLossSpike(
    points: TrainingPoint[],
    indices: number[],
    values: number[]
): TrainingPoint[] {
    return points.map((point, i) => {
        const spikeIndex = indices.indexOf(i);

        if (spikeIndex === -1) {
            return point;
        }

        return {
            ...point,
            loss: values[spikeIndex],
        };
    });
}

export function addInvalidValues(
    points: TrainingPoint[],
    configs: {
        index: number,
        metric: Metric,
        value: number
    }[]
): TrainingPoint[] {
    return points.map((point, i) => {
        const updatedPoint = {...point};

        for (const config of configs) {
            if (config.index === i) {
                updatedPoint[config.metric] = config.value;
            }
        }

        return updatedPoint;
    });
}

export function addDuplicateSteps(
    points: TrainingPoint[],
    indices: number[]
): TrainingPoint[] {
    return points.map((point, i) =>
        indices.includes(i) && i > 0
            ? {...point, step: points[i - 1].step}
            : point
    );
}

function createRandom(seed: number) {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

export function shufflePoints(
    points: TrainingPoint[],
    seed: number = 42
): TrainingPoint[] {
    const result = [...points];
    const random = createRandom(seed);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

export function removePoints(
    points: TrainingPoint[],
    indices: number[]
): TrainingPoint[] {
    return points.filter((_, i) => !indices.includes(i));
}