import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toggleWishlist } from "../redux/wishlistSlice";
import API from "../services/api";
import { motion } from "framer-motion";
import { HiOutlineShoppingCart, HiStar, HiOutlineStar, HiOutlineTruck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineHeart, HiHeart, HiOutlineArrowLeft, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineExclamation, HiOutlineChatAlt2, HiOutlinePhotograph, HiOutlineX, HiOutlineTrash } from "react-icons/hi";
import ProductCard from "../components/ProductCard";

export default function ProductDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth.user);
    const wishlistItems = useSelector((s) => s.wishlist.items);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [qty, setQty] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [selectedSize, setSelectedSize] = useState("");
    const [similarProducts, setSimilarProducts] = useState([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [lightboxImg, setLightboxImg] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const showReviews = true;
    const isWishlisted = wishlistItems.some((i) => i._id === product?._id);

    useEffect(() => {
        setActiveImg(0);
        setQty(1);
        setSelectedSize("");
        setSimilarProducts([]);
        const fetchProduct = async () => {
            try {
                const { data } = await API.get(`/products/${id}`);
                setProduct(data);
                if (data?.sizes?.length > 0) {
                    setSelectedSize(data.sizes[0]);
                }
                // Fetch similar products
                if (data) {
                    try {
                        const params = new URLSearchParams();
                        params.set("category", data.category);
                        params.set("limit", "10");
                        const { data: similar } = await API.get(`/products?${params.toString()}`);
                        // Filter out the current product and slice to 4 items
                        setSimilarProducts(
                            (Array.isArray(similar) ? similar : []).filter((p) => p._id !== id).slice(0, 4)
                        );
                    } catch {
                        setSimilarProducts([]);
                    }
                }
            } catch {
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Poll latest stock every 3 seconds to keep it in sync for multiple concurrent users
    useEffect(() => {
        if (!id) return;
        const interval = setInterval(async () => {
            try {
                const { data } = await API.get(`/products/${id}`);
                setProduct(prev => {
                    if (!prev) return data;
                    if (prev.stock !== data.stock) {
                        setQty(q => Math.max(data.stock > 0 ? 1 : 0, Math.min(data.stock, q)));
                        return { ...prev, stock: data.stock };
                    }
                    return prev;
                });
            } catch (err) {
                console.error("Failed to poll product stock:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [id]);

    const handleAdd = () => {
        if (!product || product.stock <= 0) return;
        if (product?.sizes?.length > 0 && !selectedSize) {
            alert("Please select a size first");
            return;
        }
        dispatch(addToCart({ ...product, size: selectedSize, qtyToAdd: qty }));
        
        const newStock = Math.max(0, product.stock - qty);
        setProduct(prev => ({
            ...prev,
            stock: newStock
        }));
        setQty(newStock > 0 ? 1 : 0);
        
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleBuyNow = () => {
        if (!product || product.stock <= 0) return;
        if (product?.sizes?.length > 0 && !selectedSize) {
            alert("Please select a size first");
            return;
        }
        dispatch(addToCart({ ...product, size: selectedSize, qtyToAdd: qty }));
        navigate("/cart");
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate(`/login?redirect=/product/${id}`);
            return;
        }
        if (!reviewComment.trim()) return;
        setSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append("rating", reviewRating);
            formData.append("comment", reviewComment);
            if (imageFile) {
                formData.append("image", imageFile);
            }

            const { data } = await API.post(`/products/${id}/reviews`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            setProduct(data);
            setReviewComment("");
            setImageFile(null);
            setImagePreview("");
            setReviewRating(5);
            setReviewSuccess(true);
            setTimeout(() => setReviewSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to post review:", err);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeSelectedImage = () => {
        setImageFile(null);
        setImagePreview("");
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
                    <nav aria-label="Breadcrumb" className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                            <HiOutlineArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
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

            <div className="page-wrap" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20"
                >
                    {/* Image Gallery */}
                    <div className="relative group">
                        {(() => {
                            const allImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
                            const currentImg = allImages[activeImg] || allImages[0];
                            return (
                                <>
                                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
                                        <img src={currentImg} alt={`${product.name} - Image ${activeImg + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        {allImages.length > 1 && (
                                            <>
                                                <button onClick={() => setActiveImg((prev) => (prev - 1 + allImages.length) % allImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors z-10" aria-label="Previous image">
                                                    <HiOutlineChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                                </button>
                                                <button onClick={() => setActiveImg((prev) => (prev + 1) % allImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors z-10" aria-label="Next image">
                                                    <HiOutlineChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {allImages.length > 1 && (
                                        <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                                            {allImages.map((img, idx) => (
                                                <button key={idx} onClick={() => setActiveImg(idx)} className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImg === idx ? "border-primary shadow-md" : "border-slate-200 dark:border-slate-700 hover:border-slate-400"}`}>
                                                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        <div className="absolute top-4 left-4 flex gap-2 z-10">
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
                        <div className="flex flex-wrap items-center gap-2.5 mb-3">
                            {product.fabric && (
                                <span className="text-[13px] font-bold text-primary dark:text-blue-300 bg-primary-light dark:bg-blue-900/30 px-3.5 py-2 rounded-xl">{product.fabric}</span>
                            )}
                            {product.style && (
                                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">{product.style}</span>
                            )}
                            <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl capitalize">{product.category}</span>
                        </div>

                        {/* Name */}
                        <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2.5">
                            {product.name}
                        </h1>

                        {/* Ratings */}
                        <div className="flex items-center gap-3 mb-4">
                            <button 
                                onClick={() => {
                                    const element = document.getElementById("reviews-section");
                                    if (element) element.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="flex items-center gap-1 bg-emerald text-white text-[15px] font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                {product.ratings ? product.ratings.toFixed(1) : "0.0"} <HiStar className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    const element = document.getElementById("reviews-section");
                                    if (element) element.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="flex items-center gap-1 hover:underline cursor-pointer"
                            >
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => {
                                        const ratingVal = product.ratings || 0;
                                        return (
                                            <HiStar
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.round(ratingVal) ? "text-amber-500" : "text-slate-200 dark:text-slate-700"}`}
                                            />
                                        );
                                    })}
                                </div>
                                <span className="text-[15px] font-semibold text-slate-500 dark:text-slate-400 ml-1">
                                    ({product.reviews?.length || 0} customer review{(product.reviews?.length || 0) !== 1 ? "s" : ""})
                                </span>
                            </button>
                        </div>

                        {/* Price */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 sm:p-6 mb-4">
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
                            <p className="text-[15px] font-bold text-emerald mb-4 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald inline-block animate-pulse"></span>
                                In Stock — {product.stock} available
                            </p>
                        ) : (
                            <p className="text-[15px] font-bold text-rose mb-4">Out of Stock</p>
                        )}

                        {/* Size Selection */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Select Size:</label>
                                    <Link to="/size-guide" className="text-[13px] font-semibold text-primary dark:text-blue-400 hover:underline">Size Guide</Link>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {product.sizes.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSelectedSize(s)}
                                            className={`min-w-[46px] h-[46px] px-3 rounded-xl text-[14px] font-bold border transition-all cursor-pointer ${
                                                selectedSize === s
                                                    ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-md scale-[1.02]"
                                                    : "bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        {product.stock > 0 && (
                            <div className="flex items-center gap-4 mb-4">
                                <label className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Quantity:</label>
                                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                    <button
                                        disabled={qty <= 1}
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="px-4 py-2 text-[15px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        aria-label="Decrease quantity"
                                    >−</button>
                                    <span className="px-6 py-2 text-[14px] font-extrabold text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-700 min-w-[48px] text-center bg-white dark:bg-transparent">
                                        {qty}
                                    </span>
                                    <button
                                        disabled={qty >= product.stock}
                                        onClick={() => setQty(Math.min(product.stock, qty + 1))}
                                        className="px-4 py-2 text-[15px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        aria-label="Increase quantity"
                                    >+</button>
                                </div>
                            </div>
                        )}

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                onClick={handleAdd}
                                disabled={product.stock === 0}
                                className={`flex-1 flex items-center justify-center gap-2.5 text-[15px] font-bold py-4 rounded-xl transition-all duration-300 cursor-pointer ${added
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
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                                className="flex-1 flex items-center justify-center gap-2.5 text-[15px] font-bold py-4 rounded-xl transition-all duration-300 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={`Buy ${product.name} now`}
                            >
                                Buy Now
                            </button>
                            <button
                                onClick={() => {
                                    if (!user) {
                                        navigate("/login?redirect=/product/" + id);
                                        return;
                                    }
                                    dispatch(toggleWishlist(product));
                                }}
                                className={`flex items-center justify-center py-4 px-5 rounded-xl border-2 transition-colors cursor-pointer ${isWishlisted
                                    ? "border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500"
                                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-400 dark:hover:text-rose-500"
                                    }`}
                                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            >
                                {isWishlisted ? <HiHeart className="w-5.5 h-5.5" /> : <HiOutlineHeart className="w-5.5 h-5.5" />}
                            </button>
                        </div>

                        {/* Trust features */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700">
                            {[
                                { icon: HiOutlineTruck, text: "Standard & Express Delivery", sub: "Shipping dynamically calculated at checkout" },
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

                {/* ════════════════════ SIMILAR PRODUCTS (You Might Also Like) ════════════════════ */}
                {similarProducts.length > 0 && (
                    <div className="mt-16 border-t border-slate-200 dark:border-slate-700 pt-12">
                        {product.stock <= 0 && (
                            <div className="flex items-center gap-3 mb-6 bg-amber-50 dark:bg-amber-900/20 p-4.5 rounded-xl border border-amber-200/50">
                                <HiOutlineExclamation className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-[14px] font-bold text-amber-600 dark:text-amber-400">This product is currently out of stock, but you might like these similar items.</p>
                            </div>
                        )}
                        <h2 className="text-[24px] sm:text-[30px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
                            You Might Also Like
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {similarProducts.map((p) => (
                                <ProductCard key={p._id} product={p} compact={true} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════════════════ RATINGS & REVIEWS ════════════════════ */}
                {showReviews && (
                    <div id="reviews-section" className="mt-16 border-t border-slate-200 dark:border-slate-700 pt-12">
                        <h2 className="text-[24px] sm:text-[30px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
                            Customer Ratings & Reviews
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Overall Stats */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 h-fit">
                                <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-[48px] font-extrabold text-slate-900 dark:text-white leading-none mb-2">
                                        {product.ratings ? product.ratings.toFixed(1) : "4.0"}
                                    </p>
                                    <div className="flex justify-center gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => {
                                            const ratingVal = product.ratings || 4.0;
                                            return (
                                                <HiStar
                                                    key={i}
                                                    className={`w-5 h-5 ${i < Math.floor(ratingVal) ? "text-[#8a6616]" : "text-slate-200 dark:text-slate-700"}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <p className="text-[14px] text-slate-500 dark:text-slate-400 font-semibold">
                                        Based on {product.reviews?.length || 0} reviews
                                    </p>
                                </div>

                                {/* Stars breakdown */}
                                <div className="py-6 space-y-3">
                                    {[5, 4, 3, 2, 1].map((stars) => {
                                        const count = product.reviews?.filter((r) => r.rating === stars).length || 0;
                                        const percent = product.reviews?.length ? (count / product.reviews.length) * 100 : 0;
                                        return (
                                            <div key={stars} className="flex items-center gap-3 text-[14px]">
                                                <span className="font-semibold text-slate-600 dark:text-slate-400 w-3">{stars}</span>
                                                <HiStar className="w-4 h-4 text-[#8a6616] shrink-0" />
                                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#8a6616] rounded-full" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="font-bold text-slate-500 w-6 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Write Review trigger or Login prompt */}
                                {user ? (
                                    <button
                                        onClick={() => setShowReviewForm(!showReviewForm)}
                                        className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all"
                                    >
                                        <HiOutlineChatAlt2 className="w-5 h-5" />
                                        {showReviewForm ? "Close Rating Form" : "Rate this Product"}
                                    </button>
                                ) : (
                                    <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Link to={`/login?redirect=/product/${id}`} className="text-[14px] font-bold text-[#8a6616] hover:underline">
                                            Sign in to rate this product
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Review Form & List */}
                            <div className="lg:col-span-2 space-y-8">
                                {user && showReviewForm && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm"
                                    >
                                        <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-4">Rate this Product</h3>
                                        <form onSubmit={handleReviewSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Stars</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setReviewRating(star)}
                                                            className="p-1 cursor-pointer focus:outline-none transition-transform hover:scale-110"
                                                        >
                                                            <HiStar
                                                                className={`w-8 h-8 ${star <= reviewRating ? "text-amber-500" : "text-slate-200 dark:text-slate-700"}`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Comment</label>
                                                <textarea
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                    required
                                                    rows={4}
                                                    placeholder="Share your thoughts about this product's style, fabric, or fit..."
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-[15px] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#8a6616]/20"
                                                />
                                            </div>
                                            
                                            {/* Review image uploader */}
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attach Photo (Optional)</label>
                                                {imagePreview ? (
                                                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group mt-1">
                                                        <img src={imagePreview} alt="Review upload preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={removeSelectedImage}
                                                            className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                                                            aria-label="Remove image"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 transition-colors py-4 mt-1">
                                                        <div className="flex flex-col items-center justify-center pt-2">
                                                            <HiOutlinePhotograph className="w-8 h-8 text-slate-400 mb-2" />
                                                            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Click to upload photo</p>
                                                            <p className="text-[11px] text-slate-400 mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            {reviewSuccess && (
                                                <p className="text-[14px] font-semibold text-emerald">✓ Rating submitted successfully!</p>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={submittingReview}
                                                className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[14px] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all cursor-pointer"
                                            >
                                                {submittingReview ? "Submitting..." : "Submit Rating"}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {/* Custom Reviews List */}
                                <div className="space-y-4">
                                    {product.reviews && product.reviews.length > 0 ? (
                                        product.reviews.map((review) => (
                                            <div
                                                key={review._id}
                                                className="bg-white dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 p-5 sm:p-6 rounded-2xl shadow-sm"
                                            >
                                                <div className="flex items-center justify-between gap-4 mb-3.5">
                                                    <div>
                                                        <p className="text-[15px] font-bold text-slate-900 dark:text-white">{review.userName}</p>
                                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <HiStar
                                                                key={i}
                                                                className={`w-4 h-4 ${i < review.rating ? "text-amber-500" : "text-slate-200 dark:text-slate-700"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {review.comment}
                                                </p>
                                                {review.imageUrl && (
                                                    <div className="mt-3">
                                                        <img 
                                                            src={review.imageUrl} 
                                                            alt="Review attachment" 
                                                            onClick={() => setLightboxImg(review.imageUrl)}
                                                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            <HiOutlineChatAlt2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                            <p className="text-[16px] font-bold text-slate-700 dark:text-slate-300">No reviews yet</p>
                                            <p className="text-[14px] text-slate-400 dark:text-slate-500 mt-1">Be the first to share your experience with this product!</p>
                                            {user && !showReviewForm && (
                                                <button
                                                    onClick={() => setShowReviewForm(true)}
                                                    className="mt-4 text-[14px] font-bold text-[#8a6616] hover:underline cursor-pointer"
                                                >
                                                    Write a Review Now
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Image Lightbox Modal */}
                {lightboxImg && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setLightboxImg("")}
                    >
                        <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <img 
                                src={lightboxImg} 
                                alt="Review Attachment Full Size" 
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            />
                            <button 
                                onClick={() => setLightboxImg("")}
                                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-colors cursor-pointer shadow-md"
                                aria-label="Close image"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
