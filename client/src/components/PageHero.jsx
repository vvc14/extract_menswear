import { Link } from "react-router-dom";

/** Signboard header for help / info pages: breadcrumb, poster title, one line of context. */
export default function PageHero({ title, crumb, children }) {
    return (
        <section className="board border-b-2 border-ink">
            <div className="page-wrap py-12 sm:py-16">
                <nav aria-label="Breadcrumb" className="mb-6 text-[14px] font-semibold text-white/80">
                    <Link to="/" className="hover:text-sign underline-offset-4 hover:underline">Home</Link>
                    <span className="mx-2" aria-hidden="true">/</span>
                    <span aria-current="page" className="text-white">{crumb || title}</span>
                </nav>
                <h1 className="display sign-type text-[44px] sm:text-[72px] lg:text-[88px] max-w-4xl">{title}</h1>
                {children && <p className="mt-5 max-w-2xl text-[16px] sm:text-[18px] leading-relaxed text-white/90">{children}</p>}
            </div>
        </section>
    );
}
