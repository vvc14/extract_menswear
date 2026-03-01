import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";

const router = Router();

router.post("/razorpay/order", createOrder);
router.post("/razorpay/verify", verifyPayment);

export default router;
