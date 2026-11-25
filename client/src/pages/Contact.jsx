import { useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineMail, HiOutlineClock, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCheck } from "react-icons/hi";
import API from "../services/api";
import { Eagle } from "../components/brand/Logo";

const PHONES = ["8184836764", "7337526629"];
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Extract Men's Wear, NTR Road, Suraram Colony, Hyderabad")}`;

const inputCls =
    "w-full px-4 py-3.5 border-2 border-slate-300 dark:border-slate-600 text-[16px] text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-slate-900 outline-none focus:border-primary dark:focus:border-sign focus:shadow-[3px_3px_0_#111111] dark:focus:shadow-[3px_3px_0_#ffffff] transition-shadow";

export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!emailPattern.test(formData.email)) {
            setError("That email address does not look right. Check it and try again.");
            return;
        }

        setLoading(true);
        try {
            await API.post("/contact", formData);
            setSuccess(true);
            setFormData({ name: "", email: "", message: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Your message did not send. Try again, or call the shop instead.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main id="main-content">
            {/* Hero */}
            <section className="board border-b-2 border-ink">
                <div className="page-wrap py-14 sm:py-20">
                    <nav aria-label="Breadcrumb" className="mb-8 text-[14px] font-semibold text-white/80">
                        <Link to="/" className="hover:text-sign underline-offset-4 hover:underline">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span aria-current="page" className="text-white">Contact</span>
                    </nav>
                    <h1 className="display text-[48px] sm:text-[84px]">
                        <span className="text-white">Call. </span>
                        <span className="sign-type">Write. </span>
                        <span className="text-white">Walk in.</span>
                    </h1>
                    <p className="mt-6 max-w-xl text-[17px] sm:text-[19px] text-white/90">
                        A size question, an order that has not arrived, a bulk enquiry: the fastest answer is a phone call to the shop.
                    </p>
                </div>
            </section>

            <section className="bg-slate-50 dark:bg-[#121212]">
                <div className="page-wrap py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

                    {/* The shop's visiting card: everything needed to reach the counter */}
                    <div className="lg:col-span-5">
                        <h2 className="sr-only">Shop details</h2>
                        <div className="bolted board border-[3px] border-ink shadow-[10px_10px_0_#9e9e9e] dark:shadow-[10px_10px_0_#000] lg:-rotate-2 px-5 pt-9 pb-6 sm:px-8">
                            <div className="flex items-center gap-3 pb-5 border-b-2 border-white/25">
                                <Eagle className="w-14 h-auto text-white shrink-0" />
                                <div className="leading-none">
                                    <p className="logo-word text-[34px]">EXTRACT</p>
                                    <p className="logo-tag text-[10.5px]">MENSWEAR</p>
                                </div>
                            </div>

                            <ul className="mt-5 flex flex-col gap-3">
                                {PHONES.map((p) => (
                                    <li key={p}>
                                        <a href={`tel:+91${p}`} className="flex items-center gap-3 min-h-[56px] px-4 bg-sign text-ink border-2 border-ink shadow-[4px_4px_0_#111111] text-[24px] sm:text-[28px] font-black tabular-nums hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform" style={{ fontStretch: "112%" }}>
                                            <HiOutlinePhone className="w-6 h-6 shrink-0" aria-hidden="true" />
                                            {p.slice(0, 5)} {p.slice(5)}
                                        </a>
                                    </li>
                                ))}
                            </ul>

                            <dl className="mt-6 grid grid-cols-1 gap-5 text-white">
                                <div className="flex gap-3">
                                    <dt><HiOutlineClock className="w-5 h-5 text-sign mt-0.5" aria-hidden="true" /><span className="sr-only">Shop hours</span></dt>
                                    <dd className="text-[16px] font-bold">Monday to Saturday, 9 AM to 7 PM</dd>
                                </div>
                                <div className="flex gap-3">
                                    <dt><HiOutlineLocationMarker className="w-5 h-5 text-sign mt-0.5" aria-hidden="true" /><span className="sr-only">Address</span></dt>
                                    <dd>
                                        <address className="not-italic text-[16px] leading-relaxed">
                                            H.No. 5-360, NTR Road<br />2nd Om Jend, Suraram Colony<br />Hyderabad 500055
                                        </address>
                                        <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-[15px] font-bold text-sign underline underline-offset-4 hover:no-underline">
                                            Directions in Google Maps<span className="sr-only"> (opens in a new tab)</span>
                                        </a>
                                    </dd>
                                </div>
                                <div className="flex gap-3">
                                    <dt><HiOutlineMail className="w-5 h-5 text-sign mt-0.5" aria-hidden="true" /><span className="sr-only">Email</span></dt>
                                    <dd>
                                        <a href="mailto:support@extractmenswear.com" className="text-[16px] font-bold underline underline-offset-4 break-all hover:text-sign">support@extractmenswear.com</a>
                                        <p className="mt-1 text-[14px] text-white/85">Replies within one working day.</p>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-700 p-6 sm:p-10">
                        <h2 className="display text-[32px] sm:text-[40px] text-slate-900 dark:text-white mb-2">Send a note</h2>
                        <p className="text-[15px] text-slate-600 dark:text-slate-400 mb-8">Goes straight to the shop inbox.</p>

                        {success ? (
                            <div className="border-2 border-emerald bg-emerald/10 p-6" role="status">
                                <p className="flex items-center gap-2 text-[18px] font-black text-slate-900 dark:text-white">
                                    <HiOutlineCheck className="w-6 h-6 text-emerald" aria-hidden="true" /> Message sent
                                </p>
                                <p className="mt-1 text-[15px] text-slate-700 dark:text-slate-300">We will reply to your email within one working day.</p>
                                <button type="button" onClick={() => setSuccess(false)} className="mt-4 text-[15px] font-bold underline underline-offset-4 text-primary dark:text-sign min-h-[44px]">Write another</button>
                            </div>
                        ) : (
                            <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate={false}>
                                {error && (
                                    <p role="alert" className="p-3 text-[15px] font-semibold text-rose-600 dark:text-rose-400 border-2 border-rose-500 bg-rose-50 dark:bg-rose-500/10">{error}</p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-2" htmlFor="name">Your name</label>
                                        <input id="name" type="text" placeholder="Your name" required autoComplete="name"
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-2" htmlFor="email">Email</label>
                                        <input id="email" type="email" placeholder="email@example.com" required autoComplete="email"
                                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={inputCls} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-2" htmlFor="message">Message</label>
                                    <textarea id="message" rows={6} placeholder="Order number, size question, bulk enquiry..." required
                                        value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className={`${inputCls} resize-y`} />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto sm:self-start text-[16px]">
                                    {loading ? "Sending..." : "Send message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
