import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import API from "../services/api";
import { motion } from "framer-motion";
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from "react-icons/hi";

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
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 20h40v1H0z'/%3E%3Cpath d='M20 0v40h1V0z'/%3E%3C/g%3E%3C/svg%3E\")" }} />

            {/* Gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[400px] relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-5 shadow-2xl shadow-primary/30 bg-white/90 flex items-center justify-center p-1">
                        <img src="/images/logo.png" alt="Extract Menswear" className="h-full w-full object-contain" />
                    </div>
                    <h1 className="text-[26px] font-extrabold tracking-tight text-white mb-2">Admin Access</h1>
                    <p className="text-[14px] text-slate-400">Sign in to manage Extract Menswear</p>
                </div>

                {/* Card */}
                <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-7 sm:p-8 shadow-2xl">
                    {error && (
                        <div className="bg-rose/10 border border-rose/20 text-rose text-[13px] font-semibold px-4 py-3 rounded-xl mb-5">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="admin-username" className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                            <input
                                id="admin-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                autoFocus
                                placeholder="admin"
                                className="w-full bg-white/[0.06] border border-white/[0.1] px-4 py-3.5 text-[15px] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-slate-600"
                            />
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.06] border border-white/[0.1] px-4 py-3.5 pr-12 text-[15px] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-blue-600 text-white text-[15px] font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 mt-1"
                        >
                            {loading ? "Authenticating..." : "Sign In to Dashboard"}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-[12px] text-slate-500 hover:text-slate-300 transition-colors font-medium">
                        ← Back to Storefront
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
