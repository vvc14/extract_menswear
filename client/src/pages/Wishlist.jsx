import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist, clearWishlist } from "../redux/wishlistSlice";
import { addToCart } from "../redux/cartSlice";
import { Link } from "react-router-dom";
import { HiOutlineHeart, HiOutlineTrash, HiOutlineShoppingCart, HiStar } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Wishlist() {
    const items = useSelector((s) => s.wishlist.items);
    const dispatch = useDispatch();
    const [addedIds, setAddedIds] = useState(new Set());

    const handleAddToCart = (item) => {
        dispatch(addToCart(item));
        setAddedIds((prev) => new Set(prev).add(item._id));
        setTimeout(() => {
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(item._id);
                return next;
            });
        }, 1800);
    };

    const handleMoveAllToCart = () => {
        items.forEach((item) => dispatch(addToCart(item)));
        dispatch(clearWishlist());
    };

    if (items.length === 0) {
        return (
            <main id="main-content" className="page-wrap py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                    <div className="w-28 h-28 mb-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <HiOutlineHeart className="w-12 h-12 text-slate-400" />
                    </div>
                    <h2 className="text-[30px] font-extrabold text-slate-900 dark:text-white mb-5">Your wishlist is empty</h2>
                    <p className="text-[16px] text-slate-500 dark:text-slate-400 mb-12 max-w-md text-center leading-[1.7]">
                        Save the items you love by tapping the heart icon. They'll appear here so you can easily find them later.
                    </p>
                    <Link to="/shirts" className="btn-primary">
                        Explore Collection
                    </Link>
                </motion.div>
            </main>
        );
    }

    return (
        <main id="main-content" className="page-wrap py-10 sm:py-16">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-8">
                    <ol className="flex items-center gap-2 text-[15px]">
                        <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                        <li className="text-slate-300 dark:text-slate-600">/</li>
                        <li className="text-slate-900 dark:text-white font-semibold">Wishlist</li>
                    </ol>
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">My Wishlist</h1>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleMoveAllToCart}
                            className="flex items-center gap-2 text-[14px] font-bold px-5 py-3 rounded-xl transition-all duration-300 text-white hover:opacity-90"
                            style={{ background: "linear-gradient(135deg,#1a2744 0%,#2a3f6e 100%)" }}
                        >
                            <HiOutlineShoppingCart className="w-4 h-4" />
                            Move All to Cart
                        </button>
                        <button
                            onClick={() => dispatch(clearWishlist())}
                            className="flex items-center gap-2 text-[14px] font-bold px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-400 hover:text-rose-500 transition-colors"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {items.map((item) => {
                            const discount = item.discount || 0;
                            const originalPrice = item.originalPrice || 0;
                            const isAdded = addedIds.has(item._id);

                            return (
                                <motion.article
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3 }}
                                    className="group relative bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                                >
                                    <Link to={`/product/${item._id}`} className="block">
                                        {/* Image */}
                                        <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900" style={{ aspectRatio: "3/4" }}>
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                                            {/* Badges */}
                                            <div className="absolute top-3.5 left-3.5 flex flex-col gap-2 z-10">
                                                {item.fabric && (
                                                    <span className="text-[11px] font-bold text-white backdrop-blur-md px-3 py-1.5 rounded-lg"
                                                        style={{ background: "rgba(26,39,68,0.8)" }}>
                                                        {item.fabric}
                                                    </span>
                                                )}
                                            </div>

                                            {discount > 0 && (
                                                <div className="absolute top-3.5 right-3.5 z-10">
                                                    <span className="text-[11px] font-extrabold text-white px-3 py-1.5 rounded-lg"
                                                        style={{ background: "#10b981" }}>
                                                        {discount}% OFF
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 sm:p-6">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#c9a84c" }}>
                                                {item.category === "shirt" ? "Shirt" : "Trouser"}
                                            </p>
                                            <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-3">
                                                {item.name}
                                            </h3>

                                            {/* Rating */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <HiStar key={i} className={`w-3.5 h-3.5 ${i < 4 ? "" : "text-slate-200 dark:text-slate-600"}`}
                                                            style={i < 4 ? { color: "#c9a84c" } : {}} />
                                                    ))}
                                                </div>
                                                <span className="text-[12px] font-semibold text-slate-400">(4.0)</span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-baseline gap-2.5">
                                                <span className="text-[20px] sm:text-[22px] font-extrabold text-slate-900 dark:text-white">
                                                    ₹{item.price.toLocaleString("en-IN")}
                                                </span>
                                                {originalPrice > 0 && (
                                                    <span className="text-[13px] text-slate-400 line-through">
                                                        ₹{originalPrice.toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Actions */}
                                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            className={`flex-1 flex items-center justify-center gap-2 text-[14px] font-bold py-3.5 rounded-xl transition-all duration-300 ${isAdded
                                                ? "text-white"
                                                : "text-white hover:opacity-90 active:scale-[0.98]"
                                                }`}
                                            style={{
                                                background: isAdded
                                                    ? "#10b981"
                                                    : "linear-gradient(135deg,#1a2744 0%,#2a3f6e 100%)"
                                            }}
                                        >
                                            {isAdded ? (
                                                <>✓ Added</>
                                            ) : (
                                                <>
                                                    <HiOutlineShoppingCart className="w-4 h-4" />
                                                    Add to Cart
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => dispatch(removeFromWishlist(item._id))}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-400 transition-colors shrink-0"
                                            aria-label={`Remove ${item.name} from wishlist`}
                                        >
                                            <HiOutlineTrash className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </motion.div>
        </main>
    );
}
