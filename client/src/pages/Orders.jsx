import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineClipboardList, HiOutlineDownload, HiOutlineRefresh, HiOutlineReply, HiOutlineX, HiOutlineShoppingCart, HiOutlineArrowLeft } from "react-icons/hi";
import API from "../services/api";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

const STATUS_STYLES = {
    paid: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Paid" },
    shipped: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Shipped" },
    delivered: { bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "Delivered" },
    "return-requested": { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Return Requested" },
    "exchange-requested": { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "Exchange Requested" },
    returned: { bg: "bg-slate-100 dark:bg-slate-700/40", text: "text-slate-600 dark:text-slate-400", label: "Returned" },
    exchanged: { bg: "bg-slate-100 dark:bg-slate-700/40", text: "text-slate-600 dark:text-slate-400", label: "Exchanged" },
    cancelled: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", label: "Cancelled" },
};

export default function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // { type: "return"|"exchange", orderId }
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState("");

    useEffect(() => {
        API.get("/orders")
            .then(({ data }) => setOrders(data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const canRequestAction = (order) => {
        if (order.status !== "delivered") return false;
        const days = Math.floor((Date.now() - new Date(order.paidAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return days <= 7;
    };

    const canCancel = (order) => {
        return order.status === "paid";
    };

    const handleCancelOrder = async (orderId) => {
        const reason = window.prompt("Please enter a reason for cancellation (optional):");
        if (reason === null) return;
        setSubmitting(true);
        try {
            await API.post(`/orders/${orderId}/cancel`, { reason });
            setOrders((prev) =>
                prev.map((o) =>
                    o._id === orderId ? { ...o, status: "cancelled", cancelReason: reason || "Customer request" } : o
                )
            );
            setToast("Order cancelled successfully!");
            setTimeout(() => setToast(""), 4000);
        } catch (err) {
            setToast(err.response?.data?.message || "Cancellation failed. Please try again.");
            setTimeout(() => setToast(""), 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!modal || !reason.trim()) return;
        setSubmitting(true);
        try {
            await API.post(`/orders/${modal.orderId}/${modal.type}`, { reason });
            setOrders((prev) =>
                prev.map((o) =>
                    o._id === modal.orderId ? { ...o, status: `${modal.type}-requested` } : o
                )
            );
            setToast(`${modal.type === "return" ? "Return" : "Exchange"} request submitted successfully!`);
            setModal(null);
            setReason("");
            setTimeout(() => setToast(""), 4000);
        } catch (err) {
            setToast(err.response?.data?.message || "Request failed. Please try again.");
            setTimeout(() => setToast(""), 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async (order) => {
        try {
            await generateInvoicePDF(order);
        } catch (err) {
            console.error("Invoice download error:", err);
        }
    };

    if (loading) {
        return (
            <main id="main-content" className="page-wrap py-16 min-h-[70vh]">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                    <p className="mt-4 text-[15px] text-slate-500 font-semibold">Loading your orders...</p>
                </div>
            </main>
        );
    }

    if (orders.length === 0) {
        return (
            <main id="main-content" className="page-wrap py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8">
                    <div className="w-28 h-28 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <HiOutlineClipboardList className="w-12 h-12 text-slate-400" />
                    </div>
                    <h2 className="text-[30px] font-extrabold text-slate-900 dark:text-white">No orders yet</h2>
                    <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-md text-center leading-[1.7]">
                        Start shopping and your orders will appear here with invoices and tracking.
                    </p>
                    <Link to="/shirts" className="btn-primary">Start Shopping</Link>
                </motion.div>
            </main>
        );
    }

    return (
        <main id="main-content" className="page-wrap py-10 sm:py-16">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" style={{ marginBottom: "32px" }} className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                        <HiOutlineArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <ol className="flex items-center gap-2 text-[15px]">
                        <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                        <li className="text-slate-300 dark:text-slate-600">/</li>
                        <li className="text-slate-900 dark:text-white font-semibold">My Orders</li>
                    </ol>
                </nav>

                <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ marginBottom: "8px" }}>My Orders</h1>
                <p className="text-[16px] text-slate-500 dark:text-slate-400" style={{ marginBottom: "40px" }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {orders.map((order) => {
                        const status = STATUS_STYLES[order.status] || STATUS_STYLES.paid;
                        const orderDate = new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                        });
                        const canAct = canRequestAction(order);

                        return (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                {/* Order header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                            <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Invoice</p>
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">{order.invoiceNumber || "—"}</p>
                                        </div>
                                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                                        <div>
                                            <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Date</p>
                                            <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">{orderDate}</p>
                                        </div>
                                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                                        <div>
                                            <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Total</p>
                                            <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">₹{(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")}</p>
                                        </div>
                                        {order.trackingNumber && (
                                            <>
                                                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                                                <div>
                                                    <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Tracking</p>
                                                    <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
                                                        {order.carrierName}: <span className="font-mono text-[13px]">{order.trackingNumber}</span>
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wide ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Order Tracking Progress Timeline */}
                                {["paid", "shipped", "delivered"].includes(order.status) && (
                                    <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-700/80">
                                        <div className="max-w-md mx-auto relative flex items-center justify-between text-[11px] sm:text-[12px] font-bold text-slate-400 dark:text-slate-500">
                                            {/* Connector line */}
                                            <div className="absolute left-[15%] right-[15%] top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary dark:bg-gold transition-all duration-500" 
                                                    style={{ 
                                                        width: order.status === "delivered" ? "100%" : order.status === "shipped" ? "50%" : "0%" 
                                                    }}
                                                />
                                            </div>

                                            {/* Steps */}
                                            {[
                                                { label: "Placed", key: "paid", active: true },
                                                { label: "Shipped", key: "shipped", active: ["shipped", "delivered"].includes(order.status) },
                                                { label: "Delivered", key: "delivered", active: order.status === "delivered" },
                                            ].map((step, idx) => (
                                                <div key={idx} className="flex flex-col items-center gap-1.5 bg-white dark:bg-slate-900/10 px-2 relative z-10">
                                                    <div 
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                            step.active 
                                                                ? "border-primary dark:border-gold bg-primary dark:bg-gold text-white dark:text-slate-900" 
                                                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                        }`}
                                                    >
                                                        {step.active ? (
                                                            <span className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />
                                                        ) : (
                                                            <span className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                                        )}
                                                    </div>
                                                    <span className={step.active ? "text-primary dark:text-gold" : ""}>{step.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Order items */}
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 px-6 py-4">
                                            <div className="w-[56px] h-[70px] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                                {item.imageUrl ? (
                                                    <img src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <HiOutlineShoppingCart className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                                                <p className="text-[13px] text-slate-500 dark:text-slate-400">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                                            </div>
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white shrink-0">
                                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Order actions */}
                                <div className="flex flex-wrap items-center gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => handleDownload(order)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold hover:opacity-90 transition-opacity"
                                    >
                                        <HiOutlineDownload className="w-4 h-4" />
                                        Download Invoice
                                    </button>
                                    {canAct && (
                                        <>
                                            <button
                                                onClick={() => { setModal({ type: "return", orderId: order._id }); setReason(""); }}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <HiOutlineReply className="w-4 h-4" />
                                                Request Return
                                            </button>
                                            <button
                                                onClick={() => { setModal({ type: "exchange", orderId: order._id }); setReason(""); }}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <HiOutlineRefresh className="w-4 h-4" />
                                                Request Exchange
                                            </button>
                                        </>
                                    )}
                                    {canCancel(order) && (
                                        <button
                                            onClick={() => handleCancelOrder(order._id)}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-[13px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                        >
                                            <HiOutlineX className="w-4 h-4" />
                                            Cancel Order
                                        </button>
                                    )}
                                    {!canAct && ["return-requested", "exchange-requested"].includes(order.status) && (
                                        <p className="text-[13px] text-amber-600 dark:text-amber-400 font-semibold">Your request is being processed</p>
                                    )}
                                    {order.status === "cancelled" && (
                                        <p className="text-[13px] text-rose-500 font-semibold">This order has been cancelled</p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-xl text-[14px] font-semibold shadow-2xl z-50"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Return/Exchange Modal */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-7"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white">
                                    Request {modal.type === "return" ? "Return" : "Exchange"}
                                </h3>
                                <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <HiOutlineX className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                                {modal.type === "return"
                                    ? "Please tell us why you'd like to return this order. Refund will be processed within 5-7 business days."
                                    : "Please tell us why you'd like to exchange this order and we'll arrange a replacement."}
                            </p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={modal.type === "return" ? "e.g. Size doesn't fit, damaged product..." : "e.g. Wrong size, prefer different color..."}
                                rows={4}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-[14px] text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mb-6"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModal(null)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitRequest}
                                    disabled={!reason.trim() || submitting}
                                    className="flex-1 py-3 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
