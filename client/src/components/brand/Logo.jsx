import { EAGLE_PATH, EAGLE_VIEWBOX } from "./eaglePath";

export function Eagle({ className = "", title }) {
    return (
        <svg
            viewBox={EAGLE_VIEWBOX}
            className={className}
            fill="currentColor"
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : true}
            aria-label={title}
        >
            <path fillRule="evenodd" d={EAGLE_PATH} />
        </svg>
    );
}

/**
 * Horizontal lockup from the shop signboard: white eagle, yellow EXTRACT with the red edge,
 * MENSWEAR underneath. Designed to sit on the brand blue.
 */
export default function Logo({ size = "md", className = "" }) {
    const s = {
        sm: { eagle: "h-7 min-[380px]:h-8 w-auto", word: "text-[19px] min-[380px]:text-[22px]", tag: "text-[7.5px] min-[380px]:text-[8.5px]" },
        md: { eagle: "h-10 w-auto", word: "text-[27px]", tag: "text-[10px]" },
        lg: { eagle: "h-16 w-auto", word: "text-[44px]", tag: "text-[15px]" },
    }[size];

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <Eagle className={`${s.eagle} text-white shrink-0`} />
            <span className="flex flex-col leading-none">
                <span className={`logo-word ${s.word}`}>EXTRACT</span>
                <span className={`logo-tag ${s.tag}`}>MENSWEAR</span>
            </span>
        </span>
    );
}
