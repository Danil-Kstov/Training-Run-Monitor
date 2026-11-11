export function isCurrentWorkerResponse(
    response: { requestId: number; runId: string },
    requestId: number,
    runId: string
): boolean {
    return response.requestId === requestId && response.runId === runId;
}
