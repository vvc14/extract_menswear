import { useState, useEffect } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import { ADMIN_PATH } from "../config/adminPath";
import { motion } from "framer-motion";
import { HiOutlineCollection, HiOutlineClock, HiOutlineUsers, HiOutlineTrendingUp, HiOutlineArrowRight } from "react-icons/hi";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total: 0, shirts: 0, trousers: 0, recent: [] });
    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [products, users] = await Promise.all([
                    API.get("/products"),
                    API.get("/admin/users").catch(() => ({ data: [] })),
                ]);
                const data = products.data;
                setStats({
                    total: data.length,
                    shirts: data.filter((p) => p.category === "shirt").length,
                    trousers: data.filter((p) => p.category === "trouser").length,
                    recent: data.slice(0, 5),
                });
                setUserCount(users.data.length || 0);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: "Total Products", value: stats.total, icon: HiOutlineCollection, grad: "from-primary to-blue-600", link: `/${ADMIN_PATH}/products` },
        { label: "Shirts", value: stats.shirts, icon: HiOutlineTrendingUp, grad: "from-amber-500 to-orange-500", link: `/${ADMIN_PATH}/products` },
        { label: "Trousers", value: stats.trousers, icon: HiOutlineCollection, grad: "from-emerald-500 to-teal-500", link: `/${ADMIN_PATH}/products` },
        { label: "Registered Users", value: userCount, icon: HiOutlineUsers, grad: "from-violet-500 to-purple-600", link: `/${ADMIN_PATH}/users` },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Welcome header */}
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "8px" }}>Dashboard</h1>
                <p style={{ fontSize: "16px", color: "#64748b" }}>Here's what's happening with your store today.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {cards.map((card) => (
                    <Link
                        to={card.link}
                        key={card.label}
                        className="group bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-5">
                            <div className={`w-13 h-13 bg-gradient-to-br ${card.grad} rounded-xl flex items-center justify-center shadow-lg`} style={{ width: 52, height: 52 }}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                            <HiOutlineArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-2">{card.label}</p>
                        <p className="text-[40px] font-extrabold text-slate-900 leading-none">{card.value}</p>
                    </Link>
                ))}
            </div>

            {/* Recent products */}
            {stats.recent.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                        <h2 className="text-[22px] font-bold text-slate-900">Recently Added</h2>
                        <Link to={`/${ADMIN_PATH}/products`} className="text-[15px] font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1.5">
                            View all <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                        <table className="w-full text-[15px]">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                                    <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                    <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Stock</th>
                                    <th className="text-right px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent.map((p) => (
                                    <tr key={p._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                    <img src={p.images && p.images.length > 0 ? p.images[0] : p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-semibold text-slate-900 text-[16px]">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <span className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg capitalize">{p.category}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className={`text-[15px] font-bold ${p.stock > 5 ? "text-emerald-600" : p.stock > 0 ? "text-amber-500" : "text-rose-500"}`}>
                                                {p.stock > 0 ? p.stock : "Out"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 text-[17px]">₹{p.price?.toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
