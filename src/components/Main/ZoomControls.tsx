import { useState } from "react";
import { getQuickZoomRange, quickZoomFractions } from "../../lib/quickZoom";
import type { StepRange } from "../../lib/runView";

type ZoomControlsProps = {
    range: StepRange;
    fullRange: StepRange;
    onRequestRange: (range?: StepRange) => void;
};

const ZoomControls = ({ range, fullRange, onRequestRange }: ZoomControlsProps) => {
    const [draftStart, setDraftStart] = useState(String(range.start));
    const [draftEnd, setDraftEnd] = useState(String(range.end));
    const [rangeError, setRangeError] = useState("");

    const readDraftRange = (): StepRange | null => {
        const start = Number(draftStart);
        const end = Number(draftEnd);

        if (!draftStart.trim() || !draftEnd.trim() ||
            !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
            start < fullRange.start || end > fullRange.end || start >= end) {
            setRangeError("Enter whole-number steps within the run, with start before end.");
            return null;
        }

        return { start, end };
    };

    const zoom = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const selectedRange = readDraftRange();
        if (selectedRange) {
            setRangeError("");
            onRequestRange(selectedRange);
        }
    };

    return (
        <form
            className="main__zoom"
            onSubmit={zoom}
        >
            <div>
                <label htmlFor="range-start">From step</label>
                <input
                    id="range-start"
                    type="number"
                    value={draftStart}
                    onChange={(event) => setDraftStart(event.target.value)}
                />
            </div>

            <div>
                <label htmlFor="range-end">To step</label>
                <input
                    id="range-end"
                    type="number"
                    value={draftEnd}
                    onChange={(event) => setDraftEnd(event.target.value)}
                />
            </div>

            <button type="submit">Zoom</button>

            <button
                type="button"
                onClick={() => {
                    setRangeError("");
                    onRequestRange();
                }}
            >
                Reset zoom
            </button>

            <div
                className="main__zoom-presets"
                role="group"
                aria-label="Quick zoom from the entered From step"
            >
                <span>Quick zoom: shorten From–To, keeping From step:</span>
                {quickZoomFractions.map((denominator) => (
                    <button
                        key={denominator}
                        type="button"
                        onClick={() => {
                            const selectedRange = readDraftRange();
                            if (!selectedRange) return;

                            const nextRange = getQuickZoomRange(selectedRange, denominator);
                            setRangeError("");
                            onRequestRange(nextRange);
                        }}
                    >
                        1/{denominator}
                    </button>
                ))}
            </div>

            {rangeError && <p role="alert">{rangeError}</p>}
        </form>
    );
};

export default ZoomControls;
