import type {TrainingPoint} from "../types/types.ts";
import type {Metric} from "../types/types.ts";

function downsample(
    data : TrainingPoint[],
    bucketSize : number,
    metric: Metric,
    requiredSteps: ReadonlySet<number> = new Set(),
    refinedWindows: ReadonlyArray<{ start: number; end: number }> = []
): TrainingPoint[] {
    if (!Number.isSafeInteger(bucketSize) || bucketSize <= 0) {
        throw new Error("bucketSize must be a positive integer");
    }

    const result : TrainingPoint[] = [];

    for (let i = 0; i < data.length;) {
        const currentStep = data[i].step;
        const refinedWindow = refinedWindows.find((window) =>
            currentStep >= window.start && currentStep <= window.end
        );
        const nextWindow = refinedWindows.find((window) => window.start > currentStep);
        const effectiveSize = refinedWindow
            ? Math.max(1, Math.floor(bucketSize / 2))
            : bucketSize;
        let end = Math.min(i + effectiveSize, data.length);

        while (end > i + 1 && refinedWindow && data[end - 1].step > refinedWindow.end) end--;
        while (end > i + 1 && !refinedWindow && nextWindow &&
            data[end - 1].step >= nextWindow.start) end--;

        let minIndex = i;
        let maxIndex = i;
        const selected = new Set([i, end - 1]);

        for (let j = i; j < end; j++) {
            if (data[j][metric] < data[minIndex][metric]) {
                minIndex = j;
            }

            if (data[j][metric] > data[maxIndex][metric]) {
                maxIndex = j;
            }
            if (requiredSteps.has(data[j].step)) selected.add(j);
        }

        selected.add(minIndex);
        selected.add(maxIndex);
        const sorted = [...selected].sort((a, b) => a - b);
        for (const index of sorted) result.push(data[index]);
        i = end;
    }

    return result;
}

export default downsample;
