import { useState } from "react";
import { trainingRuns } from "../../data/trainingRuns";
import { formatNumber } from "../../lib/formatNumber";

type RunSidebarProps = {
    selectedRunId: string;
    onSelectRun: (runId: string) => void;
};

const RunSidebar = ({ selectedRunId, onSelectRun }: RunSidebarProps) => {
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("id");
    const tags = [...new Set(trainingRuns.flatMap((run) => run.tags))].sort();
    const listedRuns = trainingRuns
        .filter((run) => filter === "all" || run.tags.includes(filter))
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "count") return a.pointCount - b.pointCount;
            return a.id.localeCompare(b.id);
        });

    return (
        <aside
            className="main__sidebar"
            aria-label="Training runs"
        >
            <h1>Training runs</h1>

            <label htmlFor="run-filter">Filter</label>
            <select
                id="run-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
            >
                <option value="all">All runs</option>
                {tags.map((tag) => (
                    <option
                        key={tag}
                        value={tag}
                    >
                        {tag}
                    </option>
                ))}
            </select>

            <label htmlFor="run-sort">Sort</label>
            <select
                id="run-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
            >
                <option value="id">Run ID</option>
                <option value="name">Name</option>
                <option value="count">Point count</option>
            </select>

            <nav aria-label="Run list">
                {listedRuns.map((run) => (
                    <a
                        key={run.id}
                        href={`/runs/${run.id}`}
                        aria-current={run.id === selectedRunId ? "page" : undefined}
                        onClick={(event) => {
                            event.preventDefault();
                            onSelectRun(run.id);
                        }}
                    >
                        <strong>{run.id}</strong> {run.name}
                        <small>{formatNumber(run.pointCount)} points</small>
                    </a>
                ))}
                {listedRuns.length === 0 && <p>No matching runs.</p>}
            </nav>
        </aside>
    );
};

export default RunSidebar;
