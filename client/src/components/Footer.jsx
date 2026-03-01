import { Link } from "react-router-dom";
import { FiInstagram, FiTwitter, FiFacebook } from "react-icons/fi";
import { HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineCreditCard } from "react-icons/hi";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-white" role="contentinfo">
            {/* Trust badges */}
            <div className="border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-10 sm:py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: HiOutlineTruck, title: "Free Delivery", desc: "On orders above ₹999" },
                            { icon: HiOutlineRefresh, title: "Easy Returns", desc: "7-day return policy" },
                            { icon: HiOutlineShieldCheck, title: "Secure Payment", desc: "100% protected" },
                            { icon: HiOutlineCreditCard, title: "Razorpay Checkout", desc: "Cards, UPI, Wallets" },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-4">
                                <item.icon className="w-7 h-7 text-amber shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[16px] font-bold text-white mb-1">{item.title}</p>
                                    <p className="text-[14px] text-slate-400 leading-[1.5]">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-14 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-14">
                    <div className="col-span-2 md:col-span-1">
                        <div className="mb-5">
                            <img src="/images/logo.png" alt="Extract Menswear" className="h-[52px] w-auto object-contain rounded-lg" />
                        </div>
                        <p className="text-[16px] text-slate-400 leading-[1.7] mb-6">
                            Premium menswear crafted from the finest fabrics for the modern man.
                        </p>
                        <div className="flex items-center gap-3.5">
                            {[FiInstagram, FiTwitter, FiFacebook].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"
                                    aria-label={["Instagram", "Twitter", "Facebook"][i]}
                                >
                                    <Icon className="w-4.5 h-4.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[15px] font-bold tracking-wider uppercase text-white mb-5">Shop</h4>
                        <ul className="space-y-3">
                            <li><Link to="/shirts" className="text-[16px] text-slate-400 hover:text-white transition-colors">All Shirts</Link></li>
                            <li><Link to="/trousers" className="text-[16px] text-slate-400 hover:text-white transition-colors">All Trousers</Link></li>
                            <li><Link to="/" className="text-[16px] text-slate-400 hover:text-white transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[15px] font-bold tracking-wider uppercase text-white mb-5">Company</h4>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-[16px] text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="text-[16px] text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                            <li><Link to="/admin/login" className="text-[16px] text-slate-400 hover:text-white transition-colors">Admin Panel</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[13px] font-bold tracking-wider uppercase text-white mb-5">Help</h4>
                        <ul className="space-y-3">
                            <li><span className="text-[16px] text-slate-400">Shipping Info</span></li>
                            <li><span className="text-[16px] text-slate-400">Returns & Exchanges</span></li>
                            <li><span className="text-[16px] text-slate-400">Size Guide</span></li>
                            <li><span className="text-[16px] text-slate-400">FAQ</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-slate-500 text-[14px]">© {new Date().getFullYear()} Extract Menswear. All rights reserved.</p>
                    <p className="text-slate-600 text-[14px]">Made with ♥ in India</p>
                </div>
            </div>
        </footer>
    );
}
