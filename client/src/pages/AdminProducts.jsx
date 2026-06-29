import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineX, HiOutlineSearch, HiOutlinePhotograph, HiOutlineCollection, HiOutlineTruck, HiOutlineCog } from "react-icons/hi";

const EMPTY_FORM = { name: "", category: "shirt", fabric: "", style: "", price: "", originalPrice: "", discount: "", shippingCost: "", stock: "", images: [], imageUrl: "", videoUrl: "", selectedSizes: [], existingImages: [] };

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("all");
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkShipping, setBulkShipping] = useState("");
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [catOptions, setCatOptions] = useState({ shirt: { fabrics: [], styles: [], sizes: [] }, trouser: { fabrics: [], styles: [], sizes: [] } });
    const [newFabric, setNewFabric] = useState("");
    const [newStyle, setNewStyle] = useState("");
    const [newSize, setNewSize] = useState("");
    const [showManage, setShowManage] = useState(false);
    const [objectUrls, setObjectUrls] = useState([]);
    const objectUrlsRef = useRef([]);

    // Revoke old object URLs when images change to prevent memory leaks
    useEffect(() => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        const urls = Array.from(form.images || []).map((file) => URL.createObjectURL(file));
        objectUrlsRef.current = urls;
        setObjectUrls(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [form.images]);

    const fetchProducts = async (isMounted = true) => {
        try {
            const { data } = await API.get("/products");
            if (isMounted) setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    const fetchCatOptions = async (isMounted = true) => {
        try {
            const { data } = await API.get("/admin/category-options");
            if (isMounted) setCatOptions(data);
        } catch (err) {
            console.error("Failed to fetch category options:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        fetchProducts(isMounted);
        fetchCatOptions(isMounted);
        return () => { isMounted = false; };
    }, []);

    const filtered = products.filter((p) => {
        const query = search.toLowerCase();
        const matchSearch =
            p.name.toLowerCase().includes(query) ||
            (p.fabric || "").toLowerCase().includes(query) ||
            (p.style || "").toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query);
        const matchCat = filterCat === "all" || p.category === filterCat;
        return matchSearch && matchCat;
    });

    const openAdd = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const openEdit = (p) => {
        setEditing(p._id);
        setForm({ name: p.name, category: p.category, fabric: p.fabric || "", style: p.style || "", price: p.price, originalPrice: p.originalPrice || "", discount: p.discount || "", shippingCost: p.shippingCost || "", stock: p.stock || 0, images: [], imageUrl: p.imageUrl || "", videoUrl: p.videoUrl || "", selectedSizes: p.sizes || [], existingImages: p.images || [p.imageUrl].filter(Boolean) });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFormChange = (key, value) => {
        let updated = { ...form, [key]: value };
        if (key === "price" || key === "originalPrice") {
            const p = Number(updated.price) || 0;
            const op = Number(updated.originalPrice) || 0;
            if (op > p && p > 0) {
                updated.discount = Math.round(((op - p) / op) * 100);
            } else {
                updated.discount = 0;
            }
        }
        setForm(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Number(form.price) < 0) {
            alert("Price cannot be negative");
            return;
        }
        if (form.originalPrice && Number(form.originalPrice) < 0) {
            alert("Original price cannot be negative");
            return;
        }
        if (form.shippingCost && Number(form.shippingCost) < 0) {
            alert("Shipping cost cannot be negative");
            return;
        }
        if (Number(form.stock) < 0) {
            alert("Stock cannot be negative");
            return;
        }
        setSubmitting(true);
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("category", form.category);
        formData.append("fabric", form.fabric);
        formData.append("style", form.style);
        formData.append("price", form.price);
        formData.append("originalPrice", form.originalPrice || 0);
        formData.append("discount", form.discount || 0);
        formData.append("shippingCost", form.shippingCost || 0);
        formData.append("stock", form.stock);
        formData.append("sizes", JSON.stringify(form.selectedSizes || []));
        formData.append("videoUrl", form.videoUrl || "");
        // Multiple images upload
        if (form.images && form.images.length > 0) {
            for (let i = 0; i < form.images.length; i++) {
                formData.append("images", form.images[i]);
            }
        }
        // Send existing images as JSON so server can preserve/combine them
        if (form.existingImages && form.existingImages.length > 0) {
            formData.append("existingImages", JSON.stringify(form.existingImages));
        } else if (form.imageUrl && (!form.images || form.images.length === 0)) {
            formData.append("imageUrl", form.imageUrl);
        }

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

    const toggleSelect = (id) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };
    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) setSelectedIds([]);
        else setSelectedIds(filtered.map((p) => p._id));
    };
    const handleBulkShipping = async () => {
        if (selectedIds.length === 0 || bulkShipping === "") return;
        setBulkUpdating(true);
        try {
            await API.put("/admin/products/bulk-shipping", { productIds: selectedIds, shippingCost: Number(bulkShipping) });
            setSelectedIds([]);
            setBulkShipping("");
            fetchProducts();
        } catch (err) {
            console.error("Bulk shipping update failed:", err);
        }
        setBulkUpdating(false);
    };

    const inputClass = "w-full bg-white border border-slate-200 px-4 py-3.5 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300";

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "32px" }}>
                <div>
                    <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "8px" }}>Products</h1>
                    <p style={{ fontSize: "16px", color: "#64748b" }}>{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white text-[15px] font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all shrink-0">
                    <HiOutlinePlus className="w-5 h-5" /> Add Product
                </button>
            </div>

            {/* Search & Filter bar */}
            <div style={{ display: "flex", flexDirection: "row", gap: "16px", marginBottom: "32px" }}>
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
                                    <div className="flex gap-2">
                                        <select value={form.fabric} onChange={(e) => handleFormChange("fabric", e.target.value)} className={inputClass + " bg-white flex-1"}>
                                            <option value="">Select Fabric</option>
                                            {(catOptions[form.category]?.fabrics || []).map((f) => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Style / Type</label>
                                    <div className="flex gap-2">
                                        <select value={form.style} onChange={(e) => handleFormChange("style", e.target.value)} className={inputClass + " bg-white flex-1"}>
                                            <option value="">Select Style</option>
                                            {(catOptions[form.category]?.styles || []).map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price (₹)</label>
                                    <input type="number" min="0" value={form.price} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) handleFormChange("price", v); }} required placeholder="2499" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stock</label>
                                    <input type="number" min="0" value={form.stock} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) handleFormChange("stock", v); }} placeholder="50" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original Price / MRP (₹)</label>
                                    <input type="number" min="0" value={form.originalPrice} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) handleFormChange("originalPrice", v); }} placeholder="3999" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount (%)</label>
                                    <input type="text" readOnly value={form.discount} placeholder="Auto-calculated" className={inputClass + " bg-slate-50 text-slate-500 cursor-not-allowed"} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shipping Cost (₹)</label>
                                    <input type="number" min="0" value={form.shippingCost} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) handleFormChange("shippingCost", v); }} placeholder="0 or 99" className={inputClass} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sizes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(catOptions[form.category]?.sizes || []).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => {
                                                    const current = form.selectedSizes || [];
                                                    const updated = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
                                                    setForm({ ...form, selectedSizes: updated });
                                                }}
                                                className={`min-w-[44px] h-[38px] px-3 rounded-xl text-[14px] font-bold border-2 transition-all duration-200 cursor-pointer ${
                                                    (form.selectedSizes || []).includes(s)
                                                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-105"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-slate-900"
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                        {(catOptions[form.category]?.sizes || []).length === 0 && (
                                            <p className="text-[14px] text-slate-400 italic">No sizes configured. Add them in Manage Options below.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Images (up to 10)</label>
                                    {/* Existing images preview */}
                                    {form.existingImages && form.existingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {form.existingImages.map((url, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                                                    <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => {
                                                        const updated = form.existingImages.filter((_, i) => i !== idx);
                                                        setForm({ ...form, existingImages: updated });
                                                    }} className="absolute top-0.5 right-0.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* New files preview */}
                                    {form.images && form.images.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {objectUrls.map((url, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                                                    <img src={url} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => {
                                                        const updated = Array.from(form.images).filter((_, i) => i !== idx);
                                                        setForm({ ...form, images: updated });
                                                    }} className="absolute top-0.5 right-0.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3.5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all flex-1">
                                            <HiOutlinePhotograph className="w-6 h-6 text-slate-400" />
                                            <span className="text-[15px] text-slate-500 font-medium">{form.images && form.images.length > 0 ? `${form.images.length} file(s) selected` : "Choose files..."}</span>
                                            <input type="file" accept="image/*" multiple onChange={(e) => {
                                                const currentFiles = Array.from(form.images || []);
                                                const newFiles = Array.from(e.target.files);
                                                const combined = [...currentFiles, ...newFiles].slice(0, 10);
                                                setForm({ ...form, images: combined });
                                            }} className="hidden" />
                                        </label>
                                    </div>
                                    <p className="text-[12px] text-slate-400 mt-2">Or enter image URL below (first URL will be the main image)</p>
                                    <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className={inputClass + " mt-2"} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Video URL (optional)</label>
                                    <input type="url" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/... or direct video URL" className={inputClass} />
                                    <p className="text-[12px] text-slate-400 mt-2">Paste a YouTube, Vimeo, or direct .mp4 video link to showcase the product</p>
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

            {/* Manage Options Panel */}
            <div style={{ marginBottom: "40px" }}>
                <button onClick={() => setShowManage(!showManage)} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#64748b", background: "none", border: "none", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
                    <HiOutlineCog className="w-4 h-4" />
                    {showManage ? "Hide" : "Manage"} Fabric, Style & Size Options
                </button>
                <AnimatePresence>
                    {showManage && (
                        <motion.div key="manage-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginTop: "8px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", padding: "32px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px" }}>
                                {["shirt", "trouser"].map((cat) => (
                                    <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", textTransform: "capitalize", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", margin: 0 }}>{cat} Options</h3>

                                        {/* Fabrics */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Fabrics</p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                                {(catOptions[cat]?.fabrics || []).map((f) => (
                                                    <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f1f5f9", color: "#334155", fontSize: "14px", fontWeight: 500, padding: "8px 16px", borderRadius: "12px" }}>
                                                        {f}
                                                        <button onClick={async () => {
                                                            const updated = catOptions[cat].fabrics.filter((x) => x !== f);
                                                            await API.put("/admin/category-options", { category: cat, fabrics: updated });
                                                            fetchCatOptions();
                                                        }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: "0 2px", lineHeight: 1 }}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                                <input type="text" placeholder="New fabric..." value={cat === form.category ? newFabric : ""} onChange={(e) => { setForm(f => ({...f, category: cat})); setNewFabric(e.target.value); }} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", fontSize: "15px", borderRadius: "12px", outline: "none" }} />
                                                <button onClick={async () => {
                                                    if (!newFabric.trim()) return;
                                                    const updated = [...(catOptions[cat]?.fabrics || []), newFabric.trim()];
                                                    await API.put("/admin/category-options", { category: cat, fabrics: updated });
                                                    setNewFabric("");
                                                    fetchCatOptions();
                                                }} style={{ background: "#0f172a", color: "#fff", fontSize: "15px", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" }}>Add</button>
                                            </div>
                                        </div>

                                        {/* Styles */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Styles / Types</p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                                {(catOptions[cat]?.styles || []).map((s) => (
                                                    <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f1f5f9", color: "#334155", fontSize: "14px", fontWeight: 500, padding: "8px 16px", borderRadius: "12px" }}>
                                                        {s}
                                                        <button onClick={async () => {
                                                            const updated = catOptions[cat].styles.filter((x) => x !== s);
                                                            await API.put("/admin/category-options", { category: cat, styles: updated });
                                                            fetchCatOptions();
                                                        }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: "0 2px", lineHeight: 1 }}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                                <input type="text" placeholder="New style..." value={cat === form.category ? newStyle : ""} onChange={(e) => { setForm(f => ({...f, category: cat})); setNewStyle(e.target.value); }} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", fontSize: "15px", borderRadius: "12px", outline: "none" }} />
                                                <button onClick={async () => {
                                                    if (!newStyle.trim()) return;
                                                    const updated = [...(catOptions[cat]?.styles || []), newStyle.trim()];
                                                    await API.put("/admin/category-options", { category: cat, styles: updated });
                                                    setNewStyle("");
                                                    fetchCatOptions();
                                                }} style={{ background: "#0f172a", color: "#fff", fontSize: "15px", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" }}>Add</button>
                                            </div>
                                        </div>

                                        {/* Sizes */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Sizes</p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                                {(catOptions[cat]?.sizes || []).map((sz) => (
                                                    <span key={sz} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f1f5f9", color: "#334155", fontSize: "14px", fontWeight: 500, padding: "8px 16px", borderRadius: "12px" }}>
                                                        {sz}
                                                        <button onClick={async () => {
                                                            const updated = (catOptions[cat]?.sizes || []).filter((x) => x !== sz);
                                                            await API.put("/admin/category-options", { category: cat, sizes: updated });
                                                            fetchCatOptions();
                                                        }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: "0 2px", lineHeight: 1 }}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                                <input type="text" placeholder="New size..." value={cat === form.category ? newSize : ""} onChange={(e) => { setForm(f => ({...f, category: cat})); setNewSize(e.target.value); }} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", fontSize: "15px", borderRadius: "12px", outline: "none" }} />
                                                <button onClick={async () => {
                                                    if (!newSize.trim()) return;
                                                    const updated = [...(catOptions[cat]?.sizes || []), newSize.trim()];
                                                    await API.put("/admin/category-options", { category: cat, sizes: updated });
                                                    setNewSize("");
                                                    fetchCatOptions();
                                                }} style={{ background: "#0f172a", color: "#fff", fontSize: "15px", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" }}>Add</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Products table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <table className="w-full text-[16px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-4 py-4 w-10">
                                <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer" />
                            </th>
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
                            <tr key={p._id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${selectedIds.includes(p._id) ? "bg-primary/5" : ""}`}>
                                <td className="px-4 py-4">
                                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/50">
                                            <img src={p.images && p.images.length > 0 ? p.images[0] : p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
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
                                    {p.shippingCost > 0 ? <p className="text-[12px] font-bold text-slate-400 mt-1">+₹{p.shippingCost} Ship</p> : <p className="text-[12px] font-bold text-emerald-500 mt-1">Free Ship</p>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button onClick={() => openEdit(p)} className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-primary cursor-pointer" aria-label={`Edit ${p.name}`}>
                                            <HiOutlinePencil className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(p._id)} className="p-2.5 rounded-lg hover:bg-rose-50 transition-colors text-slate-400 hover:text-rose-500 cursor-pointer" aria-label={`Delete ${p.name}`}>
                                            <HiOutlineTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
                                    <HiOutlineCollection className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-[18px] font-semibold text-slate-900 mb-2">{search ? "No matching products" : "No products yet"}</p>
                                    <p className="text-[15px] text-slate-400">{search ? "Try a different search term." : "Click \"Add Product\" to get started."}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        key="bulk-bar"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.25 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 px-6 py-4 flex items-center gap-5 min-w-[360px] max-w-[95vw]"
                    >
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="bg-primary text-white text-[13px] font-extrabold px-2.5 py-1 rounded-lg">{selectedIds.length}</span>
                            <span className="text-[14px] font-semibold text-slate-300">selected</span>
                        </div>
                        <div className="h-8 w-px bg-slate-700" />
                        <div className="flex items-center gap-2 flex-1">
                            <HiOutlineTruck className="w-5 h-5 text-slate-400 shrink-0" />
                            <input
                                type="number"
                                min="0"
                                value={bulkShipping}
                                onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) setBulkShipping(v); }}
                                placeholder="₹ shipping"
                                className="bg-slate-800 border border-slate-700 text-white text-[15px] font-bold px-3 py-2 rounded-xl w-28 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-slate-500"
                            />
                        </div>
                        <button
                            onClick={handleBulkShipping}
                            disabled={bulkUpdating || bulkShipping === ""}
                            className="bg-primary hover:bg-primary-dark text-white text-[14px] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                        >
                            {bulkUpdating ? "Applying..." : `Apply to ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""}`}
                        </button>
                        <button onClick={() => { setSelectedIds([]); setBulkShipping(""); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0" aria-label="Clear selection">
                            <HiOutlineX className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
