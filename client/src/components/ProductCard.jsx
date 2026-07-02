import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toggleWishlist } from "../redux/wishlistSlice";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineShoppingCart, HiStar, HiOutlineHeart, HiHeart, HiOutlineEye } from "react-icons/hi";
import { useState } from "react";

export default function ProductCard({ product, compact = false }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [added, setAdded] = useState(false);
    const user = useSelector((s) => s.auth.user);
    const wishlistItems = useSelector((s) => s.wishlist.items);
    const isWishlisted = wishlistItems.some((i) => i._id === product._id);

    const handleAddClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;

        if (product.category === "shirt") {
            // Shirts require size selection, so redirect directly without adding to cart
            navigate(`/product/${product._id}`);
            return;
        }

        // Immediately add 1 piece to cart
        dispatch(addToCart(product));
        setAdded(true);
        // Navigate to product page after a brief confirmation flash
        setTimeout(() => {
            navigate(`/product/${product._id}`);
        }, 600);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
            return;
        }
        dispatch(toggleWishlist(product));
    };

    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/product/${product._id}`);
    };

    const discount = product.discount || 0;
    const originalPrice = product.originalPrice || 0;
    const rating = product.ratings || 0;

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`group relative bg-white dark:bg-slate-800/60 overflow-hidden border border-slate-200 dark:border-slate-700 card-hover flex flex-col h-full ${
                compact ? "rounded-xl" : "rounded-2xl"
            }`}
        >
            <Link to={`/product/${product._id}`} className="flex flex-col flex-1" aria-label={`View ${product.name}`}>

                {/* ── Image ── */}
                <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900" style={{ aspectRatio: "3/4" }}>
                    <img
                        src={product.images && product.images.length > 0 ? product.images[0] : product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        style={{ scale: "1" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                        onMouseLeave={e => e.currentTarget.style.transform = ""}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                    {/* Badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-col gap-2 z-10">
                        {product.fabric && (
                            <span className="text-[11px] font-bold text-white backdrop-blur-md px-3 py-1.5 rounded-lg"
                                style={{ background: "rgba(26,39,68,0.8)" }}>
                                {product.fabric}
                            </span>
                        )}
                        {product.style && (
                            <span className="text-[11px] font-bold text-white backdrop-blur-md px-3 py-1.5 rounded-lg"
                                style={{ background: "rgba(201,168,76,0.85)" }}>
                                {product.style}
                            </span>
                        )}
                    </div>

                    {/* Discount */}
                    {discount > 0 && (
                        <div className="absolute top-3.5 right-3.5 z-10">
                            <span className="text-[11px] font-extrabold text-white px-3 py-1.5 rounded-lg"
                                style={{ background: "#10b981" }}>
                                {discount}% OFF
                            </span>
                        </div>
                    )}

                    {/* Stock urgency */}
                    {product.stock <= 0 ? (
                        <>
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-[5]" />
                            <div className="absolute bottom-3 left-3 z-10">
                                <span className="text-[11px] font-extrabold text-white backdrop-blur-sm px-3 py-1.5 rounded-lg"
                                    style={{ background: "rgba(100,116,139,0.9)" }}>
                                    Out of Stock
                                </span>
                            </div>
                        </>
                    ) : product.stock <= 5 ? (
                        <div className="absolute bottom-3 left-3 z-10">
                            <span className="text-[10px] font-bold text-white backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                                style={{ background: "rgba(244,63,94,0.88)" }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Only {product.stock} left
                            </span>
                        </div>
                    ) : null}

                    {/* Quick actions */}
                    <div className="absolute bottom-4 right-4 z-10 flex gap-2.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                            className={`w-9 h-9 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors shadow-lg cursor-pointer ${
                                isWishlisted
                                    ? "bg-rose-500/90 text-white"
                                    : "bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-rose-500"
                            }`}
                            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            onClick={handleWishlistToggle}
                        >
                            {isWishlisted ? <HiHeart className="w-4 h-4" /> : <HiOutlineHeart className="w-4 h-4" />}
                        </button>
                        <button
                            className="w-9 h-9 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-gold transition-colors shadow-lg cursor-pointer"
                            aria-label="Quick view"
                            onClick={handleQuickView}
                        >
                            <HiOutlineEye className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className={`${compact ? "p-3 sm:p-4" : "p-3.5 sm:p-6"} flex-1 flex flex-col`}>
                    <p className={`${compact ? "text-[9px]" : "text-[10px] sm:text-[11px]"} font-bold uppercase tracking-[0.12em] mb-1 sm:mb-1.5`} style={{ color: "var(--gold)" }}>
                        {product.category === "shirt" ? "Shirt" : "Trouser"}
                    </p>
                    <h3 className={`${compact ? "text-[12px] sm:text-[14px]" : "text-[13px] sm:text-[16px]"} font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300`}>
                        {product.name}
                    </h3>

                    <div className="mt-auto">
                        {/* Rating */}
                        {!compact && (
                            <div className="flex items-center gap-1.5 mb-2 sm:mb-4">
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <HiStar key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.floor(rating) ? "" : "text-slate-200 dark:text-slate-600"}`}
                                            style={i < Math.floor(rating) ? { color: "var(--gold)" } : {}} />
                                    ))}
                                </div>
                                <span className="text-[10px] sm:text-[12px] font-semibold text-slate-400">({rating})</span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5">
                            <span className={`${compact ? "text-[15px] sm:text-[18px]" : "text-[16px] sm:text-[22px]"} font-extrabold text-slate-900 dark:text-white`}>
                                ₹{product.price.toLocaleString("en-IN")}
                            </span>
                            {originalPrice > 0 && (
                                <span className={`${compact ? "text-[10px]" : "text-[11px] sm:text-[13px]"} text-slate-400 line-through`}>
                                    ₹{originalPrice.toLocaleString("en-IN")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {/* ── Add to Cart ── */}
            <div className={`${compact ? "px-3 sm:px-4 pb-3 sm:pb-4" : "px-3.5 sm:px-6 pb-3.5 sm:pb-6"}`}>
                {product.stock <= 0 ? (
                    <div
                        className={`w-full flex items-center justify-center gap-2 font-bold rounded-xl text-slate-400 dark:text-slate-500 cursor-not-allowed ${
                            compact ? "text-[12px] py-2" : "text-[13px] sm:text-[14px] py-2.5 sm:py-3.5"
                        }`}
                        style={{ background: "#f1f5f9" }}
                    >
                        Out of Stock
                    </div>
                ) : (
                    <button
                        onClick={handleAddClick}
                        aria-label={`Add ${product.name} to cart`}
                        className={`w-full flex items-center justify-center gap-1.5 sm:gap-2.5 font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                            compact ? "text-[12px] py-2" : "text-[13px] sm:text-[14px] py-2.5 sm:py-3.5"
                        } ${added
                            ? "text-white scale-[0.99]"
                            : "text-white hover:opacity-90 active:scale-[0.98]"
                            }`}
                        style={{
                            background: added
                                ? "#10b981"
                                : "linear-gradient(135deg,#1a2744 0%,#2a3f6e 100%)"
                        }}
                    >
                        {added ? (
                            <>{compact ? "✓ Added" : "✓ Added — Opening..."}</>
                        ) : (
                            <>
                                <HiOutlineShoppingCart className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                                Buy Now
                            </>
                        )}
                    </button>
                )}
            </div>
        </motion.article>
    );
}
