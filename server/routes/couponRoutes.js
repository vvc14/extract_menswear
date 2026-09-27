import express from "express";
import rateLimit from "express-rate-limit";
import { validateCoupon, getActiveCoupons } from "../controllers/couponController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

const couponLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many coupon attempts. Please try again later." },
});

router.get("/", getActiveCoupons);
router.post("/validate", couponLimiter, optionalAuth, validateCoupon);

export default router;
