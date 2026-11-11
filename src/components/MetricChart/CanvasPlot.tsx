import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { getRawStepValues } from "../../lib/chartPayload";
import type { RawChartData } from "../../lib/chartPayload";
import type { DataIssue } from "../../lib/prepareTrainingPoints";
import type { StepRange } from "../../lib/runView";
import type { Metric } from "../../types/types";
import { createYAxisFromBounds } from "../../lib/chartAxis";
import { formatNumber } from "../../lib/formatNumber";
import { canvasPlot as plot, chartHeight } from "../../lib/chartLayout";

type CanvasPlotProps = {
    metric: Metric;
    raw: RawChartData;
    range: StepRange;
    issues: DataIssue[];
    color: string;
    onZoom: (range: StepRange) => void;
};

type Hover = { step: number; values: number[]; x: number; y: number };

const CanvasPlot = ({ metric, raw, range, issues, color, onZoom }: CanvasPlotProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragStart = useRef<number | null>(null);
    const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);
    const [hover, setHover] = useState<Hover | null>(null);
    const [width, setWidth] = useState(0);
    const values = raw[metric];
    const { axis, hasFiniteValues } = useMemo(() => {
        let minimum = Infinity;
        let maximum = -Infinity;

        for (let index = 0; index < values.length; index++) {
            const value = values[index];
            if (raw.duplicates[index] || !Number.isFinite(value)) continue;
            if (value < minimum) minimum = value;
            if (value > maximum) maximum = value;
        }

        for (const issue of issues) {
            if (issue.type !== "DUPLICATE_STEP" ||
                issue.step < range.start || issue.step > range.end) continue;
            for (const entry of issue.values) {
                const value = entry[metric];
                if (!Number.isFinite(value)) continue;
                if (value < minimum) minimum = value;
                if (value > maximum) maximum = value;
            }
        }

        return {
            axis: createYAxisFromBounds(minimum, maximum),
            hasFiniteValues: Number.isFinite(minimum),
        };
    }, [issues, metric, range.end, range.start, raw, values]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(() => setWidth(canvas.clientWidth));
        observer.observe(canvas);
        setWidth(canvas.clientWidth);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || width <= plot.left + plot.right + 2 * plot.xPadding) return;
        const height = canvas.clientHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        const context = canvas.getContext("2d");
        if (!context) return;
        context.scale(pixelRatio, pixelRatio);
        context.clearRect(0, 0, width, height);
        const chartWidth = width - plot.left - plot.right;
        const chartHeight = height - plot.top - plot.bottom;
        const x = (step: number) => plot.left + plot.xPadding +
            (step - range.start) / Math.max(1, range.end - range.start) *
            (chartWidth - 2 * plot.xPadding);
        const y = (value: number) => plot.top +
            (axis.domain[1] - value) / (axis.domain[1] - axis.domain[0]) * chartHeight;

        context.font = "14px system-ui, sans-serif";
        context.fillStyle = "#cbd5e1";
        context.strokeStyle = "#475569";
        context.lineWidth = 1;
        context.setLineDash([3, 3]);

        for (const tick of axis.ticks) {
            const position = y(tick);
            context.beginPath();
            context.moveTo(plot.left, position);
            context.lineTo(width - plot.right, position);
            context.stroke();
            context.textAlign = "right";
            context.fillText(axis.formatTick(tick), plot.left - 14, position + 4);
        }

        for (let index = 0; index <= 4; index++) {
            const step = range.start + (range.end - range.start) * index / 4;
            const position = x(step);
            context.beginPath();
            context.moveTo(position, plot.top);
            context.lineTo(position, height - plot.bottom);
            context.stroke();
            context.textAlign = index === 0 ? "left" : index === 4 ? "right" : "center";
            context.fillText(formatNumber(Math.round(step)), position, height - plot.bottom + 20);
        }

        context.setLineDash([]);
        context.fillStyle = "#cbd5e1";
        context.textAlign = "center";
        context.font = "16px system-ui, sans-serif";
        context.fillText("Step", plot.left + chartWidth / 2, height - 20);
        context.save();
        context.translate(35, plot.top + chartHeight / 2);
        context.rotate(-Math.PI / 2);
        context.fillText(metric, 0, 0);
        context.restore();

        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        let connected = false;

        for (let index = 0; index < values.length; index++) {
            const value = values[index];
            if (raw.duplicates[index] || !Number.isFinite(value)) {
                connected = false;
                continue;
            }
            const px = x(raw.steps[index]);
            const py = y(value);
            if (!connected || raw.breaks[index]) context.moveTo(px, py);
            else context.lineTo(px, py);
            connected = true;
        }

        context.stroke();

        for (const issue of issues) {
            if (issue.type === "DUPLICATE_STEP" &&
                issue.step >= range.start && issue.step <= range.end) {
                for (const entry of issue.values) {
                    if (!Number.isFinite(entry[metric])) continue;
                    context.fillStyle = "#fbbf24";
                    context.beginPath();
                    context.arc(x(issue.step), y(entry[metric]), 4, 0, Math.PI * 2);
                    context.fill();
                }
            }

            if (issue.type === "INVALID_VALUE" && issue.metric === metric &&
                issue.step >= range.start && issue.step <= range.end) {
                const positive = issue.value === Infinity;
                const markerY = hasFiniteValues
                    ? positive ? plot.top + chartHeight * 0.06 : plot.top + chartHeight * 0.94
                    : plot.top + chartHeight / 2;
                context.fillStyle = "#ef4444";
                context.beginPath();
                context.arc(x(issue.step), markerY, 5, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = "#fecaca";
                context.textAlign = "center";
                context.fillText(
                    Number.isNaN(issue.value) ? "NaN" : positive ? "+∞" : "−∞",
                    x(issue.step),
                    markerY + (positive ? 20 : -10)
                );
            }
        }
    }, [axis, color, hasFiniteValues, issues, metric, range.end, range.start, raw, values, width]);

    const stepAt = (clientX: number): number => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const chartWidth = rect.width - plot.left - plot.right - 2 * plot.xPadding;
        const fraction = Math.max(0, Math.min(1,
            (clientX - rect.left - plot.left - plot.xPadding) / chartWidth));
        return range.start + fraction * (range.end - range.start);
    };

    const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
        if (dragStart.current !== null) {
            setDrag({ start: dragStart.current, end: stepAt(event.clientX) });
            setHover(null);
            return;
        }

        const match = getRawStepValues(raw, metric, stepAt(event.clientX));
        if (!match) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        setHover({
            step: match.step,
            values: match.values,
            x: Math.max(0, Math.min(rect.width - 170, event.clientX - rect.left + 12)),
            y: Math.max(0, event.clientY - rect.top - 50),
        });
    };

    const finishDrag = (event: PointerEvent<HTMLCanvasElement>) => {
        if (dragStart.current !== null) {
            const start = Math.max(range.start, Math.floor(Math.min(dragStart.current, stepAt(event.clientX))));
            const end = Math.min(range.end, Math.ceil(Math.max(dragStart.current, stepAt(event.clientX))));
            if (start < end) onZoom({ start, end });
        }
        dragStart.current = null;
        setDrag(null);
    };

    const overlayStart = drag ? (Math.min(drag.start, drag.end) - range.start) /
        Math.max(1, range.end - range.start) : 0;
    const overlayWidth = drag ? Math.abs(drag.end - drag.start) /
        Math.max(1, range.end - range.start) : 0;

    return (
        <div className="main__canvas-wrap">
            {!hasFiniteValues && (
                <p
                    className="main__canvas-empty"
                    role="status"
                >
                    No finite {metric} values in this range.
                </p>
            )}

            <canvas
                ref={canvasRef}
                className="main__canvas"
                style={{ height: chartHeight }}
                role="img"
                aria-label={`${metric} chart, steps ${range.start} to ${range.end}. Use From and To inputs to zoom with a keyboard.`}
                onPointerDown={(event) => {
                    dragStart.current = stepAt(event.clientX);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setHover(null);
                }}
                onPointerMove={onPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={() => {
                    dragStart.current = null;
                    setDrag(null);
                }}
                onPointerLeave={() => setHover(null)}
            />

            {drag && (
                <div
                    className="main__canvas-selection"
                    style={{
                        left: `calc(${plot.left + plot.xPadding}px + (100% - ${plot.left + plot.right + 2 * plot.xPadding}px) * ${overlayStart})`,
                        width: `calc((100% - ${plot.left + plot.right + 2 * plot.xPadding}px) * ${overlayWidth})`,
                    }}
                />
            )}

            {hover && (
                <div
                    className="main__canvas-tooltip"
                    style={{ left: hover.x, top: hover.y }}
                >
                    <strong>Step {formatNumber(hover.step)}</strong>
                    {hover.values.map((value, index) => (
                        <span key={index}>
                            {metric}: {Number.isNaN(value) ? "NaN" : value === Infinity
                                ? "+∞" : value === -Infinity ? "−∞" : formatNumber(value)}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CanvasPlot;
