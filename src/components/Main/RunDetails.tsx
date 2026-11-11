import { useEffect } from "react";
import type { RefObject } from "react";
import MetricChart from "../MetricChart/MetricChart";
import RunAlerts from "./RunAlerts";
import ZoomControls from "./ZoomControls";
import UpdatingStatus from "./UpdatingStatus";
import { trainingRuns } from "../../data/trainingRuns";
import { formatNumber } from "../../lib/formatNumber";
import type { StepRange } from "../../lib/runView";
import type { WorkerResponse } from "./types";
import type { Metric } from "../../types/types";
import type { ViewMode } from "../../lib/chartPayload";
import type { DataIssue } from "../../lib/prepareTrainingPoints";
import type { DataWarning } from "../../lib/detectLossWarnings";

const emptyIssues: DataIssue[] = [];
const emptyWarnings: DataWarning[] = [];

type RunDetailsProps = {
    runId: string;
    view: WorkerResponse | null;
    reservedHeight: number | null;
    contentRef: RefObject<HTMLElement | null>;
    onRequestRange: (range?: StepRange, scrollMetric?: Metric, mode?: ViewMode) => void;
    scrollTarget: { requestId: number; metric: Metric } | null;
    pendingRangeRequestId: number | null;
    rangeError: string;
};

const RunDetails = ({
    runId,
    view,
    reservedHeight,
    contentRef,
    onRequestRange,
    scrollTarget,
    pendingRangeRequestId,
    rangeError,
}: RunDetailsProps) => {
    useEffect(() => {
        if ((!view?.data && !view?.rawData) || view.requestId !== scrollTarget?.requestId) return;

        const chart = document.getElementById(`metric-chart-${scrollTarget.metric}`);
        chart?.focus({ preventScroll: true });
        chart?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [view, scrollTarget]);

    const selectedRun = trainingRuns.find((run) => run.id === runId);
    const summary = view?.summary;
    const chartData = view?.data;
    const rawData = view?.rawData;
    const range = view?.range;
    const fullRange = view?.fullRange;
    const issues = view?.issues ?? emptyIssues;
    const warnings = view?.warnings ?? emptyWarnings;
    const showChartDetail = (view?.visibleCount ?? 0) >= 100_000;
    const summaryCards = summary ? [
        ["Points", formatNumber(summary.pointCount)],
        ["Data issues", formatNumber(summary.issueCount)],
        ["Warnings", formatNumber(summary.warningCount)],
        ["Latest loss", formatNumber(summary.latest.loss)],
        ["Minimum loss", formatNumber(summary.minLoss)],
        ["Peak loss", formatNumber(summary.maxLoss)],
        ["Latest lr", formatNumber(summary.latest.lr)],
        ["Latest grad_norm", formatNumber(summary.latest.grad_norm)],
    ] : [];

    return (
        <section
            ref={contentRef}
            className="main__content"
            style={!view && reservedHeight !== null ? { minHeight: reservedHeight } : undefined}
            aria-label="Run details"
        >
            <div className="main__heading">
                <h1>{selectedRun ? `${selectedRun.id} · ${selectedRun.name}` : "Run not found"}</h1>
                <p>Loss, learning rate and gradient norm by training step.</p>
            </div>

            {!view && (
                <div
                    className="main__loading"
                    role="status"
                >
                    <span
                        className="main__spinner"
                        aria-hidden="true"
                    />
                    <span>Processing training data...</span>
                </div>
            )}

            {view?.error && <p role="alert">{view.error}</p>}
            {rangeError && (
                <p
                    className="main__range-error"
                    role="alert"
                >
                    Zoom failed: {rangeError}. Showing the previous range.
                </p>
            )}

            {(chartData || rawData) && summary && summary.pointCount === 0 && (
                <p role="status">No training data available for this run.</p>
            )}

            {(chartData || rawData) && summary && summary.pointCount > 0 && range && fullRange && (
                <>
                    <div className="main__cards">
                        {summaryCards.map(([label, value]) => (
                            <div
                                key={label}
                                className="main__card"
                            >
                                <span>{label}</span>
                                <strong>{value}</strong>
                            </div>
                        ))}
                    </div>

                    <ZoomControls
                        key={view.requestId}
                        range={range}
                        fullRange={fullRange}
                        onRequestRange={onRequestRange}
                    />

                    {summary.pointCount >= 100_000 && (
                        <div
                            className="main__view-mode"
                            role={showChartDetail ? "group" : undefined}
                            aria-label={showChartDetail ? "Chart detail" : undefined}
                        >
                            {showChartDetail && (
                                <>
                                    <span>Chart detail:</span>
                                    {(["overview", "all"] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            aria-pressed={(view.mode ?? "overview") === mode}
                                            onClick={() => onRequestRange(range, undefined, mode)}
                                        >
                                            {mode === "overview" ? "Overview" : "All points"}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    <p className="main__range">
                        Showing steps {formatNumber(range.start)}–{formatNumber(range.end)}.
                        {" "}Drag across a chart or enter a range to zoom.
                        {view.sampled && (
                            <> Overview lines connect every 1,000th source point.</>
                        )}
                    </p>
                    <div className="main__range-feedback">
                        {pendingRangeRequestId !== null && (
                            <UpdatingStatus key={pendingRangeRequestId} />
                        )}
                    </div>

                    <div className="main__charts">
                        {(["loss", "lr", "grad_norm"] as const).map((metric) => (
                            <MetricChart
                                key={metric}
                                metric={metric}
                                data={chartData?.[metric]}
                                rawData={rawData}
                                sampled={view.sampled}
                                range={range}
                                issues={issues}
                                warnings={warnings}
                                onZoom={onRequestRange}
                            />
                        ))}
                    </div>

                    <p className="main__point-count">
                        Rendering {formatNumber(view.renderedCount ?? 0)} of {formatNumber(view.visibleCount ?? 0)} real points.
                        {view.sampled
                            ? " Overview keeps every 1,000th point, warnings and issue markers."
                            : " Every point in this range is included."}
                        {" "}Multiple real points can occupy the same pixel.
                        {view.sampled && (
                            <> Rapid oscillations or changes missed by the Warning rule may be hidden or aliased. Use All points or Inspect before a stop decision.</>
                        )}
                    </p>
                </>
            )}

            <RunAlerts
                view={view}
                onInspect={onRequestRange}
            />
        </section>
    );
};

export default RunDetails;
