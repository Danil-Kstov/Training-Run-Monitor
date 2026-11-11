import MetricChart from "../MetricChart/MetricChart.tsx";
import { trainingRuns } from "../../data/trainingRuns.ts";
import { useEffect, useRef, useState } from "react";
import type { ChartPoint, Metric } from "../../types/types";
import type { DataIssue } from "../../lib/prepareTrainingPoints";

type WorkerResponse = {
    requestId: number;
    runId: string;
    data?: Record<Metric, ChartPoint[]>;
    issues?: DataIssue[];
    error?: string;
};

const Main = () => {
    const [selectedRunId, setSelectedRunId] = useState<string>("Run-01");
    const [filter, setFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("id");
    const latestRequestId = useRef(0);

    const [chartData, setChartData] = useState<
        Record<Metric, ChartPoint[]> | null
    >(null);

    const [issues, setIssues] = useState<DataIssue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filteredRuns = trainingRuns.filter((run) => {
        if (filter === "all") return true;

        return run.tags.includes(filter);
    });

    const sortedRuns = [...filteredRuns].sort((a, b) => {
        if (sortBy === "name") {
            return a.name.localeCompare(b.name);
        }

        if (sortBy === "count") {
            return a.pointCount - b.pointCount;
        }

        return a.id.localeCompare(b.id);
    });

    const visibleSelectedRunId = sortedRuns.some(
        (run) => run.id === selectedRunId
    )
        ? selectedRunId
        : (sortedRuns[0]?.id ?? "");

    useEffect(() => {
        const requestId = ++latestRequestId.current;

        setChartData(null);
        setIssues([]);
        setError(null);

        if (!visibleSelectedRunId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const worker = new Worker(
            new URL("../../workers/training.worker.ts", import.meta.url),
            { type: "module" }
        );

        worker.onmessage = (
            event: MessageEvent<WorkerResponse>
        ) => {
            const response = event.data;

            if (response.requestId !== latestRequestId.current) {
                return;
            }

            setIsLoading(false);

            if (response.error || !response.data) {
                setError(response.error ?? "Invalid worker response");
                return;
            }

            setChartData(response.data);
            setIssues(response.issues ?? []);
        };

        worker.onerror = () => {
            if (requestId !== latestRequestId.current) return;

            setIsLoading(false);
            setError("Worker failed");
        };

        worker.postMessage({
            requestId,
            runId: visibleSelectedRunId,
        });

        return () => {
            worker.terminate();
            latestRequestId.current++;
        };
    }, [visibleSelectedRunId]);

    return (
        <main className="p-6 flex-1 flex flex-col gap-10  justify-center items-center">
            <div className="w-full flex justify-center sm:gap-10 gap-4 items-center">
                <select
                    className="pl-2 sm:w-[240px] w-[155px] sm:text-base text-sm h-10 text-gray-300
                    bg-gray-700 rounded-md border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">All runs</option>
                    <option value="normal">Normal runs</option>
                    <option value="invalid">With NaN, Infinity</option>
                    <option value="missing">With missed steps</option>
                    <option value="unsorted">With unsorted steps</option>
                    <option value="duplicate">With duplicated steps</option>
                    <option value="spikes">With loss spikes</option>
                </select>

                <select
                    className="pl-2 sm:w-[240px] w-[155px] sm:text-base text-sm h-10 text-gray-300
                    bg-gray-700 rounded-md border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="id">Sort by ID</option>
                    <option value="name">Sort by name</option>
                    <option value="count">Sort by point count</option>
                </select>
            </div>

            <select
                className="pl-2 sm:w-[520px] w-[326px] h-10 text-gray-300 bg-gray-700 rounded-md border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600"
                value={visibleSelectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
            >
                {sortedRuns.map((run) => (
                    <option key={run.id} value={run.id}>
                        ({run.id}) {run.name}
                    </option>
                ))}
            </select>

            <section className="w-full max-w-[800px] flex flex-col justify-center gap-6">
                {error && <p role="alert">{error}</p>}

                {isLoading && (
                    <p role="status">Processing training data...</p>
                )}

                {!isLoading && chartData && (
                    chartData.loss.length === 0 ? (
                        <p role="status">No training data available</p>
                    ) : (
                        <>
                            <p>Detected issues: {issues.length}</p>

                            <MetricChart metric="loss" data={chartData.loss} />
                            <MetricChart metric="lr" data={chartData.lr} />
                            <MetricChart metric="grad_norm" data={chartData.grad_norm} />
                        </>
                    )
                )}
            </section>
        </main>
    )
}

export default Main;