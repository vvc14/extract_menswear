import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { validateCoupon, getActiveCoupons } from "../controllers/couponController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

const isStrict = ["production", "test"].includes(process.env.NODE_ENV);

// Counted per signed-in account (shoppers behind one office/mobile IP don't share a budget),
// falling back to the IP for guests.
const couponLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isStrict ? 30 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
    message: { message: "Too many coupon attempts. Please wait a few minutes and try again." },
});

router.get("/", getActiveCoupons);
router.post("/validate", optionalAuth, couponLimiter, validateCoupon);

export default router;
