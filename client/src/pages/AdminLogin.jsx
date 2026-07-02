import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import API from "../services/api";
import { ADMIN_PATH } from "../config/adminPath";
import { motion } from "framer-motion";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { GoogleLogin } from "@react-oauth/google";

export default function AdminLogin() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/admin-google", { credential: credentialResponse.credential });
            dispatch(loginSuccess(data));
            navigate(`/${ADMIN_PATH}/dashboard`);
        } catch (err) {
            setError(err.response?.data?.message || "Google sign-in failed");
        } finally {
            setLoading(false);
        }
    };

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
                            <p className="text-[16px] text-white/50">Only Google accounts affiliated as administrators can log in here.</p>
                        </div>

                        {error && (
                            <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                        )}

                        <div className="flex justify-center py-2 bg-white/5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors p-4">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Google login failed")}
                                theme="filled_blue"
                                size="large"
                                width="320"
                            />
                        </div>

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

