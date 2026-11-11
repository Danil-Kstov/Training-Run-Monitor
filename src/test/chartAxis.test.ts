import { expect, it } from "vitest";
import { createYAxis } from "../lib/chartAxis";

it("shows clean ticks for the steep loss curve without a floating-point tail", () => {
    const values = Array.from({ length: 10_000 }, (_, index) =>
        6.5 * Math.exp(-index / 400) + 0.1
    );
    const axis = createYAxis(values);

    expect(axis.domain[0]).toBe(0);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(6.6);
    expect(axis.ticks.map(axis.formatTick)).toEqual(["0", "2", "4", "6", "8"]);
});

it("gives an almost flat learning rate readable distinct labels", () => {
    const axis = createYAxis([0.01, 0.01, 0.01]);
    const labels = axis.ticks.map(axis.formatTick);

    expect(axis.domain[0]).toBeLessThan(0.01);
    expect(axis.domain[1]).toBeGreaterThan(0.01);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((label) => label.length < 12)).toBe(true);
});

it("keeps small finite values distinct without displaying them as zero", () => {
    const axis = createYAxis([0.0000001, 0.0000002]);
    const labels = axis.ticks.map(axis.formatTick);

    expect(axis.domain[0]).toBeLessThanOrEqual(0.0000001);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(0.0000002);
    expect(labels.some((label) => label !== "0")).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
});
