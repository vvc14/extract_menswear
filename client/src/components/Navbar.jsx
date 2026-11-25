import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { resetCart } from "../redux/cartSlice";
import { resetWishlist } from "../redux/wishlistSlice";
import { useTheme } from "../context/ThemeContext";
import { ADMIN_PATH } from "../config/adminPath";
import {HiOutlineShoppingBag, HiOutlineMenu, HiOutlineX, HiOutlineUser, HiOutlineChevronDown, HiOutlineLogout, HiOutlineShieldCheck, HiOutlineSun, HiOutlineMoon, HiOutlineHeart, HiOutlineClipboardList, HiOutlineSearch, HiPause, HiPlay } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import Logo, { Eagle } from "./brand/Logo";
import useShopStock, { deliveryLine } from "../hooks/useShopStock";

const NAV_LINKS = [
    { to: "/shirts", label: "Shirts" },
    { to: "/trousers", label: "Trousers" },
    { to: "/about", label: "Our Shop" },
    { to: "/contact", label: "Contact" },
];

// Each line is a real policy (Orders page enforces the 7-day window) or from the shop banner.
// The delivery line is added from live stock in the component, never hard-coded.
const TICKER = [
    "7-day returns and exchanges",
    "Wholesale and retail",
    "Pay by UPI, cards or wallets",
    "Visit us: NTR Road, Suraram Colony, Hyderabad",
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [tickerPaused, setTickerPaused] = useState(false);
    const { products: stockList } = useShopStock();
    const delivery = deliveryLine(stockList);
    const tickerLines = delivery ? [delivery.text, ...TICKER] : TICKER;
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
    const menuButtonRef = useRef(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);

    const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setSearchError(false);
            return;
        }
        let cancelled = false;
        const delayDebounce = setTimeout(async () => {
            setSearchLoading(true);
            setSearchError(false);
            try {
                const { data } = await API.get("/products", { params: { search: searchQuery.trim(), limit: 5 } });
                if (!cancelled) setSearchResults(Array.isArray(data) ? data.slice(0, 5) : []);
            } catch {
                if (!cancelled) { setSearchResults([]); setSearchError(true); }
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(delayDebounce);
        };
    }, [searchQuery]);

    useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Escape closes whichever overlay is open
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            if (searchOpen) closeSearch();
            if (userMenuOpen) { setUserMenuOpen(false); menuButtonRef.current?.focus(); }
            if (mobileOpen) setMobileOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [searchOpen, userMenuOpen, mobileOpen]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetCart());
        dispatch(resetWishlist());
        setUserMenuOpen(false);
        navigate("/");
    };

    const iconBtn = "flex items-center justify-center w-11 h-11 rounded text-white hover:text-sign hover:bg-white/10 transition-colors";

    return (
        <>
            <a href="#main-content" className="skip-link">Skip to main content</a>

            <header className="sticky top-0 z-50">
                {/* ── Ticker ── */}
                <div className={`bg-sign text-ink border-b-2 border-ink ${tickerPaused ? "marquee-paused" : ""}`}>
                    <div className="flex items-center h-9">
                        <div className="flex-1 overflow-hidden" role="region" aria-label="Store policies">
                            <div className="marquee-track">
                                {[0, 1].map((copy) => (
                                    <ul key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1 ? true : undefined}>
                                        {tickerLines.map((line) => (
                                            <li key={line} className="flex items-center gap-4 pr-4 text-[13px] font-extrabold uppercase whitespace-nowrap" style={{ fontStretch: "112%" }}>
                                                {line}
                                                <Eagle className="h-3.5 w-auto text-primary" />
                                            </li>
                                        ))}
                                    </ul>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTickerPaused((p) => !p)}
                            className="shrink-0 h-9 w-11 flex items-center justify-center border-l-2 border-ink hover:bg-ink hover:text-sign transition-colors"
                            aria-label={tickerPaused ? "Play announcements" : "Pause announcements"}
                            aria-pressed={tickerPaused}
                        >
                            {tickerPaused ? <HiPlay className="w-4 h-4" aria-hidden="true" /> : <HiPause className="w-4 h-4" aria-hidden="true" />}
                        </button>
                    </div>
                </div>

                {/* ── Signboard bar ── */}
                <nav aria-label="Main navigation" className="board border-b-2 border-ink">
                    <div className="page-wrap">
                        <div className="flex items-center justify-between gap-2 h-[68px] lg:h-[76px]">
                            <Link to="/" className="shrink-0 flex items-center" aria-label="Extract Menswear home">
                                <span className="lg:hidden"><Logo size="sm" /></span>
                                <span className="hidden lg:block"><Logo size="md" /></span>
                            </Link>

                            {/* Desktop links */}
                            <ul className="hidden lg:flex items-center gap-1 xl:gap-3 mx-6">
                                {NAV_LINKS.map((link) => {
                                    const active = pathname === link.to || pathname.startsWith(link.to + "/");
                                    return (
                                        <li key={link.to}>
                                            <Link
                                                to={link.to}
                                                aria-current={active ? "page" : undefined}
                                                className={`relative block px-3 py-2 text-[15px] font-extrabold uppercase transition-colors ${active ? "text-sign" : "text-white hover:text-sign"}`}
                                                style={{ fontStretch: "115%" }}
                                            >
                                                {link.label}
                                                {active && <span className="absolute left-3 right-3 -bottom-0.5 h-[3px] bg-sign" aria-hidden="true" />}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                <button type="button" onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search products">
                                    <HiOutlineSearch className="w-[22px] h-[22px]" aria-hidden="true" />
                                </button>

                                <button type="button" onClick={toggleTheme} className="theme-toggle hidden min-[400px]:flex" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                                    {isDark ? <HiOutlineSun className="w-[22px] h-[22px]" aria-hidden="true" /> : <HiOutlineMoon className="w-[22px] h-[22px]" aria-hidden="true" />}
                                </button>

                                <Link to="/wishlist" className={`${iconBtn} relative hidden sm:flex`} aria-label={`Wishlist, ${wishlistCount} items`}>
                                    <HiOutlineHeart className="w-[22px] h-[22px]" aria-hidden="true" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-hot text-white text-[10px] font-black flex items-center justify-center border-2 border-primary leading-none">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Account */}
                                {isLoggedIn ? (
                                    <div className="relative hidden sm:block" ref={menuRef}>
                                        <button
                                            ref={menuButtonRef}
                                            type="button"
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-1.5 h-11 px-2 rounded text-white hover:bg-white/10 transition-colors"
                                            aria-expanded={userMenuOpen}
                                            aria-haspopup="menu"
                                            aria-label={`Account menu, ${displayName}`}
                                        >
                                            <span className="w-8 h-8 flex items-center justify-center text-[14px] font-black bg-white text-primary border-2 border-ink" aria-hidden="true">
                                                {displayName.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="hidden xl:block text-[14px] font-bold max-w-[100px] truncate">{displayName.split(" ")[0]}</span>
                                            <HiOutlineChevronDown className={`hidden xl:block w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                                        </button>

                                        <AnimatePresence>
                                            {userMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.12 }}
                                                    role="menu"
                                                    className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 border-2 border-ink dark:border-black shadow-xl z-50"
                                                >
                                                    <div className="px-4 py-3 border-b-2 border-ink dark:border-black bg-sign text-ink">
                                                        <p className="text-[15px] font-black truncate">{displayName}</p>
                                                        <p className="text-[13px] font-medium truncate">{user?.email || admin?.username}</p>
                                                    </div>
                                                    <div className="py-1">
                                                        {(admin || user?.role === "admin") && (
                                                            <Link role="menuitem" to={`/${ADMIN_PATH}/dashboard`} className="flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                                                                <HiOutlineShieldCheck className="w-4 h-4" aria-hidden="true" /> Admin dashboard
                                                            </Link>
                                                        )}
                                                        {user && (
                                                            <>
                                                                <Link role="menuitem" to="/profile" className="flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                                                                    <HiOutlineUser className="w-4 h-4" aria-hidden="true" /> My profile
                                                                </Link>
                                                                <Link role="menuitem" to="/orders" className="flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                                                                    <HiOutlineClipboardList className="w-4 h-4" aria-hidden="true" /> My orders
                                                                </Link>
                                                                <Link role="menuitem" to="/wishlist" className="sm:hidden flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                                                                    <HiOutlineHeart className="w-4 h-4" aria-hidden="true" /> Wishlist ({wishlistCount})
                                                                </Link>
                                                            </>
                                                        )}
                                                        <button
                                                            role="menuitem"
                                                            type="button"
                                                            onClick={handleLogout}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                        >
                                                            <HiOutlineLogout className="w-4 h-4" aria-hidden="true" /> Sign out
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link to="/login" className="hidden sm:flex items-center gap-2 h-11 px-2 rounded text-white hover:text-sign hover:bg-white/10 transition-colors" aria-label="Sign in">
                                        <HiOutlineUser className="w-[22px] h-[22px]" aria-hidden="true" />
                                        <span className="hidden xl:block text-[14px] font-bold">Sign in</span>
                                    </Link>
                                )}

                                {/* Cart: the white plate, because it is where the money is */}
                                <Link
                                    to="/cart"
                                    className="sm:ml-1 flex items-center gap-1.5 sm:gap-2 h-11 px-2.5 sm:px-3 bg-sign text-ink border-2 border-ink font-black text-[14px] shadow-[3px_3px_0_#111111] hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
                                    aria-label={`Cart, ${cartCount} items`}
                                >
                                    <HiOutlineShoppingBag className="w-5 h-5" aria-hidden="true" />
                                    <span className="tabular-nums">{cartCount}</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(!mobileOpen)}
                                    className={`${iconBtn} lg:hidden sm:ml-1`}
                                    aria-expanded={mobileOpen}
                                    aria-controls="mobile-menu"
                                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                                >
                                    {mobileOpen ? <HiOutlineX className="w-6 h-6" aria-hidden="true" /> : <HiOutlineMenu className="w-6 h-6" aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <AnimatePresence>
                        {mobileOpen && (
                            <motion.div
                                id="mobile-menu"
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="lg:hidden overflow-hidden border-t-2 border-ink"
                            >
                                <ul className="page-wrap py-3">
                                    {NAV_LINKS.map((link, i) => {
                                        const active = pathname === link.to;
                                        return (
                                            <li key={link.to}>
                                                <Link
                                                    to={link.to}
                                                    aria-current={active ? "page" : undefined}
                                                    className={`flex items-baseline gap-3 py-3 display text-[30px] ${active ? "text-sign" : "text-white"} ${i ? "border-t border-white/15" : ""}`}
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                    <li className="sm:hidden flex flex-wrap gap-x-5 gap-y-1 py-3 border-t border-white/15 text-[15px] font-bold">
                                        {isLoggedIn ? (
                                            <>
                                                <span className="w-full text-white/70 text-[13px] font-semibold truncate">Signed in as {displayName}</span>
                                                {(admin || user?.role === "admin") && <Link to={`/${ADMIN_PATH}/dashboard`} className="min-h-[44px] flex items-center text-white hover:text-sign">Admin</Link>}
                                                {user && <Link to="/profile" className="min-h-[44px] flex items-center text-white hover:text-sign">Profile</Link>}
                                                {user && <Link to="/orders" className="min-h-[44px] flex items-center text-white hover:text-sign">Orders</Link>}
                                                <button type="button" onClick={handleLogout} className="min-h-[44px] flex items-center text-white hover:text-sign">Sign out</button>
                                            </>
                                        ) : (
                                            <Link to="/login" className="min-h-[44px] flex items-center gap-2 text-white hover:text-sign">
                                                <HiOutlineUser className="w-5 h-5" aria-hidden="true" /> Sign in or create an account
                                            </Link>
                                        )}
                                    </li>
                                    <li className="flex gap-2 pt-3 pb-2 border-t border-white/15">
                                        <Link to="/wishlist" className="flex-1 h-11 flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold text-[14px]">
                                            <HiOutlineHeart className="w-4 h-4" aria-hidden="true" /> Wishlist ({wishlistCount})
                                        </Link>
                                        <button type="button" onClick={toggleTheme} className="flex-1 h-11 flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold text-[14px]">
                                            {isDark ? <HiOutlineSun className="w-4 h-4" aria-hidden="true" /> : <HiOutlineMoon className="w-4 h-4" aria-hidden="true" />}
                                            {isDark ? "Light mode" : "Dark mode"}
                                        </button>
                                    </li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>
            </header>

            {/* ── Search overlay ── */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-ink/80 flex justify-center pt-16 sm:pt-24 px-4"
                        onClick={closeSearch}
                    >
                        <motion.div
                            initial={{ y: -12 }}
                            animate={{ y: 0 }}
                            exit={{ y: -12 }}
                            transition={{ duration: 0.15 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Search products"
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl border-2 border-ink dark:border-black shadow-2xl h-fit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 px-4 sm:px-5 h-16 bg-sign border-b-2 border-ink">
                                <HiOutlineSearch className="w-6 h-6 text-ink shrink-0" aria-hidden="true" />
                                <label htmlFor="site-search" className="sr-only">Search shirts and trousers</label>
                                <input
                                    id="site-search"
                                    type="search"
                                    placeholder="Search: checked shirt, black trouser..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[18px] font-bold text-ink placeholder-ink/60"
                                    autoFocus
                                />
                                <button type="button" onClick={closeSearch} className="w-11 h-11 flex items-center justify-center text-ink hover:bg-ink hover:text-sign" aria-label="Close search">
                                    <HiOutlineX className="w-6 h-6" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
                                {!searchQuery && (
                                    <p className="px-3 py-6 text-[15px] text-slate-500 dark:text-slate-400">Type a fabric, colour or style. Press Esc to close.</p>
                                )}
                                {searchLoading && (
                                    <p className="px-3 py-6 text-[15px] text-slate-500 dark:text-slate-400">Searching the racks for "{searchQuery}"...</p>
                                )}
                                {!searchLoading && searchError && (
                                    <p className="px-3 py-6 text-[15px] text-rose-600 dark:text-rose-400">Search could not reach the store. Check your connection and try again.</p>
                                )}
                                {!searchLoading && !searchError && searchQuery && searchResults.length === 0 && (
                                    <p className="px-3 py-6 text-[15px] text-slate-500 dark:text-slate-400">
                                        Nothing matches "{searchQuery}". Try a colour, a fabric like Cotton, or{" "}
                                        <Link to="/shirts" onClick={closeSearch} className="font-bold underline text-primary dark:text-sign">browse all shirts</Link>.
                                    </p>
                                )}
                                {!searchLoading && searchResults.map((product) => (
                                    <Link
                                        key={product._id}
                                        to={`/product/${product._id}`}
                                        onClick={closeSearch}
                                        className="flex items-center gap-4 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <img
                                            src={product.images?.[0] || product.imageUrl}
                                            alt=""
                                            width="56"
                                            height="56"
                                            className="w-14 h-14 object-cover bg-slate-100 border-2 border-ink dark:border-black"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 capitalize">{product.category} · {product.fabric}</p>
                                        </div>
                                        <span className="price-tag text-[14px]">₹{product.price.toLocaleString("en-IN")}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
