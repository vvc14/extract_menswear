import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineCheckCircle } from "react-icons/hi";

export default function PaymentSuccess() {
    return (
        <main id="main-content" className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center max-w-lg">
                <div className="w-24 h-24 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
                    <HiOutlineCheckCircle className="w-14 h-14 text-emerald-500" />
                </div>
                <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight text-slate-900 mb-3">Payment Successful</h1>
                <p className="text-[18px] text-slate-500 mb-10 leading-relaxed">
                    Thank you for your purchase! Your order has been confirmed and will be shipped shortly. You'll receive a confirmation email soon.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-primary text-white text-[17px] font-bold px-12 py-5 rounded-xl hover:bg-primary-dark transition-colors"
                >
                    Continue Shopping
                </Link>
                <p className="text-[14px] text-slate-400 mt-8">Order details have been sent to your email.</p>
            </motion.div>
        </main>
    );
}
