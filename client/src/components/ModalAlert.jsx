import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "../redux/alertSlice";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineX, HiOutlineExclamation } from "react-icons/hi";

export default function ModalAlert() {
    const dispatch = useDispatch();
    const { isOpen, title, message } = useSelector((s) => s.alert);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                dispatch(hideAlert());
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, dispatch]);

    const handleClose = () => {
        dispatch(hideAlert());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-[380px] px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="pointer-events-auto relative w-full bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-xl border border-slate-700/50 dark:border-slate-700 shadow-2xl p-4.5 flex gap-3.5 items-start overflow-hidden"
                    >
                        {/* Gold Warning Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <HiOutlineExclamation className="w-5.5 h-5.5 text-amber-500" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-amber-400">
                                {title}
                            </h4>
                            <p className="text-[13.5px] text-slate-200 leading-snug mt-1 font-medium">
                                {message}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer self-start"
                            aria-label="Close notification"
                        >
                            <HiOutlineX className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
