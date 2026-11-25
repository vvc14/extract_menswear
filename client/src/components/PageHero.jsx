import { Link } from "react-router-dom";
import { Eagle } from "./brand/Logo";

/**
 * Signboard header for help / info pages.
 *   title    poster headline (the page's one h1)
 *   crumb    breadcrumb label if it differs from the title
 *   kicker   short line above the title, in the sign's small caps voice
 *   aside    optional node shown on the right on wide screens (a tag, a tape, a stamp)
 *   children one line of context under the title
 *   footer   optional node pinned to the bottom edge (e.g. the size guide's tape)
 */
export default function PageHero({ title, crumb, kicker, aside, footer, children }) {
    return (
        <section className="board relative overflow-hidden border-b-2 border-ink">
            <Eagle className="pointer-events-none absolute -right-16 -bottom-20 h-[300px] sm:h-[380px] w-auto text-white opacity-[0.07]" />
            <div className="page-wrap relative py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className={`@container ${aside ? "lg:col-span-8" : "lg:col-span-12"}`}>
                    <nav aria-label="Breadcrumb" className="mb-6 text-[14px] font-semibold text-white/80">
                        <Link to="/" className="hover:text-sign underline-offset-4 hover:underline">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span aria-current="page" className="text-white">{crumb || title}</span>
                    </nav>
                    {kicker && (
                        <p className="mb-3 text-[13px] sm:text-[14px] font-extrabold uppercase tracking-[0.08em] text-white/85" style={{ fontStretch: "115%" }}>{kicker}</p>
                    )}
                    <h1 className="display sign-type text-[min(44px,11cqi)] sm:text-[min(72px,11cqi)] lg:text-[min(88px,11cqi)] max-w-4xl">{title}</h1>
                    {children && <p className="mt-5 max-w-2xl text-[16px] sm:text-[18px] leading-relaxed text-white/90">{children}</p>}
                </div>
                {aside && <div className="lg:col-span-4 lg:justify-self-end">{aside}</div>}
            </div>
            {footer}
        </section>
    );
}
