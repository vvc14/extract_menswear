import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineArrowRight } from "react-icons/hi";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

const VALUES = [
    { icon: "🧵", title: "Premium Fabrics", desc: "Sourced from the world's finest mills — Linen, Oxford, Twill, and Satin." },
    { icon: "✂️", title: "Modern Tailoring", desc: "Every piece is precision-cut for a fit that flatters and feels natural." },
    { icon: "🛡️", title: "Quality Guaranteed", desc: "Crafted to last. We stand behind every stitch with confidence." },
    { icon: "🚚", title: "Fast Delivery", desc: "Free shipping across India on orders above ₹999." },
];

export default function About() {
    return (
        <main id="main-content">
            {/* Hero */}
            <section className="bg-slate-900 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
                        <span className="inline-block bg-amber/20 text-amber text-[15px] font-bold px-5 py-2 rounded-full mb-7">
                            Our Story
                        </span>
                        <h1 className="text-[34px] sm:text-[48px] font-extrabold text-white leading-tight tracking-tight mb-7">
                            Redefining Men's Fashion Through Premium Fabrics
                        </h1>
                        <p className="text-[18px] text-slate-300 leading-[1.8]">
                            Extract Menswear was born from a simple belief — every man deserves clothing that fits impeccably and feels extraordinary against the skin.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Values */}
            <section className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-20 sm:py-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8">
                    {VALUES.map((v, i) => (
                        <motion.div
                            key={v.title}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="bg-white rounded-2xl border border-slate-200 p-7 sm:p-8 hover:shadow-md hover:border-slate-300 transition-all"
                        >
                            <span className="text-[36px] block mb-5">{v.icon}</span>
                            <h3 className="text-[18px] font-bold text-slate-900 mb-3">{v.title}</h3>
                            <p className="text-[16px] text-slate-500 leading-[1.8]">{v.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Story section */}
            <section className="bg-slate-50 py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="aspect-[4/5] overflow-hidden rounded-2xl">
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
                            <h2 className="text-[30px] sm:text-[36px] font-extrabold text-slate-900 tracking-tight mb-8">
                                Craftsmanship Meets Modern Design
                            </h2>
                            <div className="space-y-5 text-[17px] text-slate-600 leading-[1.8]">
                                <p>
                                    We source the finest Linen, Oxford, Twill, and Satin fabrics from trusted mills to create shirts that look and feel premium.
                                    Our trousers blend formal elegance with casual comfort, designed for every setting in a modern man's life.
                                </p>
                                <p>
                                    Every stitch, every seam, every button placement is considered with intention. We don't follow fast fashion — we craft lasting wardrobe staples that elevate your everyday style.
                                </p>
                            </div>
                            <Link
                                to="/shirts"
                                className="inline-flex items-center gap-2.5 mt-10 bg-primary text-white text-[16px] font-bold px-9 py-4 rounded-2xl hover:bg-primary-dark transition-colors"
                            >
                                View Collection
                                <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-20 sm:py-24">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8 text-center">
                    {[
                        { value: "4", label: "Premium Fabrics" },
                        { value: "500+", label: "Happy Customers" },
                        { value: "100%", label: "Quality Guaranteed" },
                        { value: "2", label: "Core Categories" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="bg-slate-50 rounded-2xl p-8 sm:p-10"
                        >
                            <p className="text-[38px] sm:text-[48px] font-extrabold text-primary mb-2">{stat.value}</p>
                            <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    );
}
