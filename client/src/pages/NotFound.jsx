import { Link } from "react-router-dom";
import { Eagle } from "../components/brand/Logo";

const LINKS = [
    { to: "/shirts", label: "Shirts" },
    { to: "/trousers", label: "Trousers" },
    { to: "/about", label: "Our shop" },
    { to: "/contact", label: "Contact" },
    { to: "/faq", label: "FAQ" },
];

export default function NotFound() {
    return (
        <main id="main-content" className="board relative overflow-hidden border-b-2 border-ink">
            <Eagle className="pointer-events-none absolute -right-16 top-6 h-[380px] sm:h-[520px] w-auto text-white opacity-[0.07]" />
            <div className="page-wrap relative py-16 sm:py-24 min-h-[70vh] flex flex-col justify-center">
                <p className="display sign-type text-[96px] sm:text-[180px] leading-none">404</p>
                <h1 className="display text-[36px] sm:text-[60px] text-white mt-4">Not on this rack.</h1>
                <p className="mt-5 max-w-lg text-[17px] sm:text-[19px] text-white/90">
                    This page does not exist or has moved. The link may be old, or the product may be sold out and taken down.
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                    <Link to="/" className="btn-buy text-[16px]">Back to the home page</Link>
                    <button type="button" onClick={() => window.history.back()} className="inline-flex items-center min-h-[44px] px-6 text-[16px] font-extrabold text-white border-2 border-white hover:bg-white hover:text-primary transition-colors">
                        Go back
                    </button>
                </div>
                <nav aria-label="Popular pages" className="mt-12 pt-6 border-t-2 border-white/20">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2">
                        {LINKS.map((l) => (
                            <li key={l.to}>
                                <Link to={l.to} className="inline-flex min-h-[44px] items-center text-[16px] font-bold text-white hover:text-sign underline underline-offset-4 decoration-white/40 hover:decoration-sign">
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </main>
    );
}
