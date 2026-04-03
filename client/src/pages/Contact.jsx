import { useState } from "react";
import { motion } from "framer-motion";
import API from "../services/api";
import { HiOutlineMail, HiOutlineClock, HiOutlineChat } from "react-icons/hi";

const INFO = [
    {
        Icon: HiOutlineMail,
        title: "Email Us",
        detail: "hello@extractmenswear.com",
        sub: "We'll respond within 24 hours",
    },
    {
        Icon: HiOutlineClock,
        title: "Working Hours",
        detail: "Mon — Sat, 9 AM to 7 PM",
        sub: "IST (India Standard Time)",
    },
    {
        Icon: HiOutlineChat,
        title: "Live Chat",
        detail: "Chat with our support team",
        sub: "Available during business hours",
    },
];

export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await API.post("/contact", formData);
            setSuccess(true);
            setFormData({ name: "", email: "", message: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send message. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main id="main-content">

            {/* ── Hero ── */}
            <section style={{ background: "#1a2744" }} className="py-20 sm:py-24">
                <div className="page-wrap">
                    <nav className="flex items-center gap-2 text-[13px] mb-8" aria-label="Breadcrumb">
                        <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors">Home</a>
                        <span className="text-slate-700">/</span>
                        <span className="font-semibold text-slate-300">Contact</span>
                    </nav>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full mb-6"
                            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}>
                            Get in Touch
                        </span>
                        <h1 className="text-[34px] sm:text-[48px] font-extrabold text-white tracking-tight mb-4">
                            We'd Love to Hear<br />From You
                        </h1>
                        <p className="text-[16px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                            Send us a message below and we'll get back to you shortly.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Contact content ── */}
            <section className="bg-slate-50 dark:bg-[#0a0f1a] border-b border-slate-100 dark:border-slate-800">
                <div className="page-wrap py-16 sm:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

                        {/* Info column */}
                        <div className="lg:col-span-2 space-y-5">
                            {INFO.map(({ Icon, title, detail, sub }) => (
                                <motion.div
                                    key={title}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex gap-4 items-start"
                                >
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#f0f4fd] dark:bg-slate-700">
                                        <Icon className="w-5 h-5 text-[#1a2744] dark:text-gold" />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-slate-900 dark:text-white mb-0.5">{title}</p>
                                        <p className="text-[14px] text-slate-700 dark:text-slate-300 font-medium mb-0.5">{detail}</p>
                                        <p className="text-[13px] text-slate-400">{sub}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Form column */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="lg:col-span-3 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10"
                        >
                            <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-8">Send a Message</h2>
                            {success ? (
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-6 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-center">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Message Sent Successfully!</h3>
                                    <p className="text-sm opacity-80">We've received your message and will get back to you shortly.</p>
                                    <button onClick={() => setSuccess(false)} className="mt-4 text-sm font-semibold underline">Send another message</button>
                                </div>
                            ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">{error}</div>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-2" htmlFor="name">
                                            Full Name
                                        </label>
                                        <input
                                            id="name" type="text" placeholder="John Doe" required
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[15px] text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-900/50 transition-all outline-none"
                                            style={{ "--tw-ring-color": "#c9a84c" }}
                                            onFocus={e => { e.target.style.borderColor = "#c9a84c"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
                                            onBlur={e => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-2" htmlFor="email">
                                            Email Address
                                        </label>
                                        <input
                                            id="email" type="email" placeholder="john@example.com" required
                                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[15px] text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-900/50 transition-all outline-none"
                                            onFocus={e => { e.target.style.borderColor = "#c9a84c"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
                                            onBlur={e => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-2" htmlFor="message">
                                        Message
                                    </label>
                                    <textarea
                                        id="message" rows={6} placeholder="Tell us about your inquiry..." required
                                        value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[15px] text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-900/50 transition-all outline-none resize-none"
                                        onFocus={e => { e.target.style.borderColor = "#c9a84c"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
                                        onBlur={e => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full justify-center py-4 text-[15px] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Sending..." : "Send Message →"}
                                </button>
                            </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </main>
    );
}
