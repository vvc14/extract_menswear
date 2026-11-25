import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { ADMIN_PATH } from "../config/adminPath";
import {
    HiOutlineViewGrid, HiOutlineCollection, HiOutlineUsers,
    HiOutlineLogout, HiOutlineExternalLink, HiOutlineMenu, HiOutlineX,
    HiOutlineClipboardList, HiOutlineAdjustments, HiOutlineTag
} from "react-icons/hi";
import Logo from "./brand/Logo";

// Grouped by the job: running the shop day to day, then customers, then setup.
const NAV_GROUPS = [
    {
        label: "Shop",
        items: [
            { to: `/${ADMIN_PATH}/dashboard`, label: "Dashboard", icon: HiOutlineViewGrid },
            { to: `/${ADMIN_PATH}/orders`, label: "Orders", icon: HiOutlineClipboardList },
            { to: `/${ADMIN_PATH}/products`, label: "Products", icon: HiOutlineCollection },
        ],
    },
    {
        label: "Customers",
        items: [
            { to: `/${ADMIN_PATH}/users`, label: "Users", icon: HiOutlineUsers },
            { to: `/${ADMIN_PATH}/coupons`, label: "Coupons", icon: HiOutlineTag },
        ],
    },
    {
        label: "Setup",
        items: [{ to: `/${ADMIN_PATH}/settings`, label: "Settings", icon: HiOutlineAdjustments }],
    },
];
const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const toggleRef = useRef(null);
    const admin = useSelector((s) => s.auth.admin);
    const user = useSelector((s) => s.auth.user);
    const authAdmin = admin || (user?.role === "admin" ? user : null);
    const displayName = authAdmin?.username || authAdmin?.name || "Admin";

    const handleLogout = () => { dispatch(logout()); navigate("/login"); };
    const pageTitle = ALL_NAV.find((n) => pathname.startsWith(n.to))?.label || "Admin";

    // Admin screens are light-only (dense tables and forms); lift the dark theme while here and put it back on exit
    useEffect(() => {
        const root = document.documentElement;
        const wasDark = root.classList.contains("dark");
        root.classList.remove("dark");
        return () => { if (wasDark) root.classList.add("dark"); };
    }, []);

    useEffect(() => { setSidebarOpen(false); }, [pathname]);
    useEffect(() => {
        if (!sidebarOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") { setSidebarOpen(false); toggleRef.current?.focus(); }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-ink/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}

            {/* Sidebar: always visible on desktop, a sheet on phones */}
            <aside
                id="admin-sidebar"
                className={`board fixed top-0 bottom-0 left-0 z-50 w-[240px] flex flex-col border-r-2 border-ink overflow-y-auto transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="h-[72px] flex items-center justify-between px-4 border-b-2 border-ink">
                    <Link to={`/${ADMIN_PATH}/dashboard`} aria-label="Admin dashboard">
                        <Logo size="sm" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden w-11 h-11 flex items-center justify-center text-white hover:bg-white/10"
                        aria-label="Close menu"
                    >
                        <HiOutlineX className="w-6 h-6" aria-hidden="true" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4" aria-label="Admin navigation">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mb-5">
                            <p className="px-3 mb-1.5 text-[12px] font-black uppercase text-white/60">{group.label}</p>
                            <ul>
                                {group.items.map(({ to, label, icon: Icon }) => {
                                    const active = pathname.startsWith(to);
                                    return (
                                        <li key={to}>
                                            <Link
                                                to={to}
                                                aria-current={active ? "page" : undefined}
                                                className={`flex items-center gap-3 min-h-[44px] px-3 text-[15px] font-extrabold border-2 transition-colors ${active
                                                    ? "bg-sign text-ink border-ink shadow-[3px_3px_0_#111111]"
                                                    : "text-white border-transparent hover:bg-white/10"
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                                                {label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="border-t-2 border-ink px-3 py-4">
                    {authAdmin && (
                        <div className="flex items-center gap-3 px-3 mb-2">
                            <span className="w-9 h-9 flex items-center justify-center bg-white text-primary border-2 border-ink font-black" aria-hidden="true">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="text-[15px] font-bold text-white truncate">{displayName}</p>
                                <p className="text-[12px] font-semibold text-white/70">Administrator</p>
                            </div>
                        </div>
                    )}
                    <Link to="/" className="flex items-center gap-3 min-h-[44px] px-3 text-[14px] font-bold text-white/85 hover:text-sign">
                        <HiOutlineExternalLink className="w-5 h-5" aria-hidden="true" /> View storefront
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex items-center gap-3 w-full min-h-[44px] px-3 text-[14px] font-bold text-white/85 hover:text-sign text-left">
                        <HiOutlineLogout className="w-5 h-5" aria-hidden="true" /> Sign out
                    </button>
                </div>
            </aside>

            <div className="flex flex-col min-h-screen lg:pl-[240px]">
                <header className="sticky top-0 z-30 h-[72px] flex items-center gap-3 px-4 sm:px-6 bg-white border-b-2 border-ink">
                    <button
                        ref={toggleRef}
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden w-11 h-11 flex items-center justify-center border-2 border-ink text-ink hover:bg-sign"
                        aria-label="Open admin menu"
                        aria-expanded={sidebarOpen}
                        aria-controls="admin-sidebar"
                    >
                        <HiOutlineMenu className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <h1 className="display text-[26px] sm:text-[32px] text-ink">{pageTitle}</h1>
                </header>

                <main id="main-content" className="flex-1 p-4 sm:p-8 lg:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
