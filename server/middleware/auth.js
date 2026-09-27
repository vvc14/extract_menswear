import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { verifySessionToken } from "../utils/tokens.js";

const readBearer = (req) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return null;
    return header.slice(7).trim() || null;
};

// Resolve a token to a live principal. Role and token version are checked against
// the database on every request so demotions, deletions and password resets take
// effect immediately instead of when the JWT expires.
const resolvePrincipal = async (token) => {
    let decoded;
    try {
        decoded = verifySessionToken(token);
    } catch {
        return null;
    }
    if (!decoded?.id || !["user", "admin"].includes(decoded.type)) return null;

    if (decoded.type === "admin" && decoded.kind === "admin") {
        const admin = await Admin.findById(decoded.id).select("username role tokenVersion").lean();
        if (!admin || admin.role !== "admin" || (admin.tokenVersion || 0) !== (decoded.tv || 0)) return null;
        return { id: String(admin._id), username: admin.username, role: "admin", type: "admin", kind: "admin" };
    }

    const user = await User.findById(decoded.id).select("name email role tokenVersion").lean();
    if (!user || (user.tokenVersion || 0) !== (decoded.tv || 0)) return null;
    if (decoded.type === "admin" && user.role !== "admin") return null;
    return {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        type: decoded.type,
        kind: "user",
    };
};

// Admin-only routes. Requires a valid session whose CURRENT role is admin.
const authMiddleware = async (req, res, next) => {
    try {
        const token = readBearer(req);
        if (!token) return res.status(401).json({ message: "Authentication required" });
        const principal = await resolvePrincipal(token);
        if (!principal) return res.status(401).json({ message: "Invalid or expired token" });
        if (principal.role !== "admin") return res.status(403).json({ message: "Access denied" });
        req.admin = principal;
        req.user = principal;
        next();
    } catch (err) {
        next(err);
    }
};

// Customer routes. Any live session (customers, and admins acting on their own account).
export const userAuth = async (req, res, next) => {
    try {
        const token = readBearer(req);
        if (!token) return res.status(401).json({ message: "Please sign in to continue" });
        const principal = await resolvePrincipal(token);
        if (!principal) return res.status(401).json({ message: "Session expired. Please sign in again" });
        req.user = principal;
        next();
    } catch (err) {
        next(err);
    }
};

// Optional auth: attaches req.user when a valid token is present, never rejects.
export const optionalAuth = async (req, res, next) => {
    try {
        const token = readBearer(req);
        if (token) {
            const principal = await resolvePrincipal(token);
            if (principal) req.user = principal;
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

export default authMiddleware;
