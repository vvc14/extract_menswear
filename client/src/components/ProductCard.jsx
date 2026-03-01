import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineShoppingCart, HiStar, HiOutlineHeart, HiOutlineEye } from "react-icons/hi";
import { useState } from "react";

export default function ProductCard({ product }) {
    const dispatch = useDispatch();
    const [added, setAdded] = useState(false);

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart(product));
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    };

    // Use admin-set discount; fall back to 0 if not set
    const discount = product.discount || 0;
    const originalPrice = product.originalPrice || 0;
    const rating = 4.0;

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
        >
            <Link to={`/product/${product._id}`} className="block" aria-label={`View ${product.name}`}>
                {/* Image container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    {/* Hover overlay — dark fade from bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                    {/* Top badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2 z-10">
                        {product.fabric && (
                            <span className="text-[11px] sm:text-[12px] font-bold text-white bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-lg">
                                {product.fabric}
                            </span>
                        )}
                        {product.style && (
                            <span className="text-[11px] sm:text-[12px] font-bold text-white bg-primary/80 backdrop-blur-md px-3 py-1.5 rounded-lg">
                                {product.style}
                            </span>
                        )}
                    </div>

                    {/* Discount tag — only show if admin set a discount */}
                    {discount > 0 && (
                        <div className="absolute top-3.5 right-3.5 z-10">
                            <span className="text-[11px] sm:text-[12px] font-extrabold text-white bg-emerald px-3 py-1.5 rounded-lg shadow-sm">
                                {discount}% OFF
                            </span>
                        </div>
                    )}

                    {/* Stock urgency */}
                    {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute bottom-3 left-3 z-10">
                            <span className="text-[10px] font-bold text-white bg-rose/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Only {product.stock} left
                            </span>
                        </div>
                    )}

                    {/* Hover action buttons — slide up from bottom */}
                    <div className="absolute bottom-4 right-4 z-10 flex gap-2.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-700 hover:bg-white hover:text-rose transition-colors shadow-lg"
                            aria-label="Add to wishlist"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <HiOutlineHeart className="w-4.5 h-4.5" />
                        </button>
                        <button
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-700 hover:bg-white hover:text-primary transition-colors shadow-lg"
                            aria-label="Quick view"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <HiOutlineEye className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {/* Card body */}
                <div className="p-5 sm:p-7">
                    {/* Category label */}
                    <p className="text-[11px] sm:text-[13px] font-bold text-primary uppercase tracking-[0.12em] mb-2.5">
                        {product.category === "shirt" ? "Shirt" : "Trouser"}
                    </p>

                    {/* Name */}
                    <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-900 leading-snug line-clamp-2 mb-3.5 group-hover:text-primary transition-colors duration-300">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <HiStar key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "text-amber" : "text-slate-200"}`} />
                            ))}
                        </div>
                        <span className="text-[13px] font-semibold text-slate-400">({rating})</span>
                    </div>

                    {/* Price row */}
                    <div className="flex items-baseline gap-2.5 mb-3.5">
                        <span className="text-[22px] sm:text-[24px] font-extrabold text-slate-900">₹{product.price.toLocaleString("en-IN")}</span>
                        {originalPrice > 0 && (
                            <span className="text-[13px] sm:text-[14px] text-slate-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                        )}
                    </div>

                    {/* Free delivery */}
                    <div className="flex items-center gap-2 text-[12px] sm:text-[14px] font-semibold text-emerald">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Free delivery
                    </div>
                </div>
            </Link>

            {/* Add to Cart button */}
            <div className="px-5 sm:px-7 pb-5 sm:pb-7">
                <button
                    onClick={handleAdd}
                    aria-label={`Add ${product.name} to cart`}
                    className={`w-full flex items-center justify-center gap-2.5 text-[15px] font-bold py-5 rounded-2xl transition-all duration-300 ${added
                        ? "bg-emerald text-white scale-[0.98]"
                        : "bg-slate-900 text-white hover:bg-primary active:scale-[0.97]"
                        }`}
                >
                    {added ? (
                        <>✓ Added to Cart</>
                    ) : (
                        <>
                            <HiOutlineShoppingCart className="w-4.5 h-4.5" />
                            Add to Cart
                        </>
                    )}
                </button>
            </div>
        </motion.article>
    );
}
