import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "../redux/alertSlice";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineX, HiOutlineExclamation } from "react-icons/hi";

export default function ModalAlert() {
    const dispatch = useDispatch();
    const { isOpen, title, message } = useSelector((s) => s.alert);

    const handleClose = () => {
        dispatch(hideAlert());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        transition={{ type: "spring", duration: 0.45 }}
                        className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-2xl p-7 text-center overflow-hidden"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            aria-label="Close dialog"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>

                        {/* Gold Header line */}
                        <div className="flex flex-col items-center gap-3 mt-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-200/40">
                                <HiOutlineExclamation className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-[14px] font-extrabold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                                {title}
                            </h2>
                        </div>

                        {/* Message */}
                        <p className="text-[15px] sm:text-[16px] text-slate-700 dark:text-slate-300 leading-relaxed mb-8 px-2 font-medium">
                            {message}
                        </p>

                        {/* Confirm Button */}
                        <button
                            onClick={handleClose}
                            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white dark:text-white text-[14px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] cursor-pointer"
                        >
                            Continue
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
