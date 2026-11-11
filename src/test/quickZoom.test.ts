import { expect, it } from "vitest";
import { getQuickZoomRange } from "../lib/quickZoom";

it("shows the requested fraction from the entered From step", () => {
    const selected = { start: 500, end: 1000 };

    expect(getQuickZoomRange(selected, 2)).toEqual({ start: 500, end: 750 });
    expect(getQuickZoomRange(selected, 4)).toEqual({ start: 500, end: 625 });
    expect(getQuickZoomRange(selected, 10)).toEqual({ start: 500, end: 550 });
});

it("uses the newly selected range on subsequent clicks", () => {
    const firstHalf = getQuickZoomRange({ start: 500, end: 1000 }, 2);

    expect(getQuickZoomRange(firstHalf, 2)).toEqual({ start: 500, end: 625 });
});

it("keeps at least two steps visible on a short run", () => {
    expect(getQuickZoomRange({ start: 5, end: 7 }, 10))
        .toEqual({ start: 5, end: 6 });
    expect(getQuickZoomRange({ start: 5, end: 6 }, 10))
        .toEqual({ start: 5, end: 6 });
});
