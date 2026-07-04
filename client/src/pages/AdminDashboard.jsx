import { useState, useEffect } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import { ADMIN_PATH } from "../config/adminPath";
import { motion } from "framer-motion";
import {
    HiOutlineCollection, HiOutlineUsers, HiOutlineTrendingUp,
    HiOutlineArrowRight, HiOutlineClipboardList
} from "react-icons/hi";

const STATUS_BADGES = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-100 border",
    shipped: "bg-blue-50 text-blue-700 border-blue-100 border",
    delivered: "bg-indigo-50 text-indigo-700 border-indigo-100 border",
    "return-requested": "bg-amber-50 text-amber-700 border-amber-100 border",
    "exchange-requested": "bg-orange-50 text-orange-700 border-orange-100 border",
    returned: "bg-slate-100 text-slate-600 border-slate-200 border",
    exchanged: "bg-slate-100 text-slate-600 border-slate-200 border",
    cancelled: "bg-rose-50 text-rose-700 border-rose-100 border",
    failed: "bg-rose-50 text-rose-700 border-rose-100 border",
};

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        shirts: 0,
        trousers: 0,
        recentProducts: [],
    });
    const [ordersStats, setOrdersStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: [],
    });
    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [productsRes, usersRes, ordersRes] = await Promise.all([
                    API.get("/products"),
                    API.get("/admin/users").catch(() => ({ data: [] })),
                    API.get("/orders/admin").catch(() => ({ data: [] })),
                ]);
                
                const products = productsRes.data;
                const users = usersRes.data;
                const orders = ordersRes.data;

                setStats({
                    totalProducts: products.length,
                    shirts: products.filter((p) => p.category === "shirt").length,
                    trousers: products.filter((p) => p.category === "trouser").length,
                    recentProducts: products.slice(0, 5),
                });
                
                const activeOrders = orders.filter((o) => !["failed", "cancelled", "returned", "created"].includes(o.status));
                const revenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0) + (o.shipping || 0), 0);

                setOrdersStats({
                    totalOrders: orders.filter(o => o.status !== "created").length,
                    totalRevenue: revenue,
                    recentOrders: orders.filter(o => o.status !== "created").slice(0, 5),
                });
                setUserCount(users.length || 0);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: "Total Revenue", value: `₹${ordersStats.totalRevenue.toLocaleString("en-IN")}`, icon: HiOutlineTrendingUp, grad: "from-emerald-500 to-teal-500", link: `/${ADMIN_PATH}/orders` },
        { label: "Total Orders", value: ordersStats.totalOrders, icon: HiOutlineClipboardList, grad: "from-primary to-blue-600", link: `/${ADMIN_PATH}/orders` },
        { label: "Total Products", value: stats.totalProducts, icon: HiOutlineCollection, grad: "from-amber-500 to-orange-500", link: `/${ADMIN_PATH}/products` },
        { label: "Registered Users", value: userCount, icon: HiOutlineUsers, grad: "from-violet-500 to-purple-600", link: `/${ADMIN_PATH}/users` },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

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
                        <p className="text-[36px] sm:text-[40px] font-extrabold text-slate-900 leading-none">{card.value}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Recent Orders */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2 className="text-[20px] font-bold text-slate-900">Recent Orders</h2>
                        <Link to={`/${ADMIN_PATH}/orders`} className="text-[14px] font-semibold text-primary hover:underline flex items-center gap-1">
                            Manage <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden overflow-x-auto">
                        <table className="w-full text-[14px]">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                                    <th className="text-left px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="text-center px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersStats.recentOrders.map((o) => (
                                    <tr key={o._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-900">{o.invoiceNumber || "—"}</td>
                                        <td className="px-5 py-3 text-slate-600">{o.userName || "—"}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[o.status] || "bg-slate-100"}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-slate-900">₹{((o.totalAmount || 0) + (o.shipping || 0)).toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                                {ordersStats.recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center text-slate-400">No orders yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recently Added Products */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2 className="text-[20px] font-bold text-slate-900">Recently Added Products</h2>
                        <Link to={`/${ADMIN_PATH}/products`} className="text-[14px] font-semibold text-primary hover:underline flex items-center gap-1">
                            Manage <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden overflow-x-auto">
                        <table className="w-full text-[14px]">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                                    <th className="text-left px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                    <th className="text-right px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentProducts.map((p) => (
                                    <tr key={p._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-10 bg-slate-100 rounded overflow-hidden shrink-0">
                                                    <img src={p.images && p.images.length > 0 ? p.images[0] : p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-semibold text-slate-900 truncate max-w-[150px]">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded capitalize">{p.category}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-slate-900">₹{p.price?.toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                                {stats.recentProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-12 text-center text-slate-400">No products yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
