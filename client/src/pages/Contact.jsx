import { useState } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineMail, HiOutlineUser, HiOutlineChatAlt2, HiOutlineClock, HiOutlineArrowRight } from "react-icons/hi";

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post("/contact", form);
            setStatus("success");
            setForm({ name: "", email: "", message: "" });
        } catch {
            setStatus("error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main id="main-content">
            {/* Hero */}
            <section className="bg-slate-900 py-20">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex items-center gap-2 text-[15px]">
                                <li><Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
                                <li className="text-slate-600">/</li>
                                <li className="text-white font-semibold">Contact</li>
                            </ol>
                        </nav>
                        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-white tracking-tight mb-4">
                            Get in Touch
                        </h1>
                        <p className="text-[18px] text-slate-300 leading-[1.7]">We'd love to hear from you. Send us a message below.</p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-16 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-14">
                    {/* Info cards */}
                    <div className="lg:col-span-1 space-y-5">
                        {[
                            { icon: HiOutlineMail, title: "Email Us", desc: "hello@extractmenswear.com", sub: "We'll respond within 24 hours" },
                            { icon: HiOutlineClock, title: "Working Hours", desc: "Mon — Sat, 9 AM to 7 PM", sub: "IST (India Standard Time)" },
                            { icon: HiOutlineChatAlt2, title: "Live Chat", desc: "Chat with our support team", sub: "Available during business hours" },
                        ].map((card) => (
                            <div key={card.title} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 flex items-start gap-5">
                                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                                    <card.icon className="w-5.5 h-5.5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[16px] font-bold text-slate-900 mb-1">{card.title}</p>
                                    <p className="text-[15px] text-slate-600 font-medium leading-[1.6]">{card.desc}</p>
                                    <p className="text-[14px] text-slate-400 mt-1">{card.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 p-7 sm:p-10">
                            <h2 className="text-[24px] font-extrabold text-slate-900 mb-8">Send a Message</h2>

                            {status === "success" && (
                                <div className="bg-emerald/10 border border-emerald/20 text-emerald text-[16px] font-semibold px-6 py-4 rounded-xl mb-7 flex items-center gap-2">
                                    ✓ Thank you! Your message has been sent.
                                </div>
                            )}
                            {status === "error" && (
                                <div className="bg-rose/10 border border-rose/20 text-rose text-[16px] font-semibold px-6 py-4 rounded-xl mb-7">
                                    Something went wrong. Please try again.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-[15px] font-bold text-slate-700 mb-2">Full Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                            placeholder="John Doe"
                                            className="w-full border border-slate-200 px-5 py-3.5 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-[15px] font-bold text-slate-700 mb-2">Email Address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required
                                            placeholder="john@example.com"
                                            className="w-full border border-slate-200 px-5 py-3.5 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-[15px] font-bold text-slate-700 mb-2">Message</label>
                                    <textarea
                                        id="message"
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        required
                                        rows={6}
                                        placeholder="Tell us about your inquiry..."
                                        className="w-full border border-slate-200 px-5 py-3.5 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-primary text-white text-[17px] font-bold px-14 py-5 rounded-2xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Sending..." : "Send Message"}
                                    {!submitting && <HiOutlineArrowRight className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
