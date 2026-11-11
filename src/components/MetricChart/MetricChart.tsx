import { memo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceDot, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint, Metric } from "../../types/types";
import type { DataIssue } from "../../lib/prepareTrainingPoints";
import type { StepRange } from "../../lib/runView";
import { formatNumber } from "../../lib/formatNumber";
import { createYAxis } from "../../lib/chartAxis";
import { getInvalidMarkers } from "../../lib/chartMarkers";
import type { RawChartData } from "../../lib/chartPayload";
import CanvasPlot from "./CanvasPlot";
import type { DataWarning } from "../../lib/detectLossWarnings";
import { overviewWarningMarkers } from "../../lib/overviewWarningMarkers";
import {
    chartHeight,
    chartMargin,
    chartXAxisHeight,
    chartXAxisPadding,
    chartYAxisWidth,
} from "../../lib/chartLayout";

type MetricChartProps = {
    metric: Metric;
    data?: ChartPoint[];
    rawData?: RawChartData;
    sampled?: boolean;
    range: StepRange;
    issues: DataIssue[];
    warnings: DataWarning[];
    onZoom: (range: StepRange) => void;
};

const colors: Record<Metric, string> = {
    loss: "#22D3EE",
    lr: "#C4B5FD",
    grad_norm: "#6EE7B7",
};

const MetricChart = ({
    metric,
    data,
    rawData,
    sampled,
    range,
    issues,
    warnings,
    onZoom,
}: MetricChartProps) => {
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const duplicateMarkers = issues.flatMap((issue) => {
        if (issue.type !== "DUPLICATE_STEP" ||
            issue.step < range.start || issue.step > range.end) return [];

        return issue.values
            .map((value) => ({ step: issue.step, value: value[metric] }))
            .filter(({ value }) => Number.isFinite(value));
    });
    const finiteValues = [
        ...(data ?? []).map((point) => point[metric]),
        ...duplicateMarkers.map((marker) => marker.value),
    ].filter((value): value is number => value !== null && Number.isFinite(value));
    const yAxis = createYAxis(finiteValues);
    const invalidMarkers = getInvalidMarkers(
        issues,
        metric,
        range,
        yAxis.domain,
        finiteValues.length > 0
    );
    const warningMarkers = sampled && metric === "loss"
        ? overviewWarningMarkers(warnings, range, yAxis.domain)
        : [];

    const finishDrag = () => {
        if (dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
            const start = Math.max(range.start, Math.floor(Math.min(dragStart, dragEnd)));
            const end = Math.min(range.end, Math.ceil(Math.max(dragStart, dragEnd)));
            if (start < end) onZoom({ start, end });
        }
        setDragStart(null);
        setDragEnd(null);
    };

    return (
        <div
            id={`metric-chart-${metric}`}
            className="main__chart"
            role="region"
            aria-label={`${metric} chart`}
            tabIndex={-1}
        >
            <h2 className="main__chart-title">{metric}</h2>

            <p className="main__chart-note">
                {invalidMarkers.length > 0 && (
                    <span>Red: NaN or Infinity at the true step; Y is symbolic.</span>
                )}
            </p>

            <div className="main__chart-warning-note">
                {warningMarkers.length > 0 && (
                    <span>Orange: Warning at the true step; Y is symbolic outside the scale. Exact values below.</span>
                )}
            </div>

            {!rawData && finiteValues.length === 0 && (
                <p role="status">No finite {metric} values in this range.</p>
            )}

            {rawData && (
                <CanvasPlot
                    metric={metric}
                    raw={rawData}
                    range={range}
                    issues={issues}
                    color={colors[metric]}
                    onZoom={onZoom}
                />
            )}

            {!rawData && (finiteValues.length > 0 || invalidMarkers.length > 0) && (
                <LineChart
                    style={{ width: "100%", height: chartHeight }}
                    margin={chartMargin}
                    responsive
                    data={data ?? []}
                    accessibilityLayer
                    onMouseDown={(state) => {
                        if (typeof state.activeLabel === "number") {
                            setDragStart(state.activeLabel);
                            setDragEnd(state.activeLabel);
                        }
                    }}
                    onMouseMove={(state) => {
                        if (dragStart !== null && typeof state.activeLabel === "number") {
                            setDragEnd(state.activeLabel);
                        }
                    }}
                    onMouseUp={finishDrag}
                >
                    <CartesianGrid
                        stroke="#475569"
                        strokeDasharray="3 3"
                    />
                    <XAxis
                        dataKey="step"
                        type="number"
                        domain={[range.start, range.end]}
                        padding={{ left: chartXAxisPadding, right: chartXAxisPadding }}
                        tick={{ fontSize: 14, fontFamily: "system-ui" }}
                        tickFormatter={formatNumber}
                        tickMargin={12}
                        minTickGap={24}
                        label={{ value: "Step", position: "insideBottom", offset: -5, fontSize: 16 }}
                        height={chartXAxisHeight}
                    />
                    <YAxis
                        hide={finiteValues.length === 0}
                        width={chartYAxisWidth}
                        tick={{ fontSize: 14, fontFamily: "system-ui" }}
                        tickMargin={14}
                        tickFormatter={yAxis.formatTick}
                        ticks={yAxis.ticks}
                        label={{ value: metric, angle: -90, position: "insideLeft", fontSize: 16 }}
                        domain={yAxis.domain}
                    />
                    <Tooltip
                        formatter={(value) => String(value)}
                        labelFormatter={(step) => `Step ${formatNumber(Number(step))}`}
                    />
                    <Line
                        type="linear"
                        stroke={colors[metric]}
                        strokeWidth={2.5}
                        dataKey={metric}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                    />
                    {duplicateMarkers.map(({ step, value }, index) => (
                        <ReferenceDot
                            key={`${step}-${index}`}
                            x={step}
                            y={value}
                            r={4}
                            fill="#FBBF24"
                            stroke="#111827"
                        />
                    ))}
                    {invalidMarkers.map((marker, index) => (
                        <ReferenceDot
                            key={`invalid-${marker.step}-${index}`}
                            x={marker.step}
                            y={marker.y}
                            r={5}
                            fill="#ef4444"
                            stroke="#fff1f2"
                            ifOverflow="visible"
                            label={{
                                value: marker.label,
                                position: marker.labelPosition,
                                fill: "#fecaca",
                            }}
                        />
                    ))}
                    {warningMarkers.map((warning) => (
                        <ReferenceDot
                            key={`warning-${warning.step}`}
                            x={warning.step}
                            y={warning.y}
                            r={5}
                            fill="#fb923c"
                            stroke="#fff7ed"
                            ifOverflow="visible"
                            label={{
                                value: formatNumber(warning.value),
                                position: "right",
                                fill: "#fed7aa",
                            }}
                        />
                    ))}
                    {dragStart !== null && dragEnd !== null && (
                        <ReferenceArea
                            x1={dragStart}
                            x2={dragEnd}
                            fill="#86efac"
                            fillOpacity={0.2}
                        />
                    )}
                </LineChart>
            )}
        </div>
    );
};

export default memo(MetricChart);
