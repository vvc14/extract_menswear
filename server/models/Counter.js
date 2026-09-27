import mongoose from "mongoose";

// Atomic sequence counters (e.g. invoice numbers).
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);
