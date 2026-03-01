import { useState, useEffect } from "react";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineX, HiOutlineSearch, HiOutlinePhotograph, HiOutlineCollection } from "react-icons/hi";

const EMPTY_FORM = { name: "", category: "shirt", fabric: "", style: "", price: "", originalPrice: "", discount: "", stock: "", image: null, imageUrl: "" };

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("all");

    const fetchProducts = async () => {
        try {
            const { data } = await API.get("/products");
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const filtered = products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === "all" || p.category === filterCat;
        return matchSearch && matchCat;
    });

    const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
    const openEdit = (p) => {
        setEditing(p._id);
        setForm({ name: p.name, category: p.category, fabric: p.fabric || "", style: p.style || "", price: p.price, originalPrice: p.originalPrice || "", discount: p.discount || "", stock: p.stock || 0, image: null, imageUrl: p.imageUrl || "" });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("category", form.category);
        formData.append("fabric", form.fabric);
        formData.append("style", form.style);
        formData.append("price", form.price);
        formData.append("originalPrice", form.originalPrice || 0);
        formData.append("discount", form.discount || 0);
        formData.append("stock", form.stock);
        if (form.image) formData.append("image", form.image);
        else if (form.imageUrl) formData.append("imageUrl", form.imageUrl);

        try {
            if (editing) {
                await API.put(`/admin/products/${editing}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                await API.post("/admin/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
            }
            setShowForm(false);
            fetchProducts();
        } catch (err) {
            console.error("Failed to save product:", err);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await API.delete(`/admin/products/${id}`);
            fetchProducts();
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const inputClass = "w-full bg-white border border-slate-200 px-4 py-3.5 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300";

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[32px] sm:text-[36px] font-extrabold tracking-tight text-slate-900 mb-2">Products</h1>
                    <p className="text-[16px] text-slate-500">{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white text-[15px] font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all shrink-0">
                    <HiOutlinePlus className="w-5 h-5" /> Add Product
                </button>
            </div>

            {/* Search & Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5">
                    {["all", "shirt", "trouser"].map((cat) => (
                        <button key={cat} onClick={() => setFilterCat(cat)}
                            className={`px-5 py-2.5 text-[14px] font-bold rounded-lg capitalize transition-all ${filterCat === cat ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                            {cat === "all" ? "All" : cat + "s"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div key="product-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden mb-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-7 sm:p-8">
                            <div className="flex items-center justify-between mb-7">
                                <h2 className="text-[22px] font-bold text-slate-900">{editing ? "Edit Product" : "New Product"}</h2>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Classic Linen Shirt" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass + " bg-white"}>
                                        <option value="shirt">Shirt</option>
                                        <option value="trouser">Trouser</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fabric</label>
                                    <input type="text" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} placeholder="Linen, Oxford" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Style / Type</label>
                                    <input type="text" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="Plain, Formal" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price (₹)</label>
                                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="2499" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stock</label>
                                    <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original Price / MRP (₹)</label>
                                    <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} placeholder="3999" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount (%)</label>
                                    <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="30" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Image URL</label>
                                    <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Or Upload</label>
                                    <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3.5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all">
                                        <HiOutlinePhotograph className="w-6 h-6 text-slate-400" />
                                        <span className="text-[15px] text-slate-500 font-medium">{form.image ? form.image.name : "Choose file..."}</span>
                                        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="hidden" />
                                    </label>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-3 pt-3">
                                    <button type="submit" disabled={submitting}
                                        className="bg-gradient-to-r from-primary to-blue-600 text-white text-[16px] font-bold px-12 py-4.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50">
                                        {submitting ? "Saving..." : editing ? "Update Product" : "Add Product"}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} className="text-[16px] font-semibold text-slate-500 px-8 py-4.5 rounded-xl hover:bg-slate-100 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Products table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <table className="w-full text-[16px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                            <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                            <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Fabric</th>
                            <th className="text-left px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Stock</th>
                            <th className="text-right px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                            <th className="text-right px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider" style={{ width: 110 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/50">
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 text-[16px] truncate">{p.name}</p>
                                            <p className="text-[13px] text-slate-400 md:hidden capitalize">{p.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg capitalize">{p.category}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 hidden lg:table-cell text-[15px]">{p.fabric || "—"}</td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className={`text-[14px] font-bold px-2.5 py-1 rounded-lg ${(p.stock || 0) > 10 ? "text-emerald-700 bg-emerald-50" : (p.stock || 0) > 0 ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50"
                                        }`}>
                                        {(p.stock || 0) > 0 ? p.stock : "Out"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-bold text-slate-900 text-[17px]">₹{(p.price || 0).toLocaleString("en-IN")}</span>
                                    {p.discount > 0 && <span className="ml-2 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{p.discount}% OFF</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button onClick={() => openEdit(p)} className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-primary" aria-label={`Edit ${p.name}`}>
                                            <HiOutlinePencil className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(p._id)} className="p-2.5 rounded-lg hover:bg-rose-50 transition-colors text-slate-400 hover:text-rose-500" aria-label={`Delete ${p.name}`}>
                                            <HiOutlineTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-24 text-center">
                                    <HiOutlineCollection className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-[18px] font-semibold text-slate-900 mb-2">{search ? "No matching products" : "No products yet"}</p>
                                    <p className="text-[15px] text-slate-400">{search ? "Try a different search term." : "Click \"Add Product\" to get started."}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
