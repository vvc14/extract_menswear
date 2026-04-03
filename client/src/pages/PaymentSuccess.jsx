import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineCheckCircle, HiOutlineDownload, HiOutlineClipboardList } from "react-icons/hi";
import API from "../services/api";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

export default function PaymentSuccess() {
    const { state } = useLocation();
    const [order, setOrder] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (state?.orderId) {
            API.get(`/orders/${state.orderId}`).then(({ data }) => setOrder(data)).catch(() => {});
        }
    }, [state]);

    const handleDownload = async () => {
        if (!order) return;
        setDownloading(true);
        try {
            await generateInvoicePDF(order);
        } catch (err) {
            console.error("Invoice download error:", err);
        }
        setTimeout(() => setDownloading(false), 1000);
    };

    return (
        <main id="main-content" className="min-h-[80vh] flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #f8fafc 60%)" }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center max-w-lg w-full" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>
                
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center"
                    >
                        <HiOutlineCheckCircle className="w-14 h-14 text-emerald-500" />
                    </motion.div>
                    <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight text-slate-900">Payment Successful</h1>
                    <p className="text-[18px] text-slate-500 leading-relaxed px-2">
                        Thank you for your purchase! Your order has been confirmed and will be shipped shortly.
                    </p>
                </div>

                {(state?.invoiceNumber || order?.invoiceNumber) && (
                    <div className="bg-white border border-slate-200 rounded-xl px-10 py-6 mx-auto shadow-sm">
                        <p className="text-[13px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Invoice No.</p>
                        <p className="text-[22px] font-extrabold text-slate-900 tracking-wide">{state?.invoiceNumber || order?.invoiceNumber}</p>
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "32px", width: "100%", padding: "0 16px" }}>
                    {order && (
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-[15px] font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60 w-full sm:w-auto"
                        >
                            <HiOutlineDownload className="w-5 h-5" />
                            {downloading ? "Generating..." : "Download Invoice"}
                        </button>
                    )}
                    <Link
                        to="/orders"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white text-[15px] font-bold px-8 py-4 rounded-xl hover:bg-primary-dark transition-colors w-full sm:w-auto shadow-md"
                    >
                        <HiOutlineClipboardList className="w-5 h-5" />
                        View My Orders
                    </Link>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-500 hover:text-primary transition-colors"
                    >
                        ← Continue Shopping
                    </Link>
                    <p className="text-[13px] text-slate-400">A confirmation email with your invoice has been sent to your email address.</p>
                </div>
            </motion.div>
        </main>
    );
}
