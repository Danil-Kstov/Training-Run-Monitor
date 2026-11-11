import type {TrainingPoint} from "../types/types.ts";
import type {Metric} from "../types/types.ts";

function downsample(
    data : TrainingPoint[],
    bucketSize : number,
    metric: Metric
): TrainingPoint[] {
    if (!Number.isSafeInteger(bucketSize) || bucketSize <= 0) {
        throw new Error("bucketSize must be a positive integer");
    }

    const result : TrainingPoint[] = [];

    for (let i = 0; i < data.length; i += bucketSize) {
        let minIndex = i;
        let maxIndex = i;

        for (let j = i; j < Math.min(i + bucketSize, data.length); j++) {
            if (data[j][metric] < data[minIndex][metric]) {
                minIndex = j;
            }

            if (data[j][metric] > data[maxIndex][metric]) {
                maxIndex = j;
            }
        }

        if (minIndex === maxIndex) {
            result.push(data[minIndex]);
        } else if (minIndex < maxIndex) {
            result.push(data[minIndex], data[maxIndex]);
        } else {
            result.push(data[maxIndex], data[minIndex]);
        }
    }

    return result;
}

export default downsample;