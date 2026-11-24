import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist, clearWishlist } from "../redux/wishlistSlice";
import { addToCart } from "../redux/cartSlice";
import { showAlert } from "../redux/alertSlice";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineHeart, HiOutlineTrash, HiOutlineShoppingCart, HiOutlineArrowLeft } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Wishlist() {
    const navigate = useNavigate();
    const items = useSelector((s) => s.wishlist.items);
    const dispatch = useDispatch();
    const [addedIds, setAddedIds] = useState(new Set());

    const handleAddToCart = (item) => {
        if (item.stock !== undefined && item.stock <= 0) {
            dispatch(showAlert({
                title: "Out of Stock",
                message: `"${item.name}" is currently out of stock.`
            }));
            return;
        }
        if (item.sizes && item.sizes.length > 0) {
            navigate(`/product/${item._id}`);
            return;
        }
        dispatch(addToCart({ ...item, stock: item.stock ?? 1 }));
        setAddedIds((prev) => new Set(prev).add(item._id));
        setTimeout(() => {
            dispatch(removeFromWishlist(item._id));
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(item._id);
                return next;
            });
        }, 800);
    };

    const handleMoveAllToCart = () => {
        const sizedItems = items.filter((item) => item.sizes && item.sizes.length > 0);
        const nonSizedAvailable = items.filter((item) => (!item.sizes || item.sizes.length === 0) && (item.stock === undefined || item.stock > 0));
        const nonSizedOutOfStock = items.filter((item) => (!item.sizes || item.sizes.length === 0) && item.stock !== undefined && item.stock <= 0);

        nonSizedAvailable.forEach((item) => {
            dispatch(addToCart({ ...item, stock: item.stock ?? 1 }));
            dispatch(removeFromWishlist(item._id));
        });

        if (sizedItems.length > 0 || nonSizedOutOfStock.length > 0) {
            let msg = "";
            if (sizedItems.length > 0 && nonSizedOutOfStock.length > 0) {
                msg = "Some items in your wishlist require a size and others are out of stock. They have been kept in your wishlist.";
            } else if (sizedItems.length > 0) {
                msg = "Some items in your wishlist require a size. Please select a size on their product pages to add them to your cart.";
            } else {
                msg = "Some items in your wishlist are out of stock and have been kept in your wishlist.";
            }
            dispatch(showAlert({
                title: "Wishlist Move Details",
                message: msg
            }));
        }
    };

    if (items.length === 0) {
        return (
            <main id="main-content" className="page-wrap py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 lg:gap-10">
                    <span className="w-24 h-24 flex items-center justify-center bg-hot text-white border-2 border-ink shadow-[5px_5px_0_var(--hard-shadow)] -rotate-3" aria-hidden="true">
                        <HiOutlineHeart className="w-12 h-12" />
                    </span>
                    <h1 className="display text-[40px] sm:text-[56px] text-slate-900 dark:text-white">Nothing saved yet</h1>
                    <p className="text-[16px] text-slate-600 dark:text-slate-400 max-w-md text-center leading-[1.7]">
                        Tap the heart on any piece to keep it here for later.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/shirts" className="btn-buy">Shop shirts</Link>
                        <Link to="/trousers" className="btn-primary">Shop trousers</Link>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main id="main-content" className="page-wrap py-10 sm:py-16">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" style={{ marginBottom: "32px" }} className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                        <HiOutlineArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <ol className="flex items-center gap-2 text-[15px]">
                        <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                        <li className="text-slate-300 dark:text-slate-600">/</li>
                        <li className="text-slate-900 dark:text-white font-semibold">Wishlist</li>
                    </ol>
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
                    <div>
                        <h1 className="display text-[44px] sm:text-[64px] text-slate-900 dark:text-white">Saved for later</h1>
                        <p className="mt-2 text-[16px] text-slate-600 dark:text-slate-400">{items.length} piece{items.length !== 1 ? "s" : ""} on your hold rail</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={handleMoveAllToCart} className="btn-buy text-[14px]">
                            <HiOutlineShoppingCart className="w-4 h-4" aria-hidden="true" />
                            Move all to bag
                        </button>
                        <button
                            type="button"
                            onClick={() => dispatch(clearWishlist())}
                            className="flex items-center gap-2 min-h-[44px] px-4 border-2 border-hot dark:border-rose-400 text-[14px] font-extrabold text-hot dark:text-rose-400 hover:bg-hot hover:text-white active:translate-y-px transition-colors"
                        >
                            <HiOutlineTrash className="w-4 h-4" aria-hidden="true" />
                            Clear all
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                                    className="group relative flex flex-col bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-600 card-hover"
                                >
                                    <Link to={`/product/${item._id}`} className="flex flex-col flex-1" aria-label={`${item.name}, ₹${Number(item.price || 0).toLocaleString("en-IN")}`}>
                                        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 border-b-2 border-ink dark:border-slate-600" style={{ aspectRatio: "3/4" }}>
                                            <img
                                                src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl}
                                                alt=""
                                                width="600"
                                                height="800"
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                                            />
                                            {discount > 0 && (
                                                <span className="stamp absolute top-3 left-3 text-[12px]">{discount}% off</span>
                                            )}
                                        </div>

                                        <div className="p-3 sm:p-4 flex-1 flex flex-col">
                                            <p className="text-[11px] sm:text-[12px] font-bold uppercase mb-1 text-slate-600 dark:text-slate-400">
                                                {item.category === "shirt" ? "Shirt" : "Trouser"}{item.fabric ? ` · ${item.fabric}` : ""}
                                            </p>
                                            <h3 className="text-[14px] sm:text-[16px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2" style={{ fontStretch: "100%", letterSpacing: 0 }}>
                                                {item.name}
                                            </h3>
                                            <div className="mt-auto flex flex-wrap items-end gap-x-2 gap-y-1">
                                                <span className="price-tag text-[16px] sm:text-[19px]">₹{Number(item.price || 0).toLocaleString("en-IN")}</span>
                                                {originalPrice > item.price && (
                                                    <span className="text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleAddToCart(item)}
                                            className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] text-[13px] sm:text-[14px] font-extrabold border-2 border-ink dark:border-black transition-colors ${isAdded
                                                ? "bg-emerald text-white dark:text-ink"
                                                : "bg-primary text-white hover:bg-primary-dark dark:bg-sign dark:text-ink active:translate-y-px"}`}
                                            style={{ fontStretch: "110%" }}
                                        >
                                            {isAdded ? "Added to bag" : (
                                                <>
                                                    <HiOutlineShoppingCart className="w-4 h-4" aria-hidden="true" />
                                                    To bag
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => dispatch(removeFromWishlist(item._id))}
                                            className="w-11 h-11 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-hot hover:border-hot transition-colors shrink-0"
                                            aria-label={`Remove ${item.name} from saved`}
                                        >
                                            <HiOutlineTrash className="w-4 h-4" aria-hidden="true" />
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
