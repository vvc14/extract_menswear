import { useState, useEffect, useRef } from "react";
import useElementWidth from "../hooks/useElementWidth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import API from "../services/api";
import { ADMIN_PATH } from "../config/adminPath";
import { motion } from "framer-motion";
import Logo from "../components/brand/Logo";
import { GoogleLogin } from "@react-oauth/google";

export default function AdminLogin() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const googleBoxRef = useRef(null);
    const googleBoxWidth = useElementWidth(googleBoxRef, 320);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { token, admin } = useSelector((s) => s.auth);

    // Redirect if already logged in as Admin
    useEffect(() => {
        if (token && admin) {
            navigate(`/${ADMIN_PATH}/dashboard`);
        }
    }, [token, admin, navigate]);

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
        <main id="main-content" className="board min-h-screen relative flex items-center justify-center overflow-hidden py-12">

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[460px] mx-4"
            >
                {/* Shield Icon */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-2"><Logo size="lg" /></div>
                </div>

                {/* Card */}
                <div className="border-2 border-black bg-ink p-7 sm:p-9 shadow-[8px_8px_0_#fff200]">
                    <div className="flex flex-col gap-6">
                        <div className="text-center">
                            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">Admin Panel</h1>
                            <p className="text-[16px] text-white/80">Only Google accounts affiliated as administrators can log in here.</p>
                        </div>

                        {error && (
                            <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                        )}

                        <div className="bg-white/5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors p-4">
                          <div ref={googleBoxRef} className="flex justify-center w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Google login failed")}
                                theme="filled_blue"
                                size="large"
                                width={String(Math.max(200, Math.min(320, googleBoxWidth)))}
                            />
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[13px] text-white/70 font-semibold">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <Link
                            to="/login"
                            className="w-full text-center text-[15px] font-bold text-white/80 py-3 rounded-xl border border-white/[0.08] hover:border-white/[0.15] hover:text-white/70 transition-all block"
                        >
                            Sign in as a Customer
                        </Link>
                    </div>
                </div>

                <p className="text-center text-[13px] text-white/75 mt-7">Extract Menswear · Admin Portal</p>
            </motion.div>
        </main>
    );
}

