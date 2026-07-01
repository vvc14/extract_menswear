import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineHome, HiOutlineArrowLeft, HiOutlineSearch } from "react-icons/hi";

export default function NotFound() {

    return (
        <main id="main-content" className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl mx-auto w-full"
            >
                {/* Character Illustration at the top */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8 flex justify-center relative"
                >
                    {/* Decorative floating elements */}
                    <motion.div
                        animate={{ y: [-6, 6, -6] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-4 -left-4 sm:left-10 w-4 h-4 rounded-full bg-primary/20 dark:bg-gold/20 hidden sm:block"
                    />
                    <motion.div
                        animate={{ y: [6, -6, 6] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-10 -right-4 sm:right-10 w-6 h-6 rounded-full bg-indigo-200/40 dark:bg-indigo-500/20 hidden sm:block"
                    />
                    
                    <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-slate-100/50 dark:bg-slate-800/50 p-2 border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-primary/5 dark:shadow-gold/5 overflow-hidden">
                        <img 
                            src="/404-illustration.png" 
                            alt="Stylish confused character looking for a page" 
                            className="w-full h-full object-cover rounded-full"
                        />
                    </div>
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-[32px] sm:text-[42px] font-black tracking-tight mb-4 flex items-center justify-center gap-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 dark:from-white dark:to-gold">
                            404
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 font-light">|</span>
                        <span className="text-slate-900 dark:text-white">Page Not Found</span>
                    </h1>
                    <p className="text-[16px] text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-md mx-auto">
                        Looks like this page went out of style. The page you're looking for doesn't exist or has been moved.
                    </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
                >
                    <Link
                        to="/"
                        className="btn-primary inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-[15px] w-full sm:w-auto"
                    >
                        <HiOutlineHome className="w-5 h-5" />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer w-full sm:w-auto"
                    >
                        <HiOutlineArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </motion.div>

                {/* Quick links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="pt-6 border-t border-slate-200 dark:border-slate-700 max-w-3xl mx-auto"
                >
                    <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                        Popular Destinations
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        {[
                            { to: "/shirts", label: "Shirts" },
                            { to: "/trousers", label: "Trousers" },
                            { to: "/about", label: "About Us" },
                            { to: "/contact", label: "Contact" },
                            { to: "/faq", label: "FAQ" },
                        ].map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="px-4 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-primary dark:hover:text-gold hover:border-primary/30 dark:hover:border-gold/30 transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </main>
    );
}
