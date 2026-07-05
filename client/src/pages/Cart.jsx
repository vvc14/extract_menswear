import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity, clearCart, updateCartStocks } from "../redux/cartSlice";
import { showAlert } from "../redux/alertSlice";
import { useNavigate, Link } from "react-router-dom";
import { initiateRazorpayPayment } from "../services/razorpay";
import API from "../services/api";
import { 
    HiOutlineTrash, HiMinus, HiPlus, HiOutlineShoppingCart, 
    HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineHome, 
    HiOutlinePhone, HiOutlineUser, HiOutlinePlus, HiOutlineCheck,
    HiOutlinePencil
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirm } from "../context/ConfirmContext";

export default function Cart() {
    const items = useSelector((s) => s.cart.items);
    const user = useSelector((s) => s.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const shipping = items.reduce((sum, i) => sum + (Number(i.shippingCost) || 0) * i.quantity, 0);

    // Fetch and sync the latest product stock dynamically from the database on load
    useEffect(() => {
        if (items.length === 0) return;
        
        const syncStock = async () => {
            try {
                const stockUpdates = [];
                for (const item of items) {
                    try {
                        const { data } = await API.get(`/products/${item._id}`);
                        stockUpdates.push({ id: item._id, stock: data.stock });
                    } catch (err) {
                        console.error(`Failed to sync stock for product ${item._id}:`, err);
                    }
                }
                
                if (stockUpdates.length > 0) {
                    dispatch(updateCartStocks(stockUpdates));
                }
            } catch (err) {
                console.error("Failed to sync cart stocks:", err);
            }
        };
        
        syncStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check if any item has stock issues
    const hasStockIssues = items.some((item) => {
        const stock = item.stock !== undefined ? item.stock : 99999;
        return stock === 0 || item.quantity > stock;
    });

    const [addresses, setAddresses] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    
    // Inline Add Address Form state
    const [showForm, setShowForm] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
    });

    // Coupon state
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [couponSuccess, setCouponSuccess] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [addDropdownOpen, setAddDropdownOpen] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [showCoupons, setShowCoupons] = useState(false);
    const [editAddressIdx, setEditAddressIdx] = useState(null);
    const addMenuRef = useRef(null);

    const actualDiscount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, subtotal) : 0;

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await API.get("/coupons");
                setAvailableCoupons(data || []);
            } catch (err) {
                console.error("Failed to fetch available coupons:", err);
            }
        };
        fetchCoupons();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
                setAddDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const { data } = await API.get("/auth/profile");
                    const userAddresses = data.addresses || [];
                    setAddresses(userAddresses);
                    
                    if (userAddresses.length > 0) {
                        const defaultIdx = userAddresses.findIndex(a => a.isDefault);
                        setSelectedIdx(defaultIdx !== -1 ? defaultIdx : 0);
                    } else {
                        setShowForm(true);
                    }
                } catch (err) {
                    console.error("Failed to load user profile for shipping addresses:", err);
                    setShowForm(true);
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        
        // Strict Validation
        if (!/^\d{10}$/.test(addressForm.phone)) {
            dispatch(showAlert({ title: "Validation Error", message: "Phone number must be exactly 10 digits." }));
            return;
        }
        if (!/^\d{6}$/.test(addressForm.pincode)) {
            dispatch(showAlert({ title: "Validation Error", message: "Pincode must be exactly 6 digits and numeric only." }));
            return;
        }

        setSavingAddress(true);
        try {
            let updatedAddresses = [...addresses];
            if (editAddressIdx !== null) {
                updatedAddresses[editAddressIdx] = { ...addressForm };
            } else {
                const isFirst = addresses.length === 0;
                const newAddress = { ...addressForm, isDefault: isFirst };
                updatedAddresses.push(newAddress);
            }

            const { data } = await API.put("/auth/profile", {
                addresses: updatedAddresses,
            });

            setAddresses(data.addresses || updatedAddresses);
            setSelectedIdx(editAddressIdx !== null ? editAddressIdx : updatedAddresses.length - 1);
            setShowForm(false);
            setEditAddressIdx(null);
            setAddressForm({
                name: "",
                phone: "",
                street: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
            });
        } catch (err) {
            console.error("Failed to save shipping address:", err);
            dispatch(showAlert({ title: "Error Saving Address", message: err.response?.data?.message || "Failed to save address. Please try again." }));
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (e, idx) => {
        e.stopPropagation();
        if (!(await confirm("Are you sure you want to delete this address?"))) return;
        
        const updatedAddresses = addresses.filter((_, i) => i !== idx);
        try {
            const { data } = await API.put("/auth/profile", { addresses: updatedAddresses });
            setAddresses(data.addresses || updatedAddresses);
            if (selectedIdx === idx) {
                setSelectedIdx(updatedAddresses.length > 0 ? 0 : null);
            } else if (selectedIdx > idx) {
                setSelectedIdx(selectedIdx - 1);
            }
        } catch (err) {
            console.error("Failed to delete address:", err);
            dispatch(showAlert({ title: "Delete Failed", message: err.response?.data?.message || "Failed to delete address. Please try again." }));
        }
    };

    const handleEditAddressClick = (e, idx) => {
        e.stopPropagation();
        setEditAddressIdx(idx);
        setAddressForm({ ...addresses[idx] });
        setShowForm(true);
    };

    const handleApplyCoupon = async (codeOverride) => {
        const code = codeOverride || couponInput;
        if (!code || !code.trim()) return;
        setApplyingCoupon(true);
        setCouponError("");
        setCouponSuccess("");
        try {
            const { data } = await API.post("/coupons/validate", { code, subtotal });
            setAppliedCoupon(data);
            setCouponSuccess(`Coupon applied! You saved ₹${data.discountAmount.toLocaleString("en-IN")}`);
            setCouponInput("");
        } catch (err) {
            setCouponError(err.response?.data?.message || "Invalid coupon code");
            setAppliedCoupon(null);
        } finally {
            setApplyingCoupon(false);
        }
    };
    
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponSuccess("");
        setCouponError("");
    };

    // Auto-remove coupon if cart contents change
    useEffect(() => {
        if (appliedCoupon) {
            handleRemoveCoupon();
            dispatch(showAlert({ title: "Cart Updated", message: "Coupon removed because your cart was modified. Please re-apply if applicable." }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal, totalItems]);

    const handleCheckout = async () => {
        if (!user) {
            navigate("/login?redirect=cart");
            return;
        }

        if (selectedIdx === null || !addresses[selectedIdx]) {
            dispatch(showAlert({ title: "Address Required", message: "Please provide and select a delivery address before proceeding to payment." }));
            setShowForm(true);
            return;
        }

        // Block checkout if any item has stock issues
        if (hasStockIssues) {
            dispatch(showAlert({ title: "Stock Issue", message: "Some items in your cart are out of stock or exceed available stock. Please update your cart before proceeding." }));
            return;
        }

        // Validate that all items requiring a size actually have a size selected
        const missingSizeItem = items.find((item) => item.sizes && item.sizes.length > 0 && !item.size);
        if (missingSizeItem) {
            dispatch(showAlert({
                title: "Size Selection Required",
                message: `Please select a size for "${missingSizeItem.name}" before proceeding to checkout.`
            }));
            return;
        }

        const selectedAddress = addresses[selectedIdx];

        // Format checks on checkout to ensure data compliance
        if (!/^\d{10}$/.test(selectedAddress.phone)) {
            dispatch(showAlert({ title: "Invalid Address Data", message: "The selected address contains an invalid phone number. It must be exactly 10 digits." }));
            return;
        }
        if (!/^\d{6}$/.test(selectedAddress.pincode)) {
            dispatch(showAlert({ title: "Invalid Address Data", message: "The selected address contains an invalid pincode. It must be exactly 6 digits and numeric only." }));
            return;
        }

        try {
            const { data } = await API.post("/payment/razorpay/order", {
                amount: subtotal - actualDiscount,
                shipping,
                userId: user._id || user.id,
                userEmail: user.email,
                userName: user.name,
                shippingAddress: selectedAddress,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                items: items.map((i) => ({
                    productId: i._id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    size: i.size || "",
                    imageUrl: i.imageUrl || "",
                    images: i.images || [],
                })),
            });

            await initiateRazorpayPayment({
                orderId: data.orderId,
                amount: data.amount,
                currency: data.currency,
                onSuccess: async (response) => {
                    const verifyRes = await API.post("/payment/razorpay/verify", response);
                    dispatch(clearCart());
                    navigate("/payment-success", { state: { orderId: verifyRes.data.orderId, invoiceNumber: verifyRes.data.invoiceNumber } });
                },
                onFailure: (err) => {
                    console.error("Razorpay payment failed:", err);
                },
            });
        } catch (err) {
            console.error("Checkout process failed:", err);
        }
    };

    const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[14px] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all relative focus:z-10";
    const labelClass = "block text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

    if (items.length === 0) {
        return (
            <main id="main-content" className="page-wrap py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 lg:gap-10">
                    <div className="w-28 h-28 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <HiOutlineShoppingCart className="w-12 h-12 text-slate-400" />
                    </div>
                    <h2 className="text-[30px] font-extrabold text-slate-900 dark:text-white">Your cart is empty</h2>
                    <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-md text-center leading-[1.7]">
                        Looks like you haven't added anything to your cart yet. Explore our collection and find something you love.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link to="/shirts" className="btn-primary">
                            Shop Shirts
                        </Link>
                        <Link to="/trousers" className="btn-outline">
                            Shop Trousers
                        </Link>
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
                        <li className="text-slate-900 dark:text-white font-semibold">Shopping Cart</li>
                    </ol>
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ marginBottom: "40px" }}>
                    <div>
                        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight">Shopping Cart</h1>
                        <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">{totalItems} item{totalItems !== 1 ? "s" : ""} in your cart</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative" ref={addMenuRef}>
                            <button
                                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                                className="w-fit flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[14px] font-bold transition-all cursor-pointer active:scale-[0.97]"
                                aria-expanded={addDropdownOpen}
                                aria-label="Add more items menu"
                            >
                                <HiOutlinePlus className="w-4.5 h-4.5" /> Add More Items
                            </button>
                            <AnimatePresence>
                                {addDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50"
                                    >
                                        <div className="py-1">
                                            <Link
                                                to="/shirts"
                                                className="block px-4.5 py-2.5 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setAddDropdownOpen(false)}
                                            >
                                                Shirts
                                            </Link>
                                            <Link
                                                to="/trousers"
                                                className="block px-4.5 py-2.5 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setAddDropdownOpen(false)}
                                            >
                                                Trousers
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={async () => {
                                if (await confirm("Are you sure you want to clear all items from your cart?")) {
                                    dispatch(clearCart());
                                }
                            }}
                            className="w-fit flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/25 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-[14px] font-bold transition-all cursor-pointer active:scale-[0.97]"
                        >
                            <HiOutlineTrash className="w-4.5 h-4.5" /> Clear Cart
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 md:gap-14">
                    {/* Left Column: Cart items & Address Details */}
                    <div className="flex-1 space-y-8">
                        {/* Cart items */}
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                            {items.map((item) => (
                                <div key={`${item._id}-${item.size || ""}`} className="flex gap-3 sm:gap-5 p-3 sm:p-7">
                                    {/* Image */}
                                    <Link to={`/product/${item._id}`} className="shrink-0">
                                        <div className="w-[85px] h-[110px] sm:w-[110px] sm:h-[140px] bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                                        <div>
                                            <Link to={`/product/${item._id}`} className="text-[16px] sm:text-[18px] font-semibold text-slate-900 dark:text-white hover:text-primary dark:hover:text-gold transition-colors line-clamp-2">
                                                {item.name}
                                            </Link>
                                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">
                                                {item.fabric && item.fabric}{item.style && ` · ${item.style}`}{item.size && ` · Size: ${item.size}`}
                                            </p>
                                            {item.stock !== undefined && item.stock === 0 ? (
                                                <p className="text-[13px] font-bold text-white mt-1.5 flex items-center gap-1.5 bg-rose-500 px-3 py-1.5 rounded-lg w-fit">
                                                    ✕ Out of Stock
                                                </p>
                                            ) : item.stock !== undefined && item.quantity > item.stock ? (
                                                <p className="text-[13px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                    Only {item.stock} available — reduce quantity
                                                </p>
                                            ) : item.stock !== undefined && item.stock <= 5 ? (
                                                <p className="text-[12px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    Only {item.stock} left in stock
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between mt-3 sm:mt-4 gap-3">
                                            {/* Quantity */}
                                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 h-9 sm:h-10">
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity === 1) {
                                                            dispatch(removeFromCart({ id: item._id, size: item.size }));
                                                        } else {
                                                            dispatch(updateQuantity({ id: item._id, size: item.size, quantity: item.quantity - 1 }));
                                                        }
                                                    }}
                                                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-full"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <HiMinus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="px-2 sm:px-3 py-1 sm:py-2 text-[14px] sm:text-[16px] font-bold text-slate-900 dark:text-white min-w-[32px] sm:min-w-[36px] text-center border-x border-slate-200 dark:border-slate-700 h-full flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    disabled={item.quantity >= (item.stock || 99999) || (item.stock !== undefined && item.stock === 0)}
                                                    onClick={() => dispatch(updateQuantity({ id: item._id, size: item.size, quantity: item.quantity + 1 }))}
                                                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-full"
                                                    aria-label="Increase quantity"
                                                >
                                                    <HiPlus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3 ml-auto">
                                                {/* Price */}
                                                <p className="text-[16px] sm:text-[20px] font-extrabold text-slate-900 dark:text-white">
                                                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                                </p>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => dispatch(removeFromCart({ id: item._id, size: item.size }))}
                                                    className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors shrink-0"
                                                    aria-label={`Remove ${item.name} from cart`}
                                                >
                                                    <HiOutlineTrash className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Shipping Address Details Card */}
                        {user ? (
                            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                                        <HiOutlineHome className="w-5.5 h-5.5 text-primary dark:text-gold" /> {editAddressIdx !== null ? "Edit Address" : "Delivery Address"}
                                    </h2>
                                    {!showForm && (
                                        <button 
                                            onClick={() => setShowForm(true)}
                                            className="text-sm font-bold text-primary dark:text-gold hover:opacity-80 transition-all flex items-center gap-1.5 cursor-pointer bg-primary/5 dark:bg-gold/5 px-3 py-1.5 rounded-lg border border-primary/10 dark:border-gold/10"
                                        >
                                            <HiOutlinePlus className="w-4 h-4" /> Add Address
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence mode="wait">
                                    {showForm ? (
                                        <motion.form 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            onSubmit={handleAddAddress} 
                                            className="space-y-4 overflow-hidden p-1"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>Recipient Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={addressForm.name} 
                                                        onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                                                        placeholder="Full Name"
                                                        required
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Phone Number</label>
                                                    <input 
                                                        type="tel" 
                                                        value={addressForm.phone} 
                                                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                                                        placeholder="10-digit number"
                                                        required
                                                        className={inputClass}
                                                    />
                                                    <p className="text-[11px] text-slate-400 mt-1">Must be exactly 10 digits.</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Street Address</label>
                                                <input 
                                                    type="text" 
                                                    value={addressForm.street} 
                                                    onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                                                    placeholder="Flat/House No., Street, Area"
                                                    required
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div>
                                                    <label className={labelClass}>City</label>
                                                    <input 
                                                        type="text" 
                                                        value={addressForm.city} 
                                                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                                        placeholder="City"
                                                        required
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>State</label>
                                                    <input 
                                                        type="text" 
                                                        value={addressForm.state} 
                                                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                                                        placeholder="State"
                                                        required
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Pincode</label>
                                                    <input 
                                                        type="text" 
                                                        value={addressForm.pincode} 
                                                        onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                                                        placeholder="Pincode"
                                                        required
                                                        className={inputClass}
                                                    />
                                                    <p className="text-[11px] text-slate-400 mt-1">6 digits numeric.</p>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Country</label>
                                                    <input 
                                                        type="text" 
                                                        value={addressForm.country} 
                                                        onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                                                        placeholder="Country"
                                                        required
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2">
                                                {addresses.length > 0 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setShowForm(false); setEditAddressIdx(null); setAddressForm({ name: "", phone: "", street: "", city: "", state: "", pincode: "", country: "India" }); }}
                                                        className="px-5 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button 
                                                    type="submit" 
                                                    disabled={savingAddress}
                                                    className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                                                >
                                                    {savingAddress ? "Saving..." : "Save Delivery Info"}
                                                </button>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.map((addr, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => setSelectedIdx(idx)}
                                                    className={`p-5 rounded-xl border transition-all cursor-pointer text-left relative ${
                                                        selectedIdx === idx 
                                                            ? "border-primary dark:border-gold bg-primary/5 dark:bg-gold/5" 
                                                            : "border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                                                    }`}
                                                >
                                                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleEditAddressClick(e, idx)}
                                                            className="p-1 text-slate-400 hover:text-primary dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Address"
                                                        >
                                                            <HiOutlinePencil className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleDeleteAddress(e, idx)}
                                                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                                            title="Delete Address"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                        {selectedIdx === idx && (
                                                            <span className="bg-primary dark:bg-gold text-white dark:text-slate-900 rounded-full p-0.5 flex items-center justify-center">
                                                                <HiOutlineCheck className="w-3.5 h-3.5" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-800 dark:text-white text-[15px]">{addr.name}</span>
                                                            {addr.isDefault && (
                                                                <span className="bg-primary/10 dark:bg-gold/10 text-primary dark:text-gold text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-primary/10 dark:border-gold/10">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-500 dark:text-slate-400 text-[14px] leading-relaxed">
                                                            {addr.street}<br />
                                                            {addr.city}, {addr.state} - {addr.pincode}<br />
                                                            {addr.country}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[13px] pt-1.5">
                                                            <HiOutlinePhone className="w-4 h-4" />
                                                            <span>{addr.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center">
                                <HiOutlineUser className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2">Checkout Delivery Information</h3>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-5 max-w-sm mx-auto">
                                    Please sign in to provide a delivery address and complete your purchase securely.
                                </p>
                                <Link to="/login?redirect=cart" className="btn-primary inline-flex">
                                    Sign In to Continue
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Order summary */}
                    <div className="lg:w-[400px] shrink-0">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 sticky top-[100px]" style={{ padding: "32px" }}>
                            <h3 className="text-[22px] font-extrabold text-slate-900 dark:text-white" style={{ marginBottom: "28px" }}>Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-[16px]">
                                    <span className="text-slate-500 dark:text-slate-400">Subtotal ({totalItems} items)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-[16px] text-emerald">
                                        <span className="font-semibold text-emerald text-[14px]">Discount ({appliedCoupon.code})</span>
                                        <span className="font-bold">-₹{actualDiscount.toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[16px]">
                                    <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                                    <span className={`font-semibold ${shipping === 0 ? "text-emerald" : "text-slate-900 dark:text-white"}`}>
                                        {shipping === 0 ? "FREE" : `₹${shipping.toLocaleString("en-IN")}`}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Coupon code" 
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        disabled={appliedCoupon || applyingCoupon}
                                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[14px] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                    {appliedCoupon ? (
                                        <button onClick={handleRemoveCoupon} className="px-4 font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer">Remove</button>
                                    ) : (
                                        <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()} className="btn-primary px-5 rounded-xl disabled:opacity-50 cursor-pointer">
                                            {applyingCoupon ? "..." : "Apply"}
                                        </button>
                                    )}
                                </div>
                                {couponError && <p className="text-rose-500 text-[13px] font-bold mt-2">{couponError}</p>}
                                {couponSuccess && <p className="text-emerald text-[13px] font-bold mt-2">{couponSuccess}</p>}

                                {availableCoupons.length > 0 && (
                                    <div className="mt-3.5">
                                        <button
                                            type="button"
                                            onClick={() => setShowCoupons(!showCoupons)}
                                            className="text-[13px] font-bold text-primary dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            {showCoupons ? "Hide Available Coupons" : "View Available Coupons"}
                                        </button>
                                        
                                        <AnimatePresence>
                                            {showCoupons && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden mt-2.5 space-y-2"
                                                >
                                                    {availableCoupons.map((c) => {
                                                        const isMinMet = subtotal >= c.minOrderValue;
                                                        return (
                                                            <div 
                                                                key={c._id}
                                                                className={`p-3 rounded-xl border text-[13px] transition-all flex items-center justify-between gap-3 ${
                                                                    isMinMet 
                                                                        ? "bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                                                                        : "bg-slate-50/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 opacity-60"
                                                                }`}
                                                            >
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-extrabold text-[12px] bg-primary/10 dark:bg-gold/10 text-primary dark:text-gold px-2 py-0.5 rounded border border-primary/20 dark:border-gold/25 uppercase font-mono">
                                                                            {c.code}
                                                                        </span>
                                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                            {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                                        Min order: ₹{c.minOrderValue.toLocaleString("en-IN")}
                                                                    </p>
                                                                </div>
                                                                {isMinMet && !appliedCoupon && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApplyCoupon(c.code)}
                                                                        className="text-primary dark:text-gold font-bold hover:underline shrink-0 cursor-pointer"
                                                                    >
                                                                        Apply
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-5 mb-8">
                                <div className="flex justify-between">
                                    <span className="text-[18px] font-extrabold text-slate-900 dark:text-white">Total</span>
                                    <span className="text-[26px] font-extrabold text-slate-900 dark:text-white">₹{(subtotal - actualDiscount + shipping).toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={hasStockIssues}
                                className={`w-full py-[18px] text-[16px] mb-5 cursor-pointer rounded-xl font-bold transition-all ${hasStockIssues ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'btn-primary'}`}
                            >
                                {hasStockIssues ? 'Update Cart to Proceed' : 'Proceed to Pay'}
                            </button>

                            {hasStockIssues && (
                                <p className="text-[13px] text-rose-500 font-semibold text-center mb-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-4 py-2.5">
                                    ⚠️ Some items are out of stock or exceed available quantity. Please remove or adjust them.
                                </p>
                            )}

                            <div className="flex items-center justify-center gap-2 text-[14px] text-slate-400">
                                <HiOutlineShieldCheck className="w-4 h-4" />
                                <span>Secure checkout powered by Razorpay</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
