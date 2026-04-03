import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity, clearCart } from "../redux/cartSlice";
import { useNavigate, Link } from "react-router-dom";
import { initiateRazorpayPayment } from "../services/razorpay";
import API from "../services/api";
import { HiOutlineTrash, HiMinus, HiPlus, HiOutlineShoppingCart, HiOutlineShieldCheck } from "react-icons/hi";
import { motion } from "framer-motion";

export default function Cart() {
    const items = useSelector((s) => s.cart.items);
    const user = useSelector((s) => s.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    const handleCheckout = async () => {
        if (!user) {
            navigate("/login?redirect=cart");
            return;
        }
        try {
            const { data } = await API.post("/payment/razorpay/order", {
                amount: subtotal,
                items: items.map((i) => ({
                    productId: i._id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                })),
            });

            await initiateRazorpayPayment({
                orderId: data.orderId,
                amount: data.amount,
                currency: data.currency,
                onSuccess: async (response) => {
                    await API.post("/payment/razorpay/verify", response);
                    dispatch(clearCart());
                    navigate("/payment-success");
                },
                onFailure: () => { },
            });
        } catch { }
    };

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
                    <Link to="/shirts" className="btn-primary">
                        Continue Shopping
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
                        <li className="text-slate-900 dark:text-white font-semibold">Shopping Cart</li>
                    </ol>
                </nav>

                <h1 className="text-[30px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Shopping Cart</h1>
                <p className="text-[16px] text-slate-500 dark:text-slate-400 mb-10">{totalItems} item{totalItems !== 1 ? "s" : ""} in your cart</p>

                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
                    {/* Cart items */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                            {items.map((item) => (
                                <div key={item._id} className="flex gap-5 p-5 sm:p-7">
                                    {/* Image */}
                                    <Link to={`/product/${item._id}`} className="shrink-0">
                                        <div className="w-[90px] h-[110px] sm:w-[110px] sm:h-[140px] bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                                        <div>
                                            <Link to={`/product/${item._id}`} className="text-[16px] sm:text-[18px] font-semibold text-slate-900 dark:text-white hover:text-primary dark:hover:text-gold transition-colors line-clamp-2">
                                                {item.name}
                                            </Link>
                                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">
                                                {item.fabric && item.fabric}{item.style && ` · ${item.style}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 gap-3">
                                            {/* Quantity */}
                                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                                                    className="px-3 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <HiMinus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="px-3 py-2 text-[16px] font-bold text-slate-900 dark:text-white min-w-[36px] text-center border-x border-slate-200 dark:border-slate-700">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                                                    className="px-3 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    aria-label="Increase quantity"
                                                >
                                                    <HiPlus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <p className="text-[18px] sm:text-[20px] font-extrabold text-slate-900 dark:text-white">
                                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                            </p>

                                            {/* Delete */}
                                            <button
                                                onClick={() => dispatch(removeFromCart(item._id))}
                                                className="p-2 rounded-lg text-slate-400 hover:text-rose hover:bg-rose/10 dark:hover:bg-rose/20 transition-colors"
                                                aria-label={`Remove ${item.name} from cart`}
                                            >
                                                <HiOutlineTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="lg:w-[400px] shrink-0">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-7 sm:p-9 sticky top-[100px]">
                            <h3 className="text-[22px] font-extrabold text-slate-900 dark:text-white mb-7">Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-[16px]">
                                    <span className="text-slate-500 dark:text-slate-400">Subtotal ({totalItems} items)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-[16px]">
                                    <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                                    <span className="font-semibold text-emerald">{subtotal >= 999 ? "FREE" : "₹99"}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-5 mb-8">
                                <div className="flex justify-between">
                                    <span className="text-[18px] font-extrabold text-slate-900 dark:text-white">Total</span>
                                    <span className="text-[26px] font-extrabold text-slate-900 dark:text-white">₹{(subtotal + (subtotal >= 999 ? 0 : 99)).toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full bg-primary text-white text-[17px] font-bold py-[22px] rounded-2xl hover:bg-primary-dark transition-colors mb-5"
                            >
                                Proceed to Pay
                            </button>

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
