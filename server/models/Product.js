import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["shirt", "trouser"] },
    fabric: { type: String, trim: true },
    style: { type: String, trim: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    imageUrl: { type: String, required: true },
    images: [{ type: String }],
    videoUrl: { type: String, trim: true, default: "" },
    sizes: [{ type: String, trim: true }],
    stock: { type: Number, default: 0 },
    reviews: [reviewSchema],
    ratings: { type: Number, default: 4.0 },
    numOfReviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

productSchema.index({ category: 1 });
productSchema.index({ fabric: 1 });
productSchema.index({ style: 1 });
productSchema.index({ sizes: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text" });
export default mongoose.model("Product", productSchema);
