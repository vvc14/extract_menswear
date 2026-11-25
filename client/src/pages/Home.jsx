import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX, HiOutlinePhone } from "react-icons/hi";
import API from "../services/api";
import ProductCard from "../components/ProductCard";
import { Eagle } from "../components/brand/Logo";
import Hanger from "../components/brand/Hanger";
import HangTag from "../components/brand/HangTag";
import useShopStock, { deliveryLine } from "../hooks/useShopStock";
import { PRICE_BANDS, inBand, inr } from "../utils/priceBands";

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
const rackOf = (p) => (p.category?.toLowerCase() === "trouser" ? "trousers" : "shirts");
const imageOf = (p) => (p.images?.length ? p.images[0] : p.imageUrl);

const rise = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.09, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }),
};

/** One name per card: the catalogue lists some pieces twice (one per colour/stock batch). */
function uniqueByName(list) {
    const seen = new Set();
    return list.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
}

/* ─────────── The rail in the shop window: three real pieces on hangers ─────────── */
function HeroRail({ status, picks }) {
    const slots = status === "ready" ? picks : [null, null, null];
    return (
        <div className="relative pt-2">
            <ul
                className="hang-rail"
                aria-label={status === "ready" ? "Picked from the rack today" : "Loading the rack"}
                aria-busy={status === "loading"}
            >
                <li className="rail-rod" aria-hidden="true" />
                {slots.map((p, i) => (
                    <li key={p?._id || i} className="hang-settle" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
                        <Hanger className="hanger text-white" />
                        {p ? (
                            <Link
                                to={`/product/${p._id}`}
                                className="group hung block"
                                aria-label={`${p.name}, ${inr(p.price)}${p.discount ? `, ${p.discount}% off` : ""}`}
                            >
                                <span className="block border-[3px] border-ink bg-white p-1 sm:p-1.5 shadow-[6px_6px_0_rgba(18,18,58,0.55)] transition-transform duration-300 group-hover:-rotate-2 group-hover:-translate-y-1">
                                    <img
                                        src={imageOf(p)}
                                        alt=""
                                        width="600"
                                        height="800"
                                        fetchPriority={i === 1 ? "high" : "auto"}
                                        className="block w-full aspect-[3/4] object-cover object-top"
                                    />
                                </span>
                                {/* price tag on a string off the hanger */}
                                <span className="absolute -bottom-4 right-1 sm:-right-3 flex flex-col items-center origin-top rotate-[8deg] group-hover:rotate-[-4deg] transition-transform duration-300">
                                    <span className="price-tag text-[13px] sm:text-[19px]">{inr(p.price)}</span>
                                </span>
                                {p.discount > 0 && (
                                    <span className="stamp absolute top-2 -left-1 sm:-left-3 text-[10px] sm:text-[13px]">{p.discount}% off</span>
                                )}
                            </Link>
                        ) : (
                            <span className="hung block border-[3px] border-dashed border-white/40 aspect-[3/4] animate-pulse" />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const stock = useShopStock();
    const [newArrivals, setNewArrivals] = useState([]);
    const [arrivalsState, setArrivalsState] = useState("loading"); // loading | ready | error
    const [selectedFabric, setSelectedFabric] = useState(null);
    const railRef = useRef(null);
    const dialogFirstRef = useRef(null);

    /* Everything below is computed from the live catalogue, never typed in. */
    const live = useMemo(() => uniqueByName(stock.products.filter((p) => p.stock > 0)), [stock.products]);
    const delivery = useMemo(() => deliveryLine(stock.products), [stock.products]);

    // Hero rail: deepest markdowns first, alternating racks so both are on show
    const heroPicks = useMemo(() => {
        const byCut = [...live].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        const shirts = byCut.filter((p) => rackOf(p) === "shirts");
        const trousers = byCut.filter((p) => rackOf(p) === "trousers");
        const out = [shirts[0], trousers[0], shirts[1]].filter(Boolean);
        for (const p of byCut) if (out.length < 3 && !out.includes(p)) out.push(p);
        return out.slice(0, 3);
    }, [live]);

    const bands = useMemo(() => PRICE_BANDS.map((band) => {
        const pieces = live.filter((p) => inBand(p.price, band));
        return {
            ...band,
            count: pieces.length,
            from: pieces.length ? Math.min(...pieces.map((p) => p.price)) : 0,
            racks: ["shirts", "trousers"]
                .map((r) => ({ rack: r, count: pieces.filter((p) => rackOf(p) === r).length }))
                .filter((r) => r.count > 0),
        };
    }).filter((b) => b.count > 0), [live]);

    const cuts = useMemo(() => [...live]
        .filter((p) => p.discount > 0 && p.originalPrice > p.price)
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 4), [live]);

    const fetchNewArrivals = useCallback(async () => {
        setArrivalsState("loading");
        try {
            const { data } = await API.get("/products?limit=30&sort=newest&newArrivals=true");
            const unique = uniqueByName(Array.isArray(data) ? data : []);
            // Alternate shirts and trousers so the rail shows both racks
            const shirts = unique.filter((p) => rackOf(p) === "shirts");
            const trousers = unique.filter((p) => rackOf(p) === "trousers");
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
    // Fabrics on real products (the same counts the rack filter uses). None stocked = section hidden.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const racks = [["shirt", "shirts"], ["trouser", "trousers"]];
                const facets = await Promise.all(racks.map(([cat]) => API.get(`/products/facets?category=${cat}`).then(({ data }) => data)));
                const map = new Map();
                racks.forEach(([, rack], i) => {
                    for (const { value } of facets[i].fabric || []) {
                        if (!map.has(value)) map.set(value, { name: value, racks: [] });
                        map.get(value).racks.push(rack);
                    }
                });
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

    const [lead, ...restCuts] = cuts;

    return (
        <main id="main-content">

            {/* ═══════════ HERO: the shop window. Sign-style headline left, the real rail right ═══════════ */}
            <section className="board relative overflow-hidden border-b-2 border-ink">
                <Eagle className="pointer-events-none absolute -left-24 -bottom-24 h-[420px] w-auto text-white opacity-[0.06] lg:left-auto lg:right-[52%] lg:-bottom-32 lg:h-[560px]" />

                <div className="page-wrap relative grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-10 pb-16 sm:pt-14 sm:pb-20 lg:py-20">
                    <div className="lg:col-span-5">
                        <motion.p
                            initial="hidden" animate="visible" variants={rise} custom={0}
                            className="text-[13px] sm:text-[14px] font-extrabold uppercase tracking-[0.08em] text-white/85 mb-5"
                            style={{ fontStretch: "115%" }}
                        >
                            Extract Men's Wear · NTR Road, Suraram Colony
                        </motion.p>

                        <h1 className="display text-[42px] min-[400px]:text-[50px] sm:text-[78px] lg:text-[54px] xl:text-[68px] 2xl:text-[84px]">
                            <motion.span initial="hidden" animate="visible" variants={rise} custom={1} className="block text-white">Sharp shirts.</motion.span>
                            <motion.span initial="hidden" animate="visible" variants={rise} custom={2} className="block sign-type mt-1">Solid trousers.</motion.span>
                        </h1>

                        <motion.p
                            initial="hidden" animate="visible" variants={rise} custom={3}
                            className="mt-7 max-w-md text-[17px] sm:text-[19px] leading-relaxed text-white/90"
                        >
                            Picked off our own racks in Suraram Colony and sent anywhere in India.
                            {delivery?.free && <> <strong className="text-sign font-extrabold">{delivery.text}.</strong></>}
                        </motion.p>

                        <motion.div initial="hidden" animate="visible" variants={rise} custom={4} className="mt-9 flex flex-wrap gap-4">
                            <Link to="/shirts" className="btn-buy text-[17px] px-8 py-4">Shop shirts</Link>
                            <Link
                                to="/trousers"
                                className="inline-flex items-center justify-center min-h-[44px] px-8 py-4 text-[17px] font-extrabold text-white border-2 border-white hover:bg-white hover:text-primary active:translate-y-px transition-colors"
                                style={{ fontStretch: "110%" }}
                            >
                                Shop trousers
                            </Link>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-7 lg:pl-6">
                        {stock.status === "error" || (stock.status === "ready" && heroPicks.length < 3) ? (
                            <div className="relative mx-2 sm:mx-10 lg:mx-0 rotate-2 border-[3px] border-ink bg-white p-2 sm:p-3 shadow-[10px_10px_0_#f2cf3e]">
                                <img src="/images/site/home-hero.jpg" alt="Folded shirts and trousers laid out with a tie" width="1920" height="1280" fetchPriority="high" className="w-full aspect-[4/3] object-cover" />
                            </div>
                        ) : (
                            <>
                                <HeroRail status={stock.status} picks={heroPicks} />
                                <p className="mt-10 text-center text-[14px] font-bold text-white/85">
                                    Today's deepest cuts, straight off the rail. <a href="#cuts" className="underline underline-offset-4 hover:text-sign">See all</a>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══════════ PRICE TAGS: shop by what you want to spend (counts are live) ═══════════ */}
            {bands.length > 0 && (
                <section aria-labelledby="budget-heading" className="relative bg-slate-50 dark:bg-[#111238] border-b-2 border-ink dark:border-slate-800 overflow-hidden">
                    <div className="page-wrap py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
                        <div className="lg:col-span-4 lg:pt-10">
                            <p className="section-label">Shop by price</p>
                            <h2 id="budget-heading" className="display text-[44px] sm:text-[60px] text-slate-900 dark:text-white">What's the budget?</h2>
                            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">
                                Pick a tag. The count is what is on the rack right now.
                            </p>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="rail-rod" aria-hidden="true" />
                            {/* phones: tags hang side by side and scroll along the rod; wider screens: all three in a row */}
                            <ul className="-mt-[7px] flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 pr-6 pl-2 min-[560px]:grid min-[560px]:grid-cols-3 min-[560px]:overflow-visible min-[560px]:pb-2 sm:px-6" aria-label="Price bands">
                                {bands.map((band, i) => {
                                    const tone = ["yellow", "white", "blue"][i % 3];
                                    const onBlue = tone === "blue";
                                    return (
                                        <li key={band.id} className={`hang-settle w-[min(240px,72vw)] shrink-0 snap-start min-[560px]:w-auto ${i === 1 ? "min-[560px]:[--drop:80px]" : i === 2 ? "min-[560px]:[--drop:56px]" : ""}`} style={{ animationDelay: `${i * 0.12}s` }}>
                                            <HangTag tone={tone} className="swing" style={{ "--string": "var(--drop, 40px)" }}>
                                                <p className="text-[12px] font-black uppercase tracking-[0.06em] opacity-80" style={{ fontStretch: "115%" }}>
                                                    {band.count} {band.count === 1 ? "piece" : "pieces"}
                                                </p>
                                                <h3 className="display text-[34px] sm:text-[38px] leading-[0.95] mt-1">{band.label}</h3>
                                                <p className={`mt-2 text-[14px] font-semibold ${onBlue ? "text-white/90" : "text-ink/80"}`}>From {inr(band.from)}</p>
                                                <div className="mt-5 flex flex-col gap-2">
                                                    {band.racks.map(({ rack, count }) => (
                                                        <Link
                                                            key={rack}
                                                            to={`/${rack}?price=${band.id}`}
                                                            className={`flex items-center justify-between min-h-[44px] px-3 border-2 text-[15px] font-extrabold transition-colors ${onBlue
                                                                ? "border-white text-white hover:bg-white hover:text-primary"
                                                                : "border-ink text-ink hover:bg-ink hover:text-sign"}`}
                                                            style={{ fontStretch: "110%" }}
                                                        >
                                                            <span className="capitalize">{rack}</span>
                                                            <span className="tabular-nums">{count}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </HangTag>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </section>
            )}

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

            {/* ═══════════ BIGGEST CUTS: one lead piece, the rest as a bill-style list ═══════════ */}
            {lead && (
                <section id="cuts" aria-labelledby="cuts-heading" className="bg-hot text-white border-y-2 border-ink scroll-mt-28">
                    <div className="page-wrap py-16 sm:py-20">
                        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                            <h2 id="cuts-heading" className="display text-[44px] sm:text-[68px] lg:text-[80px]">
                                Biggest cuts <span className="block text-sign">on the rack</span>
                            </h2>
                            <p className="max-w-xs text-[16px] font-semibold text-white/90">Sorted by discount, from the live price list.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <Link to={`/product/${lead._id}`} className="group lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 bg-white text-ink border-2 border-ink shadow-[8px_8px_0_#12123a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#12123a] transition-all">
                                <div className="relative overflow-hidden border-b-2 sm:border-b-0 sm:border-r-2 border-ink bg-slate-100">
                                    <img src={imageOf(lead)} alt="" width="600" height="800" loading="lazy" className="w-full h-full aspect-[3/4] sm:aspect-auto object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" />
                                </div>
                                <div className="p-6 sm:p-8 flex flex-col">
                                    <p className="display text-[72px] sm:text-[96px] text-hot leading-[0.85]">{lead.discount}%</p>
                                    <p className="display text-[28px] text-hot">off</p>
                                    <h3 className="mt-6 text-[18px] sm:text-[20px] font-bold leading-snug" style={{ fontStretch: "100%", letterSpacing: 0 }}>{lead.name}</h3>
                                    <div className="mt-auto pt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <span className="price-tag text-[26px]">{inr(lead.price)}</span>
                                        <span className="text-[15px] text-[#555683] line-through">{inr(lead.originalPrice)}</span>
                                    </div>
                                    <p className="mt-3 text-[15px] font-extrabold text-[#0b7a53]">You save {inr(lead.originalPrice - lead.price)}</p>
                                </div>
                            </Link>

                            {restCuts.length > 0 && (
                                <ol className="lg:col-span-5 flex flex-col gap-4">
                                    {restCuts.map((p, i) => (
                                        <li key={p._id}>
                                            <Link to={`/product/${p._id}`} className={`group flex items-center gap-4 bg-white text-ink border-2 border-ink p-3 pr-4 shadow-[5px_5px_0_#12123a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform ${i === 1 ? "lg:ml-8" : ""}`}>
                                                <img src={imageOf(p)} alt="" width="120" height="160" loading="lazy" className="w-[72px] h-[96px] object-cover object-top border-2 border-ink shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[15px] font-bold leading-snug line-clamp-2" style={{ fontStretch: "100%" }}>{p.name}</p>
                                                    <p className="mt-2 flex flex-wrap items-baseline gap-2">
                                                        <span className="price-tag text-[16px]">{inr(p.price)}</span>
                                                        <span className="text-[13px] text-[#555683] line-through">{inr(p.originalPrice)}</span>
                                                    </p>
                                                </div>
                                                <span className="stamp text-[14px] shrink-0">{p.discount}% off</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════ JUST IN ═══════════ */}
            <section id="new-arrivals" aria-labelledby="arrivals-heading" className="bg-slate-50 dark:bg-[#111238] border-b-2 border-ink dark:border-slate-800">
                <div className="page-wrap py-16 sm:py-20">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
                        <div>
                            <p className="section-label">New on the rack</p>
                            <h2 id="arrivals-heading" className="display text-[44px] sm:text-[64px] text-slate-900 dark:text-white">Just in</h2>
                        </div>
                        {arrivalsState === "ready" && newArrivals.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => scrollRail(-1)} className="w-11 h-11 flex items-center justify-center border-2 border-ink dark:border-slate-500 bg-white dark:bg-slate-900 text-ink dark:text-white hover:bg-sign hover:text-ink active:translate-y-px" aria-label="Scroll new arrivals left">
                                    <HiOutlineChevronLeft className="w-5 h-5" aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => scrollRail(1)} className="w-11 h-11 flex items-center justify-center border-2 border-ink dark:border-slate-500 bg-white dark:bg-slate-900 text-ink dark:text-white hover:bg-sign hover:text-ink active:translate-y-px" aria-label="Scroll new arrivals right">
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

            {/* ═══════════ WHOLESALE: the shop's own visiting card ═══════════ */}
            <section aria-labelledby="wholesale-heading" className="bg-sign text-ink border-y-2 border-ink">
                <div className="page-wrap py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-6">
                        <h2 id="wholesale-heading" className="display text-[44px] sm:text-[64px]">Buying in bulk?</h2>
                        <p className="mt-4 max-w-xl text-[17px] leading-relaxed font-medium">
                            Stocking a shop, kitting out a wedding party or ordering uniforms for a team? We sell wholesale too. Call the counter and ask for bulk rates.
                        </p>
                    </div>
                    <div className="lg:col-span-6 lg:justify-self-end w-full max-w-[520px]">
                        <div className="bolted board border-2 border-ink shadow-[8px_8px_0_#12123a] -rotate-1 px-6 pt-8 pb-6 sm:px-8">
                            <div className="flex items-center gap-3">
                                <Eagle className="w-12 h-auto text-white shrink-0" />
                                <div className="leading-none">
                                    <p className="logo-word text-[30px]">EXTRACT</p>
                                    <p className="logo-tag text-[10px]">WHOLESALE &amp; RETAIL</p>
                                </div>
                            </div>
                            <ul className="mt-6 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                                {PHONES.map((p) => (
                                    <li key={p}>
                                        <a href={`tel:+91${p}`} className="flex items-center justify-center gap-2 min-h-[52px] px-4 bg-sign text-ink border-2 border-ink shadow-[3px_3px_0_#12123a] text-[19px] font-black tabular-nums hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform" style={{ fontStretch: "112%" }}>
                                            <HiOutlinePhone className="w-5 h-5" aria-hidden="true" />
                                            {p.slice(0, 5)} {p.slice(5)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 text-[13px] font-semibold text-white/85">H.No. 5-360, NTR Road, Suraram Colony, Hyderabad</p>
                        </div>
                    </div>
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
