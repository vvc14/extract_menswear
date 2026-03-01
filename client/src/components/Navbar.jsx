import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { resetCart } from "../redux/cartSlice";
import { HiOutlineShoppingCart, HiOutlineMenu, HiOutlineX, HiOutlineUser, HiOutlineChevronDown, HiOutlineLogout, HiOutlineShieldCheck } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
    { to: "/", label: "Home" },
    { to: "/shirts", label: "Shirts" },
    { to: "/trousers", label: "Trousers" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cartCount = useSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
    const user = useSelector((s) => s.auth.user);
    const admin = useSelector((s) => s.auth.admin);
    const isLoggedIn = !!(user || admin);
    const displayName = user?.name || admin?.username || "";
    const menuRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetCart());
        setUserMenuOpen(false);
        navigate("/");
    };

    return (
        <>
            <a href="#main-content" className="skip-link">Skip to main content</a>

            <nav
                role="navigation"
                aria-label="Main navigation"
                className={`sticky top-0 z-50 transition-all duration-300 bg-white ${scrolled ? "shadow-lg shadow-black/5" : ""}`}
            >
                {/* Announcement bar */}
                <div className="bg-slate-900">
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between h-8">
                        <p className="text-[12px] sm:text-[13px] font-medium tracking-wide text-slate-300">
                            Free Shipping on Orders Above ₹999
                        </p>
                        <div className="hidden sm:flex items-center gap-5 text-[12px] text-slate-400">
                            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
                            <Link to="/contact" className="hover:text-white transition-colors">Help</Link>
                        </div>
                    </div>
                </div>

                {/* Main nav bar */}
                <div className="border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                        <div className="flex items-center justify-between h-[60px] sm:h-[64px]">
                            {/* Logo */}
                            <Link to="/" className="shrink-0 flex items-center gap-2" aria-label="Extract Menswear Home">
                                <img src="/images/logo.png" alt="Extract Menswear" className="h-[44px] w-auto object-contain" />
                            </Link>

                            {/* Desktop nav */}
                            <div className="hidden lg:flex items-center gap-2">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`relative px-5 py-2 text-[16px] font-semibold transition-colors rounded-lg ${pathname === link.to ? "text-primary" : "text-slate-500 hover:text-slate-900"
                                            }`}
                                    >
                                        {link.label}
                                        {pathname === link.to && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full"
                                                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                                            />
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {/* Right actions */}
                            <div className="flex items-center gap-1 sm:gap-2">
                                {/* User / Account */}
                                {isLoggedIn ? (
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                            aria-expanded={userMenuOpen}
                                            aria-label="Account menu"
                                        >
                                            <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-[12px] font-extrabold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <span className="hidden sm:block text-[15px] font-semibold text-slate-700 max-w-[100px] truncate">
                                                {displayName.split(" ")[0]}
                                            </span>
                                            <HiOutlineChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {/* Dropdown */}
                                        <AnimatePresence>
                                            {userMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden z-50"
                                                >
                                                    {/* User info */}
                                                    <div className="px-4 py-3 border-b border-slate-100">
                                                        <p className="text-[16px] font-bold text-slate-900">{displayName}</p>
                                                        <p className="text-[14px] text-slate-400 truncate">{user?.email || admin?.username}</p>
                                                    </div>

                                                    <div className="py-1.5">
                                                        {admin && (
                                                            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                                                <HiOutlineShieldCheck className="w-4 h-4 text-slate-400" />
                                                                Admin Dashboard
                                                            </Link>
                                                        )}
                                                        {user?.role === "admin" && (
                                                            <Link to="/admin/login" className="flex items-center gap-3 px-4 py-2.5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                                                <HiOutlineShieldCheck className="w-4 h-4 text-slate-400" />
                                                                Admin Panel
                                                            </Link>
                                                        )}
                                                        <button
                                                            onClick={handleLogout}
                                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[15px] font-semibold text-rose hover:bg-rose/5 transition-colors"
                                                        >
                                                            <HiOutlineLogout className="w-4 h-4" />
                                                            Sign Out
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                        aria-label="Sign in"
                                    >
                                        <HiOutlineUser className="w-[20px] h-[20px] text-slate-700" />
                                        <span className="hidden sm:block text-[15px] font-semibold text-slate-600">Sign In</span>
                                    </Link>
                                )}

                                {/* Cart */}
                                <Link
                                    to="/cart"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                    aria-label={`Shopping cart, ${cartCount} items`}
                                >
                                    <span className="relative">
                                        <HiOutlineShoppingCart className="w-[21px] h-[21px] text-slate-700" />
                                        {cartCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-extrabold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm"
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </span>
                                    <span className="hidden sm:block text-[15px] font-semibold text-slate-600">Cart</span>
                                </Link>

                                {/* Mobile menu toggle */}
                                <button
                                    onClick={() => setMobileOpen(!mobileOpen)}
                                    className="lg:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                    aria-expanded={mobileOpen}
                                    aria-label="Toggle menu"
                                >
                                    {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="lg:hidden overflow-hidden bg-white border-b border-slate-100"
                        >
                            <div className="px-5 py-3 space-y-0.5">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`block px-4 py-3 rounded-lg text-[17px] font-semibold transition-colors ${pathname === link.to ? "text-primary bg-primary-light" : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {!isLoggedIn && (
                                    <Link
                                        to="/login"
                                        className="block px-4 py-3 rounded-lg text-[15px] font-semibold text-primary hover:bg-primary-light sm:hidden"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}
