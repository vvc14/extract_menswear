import { Router } from "express";
import { adminLogin, userRegister, userLogin, getProfile, updateProfile, checkEmail, googleLogin, sendOtp, verifyOtp } from "../controllers/authController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

// Email check (unified flow)
router.post("/check-email", checkEmail);

// OTP email verification
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Google sign-in
router.post("/google", googleLogin);

// Admin
router.post("/admin-login", adminLogin);

// User
router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/profile", userAuth, getProfile);
router.put("/profile", userAuth, updateProfile);

export default router;
