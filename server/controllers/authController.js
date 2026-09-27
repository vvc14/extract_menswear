import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { generateOtp, saveOtp, verifyOtp as verifyStoredOtp, clearOtp } from "../utils/otpStore.js";
import { sendOtpEmail } from "../utils/emailSender.js";
import { validateEmailDomain } from "../utils/emailValidator.js";
import { signUserToken, signAdminToken, signOtpToken, verifyOtpToken } from "../utils/tokens.js";
import { handleError, httpError } from "../utils/httpError.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 72; // bcrypt only uses the first 72 bytes

const normalizeEmail = (email) => {
    if (typeof email !== "string") return "";
    return email.toLowerCase().trim();
};

const requireEmail = (email) => {
    const normalized = normalizeEmail(email);
    if (!normalized || !EMAIL_RE.test(normalized)) throw httpError(400, "A valid email is required");
    return normalized;
};

const validatePassword = (password) => {
    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
        throw httpError(400, `Password must be at least ${MIN_PASSWORD} characters`);
    }
    if (password.length > MAX_PASSWORD) {
        throw httpError(400, `Password must be at most ${MAX_PASSWORD} characters`);
    }
};

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

const isEmailDeliveryError = (error) => error?.responseCode === 550 || error?.code === "EENVELOPE";

const verifyGoogleCredential = async (credential) => {
    if (!credential || typeof credential !== "string") throw httpError(400, "Google token is required");
    if (!process.env.GOOGLE_CLIENT_ID) throw httpError(503, "Google sign-in is not configured");
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
    } catch {
        throw httpError(401, "Google authentication failed");
    }
    if (!payload?.email) throw httpError(400, "Google account must have an email associated.");
    if (payload.email_verified !== true) throw httpError(401, "Your Google email address is not verified.");
    return payload;
};

// ─── Google Sign-In ───
export const googleLogin = async (req, res) => {
    try {
        const { email, name } = await verifyGoogleCredential(req.body.credential);
        const normalizedEmail = email.toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            try {
                user = await User.create({
                    name: name || normalizedEmail.split("@")[0],
                    email: normalizedEmail,
                    password: crypto.randomBytes(32).toString("hex"),
                    role: "user",
                    passwordSet: false,
                });
            } catch (err) {
                // Concurrent first sign-in: another request created the account
                if (err?.code !== 11000) throw err;
                user = await User.findOne({ email: normalizedEmail });
            }
        }

        res.json({ token: signUserToken(user), user: publicUser(user) });
    } catch (error) {
        handleError(res, error, "Google login");
    }
};

// ─── Google Admin Sign-In ───
export const adminGoogleLogin = async (req, res) => {
    try {
        const { email } = await verifyGoogleCredential(req.body.credential);
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Only registered administrators can access the admin panel." });
        }
        res.json({
            token: signAdminToken(user, "user"),
            admin: { id: user._id, username: user.name || user.email, role: "admin" },
        });
    } catch (error) {
        handleError(res, error, "Admin Google login");
    }
};

// ─── Check if email exists (unified sign-in flow) ───
export const checkEmail = async (req, res) => {
    try {
        const email = requireEmail(req.body.email);
        const user = await User.exists({ email });
        res.json({ exists: !!user });
    } catch (error) {
        handleError(res, error, "Check email");
    }
};

// ─── Send signup OTP ───
export const sendOtp = async (req, res) => {
    try {
        const email = requireEmail(req.body.email);

        const domainCheck = await validateEmailDomain(email);
        if (!domainCheck.valid) return res.status(400).json({ message: domainCheck.message });

        if (await User.exists({ email })) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const otp = generateOtp();
        const result = await saveOtp(email, otp, "signup");
        if (result.error) return res.status(429).json({ message: result.error });

        try {
            await sendOtpEmail(email, otp);
        } catch (err) {
            await clearOtp(email, "signup");
            throw err;
        }
        res.json({ message: "Verification code sent to your email" });
    } catch (error) {
        if (isEmailDeliveryError(error)) {
            return res.status(400).json({ message: "This email address does not exist. Please check and try again." });
        }
        handleError(res, error, "Send OTP");
    }
};

// ─── Verify OTP → short-lived purpose-bound token ───
export const verifyOtp = async (req, res) => {
    try {
        const email = requireEmail(req.body.email);
        const { otp } = req.body;
        const purpose = req.body.purpose === "reset" ? "reset" : "signup";
        if (!otp) return res.status(400).json({ message: "Verification code is required" });

        const result = await verifyStoredOtp(email, otp, purpose);
        if (!result.valid) return res.status(400).json({ message: result.message });

        let tv = 0;
        if (purpose === "reset") {
            const user = await User.findOne({ email }).select("tokenVersion").lean();
            if (!user) return res.status(404).json({ message: "No account found with this email address" });
            tv = user.tokenVersion || 0;
        }
        res.json({ verified: true, emailVerificationToken: signOtpToken(email, purpose, tv) });
    } catch (error) {
        handleError(res, error, "Verify OTP");
    }
};

// ─── Admin Login (Admin collection) ───
export const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const admin = await Admin.findOne({ username: username.trim() });
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({ token: signAdminToken(admin, "admin"), admin: { id: admin._id, username: admin.username, role: admin.role } });
    } catch (error) {
        handleError(res, error, "Admin login");
    }
};

// ─── User Register (requires signup OTP token) ───
export const userRegister = async (req, res) => {
    try {
        const { name, password, emailVerificationToken } = req.body;
        const email = requireEmail(req.body.email);
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }
        if (name.trim().length > 80) return res.status(400).json({ message: "Name is too long" });
        if (!emailVerificationToken) return res.status(400).json({ message: "Email verification is required" });
        validatePassword(password);

        let valid = false;
        try {
            valid = verifyOtpToken(emailVerificationToken, email, "signup");
        } catch {
            return res.status(400).json({ message: "Email verification expired. Please verify your email again." });
        }
        if (!valid) return res.status(400).json({ message: "Invalid email verification. Please verify your email again." });

        if (await User.exists({ email })) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const user = await User.create({ name: name.trim(), email, password });
        res.status(201).json({ token: signUserToken(user), user: publicUser(user) });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
        handleError(res, error, "Register");
    }
};

// ─── User Login ───
export const userLogin = async (req, res) => {
    try {
        const { password } = req.body;
        const email = normalizeEmail(req.body.email);
        if (!email || typeof password !== "string" || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({ token: signUserToken(user), user: publicUser(user) });
    } catch (error) {
        handleError(res, error, "Login");
    }
};

// ─── Get Profile ───
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -tokenVersion");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        handleError(res, error, "Get profile");
    }
};

// ─── Update Profile ───
export const updateProfile = async (req, res) => {
    try {
        const { name, password, currentPassword, addresses } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Name cannot be empty" });
            if (name.trim().length > 80) return res.status(400).json({ message: "Name is too long" });
            user.name = name.trim();
        }

        let passwordChanged = false;
        if (password) {
            validatePassword(password);
            // Accounts that already have a password must confirm it before changing
            if (user.passwordSet !== false) {
                if (typeof currentPassword !== "string" || !currentPassword || !(await user.comparePassword(currentPassword))) {
                    return res.status(400).json({ message: "Current password is incorrect" });
                }
            }
            user.password = password;
            user.passwordSet = true;
            user.tokenVersion = (user.tokenVersion || 0) + 1; // sign out other sessions
            passwordChanged = true;
        }

        if (addresses !== undefined) {
            if (!Array.isArray(addresses)) return res.status(400).json({ message: "Addresses must be an array" });
            if (addresses.length > 10) return res.status(400).json({ message: "You can save up to 10 addresses" });

            const cleaned = [];
            for (const addr of addresses) {
                if (!addr || typeof addr !== "object") return res.status(400).json({ message: "Invalid address" });
                const fields = ["name", "phone", "street", "city", "state", "pincode"];
                if (fields.some((f) => typeof addr[f] !== "string" || !addr[f].trim())) {
                    return res.status(400).json({ message: "All address fields (name, phone, street, city, state, pincode) are required." });
                }
                if (!/^\d{10}$/.test(addr.phone.trim())) {
                    return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
                }
                if (!/^\d{6}$/.test(addr.pincode.trim())) {
                    return res.status(400).json({ message: "Pincode must be exactly 6 digits and numeric only." });
                }
                cleaned.push({
                    name: addr.name.trim(),
                    phone: addr.phone.trim(),
                    street: addr.street.trim(),
                    city: addr.city.trim(),
                    state: addr.state.trim(),
                    pincode: addr.pincode.trim(),
                    country: typeof addr.country === "string" && addr.country.trim() ? addr.country.trim() : "India",
                    isDefault: !!addr.isDefault,
                });
            }
            user.addresses = cleaned;
        }

        await user.save();
        const updatedUser = await User.findById(req.user.id).select("-password -tokenVersion").lean();
        // A password change revokes old tokens, so hand the caller a fresh one
        res.json(passwordChanged ? { ...updatedUser, token: signUserToken(user) } : updatedUser);
    } catch (error) {
        handleError(res, error, "Update profile");
    }
};

// ─── Forgot Password: send reset OTP ───
export const sendForgotPasswordOtp = async (req, res) => {
    try {
        const email = requireEmail(req.body.email);

        if (!(await User.exists({ email }))) {
            return res.status(404).json({ message: "No account found with this email address" });
        }

        const otp = generateOtp();
        const result = await saveOtp(email, otp, "reset");
        if (result.error) return res.status(429).json({ message: result.error });

        try {
            await sendOtpEmail(email, otp);
        } catch (err) {
            await clearOtp(email, "reset");
            throw err;
        }
        res.json({ message: "Verification code sent to your email" });
    } catch (error) {
        if (isEmailDeliveryError(error)) {
            return res.status(400).json({ message: "This email address does not exist. Please check and try again." });
        }
        handleError(res, error, "Forgot password OTP");
    }
};

// ─── Forgot Password: reset using reset OTP token ───
export const resetPassword = async (req, res) => {
    try {
        const { emailVerificationToken, newPassword } = req.body;
        const email = requireEmail(req.body.email);
        if (!emailVerificationToken || !newPassword) {
            return res.status(400).json({ message: "Email, verification token, and new password are required" });
        }
        validatePassword(newPassword);

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        let valid = false;
        try {
            valid = verifyOtpToken(emailVerificationToken, email, "reset", user.tokenVersion || 0);
        } catch {
            return res.status(400).json({ message: "Verification expired. Please verify your email again." });
        }
        if (!valid) return res.status(400).json({ message: "Invalid or already used verification. Please verify your email again." });

        user.password = newPassword;
        user.passwordSet = true;
        user.tokenVersion = (user.tokenVersion || 0) + 1; // revoke all existing sessions
        await user.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
        handleError(res, error, "Reset password");
    }
};
