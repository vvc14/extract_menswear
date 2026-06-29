import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineRefresh, HiOutlineArrowLeft, HiOutlineShieldCheck, HiOutlineClock, HiOutlineCreditCard, HiOutlineInformationCircle } from "react-icons/hi";

const RETURN_STEPS = [
    { step: 1, title: "Initiate Request", desc: "Go to your Orders page and click 'Request Return' within 7 days of delivery." },
    { step: 2, title: "Provide Reason", desc: "Share a brief reason for the return — size issue, defect, wrong item, etc." },
    { step: 3, title: "Pickup Scheduled", desc: "Our logistics partner will pick up the item from your doorstep within 3-5 business days." },
    { step: 4, title: "Refund Processed", desc: "Once we receive and inspect the item, your refund is processed within 5-7 business days." },
];

const EXCHANGE_STEPS = [
    { step: 1, title: "Request Exchange", desc: "Click 'Request Exchange' on your Orders page within 7 days of delivery." },
    { step: 2, title: "Specify Preference", desc: "Tell us the size or variant you'd prefer instead." },
    { step: 3, title: "Pickup & Reship", desc: "We'll pick up the original item and ship the replacement simultaneously." },
    { step: 4, title: "New Item Delivered", desc: "Your exchanged item arrives within the standard delivery timeline." },
];

export default function ReturnsExchange() {
    const navigate = useNavigate();
    return (
        <main id="main-content">
            <div className="bg-slate-50 dark:bg-[#0d1321] border-b border-slate-200 dark:border-slate-800">
                <div className="page-wrap py-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                            <HiOutlineArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <ol className="flex items-center gap-2 text-[15px]">
                            <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                            <li className="text-slate-300 dark:text-slate-600">/</li>
                            <li className="text-slate-900 dark:text-white font-semibold">Returns & Exchange</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="page-wrap" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "48px", maxWidth: "900px", margin: "0 auto" }}>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <HiOutlineRefresh className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Returns & Exchange</h1>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-[1.7]">
                            Not satisfied? No worries. We offer hassle-free returns and exchanges within 7 days of delivery.
                        </p>
                    </div>

                    {/* Quick highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {[
                            { icon: HiOutlineClock, title: "7-Day Window", desc: "Request returns or exchanges within 7 days of delivery" },
                            { icon: HiOutlineCreditCard, title: "Full Refund", desc: "Get a complete refund to your original payment method" },
                            { icon: HiOutlineShieldCheck, title: "Free Pickup", desc: "We arrange doorstep pickup — no extra charges" },
                        ].map((item) => (
                            <div key={item.title} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-7 text-center">
                                <item.icon className="w-7 h-7 mx-auto mb-3" style={{ color: "var(--gold)" }} />
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h3>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.6]">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Return steps */}
                    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700" style={{ background: "rgba(26,39,68,0.04)" }}>
                            <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white">How to Return</h2>
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                {RETURN_STEPS.map((step) => (
                                    <div key={step.step} className="flex gap-5">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-extrabold text-white" style={{ background: "linear-gradient(135deg,#1a2744 0%,#2a3f6e 100%)" }}>
                                            {step.step}
                                        </div>
                                        <div>
                                            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Exchange steps */}
                    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700" style={{ background: "rgba(201,168,76,0.06)" }}>
                            <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white">How to Exchange</h2>
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                {EXCHANGE_STEPS.map((step) => (
                                    <div key={step.step} className="flex gap-5">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-extrabold text-white" style={{ background: "var(--gold)" }}>
                                            {step.step}
                                        </div>
                                        <div>
                                            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Policy details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { title: "Eligibility", desc: "Items must be unworn, unwashed, with original tags intact. Innerwear and accessories are non-returnable for hygiene reasons." },
                            { title: "Refund Method", desc: "Refunds are processed to the original payment method within 5-7 business days after we receive the returned item." },
                            { title: "Damaged / Wrong Items", desc: "If you receive a damaged or incorrect item, contact us immediately. We'll arrange a free return and replacement." },
                            { title: "Sale Items", desc: "Sale items can be returned within 7 days. Refund will be for the amount paid, not the original MRP." },
                        ].map((item) => (
                            <div key={item.title} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-7">
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Help note */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 p-10 sm:p-14 flex flex-col items-center text-center gap-6">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)" }}>
                            <HiOutlineInformationCircle className="w-5 h-5" style={{ color: "var(--gold)" }} />
                        </div>
                        <div>
                            <p className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">Need help with a return or exchange?</p>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">
                                Visit{" "}
                                <Link to="/orders" className="font-semibold hover:underline" style={{ color: "var(--gold)" }}>
                                    your orders page
                                </Link>{" "}
                                to initiate a request, or{" "}
                                <Link to="/contact" className="font-semibold hover:underline" style={{ color: "var(--gold)" }}>
                                    contact us
                                </Link>{" "}
                                for assistance.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
