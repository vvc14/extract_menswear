import mongoose from "mongoose";

// OTPs are stored hashed in MongoDB (works across restarts and multiple instances).
// The TTL index removes each document when expiresAt passes.
const otpSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // `${purpose}:${email}`
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
