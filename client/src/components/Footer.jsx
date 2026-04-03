import { Link } from "react-router-dom";
import { FiInstagram, FiTwitter, FiFacebook } from "react-icons/fi";
import {
    HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineCreditCard
} from "react-icons/hi";

const TRUST = [
    { Icon: HiOutlineTruck, title: "Free Delivery", desc: "On orders above ₹999" },
    { Icon: HiOutlineRefresh, title: "Easy Returns", desc: "7-day return policy" },
    { Icon: HiOutlineShieldCheck, title: "Secure Payment", desc: "100% protected" },
    { Icon: HiOutlineCreditCard, title: "Razorpay Checkout", desc: "Cards, UPI, Wallets" },
];

const SHOP_LINKS = [{ to: "/shirts", label: "All Shirts" }, { to: "/trousers", label: "All Trousers" }, { to: "/#new-arrivals", label: "New Arrivals" }];
const COMPANY_LINKS = [{ to: "/about", label: "About Us" }, { to: "/contact", label: "Contact" }];
const HELP_ITEMS = [
    { label: "Shipping Info" },
    { label: "Returns & Exchanges" },
    { label: "Size Guide", to: "/size-guide" },
    { label: "FAQ" },
];

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-white" role="contentinfo">

            {/* ── Trust strip ── */}
            <div className="border-b border-slate-800">
                <div className="page-wrap" style={{ paddingTop: "40px", paddingBottom: "48px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px" }}>
                        {TRUST.map(({ Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(201,168,76,0.12)" }}>
                                    <Icon className="w-5 h-5" style={{ color: "#c9a84c" }} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-white mb-0.5">{title}</p>
                                    <p className="text-[13px] text-slate-400 leading-snug">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main footer columns ── */}
            <div className="page-wrap" style={{ paddingTop: "64px", paddingBottom: "80px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "56px" }}>

                    {/* Brand */}
                    <div>
                        <div style={{ marginBottom: "20px" }}>
                            <img src="/images/logo.png" alt="Extract Menswear" className="h-[48px] w-auto object-contain rounded-lg" />
                        </div>
                        <p className="text-[15px] text-slate-400 leading-[1.75]" style={{ marginBottom: "24px" }}>
                            Premium menswear crafted from the finest fabrics for the modern man.
                        </p>
                        <div className="flex items-center gap-3">
                            {[FiInstagram, FiTwitter, FiFacebook].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                                    style={{ transition: "background 0.2s, color 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#c9a84c"}
                                    onMouseLeave={e => e.currentTarget.style.background = ""}
                                    aria-label={["Instagram", "Twitter", "Facebook"][i]}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-[12px] font-bold tracking-[0.12em] uppercase text-slate-500" style={{ marginBottom: "20px" }}>Shop</h4>
                        <ul className="space-y-3.5">
                            {SHOP_LINKS.map(({ to, label }) => (
                                <li key={label}>
                                    <Link to={to} className="text-[15px] text-slate-400 hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-[12px] font-bold tracking-[0.12em] uppercase text-slate-500" style={{ marginBottom: "20px" }}>Company</h4>
                        <ul className="space-y-3.5">
                            {COMPANY_LINKS.map(({ to, label }) => (
                                <li key={label}>
                                    <Link to={to} className="text-[15px] text-slate-400 hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h4 className="text-[12px] font-bold tracking-[0.12em] uppercase text-slate-500" style={{ marginBottom: "20px" }}>Help</h4>
                        <ul className="space-y-3.5">
                            {HELP_ITEMS.map((item) => (
                                <li key={item.label}>
                                    {item.to ? (
                                        <Link to={item.to} className="text-[15px] text-slate-400 hover:text-white transition-colors">
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className="text-[15px] text-slate-400 cursor-default">{item.label}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="border-t border-slate-800">
                <div className="page-wrap" style={{ paddingTop: "24px", paddingBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <p className="text-slate-500 text-[13px]">
                        © {new Date().getFullYear()} Extract Menswear. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
