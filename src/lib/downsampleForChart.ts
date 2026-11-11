import type { TrainingPoint, ChartPoint, Metric,} from "../types/types";
import downsample from "./downsample";

export function downsampleForChart(
    points: TrainingPoint[],
    bucketSize: number,
    metric: Metric,
    duplicateSteps: ReadonlySet<number> = new Set(),
    requiredSteps: ReadonlySet<number> = new Set(),
    refinedWindows: ReadonlyArray<{ start: number; end: number }> = []
): ChartPoint[] {
    const result: ChartPoint[] = [];
    let segment: TrainingPoint[] = [];
    let previous: TrainingPoint | null = null;

    const flush = () => {
        if (segment.length === 0) return;

        result.push(
            ...downsample(segment, bucketSize, metric, requiredSteps, refinedWindows)
        );

        segment = [];
    };

    for (const point of points) {
        if (duplicateSteps.has(point.step)) {
            flush();
            if (previous?.step !== point.step) {
                result.push({ ...point, [metric]: null });
            }
            previous = point;
            continue;
        }

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
