const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 10,
    useGrouping: false,
});

export function formatNumber(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return "—";
    return numberFormatter.format(value);
}
