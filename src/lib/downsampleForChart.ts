import type { TrainingPoint, ChartPoint, Metric,} from "../types/types";
import downsample from "./downsample";

export function downsampleForChart(
    points: TrainingPoint[],
    bucketSize: number,
    metric: Metric
): ChartPoint[] {
    const result: ChartPoint[] = [];
    let segment: TrainingPoint[] = [];
    let previous: TrainingPoint | null = null;

    const flush = () => {
        if (segment.length === 0) return;

        result.push(
            ...downsample(segment, bucketSize, metric)
        );

        segment = [];
    };

    for (const point of points) {
        const valid = Number.isFinite(point[metric]);

        const missingSteps =
            previous !== null &&
            point.step - previous.step > 1;

        if (missingSteps) {
            flush();

            result.push({
                ...point,
                step: previous!.step + 1,
                [metric]: null,
            });
        }

        if (!valid) {
            flush();

            result.push({
                ...point,
                [metric]: null,
            });
        } else {
            segment.push(point);
        }

        previous = point;
    }

    flush();

    return result;
}
