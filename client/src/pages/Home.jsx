import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX, HiOutlinePhone } from "react-icons/hi";
import API from "../services/api";
import ProductCard from "../components/ProductCard";
import { Eagle } from "../components/brand/Logo";

// What each cloth is like. Only fabrics that are actually in stock get shown (see fabric list below).
const FABRIC_NOTES = {
    cotton: "Soft, breathable, easy to wash. The everyday pick for Hyderabad heat.",
    polyester: "Holds its shape and crease, dries fast, barely wrinkles.",
    denim: "Heavy twill cotton that takes a beating and looks better for it.",
    wool: "Warm with a clean drape. For formal days and cool evenings.",
    linen: "Loose weave that breathes. Made for summer.",
    oxford: "Basket weave with body. Holds a crisp collar all day.",
    twill: "Diagonal weave that drapes well and shrugs off creases.",
    satin: "Smooth with a soft sheen. For weddings and late evenings.",
};

const PHONES = ["8184836764", "7337526629"];

const rise = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.09, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }),
};

export default function Home() {
    const navigate = useNavigate();
    const [newArrivals, setNewArrivals] = useState([]);
    const [arrivalsState, setArrivalsState] = useState("loading"); // loading | ready | error
    const [selectedFabric, setSelectedFabric] = useState(null);
    const railRef = useRef(null);
    const dialogFirstRef = useRef(null);

    const fetchNewArrivals = useCallback(async () => {
        setArrivalsState("loading");
        try {
            const { data } = await API.get("/products?limit=30&sort=newest&newArrivals=true");
            const arr = Array.isArray(data) ? data : [];

            // One card per product name
            const seen = new Set();
            const unique = arr.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));

            // Alternate shirts and trousers so the rail shows both racks
            const shirts = unique.filter((p) => p.category?.toLowerCase() === "shirt").sort(() => 0.5 - Math.random());
            const trousers = unique.filter((p) => p.category?.toLowerCase() === "trouser").sort(() => 0.5 - Math.random());
            const interleaved = [];
            for (let i = 0; i < Math.max(shirts.length, trousers.length); i++) {
                if (shirts[i]) interleaved.push(shirts[i]);
                if (trousers[i]) interleaved.push(trousers[i]);
            }
            setNewArrivals(interleaved);
            setArrivalsState("ready");
        } catch {
            setNewArrivals([]);
            setArrivalsState("error");
        }
    }, []);

    useEffect(() => { fetchNewArrivals(); }, [fetchNewArrivals]);

    // Fabrics in stock, and which racks carry each one
    const [fabrics, setFabrics] = useState(null); // null = loading, [] = none / failed
    // category-options is the admin's list of allowed fabrics, not what is stocked, so each one is
    // checked for at least one product before it is shown. No stocked fabric = the section stays hidden.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await API.get("/products/category-options");
                const checks = [];
                for (const [cat, rack] of [["shirt", "shirts"], ["trouser", "trousers"]]) {
                    for (const f of data?.[cat]?.fabrics || []) {
                        checks.push(
                            API.get(`/products?category=${cat}&fabric=${encodeURIComponent(f)}&page=1&limit=1`)
                                .then(({ data: r }) => ({ f, rack, total: r?.total || 0 }))
                                .catch(() => ({ f, rack, total: 0 }))
                        );
                    }
                }
                const map = new Map();
                for (const { f, rack, total } of await Promise.all(checks)) {
                    if (!total) continue;
                    const key = f.toLowerCase();
                    if (!map.has(key)) map.set(key, { name: f, racks: [] });
                    map.get(key).racks.push(rack);
                }
                if (!cancelled) setFabrics([...map.values()]);
            } catch {
                if (!cancelled) setFabrics([]);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedFabric) return;
        dialogFirstRef.current?.focus();
        const onKey = (e) => e.key === "Escape" && setSelectedFabric(null);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [selectedFabric]);

    const handleFabricClick = (fabric) => {
        if (fabric.racks.length === 1) navigate(`/${fabric.racks[0]}?fabric=${encodeURIComponent(fabric.name)}`);
        else setSelectedFabric(fabric.name);
    };

    const scrollRail = (dir) => {
        const el = railRef.current;
        if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
    };

    return (
        <main id="main-content">

            {/* ═══════════ HERO: the signboard ═══════════ */}
            <section className="board relative overflow-hidden border-b-2 border-ink">
                {/* The eagle from the shop sign, oversized as the page's identity mark */}
                <Eagle className="pointer-events-none absolute -right-24 -top-10 h-[520px] w-auto text-white opacity-[0.07] lg:right-[38%] lg:-top-16 lg:h-[640px]" />

                <div className="page-wrap relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center pt-10 pb-14 sm:pt-14 sm:pb-20 lg:py-20">
                    <div className="lg:col-span-7">
                        <motion.p
                            initial="hidden" animate="visible" variants={rise} custom={0}
                            className="text-[13px] sm:text-[14px] font-extrabold uppercase tracking-[0.08em] text-white/85 mb-5"
                            style={{ fontStretch: "115%" }}
                        >
                            Extract Men's Wear · NTR Road, Suraram Colony
                        </motion.p>

                        <h1 className="display text-[42px] min-[400px]:text-[50px] sm:text-[80px] lg:text-[72px] xl:text-[92px] 2xl:text-[104px]">
                            <motion.span initial="hidden" animate="visible" variants={rise} custom={1} className="block text-white">Sharp shirts.</motion.span>
                            <motion.span initial="hidden" animate="visible" variants={rise} custom={2} className="block sign-type mt-1">Solid trousers.</motion.span>
                        </h1>

                        <motion.p
                            initial="hidden" animate="visible" variants={rise} custom={3}
                            className="mt-7 max-w-lg text-[17px] sm:text-[19px] leading-relaxed text-white/90"
                        >
                            Picked off our own racks in Suraram Colony. Order online and we deliver anywhere in India, free above ₹999.
                        </motion.p>

                        <motion.div initial="hidden" animate="visible" variants={rise} custom={4} className="mt-9 flex flex-wrap gap-4">
                            <Link to="/shirts" className="btn-buy text-[17px] px-8 py-4">Shop shirts</Link>
                            <Link
                                to="/trousers"
                                className="inline-flex items-center justify-center min-h-[44px] px-8 py-4 text-[17px] font-extrabold text-white border-2 border-white hover:bg-white hover:text-primary transition-colors"
                                style={{ fontStretch: "110%" }}
                            >
                                Shop trousers
                            </Link>
                        </motion.div>
                    </div>

                    {/* Poster photo */}
                    <motion.div
                        initial={{ opacity: 0, rotate: 0, y: 30 }}
                        animate={{ opacity: 1, rotate: 2, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                        className="lg:col-span-5 relative mx-2 sm:mx-10 lg:mx-0"
                    >
                        <div className="relative border-[3px] border-ink bg-white p-2 sm:p-3 shadow-[10px_10px_0_#fff200]">
                            <img
                                src="/images/site/home-hero.jpg"
                                alt="Folded shirts and trousers laid out with a tie"
                                width="1920"
                                height="1280"
                                fetchPriority="high"
                                className="w-full aspect-[4/5] object-cover object-[30%_50%]"
                            />
                        </div>
                        <span className="stamp absolute -top-4 -left-3 sm:-left-6 text-[14px] sm:text-[16px] px-3 py-1.5">
                            Wholesale &amp; retail
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════ TWO RACKS ═══════════ */}
            <section aria-labelledby="racks-heading" className="bg-white dark:bg-night">
                <div className="page-wrap py-16 sm:py-24">
                    <h2 id="racks-heading" className="sr-only">Shop by rack</h2>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                        {[
                            { name: "Shirts", to: "/shirts", image: "/images/site/category-shirts.jpg", line: "Casual, formal and party wear", span: "md:col-span-7", ratio: "aspect-[4/5] md:aspect-[7/6]" },
                            { name: "Trousers", to: "/trousers", image: "/images/site/category-trousers.jpg", line: "Formal, casual and slim fit", span: "md:col-span-5 md:mt-24", ratio: "aspect-[4/5]" },
                        ].map((rack) => (
                            <Link key={rack.name} to={rack.to} className={`group relative block self-start border-2 border-ink dark:border-slate-700 card-hover ${rack.span}`}>
                                <div className={`overflow-hidden ${rack.ratio}`}>
                                    <img src={rack.image} alt="" width="800" height="1200" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                                </div>
                                <div className="absolute left-0 bottom-0 board border-t-2 border-r-2 border-ink px-5 py-4 sm:px-7 sm:py-5">
                                    <p className="display sign-type text-[40px] sm:text-[56px]">{rack.name}</p>
                                    <p className="mt-2 text-[14px] sm:text-[15px] font-semibold text-white">{rack.line}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ JUST IN ═══════════ */}
            <section id="new-arrivals" aria-labelledby="arrivals-heading" className="bg-slate-50 dark:bg-[#111238] border-y-2 border-ink dark:border-slate-800">
                <div className="page-wrap py-16 sm:py-20">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
                        <div>
                            <p className="section-label">New on the rack</p>
                            <h2 id="arrivals-heading" className="display text-[44px] sm:text-[64px] text-slate-900 dark:text-white">Just in</h2>
                        </div>
                        {arrivalsState === "ready" && newArrivals.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => scrollRail(-1)} className="w-11 h-11 flex items-center justify-center border-2 border-ink dark:border-slate-500 bg-white dark:bg-slate-900 text-ink dark:text-white hover:bg-sign hover:text-ink" aria-label="Scroll new arrivals left">
                                    <HiOutlineChevronLeft className="w-5 h-5" aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => scrollRail(1)} className="w-11 h-11 flex items-center justify-center border-2 border-ink dark:border-slate-500 bg-white dark:bg-slate-900 text-ink dark:text-white hover:bg-sign hover:text-ink" aria-label="Scroll new arrivals right">
                                    <HiOutlineChevronRight className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </div>

                    {arrivalsState === "loading" && (
                        <div className="flex gap-5 overflow-hidden" role="status" aria-label="Loading new arrivals">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-[220px] sm:w-[260px] shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-pulse">
                                    <div className="bg-slate-200 dark:bg-slate-800" style={{ aspectRatio: "3/4" }} />
                                    <div className="p-4 space-y-3">
                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 w-20" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 w-full" />
                                        <div className="h-7 bg-slate-200 dark:bg-slate-800 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {arrivalsState === "error" && (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 sm:p-10 max-w-xl">
                            <p className="text-[18px] font-bold text-slate-900 dark:text-white mb-2">New arrivals did not load.</p>
                            <p className="text-[15px] text-slate-600 dark:text-slate-400 mb-5">The store could not be reached. Check your connection, then try again.</p>
                            <button type="button" onClick={fetchNewArrivals} className="btn-primary">Try again</button>
                        </div>
                    )}

                    {arrivalsState === "ready" && newArrivals.length === 0 && (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 sm:p-10 max-w-xl">
                            <p className="text-[18px] font-bold text-slate-900 dark:text-white mb-2">Nothing new this week yet.</p>
                            <p className="text-[15px] text-slate-600 dark:text-slate-400 mb-5">Fresh stock is being tagged. Meanwhile the full racks are open.</p>
                            <Link to="/shirts" className="btn-primary">Browse all shirts</Link>
                        </div>
                    )}

                    {arrivalsState === "ready" && newArrivals.length > 0 && (
                        <ul
                            ref={railRef}
                            className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pr-2 -mx-4 px-4 sm:mx-0 sm:px-1 [scrollbar-width:thin]"
                            aria-label="New arrivals"
                        >
                            {newArrivals.map((product) => (
                                <li key={product._id} className="w-[200px] min-[400px]:w-[220px] sm:w-[260px] shrink-0 snap-start pt-1 pl-1">
                                    <ProductCard product={product} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* ═══════════ FABRIC BOARD: built from what is actually in stock ═══════════ */}
            {fabrics?.length !== 0 && (
                <section aria-labelledby="fabric-heading" className="bg-white dark:bg-night">
                    <div className="page-wrap py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-4">
                            <div className="lg:sticky lg:top-40">
                                <p className="section-label">Shop by cloth</p>
                                <h2 id="fabric-heading" className="display text-[44px] sm:text-[60px] text-slate-900 dark:text-white">Pick your fabric</h2>
                                <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">
                                    Every cloth we have in stock right now. Tap one to see what we carry in it.
                                </p>
                            </div>
                        </div>

                        {fabrics === null ? (
                            <ul className="lg:col-span-8 border-t-2 border-slate-200 dark:border-slate-700" role="status" aria-label="Loading fabrics">
                                {[0, 1, 2].map((i) => (
                                    <li key={i} className="border-b-2 border-slate-200 dark:border-slate-700 py-6 px-4 animate-pulse">
                                        <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800" />
                                        <div className="mt-3 h-4 w-72 max-w-full bg-slate-100 dark:bg-slate-800" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <ul className="lg:col-span-8 border-t-2 border-ink dark:border-slate-700">
                                {fabrics.map((fabric, i) => (
                                    <li key={fabric.name} className="border-b-2 border-ink dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => handleFabricClick(fabric)}
                                            className="group w-full grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center gap-x-4 sm:gap-x-6 gap-y-2 py-5 sm:py-6 px-2 sm:px-4 text-left hover:bg-sign transition-colors"
                                        >
                                            <span className="text-[14px] font-black tabular-nums text-slate-500 dark:text-slate-400 group-hover:text-ink">{String(i + 1).padStart(2, "0")}</span>
                                            <span className="min-w-0">
                                                <span className="block display text-[38px] sm:text-[58px] text-slate-900 dark:text-white group-hover:text-ink">{fabric.name}</span>
                                                {FABRIC_NOTES[fabric.name.toLowerCase()] && (
                                                    <span className="block mt-2 text-[14px] sm:text-[16px] text-slate-600 dark:text-slate-400 group-hover:text-ink">{FABRIC_NOTES[fabric.name.toLowerCase()]}</span>
                                                )}
                                            </span>
                                            <span className="col-start-2 sm:col-start-auto flex gap-2">
                                                {fabric.racks.map((r) => (
                                                    <span key={r} className="text-[12px] font-extrabold uppercase px-2 py-1 border-2 border-ink dark:border-slate-500 text-slate-900 dark:text-white group-hover:text-ink group-hover:border-ink">{r}</span>
                                                ))}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* ═══════════ WHOLESALE ═══════════ */}
            <section aria-labelledby="wholesale-heading" className="bg-sign text-ink border-y-2 border-ink">
                <div className="page-wrap py-14 sm:py-16 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
                    <div className="flex-1">
                        <h2 id="wholesale-heading" className="display text-[40px] sm:text-[60px]">Buying in bulk?</h2>
                        <p className="mt-4 max-w-xl text-[17px] leading-relaxed font-medium">
                            Stocking a shop, kitting out a wedding party or ordering uniforms for a team? We sell wholesale too. Call the shop and ask for bulk rates.
                        </p>
                    </div>
                    <ul className="flex flex-col sm:flex-row gap-3">
                        {PHONES.map((p) => (
                            <li key={p}>
                                <a href={`tel:+91${p}`} className="flex items-center gap-3 min-h-[56px] px-6 bg-primary text-white border-2 border-ink shadow-[4px_4px_0_#12123a] text-[20px] font-black tabular-nums hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform" style={{ fontStretch: "112%" }}>
                                    <HiOutlinePhone className="w-5 h-5 text-sign" aria-hidden="true" />
                                    {p.slice(0, 5)} {p.slice(5)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ═══════════ Fabric sold on both racks: which one? ═══════════ */}
            <AnimatePresence>
                {selectedFabric && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink/80"
                        onClick={() => setSelectedFabric(null)}
                    >
                        <motion.div
                            initial={{ y: 16 }}
                            animate={{ y: 0 }}
                            exit={{ y: 16 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="fabric-dialog-title"
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-ink dark:border-black shadow-2xl"
                        >
                            <div className="board border-b-2 border-ink px-6 py-5 pr-16">
                                <h3 id="fabric-dialog-title" className="display text-[34px] sign-type">{selectedFabric}</h3>
                                <p className="mt-2 text-[15px] text-white/90">We stock {selectedFabric.toLowerCase()} in both racks. Which one?</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFabric(null)}
                                className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-white hover:bg-white/10"
                                aria-label="Close"
                            >
                                <HiOutlineX className="w-6 h-6" aria-hidden="true" />
                            </button>
                            <div className="grid grid-cols-2 gap-4 p-6">
                                <Link ref={dialogFirstRef} to={`/shirts?fabric=${selectedFabric}`} onClick={() => setSelectedFabric(null)} className="btn-buy">
                                    Shirts
                                </Link>
                                <Link to={`/trousers?fabric=${selectedFabric}`} onClick={() => setSelectedFabric(null)} className="btn-outline">
                                    Trousers
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
