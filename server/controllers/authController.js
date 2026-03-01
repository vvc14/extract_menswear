import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import crypto from "crypto";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Google Sign-In ───
export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ message: "Google token is required" });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Auto-create account for Google users with a random secure password
            const randomPassword = crypto.randomBytes(32).toString("hex");
            user = await User.create({
                name: name || email.split("@")[0],
                email: email.toLowerCase(),
                password: randomPassword,
                role: "user",
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, type: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Google login error:", error.message);
        res.status(401).json({ message: "Google authentication failed" });
    }
};

// ─── Check if email exists (for unified flow) ───
export const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        res.json({ exists: !!user, name: user?.name || null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin Login (existing) ───
export const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const admin = await Admin.findOne({ username });
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role, type: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token, admin: { id: admin._id, username: admin.username, role: admin.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── User Register ───
export const userRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const user = await User.create({ name, email, password });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, type: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── User Login ───
export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, type: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get Profile ───
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
