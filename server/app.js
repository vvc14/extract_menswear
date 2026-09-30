import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import { razorpayWebhook } from "./controllers/paymentController.js";

const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));
app.disable("x-powered-by");

app.use(compression());
app.use(helmet());

// ─── CORS — configured origins only ───
// CLIENT_URL plus optional comma-separated CORS_ORIGINS. Localhost is allowed only outside production.
const allowedOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()),
    ...(isProduction ? [] : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]),
].filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        // Requests without an Origin header (server-to-server, curl, Razorpay webhooks) carry no browser credentials
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(null, false);
    },
    credentials: true,
}));

// ─── Razorpay webhook: needs the raw body for signature verification, so it is
//     registered before the JSON parser and sanitisers ───
app.post("/api/payment/razorpay/webhook", express.raw({ type: "application/json", limit: "1mb" }), razorpayWebhook);

// ─── Rate limiting — global ───
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    skip: (req) => req.method === "GET",
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
}));
// Looser limit for reads (search/list endpoints hit the database)
app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 600,
    skip: (req) => req.method !== "GET",
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please slow down." },
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Prevent NoSQL injection & HTTP parameter pollution ───
app.use(mongoSanitize());
app.use(hpp());

// ─── Routes ───
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);

// Health check (used by the host to decide when a new deploy can take traffic)
app.get("/api/health", (_, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({ status: dbReady ? "ok" : "starting", db: dbReady ? "connected" : "disconnected" });
});

app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

// ─── Global error handler — never leak internals ───
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err?.type === "entity.parse.failed") return res.status(400).json({ message: "Malformed JSON body" });
    if (err?.type === "entity.too.large") return res.status(413).json({ message: "Request body too large" });
    console.error("Unhandled error:", err);
    res.status(err.status && err.status < 500 ? err.status : 500).json({
        message: err.status && err.status < 500 ? err.message : "Something went wrong. Please try again.",
    });
});

export default app;
