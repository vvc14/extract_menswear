import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import API from "../services/api";
import { motion } from "framer-motion";
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed, HiOutlineUser, HiOutlineShieldCheck } from "react-icons/hi";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/admin-login", { username, password });
            dispatch(loginSuccess(data));
            navigate("/admin/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid admin credentials");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white/[0.07] border border-white/[0.12] text-white text-[16px] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all placeholder:text-white/30";

    return (
        <main className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1c1917 50%, #0f172a 100%)" }}>
            {/* Ambient light effects */}
            <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #d97706 0%, transparent 70%)" }} />
            <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #b45309 0%, transparent 70%)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 60%)" }} />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")", backgroundSize: "40px 40px" }} />

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[460px] mx-4"
            >
                {/* Shield Icon */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-3 shadow-2xl shadow-amber-500/20 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}>
                        <HiOutlineShieldCheck className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.08] p-7 sm:p-9" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(40px)" }}>
                    <div className="flex flex-col gap-6">
                        <div className="text-center">
                            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">Admin Panel</h1>
                            <p className="text-[16px] text-white/50">Sign in with your admin credentials</p>
                        </div>

                        {error && (
                            <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div>
                                <label htmlFor="admin-username" className="block text-[14px] font-bold text-white/60 mb-2.5">Username</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                    <input
                                        id="admin-username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                        autoFocus
                                        placeholder="Admin username"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="admin-password" className="block text-[14px] font-bold text-white/60 mb-2.5">Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                    <input
                                        id="admin-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className={inputClass + " pr-12"}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 cursor-pointer">
                                        {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full text-white text-[16px] font-bold py-4.5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] cursor-pointer mt-1"
                                style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                            >
                                {loading ? "Signing in..." : "Sign In to Admin"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[13px] text-white/30 font-semibold">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <Link
                            to="/login"
                            className="w-full text-center text-[15px] font-bold text-white/50 py-3 rounded-xl border border-white/[0.08] hover:border-white/[0.15] hover:text-white/70 transition-all block"
                        >
                            Sign in as a Customer
                        </Link>
                    </div>
                </div>

                <p className="text-center text-[13px] text-white/20 mt-7">Extract Menswear · Admin Portal</p>
            </motion.div>
        </main>
    );
}
