import { expect, it } from "vitest";
import { getInvalidMarkers } from "../lib/chartMarkers";
import { trainingRuns } from "../data/trainingRuns";
import prepareTrainingPoints from "../lib/prepareTrainingPoints";
import { buildVisibleSeries } from "../lib/runView";
import type { DataIssue } from "../lib/prepareTrainingPoints";

const issues: DataIssue[] = [
    { type: "INVALID_VALUE", step: 2, index: 1, metric: "loss", value: NaN },
    { type: "INVALID_VALUE", step: 3, index: 2, metric: "loss", value: Infinity },
    { type: "INVALID_VALUE", step: 4, index: 3, metric: "loss", value: -Infinity },
    { type: "INVALID_VALUE", step: 5, index: 4, metric: "lr", value: Infinity },
];

it("places red-marker metadata at each invalid step for the selected metric", () => {
    const markers = getInvalidMarkers(issues, "loss", { start: 1, end: 4 }, [0, 10], true);

    expect(markers.map(({ step, label }) => [step, label])).toEqual([
        [2, "NaN"], [3, "+∞"], [4, "−∞"],
    ]);
    expect(markers[0].y).toBe(0.6);
    expect(markers[1].y).toBe(9.4);
    expect(markers[2].y).toBe(0.6);
    expect(getInvalidMarkers(issues, "lr", { start: 1, end: 4 }, [0, 10], true)).toEqual([]);
});

it("keeps markers visible when every value of a metric is invalid", () => {
    const markers = getInvalidMarkers(issues, "loss", { start: 2, end: 3 }, [0, 1], false);

    expect(markers.map((marker) => marker.y)).toEqual([0.5, 0.5]);
});

it("marks the invalid steps in Run-03 while retaining gaps in the series", () => {
    const run = trainingRuns.find((item) => item.id === "Run-03")!;
    const prepared = prepareTrainingPoints(run.generate());
    const range = { start: 1, end: 800 };
    const series = buildVisibleSeries(prepared.points, prepared.issues, range);

    expect(series.loss).toContainEqual(expect.objectContaining({ step: 101, loss: null }));
    expect(series.grad_norm).toContainEqual(expect.objectContaining({ step: 501, grad_norm: null }));
    expect(getInvalidMarkers(prepared.issues, "loss", range, [0, 3], true))
        .toMatchObject([{ step: 101, label: "NaN" }]);
    expect(getInvalidMarkers(prepared.issues, "grad_norm", range, [0, 3], true))
        .toMatchObject([{ step: 501, label: "+∞" }]);
});
