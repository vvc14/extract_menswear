import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: String,
            price: Number,
            quantity: Number,
        },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "created", enum: ["created", "paid", "failed"] },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
