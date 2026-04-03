import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineScale, HiOutlineInformationCircle } from "react-icons/hi";

const SHIRT_SIZES = [
    { size: "S", chest: "36", body: "26", shoulder: "16.5", sleeve: "24" },
    { size: "M", chest: "38", body: "27", shoulder: "17", sleeve: "24.5" },
    { size: "L", chest: "40", body: "28", shoulder: "17.5", sleeve: "25" },
    { size: "XL", chest: "42", body: "29", shoulder: "18", sleeve: "25.5" },
    { size: "XXL", chest: "44", body: "30", shoulder: "18.5", sleeve: "26" },
];

const TROUSER_SIZES = [
    { size: "28", waist: "28", hip: "36", length: "40", inseam: "30" },
    { size: "30", waist: "30", hip: "38", length: "41", inseam: "31" },
    { size: "32", waist: "32", hip: "40", length: "42", inseam: "32" },
    { size: "34", waist: "34", hip: "42", length: "42", inseam: "32" },
    { size: "36", waist: "36", hip: "44", length: "43", inseam: "32" },
    { size: "38", waist: "38", hip: "46", length: "43", inseam: "32" },
];

const MEASURE_TIPS = [
    {
        title: "Chest",
        description: "Measure around the fullest part of your chest, keeping the tape snug under your armpits.",
    },
    {
        title: "Waist",
        description: "Measure around your natural waistline — the narrowest part of your torso, just above your navel.",
    },
    {
        title: "Shoulder",
        description: "Measure from the edge of one shoulder to the other across the back, keeping the tape flat.",
    },
    {
        title: "Hip",
        description: "Measure around the fullest part of your hips, with feet together and tape parallel to the floor.",
    },
];

export default function SizeGuide() {
    const [activeTab, setActiveTab] = useState("shirts");

    return (
        <main id="main-content">
            {/* Breadcrumb bar */}
            <div className="bg-slate-50 dark:bg-[#0d1321] border-b border-slate-200 dark:border-slate-800">
                <div className="page-wrap py-4">
                    <nav aria-label="Breadcrumb">
                        <ol className="flex items-center gap-2 text-[15px]">
                            <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                            <li className="text-slate-300 dark:text-slate-600">/</li>
                            <li className="text-slate-900 dark:text-white font-semibold">Size Guide</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="page-wrap py-12 sm:py-16 lg:py-20">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center">

                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-14">
                        <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <HiOutlineScale className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h1 className="text-[30px] sm:text-[38px] lg:text-[44px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                            Size Guide
                        </h1>
                        <p className="text-[16px] sm:text-[17px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-[1.7]">
                            Find the perfect fit. All measurements are in inches. If you're between sizes, we recommend sizing up for a relaxed fit.
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 gap-1">
                            {[
                                { key: "shirts", label: "Shirts" },
                                { key: "trousers", label: "Trousers" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative px-8 py-3 text-[15px] font-bold rounded-lg transition-all duration-300 ${
                                        activeTab === tab.key
                                            ? "text-white shadow-md"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    }`}
                                    style={activeTab === tab.key ? { background: "linear-gradient(135deg,#1a2744 0%,#2a3f6e 100%)" } : {}}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size table */}
                    <div className="w-full max-w-3xl mb-16">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {activeTab === "shirts" ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700" style={{ background: "rgba(26,39,68,0.04)" }}>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Size</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Chest</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Body Length</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Shoulder</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Sleeve</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SHIRT_SIZES.map((row, i) => (
                                                <tr
                                                    key={row.size}
                                                    className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                                                        i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/30"
                                                    }`}
                                                >
                                                    <td className="px-6 py-4 text-[15px] font-extrabold text-slate-900 dark:text-white">{row.size}</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.chest}"</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.body}"</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.shoulder}"</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.sleeve}"</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700" style={{ background: "rgba(26,39,68,0.04)" }}>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Size</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Waist</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Hip</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Length</th>
                                                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Inseam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {TROUSER_SIZES.map((row, i) => (
                                                <tr
                                                    key={row.size}
                                                    className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                                                        i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/30"
                                                    }`}
                                                >
                                                    <td className="px-6 py-4 text-[15px] font-extrabold text-slate-900 dark:text-white">{row.size}</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.waist}"</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.hip}"</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.length}"</td>
                                                    <td className="px-6 py-4 text-[15px] text-slate-600 dark:text-slate-300 font-medium">{row.inseam}"</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* How to measure */}
                    <div className="w-full max-w-3xl mb-16">
                        <h2 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 text-center">
                            How to Measure
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {MEASURE_TIPS.map((tip) => (
                                <div
                                    key={tip.title}
                                    className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-7 text-center"
                                >
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-2">
                                        {tip.title}
                                    </h3>
                                    <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">
                                        {tip.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Help note */}
                    <div className="w-full max-w-3xl">
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 p-7 sm:p-9 flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)" }}>
                                <HiOutlineInformationCircle className="w-5 h-5" style={{ color: "#c9a84c" }} />
                            </div>
                            <div>
                                <p className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">Need help finding your size?</p>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">
                                    Our team is happy to help! Reach out to us at{" "}
                                    <Link to="/contact" className="font-semibold hover:underline" style={{ color: "#c9a84c" }}>
                                        our contact page
                                    </Link>{" "}
                                    and we'll assist you in finding the perfect fit.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
