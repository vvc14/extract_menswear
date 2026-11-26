import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../redux/cartSlice";
import { HiOutlineCheck, HiOutlineDownload, HiOutlineClipboardList } from "react-icons/hi";
import API from "../services/api";
import { generateInvoicePDF } from "../utils/invoiceGenerator";
import Receipt, { ReceiptHead, ReceiptLine, ReceiptRule } from "../components/brand/Receipt";
import { inr } from "../utils/priceBands";

export default function PaymentSuccess() {
    const location = useLocation();
    const dispatch = useDispatch();
    // Arrives either from the in-page Checkout (router state) or from the bank redirect (query string)
    const query = new URLSearchParams(location.search);
    const state = {
        orderId: location.state?.orderId || query.get("orderId"),
        invoiceNumber: location.state?.invoiceNumber || query.get("invoice"),
    };
    const [order, setOrder] = useState(null);
    const [orderStatus, setOrderStatus] = useState(state.orderId ? "loading" : "none"); // loading | ready | error | none
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(false);

    useEffect(() => {
        if (!state.orderId) return;
        dispatch(clearCart());
        API.get(`/orders/${state.orderId}`)
            .then(({ data }) => { setOrder(data); setOrderStatus("ready"); })
            .catch(() => setOrderStatus("error"));
    }, [state.orderId, dispatch]);

    const handleDownload = async () => {
        if (!order) return;
        setDownloading(true);
        setDownloadError(false);
        try {
            await generateInvoicePDF(order);
        } catch (err) {
            console.error("Invoice download error:", err);
            setDownloadError(true);
        }
        setTimeout(() => setDownloading(false), 1000);
    };

    const invoice = state?.invoiceNumber || order?.invoiceNumber;
    const items = order?.items || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    const paidOn = order ? new Date(order.paidAt || order.createdAt) : null;

    return (
        <main id="main-content" className="bg-sign text-ink">
            <div className="page-wrap py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-6 lg:sticky lg:top-36">
                    <span className="inline-flex items-center justify-center w-16 h-16 bg-ink text-sign border-2 border-ink mb-6 -rotate-3" aria-hidden="true">
                        <HiOutlineCheck className="w-10 h-10" />
                    </span>
                    <h1 className="display text-[48px] sm:text-[84px]">Paid. Packing it now.</h1>
                    <p className="mt-5 max-w-xl text-[17px] sm:text-[19px] font-medium">
                        Your order is confirmed. When it leaves the shop, the courier and tracking number appear on your Orders page.
                    </p>

                    <div className="mt-9 flex flex-col sm:flex-row gap-4">
                        <Link to="/orders" className="btn-primary text-[16px]">
                            <HiOutlineClipboardList className="w-5 h-5" aria-hidden="true" />
                            Track my order
                        </Link>
                        {order && (
                            <button type="button" onClick={handleDownload} disabled={downloading} className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 text-[16px] font-extrabold border-2 border-ink bg-white text-ink hover:bg-ink hover:text-sign active:translate-y-px transition-colors disabled:opacity-60" style={{ fontStretch: "110%" }}>
                                <HiOutlineDownload className="w-5 h-5" aria-hidden="true" />
                                {downloading ? "Preparing PDF..." : "Download invoice"}
                            </button>
                        )}
                    </div>
                    {downloadError && (
                        <p role="alert" className="mt-4 text-[15px] font-bold text-hot">The invoice could not be generated here. Try again, or download it from your Orders page.</p>
                    )}
                    <p className="mt-8 text-[15px] font-medium">
                        Your invoice is also on your Orders page.{" "}
                        <Link to="/" className="font-extrabold underline underline-offset-4 hover:no-underline">Keep shopping</Link>
                    </p>
                </div>

                {/* The bill */}
                <div className="lg:col-span-5 lg:col-start-8 w-full max-w-[460px] lg:rotate-1">
                    <Receipt aria-live="polite">
                        <ReceiptHead />
                        <p className="mt-1 text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">GSTIN 36AN2PL8138D1ZP</p>
                        <ReceiptRule />
                        {invoice && <ReceiptLine label="Invoice" value={invoice} />}
                        {paidOn && <ReceiptLine label="Paid on" value={paidOn.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} className="mt-1" />}

                        {orderStatus === "loading" && (
                            <div className="mt-5 space-y-3 animate-pulse" role="status" aria-label="Printing your bill">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 w-full" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 w-4/5" />
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 w-1/2 ml-auto" />
                            </div>
                        )}

                        {orderStatus === "error" && (
                            <p className="mt-5 text-[15px] text-slate-600 dark:text-slate-300">The itemised bill could not load here. It is on your Orders page.</p>
                        )}

                        {orderStatus === "none" && !invoice && (
                            <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-300">Your bill is on your Orders page.</p>
                        )}

                        {orderStatus === "ready" && (
                            <>
                                <ReceiptRule />
                                <ul className="flex flex-col gap-3">
                                    {items.map((it, i) => (
                                        <li key={i} className="flex justify-between gap-4 text-[15px]">
                                            <span className="min-w-0">
                                                <span className="block font-bold leading-snug line-clamp-2">{it.name}</span>
                                                <span className="text-[13px] text-slate-600 dark:text-slate-300">{it.size ? `Size ${it.size} · ` : ""}{it.quantity} × {inr(it.price)}</span>
                                            </span>
                                            <span className="tabular-nums font-bold shrink-0">{inr(it.price * it.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <ReceiptRule />
                                <dl className="flex flex-col gap-2">
                                    <ReceiptLine label="Subtotal" value={inr(subtotal)} />
                                    <ReceiptLine label="Delivery" value={order.shipping ? inr(order.shipping) : "Free"} />
                                    {order.discountAmount > 0 && (
                                        <ReceiptLine label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`- ${inr(order.discountAmount)}`} tone="text-hot" />
                                    )}
                                </dl>
                                <ReceiptRule />
                                {/* server: totalAmount = items - discount, shipping is charged on top */}
                                <dl><ReceiptLine label="Total paid" value={inr((order.totalAmount || 0) + (order.shipping || 0))} strong /></dl>
                            </>
                        )}
                        <p className="mt-5 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Thank you, visit again</p>
                    </Receipt>
                </div>
            </div>
        </main>
    );
}
