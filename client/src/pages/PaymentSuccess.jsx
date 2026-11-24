import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../redux/cartSlice";
import { HiOutlineCheck, HiOutlineDownload, HiOutlineClipboardList } from "react-icons/hi";
import API from "../services/api";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

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
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(false);

    useEffect(() => {
        if (state.orderId) {
            dispatch(clearCart());
            API.get(`/orders/${state.orderId}`).then(({ data }) => setOrder(data)).catch(() => {});
        }
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

    return (
        <main id="main-content" className="bg-white dark:bg-night">
            <section className="bg-sign text-ink border-b-2 border-ink">
                <div className="page-wrap py-14 sm:py-20">
                    <span className="inline-flex items-center justify-center w-16 h-16 bg-ink text-sign border-2 border-ink mb-6" aria-hidden="true">
                        <HiOutlineCheck className="w-10 h-10" />
                    </span>
                    <h1 className="display text-[48px] sm:text-[84px]">Paid. Packing it now.</h1>
                    <p className="mt-5 max-w-xl text-[17px] sm:text-[19px] font-medium">
                        Your order is confirmed. We will email you when it leaves the shop.
                    </p>
                </div>
            </section>

            <div className="page-wrap py-12 sm:py-16 flex flex-col gap-8 max-w-3xl">
                {invoice && (
                    <div className="border-2 border-ink dark:border-slate-600 p-6 inline-block self-start">
                        <p className="text-[13px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Invoice number</p>
                        <p className="text-[26px] font-black tabular-nums text-slate-900 dark:text-white">{invoice}</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/orders" className="btn-primary text-[16px]">
                        <HiOutlineClipboardList className="w-5 h-5" aria-hidden="true" />
                        Track my order
                    </Link>
                    {order && (
                        <button type="button" onClick={handleDownload} disabled={downloading} className="btn-outline text-[16px]">
                            <HiOutlineDownload className="w-5 h-5" aria-hidden="true" />
                            {downloading ? "Preparing PDF..." : "Download invoice"}
                        </button>
                    )}
                </div>
                {downloadError && (
                    <p role="alert" className="text-[15px] font-semibold text-rose-600 dark:text-rose-400">The invoice could not be generated. It is also attached to your confirmation email.</p>
                )}

                <p className="text-[15px] text-slate-600 dark:text-slate-400">
                    A confirmation email with your invoice is on its way.{" "}
                    <Link to="/" className="font-bold text-primary dark:text-sign underline underline-offset-4">Keep shopping</Link>
                </p>
            </div>
        </main>
    );
}
