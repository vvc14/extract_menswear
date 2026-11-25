/** Coat hanger in currentColor. The hook's curl sits at y 14, where .hang-rail runs the rod. */
export default function Hanger({ className = "" }) {
    return (
        <svg viewBox="0 0 120 70" className={className} fill="none" aria-hidden="true">
            <path d="M60 33V26c0-5 8-6 8-14a8 8 0 0 0-16 0v2" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="56.5" y="31" width="7" height="6" rx="1.5" fill="currentColor" />
            <path d="M60 36C45 42 24 51 9 58c-5 2.4-4 8 1.6 8h98.8c5.6 0 6.6-5.6 1.6-8C96 51 75 42 60 36Z" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round" />
        </svg>
    );
}
