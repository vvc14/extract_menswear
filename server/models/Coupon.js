import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usageLimit: {
            type: Number,
            default: null, // null means unlimited
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        expiryDate: {
            type: Date,
            default: null, // null means never expires
        },
    },
    { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
