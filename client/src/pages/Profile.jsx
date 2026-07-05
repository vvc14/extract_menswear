import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import { showAlert } from "../redux/alertSlice";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineHome, 
    HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlinePlus, 
    HiOutlineTrash, HiOutlineCheck, HiOutlinePencil, HiOutlineLockClosed
} from "react-icons/hi";
import { useConfirm } from "../context/ConfirmContext";

export default function Profile() {
    const user = useSelector((s) => s.auth.user);
    const token = useSelector((s) => s.auth.token);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [addresses, setAddresses] = useState([]);
    
    // Address form state
    const [showForm, setShowForm] = useState(false);
    const [editIndex, setEditIndex] = useState(null); // null if adding new
    const [addressForm, setAddressForm] = useState({
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (!token) {
            navigate("/login?redirect=profile");
            return;
        }

        const fetchProfile = async () => {
            try {
                const { data } = await API.get("/auth/profile");
                setName(data.name || "");
                setAddresses(data.addresses || []);
            } catch (err) {
                console.error("Failed to load profile:", err);
                setMessage({ type: "error", text: "Failed to load profile details." });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, navigate]);

    const handleOpenAddForm = () => {
        setEditIndex(null);
        setAddressForm({
            name: user?.name || "",
            phone: "",
            street: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
        });
        setShowForm(true);
    };

    const handleOpenEditForm = (index) => {
        setEditIndex(index);
        setAddressForm({ ...addresses[index] });
        setShowForm(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        // Strict Client Side Validations
        if (!/^\d{10}$/.test(addressForm.phone)) {
            dispatch(showAlert({ title: "Validation Error", message: "Phone number must be exactly 10 digits." }));
            return;
        }
        if (!/^\d{6}$/.test(addressForm.pincode)) {
            dispatch(showAlert({ title: "Validation Error", message: "Pincode must be exactly 6 digits and numeric only." }));
            return;
        }

        let updated = [...addresses];
        if (editIndex !== null) {
            // Edit existing
            updated[editIndex] = { ...addressForm };
        } else {
            // Add new
            // If this is the first address, make it default
            const isDefault = updated.length === 0;
            updated.push({ ...addressForm, isDefault });
        }

        setAddresses(updated);
        setShowForm(false);
        saveProfileChanges(name, updated);
    };

    const handleRemoveAddress = async (index) => {
        if (!(await confirm("Are you sure you want to delete this address?"))) return;
        
        let updated = addresses.filter((_, i) => i !== index);
        // If we deleted the default address, make the first remaining one default
        if (addresses[index]?.isDefault && updated.length > 0) {
            updated[0].isDefault = true;
        }

        setAddresses(updated);
        saveProfileChanges(name, updated);
    };

    const handleSetDefault = (index) => {
        const updated = addresses.map((addr, i) => ({
            ...addr,
            isDefault: i === index,
        }));
        setAddresses(updated);
        saveProfileChanges(name, updated);
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        saveProfileChanges(name, password, addresses);
    };

    const saveProfileChanges = async (updatedName, updatedPassword, updatedAddresses) => {
        setMessage({ type: "", text: "" });
        setSaving(true);
        try {
            let finalPassword = updatedPassword;
            let finalAddresses = updatedAddresses;
            if (Array.isArray(updatedPassword)) {
                finalAddresses = updatedPassword;
                finalPassword = "";
            }

            const payload = {
                name: updatedName,
                addresses: finalAddresses,
            };
            if (finalPassword) {
                if (finalPassword.length < 6) {
                    setMessage({ type: "error", text: "Password must be at least 6 characters." });
                    setSaving(false);
                    return;
                }
                payload.password = finalPassword;
            }

            const { data } = await API.put("/auth/profile", payload);

            // Update Redux state and local storage
            dispatch(loginSuccess({ token, user: { id: data._id, name: data.name, email: data.email, role: data.role } }));
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setPassword(""); // Clear password field after successful update
        } catch (err) {
            console.error("Profile update failed:", err);
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[15px] rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-gold/20 focus:border-primary dark:focus:border-gold transition-all relative focus:z-10";
    const labelClass = "block text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider";

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="page-wrap section-py-sm max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Header */}
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-[32px] md:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">My Profile</h1>
                    <p className="text-[16px] text-slate-500 dark:text-slate-400">Manage your personal info and delivery addresses.</p>
                </div>

                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
                            message.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                        }`}
                    >
                        {message.type === "success" ? (
                            <HiOutlineCheckCircle className="w-5 h-5 shrink-0" />
                        ) : (
                            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                        )}
                        <span className="text-[15px] font-semibold">{message.text}</span>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Personal Info Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
                            <form onSubmit={handleProfileSubmit}>
                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] font-extrabold text-white mb-4"
                                        style={{ background: "linear-gradient(135deg, var(--color-primary), #2563eb)" }}>
                                        {name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
                                    <p className="text-sm text-slate-400 truncate max-w-full mb-4">{user?.email}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Full Name</label>
                                        <div className="relative">
                                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                placeholder="Your full name"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <span className={labelClass}>Email Address</span>
                                        <div className="relative">
                                            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                            <input
                                                type="email"
                                                value={user?.email || ""}
                                                disabled
                                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-400 text-[15px] rounded-xl px-4 py-3 pl-11 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Password (leave blank to keep unchanged)</label>
                                        <div className="relative">
                                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Set or change password"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary w-full mt-6 py-3 rounded-xl text-[14px] font-bold cursor-pointer"
                                >
                                    {saving ? "Saving..." : "Update Profile"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Manage Addresses */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Address Form Toggle (Add/Edit) */}
                        <AnimatePresence mode="wait">
                            {showForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm overflow-hidden"
                                >
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
                                        <HiOutlineHome className="w-5 h-5 text-primary dark:text-gold" /> 
                                        {editIndex !== null ? "Edit Address" : "Add New Address"}
                                    </h2>

                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Recipient Name</label>
                                                <input 
                                                    type="text" 
                                                    value={addressForm.name} 
                                                    onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                                                    placeholder="Full Name"
                                                    required
                                                    className={inputClass.replace(" pl-11", "")}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Phone Number</label>
                                                <input 
                                                    type="tel" 
                                                    value={addressForm.phone} 
                                                    onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                                                    placeholder="10-digit number"
                                                    required
                                                    className={inputClass.replace(" pl-11", "")}
                                                />
                                                <p className="text-[11px] text-slate-400 mt-1">Must be exactly 10 digits.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Street Address</label>
                                            <input 
                                                type="text" 
                                                value={addressForm.street} 
                                                onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                                                placeholder="Flat/House No., Street, Area"
                                                required
                                                className={inputClass.replace(" pl-11", "")}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                                <label className={labelClass}>City</label>
                                                <input 
                                                    type="text" 
                                                    value={addressForm.city} 
                                                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                                    placeholder="City"
                                                    required
                                                    className={inputClass.replace(" pl-11", "")}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>State</label>
                                                <input 
                                                    type="text" 
                                                    value={addressForm.state} 
                                                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                                                    placeholder="State"
                                                    required
                                                    className={inputClass.replace(" pl-11", "")}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Pincode</label>
                                                <input 
                                                    type="text" 
                                                    value={addressForm.pincode} 
                                                    onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                                                    placeholder="Pincode"
                                                    required
                                                    className={inputClass.replace(" pl-11", "")}
                                                />
                                                <p className="text-[11px] text-slate-400 mt-1">6 digits numeric.</p>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Country</label>
                                                <input 
                                                    type="text" 
                                                    value={addressForm.country} 
                                                    onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                                                    placeholder="Country"
                                                    required
                                                    className={inputClass.replace(" pl-11", "")}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setShowForm(false)}
                                                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                                            >
                                                Save Address
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Saved Addresses list */}
                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                                    <HiOutlineHome className="w-5.5 h-5.5 text-primary dark:text-gold" /> Delivery Addresses
                                </h2>
                                {!showForm && (
                                    <button 
                                        onClick={handleOpenAddForm}
                                        className="text-sm font-bold text-primary dark:text-gold hover:opacity-85 flex items-center gap-1.5 cursor-pointer bg-primary/5 dark:bg-gold/5 px-3 py-1.5 rounded-lg border border-primary/10 dark:border-gold/10"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" /> Add Address
                                    </button>
                                )}
                            </div>

                            {addresses.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    <HiOutlineHome className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No saved addresses yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {addresses.map((addr, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`p-5 rounded-xl border transition-all ${
                                                addr.isDefault 
                                                    ? "border-primary dark:border-gold bg-primary/5 dark:bg-gold/5" 
                                                    : "border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="space-y-1 text-left">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <span className="font-bold text-slate-800 dark:text-white text-[15px]">{addr.name}</span>
                                                        {addr.isDefault && (
                                                            <span className="bg-primary dark:bg-gold text-white dark:text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-500 dark:text-slate-400 text-[14px] leading-relaxed">
                                                        {addr.street}<br />
                                                        {addr.city}, {addr.state} - {addr.pincode}<br />
                                                        {addr.country}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[13px] pt-1.5">
                                                        <HiOutlinePhone className="w-4 h-4" />
                                                        <span>{addr.phone}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                                                    {!addr.isDefault && (
                                                        <button 
                                                            onClick={() => handleSetDefault(idx)}
                                                            className="p-2 text-slate-400 hover:text-primary dark:hover:text-gold hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                                                            title="Set as Default"
                                                        >
                                                            <HiOutlineCheck className="w-4.5 h-4.5" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleOpenEditForm(idx)}
                                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                                        title="Edit Address"
                                                    >
                                                        <HiOutlinePencil className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveAddress(idx)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                                        title="Delete Address"
                                                    >
                                                        <HiOutlineTrash className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
