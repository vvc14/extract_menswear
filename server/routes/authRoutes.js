import { Router } from "express";
import rateLimit from "express-rate-limit";
import { adminLogin, userRegister, userLogin, getProfile, updateProfile, checkEmail, googleLogin, sendOtp, verifyOtp, adminGoogleLogin, sendForgotPasswordOtp, resetPassword } from "../controllers/authController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

// Strict limit only on credential / OTP endpoints (not on profile reads)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." },
});

// Failed sign-ins per account, whatever IP they come from (successful logins don't count)
const accountLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `acct:${String(req.body?.email || req.body?.username || "").toLowerCase().trim() || "unknown"}`,
    message: { message: "Too many failed sign-in attempts for this account. Try again in 15 minutes or reset your password." },
});

router.post("/check-email", authLimiter, checkEmail);
router.post("/send-otp", authLimiter, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/forgot-password-send-otp", authLimiter, sendForgotPasswordOtp);
router.post("/forgot-password-reset", authLimiter, resetPassword);
router.post("/google", authLimiter, googleLogin);
router.post("/admin-login", authLimiter, accountLoginLimiter, adminLogin);
router.post("/admin-google", authLimiter, adminGoogleLogin);
router.post("/register", authLimiter, userRegister);
router.post("/login", authLimiter, accountLoginLimiter, userLogin);

router.get("/profile", userAuth, getProfile);
router.put("/profile", userAuth, updateProfile);

export default router;
