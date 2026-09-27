import crypto from "crypto";
import Otp from "../models/Otp.js";

// OTPs live in MongoDB (hashed) so they survive restarts and work across instances.
// Signup and password-reset codes are stored under separate keys.

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // 1 minute between resends

const keyFor = (email, purpose) => `${purpose}:${email.toLowerCase().trim()}`;
const hashOtp = (otp) => crypto.createHmac("sha256", process.env.JWT_SECRET).update(String(otp)).digest("hex");

export function generateOtp() {
    return String(crypto.randomInt(100000, 1000000)); // 6-digit, CSPRNG
}

export async function saveOtp(email, otp, purpose) {
    const key = keyFor(email, purpose);
    const existing = await Otp.findOne({ key }).lean();
    if (existing && existing.expiresAt > new Date() && Date.now() - new Date(existing.createdAt).getTime() < COOLDOWN_MS) {
        return { error: "Please wait before requesting another code" };
    }
    await Otp.findOneAndUpdate(
        { key },
        { key, otpHash: hashOtp(otp), attempts: 0, createdAt: new Date(), expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
        { upsert: true }
    );
    return { success: true };
}

export async function verifyOtp(email, otp, purpose) {
    const key = keyFor(email, purpose);
    const entry = await Otp.findOne({ key });

    if (!entry || entry.expiresAt <= new Date()) {
        return { valid: false, message: "Verification code expired. Please request a new one." };
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
        await Otp.deleteOne({ _id: entry._id });
        return { valid: false, message: "Too many attempts. Please request a new code." };
    }

    // Count the attempt atomically before comparing
    await Otp.updateOne({ _id: entry._id }, { $inc: { attempts: 1 } });
    const attemptsUsed = entry.attempts + 1;

    const expected = Buffer.from(entry.otpHash, "hex");
    const given = Buffer.from(hashOtp(String(otp ?? "").trim()), "hex");
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
        return { valid: false, message: `Invalid code. ${Math.max(0, MAX_ATTEMPTS - attemptsUsed)} attempts remaining.` };
    }

    await Otp.deleteOne({ _id: entry._id });
    return { valid: true };
}

export async function clearOtp(email, purpose) {
    await Otp.deleteOne({ key: keyFor(email, purpose) });
}
