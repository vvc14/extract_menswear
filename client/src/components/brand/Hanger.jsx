/** A coat hanger drawn in currentColor: hook on top, shoulders below. Decorative only. */
export default function Hanger({ className = "" }) {
    return (
        <svg viewBox="0 0 120 54" className={className} fill="none" aria-hidden="true">
            <path
                d="M60 22c0-5 6-5 6-11a6 6 0 0 0-12 0"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <path
                d="M60 22 8 46c-4 2-3 6 2 6h100c5 0 6-4 2-6L60 22Z"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
            />
        </svg>
    );
}
