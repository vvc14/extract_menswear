import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createOrder, verifyPayment, cancelPendingOrder } from "../controllers/paymentController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

// Each checkout reserves stock, so cap how often one account can start one.
// Keyed by user (runs after userAuth) so shoppers sharing an IP don't block each other.
const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    keyGenerator: (req) => `user:${req.user.id}`,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many checkout attempts. Please wait a few minutes." },
});

router.post("/razorpay/order", userAuth, checkoutLimiter, createOrder);
router.post("/razorpay/verify", verifyPayment);
router.post("/razorpay/cancel", userAuth, cancelPendingOrder);
// The webhook is mounted in server.js with a raw body parser

export default router;
