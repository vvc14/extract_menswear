import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["shirt", "trouser"] },
    fabric: { type: String, trim: true },
    style: { type: String, trim: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    imageUrl: { type: String, required: true },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);
