import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { ADMIN_PATH } from "../config/adminPath";
import {
    HiOutlineViewGrid, HiOutlineCollection, HiOutlineUsers,
    HiOutlineLogout, HiOutlineExternalLink, HiOutlineMenu, HiOutlineX,
    HiOutlineChevronRight, HiOutlineClipboardList
} from "react-icons/hi";

const SIDEBAR_W = 230;

const NAV = [
    { to: `/${ADMIN_PATH}/dashboard`, label: "Dashboard", icon: HiOutlineViewGrid },
    { to: `/${ADMIN_PATH}/products`, label: "Products", icon: HiOutlineCollection },
    { to: `/${ADMIN_PATH}/orders`, label: "Orders", icon: HiOutlineClipboardList },
    { to: `/${ADMIN_PATH}/users`, label: "Users", icon: HiOutlineUsers },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const admin = useSelector((s) => s.auth.admin);
    const user = useSelector((s) => s.auth.user);
    const authAdmin = admin || (user?.role === "admin" ? user : null);
    const displayName = authAdmin?.username || authAdmin?.name || "Admin";

    const handleLogout = () => { dispatch(logout()); navigate("/login"); };
    const pageTitle = NAV.find((n) => pathname.startsWith(n.to))?.label || "Admin";

    return (
        <div style={{ minHeight: "100vh", background: "#f8f9fc" }}>
            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — collapsible on mobile, always visible on desktop */}
            <aside 
                className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0f172a] overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{ width: SIDEBAR_W }}
            >
                {/* Brand */}
                <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, var(--color-primary), #2563eb)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>E</span>
                        </div>
                        <div style={{ lineHeight: 1.1 }}>
                            <span style={{ color: "#fff", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", display: "block" }}>EXTRACT</span>
                            <span style={{ color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Admin Panel</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                        aria-label="Close sidebar"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "20px 12px" }} aria-label="Admin navigation">
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 12px", marginBottom: 12 }}>Menu</p>
                    {NAV.map(({ to, label, icon: Icon }) => {
                        const active = pathname === to;
                        return (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 14px", borderRadius: 12, fontSize: 16, fontWeight: 600,
                                    textDecoration: "none", marginBottom: 4,
                                    color: active ? "#ffffff" : "#94a3b8",
                                    background: active ? "#2563eb" : "transparent",
                                    transition: "all 0.2s",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; } }}
                            >
                                <Icon style={{ width: 20, height: 20 }} />
                                {label}
                                {active && <HiOutlineChevronRight style={{ width: 16, height: 16, marginLeft: "auto", opacity: 0.6 }} />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 12px" }}>
                    {authAdmin && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #475569, #334155)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{displayName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
                                <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em" }}>Administrator</p>
                            </div>
                        </div>
                    )}
                    <Link
                        to="/"
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#64748b", textDecoration: "none", transition: "all 0.2s", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
                    >
                        <HiOutlineExternalLink style={{ width: 18, height: 18 }} />
                        View Storefront
                    </Link>
                    <button
                        onClick={handleLogout}
                        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#64748b", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#f43f5e"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
                    >
                        <HiOutlineLogout style={{ width: 18, height: 18 }} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content — responsive padding instead of left margin */}
            <div className="flex flex-col min-h-screen transition-all duration-300 lg:pl-[230px]">
                {/* Top bar */}
                <header style={{
                    position: "sticky", top: 0, zIndex: 30,
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
                    borderBottom: "1px solid rgba(226,232,240,0.7)",
                    height: 64, display: "flex", alignItems: "center", padding: "0 24px"
                }}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg mr-3 cursor-pointer"
                        aria-label="Toggle sidebar"
                    >
                        <HiOutlineMenu className="w-6 h-6" />
                    </button>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{pageTitle}</h2>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: "24px" }} className="sm:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
