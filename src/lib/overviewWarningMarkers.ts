import type { DataWarning } from "./detectLossWarnings";
import type { StepRange } from "./runView";

export type OverviewWarningMarker = {
    step: number;
    value: number;
    y: number;
    symbolic: boolean;
};

export function overviewWarningMarkers(
    warnings: DataWarning[],
    range: StepRange,
    domain: [number, number]
): OverviewWarningMarker[] {
    const [minimum, maximum] = domain;
    const inset = (maximum - minimum) * 0.06;
    const groups = new Map<number, number>();

    return warnings.flatMap((warning) => {
        if (warning.step < range.start || warning.step > range.end) return [];
        const group = Math.floor(warning.step / 1_000);
        const stack = groups.get(group) ?? 0;
        groups.set(group, stack + 1);
        const symbolic = warning.loss < minimum || warning.loss > maximum;
        const y = warning.loss > maximum
            ? maximum - inset * (1 + stack * 0.8)
            : warning.loss < minimum
                ? minimum + inset * (1 + stack * 0.8)
                : warning.loss;

        return [{ step: warning.step, value: warning.loss, y, symbolic }];
    });
}
