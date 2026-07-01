import { useState, useEffect } from "react";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineSearch, HiOutlineUsers, HiOutlineTrash, HiOutlineExclamation } from "react-icons/hi";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [deleteModal, setDeleteModal] = useState(null); // user object or null
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async (isMounted = true) => {
        try {
            const { data } = await API.get("/admin/users");
            if (isMounted) setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
        if (isMounted) setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        fetchUsers(isMounted);
        return () => { isMounted = false; };
    }, []);

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === "admin" ? "user" : "admin";
        if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
        try {
            const { data } = await API.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
        } catch (err) {
            console.error("Failed to toggle role:", err);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await API.delete(`/admin/users/${deleteModal._id}`);
            setUsers((prev) => prev.filter((u) => u._id !== deleteModal._id));
            setDeleteModal(null);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete user");
        } finally {
            setDeleting(false);
        }
    };

    const filtered = users.filter((u) => {
        const matchSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === "all" || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const adminCount = users.filter((u) => u.role === "admin").length;
    const userCount = users.filter((u) => u.role === "user").length;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "8px" }}>Users</h1>
                <p style={{ fontSize: "16px", color: "#64748b" }}>{users.length} registered user{users.length !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}</p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400" />
                </div>
                <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 shrink-0 overflow-x-auto">
                    {[
                        { key: "all", label: "All" },
                        { key: "admin", label: `Admins (${adminCount})` },
                        { key: "user", label: `Users (${userCount})` },
                    ].map((f) => (
                        <button key={f.key} onClick={() => setFilterRole(f.key)}
                            className={`px-4 py-2.5 text-[14px] font-bold rounded-lg transition-all ${filterRole === f.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                    <table className="w-full text-[16px]">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                                <th className="text-right px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${u.role === "admin"
                                                    ? "bg-gradient-to-br from-primary to-blue-600"
                                                    : "bg-gradient-to-br from-slate-200 to-slate-300"
                                                }`}>
                                                <span className={`text-[14px] font-extrabold ${u.role === "admin" ? "text-white" : "text-slate-600"}`}>
                                                    {u.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-[16px] truncate">{u.name}</p>
                                                <p className="text-[13px] text-slate-400 truncate md:hidden">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 hidden md:table-cell truncate max-w-[220px] text-[15px]">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-2 text-[13px] font-bold px-3 py-1.5 rounded-lg ${u.role === "admin"
                                                ? "bg-primary/10 text-primary"
                                                : "bg-slate-100 text-slate-500"
                                            }`}>
                                            {u.role === "admin" ? <HiOutlineShieldCheck className="w-4 h-4" /> : <HiOutlineUser className="w-4 h-4" />}
                                            {u.role === "admin" ? "Admin" : "User"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-[15px] hidden lg:table-cell">
                                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => toggleRole(u._id, u.role)}
                                                className={`text-[13px] font-bold px-4 py-2 rounded-lg transition-all ${u.role === "admin"
                                                        ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                                                        : "text-primary bg-primary/10 hover:bg-primary/20"
                                                    }`}>
                                                {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal(u)}
                                                className="text-[13px] font-bold px-3 py-2 rounded-lg transition-all text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700"
                                                title="Delete user"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <HiOutlineUsers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-[18px] font-semibold text-slate-900 mb-2">{search ? "No matching users" : "No users yet"}</p>
                                        <p className="text-[15px] text-slate-400">{search ? "Try a different search." : "Users will appear here once they register."}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        onClick={() => !deleting && setDeleteModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Warning icon */}
                            <div className="flex justify-center mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
                                    <HiOutlineExclamation className="w-8 h-8 text-rose-500" />
                                </div>
                            </div>

                            <h2 className="text-[22px] font-extrabold text-slate-900 text-center mb-2">Delete User</h2>
                            <p className="text-[15px] text-slate-500 text-center mb-2">
                                Are you sure you want to delete this user?
                            </p>

                            {/* User info card */}
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                                        <span className="text-[14px] font-extrabold text-slate-600">
                                            {deleteModal.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-[15px] truncate">{deleteModal.name}</p>
                                        <p className="text-[13px] text-slate-400 truncate">{deleteModal.email}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[13px] text-rose-500 font-semibold text-center mb-6 bg-rose-50 rounded-lg px-4 py-2.5 border border-rose-100">
                                ⚠️ This action is permanent. The user's cart and wishlist data will also be removed.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal(null)}
                                    disabled={deleting}
                                    className="flex-1 py-3 text-[15px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={deleting}
                                    className="flex-1 py-3 text-[15px] font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? (
                                        "Deleting..."
                                    ) : (
                                        <>
                                            <HiOutlineTrash className="w-4 h-4" />
                                            Delete User
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
