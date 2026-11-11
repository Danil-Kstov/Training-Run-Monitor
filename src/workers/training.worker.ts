import { trainingRuns } from "../data/trainingRuns";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import type {ChartPoint, Metric} from "../types/types";
import {downsampleForChart} from "../lib/downsampleForChart.ts";

const metrics = ["loss", "lr", "grad_norm"] as const satisfies readonly Metric[];


self.onmessage = (
    event: MessageEvent<{ requestId: number; runId: string }>
) => {
    const { requestId, runId } = event.data;

    try {
        const run = trainingRuns.find(
            (item) => item.id === runId
        );

        if (!run) {
            throw new Error("Training run not found");
        }

        const rawPoints = run.generate();
        const prepared = prepareTrainingPoints(rawPoints);

        const bucketSize = Math.max(
            1,
            Math.ceil(prepared.points.length / 1000)
        );

        const result = {} as Record<Metric, ChartPoint[]>;

        for (const metric of metrics) {
            result[metric] = downsampleForChart(
                prepared.points,
                bucketSize,
                metric
            );
        }

        self.postMessage({
            requestId,
            runId,
            data: result,
            issues: prepared.issues,
        });

    } catch (error) {
        self.postMessage({
            requestId,
            runId,
            error: error instanceof Error
                ? error.message
                : "Unknown error",
        });
    }
};
