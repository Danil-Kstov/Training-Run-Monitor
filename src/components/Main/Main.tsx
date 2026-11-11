import { useCallback, useEffect, useRef, useState } from "react";
import RunDetails from "./RunDetails";
import RunSidebar from "./RunSidebar";
import type { WorkerResponse } from "./types";
import type { StepRange } from "../../lib/runView";
import type { Metric } from "../../types/types";
import type { ViewMode } from "../../lib/chartPayload";
import { isCurrentWorkerResponse } from "../../lib/currentWorkerResponse";
import "./Main.css";

const runIdFromPath = () => window.location.pathname.match(/^\/runs\/(Run-\d+)\/?$/)?.[1] ?? "Run-01";

type ScrollTarget = { requestId: number; metric: Metric };

const Main = () => {
    const [selectedRunId, setSelectedRunId] = useState(runIdFromPath);
    const [view, setView] = useState<WorkerResponse | null>(null);
    const [reservedHeight, setReservedHeight] = useState<number | null>(null);
    const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null);
    const [pendingRangeRequestId, setPendingRangeRequestId] = useState<number | null>(null);
    const [rangeError, setRangeError] = useState("");
    const requestSequence = useRef(1);
    const pendingRangeRequestRef = useRef<number | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const modeRef = useRef<ViewMode>("overview");
    const viewRef = useRef<WorkerResponse | null>(null);
    const contentRef = useRef<HTMLElement>(null);

    const currentView = view?.runId === selectedRunId ? view : null;

    const rememberHeight = () => {
        if ((currentView?.data || currentView?.rawData) && contentRef.current) {
            setReservedHeight(contentRef.current.getBoundingClientRect().height);
        }
    };

    const navigate = (runId: string, push = true) => {
        if (runId === selectedRunId) return;
        rememberHeight();
        requestSequence.current++;
        pendingRangeRequestRef.current = null;
        setPendingRangeRequestId(null);
        setRangeError("");
        setView(null);
        viewRef.current = null;
        setSelectedRunId(runId);
        setScrollTarget(null);
        modeRef.current = "overview";
        if (push) window.history.pushState(null, "", `/runs/${runId}`);
    };

    useEffect(() => {
        if (window.location.pathname === "/") {
            window.history.replaceState(null, "", `/runs/${selectedRunId}`);
        }

        const onPopState = () => navigate(runIdFromPath(), false);
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    });

    useEffect(() => {
        const worker = new Worker(
            new URL("../../workers/training.worker.ts", import.meta.url),
            { type: "module" }
        );
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;
            if (!isCurrentWorkerResponse(response, requestSequence.current, selectedRunId)) return;

            if (pendingRangeRequestRef.current === response.requestId) {
                pendingRangeRequestRef.current = null;
                setPendingRangeRequestId(null);
                if (response.error) {
                    setRangeError(response.error);
                    modeRef.current = viewRef.current?.mode ?? "overview";
                } else {
                    modeRef.current = response.mode ?? "overview";
                    viewRef.current = response;
                    setView(response);
                }
            } else {
                modeRef.current = response.mode ?? "overview";
                viewRef.current = response;
                setView(response);
            }
            setReservedHeight(null);
        };

        worker.onerror = () => {
            if (pendingRangeRequestRef.current !== null) {
                pendingRangeRequestRef.current = null;
                setPendingRangeRequestId(null);
                setRangeError("Worker failed");
                modeRef.current = viewRef.current?.mode ?? "overview";
            } else {
                setView({
                    requestId: requestSequence.current,
                    runId: selectedRunId,
                    error: "Worker failed",
                });
            }
        };

        worker.postMessage({
            requestId: requestSequence.current,
            runId: selectedRunId,
            mode: "overview",
        });

        return () => {
            worker.terminate();
            if (workerRef.current === worker) workerRef.current = null;
        };
    }, [selectedRunId]);

    const requestRange = useCallback((range?: StepRange, scrollMetric?: Metric, mode?: ViewMode) => {
        if (!workerRef.current) return;
        if (mode) modeRef.current = mode;
        requestSequence.current++;
        pendingRangeRequestRef.current = requestSequence.current;
        setPendingRangeRequestId(requestSequence.current);
        setRangeError("");
        setScrollTarget(scrollMetric
            ? { requestId: requestSequence.current, metric: scrollMetric }
            : null);
        workerRef.current.postMessage({
            requestId: requestSequence.current,
            runId: selectedRunId,
            range,
            mode: modeRef.current,
        });
    }, [selectedRunId]);

    return (
        <main className="main">
            <RunSidebar
                selectedRunId={selectedRunId}
                onSelectRun={navigate}
            />

            <RunDetails
                key={selectedRunId}
                runId={selectedRunId}
                view={currentView}
                reservedHeight={reservedHeight}
                contentRef={contentRef}
                onRequestRange={requestRange}
                scrollTarget={scrollTarget}
                pendingRangeRequestId={pendingRangeRequestId}
                rangeError={rangeError}
            />
        </main>
    );
};

export default Main;
