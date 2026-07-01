/**
 * In-memory OTP store with auto-expiry.
 * For production, consider using Redis for multi-instance support.
 */

const store = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // 1 minute between resends

export function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

export function saveOtp(email, otp) {
    const key = email.toLowerCase().trim();
    const existing = store.get(key);

    // Enforce cooldown to prevent spam
    if (existing && Date.now() - existing.createdAt < COOLDOWN_MS) {
        return { error: "Please wait before requesting another code" };
    }

    // Clear any existing timer
    if (existing?.timer) clearTimeout(existing.timer);

    const timer = setTimeout(() => store.delete(key), OTP_EXPIRY_MS);

    store.set(key, {
        otp,
        attempts: 0,
        createdAt: Date.now(),
        timer,
    });

    return { success: true };
}

export function verifyOtp(email, otp) {
    const key = email.toLowerCase().trim();
    const entry = store.get(key);

    if (!entry) {
        return { valid: false, message: "Verification code expired. Please request a new one." };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
        store.delete(key);
        if (entry.timer) clearTimeout(entry.timer);
        return { valid: false, message: "Too many attempts. Please request a new code." };
    }

    entry.attempts += 1;

    if (entry.otp !== otp) {
        return { valid: false, message: `Invalid code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
    }

    // OTP is valid — clean up
    if (entry.timer) clearTimeout(entry.timer);
    store.delete(key);
    return { valid: true };
}
