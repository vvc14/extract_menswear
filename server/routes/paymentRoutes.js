import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { userAuth } from "../middleware/auth.js";

const router = Router();

router.post("/razorpay/order", userAuth, createOrder);
router.post("/razorpay/verify", verifyPayment);

export default router;
