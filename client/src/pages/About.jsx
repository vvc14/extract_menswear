import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineArrowRight, HiOutlineSparkles, HiOutlineScissors, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineArrowLeft } from "react-icons/hi";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.09, duration: 0.42 } }),
};

const VALUES = [
    {
        Icon: HiOutlineSparkles,
        title: "Premium Fabrics",
        desc: "Sourced from the world's finest mills — Linen, Oxford, Twill, and Satin."
    },
    {
        Icon: HiOutlineScissors,
        title: "Modern Tailoring",
        desc: "Every piece is precision-cut for a fit that flatters and feels natural."
    },
    {
        Icon: HiOutlineShieldCheck,
        title: "Quality Guaranteed",
        desc: "Crafted to last. We stand behind every stitch with confidence."
    },
    {
        Icon: HiOutlineTruck,
        title: "Fast Delivery",
        desc: "Free shipping across India on orders above ₹999."
    },
];

const STATS = [
    { value: "4", label: "Premium Fabrics" },
    { value: "500+", label: "Happy Customers" },
    { value: "100%", label: "Quality Guaranteed" },
    { value: "2", label: "Core Categories" },
];

export default function About() {
    return (
        <main id="main-content">
            {/* Back bar */}
            <div className="bg-slate-50 dark:bg-[#0d1321] border-b border-slate-200 dark:border-slate-800">
                <div className="page-wrap py-4">
                    <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <HiOutlineArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>

            {/* ── Hero ── */}
            <section style={{ background: "#1a2744" }} className="py-24 md:py-32">
                <div className="page-wrap">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        className="max-w-2xl"
                    >
                        <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full mb-8"
                            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}>
                            Our Story
                        </span>
                        <h1 className="text-[34px] sm:text-[50px] font-extrabold text-white leading-tight tracking-tight mb-7">
                            Redefining Men's Fashion<br />Through Premium Fabrics
                        </h1>
                        <p className="text-[17px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.65)" }}>
                            Extract Menswear was born from a simple belief — every man deserves clothing
                            that fits impeccably and feels extraordinary against the skin.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Values ── */}
            <section className="bg-white dark:bg-[#0d1321] border-b border-slate-100 dark:border-slate-800">
                <div className="page-wrap py-20 sm:py-28">
                    <div style={{ marginBottom: "56px" }}>
                        <p className="section-label">What We Stand For</p>
                        <h2 className="text-[28px] sm:text-[36px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Our Core Values
                        </h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                        {VALUES.map(({ Icon, title, desc }, i) => (
                            <motion.div
                                key={title}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="card-hover group bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-8"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[#f0f4fd] dark:bg-slate-700">
                                    <Icon className="w-5 h-5 text-[#1a2744] dark:text-gold" />
                                </div>
                                <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
                                <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-[1.75]">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Story section ── */}
            <section className="bg-slate-50 dark:bg-[#0a0f1a] border-b border-slate-100 dark:border-slate-800">
                <div className="page-wrap py-20 sm:py-28">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/5" }}>
                                <img
                                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                                    alt="Extract Menswear workshop"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <p className="section-label">The Story</p>
                            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
                                Craftsmanship Meets<br />Modern Design
                            </h2>
                            <div className="space-y-5 text-[16px] text-slate-600 dark:text-slate-400 leading-[1.85]">
                                <p>
                                    We source the finest Linen, Oxford, Twill, and Satin fabrics from trusted mills
                                    to create shirts that look and feel premium. Our trousers blend formal elegance
                                    with casual comfort, designed for every setting in a modern man's life.
                                </p>
                                <p>
                                    Every stitch, every seam, every button placement is considered with intention.
                                    We don't follow fast fashion — we craft lasting wardrobe staples that elevate your everyday style.
                                </p>
                            </div>
                            <Link
                                to="/shirts"
                                className="btn-primary inline-flex mt-10"
                            >
                                View Collection
                                <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="bg-white dark:bg-[#0d1321]">
                <div className="page-wrap py-20 sm:py-28">
                    <div style={{ marginBottom: "56px" }} className="text-center">
                        <p className="section-label justify-center">By the Numbers</p>
                        <h2 className="text-[28px] sm:text-[36px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Extract Menswear at a Glance
                        </h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }} className="text-center">
                        {STATS.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="rounded-2xl border border-slate-200 dark:border-slate-700 py-10 px-6"
                            >
                                <p className="text-[40px] sm:text-[48px] font-extrabold mb-2" style={{ color: "#1a2744" }}>
                                    {stat.value}
                                </p>
                                <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
