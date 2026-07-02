import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowLeft, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineShieldCheck } from "react-icons/hi";
import { GoogleLogin } from "@react-oauth/google";

const STEP_EMAIL = "email";
const STEP_PASSWORD = "password";
const STEP_OTP = "otp";
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
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [emailVerificationToken, setEmailVerificationToken] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const goTo = (r) => navigate(r === "cart" ? "/cart" : r);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/google", { credential: credentialResponse.credential });
            dispatch(loginSuccess(data));
            goTo(redirect);
        } catch (err) {
            setError(err.response?.data?.message || (err.message === "Network Error" ? "Network Error: Could not connect to server" : "Google sign-in failed. Please try again."));
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
                // Email doesn't exist — send OTP for verification
                await sendOtpRequest();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const sendOtpRequest = async () => {
        setError("");
        setLoading(true);
        try {
            await API.post("/auth/send-otp", { email });
            setStep(STEP_OTP);
            setOtp(["", "", "", "", "", ""]);
            setResendCooldown(60);
            // Focus first OTP input after transition
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
            newOtp[i] = pasted[i] || "";
        }
        setOtp(newOtp);
        // Focus last filled or the next empty
        const focusIndex = Math.min(pasted.length, 5);
        otpRefs.current[focusIndex]?.focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/verify-otp", { email, otp: otpString });
            if (data.verified) {
                setEmailVerificationToken(data.emailVerificationToken);
                setStep(STEP_CREATE);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        await sendOtpRequest();
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
            const { data } = await API.post("/auth/register", { name, email, password, emailVerificationToken });
            dispatch(loginSuccess(data));
            goTo(redirect);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (step === STEP_CREATE) {
            // Go back to OTP step — but since OTP is already verified, go to email
            setStep(STEP_EMAIL);
        } else {
            setStep(STEP_EMAIL);
        }
        setPassword("");
        setName("");
        setError("");
        setOtp(["", "", "", "", "", ""]);
        setEmailVerificationToken("");
    };

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
                            <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
                                className="flex flex-col gap-6"
                            >
                                <div className="text-center">
                                    <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">Welcome Back</h1>
                                    <p className="text-[16px] text-white/50">Sign in or create your account</p>
                                </div>

                                {/* Google Sign-In */}
                                <div className="flex justify-center">
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
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-[13px] text-white/30 font-semibold">or continue with email</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                                )}

                                <form onSubmit={handleEmailContinue} className="flex flex-col gap-5">
                                    <div>
                                        <label htmlFor="auth-email" className="block text-[14px] font-bold text-white/60 mb-2.5">Email address</label>
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
                                        className="w-full text-white text-[16px] font-bold py-4.5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] cursor-pointer mt-1"
                                        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                                    >
                                        {loading ? "Checking..." : "Continue"}
                                    </button>
                                </form>

                                <p className="text-[12px] text-white/25 text-center mt-2 leading-relaxed">
                                    By continuing, you agree to Extract's Terms of Use and Privacy Policy.
                                </p>
                            </motion.div>
                        )}

                        {/* ──────── STEP 2a: PASSWORD (existing user) ──────── */}
                        {step === STEP_PASSWORD && (
                            <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                                className="flex flex-col gap-6"
                            >
                                <div>
                                    <button onClick={goBack} className="flex items-center gap-2 text-[14px] font-semibold text-white/40 hover:text-white/70 transition-colors mb-4 cursor-pointer">
                                        <HiOutlineArrowLeft className="w-4 h-4" /> Change email
                                    </button>
                                    <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">
                                        Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
                                    </h1>
                                    <p className="text-[15px] text-white/50"><span className="font-semibold text-white/70">{email}</span></p>
                                </div>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                                )}

                                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                                    <div>
                                        <label htmlFor="auth-password" className="block text-[14px] font-bold text-white/60 mb-2.5">Password</label>
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
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 cursor-pointer">
                                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full text-white text-[16px] font-bold py-4.5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] cursor-pointer mt-1"
                                        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                                        {loading ? "Signing in..." : "Sign In"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* ──────── STEP 2b: OTP VERIFICATION (new user) ──────── */}
                        {step === STEP_OTP && (
                            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                                className="flex flex-col gap-6"
                            >
                                <div>
                                    <button onClick={goBack} className="flex items-center gap-2 text-[14px] font-semibold text-white/40 hover:text-white/70 transition-colors mb-4 cursor-pointer">
                                        <HiOutlineArrowLeft className="w-4 h-4" /> Change email
                                    </button>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                                            <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                                        </div>
                                        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">Verify your email</h1>
                                    </div>
                                    <p className="text-[15px] text-white/50 mt-2">
                                        We've sent a 6-digit code to <span className="font-semibold text-white/70">{email}</span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                                )}

                                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                                    <div>
                                        <label className="block text-[14px] font-bold text-white/60 mb-3">Enter verification code</label>
                                        <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                            {otp.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={(el) => (otpRefs.current[i] = el)}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-[22px] font-bold text-white bg-white/[0.07] border border-white/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                                                    autoFocus={i === 0}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading || otp.join("").length !== 6}
                                        className="w-full text-white text-[16px] font-bold py-4.5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] cursor-pointer mt-1"
                                        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                                        {loading ? "Verifying..." : "Verify & Continue"}
                                    </button>
                                </form>

                                <div className="text-center">
                                    <p className="text-[13px] text-white/30">
                                        Didn't receive the code?{" "}
                                        {resendCooldown > 0 ? (
                                            <span className="text-white/40 font-semibold">Resend in {resendCooldown}s</span>
                                        ) : (
                                            <button
                                                onClick={handleResendOtp}
                                                disabled={loading}
                                                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                Resend code
                                            </button>
                                        )}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ──────── STEP 3: CREATE ACCOUNT (after OTP verified) ──────── */}
                        {step === STEP_CREATE && (
                            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                                className="flex flex-col gap-6"
                            >
                                <div>
                                    <button onClick={goBack} className="flex items-center gap-2 text-[14px] font-semibold text-white/40 hover:text-white/70 transition-colors mb-4 cursor-pointer">
                                        <HiOutlineArrowLeft className="w-4 h-4" /> Change email
                                    </button>
                                    <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight mb-2">Create your account</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <p className="text-[14px] text-emerald-400 font-semibold">{email} — verified</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[14px] font-semibold px-4 py-3 rounded-xl">{error}</div>
                                )}

                                <form onSubmit={handleCreate} className="flex flex-col gap-5">
                                    <div>
                                        <label htmlFor="auth-name" className="block text-[14px] font-bold text-white/60 mb-2.5">Your name</label>
                                        <div className="relative">
                                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                            <input id="auth-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" autoFocus placeholder="First and last name"
                                                className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="create-password" className="block text-[14px] font-bold text-white/60 mb-2.5">Create password</label>
                                        <div className="relative">
                                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                            <input id="create-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="At least 6 characters"
                                                className={inputClass + " pr-12"} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 cursor-pointer">
                                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-[12px] text-white/30 mt-2">Must be at least 6 characters</p>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full text-white text-[16px] font-bold py-4.5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] cursor-pointer mt-1"
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
