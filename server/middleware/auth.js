import jwt from "jsonwebtoken";

// Middleware for admin-only routes (existing admin panel)
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
    }
    try {
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware for user routes
export const userAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Please sign in to continue" });
    }
    try {
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Session expired. Please sign in again" });
    }
};

// Middleware to require a specific role
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin || !roles.includes(req.admin.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};

export default authMiddleware;
