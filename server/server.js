import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

const app = express();
app.set("trust proxy", 1);

// ─── Gzip Compression ───
app.use(compression());

// ─── Security Headers ───
app.use(helmet());

// ─── CORS — strict origin only ───
const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "https://chastise-green-hesitancy.ngrok-free.dev", "https://mossy-roast-moonlight.ngrok-free.dev"].filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

// ─── Rate Limiting — global ───
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    skip: (req) => req.method === "GET", // skip rate limiting for read-only browsing
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
}));

// ─── Stricter rate limit for auth routes ───
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // only 20 login/register attempts per 15 min
    message: { message: "Too many login attempts, please try again later." },
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Prevent NoSQL Injection ───
app.use(mongoSanitize());

// ─── Prevent HTTP Parameter Pollution ───
app.use(hpp());

// ─── Routes ───
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ─── Global Error Handler — NEVER leak stack traces ───
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(err.status || 500).json({ message: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}); // reload comment for test run

