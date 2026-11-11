import { expect, it } from "vitest";
import { isCurrentWorkerResponse } from "../lib/currentWorkerResponse";

it("rejects stale Zoom and Inspect responses, including A → B → A navigation", () => {
    const pending = { requestId: 7, runId: "Run-20" };

    expect(isCurrentWorkerResponse({ requestId: 4, runId: "Run-20" },
        pending.requestId, pending.runId)).toBe(false);
    expect(isCurrentWorkerResponse({ requestId: 6, runId: "Run-08" },
        pending.requestId, pending.runId)).toBe(false);
    expect(isCurrentWorkerResponse({ requestId: 7, runId: "Run-08" },
        pending.requestId, pending.runId)).toBe(false);
    expect(isCurrentWorkerResponse({ requestId: 7, runId: "Run-20" },
        pending.requestId, pending.runId)).toBe(true);
});
