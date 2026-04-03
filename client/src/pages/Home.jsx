import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineArrowRight, HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineSparkles } from "react-icons/hi";
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
    const [newArrivals, setNewArrivals] = useState([]);
    const [arrivalsLoading, setArrivalsLoading] = useState(true);

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const { data } = await API.get("/products?limit=8&sort=newest");
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
            <section className="relative min-h-[100svh] flex items-center overflow-hidden">

                {/* Background image + overlays */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=1920"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(100deg,rgba(15,23,42,0.93) 0%,rgba(15,23,42,0.65) 55%,rgba(15,23,42,0.25) 100%)" }} />
                </div>

                {/* Right side — decorative glass element */}
                <div className="hidden lg:block absolute right-12 xl:right-24 top-1/2 -translate-y-1/2">
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

                {/* Hero content — generous left padding */}
                <div className="relative w-full max-w-7xl mx-auto px-8 sm:px-12 lg:px-20 xl:px-24 py-20 sm:py-24 md:py-28">
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-xl"
                    >
                        {/* Label pill */}
                        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full border"
                            style={{ background: "rgba(201,168,76,0.12)", borderColor: "rgba(201,168,76,0.3)", color: "#c9a84c", marginBottom: "32px" }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#c9a84c" }} />
                            New Collection 2026
                        </span>

                        <h1 className="text-[38px] sm:text-[50px] lg:text-[60px] font-extrabold text-white leading-[1.08] tracking-tight" style={{ marginBottom: "24px" }}>
                            Premium Menswear<br />
                            <span className="text-slate-300 font-semibold">for the </span>
                            <span className="italic font-extrabold" style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#c9a84c" }}>
                                Modern Gentleman
                            </span>
                        </h1>

                        <p className="text-[16px] sm:text-[18px] leading-[1.8] max-w-md" style={{ color: "rgba(255,255,255,0.7)", marginBottom: "40px" }}>
                            Curated shirts and trousers made from the finest Linen, Oxford, Twill & Satin fabrics. Free delivery across India.
                        </p>

                        <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                            <Link
                                to="/shirts"
                                className="btn-gold group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px]"
                            >
                                Shop Shirts
                                <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                to="/trousers"
                                className="inline-flex items-center justify-center gap-2.5 text-white text-[15px] font-bold px-8 py-4 rounded-xl border-2 transition-all"
                                style={{ borderColor: "rgba(255,255,255,0.25)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = ""}
                            >
                                Shop Trousers
                            </Link>
                        </div>
                    </motion.div>
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
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "64px" }}>
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
                                <HiOutlineSparkles className="w-4 h-4 inline-block mr-1.5 -mt-0.5" style={{ color: "#c9a84c" }} />
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
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
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
                                <HiOutlineSparkles className="w-7 h-7" style={{ color: "#c9a84c" }} />
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

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "32px" }}>
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
                                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
                                        <h3 className="text-[30px] sm:text-[36px] font-extrabold text-white mb-2">{cat.name}</h3>
                                        <p className="text-[14px] sm:text-[15px] mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>{cat.desc}</p>
                                        <span className="inline-flex items-center gap-2 text-[14px] font-bold group-hover:gap-3 transition-all"
                                            style={{ color: "#c9a84c" }}>
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

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                        {FABRICS.map((fabric, i) => (
                            <motion.div
                                key={fabric.name}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="card-hover group bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
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
                                    <h4 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">{fabric.name}</h4>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-[1.65]">{fabric.desc}</p>
                                </div>
                            </motion.div>
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
                    style={{ background: "radial-gradient(circle at center,#c9a84c 0%,transparent 70%)" }} />

                <div className="relative page-wrap py-24 sm:py-36 flex items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55 }}
                    >
                        <p className="section-label justify-center" style={{ color: "#c9a84c", marginBottom: "24px" }}>
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
                            className="btn-gold group inline-flex items-center gap-3 px-10 py-4 text-[16px]"
                        >
                            Start Shopping
                            <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
