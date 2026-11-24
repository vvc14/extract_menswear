import PageHero from "../components/PageHero";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineTruck, HiOutlineClock, HiOutlineShieldCheck, HiOutlineInformationCircle } from "react-icons/hi";

const SHIPPING_ZONES = [
    { zone: "Metro Cities", area: "Delhi NCR, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata", days: "2-4", cost: "Free above ₹999 / ₹49" },
    { zone: "Tier 1 Cities", area: "Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Kochi", days: "3-5", cost: "Free above ₹999 / ₹79" },
    { zone: "Tier 2 & 3 Cities", area: "All other serviceable pin codes across India", days: "5-7", cost: "Free above ₹1,499 / ₹99" },
];

export default function ShippingInfo() {
    return (
        <main id="main-content">
            <PageHero title="Shipping">
                Where we deliver, how long it takes and what it costs.
            </PageHero>

            <div className="page-wrap" style={{ paddingTop: "56px", paddingBottom: "80px" }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "48px", maxWidth: "900px", margin: "0 auto" }}>

                    {/* Quick highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {[
                            { icon: HiOutlineTruck, title: "Pan-India delivery", desc: "We ship to any pin code our courier partners serve" },
                            { icon: HiOutlineClock, title: "Fast Dispatch", desc: "Orders dispatched within 24 hours of placement" },
                            { icon: HiOutlineShieldCheck, title: "Secure Packaging", desc: "Every order is packed and sealed at the shop" },
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
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)" }}>
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
