import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowLeft, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import { GoogleLogin } from "@react-oauth/google";

const STEP_EMAIL = "email";
const STEP_PASSWORD = "password";
const STEP_CREATE = "create";

export default function Login() {
    const [step, setStep] = useState(STEP_EMAIL);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const goTo = (r) => navigate(r === "cart" ? "/cart" : r);

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/google", { credential: credentialResponse.credential });
            dispatch(loginSuccess(data));
            goTo(redirect);
        } catch (err) {
            setError(err.response?.data?.message || "Google sign-in failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailContinue = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/check-email", { email });
            if (data.exists) {
                setUserName(data.name || "");
                setStep(STEP_PASSWORD);
            } else {
                setStep(STEP_CREATE);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/login", { email, password });
            dispatch(loginSuccess(data));
            goTo(redirect);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid password");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setLoading(true);
        try {
            const { data } = await API.post("/auth/register", { name, email, password });
            dispatch(loginSuccess(data));
            goTo(redirect);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => { setStep(STEP_EMAIL); setPassword(""); setName(""); setError(""); };

    const inputClass = "w-full bg-white/[0.07] border border-white/[0.12] text-white text-[16px] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-white/30";

    return (
        <main className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
            {/* Ambient light effects */}
            <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
            <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 60%)" }} />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")", backgroundSize: "40px 40px" }} />

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[460px] mx-4"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block group">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 shadow-2xl shadow-blue-500/20 transition-transform group-hover:scale-105 bg-white/90 flex items-center justify-center p-1">
                            <img src="/images/logo.png" alt="Extract Menswear" className="h-full w-full object-contain" />
                        </div>
                    </Link>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.08] p-7 sm:p-9" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(40px)" }}>
                    <AnimatePresence mode="wait">
                        {/* ──────── STEP 1: EMAIL ──────── */}
                        {step === STEP_EMAIL && (
                            <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                                <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight text-center mb-2">Welcome Back</h1>
                                <p className="text-[16px] text-white/50 text-center mb-8">Sign in or create your account</p>

                                {/* Google Sign-In */}
                                <div className="flex justify-center mb-6">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError("Google sign-in failed. Please try again.")}
                                        shape="pill"
                                        width="380"
                                        text="continue_with"
                                        theme="filled_black"
                                        size="large"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-[13px] text-white/30 font-semibold">or continue with email</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl mb-5">{error}</div>
                                )}

                                <form onSubmit={handleEmailContinue} className="space-y-5">
                                    <div>
                                        <label htmlFor="auth-email" className="block text-[14px] font-bold text-white/60 mb-2">Email address</label>
                                        <div className="relative">
                                            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                            <input
                                                id="auth-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                                autoFocus
                                                placeholder="you@example.com"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full text-white text-[16px] font-bold py-5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                                        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                                    >
                                        {loading ? "Checking..." : "Continue"}
                                    </button>
                                </form>

                                <p className="text-[12px] text-white/25 text-center mt-7 leading-relaxed">
                                    By continuing, you agree to Extract's Terms of Use and Privacy Policy.
                                </p>
                            </motion.div>
                        )}

                        {/* ──────── STEP 2a: PASSWORD ──────── */}
                        {step === STEP_PASSWORD && (
                            <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <button onClick={goBack} className="flex items-center gap-2 text-[14px] font-semibold text-white/40 hover:text-white/70 transition-colors mb-6">
                                    <HiOutlineArrowLeft className="w-4 h-4" /> Change email
                                </button>
                                <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">
                                    Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
                                </h1>
                                <p className="text-[15px] text-white/50 mb-7"><span className="font-semibold text-white/70">{email}</span></p>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl mb-5">{error}</div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div>
                                        <label htmlFor="auth-password" className="block text-[14px] font-bold text-white/60 mb-2">Password</label>
                                        <div className="relative">
                                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                            <input
                                                id="auth-password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                                autoFocus
                                                placeholder="Enter your password"
                                                className={inputClass + " pr-12"}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1">
                                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full text-white text-[16px] font-bold py-5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                                        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                                        {loading ? "Signing in..." : "Sign In"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* ──────── STEP 2b: CREATE ACCOUNT ──────── */}
                        {step === STEP_CREATE && (
                            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <button onClick={goBack} className="flex items-center gap-2 text-[14px] font-semibold text-white/40 hover:text-white/70 transition-colors mb-6">
                                    <HiOutlineArrowLeft className="w-4 h-4" /> Change email
                                </button>
                                <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">Create your account</h1>
                                <p className="text-[15px] text-white/50 mb-7">for <span className="font-semibold text-white/70">{email}</span></p>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl mb-5">{error}</div>
                                )}

                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div>
                                        <label htmlFor="auth-name" className="block text-[14px] font-bold text-white/60 mb-2">Your name</label>
                                        <div className="relative">
                                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                            <input id="auth-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" autoFocus placeholder="First and last name"
                                                className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="create-password" className="block text-[14px] font-bold text-white/60 mb-2">Create password</label>
                                        <div className="relative">
                                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                            <input id="create-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="At least 6 characters"
                                                className={inputClass + " pr-12"} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1">
                                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-[12px] text-white/30 mt-2">Must be at least 6 characters</p>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full text-white text-[16px] font-bold py-5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                                        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                                        {loading ? "Creating account..." : "Create Account & Sign In"}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-[13px] text-white/20 mt-7">Extract Menswear · Premium Fashion</p>
            </motion.div>
        </main>
    );
}
