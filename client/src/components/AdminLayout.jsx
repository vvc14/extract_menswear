import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import {
    HiOutlineViewGrid, HiOutlineCollection, HiOutlineUsers,
    HiOutlineLogout, HiOutlineExternalLink, HiOutlineMenu, HiOutlineX,
    HiOutlineChevronRight
} from "react-icons/hi";

const SIDEBAR_W = 230;

const NAV = [
    { to: "/admin/dashboard", label: "Dashboard", icon: HiOutlineViewGrid },
    { to: "/admin/products", label: "Products", icon: HiOutlineCollection },
    { to: "/admin/users", label: "Users", icon: HiOutlineUsers },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const admin = useSelector((s) => s.auth.admin);

    const handleLogout = () => { dispatch(logout()); navigate("/admin/login"); };
    const pageTitle = NAV.find((n) => pathname.startsWith(n.to))?.label || "Admin";

    return (
        <div style={{ minHeight: "100vh", background: "#f8f9fc" }}>
            {/* Sidebar — always visible, fixed position */}
            <aside style={{
                position: "fixed", top: 0, left: 0, bottom: 0, width: SIDEBAR_W,
                background: "#0f172a", display: "flex", flexDirection: "column", zIndex: 50,
                overflowY: "auto"
            }}>
                {/* Brand */}
                <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, var(--color-primary), #2563eb)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>E</span>
                        </div>
                        <div style={{ lineHeight: 1.1 }}>
                            <span style={{ color: "#fff", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", display: "block" }}>EXTRACT</span>
                            <span style={{ color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Admin Panel</span>
                        </div>
                    </Link>
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
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 14px", borderRadius: 12, fontSize: 16, fontWeight: 600,
                                    textDecoration: "none", marginBottom: 4,
                                    color: active ? "var(--color-primary)" : "#94a3b8",
                                    background: active ? "rgba(var(--color-primary-rgb, 59,130,246), 0.12)" : "transparent",
                                    transition: "all 0.2s",
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
                    {admin && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #475569, #334155)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{admin.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.username}</p>
                                <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Administrator</p>
                            </div>
                        </div>
                    )}
                    <Link
                        to="/"
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#64748b", textDecoration: "none", transition: "all 0.2s" }}
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

            {/* Main content — always offset by sidebar width */}
            <div style={{ marginLeft: SIDEBAR_W, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                {/* Top bar */}
                <header style={{
                    position: "sticky", top: 0, zIndex: 30,
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
                    borderBottom: "1px solid rgba(226,232,240,0.7)",
                    height: 64, display: "flex", alignItems: "center", padding: "0 40px"
                }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{pageTitle}</h2>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: 40 }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
