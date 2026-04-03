import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toggleWishlist } from "../redux/wishlistSlice";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineShoppingCart, HiStar, HiOutlineHeart, HiHeart, HiOutlineEye } from "react-icons/hi";
import { useState } from "react";

export default function ProductCard({ product }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [added, setAdded] = useState(false);
    const user = useSelector((s) => s.auth.user);
    const wishlistItems = useSelector((s) => s.wishlist.items);
    const isWishlisted = wishlistItems.some((i) => i._id === product._id);

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart(product));
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
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

    const discount = product.discount || 0;
    const originalPrice = product.originalPrice || 0;
    const rating = 4.0;

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="group relative bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 card-hover"
        >
            <Link to={`/product/${product._id}`} className="block" aria-label={`View ${product.name}`}>

                {/* ── Image ── */}
                <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900" style={{ aspectRatio: "3/4" }}>
                    <img
                        src={product.imageUrl}
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
                    {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute bottom-3 left-3 z-10">
                            <span className="text-[10px] font-bold text-white backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                                style={{ background: "rgba(244,63,94,0.88)" }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Only {product.stock} left
                            </span>
                        </div>
                    )}

                    {/* Quick actions */}
                    <div className="absolute bottom-4 right-4 z-10 flex gap-2.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                            className={`w-9 h-9 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors shadow-lg ${
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
                            className="w-9 h-9 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-lg"
                            aria-label="Quick view"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <HiOutlineEye className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="p-5 sm:p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#c9a84c" }}>
                        {product.category === "shirt" ? "Shirt" : "Trouser"}
                    </p>
                    <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-3 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <HiStar key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "" : "text-slate-200 dark:text-slate-600"}`}
                                    style={i < Math.floor(rating) ? { color: "#c9a84c" } : {}} />
                            ))}
                        </div>
                        <span className="text-[12px] font-semibold text-slate-400">({rating})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2.5">
                        <span className="text-[20px] sm:text-[22px] font-extrabold text-slate-900 dark:text-white">
                            ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {originalPrice > 0 && (
                            <span className="text-[13px] text-slate-400 line-through">
                                ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* ── Add to Cart ── */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <button
                    onClick={handleAdd}
                    aria-label={`Add ${product.name} to cart`}
                    className={`w-full flex items-center justify-center gap-2.5 text-[14px] font-bold py-3.5 rounded-xl transition-all duration-300 ${added
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
                        <>✓ Added to Cart</>
                    ) : (
                        <>
                            <HiOutlineShoppingCart className="w-4 h-4" />
                            Add to Cart
                        </>
                    )}
                </button>
            </div>
        </motion.article>
    );
}
