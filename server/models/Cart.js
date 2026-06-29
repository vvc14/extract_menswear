import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    images: { type: [String], default: [] },
    category: { type: String },
    fabric: { type: String },
    style: { type: String },
    shippingCost: { type: Number, default: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    size: { type: String },
});

const cartSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        items: [cartItemSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
