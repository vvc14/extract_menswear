import { Router } from "express";
import { adminLogin, userRegister, userLogin, getProfile, checkEmail, googleLogin } from "../controllers/authController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

// Email check (unified flow)
router.post("/check-email", checkEmail);

// Google sign-in
router.post("/google", googleLogin);

// Admin
router.post("/admin-login", adminLogin);

// User
router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/profile", userAuth, getProfile);

export default router;
