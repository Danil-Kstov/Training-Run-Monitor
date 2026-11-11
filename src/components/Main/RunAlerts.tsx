import { useState } from "react";
import Pagination from "./Pagination";
import { describeIssue } from "../../lib/describeIssue";
import { formatNumber } from "../../lib/formatNumber";
import { getIssueInspectMetric, getIssueInspectRange } from "../../lib/inspectIssue";
import { paginateIssues } from "../../lib/paginateIssues";
import type { StepRange } from "../../lib/runView";
import type { Metric } from "../../types/types";
import type { WorkerResponse } from "./types";

type RunAlertsProps = {
    view: WorkerResponse | null;
    onInspect: (range: StepRange, metric: Metric) => void;
};

const pageSize = 50;

const RunAlerts = ({ view, onInspect }: RunAlertsProps) => {
    const [issuePage, setIssuePage] = useState(0);
    const [warningPage, setWarningPage] = useState(0);
    const issues = view?.issues ?? [];
    const warnings = view?.warnings ?? [];
    const { pageCount: issuePageCount, entries: visibleIssues } = paginateIssues(
        issues,
        issuePage,
        pageSize
    );
    const { pageCount: warningPageCount, entries: visibleWarnings } = paginateIssues(
        warnings,
        warningPage,
        pageSize
    );

    if (!view?.data) return null;

    return (
        <>
            {issues.length > 0 && (
                <details
                    className="main__issues"
                    open
                >
                    <summary>Data issues: {formatNumber(issues.length)}</summary>
                    <p>Invalid and duplicate values are excluded from connected lines. Duplicate values appear as amber markers. An invalid step has no chart position.</p>
                    <ul>
                        {visibleIssues.map((issue, index) => {
                            const inspectRange = view.fullRange
                                ? getIssueInspectRange(issue, view.fullRange)
                                : null;

                            return (
                                <li key={issuePage * pageSize + index}>
                                    {describeIssue(issue)}
                                    {inspectRange ? (
                                        <button
                                            type="button"
                                            onClick={() => onInspect(
                                                inspectRange,
                                                getIssueInspectMetric(issue)
                                            )}
                                        >
                                            Inspect
                                        </button>
                                    ) : (
                                        <span className="main__issues-unlocatable">No chart position</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    {issuePageCount > 1 && (
                        <Pagination
                            currentPage={issuePage}
                            pageCount={issuePageCount}
                            label="Data issues"
                            onPageChange={setIssuePage}
                        />
                    )}
                </details>
            )}

            {warnings.length > 0 && (
                <section
                    className="main__warnings"
                    aria-label="Training warnings"
                >
                    <h2>Warnings: {formatNumber(warnings.length)}</h2>
                    <p>
                        Run-wide warnings: an isolated loss point is flagged when it is at least 3×
                        both adjacent values and at least 1 higher. Adjacent spikes and sustained rises
                        may not trigger this rule. Inspect these signals before acting on a run.
                    </p>
                    <ul>
                        {visibleWarnings.map((warning) => (
                            <li key={warning.step}>
                                Step {formatNumber(warning.step)}: loss {formatNumber(warning.loss)}
                                (adjacent maximum {formatNumber(warning.neighborMax)})
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!view.fullRange) return;
                                        onInspect({
                                            start: Math.max(view.fullRange.start, warning.step - 25),
                                            end: Math.min(view.fullRange.end, warning.step + 25),
                                        }, "loss");
                                    }}
                                >
                                    Inspect
                                </button>
                            </li>
                        ))}
                    </ul>
                    {warningPageCount > 1 && (
                        <Pagination
                            currentPage={warningPage}
                            pageCount={warningPageCount}
                            label="Warnings"
                            onPageChange={setWarningPage}
                        />
                    )}
                </section>
            )}
        </>
    );
};

export default RunAlerts;
