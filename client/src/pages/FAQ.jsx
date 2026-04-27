import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowLeft, HiOutlineQuestionMarkCircle, HiOutlineChevronDown } from "react-icons/hi";

const FAQS = [
    {
        category: "Orders & Shipping",
        items: [
            { q: "How long does delivery take?", a: "Delivery typically takes 2-7 business days depending on your location. Metro cities receive orders in 2-4 days, while tier 2/3 cities may take 5-7 days." },
            { q: "Do you offer free shipping?", a: "Yes! Orders above ₹999 qualify for free shipping. For orders below ₹999, a nominal shipping fee of ₹49-₹99 applies based on your delivery location." },
            { q: "How can I track my order?", a: "Once your order is shipped, you'll receive a tracking number via email and SMS. You can also track your order from the 'My Orders' section in your account." },
            { q: "Can I change my order after placing it?", a: "Orders are processed quickly, usually within a few hours. If you need to make changes, please contact us immediately. Once dispatched, changes cannot be made." },
            { q: "Do you ship internationally?", a: "Currently, we only ship within India. International shipping is coming soon!" },
        ],
    },
    {
        category: "Returns & Exchange",
        items: [
            { q: "What is your return policy?", a: "We offer a 7-day return policy from the date of delivery. Items must be unworn, unwashed, and have original tags attached. Visit our Returns & Exchange page for full details." },
            { q: "How do I initiate a return?", a: "Go to 'My Orders' in your account, find the order you want to return, and click 'Request Return'. Provide a reason and we'll arrange a doorstep pickup." },
            { q: "How long does a refund take?", a: "Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount is credited to your original payment method." },
            { q: "Can I exchange for a different size?", a: "Absolutely! Click 'Request Exchange' on your order, specify the size you need, and we'll arrange a swap with doorstep pickup and delivery." },
        ],
    },
    {
        category: "Sizing & Fit",
        items: [
            { q: "How do I find my size?", a: "Check our Size Guide page for detailed measurement charts for shirts and trousers. Measure yourself and match with our size tables for the best fit." },
            { q: "What if the size doesn't fit?", a: "No worries! You can request an exchange within 7 days of delivery for a different size. We offer free pickup and re-delivery." },
            { q: "Do your sizes run true to standard?", a: "Our sizes follow standard Indian sizing. If you're between sizes, we recommend sizing up for a relaxed fit or sizing down for a slim fit." },
        ],
    },
    {
        category: "Products & Care",
        items: [
            { q: "What fabrics do you use?", a: "We use premium fabrics including Cotton, Linen, Silk, and carefully crafted blends. Each product page lists the specific fabric used." },
            { q: "How should I care for my garments?", a: "Always check the care label inside the garment. Generally, we recommend gentle machine wash or dry clean for premium fabrics. Avoid bleach and high-heat drying." },
            { q: "Are the colors shown accurate?", a: "We strive for accurate color representation, but slight variations may occur due to screen settings and lighting during photography." },
        ],
    },
    {
        category: "Payment & Security",
        items: [
            { q: "What payment methods do you accept?", a: "We accept credit/debit cards, UPI, net banking, wallets, and Cash on Delivery (COD) for select pin codes. All payments are secured via Razorpay." },
            { q: "Is my payment information safe?", a: "Absolutely. All transactions are encrypted and processed through Razorpay, a PCI DSS compliant payment gateway. We never store your card details." },
            { q: "Is COD available?", a: "Yes, Cash on Delivery is available for orders under ₹5,000 at select pin codes. Prepaid orders enjoy priority processing and exclusive offers." },
        ],
    },
];

function FaqItem({ item }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <span className="text-[15px] font-semibold text-slate-900 dark:text-white">{item.q}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <HiOutlineChevronDown className="w-5 h-5 text-slate-400" />
                </motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7] border-t border-slate-100 dark:border-slate-700/50 pt-4">
                            {item.a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function FAQ() {
    return (
        <main id="main-content">
            <div className="bg-slate-50 dark:bg-[#0d1321] border-b border-slate-200 dark:border-slate-800">
                <div className="page-wrap py-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-4">
                        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                            <HiOutlineArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <ol className="flex items-center gap-2 text-[15px]">
                            <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                            <li className="text-slate-300 dark:text-slate-600">/</li>
                            <li className="text-slate-900 dark:text-white font-semibold">FAQs</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="page-wrap" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "48px", maxWidth: "800px", margin: "0 auto" }}>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <HiOutlineQuestionMarkCircle className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Frequently Asked Questions</h1>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-[1.7]">
                            Find quick answers to common questions about orders, shipping, returns, sizing, and more.
                        </p>
                    </div>

                    {FAQS.map((category) => (
                        <div key={category.category}>
                            <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-5">{category.category}</h2>
                            <div className="space-y-3">
                                {category.items.map((item) => (
                                    <FaqItem key={item.q} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 p-10 sm:p-14 flex flex-col items-center text-center gap-6">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)" }}>
                            <HiOutlineQuestionMarkCircle className="w-5 h-5" style={{ color: "#c9a84c" }} />
                        </div>
                        <div>
                            <p className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">Still have questions?</p>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">
                                We're here to help!{" "}
                                <Link to="/contact" className="font-semibold hover:underline" style={{ color: "#c9a84c" }}>
                                    Contact us
                                </Link>{" "}
                                and our team will get back to you within 24 hours.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
