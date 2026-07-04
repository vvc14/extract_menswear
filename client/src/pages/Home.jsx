import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowRight, HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineX } from "react-icons/hi";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
    {
        name: "Shirts",
        to: "/shirts",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
        desc: "Linen, Oxford, Twill & more",
    },
    {
        name: "Trousers",
        to: "/trousers",
        image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
        desc: "Formal, Casual & Slim Fit",
    },
];

const FABRICS = [
    { name: "Linen", desc: "Breathable luxury for warm days", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80" },
    { name: "Oxford", desc: "Classic weave, versatile appeal", image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&q=80" },
    { name: "Twill", desc: "Rich texture, refined drape", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80" },
    { name: "Satin", desc: "Smooth finish, evening elegance", image: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&q=80" },
];

const TRUST = [
    { Icon: HiOutlineTruck, text: "Free Delivery above ₹999" },
    { Icon: HiOutlineRefresh, text: "7-Day Easy Returns" },
    { Icon: HiOutlineShieldCheck, text: "100% Secure Payment" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

export default function Home() {
    const navigate = useNavigate();
    const [newArrivals, setNewArrivals] = useState([]);
    const [arrivalsLoading, setArrivalsLoading] = useState(true);
    const [selectedFabric, setSelectedFabric] = useState(null);

    const handleFabricClick = (fabricName) => {
        if (fabricName === "Linen" || fabricName === "Oxford" || fabricName === "Satin") {
            navigate(`/shirts?fabric=${fabricName}`);
        } else {
            setSelectedFabric(fabricName);
        }
    };

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const { data } = await API.get("/products?limit=8&sort=newest&newArrivals=true");
                setNewArrivals(Array.isArray(data) ? data.slice(0, 8) : []);
            } catch {
                setNewArrivals([]);
            } finally {
                setArrivalsLoading(false);
            }
        };
        fetchNewArrivals();
    }, []);

    return (
        <main id="main-content">

            {/* ════════════════════════════════ HERO ════════════════════════════════ */}
            <section className="relative flex items-center justify-center overflow-hidden min-h-[100svh] md:min-h-screen">

                {/* Background image + overlays */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=1920"
                        alt=""
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(100deg,rgba(15,23,42,0.93) 0%,rgba(15,23,42,0.65) 55%,rgba(15,23,42,0.25) 100%)" }} />
                </div>

                {/* Centered wrapper using page-wrap */}
                <div className="relative w-full page-wrap flex items-center justify-between py-8 sm:py-12 md:py-16 z-10">
                    
                    {/* Left content */}
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-xl relative z-10 text-center lg:text-left mx-auto lg:mx-0"
                    >
                        {/* Label pill */}
                        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full border"
                            style={{ background: "rgba(201,168,76,0.12)", borderColor: "rgba(201,168,76,0.3)", color: "var(--gold)", marginBottom: "16px" }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--gold)" }} />
                            New Collection 2026
                        </span>

                        <h1 className="text-[38px] sm:text-[50px] lg:text-[60px] font-extrabold text-white leading-[1.08] tracking-tight" style={{ marginBottom: "16px" }}>
                            Premium Menswear<br />
                            <span className="text-slate-300 font-semibold">for the </span>
                            <span className="italic font-extrabold" style={{ fontFamily: "Playfair Display, Georgia, serif", color: "var(--gold)" }}>
                                Modern Gentleman
                            </span>
                        </h1>

                        <p className="text-[16px] sm:text-[18px] leading-[1.8] max-w-md" style={{ color: "rgba(255,255,255,0.7)", marginBottom: "24px" }}>
                            Curated shirts and trousers made from the finest Linen, Oxford, Twill & Satin fabrics. Free delivery across India.
                        </p>

                        <div className="flex flex-row justify-center lg:justify-start gap-4">
                            <Link
                                to="/shirts"
                                className="btn-gold group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] rounded-xl"
                            >
                                Shop Shirts
                                <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                to="/trousers"
                                className="inline-flex items-center justify-center gap-2.5 text-white text-[15px] font-bold px-8 py-4 rounded-xl border-2 transition-all cursor-pointer"
                                style={{ borderColor: "rgba(255,255,255,0.25)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = ""}
                            >
                                Shop Trousers
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right side — decorative glass element */}
                    <div className="hidden lg:block shrink-0 relative z-10 ml-8">
                        <div className="w-[280px] xl:w-[320px] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                            <p className="text-white/40 text-[11px] font-semibold tracking-[0.2em] uppercase mb-4">This Season</p>
                            <p className="text-white text-[28px] xl:text-[32px] font-extrabold leading-tight mb-2">Premium Fabrics</p>
                            <p className="text-white/60 text-[14px] leading-relaxed mb-6">Linen · Oxford · Twill · Satin — handpicked for comfort & style.</p>
                            <div className="flex gap-3">
                                {[
                                    { bg: "rgba(201,168,76,0.15)", icon: "🧵" },
                                    { bg: "rgba(26,39,68,0.4)", icon: "✂️" },
                                    { bg: "rgba(16,185,129,0.15)", icon: "🛡️" },
                                ].map(({ bg, icon }, i) => (
                                    <div key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px]"
                                        style={{ background: bg }}>
                                        {icon}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll cue */}
                <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>Scroll</span>
                    <div className="w-px h-8" style={{ background: "linear-gradient(to bottom,rgba(255,255,255,0.3),transparent)", animation: "pulse-soft 2s ease-in-out infinite" }} />
                </div>
            </section>

            {/* ════════════════════════════════ TRUST STRIP ════════════════════════════════ */}
            <section className="bg-white dark:bg-[#0d1321] border-b border-slate-100 dark:border-slate-800">
                <div className="page-wrap" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                        {TRUST.map(({ Icon, text }) => (
                            <div key={text} className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#f0f4fd] dark:bg-slate-800">
                                    <Icon className="w-5 h-5 text-[#1a2744] dark:text-gold" />
                                </div>
                                <span className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ NEW ARRIVALS ════════════════════════════════ */}
            <section id="new-arrivals" className="bg-slate-50 dark:bg-[#0a0f1a] border-t border-b border-slate-100 dark:border-slate-800">
                <div className="page-wrap" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
                    {/* Section header */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "56px", gap: "16px" }}>
                        <div>
                            <p className="section-label">
                                <HiOutlineSparkles className="w-4 h-4 inline-block mr-1.5 -mt-0.5" style={{ color: "var(--gold)" }} />
                                Just Dropped
                            </p>
                            <h2 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                                New Arrivals
                            </h2>
                            <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-sm leading-[1.7]">
                                The latest additions to our premium menswear collection.
                            </p>
                        </div>
                        <Link
                            to="/shirts"
                            className="group inline-flex items-center gap-2 text-[15px] font-bold shrink-0 transition-colors text-[#1a2744] dark:text-gold"
                        >
                            View All
                            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {arrivalsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse">
                                    <div className="bg-slate-200 dark:bg-slate-700" style={{ aspectRatio: "3/4" }} />
                                    <div className="p-5 space-y-3">
                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20 mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : newArrivals.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                            {newArrivals.map((product, i) => (
                                <motion.div
                                    key={product._id}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(201,168,76,0.1)" }}>
                                <HiOutlineSparkles className="w-7 h-7" style={{ color: "var(--gold)" }} />
                            </div>
                            <p className="text-[18px] font-semibold text-slate-900 dark:text-white mb-2">Coming Soon</p>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400">New arrivals are on their way. Stay tuned!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ════════════════════════════════ SHOP BY CATEGORY ════════════════════════════════ */}
            <section className="bg-white dark:bg-[#0d1321]">
                <div className="page-wrap py-20 sm:py-28">
                    {/* Section header */}
                    <div style={{ marginBottom: "56px" }}>
                        <p className="section-label">Collections</p>
                        <h2 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                            Shop by Category
                        </h2>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-sm leading-[1.7]">
                            Find your perfect fit from our curated collections.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {CATEGORIES.map((cat, i) => (
                            <motion.div key={cat.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                <Link to={cat.to} className="group relative block rounded-2xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.2) 50%,transparent 100%)" }} />
                                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 text-left">
                                        <h3 className="text-[30px] sm:text-[36px] font-extrabold text-white mb-2 text-left">{cat.name}</h3>
                                        <p className="text-[14px] sm:text-[15px] mb-5 text-left" style={{ color: "rgba(255,255,255,0.65)" }}>{cat.desc}</p>
                                        <span className="inline-flex items-center gap-2 text-[14px] font-bold group-hover:gap-3 transition-all text-left"
                                            style={{ color: "var(--gold)" }}>
                                            Shop Now <HiOutlineArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ SIGNATURE FABRICS ════════════════════════════════ */}
            <section className="bg-slate-50 dark:bg-[#0a0f1a] border-t border-slate-100 dark:border-slate-800">
                <div className="page-wrap py-20 sm:py-28">
                    <div style={{ marginBottom: "56px" }}>
                        <p className="section-label">Materials</p>
                        <h2 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                            Our Signature Fabrics
                        </h2>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-sm leading-[1.7]">
                            Handpicked from the world's finest mills.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                        {FABRICS.map((fabric, i) => (
                            <motion.button
                                onClick={() => handleFabricClick(fabric.name)}
                                key={fabric.name}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="card-hover group bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 text-left w-full cursor-pointer focus:outline-none"
                            >
                                <div className="overflow-hidden" style={{ aspectRatio: "1/1" }}>
                                    <img
                                        src={fabric.image}
                                        alt={fabric.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">{fabric.name}</h3>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-[1.65]">{fabric.desc}</p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ CTA ════════════════════════════════ */}
            <section className="relative overflow-hidden" style={{ background: "#1a2744" }}>
                {/* Subtle grid texture */}
                <div className="absolute inset-0 opacity-[0.04]">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern></defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Gold glow blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle at center,#8a6616 0%,transparent 70%)" }} />

                <div className="relative page-wrap py-24 sm:py-36 flex items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55 }}
                    >
                        <p className="section-label justify-center" style={{ color: "var(--gold)", marginBottom: "24px" }}>
                            Get Started
                        </p>
                        <h2 className="text-[30px] sm:text-[44px] font-extrabold text-white tracking-tight" style={{ marginBottom: "24px" }}>
                            Elevate Your Wardrobe Today
                        </h2>
                        <p className="text-[16px] sm:text-[18px] max-w-lg mx-auto leading-[1.8]" style={{ color: "rgba(255,255,255,0.5)", marginBottom: "48px" }}>
                            Join thousands of satisfied customers who trust Extract Menswear for premium-quality clothing.
                        </p>
                        <Link
                            to="/shirts"
                            className="btn-gold group inline-flex items-center gap-3 px-10 py-4 text-[16px] rounded-xl"
                        >
                            Start Shopping
                            <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>
            
            <AnimatePresence>
                {selectedFabric && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedFabric(null)}
                                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                            
                            <div className="text-center mb-6">
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary dark:text-gold mb-3">
                                    <HiOutlineSparkles className="w-6 h-6" />
                                </span>
                                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white">
                                    Explore {selectedFabric} Collection
                                </h3>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">
                                    Choose a category to browse products made from this fabric.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Link
                                    to={`/shirts?fabric=${selectedFabric}`}
                                    onClick={() => setSelectedFabric(null)}
                                    className="btn-primary py-3.5 text-center font-bold text-[15px] rounded-xl cursor-pointer"
                                >
                                    Shirts
                                </Link>
                                <Link
                                    to={`/trousers?fabric=${selectedFabric}`}
                                    onClick={() => setSelectedFabric(null)}
                                    className="btn-outline py-3.5 text-center font-bold text-[15px] rounded-xl cursor-pointer"
                                >
                                    Trousers
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
