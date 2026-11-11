import { expect, it } from "vitest";
import { overviewWarningMarkers } from "../lib/overviewWarningMarkers";
import type { DataWarning } from "../lib/detectLossWarnings";

it("keeps exact warning values while separating nearby symbolic markers", () => {
    const warnings: DataWarning[] = [
        { type: "LOSS_SPIKE", step: 250_100, loss: 80, neighborMax: 1 },
        { type: "LOSS_SPIKE", step: 250_600, loss: 120, neighborMax: 1 },
        { type: "LOSS_SPIKE", step: 500_000, loss: 500, neighborMax: 1 },
    ];
    const markers = overviewWarningMarkers(
        warnings,
        { start: 1, end: 1_000_000 },
        [0, 6]
    );

    expect(markers.map((marker) => [marker.step, marker.value])).toEqual([
        [250_100, 80], [250_600, 120], [500_000, 500],
    ]);
    expect(markers.every((marker) => marker.symbolic && marker.y > 0 && marker.y < 6)).toBe(true);
    expect(markers[0].y).not.toBe(markers[1].y);
    expect(markers[0].y).toBe(markers[2].y);
});
