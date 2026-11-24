import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribeInFlight, getInFlight } from "../services/api";

/**
 * Thin bar along the top of the page while the shop waits on the server or a page is loading.
 * Waits 150 ms before showing so fast responses don't flicker. `force` keeps it on (route loading).
 */
export default function LoadingBar({ force = false }) {
    const busy = useSyncExternalStore(subscribeInFlight, getInFlight) > 0 || force;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(busy), busy ? 150 : 0);
        return () => clearTimeout(t);
    }, [busy]);

    if (!visible) return null;
    return (
        <div className="loading-bar" role="progressbar" aria-label="Loading" aria-valuetext="Loading">
            <span />
        </div>
    );
}
