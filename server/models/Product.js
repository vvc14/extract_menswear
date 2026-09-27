import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    imageUrl: { type: String, trim: true, default: "" },
    verifiedPurchase: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Per-size inventory. When a product has sizeStock entries, each size is tracked
// independently and `stock` holds the total across sizes. Legacy products without
// sizeStock keep using the shared `stock` for every size.
const sizeStockSchema = new mongoose.Schema({
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["shirt", "trouser"] },
    fabric: { type: String, trim: true },
    style: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    shippingCost: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, required: true },
    images: [{ type: String }],
    videoUrl: { type: String, trim: true, default: "" },
    sizes: [{ type: String, trim: true }],
    sizeStock: { type: [sizeStockSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    reviews: [reviewSchema],
    ratings: { type: Number, default: 0 },
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
