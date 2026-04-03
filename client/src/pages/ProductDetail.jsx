import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import API from "../services/api";
import { motion } from "framer-motion";
import { HiOutlineShoppingCart, HiStar, HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineHeart } from "react-icons/hi";

export default function ProductDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [qty, setQty] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await API.get(`/products/${id}`);
                setProduct(data);
            } catch {
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAdd = () => {
        for (let i = 0; i < qty; i++) dispatch(addToCart(product));
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <div className="page-wrap py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl" />
                    <div className="space-y-5 py-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-1/4" />
                        <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-full w-3/4" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-1/2" />
                        <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3" />
                        <div className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl w-full mt-8" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="page-wrap py-28 text-center">
                <div className="text-[56px] mb-4">😞</div>
                <h2 className="text-[28px] font-extrabold text-slate-900 dark:text-white mb-3">Product not found</h2>
                <Link to="/" className="text-primary dark:text-gold font-bold hover:underline">Back to Home</Link>
            </div>
        );
    }

    const originalPrice = product.originalPrice || 0;
    const discount = product.discount || 0;

    return (
        <main id="main-content">
            {/* Breadcrumb bar */}
            <div className="bg-slate-50 dark:bg-[#0d1321] border-b border-slate-200 dark:border-slate-800">
                <div className="page-wrap py-4">
                    <nav aria-label="Breadcrumb">
                        <ol className="flex items-center gap-2 text-[15px]">
                            <li><Link to="/" className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors">Home</Link></li>
                            <li className="text-slate-300 dark:text-slate-600">/</li>
                            <li><Link to={product.category === "shirt" ? "/shirts" : "/trousers"} className="text-slate-400 hover:text-primary dark:hover:text-gold transition-colors capitalize">{product.category}s</Link></li>
                            <li className="text-slate-300 dark:text-slate-600">/</li>
                            <li className="text-slate-900 dark:text-white font-semibold line-clamp-1">{product.name}</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="page-wrap py-12 sm:py-16 lg:py-20">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20"
                >
                    {/* Image */}
                    <div className="relative group">
                        <div className="aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="absolute top-4 left-4 flex gap-2">
                            {discount > 0 && (
                                <span className="text-[12px] font-extrabold text-white bg-emerald px-3 py-1.5 rounded-lg shadow-md">{discount}% OFF</span>
                            )}
                            {product.stock <= 5 && product.stock > 0 && (
                                <span className="text-[12px] font-bold text-white bg-rose px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Only {product.stock} left
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="py-2">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2.5 mb-6">
                            {product.fabric && (
                                <span className="text-[13px] font-bold text-primary dark:text-blue-300 bg-primary-light dark:bg-blue-900/30 px-3.5 py-2 rounded-xl">{product.fabric}</span>
                            )}
                            {product.style && (
                                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">{product.style}</span>
                            )}
                            <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl capitalize">{product.category}</span>
                        </div>

                        {/* Name */}
                        <h1 className="text-[28px] sm:text-[34px] lg:text-[42px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-5">
                            {product.name}
                        </h1>

                        {/* Ratings */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center gap-1 bg-emerald text-white text-[15px] font-bold px-3 py-1.5 rounded-xl">
                                4.0 <HiStar className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[15px] font-semibold text-slate-500 dark:text-slate-400">24 ratings & 8 reviews</span>
                        </div>

                        {/* Price */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 sm:p-8 mb-8">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-[36px] sm:text-[44px] font-extrabold text-slate-900 dark:text-white">₹{product.price.toLocaleString("en-IN")}</span>
                                {originalPrice > 0 && (
                                    <span className="text-[20px] text-slate-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                                )}
                                {discount > 0 && (
                                    <span className="text-[17px] font-bold text-emerald">{discount}% off</span>
                                )}
                            </div>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400">Inclusive of all taxes</p>
                        </div>

                        {/* Stock */}
                        {product.stock > 0 ? (
                            <p className="text-[16px] font-bold text-emerald mb-8 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald inline-block animate-pulse"></span>
                                In Stock — {product.stock} available
                            </p>
                        ) : (
                            <p className="text-[16px] font-bold text-rose mb-8">Out of Stock</p>
                        )}

                        {/* Quantity */}
                        <div className="flex items-center gap-5 mb-8">
                            <label className="text-[16px] font-bold text-slate-700 dark:text-slate-300">Quantity:</label>
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="px-6 py-4 text-[16px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    aria-label="Decrease quantity"
                                >−</button>
                                <span className="px-8 py-4 text-[15px] font-extrabold text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-700 min-w-[60px] text-center bg-white dark:bg-transparent">
                                    {qty}
                                </span>
                                <button
                                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                                    className="px-6 py-4 text-[16px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    aria-label="Increase quantity"
                                >+</button>
                            </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <button
                                onClick={handleAdd}
                                disabled={product.stock === 0}
                                className={`flex-1 flex items-center justify-center gap-2.5 text-[17px] font-bold py-[22px] rounded-2xl transition-all duration-300 ${added
                                    ? "bg-emerald text-white scale-[0.98]"
                                    : "bg-slate-900 text-white hover:bg-primary active:scale-[0.97]"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                aria-label={`Add ${product.name} to cart`}
                            >
                                {added ? "✓ Added to Cart" : (
                                    <>
                                        <HiOutlineShoppingCart className="w-5 h-5" />
                                        Add to Cart
                                    </>
                                )}
                            </button>
                            <button
                                className="flex items-center justify-center gap-2.5 text-[17px] font-bold py-[22px] px-10 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose hover:text-rose dark:hover:border-rose dark:hover:text-rose transition-colors"
                                aria-label="Add to wishlist"
                            >
                                <HiOutlineHeart className="w-5 h-5" />
                                Wishlist
                            </button>
                        </div>

                        {/* Trust features */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700">
                            {[
                                { icon: HiOutlineTruck, text: "Free delivery on orders above ₹999", sub: "Estimated 3-5 business days" },
                                { icon: HiOutlineRefresh, text: "7-day easy return & exchange", sub: "No questions asked" },
                                { icon: HiOutlineShieldCheck, text: "100% genuine product guarantee", sub: "Quality checked by our experts" },
                            ].map((item) => (
                                <div key={item.text} className="flex items-start gap-5 px-6 py-5">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <item.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-[1.5]">{item.text}</p>
                                        <p className="text-[14px] text-slate-400 mt-1">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
