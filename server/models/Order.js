import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String },
    userName: { type: String },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    invoiceNumber: { type: String },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: String,
            price: Number,
            quantity: Number,
            size: String,
            imageUrl: String,
            images: { type: [String], default: [] },
        },
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        name: { type: String, default: "" },
        phone: { type: String, default: "" },
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        pincode: { type: String, default: "" },
        country: { type: String, default: "India" },
    },
    shipping: { type: Number, default: 0 },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    status: {
        type: String,
        default: "created",
        enum: ["created", "paid", "shipped", "delivered", "return-requested", "exchange-requested", "returned", "exchanged", "failed"],
    },
    returnReason: { type: String },
    exchangeReason: { type: String },
    createdAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });

export default mongoose.model("Order", orderSchema);
