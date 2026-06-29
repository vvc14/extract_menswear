import Razorpay from "razorpay";

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "test_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "test_key_secret",
});

export default razorpayInstance;
