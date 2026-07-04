import { useState, useEffect } from "react";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineClipboardList, HiOutlineRefresh, HiOutlineReply, HiOutlineTruck,
    HiOutlineCheck, HiOutlineX, HiOutlineChevronDown, HiOutlineSearch,
    HiOutlineExclamation, HiOutlineShoppingCart
} from "react-icons/hi";

const STATUS_CONFIG = {
    paid: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Paid" },
    shipped: { bg: "bg-blue-50", text: "text-blue-700", label: "Shipped" },
    delivered: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Delivered" },
    "return-requested": { bg: "bg-amber-50", text: "text-amber-700", label: "Return Req." },
    "exchange-requested": { bg: "bg-orange-50", text: "text-orange-700", label: "Exchange Req." },
    returned: { bg: "bg-slate-100", text: "text-slate-600", label: "Returned" },
    exchanged: { bg: "bg-slate-100", text: "text-slate-600", label: "Exchanged" },
    failed: { bg: "bg-rose-50", text: "text-rose-700", label: "Failed" },
    cancelled: { bg: "bg-rose-50", text: "text-rose-700", label: "Cancelled" },
};

const FILTERS = [
    { key: "all", label: "All" },
    { key: "paid", label: "Paid" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "returns", label: "Returns" },
    { key: "exchanges", label: "Exchanges" },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState("");

    // Shipping details modal state
    const [shippingModal, setShippingModal] = useState(null); // { orderId }
    const [carrierName, setCarrierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");

    const fetchOrders = async () => {
        try {
            const { data } = await API.get("/orders/admin");
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const filtered = orders.filter((o) => {
        const matchSearch =
            (o.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
            (o.userName || "").toLowerCase().includes(search.toLowerCase()) ||
            (o.userEmail || "").toLowerCase().includes(search.toLowerCase());
        if (filter === "all") return matchSearch;
        if (filter === "returns") return matchSearch && ["return-requested", "returned"].includes(o.status);
        if (filter === "exchanges") return matchSearch && ["exchange-requested", "exchanged"].includes(o.status);
        return matchSearch && o.status === filter;
    });

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            await API.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
            setToast(`Order updated to "${newStatus}"`);
            setTimeout(() => setToast(""), 3000);
        } catch (err) {
            setToast(err.response?.data?.message || "Update failed");
            setTimeout(() => setToast(""), 3000);
        } finally {
            setUpdating(null);
        }
    };

    const handleShipOrderSubmit = async (e) => {
        e.preventDefault();
        if (!shippingModal) return;
        
        const { orderId } = shippingModal;
        setUpdating(orderId);
        try {
            await API.put(`/orders/${orderId}/status`, { 
                status: "shipped", 
                carrierName, 
                trackingNumber 
            });
            setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: "shipped", carrierName, trackingNumber } : o));
            setToast(`Order updated to "shipped"`);
            setTimeout(() => setToast(""), 3000);
            setShippingModal(null);
            setCarrierName("");
            setTrackingNumber("");
        } catch (err) {
            setToast(err.response?.data?.message || "Shipping update failed");
            setTimeout(() => setToast(""), 3000);
        } finally {
            setUpdating(null);
        }
    };

    const getNextActions = (status) => {
        switch (status) {
            case "paid": return [{ label: "Mark Shipped", value: "shipped", icon: HiOutlineTruck }];
            case "shipped": return [{ label: "Mark Delivered", value: "delivered", icon: HiOutlineCheck }];
            case "return-requested": return [
                { label: "Approve Return", value: "returned", icon: HiOutlineCheck },
                { label: "Reject", value: "delivered", icon: HiOutlineX },
            ];
            case "exchange-requested": return [
                { label: "Approve Exchange", value: "exchanged", icon: HiOutlineCheck },
                { label: "Reject", value: "delivered", icon: HiOutlineX },
            ];
            default: return [];
        }
    };

    // Stats
    const totalOrders = orders.length;
    const pendingReturns = orders.filter((o) => o.status === "return-requested").length;
    const pendingExchanges = orders.filter((o) => o.status === "exchange-requested").length;
    const totalRevenue = orders.filter((o) => !["failed", "returned"].includes(o.status)).reduce((s, o) => s + (o.totalAmount || 0) + (o.shipping || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "8px" }}>Orders</h1>
                <p style={{ fontSize: "16px", color: "#64748b" }}>{totalOrders} total order{totalOrders !== 1 ? "s" : ""}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {[
                    { label: "Total Orders", value: totalOrders, grad: "from-primary to-blue-600", icon: HiOutlineClipboardList },
                    { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, grad: "from-emerald-500 to-teal-500", icon: HiOutlineShoppingCart },
                    { label: "Pending Returns", value: pendingReturns, grad: "from-amber-500 to-orange-500", icon: HiOutlineReply, alert: pendingReturns > 0 },
                    { label: "Pending Exchanges", value: pendingExchanges, grad: "from-violet-500 to-purple-600", icon: HiOutlineRefresh, alert: pendingExchanges > 0 },
                ].map((c) => (
                    <div key={c.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 relative">
                        {c.alert && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />}
                        <div className={`w-10 h-10 bg-gradient-to-br ${c.grad} rounded-xl flex items-center justify-center mb-4`}>
                            <c.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
                        <p className="text-[28px] font-extrabold text-slate-900 leading-none">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div style={{ display: "flex", flexDirection: "row", gap: "16px", marginBottom: "32px" }}>
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text" placeholder="Search by invoice, name, or email..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "100%", background: "#fff", border: "1px solid #e2e8f0", paddingLeft: "44px", paddingRight: "16px", paddingTop: "12px", paddingBottom: "12px", fontSize: "15px", color: "#0f172a", borderRadius: "12px", outline: "none" }}
                    />
                </div>
                <div style={{ display: "flex", gap: "6px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px" }}>
                    {FILTERS.map((f) => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 text-[13px] font-bold rounded-lg whitespace-nowrap transition-all ${filter === f.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                            {f.label}
                            {f.key === "returns" && pendingReturns > 0 && <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingReturns}</span>}
                            {f.key === "exchanges" && pendingExchanges > 0 && <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingExchanges}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden overflow-x-auto" style={{ marginTop: "8px" }}>
                <table className="w-full text-[15px] min-w-[850px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                            <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Customer</th>
                            <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                            <th className="text-right px-5 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                            <th className="text-center px-5 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-right px-5 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider" style={{ width: 180 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((order) => {
                            const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.paid;
                            const actions = getNextActions(order.status);
                            const isExpanded = expandedId === order._id;
                            const hasReason = order.returnReason || order.exchangeReason || order.cancelReason;
                            const isActionable = ["return-requested", "exchange-requested"].includes(order.status);

                            return (
                                <tr key={order._id} className={`border-b border-slate-50 last:border-0 transition-colors ${isActionable ? "bg-amber-50/30" : "hover:bg-slate-50/60"}`}>
                                    <td className="px-5 py-4">
                                        <button onClick={() => setExpandedId(isExpanded ? null : order._id)} className="text-left group">
                                            <p className="text-[14px] font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                {order.invoiceNumber || "—"}
                                                <HiOutlineChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                            </p>
                                            <p className="text-[12px] text-slate-400 md:hidden">{order.userName || "—"}</p>
                                        </button>
                                        {/* Expanded detail */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                                        {order.items.map((item, i) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <div className="w-9 h-11 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/50">
                                                                    {item.imageUrl ? <img src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <HiOutlineShoppingCart className="w-4 h-4 text-slate-300 m-auto mt-3" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[13px] font-semibold text-slate-800 truncate">{item.name}</p>
                                                                    <p className="text-[11px] text-slate-400">Qty: {item.quantity} × ₹{item.price?.toLocaleString("en-IN")}</p>
                                                                </div>
                                                                <p className="text-[13px] font-bold text-slate-700 shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                                                            </div>
                                                        ))}
                                                        {order.shippingAddress && order.shippingAddress.street && (
                                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80 mt-3 text-[13px] text-slate-600 dark:text-slate-400">
                                                                <p className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
                                                                    <HiOutlineTruck className="w-4 h-4 text-primary dark:text-gold" /> Delivery Details
                                                                </p>
                                                                <p>
                                                                    <strong>Recipient:</strong> {order.shippingAddress.name} ({order.shippingAddress.phone})
                                                                </p>
                                                                <p>
                                                                    <strong>Address:</strong> {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}, {order.shippingAddress.country}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {hasReason && (
                                                            <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                                                                <HiOutlineExclamation className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                                                                        {order.returnReason ? "Return Reason" : order.exchangeReason ? "Exchange Reason" : "Cancellation Reason"}
                                                                    </p>
                                                                    <p className="text-[13px] text-amber-800">{order.returnReason || order.exchangeReason || order.cancelReason}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <p className="text-[14px] font-semibold text-slate-900">{order.userName || "—"}</p>
                                        <p className="text-[12px] text-slate-400 truncate max-w-[180px]">{order.userEmail || "—"}</p>
                                    </td>
                                    <td className="px-5 py-4 hidden lg:table-cell text-[14px] text-slate-500">
                                        {new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="font-bold text-slate-900 text-[15px]">₹{((order.totalAmount || 0) + (order.shipping || 0)).toLocaleString("en-IN")}</span>
                                        {(order.shipping || 0) > 0 && <p className="text-[11px] text-slate-400">+₹{order.shipping} ship</p>}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide ${st.bg} ${st.text}`}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                            {actions.map((a) => (
                                                <button
                                                    key={a.value}
                                                    onClick={() => {
                                                        if (a.value === "shipped") {
                                                            setShippingModal({ orderId: order._id });
                                                        } else {
                                                            handleStatusUpdate(order._id, a.value);
                                                        }
                                                    }}
                                                    disabled={updating === order._id}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 ${
                                                        a.value === "delivered" && a.label === "Reject"
                                                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                                    }`}
                                                >
                                                    <a.icon className="w-3.5 h-3.5" />
                                                    {updating === order._id ? "..." : a.label}
                                                </button>
                                            ))}
                                            {actions.length === 0 && <span className="text-[12px] text-slate-400">—</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <HiOutlineClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-[16px] font-semibold text-slate-900 mb-1">{search ? "No matching orders" : "No orders yet"}</p>
                                    <p className="text-[14px] text-slate-400">{search ? "Try a different search term." : "Orders will appear here once customers make purchases."}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-xl text-[14px] font-semibold shadow-2xl z-50"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Shipping Details Modal */}
            <AnimatePresence>
                {shippingModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white mb-2">Ship Order</h3>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-4">
                                Enter the carrier and tracking details below to notify the customer.
                            </p>
                            <form onSubmit={handleShipOrderSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Carrier Name
                                    </label>
                                    <input
                                        type="text"
                                        value={carrierName}
                                        onChange={(e) => setCarrierName(e.target.value)}
                                        placeholder="e.g. BlueDart, Delhivery, DTDC"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/45"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Tracking Number
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="e.g. 1234567890"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/45"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShippingModal(null);
                                            setCarrierName("");
                                            setTrackingNumber("");
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/95 transition-colors disabled:opacity-50"
                                    >
                                        Confirm Shipment
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
