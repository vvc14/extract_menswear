import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showAlert } from "../redux/alertSlice";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineTag, HiOutlineSearch, HiOutlineTrash, HiOutlineExclamation, HiOutlinePlus, HiOutlinePencilAlt, HiOutlineX } from "react-icons/hi";

export default function AdminCoupons() {
    const dispatch = useDispatch();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderValue: "",
        usageLimit: "",
        expiryDate: "",
        isActive: true,
    });

    const fetchCoupons = async () => {
        try {
            const { data } = await API.get("/admin/coupons");
            setCoupons(data);
        } catch (err) {
            console.error("Failed to fetch coupons:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenForm = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setForm({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderValue: coupon.minOrderValue || "",
                usageLimit: coupon.usageLimit || "",
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : "",
                isActive: coupon.isActive,
                oncePerUser: coupon.oncePerUser || false,
            });
        } else {
            setEditingCoupon(null);
            setForm({
                code: "",
                discountType: "percentage",
                discountValue: "",
                minOrderValue: "",
                usageLimit: "",
                expiryDate: "",
                isActive: true,
                oncePerUser: false,
            });
        }
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            // Format empty numbers to null
            if (!payload.minOrderValue) payload.minOrderValue = 0;
            if (!payload.usageLimit) payload.usageLimit = null;
            if (!payload.expiryDate) payload.expiryDate = null;

            if (editingCoupon) {
                await API.put(`/admin/coupons/${editingCoupon._id}`, payload);
            } else {
                await API.post("/admin/coupons", payload);
            }
            await fetchCoupons();
            setShowForm(false);
        } catch (err) {
            dispatch(showAlert({ title: "Coupon Error", message: err.response?.data?.message || "Failed to save coupon" }));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await API.delete(`/admin/coupons/${deleteModal._id}`);
            setCoupons(prev => prev.filter(c => c._id !== deleteModal._id));
            setDeleteModal(null);
        } catch (err) {
            dispatch(showAlert({ title: "Coupon Error", message: err.response?.data?.message || "Failed to delete coupon" }));
        } finally {
            setDeleting(false);
        }
    };

    const toggleStatus = async (coupon) => {
        try {
            const { data } = await API.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
            setCoupons(prev => prev.map(c => c._id === data._id ? data : c));
        } catch (err) {
            dispatch(showAlert({ title: "Coupon Error", message: "Failed to update status. Please try again." }));
        }
    };

    const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()));

    const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
    const labelClass = "block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "8px" }}>Coupons</h1>
                    <p style={{ fontSize: "16px", color: "#64748b" }}>Manage discount codes and promotions.</p>
                </div>
                <button onClick={() => handleOpenForm()} className="btn-primary py-2.5 px-5 flex items-center gap-2 rounded-xl text-[14px]">
                    <HiOutlinePlus className="w-5 h-5" /> Add Coupon
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-md">
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search by coupon code..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400" />
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden overflow-x-auto">
                    <table className="w-full text-[15px] min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Code</th>
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Discount</th>
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Usage</th>
                                <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-right px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 text-[16px]">{c.code}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md text-[14px]">
                                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                        </span>
                                        {c.minOrderValue > 0 && <p className="text-[12px] text-slate-400 mt-1 font-semibold">Min: ₹{c.minOrderValue}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <span className="font-semibold text-slate-700">{c.usedCount}</span>
                                        {c.usageLimit ? ` / ${c.usageLimit}` : " (Unlimited)"}
                                        {c.expiryDate && (
                                            <p className={`text-[12px] font-semibold mt-1 ${new Date(c.expiryDate) < new Date() ? 'text-rose-500' : 'text-emerald'}`}>
                                                Exp: {new Date(c.expiryDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => toggleStatus(c)}
                                            className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                                                c.isActive 
                                                ? "bg-emerald/10 text-emerald border-emerald/20 hover:bg-emerald/20" 
                                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald' : 'bg-slate-400'}`}></span>
                                            {c.isActive ? 'Active' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenForm(c)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                title="Edit"
                                            >
                                                <HiOutlinePencilAlt className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal(c)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                                title="Delete"
                                            >
                                                <HiOutlineTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <HiOutlineTag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-[18px] font-semibold text-slate-900 mb-2">{search ? "No matching coupons" : "No coupons found"}</p>
                                        <p className="text-[15px] text-slate-400">Create a coupon to offer discounts to your customers.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => !saving && setShowForm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-900">{editingCoupon ? "Edit Coupon" : "Add New Coupon"}</h2>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-lg">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="couponForm" onSubmit={handleSave} className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Coupon Code *</label>
                                        <input type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                                            placeholder="e.g. SUMMER20" className={inputClass} style={{textTransform: 'uppercase'}} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Discount Type *</label>
                                            <select className={inputClass} value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount (₹)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Discount Value *</label>
                                            <input type="number" required min="1" max={form.discountType === 'percentage' ? 100 : 99999}
                                                value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})}
                                                placeholder={form.discountType === 'percentage' ? "e.g. 20" : "e.g. 500"} className={inputClass} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Minimum Order Value (₹)</label>
                                        <input type="number" min="0" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: e.target.value})}
                                            placeholder="Optional (e.g. 1000)" className={inputClass} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Usage Limit</label>
                                            <input type="number" min="1" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})}
                                                placeholder="Total times it can be used" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Expiry Date</label>
                                            <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}
                                                className={inputClass} min={new Date().toISOString().split('T')[0]} />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-2">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}
                                                className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary" />
                                            <label htmlFor="isActive" className="font-semibold text-slate-700 cursor-pointer text-[15px]">Coupon is active</label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" id="oncePerUser" checked={form.oncePerUser} onChange={e => setForm({...form, oncePerUser: e.target.checked})}
                                                className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary" />
                                            <label htmlFor="oncePerUser" className="font-semibold text-slate-700 cursor-pointer text-[15px]">Once per user only</label>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button type="submit" form="couponForm" disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-[14px]">
                                    {saving ? "Saving..." : "Save Coupon"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => !deleting && setDeleteModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-5">
                                <HiOutlineExclamation className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-[22px] font-extrabold text-slate-900 mb-2">Delete Coupon</h2>
                            <p className="text-[15px] text-slate-500 mb-6">
                                Are you sure you want to delete <span className="font-bold text-slate-900">{deleteModal.code}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal(null)} disabled={deleting}
                                    className="flex-1 py-3 text-[15px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={deleting}
                                    className="flex-1 py-3 text-[15px] font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all">
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
