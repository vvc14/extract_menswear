import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity, clearCart, updateCartStocks, MAX_QTY_PER_LINE } from "../redux/cartSlice";
import { showAlert } from "../redux/alertSlice";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { initiateRazorpayPayment } from "../services/razorpay";
import API, { apiErrorMessage } from "../services/api";
import { stockForSize } from "../utils/stock";
import { 
    HiOutlineTrash, HiMinus, HiPlus,
    HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineHome,
    HiOutlinePhone, HiOutlineUser, HiOutlinePlus,
    HiOutlinePencil
} from "react-icons/hi";
import Receipt, { ReceiptHead, ReceiptLine, ReceiptRule } from "../components/brand/Receipt";
import Hanger from "../components/brand/Hanger";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirm } from "../context/ConfirmContext";

export default function Cart() {
    const items = useSelector((s) => s.cart.items);
    const user = useSelector((s) => s.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const location = useLocation();

    // Back from the bank (redirect-mode payment on phones) after a failed or cancelled payment
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("payment") !== "failed") return;
        dispatch(showAlert({
            title: "Payment not completed",
            message: `${params.get("reason") || "The payment was not completed."} Your cart is still here, so you can try again.`,
        }));
        navigate("/cart", { replace: true });
    }, [location.search, dispatch, navigate]);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const shipping = items.reduce((sum, i) => sum + (Number(i.shippingCost) || 0) * i.quantity, 0);

    // Refresh price and per-size stock for every line from the database on load
    useEffect(() => {
        if (items.length === 0) return;

        const syncStock = async () => {
            const ids = [...new Set(items.map((i) => i._id))];
            const results = await Promise.all(ids.map(async (id) => {
                try {
                    const { data } = await API.get(`/products/${id}`);
                    return [id, data];
                } catch (err) {
                    return [id, err.response?.status === 404 ? null : undefined];
                }
            }));
            const byId = new Map(results);
            const updates = items.map((item) => {
                const product = byId.get(item._id);
                if (product === null) return { id: item._id, size: item.size, deleted: true };
                if (!product) return null;
                return {
                    id: item._id,
                    size: item.size,
                    stock: stockForSize(product, item.size),
                    price: product.price,
                    shippingCost: product.shippingCost || 0,
                    name: product.name,
                    sizes: product.sizes || [],
                };
            }).filter(Boolean);
            if (updates.length > 0) dispatch(updateCartStocks(updates));
        };

        syncStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check if any item has stock issues
    const hasStockIssues = items.some((item) => {
        const stock = Number.isFinite(item.stock) ? item.stock : 0;
        return stock === 0 || item.quantity > stock;
    });

    const [placingOrder, setPlacingOrder] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");

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
        if (addresses[idx]?.isDefault && updatedAddresses.length > 0) {
            updatedAddresses[0] = { ...updatedAddresses[0], isDefault: true };
        }
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
        if (placingOrder) return;
        setCheckoutError("");
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
        if (!/^\d{10}$/.test(selectedAddress.phone)) {
            dispatch(showAlert({ title: "Invalid Address Data", message: "The selected address contains an invalid phone number. It must be exactly 10 digits." }));
            return;
        }
        if (!/^\d{6}$/.test(selectedAddress.pincode)) {
            dispatch(showAlert({ title: "Invalid Address Data", message: "The selected address contains an invalid pincode. It must be exactly 6 digits and numeric only." }));
            return;
        }

        setPlacingOrder(true);
        let razorpayOrderId = null;
        try {
            // The server prices everything from the database; we only send what was chosen
            const { data } = await API.post("/payment/razorpay/order", {
                shippingAddress: selectedAddress,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                items: items.map((i) => ({ productId: i._id, quantity: i.quantity, size: i.size || "" })),
            });
            razorpayOrderId = data.orderId;

            // Prices may have changed since the items were added: confirm the real amount first
            const displayedTotal = subtotal - actualDiscount + shipping;
            if (data.summary && Math.round(data.summary.total) !== Math.round(displayedTotal)) {
                const proceed = await confirm(
                    `Prices were updated since you added these items. Your new total is ₹${data.summary.total.toLocaleString("en-IN")} (was ₹${displayedTotal.toLocaleString("en-IN")}). Continue to payment?`
                );
                if (!proceed) {
                    await API.post("/payment/razorpay/cancel", { razorpayOrderId }).catch(() => {});
                    dispatch(updateCartStocks((data.items || []).map((line) => ({
                        id: String(line.productId),
                        size: line.size,
                        price: line.price,
                        stock: items.find((i) => i._id === String(line.productId) && (i.size || "") === line.size)?.stock,
                    }))));
                    setPlacingOrder(false);
                    return;
                }
            }

            await initiateRazorpayPayment({
                orderId: data.orderId,
                amount: data.amount,
                currency: data.currency,
                prefill: { name: user.name, email: user.email, contact: selectedAddress.phone },
                onSuccess: async (response) => {
                    try {
                        const verifyRes = await API.post("/payment/razorpay/verify", response);
                        dispatch(clearCart());
                        navigate("/payment-success", { state: { orderId: verifyRes.data.orderId, invoiceNumber: verifyRes.data.invoiceNumber } });
                    } catch (err) {
                        if (err.response?.status === 409) {
                            dispatch(clearCart());
                            dispatch(showAlert({ title: "Order Cancelled", message: apiErrorMessage(err) }));
                        } else {
                            // The payment went through; the server also confirms it via the Razorpay webhook
                            dispatch(showAlert({
                                title: "Payment Received",
                                message: "Your payment was received but we could not confirm it just now. It will appear in your orders within a few minutes. Please do not pay again.",
                            }));
                        }
                        navigate("/orders");
                    } finally {
                        setPlacingOrder(false);
                    }
                },
                onDismiss: () => {
                    API.post("/payment/razorpay/cancel", { razorpayOrderId }).catch(() => {});
                    setPlacingOrder(false);
                },
                onFailure: (message) => setCheckoutError(message),
            });
        } catch (err) {
            setCheckoutError(apiErrorMessage(err, "Could not start checkout. Please try again."));
            setPlacingOrder(false);
        }
    };

    const inputClass = "w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[15px] px-4 py-2.5 outline-none focus:border-primary dark:focus:border-sign focus:shadow-[3px_3px_0_#33357f] dark:focus:shadow-[3px_3px_0_#f2cf3e] transition-shadow";
    const labelClass = "block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5";
    const hintClass = "text-[12px] text-slate-600 dark:text-slate-400 mt-1";
    const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
    const total = subtotal - actualDiscount + shipping;

    if (items.length === 0) {
        return (
            <main id="main-content" className="bg-slate-50 dark:bg-[#111238] min-h-[70vh]">
                <div className="page-wrap py-20 sm:py-28 flex flex-col items-center text-center">
                    {/* an empty rail: the bag is the customer's own rack */}
                    <div className="hang-rail w-full max-w-md text-slate-400 dark:text-slate-500" aria-hidden="true">
                        <div className="rail-rod" />
                        <Hanger className="hanger hang-settle" />
                        <Hanger className="hanger hang-settle [animation-delay:0.15s]" />
                        <Hanger className="hanger hang-settle [animation-delay:0.3s]" />
                    </div>
                    <h1 className="mt-10 display text-[40px] sm:text-[60px] text-slate-900 dark:text-white">Your bag is empty</h1>
                    <p className="mt-4 text-[17px] text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                        Nothing on your hangers yet. Both racks are open.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                        <Link to="/shirts" className="btn-buy">Shop shirts</Link>
                        <Link to="/trousers" className="btn-primary">Shop trousers</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main id="main-content" className="page-wrap py-10 sm:py-14">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 min-h-[44px] text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                        <HiOutlineArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                    </button>
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
                    <ol className="flex items-center gap-2 text-[15px]">
                        <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-sign transition-colors">Home</Link></li>
                        <li className="text-slate-300 dark:text-slate-600" aria-hidden="true">/</li>
                        <li className="text-slate-900 dark:text-white font-semibold" aria-current="page">Your bag</li>
                    </ol>
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
                    <div>
                        <h1 className="display text-[44px] sm:text-[68px] text-slate-900 dark:text-white">Your bag</h1>
                        <p className="text-[16px] text-slate-600 dark:text-slate-400 mt-2">
                            <span className="price-tag text-[15px] mr-2">{totalItems}</span>
                            piece{totalItems !== 1 ? "s" : ""} ready to bill
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative" ref={addMenuRef}>
                            <button
                                type="button"
                                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                                onKeyDown={(e) => e.key === "Escape" && setAddDropdownOpen(false)}
                                className="flex items-center gap-2 min-h-[44px] px-4 border-2 border-ink dark:border-slate-500 text-slate-900 dark:text-white hover:bg-sign hover:text-ink text-[14px] font-extrabold transition-colors active:translate-y-px"
                                aria-expanded={addDropdownOpen}
                                aria-haspopup="true"
                            >
                                <HiOutlinePlus className="w-4 h-4" aria-hidden="true" /> Add more pieces
                            </button>
                            <AnimatePresence>
                                {addDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-500 shadow-[4px_4px_0_var(--hard-shadow)] z-50"
                                    >
                                        {[["/shirts", "Shirts rack"], ["/trousers", "Trousers rack"]].map(([to, label]) => (
                                            <Link key={to} to={to} onClick={() => setAddDropdownOpen(false)} className="flex items-center min-h-[44px] px-4 text-[14px] font-bold text-slate-900 dark:text-white hover:bg-sign hover:text-ink">
                                                {label}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                if (await confirm("Take every piece out of your bag?")) dispatch(clearCart());
                            }}
                            className="flex items-center gap-2 min-h-[44px] px-4 border-2 border-hot text-hot dark:text-rose-400 dark:border-rose-400 hover:bg-hot hover:text-white dark:hover:text-white text-[14px] font-extrabold transition-colors active:translate-y-px"
                        >
                            <HiOutlineTrash className="w-4 h-4" aria-hidden="true" /> Empty bag
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
                    <div className="flex-1 min-w-0 space-y-10">
                        {/* Pieces */}
                        <ul className="bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-600 divide-y-2 divide-slate-200 dark:divide-slate-700" aria-label="Pieces in your bag">
                            {items.map((item) => (
                                <li key={`${item._id}-${item.size || ""}`} className="flex gap-3 sm:gap-5 p-3 sm:p-6">
                                    <Link to={`/product/${item._id}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                                        <img src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl} alt="" width="110" height="140" className="w-[85px] h-[110px] sm:w-[110px] sm:h-[140px] object-cover object-top border-2 border-ink dark:border-slate-600 bg-slate-50" />
                                    </Link>

                                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                                        <div>
                                            <Link to={`/product/${item._id}`} className="text-[15px] sm:text-[17px] font-bold text-slate-900 dark:text-white hover:text-primary dark:hover:text-sign transition-colors line-clamp-2">
                                                {item.name}
                                            </Link>
                                            <p className="mt-1.5 flex flex-wrap gap-1.5 text-[13px]">
                                                {item.size && <span className="px-2 py-0.5 border-2 border-ink dark:border-slate-500 font-black text-slate-900 dark:text-white">Size {item.size}</span>}
                                                {item.fabric && <span className="px-2 py-0.5 text-slate-600 dark:text-slate-400 font-semibold">{item.fabric}</span>}
                                                {item.style && <span className="px-2 py-0.5 text-slate-600 dark:text-slate-400 font-semibold">{item.style}</span>}
                                            </p>
                                            {item.stock !== undefined && item.stock === 0 ? (
                                                <p className="mt-2 w-fit text-[12px] font-extrabold uppercase bg-hot text-white px-2 py-1">Sold out: remove it to pay</p>
                                            ) : item.stock !== undefined && item.quantity > item.stock ? (
                                                <p className="mt-2 w-fit text-[12px] font-extrabold uppercase border-2 border-hot text-hot dark:text-rose-400 dark:border-rose-400 px-2 py-0.5">Only {item.stock} left: lower the quantity</p>
                                            ) : item.stock !== undefined && item.stock <= 5 ? (
                                                <p className="mt-2 w-fit text-[12px] font-extrabold uppercase text-hot dark:text-rose-400">Only {item.stock} left</p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between mt-3 sm:mt-4 gap-3">
                                            <div className="flex items-center border-2 border-ink dark:border-slate-500 bg-white dark:bg-slate-900 h-11" role="group" aria-label={`Quantity of ${item.name}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (item.quantity === 1) dispatch(removeFromCart({ id: item._id, size: item.size }));
                                                        else dispatch(updateQuantity({ id: item._id, size: item.size, quantity: item.quantity - 1 }));
                                                    }}
                                                    className="w-11 h-full flex items-center justify-center text-slate-900 dark:text-white hover:bg-sign hover:text-ink transition-colors"
                                                    aria-label={item.quantity === 1 ? "Remove from bag" : "Decrease quantity"}
                                                >
                                                    <HiMinus className="w-4 h-4" aria-hidden="true" />
                                                </button>
                                                <span className="min-w-[40px] h-full flex items-center justify-center text-[16px] font-black tabular-nums text-slate-900 dark:text-white border-x-2 border-ink dark:border-slate-500" aria-live="polite">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={item.quantity >= Math.min(item.stock || 0, MAX_QTY_PER_LINE)}
                                                    onClick={() => dispatch(updateQuantity({ id: item._id, size: item.size, quantity: item.quantity + 1 }))}
                                                    className="w-11 h-full flex items-center justify-center text-slate-900 dark:text-white hover:bg-sign hover:text-ink transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                                                    aria-label="Increase quantity"
                                                >
                                                    <HiPlus className="w-4 h-4" aria-hidden="true" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 ml-auto">
                                                <span className="price-tag text-[16px] sm:text-[19px]">{inr(item.price * item.quantity)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch(removeFromCart({ id: item._id, size: item.size }))}
                                                    className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-hot transition-colors shrink-0"
                                                    aria-label={`Remove ${item.name} from bag`}
                                                >
                                                    <HiOutlineTrash className="w-5 h-5" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Delivery address */}
                        {user ? (
                            <section aria-labelledby="address-heading" className="bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-600 p-5 sm:p-8">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                    <h2 id="address-heading" className="flex items-center gap-2.5 text-[22px] font-black text-slate-900 dark:text-white">
                                        <HiOutlineHome className="w-6 h-6 text-primary dark:text-sign" aria-hidden="true" />
                                        {editAddressIdx !== null ? "Edit address" : "Deliver to"}
                                    </h2>
                                    {!showForm && (
                                        <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink dark:border-slate-500 text-[14px] font-extrabold text-slate-900 dark:text-white hover:bg-sign hover:text-ink active:translate-y-px">
                                            <HiOutlinePlus className="w-4 h-4" aria-hidden="true" /> New address
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
                                                    <label htmlFor="addr-name" className={labelClass}>Recipient name</label>
                                                    <input id="addr-name" type="text" autoComplete="name" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} placeholder="Full name" required className={inputClass} />
                                                </div>
                                                <div>
                                                    <label htmlFor="addr-phone" className={labelClass}>Phone number</label>
                                                    <input id="addr-phone" type="tel" autoComplete="tel-national" inputMode="numeric" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="10-digit number" required className={inputClass} />
                                                    <p className={hintClass}>Exactly 10 digits.</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="addr-street" className={labelClass}>Street address</label>
                                                <input id="addr-street" type="text" autoComplete="street-address" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} placeholder="Flat / house no., street, area" required className={inputClass} />
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div>
                                                    <label htmlFor="addr-city" className={labelClass}>City</label>
                                                    <input id="addr-city" type="text" autoComplete="address-level2" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" required className={inputClass} />
                                                </div>
                                                <div>
                                                    <label htmlFor="addr-state" className={labelClass}>State</label>
                                                    <input id="addr-state" type="text" autoComplete="address-level1" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" required className={inputClass} />
                                                </div>
                                                <div>
                                                    <label htmlFor="addr-pin" className={labelClass}>Pin code</label>
                                                    <input id="addr-pin" type="text" autoComplete="postal-code" inputMode="numeric" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} placeholder="6 digits" required className={inputClass} />
                                                </div>
                                                <div>
                                                    <label htmlFor="addr-country" className={labelClass}>Country</label>
                                                    <input id="addr-country" type="text" autoComplete="country-name" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} placeholder="Country" required className={inputClass} />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                {addresses.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowForm(false); setEditAddressIdx(null); setAddressForm({ name: "", phone: "", street: "", city: "", state: "", pincode: "", country: "India" }); }}
                                                        className="min-h-[44px] px-5 text-[14px] font-extrabold border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-ink dark:hover:border-sign"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button type="submit" disabled={savingAddress} className="btn-primary text-[14px]">
                                                    {savingAddress ? "Saving..." : "Save address"}
                                                </button>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <fieldset className="space-y-3">
                                            <legend className="sr-only">Choose a delivery address</legend>
                                            {addresses.map((addr, idx) => {
                                                const picked = selectedIdx === idx;
                                                return (
                                                    <div key={idx} className={`relative border-2 transition-colors ${picked ? "border-ink dark:border-sign bg-sign/25 dark:bg-sign/10 shadow-[4px_4px_0_var(--hard-shadow)]" : "border-slate-300 dark:border-slate-600 hover:border-ink dark:hover:border-slate-400"}`}>
                                                        <label className="flex gap-4 p-4 sm:p-5 pr-28 cursor-pointer break-words">
                                                            <input type="radio" name="delivery-address" checked={picked} onChange={() => setSelectedIdx(idx)} className="mt-1 w-5 h-5 shrink-0 accent-primary dark:accent-[#f2cf3e]" />
                                                            <span className="space-y-1 min-w-0">
                                                                <span className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-black text-slate-900 dark:text-white text-[16px] break-words min-w-0">{addr.name}</span>
                                                                    {addr.isDefault && <span className="text-[11px] font-black uppercase px-1.5 py-0.5 bg-ink text-sign">Default</span>}
                                                                </span>
                                                                <span className="block text-slate-700 dark:text-slate-300 text-[14px] leading-relaxed">
                                                                    {addr.street}<br />{addr.city}, {addr.state} {addr.pincode}<br />{addr.country}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[13px] pt-1">
                                                                    <HiOutlinePhone className="w-4 h-4" aria-hidden="true" />{addr.phone}
                                                                </span>
                                                            </span>
                                                        </label>
                                                        <div className="absolute top-2 right-2 flex items-center">
                                                            <button type="button" onClick={(e) => handleEditAddressClick(e, idx)} className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-ink hover:bg-sign" aria-label={`Edit address for ${addr.name}`}>
                                                                <HiOutlinePencil className="w-4 h-4" aria-hidden="true" />
                                                            </button>
                                                            <button type="button" onClick={(e) => handleDeleteAddress(e, idx)} className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-hot" aria-label={`Delete address for ${addr.name}`}>
                                                                <HiOutlineTrash className="w-4 h-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </fieldset>
                                    )}
                                </AnimatePresence>
                            </section>
                        ) : (
                            <section className="board border-2 border-ink p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                <div className="flex items-start gap-4">
                                    <HiOutlineUser className="w-10 h-10 text-sign shrink-0" aria-hidden="true" />
                                    <div>
                                        <h2 className="text-[20px] font-black">Sign in to check out</h2>
                                        <p className="mt-1 text-[15px] text-white/90 max-w-sm">We need an account to save your delivery address and send your bill.</p>
                                    </div>
                                </div>
                                <Link to="/login?redirect=cart" className="btn-buy shrink-0">Sign in to continue</Link>
                            </section>
                        )}
                    </div>

                    {/* The bill */}
                    <aside aria-labelledby="bill-heading" className="lg:w-[400px] shrink-0">
                        <div className="lg:sticky lg:top-32">
                            <Receipt>
                                <ReceiptHead />
                                <h2 id="bill-heading" className="mt-3 text-center text-[13px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Your bill</h2>
                                <ReceiptRule />
                                <dl className="flex flex-col gap-2.5">
                                    <ReceiptLine label={`${totalItems} piece${totalItems !== 1 ? "s" : ""}`} value={inr(subtotal)} />
                                    {appliedCoupon && <ReceiptLine label={`Coupon ${appliedCoupon.code}`} value={`- ${inr(actualDiscount)}`} tone="text-emerald" />}
                                    <ReceiptLine label="Delivery" value={shipping === 0 ? "Free" : inr(shipping)} tone={shipping === 0 ? "text-emerald" : ""} />
                                </dl>

                                <ReceiptRule />
                                <div>
                                    <label htmlFor="coupon-code" className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">Coupon code</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="coupon-code"
                                            type="text"
                                            placeholder="e.g. FESTIVE10"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !appliedCoupon) { e.preventDefault(); handleApplyCoupon(); } }}
                                            disabled={appliedCoupon || applyingCoupon}
                                            className={`${inputClass} flex-1 min-w-0 uppercase tracking-[0.06em] font-bold disabled:opacity-60`}
                                        />
                                        {appliedCoupon ? (
                                            <button type="button" onClick={handleRemoveCoupon} className="min-h-[44px] px-4 font-extrabold border-2 border-hot text-hot dark:text-rose-400 dark:border-rose-400 hover:bg-hot hover:text-white">Remove</button>
                                        ) : (
                                            <button type="button" onClick={() => handleApplyCoupon()} disabled={applyingCoupon || !couponInput.trim()} className="btn-primary px-5">
                                                {applyingCoupon ? "..." : "Apply"}
                                            </button>
                                        )}
                                    </div>
                                    {couponError && <p role="alert" className="text-hot dark:text-rose-400 text-[13px] font-bold mt-2">{couponError}</p>}
                                    {couponSuccess && <p role="status" className="text-emerald text-[13px] font-bold mt-2">{couponSuccess}</p>}

                                    {availableCoupons.length > 0 && (
                                        <div className="mt-3">
                                            <button type="button" onClick={() => setShowCoupons(!showCoupons)} aria-expanded={showCoupons} className="min-h-[44px] text-[14px] font-extrabold text-primary dark:text-sign underline underline-offset-4 hover:no-underline">
                                                {showCoupons ? "Hide coupons" : `See ${availableCoupons.length} coupon${availableCoupons.length !== 1 ? "s" : ""} for you`}
                                            </button>
                                            <AnimatePresence>
                                                {showCoupons && (
                                                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-2">
                                                        {availableCoupons.map((c) => {
                                                            const isMinMet = subtotal >= c.minOrderValue;
                                                            return (
                                                                <li key={c._id} className={`p-3 border-2 border-dashed text-[13px] flex items-center justify-between gap-3 ${isMinMet ? "border-ink dark:border-slate-400" : "border-slate-300 dark:border-slate-600 opacity-70"}`}>
                                                                    <div className="min-w-0">
                                                                        <p className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-black text-[12px] bg-sign text-ink px-1.5 py-0.5 border-2 border-ink tracking-[0.06em]">{c.code}</span>
                                                                            <span className="font-extrabold text-slate-900 dark:text-white">{c.discountType === "percentage" ? `${c.discountValue}% off` : `${inr(c.discountValue)} off`}</span>
                                                                        </p>
                                                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-1">On bills over {inr(c.minOrderValue)}{!isMinMet ? `: add ${inr(c.minOrderValue - subtotal)} more` : ""}</p>
                                                                    </div>
                                                                    {isMinMet && !appliedCoupon && (
                                                                        <button type="button" onClick={() => handleApplyCoupon(c.code)} className="min-h-[44px] px-3 font-extrabold text-primary dark:text-sign underline underline-offset-4 hover:no-underline shrink-0">Apply</button>
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </motion.ul>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>

                                <ReceiptRule />
                                <dl><ReceiptLine label="To pay" value={inr(total)} strong /></dl>
                                {actualDiscount > 0 && <p className="mt-1 text-right text-[13px] font-extrabold text-emerald">You save {inr(actualDiscount)} with the coupon</p>}

                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    disabled={hasStockIssues || placingOrder}
                                    className="btn-buy w-full mt-6 text-[17px] py-4"
                                >
                                    {hasStockIssues ? "Fix the bag to pay" : placingOrder ? "Opening payment..." : `Pay ${inr(total)}`}
                                </button>
                                {checkoutError && <p role="alert" className="text-hot dark:text-rose-400 text-[13px] font-bold mt-3 text-center">{checkoutError}</p>}
                                {hasStockIssues && (
                                    <p className="mt-3 text-[13px] font-bold text-hot dark:text-rose-400 text-center">Some pieces are sold out or over the stock left. Remove or adjust them above.</p>
                                )}
                                <p className="mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                                    <HiOutlineShieldCheck className="w-4 h-4" aria-hidden="true" />
                                    Paid through Razorpay: UPI, cards, wallets
                                </p>
                            </Receipt>
                        </div>
                    </aside>
                </div>
            </motion.div>
        </main>
    );
}
