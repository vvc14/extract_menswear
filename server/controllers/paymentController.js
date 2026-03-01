import crypto from "crypto";
import razorpayInstance from "../config/razorpay.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
    try {
        const { amount, items } = req.body;

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        await Order.create({
            razorpayOrderId: razorpayOrder.id,
            items,
            totalAmount: amount,
            status: "created",
        });

        res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { razorpayPaymentId: razorpay_payment_id, status: "paid" }
        );

        res.json({ message: "Payment verified successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
