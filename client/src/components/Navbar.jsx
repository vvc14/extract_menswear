import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { resetCart } from "../redux/cartSlice";
import { resetWishlist } from "../redux/wishlistSlice";
import { useTheme } from "../context/ThemeContext";
import {
    HiOutlineShoppingCart, HiOutlineMenu, HiOutlineX,
    HiOutlineUser, HiOutlineChevronDown, HiOutlineLogout, HiOutlineShieldCheck,
    HiOutlineSun, HiOutlineMoon, HiOutlineHeart
} from "react-icons/hi";
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
    const { isDark, toggleTheme } = useTheme();
    const cartCount = useSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
    const wishlistCount = useSelector((s) => s.wishlist.items.length);
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
        dispatch(resetWishlist());
        setUserMenuOpen(false);
        navigate("/");
    };

    return (
        <>
            <a href="#main-content" className="skip-link">Skip to main content</a>

            <nav
                role="navigation"
                aria-label="Main navigation"
                className={`sticky top-0 z-50 transition-all duration-300 bg-white dark:bg-[#0d1321] ${scrolled
                    ? "shadow-md shadow-black/[0.06] dark:shadow-black/30 border-b border-slate-100 dark:border-slate-800"
                    : "border-b border-slate-100 dark:border-slate-800"
                    }`}
            >
                {/* Announcement bar */}
                <div className="bg-slate-900 dark:bg-slate-950 overflow-hidden" style={{ height: "36px" }}>
                    <div className="flex items-center justify-between h-full page-wrap">
                        <div className="flex-1 overflow-hidden relative" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 2%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 2%, black 90%, transparent 100%)" }}>
                            <div className="marquee-track">
                                {[...Array(4)].map((_, i) => (
                                    <span key={i} className="text-[12px] sm:text-[13px] font-medium tracking-wide text-slate-400 whitespace-nowrap mx-12">
                                        ✦ Free Shipping on Orders Above ₹999 &nbsp; 🛡️ 100% Secure Payments &nbsp;&nbsp;&nbsp; 🔄 7-Day Easy Returns &nbsp;&nbsp;&nbsp; 🚚 Pan-India Delivery &nbsp;
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-5 text-[12px] text-slate-500 shrink-0 ml-10 pl-4 border-l border-slate-700">
                            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
                            <span className="text-slate-700">|</span>
                            <Link to="/contact" className="hover:text-white transition-colors">Help</Link>
                        </div>
                    </div>
                </div>

                {/* Main nav */}
                <div className="bg-white dark:bg-[#0d1321] transition-colors duration-300">
                    <div className="page-wrap">
                        <div className="flex items-center justify-between" style={{ height: "72px" }}>

                            {/* Logo */}
                            <Link to="/" className="shrink-0 flex items-center gap-2" aria-label="Extract Menswear Home">
                                <img src="/images/logo.png" alt="Extract Menswear" className="h-[46px] w-auto object-contain" />
                            </Link>

                            {/* Desktop nav links */}
                            <div className="hidden lg:flex items-center gap-1">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`relative px-5 py-2.5 text-[15px] font-semibold rounded-lg transition-colors ${pathname === link.to
                                            ? "text-slate-900 dark:text-white"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        {link.label}
                                        {pathname === link.to && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                                                style={{ background: "#c9a84c" }}
                                                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                                            />
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {/* Right actions */}
                            <div className="flex items-center gap-1">

                                {/* Theme toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="theme-toggle"
                                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    <AnimatePresence mode="wait">
                                        {isDark ? (
                                            <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                                <HiOutlineSun className="w-5 h-5" />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                                <HiOutlineMoon className="w-5 h-5" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>

                                {/* User / Account */}
                                {isLoggedIn ? (
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            aria-expanded={userMenuOpen}
                                            aria-label="Account menu"
                                        >
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white"
                                                style={{ background: "linear-gradient(135deg,#1a2744,#2a3f6e)" }}>
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="hidden sm:block text-[15px] font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                                                {displayName.split(" ")[0]}
                                            </span>
                                            <HiOutlineChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        <AnimatePresence>
                                            {userMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden z-50"
                                                >
                                                    <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
                                                        <p className="text-[15px] font-bold text-slate-900 dark:text-white">{displayName}</p>
                                                        <p className="text-[13px] text-slate-400 truncate">{user?.email || admin?.username}</p>
                                                    </div>
                                                    <div className="py-2">
                                                        {admin && (
                                                            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                                <HiOutlineShieldCheck className="w-4 h-4 text-slate-400" />
                                                                Admin Dashboard
                                                            </Link>
                                                        )}
                                                        {user?.role === "admin" && (
                                                            <Link to="/admin/login" className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                                <HiOutlineShieldCheck className="w-4 h-4 text-slate-400" />
                                                                Admin Panel
                                                            </Link>
                                                        )}
                                                        <button
                                                            onClick={handleLogout}
                                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
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
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        aria-label="Sign in"
                                    >
                                        <HiOutlineUser className="w-[20px] h-[20px] text-slate-600 dark:text-slate-400" />
                                        <span className="hidden sm:block text-[15px] font-semibold text-slate-600 dark:text-slate-400">Sign In</span>
                                    </Link>
                                )}

                                {/* Wishlist */}
                                <Link
                                    to="/wishlist"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    aria-label={`Wishlist, ${wishlistCount} items`}
                                >
                                    <span className="relative">
                                        <HiOutlineHeart className="w-[20px] h-[20px] text-slate-700 dark:text-slate-300" />
                                        {wishlistCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-2 text-white text-[9px] font-extrabold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm"
                                                style={{ background: "#f43f5e" }}
                                            >
                                                {wishlistCount}
                                            </motion.span>
                                        )}
                                    </span>
                                </Link>

                                {/* Cart */}
                                <Link
                                    to="/cart"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    aria-label={`Shopping cart, ${cartCount} items`}
                                >
                                    <span className="relative">
                                        <HiOutlineShoppingCart className="w-[20px] h-[20px] text-slate-700 dark:text-slate-300" />
                                        {cartCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-2 text-white text-[9px] font-extrabold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm"
                                                style={{ background: "#c9a84c" }}
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </span>
                                    <span className="hidden sm:block text-[15px] font-semibold text-slate-600 dark:text-slate-400">Cart</span>
                                </Link>

                                {/* Mobile toggle */}
                                <button
                                    onClick={() => setMobileOpen(!mobileOpen)}
                                    className="lg:hidden p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ml-1"
                                    aria-expanded={mobileOpen}
                                    aria-label="Toggle menu"
                                >
                                    {mobileOpen
                                        ? <HiOutlineX className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                        : <HiOutlineMenu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                    }
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
                            transition={{ duration: 0.22 }}
                            className="lg:hidden overflow-hidden bg-white dark:bg-[#0d1321] border-b border-slate-100 dark:border-slate-800"
                        >
                            <div className="px-4 py-4 space-y-1">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`block px-4 py-3 rounded-xl text-[16px] font-semibold transition-colors ${pathname === link.to
                                            ? "text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                            }`}
                                        style={pathname === link.to ? { borderLeft: "3px solid #c9a84c", paddingLeft: "1.25rem" } : {}}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {!isLoggedIn && (
                                    <Link
                                        to="/login"
                                        className="block px-4 py-3 rounded-xl text-[15px] font-bold transition-colors sm:hidden"
                                        style={{ color: "#1a2744", background: "#e8ecf5" }}
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
