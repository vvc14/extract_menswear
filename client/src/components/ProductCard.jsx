import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toggleWishlist } from "../redux/wishlistSlice";
import { Link, useNavigate } from "react-router-dom";
import { HiStar, HiOutlineHeart, HiHeart } from "react-icons/hi";
import { useState } from "react";

export default function ProductCard({ product, compact = false, eager = false }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [added, setAdded] = useState(false);
    const user = useSelector((s) => s.auth.user);
    const wishlistItems = useSelector((s) => s.wishlist.items);
    const isWishlisted = wishlistItems.some((i) => i._id === product._id);

    const hasSizes = product.sizes && product.sizes.length > 0;
    const outOfStock = product.stock <= 0;
    const discount = product.discount || 0;
    const originalPrice = product.originalPrice || 0;
    const rating = product.ratings || 0;
    const reviewCount = product.numOfReviews || 0;
    const image = product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;

    const handleAddClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (outOfStock) return;

        if (hasSizes) {
            // Sized products need a size, so the button opens the product page
            navigate(`/product/${product._id}`);
            return;
        }

        dispatch(addToCart(product));
        setAdded(true);
        setTimeout(() => navigate(`/product/${product._id}`), 600);
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

    return (
        <article className="group relative flex flex-col h-full bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-700 card-hover">
            <Link to={`/product/${product._id}`} className="flex flex-col flex-1" aria-label={`${product.name}, ₹${product.price.toLocaleString("en-IN")}`}>

                {/* Image */}
                <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 border-b-2 border-ink dark:border-slate-700" style={{ aspectRatio: "3/4" }}>
                    <img
                        src={image}
                        alt=""
                        width="600"
                        height="800"
                        loading={eager ? "eager" : "lazy"}
                        className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${outOfStock ? "grayscale opacity-60" : ""}`}
                    />

                    {discount > 0 && !outOfStock && (
                        <span className={`stamp absolute top-3 left-3 ${compact ? "text-[11px]" : "text-[12px] sm:text-[13px]"}`}>
                            {discount}% off
                        </span>
                    )}

                    {outOfStock ? (
                        <span className="absolute bottom-3 left-3 bg-ink text-white text-[12px] font-extrabold uppercase px-2 py-1">
                            Sold out
                        </span>
                    ) : product.stock <= 5 ? (
                        <span className="absolute bottom-3 left-3 bg-white text-hot border-2 border-hot text-[11px] sm:text-[12px] font-extrabold uppercase px-2 py-0.5">
                            Only {product.stock} left
                        </span>
                    ) : null}
                </div>

                {/* Body */}
                <div className={`${compact ? "p-3" : "p-3 sm:p-4"} flex-1 flex flex-col`}>
                    <p className="text-[11px] sm:text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        {product.category === "shirt" ? "Shirt" : "Trouser"}{product.fabric ? ` · ${product.fabric}` : ""}
                    </p>
                    <h3 className={`${compact ? "text-[13px] sm:text-[14px]" : "text-[14px] sm:text-[16px]"} font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2`} style={{ fontStretch: "100%", letterSpacing: 0 }}>
                        {product.name}
                    </h3>

                    <div className="mt-auto flex flex-wrap items-end gap-x-2 gap-y-1">
                        <span className={`price-tag ${compact ? "text-[15px]" : "text-[16px] sm:text-[19px]"}`}>
                            ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {originalPrice > product.price && (
                            <span className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 line-through">
                                ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                        )}
                        {!compact && reviewCount > 0 && (
                            <span className="ml-auto flex items-center gap-0.5 text-[12px] font-bold text-slate-700 dark:text-slate-300" aria-label={`Rated ${rating} out of 5 from ${reviewCount} reviews`}>
                                <HiStar className="w-3.5 h-3.5 text-primary dark:text-sign" aria-hidden="true" />
                                {rating} <span className="font-medium text-slate-500 dark:text-slate-400">({reviewCount})</span>
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Wishlist: always visible, phones have no hover */}
            <button
                type="button"
                className={`absolute top-2.5 right-2.5 z-10 w-10 h-10 flex items-center justify-center border-2 border-ink transition-colors ${isWishlisted ? "bg-hot text-white" : "bg-white text-ink hover:bg-sign"}`}
                aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
                aria-pressed={isWishlisted}
                onClick={handleWishlistToggle}
            >
                {isWishlisted ? <HiHeart className="w-5 h-5" aria-hidden="true" /> : <HiOutlineHeart className="w-5 h-5" aria-hidden="true" />}
            </button>

            {/* Buy */}
            <div className={compact ? "px-3 pb-3" : "px-3 pb-3 sm:px-4 sm:pb-4"}>
                {outOfStock ? (
                    <button type="button" disabled className="w-full min-h-[44px] text-[13px] sm:text-[14px] font-bold border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                        Sold out
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleAddClick}
                        aria-label={hasSizes ? `Choose a size for ${product.name}` : `Add ${product.name} to bag`}
                        className={`w-full min-h-[44px] text-[13px] sm:text-[14px] font-extrabold border-2 border-ink dark:border-black transition-colors ${added
                            ? "bg-emerald text-white dark:text-ink"
                            : "bg-primary text-white hover:bg-primary-dark dark:bg-sign dark:text-ink dark:hover:bg-[#ebdf00]"
                            }`}
                        style={{ fontStretch: "110%" }}
                    >
                        {added ? "Added to bag" : hasSizes ? "Choose size" : "Add to bag"}
                    </button>
                )}
            </div>
        </article>
    );
}
