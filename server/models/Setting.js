import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Setting", settingSchema);
