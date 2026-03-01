import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineArrowRight, HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck } from "react-icons/hi";

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
    { name: "Oxford", desc: "Classic weave, versatile appeal", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600&q=80" },
    { name: "Twill", desc: "Rich texture, refined drape", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80" },
    { name: "Satin", desc: "Smooth finish, evening elegance", image: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&q=80" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function Home() {
    return (
        <main id="main-content">
            {/* ====== HERO — Full Viewport ====== */}
            <section className="relative min-h-[100svh] flex items-center overflow-hidden">
                {/* Background image — more visible */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    {/* Lighter overlays — face is subtly visible */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/20" />
                </div>

                {/* Right side — decorative glass element */}
                <div className="hidden lg:block absolute right-12 xl:right-24 top-1/2 -translate-y-1/2">
                    <div className="w-[280px] xl:w-[320px] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                        <p className="text-white/40 text-[11px] font-semibold tracking-[0.2em] uppercase mb-4">This Season</p>
                        <p className="text-white text-[28px] xl:text-[32px] font-extrabold leading-tight mb-2">Premium Fabrics</p>
                        <p className="text-white/60 text-[14px] leading-relaxed mb-6">Linen · Oxford · Twill · Satin — handpicked for comfort & style.</p>
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber/20 flex items-center justify-center text-amber text-[18px]">🧵</div>
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light text-[18px]">✂️</div>
                            <div className="w-10 h-10 rounded-lg bg-emerald/20 flex items-center justify-center text-emerald text-[18px]">🛡️</div>
                        </div>
                    </div>
                </div>

                {/* Hero content — generous left padding */}
                <div className="relative w-full max-w-7xl mx-auto px-8 sm:px-12 lg:px-20 xl:px-24 py-20 sm:py-24 md:py-28">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-2xl"
                    >
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-amber text-[13px] sm:text-[14px] font-semibold px-4 py-2 rounded-full mb-8 border border-amber/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block"></span>
                            New Collection 2024
                        </span>

                        {/* Heading — "Menswear" doesn't overpower */}
                        <h1 className="text-[36px] sm:text-[44px] md:text-[52px] lg:text-[60px] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                            Premium Menswear
                            <br />
                            <span className="text-slate-300 font-bold">for the Modern</span>{" "}
                            <span className="text-amber font-extrabold italic font-serif">Gentleman</span>
                        </h1>

                        <p className="text-[15px] sm:text-[17px] md:text-[18px] text-slate-300/90 leading-[1.8] mb-12 max-w-lg">
                            Discover curated shirts and trousers made from the finest Linen, Oxford, Twill & Satin fabrics. Delivered free across India.
                        </p>

                        {/* Buttons — both premium and consistent */}
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                            <Link
                                to="/shirts"
                                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber to-yellow-500 text-slate-900 text-[16px] font-bold px-12 py-[22px] rounded-2xl hover:shadow-lg hover:shadow-amber/30 hover:scale-[1.02] transition-all"
                            >
                                Shop Shirts
                                <HiOutlineArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/trousers"
                                className="inline-flex items-center justify-center gap-3 text-white text-[16px] font-bold px-12 py-[22px] rounded-2xl border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all"
                            >
                                Shop Trousers
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll hint */}
                <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-white/30 font-semibold">Scroll</span>
                    <div className="w-[1px] h-8 bg-gradient-to-b from-white/30 to-transparent" style={{ animation: "pulse-soft 2s ease-in-out infinite" }} />
                </div>
            </section>

            {/* ====== TRUST STRIP ====== */}
            <section className="bg-white border-b border-slate-100 py-7 sm:py-9">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 md:gap-20">
                        {[
                            { icon: HiOutlineTruck, text: "Free Delivery above ₹999" },
                            { icon: HiOutlineRefresh, text: "7-Day Easy Returns" },
                            { icon: HiOutlineShieldCheck, text: "100% Secure Payment" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-3.5">
                                <item.icon className="w-6 h-6 text-primary" />
                                <span className="text-[14px] sm:text-[16px] font-semibold text-slate-600">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== SHOP BY CATEGORY ====== */}
            <section className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-20 sm:py-28">
                <div className="text-center mb-14 sm:mb-18">
                    <h2 className="text-[26px] sm:text-[32px] md:text-[38px] font-extrabold text-slate-900 tracking-tight mb-4">
                        Shop by Category
                    </h2>
                    <p className="text-[15px] sm:text-[16px] text-slate-500 max-w-md mx-auto leading-[1.7]">Find your perfect fit from our curated collections</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    {CATEGORIES.map((cat, i) => (
                        <motion.div key={cat.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                            <Link to={cat.to} className="group relative block rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[4/3] lg:aspect-[16/10]">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
                                    <h3 className="text-[28px] sm:text-[34px] md:text-[38px] font-extrabold text-white mb-2">{cat.name}</h3>
                                    <p className="text-[14px] sm:text-[15px] text-slate-300 mb-4">{cat.desc}</p>
                                    <span className="inline-flex items-center gap-2 text-[13px] sm:text-[14px] font-bold text-amber group-hover:gap-3 transition-all">
                                        Shop Now <HiOutlineArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ====== SIGNATURE FABRICS ====== */}
            <section className="bg-slate-50 py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
                    <div className="text-center mb-14 sm:mb-18">
                        <h2 className="text-[26px] sm:text-[32px] md:text-[38px] font-extrabold text-slate-900 tracking-tight mb-4">
                            Our Signature Fabrics
                        </h2>
                        <p className="text-[15px] sm:text-[16px] text-slate-500 max-w-md mx-auto leading-[1.7]">Handpicked from the world's finest mills</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7">
                        {FABRICS.map((fabric, i) => (
                            <motion.div
                                key={fabric.name}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                            >
                                <div className="aspect-square overflow-hidden">
                                    <img
                                        src={fabric.image}
                                        alt={fabric.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-4 sm:p-6">
                                    <h4 className="text-[15px] sm:text-[18px] font-bold text-slate-900 mb-1.5">{fabric.name}</h4>
                                    <p className="text-[13px] sm:text-[15px] text-slate-500 leading-[1.7]">{fabric.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== CTA SECTION ====== */}
            <section className="relative bg-slate-900 py-24 sm:py-32 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                </div>
                <div className="relative max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-[26px] sm:text-[34px] md:text-[42px] font-extrabold text-white tracking-tight mb-6">
                            Elevate Your Wardrobe Today
                        </h2>
                        <p className="text-[15px] sm:text-[17px] text-slate-400 max-w-xl mx-auto mb-12 sm:mb-14 leading-[1.8]">
                            Join thousands of satisfied customers who trust Extract Menswear for premium quality clothing.
                        </p>
                        <Link
                            to="/shirts"
                            className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber to-yellow-500 text-slate-900 text-[16px] sm:text-[17px] font-bold px-14 py-[22px] rounded-2xl hover:shadow-lg hover:shadow-amber/30 hover:scale-[1.02] transition-all"
                        >
                            Start Shopping
                            <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
