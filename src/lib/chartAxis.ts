export type ChartAxis = {
    domain: [number, number];
    ticks: number[];
    formatTick: (value: number) => string;
};

const niceMultipliers = [1, 2, 2.5, 5, 10];

export function createYAxis(values: number[]): ChartAxis {
    let minimum = Infinity;
    let maximum = -Infinity;

    for (const value of values) {
        if (!Number.isFinite(value)) continue;
        if (value < minimum) minimum = value;
        if (value > maximum) maximum = value;
    }

    return createYAxisFromBounds(minimum, maximum);
}

export function createYAxisFromBounds(minimum: number, maximum: number): ChartAxis {
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
        return {
            domain: [0, 1],
            ticks: [0, 0.25, 0.5, 0.75, 1],
            formatTick: (value) => String(value),
        };
    }

    const nearlyFlat = maximum - minimum <= Math.max(Math.abs(maximum), 1) * 1e-9;
    let lower = minimum;
    let upper = maximum;

    if (nearlyFlat) {
        const padding = Math.max(Math.abs(maximum) * 0.1, 1e-12);
        lower -= padding;
        upper += padding;
    } else {
        const span = upper - lower;
        if (lower >= 0 && lower <= span * 0.2) lower = 0;
        else lower -= span * 0.04;
        upper += span * 0.04;
    }

    const rawStep = (upper - lower) / 4;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const multiplier = niceMultipliers.find((item) => item * magnitude >= rawStep) ?? 10;
    const step = multiplier * magnitude;
    const first = Math.floor(lower / step) * step;
    const last = Math.ceil(upper / step) * step;
    const tickCount = Math.round((last - first) / step) + 1;
    const ticks = Array.from({ length: tickCount }, (_, index) =>
        Number((first + index * step).toPrecision(12))
    );
    const decimals = Math.min(10, Math.max(0, Math.ceil(-Math.log10(step)) + 1));
    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: decimals,
        useGrouping: false,
    });

    return {
        domain: [ticks[0], ticks.at(-1)!],
        ticks,
        formatTick: (value) => {
            if (value === 0) return "0";
            if (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6) {
                return value.toExponential(3).replace("e+", "e");
            }
            return formatter.format(value);
        },
    };
}
