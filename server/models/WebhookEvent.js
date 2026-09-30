import mongoose from "mongoose";

// Razorpay webhook deliveries already processed, keyed by the x-razorpay-event-id header.
// Razorpay may deliver the same event more than once; records expire after 30 days.
const webhookEventSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    event: { type: String },
    receivedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

export default mongoose.model("WebhookEvent", webhookEventSchema);
