import mongoose from "mongoose";

export const ORDER_STATUSES = ["created", "paid", "shipped", "delivered", "return-requested", "exchange-requested", "returned", "exchanged", "failed", "cancelled"];

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
            quantity: { type: Number, min: 1 },
            size: String,
            imageUrl: String,
            images: { type: [String], default: [] },
        },
    ],
    // Subtotal after coupon discount, EXCLUDING shipping. Amount charged = totalAmount + shipping.
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
    // true while this order holds a coupon use (reserved at creation, released on failure/expiry)
    couponReserved: { type: Boolean, default: false },
    status: { type: String, default: "created", enum: ORDER_STATUSES },
    // true while this order's items are deducted from inventory.
    // undefined on orders created before reservations existed (see services/orderService.js).
    stockReserved: { type: Boolean },
    reservedUntil: { type: Date },
    trackingNumber: { type: String },
    carrierName: { type: String },
    returnReason: { type: String },
    exchangeReason: { type: String },
    cancelReason: { type: String },
    returnRejected: { type: Boolean, default: false },
    exchangeRejected: { type: Boolean, default: false },
    // Size exchange lines. Replacement stock is reserved when the request is made.
    exchangeItems: [
        {
            itemId: { type: mongoose.Schema.Types.ObjectId },
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: String,
            fromSize: String,
            toSize: String,
            quantity: Number,
            reserved: { type: Boolean, default: false },
        },
    ],
    refund: {
        status: { type: String, enum: ["pending", "processed", "failed"] },
        razorpayRefundId: String,
        amount: Number,
        reason: String,
        error: String,
        requestedAt: Date,
        processedAt: Date,
    },
    statusHistory: [
        {
            status: String,
            at: { type: Date, default: Date.now },
            by: String,
            note: String,
        },
    ],
    createdAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 }, { unique: true });
orderSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ status: 1, reservedUntil: 1 });

export default mongoose.model("Order", orderSchema);
