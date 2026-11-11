import { useEffect, useState } from "react";

const UpdatingStatus = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => setVisible(true), 200);
        return () => window.clearTimeout(timeout);
    }, []);

    return visible ? (
        <span
            className="main__range-status"
            role="status"
        >
            Updating charts…
        </span>
    ) : null;
};

export default UpdatingStatus;
