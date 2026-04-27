import mongoose from "mongoose";

const categoryOptionSchema = new mongoose.Schema({
    category: { type: String, required: true, enum: ["shirt", "trouser"], unique: true },
    fabrics: [{ type: String, trim: true }],
    styles: [{ type: String, trim: true }],
    sizes: [{ type: String, trim: true }],
}, { timestamps: true });

export default mongoose.model("CategoryOption", categoryOptionSchema);
