import { useState, useEffect } from "react";
import API from "../services/api";
import { motion } from "framer-motion";
import { HiOutlineAdjustments, HiOutlineCheckCircle, HiOutlineClock } from "react-icons/hi";

export default function AdminSettings() {
    const [newArrivalsDays, setNewArrivalsDays] = useState(14);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get("/admin/settings");
                if (data && data.newArrivalsDays !== undefined) {
                    setNewArrivalsDays(data.newArrivalsDays);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            await API.put("/admin/settings", {
                key: "newArrivalsDays",
                value: Number(newArrivalsDays)
            });
            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "8px" }}>Settings</h1>
                <p style={{ fontSize: "16px", color: "#64748b" }}>Manage storefront configurations and settings.</p>
            </div>

            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "20px" }}>
                        <div style={{ width: 40, height: 40, background: "rgba(201,168,76,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justify: "center" }}>
                            <HiOutlineClock className="w-5 h-5" style={{ color: "var(--gold)" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>New Arrivals Timeframe</h2>
                            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Configure how long products are tagged as "New Arrivals".</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="newArrivalsDays" className="block text-[14px] font-bold text-slate-700 uppercase tracking-wide">
                            New Arrivals Period (Days)
                        </label>
                        <input
                            type="number"
                            id="newArrivalsDays"
                            min="1"
                            max="365"
                            value={newArrivalsDays}
                            onChange={(e) => setNewArrivalsDays(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-[16px] text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-slate-400"
                        />
                        <p className="text-[13px] text-slate-500 leading-relaxed">
                            Specify the number of days a product is highlighted as a "New Arrival" after it is added or updated in the store.
                        </p>
                    </div>

                    {message && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-[14px] font-semibold animate-fadeIn">
                            <HiOutlineCheckCircle className="w-5 h-5 shrink-0" />
                            {message}
                        </div>
                    )}

                    <div style={{ paddingTop: "12px" }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#0f172a] text-white hover:bg-slate-800 transition-colors px-6 py-3 text-[15px] font-bold rounded-xl cursor-pointer disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
