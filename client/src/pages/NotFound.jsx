import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eagle } from "../components/brand/Logo";
import HangTag from "../components/brand/HangTag";

const LINKS = [
    { to: "/shirts", label: "Shirts" },
    { to: "/trousers", label: "Trousers" },
    { to: "/about", label: "Our shop" },
    { to: "/contact", label: "Contact" },
    { to: "/faq", label: "FAQ" },
];

/** A page that does not exist = a shop with the shutter down. The sign stays lit above it. */
export default function NotFound() {
    return (
        <main id="main-content" className="bg-slate-50 dark:bg-[#121212]">
            <div className="page-wrap py-10 sm:py-14">
                {/* sign above the shutter */}
                <div className="bolted board border-[3px] border-ink px-5 pt-7 pb-4 sm:px-10 flex items-center justify-center gap-4">
                    <Eagle className="w-12 sm:w-16 h-auto text-white" />
                    <p className="logo-word text-[38px] sm:text-[64px]">EXTRACT</p>
                </div>

                {/* the shutter rolls down once on arrival (reduced motion: it is simply down) */}
                <div className="relative overflow-hidden border-x-[3px] border-b-[3px] border-ink">
                    <motion.div
                        initial={{ scaleY: 0.15 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.9, ease: [0.5, 0, 0.2, 1] }}
                        style={{ transformOrigin: "top" }}
                        className="shutter absolute inset-0"
                        aria-hidden="true"
                    />
                    <div className="relative flex justify-center px-4 pt-2 pb-14 sm:pb-20 min-h-[66vh]">
                        <motion.div
                            initial={{ y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="w-full max-w-[520px]"
                        >
                            <HangTag tone="white" hole="var(--shutter-slat)" className="hang-settle" tagClassName="px-6 sm:px-10 pb-8 text-center @container" style={{ animationDelay: "0.8s" }}>
                                <p className="display text-[84px] sm:text-[120px] text-hot leading-none">404</p>
                                <h1 className="display text-[min(30px,12.5cqi)] sm:text-[min(42px,12.5cqi)] text-ink mt-2">Shutter's down on this page</h1>
                                <p className="mt-4 text-[16px] sm:text-[17px] text-[#474747]">
                                    It does not exist or it has moved. The link may be old, or the piece sold out and came off the rack.
                                </p>
                                <div className="mt-7 flex flex-wrap justify-center gap-3">
                                    <Link to="/" className="btn-buy text-[16px]">Back to the shop</Link>
                                    <button type="button" onClick={() => window.history.back()} className="inline-flex items-center min-h-[44px] px-6 text-[16px] font-extrabold text-primary border-2 border-primary hover:bg-primary hover:text-white active:translate-y-px transition-colors">
                                        Go back
                                    </button>
                                </div>
                            </HangTag>

                            <nav aria-label="Open counters" className="mt-10 bg-ink/90 border-2 border-ink px-4 py-3">
                                <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
                                    {LINKS.map((l) => (
                                        <li key={l.to}>
                                            <Link to={l.to} className="inline-flex min-h-[44px] items-center text-[16px] font-bold text-white hover:text-sign underline underline-offset-4 decoration-white/40 hover:decoration-sign">
                                                {l.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
