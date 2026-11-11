import type { StepRange } from "./runView";

export const quickZoomFractions = [2, 4, 10] as const;

export function getQuickZoomRange(
    selectedRange: StepRange,
    denominator: number
): StepRange {
    const selectedCount = selectedRange.end - selectedRange.start + 1;
    const visibleCount = Math.min(selectedCount, Math.max(2, Math.ceil(selectedCount / denominator)));

    return {
        start: selectedRange.start,
        end: selectedRange.start + visibleCount - 1,
    };
}
