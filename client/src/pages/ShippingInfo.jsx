import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineTruck, HiOutlineClock, HiOutlineShieldCheck, HiOutlineGlobe, HiOutlineArrowLeft, HiOutlineInformationCircle } from "react-icons/hi";

const SHIPPING_ZONES = [
    { zone: "Metro Cities", area: "Delhi NCR, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata", days: "2-4", cost: "Free above ₹999 / ₹49" },
    { zone: "Tier 1 Cities", area: "Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Kochi", days: "3-5", cost: "Free above ₹999 / ₹79" },
    { zone: "Tier 2 & 3 Cities", area: "All other serviceable pin codes across India", days: "5-7", cost: "Free above ₹1,499 / ₹99" },
];

export default function ShippingInfo() {
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
                            <li className="text-slate-900 dark:text-white font-semibold">Shipping Information</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="page-wrap" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "48px", maxWidth: "900px", margin: "0 auto" }}>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <HiOutlineTruck className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Shipping Information</h1>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-[1.7]">
                            We deliver across India with trusted logistics partners. Here's everything you need to know about our shipping.
                        </p>
                    </div>

                    {/* Quick highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {[
                            { icon: HiOutlineTruck, title: "Pan-India Delivery", desc: "We ship to 19,000+ pin codes across India" },
                            { icon: HiOutlineClock, title: "Fast Dispatch", desc: "Orders dispatched within 24 hours of placement" },
                            { icon: HiOutlineShieldCheck, title: "Secure Packaging", desc: "Premium packaging to ensure your order arrives safely" },
                        ].map((item) => (
                            <div key={item.title} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-7 text-center">
                                <item.icon className="w-7 h-7 mx-auto mb-3" style={{ color: "var(--gold)" }} />
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h3>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.6]">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Shipping zones table */}
                    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700" style={{ background: "rgba(26,39,68,0.04)" }}>
                            <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white">Delivery Timelines & Charges</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-8 py-5 text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Zone</th>
                                        <th className="px-8 py-5 text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Areas</th>
                                        <th className="px-8 py-5 text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Est. Days</th>
                                        <th className="px-8 py-5 text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SHIPPING_ZONES.map((zone, i) => (
                                        <tr key={zone.zone} className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 ${i % 2 !== 0 ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}`}>
                                            <td className="px-8 py-5 text-[15px] font-bold text-slate-900 dark:text-white">{zone.zone}</td>
                                            <td className="px-8 py-5 text-[14px] text-slate-600 dark:text-slate-300">{zone.area}</td>
                                            <td className="px-8 py-5 text-[15px] font-semibold text-slate-700 dark:text-slate-300">{zone.days} days</td>
                                            <td className="px-8 py-5 text-[14px] text-slate-600 dark:text-slate-300">{zone.cost}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Additional info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { title: "Order Tracking", desc: "Once your order is shipped, you'll receive a tracking number via email and SMS. Track your order in real-time on our Orders page." },
                            { title: "Dispatch Time", desc: "All orders placed before 2:00 PM IST are dispatched the same day. Orders placed after 2:00 PM are dispatched the next business day." },
                            { title: "Delivery Exceptions", desc: "In rare cases of delays due to weather, strikes, or remote locations, we'll notify you proactively via email with updated timelines." },
                            { title: "COD Availability", desc: "Cash on Delivery is available for orders under ₹5,000 in select pin codes. Prepaid orders enjoy priority processing." },
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
                            <p className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">Questions about shipping?</p>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7]">
                                Reach out to us at{" "}
                                <Link to="/contact" className="font-semibold hover:underline" style={{ color: "var(--gold)" }}>
                                    our contact page
                                </Link>{" "}
                                and we'll help you right away.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
