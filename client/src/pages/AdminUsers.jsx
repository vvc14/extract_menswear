import { useState, useEffect } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineSearch, HiOutlineUsers } from "react-icons/hi";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    const fetchUsers = async () => {
        try { const { data } = await API.get("/admin/users"); setUsers(data); } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === "admin" ? "user" : "admin";
        if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
        try {
            const { data } = await API.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
        } catch { }
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
            <div className="mb-8">
                <h1 className="text-[32px] sm:text-[36px] font-extrabold tracking-tight text-slate-900 mb-2">Users</h1>
                <p className="text-[16px] text-slate-500">{users.length} registered user{users.length !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}</p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400" />
                </div>
                <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5">
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
                                        <button onClick={() => toggleRole(u._id, u.role)}
                                            className={`text-[13px] font-bold px-4 py-2 rounded-lg transition-all ${u.role === "admin"
                                                    ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                                                    : "text-primary bg-primary/10 hover:bg-primary/20"
                                                }`}>
                                            {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                                        </button>
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
        </motion.div>
    );
}
