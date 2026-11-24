import { Link } from "react-router-dom";

const TONES = {
    yellow: "bg-sign text-ink",
    white: "bg-white text-ink",
    blue: "bg-primary text-white",
    red: "bg-hot text-white",
};

/**
 * Swing tag, the shop's price-tag motif. Renders a Link when `to` is set, otherwise a div.
 * `hole` is the colour behind the tag so the punched eyelet looks see-through.
 *
 *   <HangTag to="/shirts?price=under-500" tone="yellow" hole="var(--blue)">...</HangTag>
 */
export default function HangTag({ to, tone = "yellow", hole, className = "", tagClassName = "", style, children, ...rest }) {
    const Wrap = to ? Link : "div";
    return (
        <Wrap
            to={to}
            className={`hang-tag-wrap ${className}`}
            style={{ ...(hole ? { "--tag-hole": hole } : null), ...style }}
            {...rest}
        >
            <div className={`hang-tag ${TONES[tone] || TONES.yellow} ${tagClassName}`}>{children}</div>
        </Wrap>
    );
}
