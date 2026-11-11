export const chartHeight = "clamp(260px, 32vw, 400px)";

export const chartMargin = {
    top: 8,
    right: 20,
    bottom: 16,
    left: 20,
};

export const chartYAxisWidth = 104;
export const chartXAxisHeight = 60;
export const chartXAxisPadding = 12;

export const canvasPlot = {
    left: chartMargin.left + chartYAxisWidth,
    right: chartMargin.right,
    top: chartMargin.top,
    bottom: chartMargin.bottom + chartXAxisHeight,
    xPadding: chartXAxisPadding,
};
