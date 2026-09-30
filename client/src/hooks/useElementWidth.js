import { useEffect, useState } from "react";

// Width of an element in px, kept up to date as the viewport changes.
// Used for widgets that need a fixed pixel width (e.g. the Google sign-in button).
export default function useElementWidth(ref, fallback = 320) {
    const [width, setWidth] = useState(fallback);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => setWidth(Math.floor(el.getBoundingClientRect().width) || fallback);
        update();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, fallback]);

    return width;
}
