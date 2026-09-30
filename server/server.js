import "dotenv/config";

// ─── Fail fast on missing configuration ───
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters");
    process.exit(1);
}
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn("⚠️  RAZORPAY_WEBHOOK_SECRET is not set: payments completed after the browser closes will not be recorded automatically.");
}
if (isProduction && !process.env.CLIENT_URL?.startsWith("https://")) {
    console.warn("⚠️  CLIENT_URL should be your https:// storefront URL in production (used for CORS).");
}

// Load the app only after the environment has been validated (static imports would run first)
const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./config/db.js");
const { default: mongoose } = await import("mongoose");
const { expireStaleOrders } = await import("./services/orderService.js");
const { runStartupMigrations } = await import("./utils/startupMigrations.js");
const { describeEmailSetup } = await import("./utils/emailTransporter.js");

// Explain email settings that are known to break delivery or land in spam
const emailSetup = describeEmailSetup();
for (const warning of emailSetup.warnings) console.warn(`📧 ${warning}`);

// Hosts such as Render inject PORT and require binding to 0.0.0.0
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

let server = null;
let expiryTimer = null;
let shuttingDown = false;

// Graceful shutdown: hosts send SIGTERM on every deploy/restart and force-kill ~30 s later.
// Stop accepting connections, let in-flight requests (e.g. payment confirmations) finish,
// then close the database connection.
const shutdown = (signal, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received: shutting down gracefully`);
    if (expiryTimer) clearInterval(expiryTimer);
    const forceExit = setTimeout(() => {
        console.error("Shutdown timed out; exiting");
        process.exit(1);
    }, 25_000);
    forceExit.unref();

    const closeDb = () =>
        mongoose.connection.close(false)
            .catch((err) => console.error("Error closing MongoDB connection:", err.message))
            .finally(() => process.exit(exitCode));

    if (server) {
        server.close(() => closeDb());
        // Idle keep-alive sockets would otherwise hold the server open
        server.closeIdleConnections?.();
    } else {
        closeDb();
    }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
// An unhandled rejection means a bug; log it and restart cleanly instead of running in an unknown state
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
    shutdown("unhandledRejection", 1);
});

connectDB()
    .then(async () => {
        await runStartupMigrations();
        // Release stock held by unpaid orders whose payment window has passed
        expiryTimer = setInterval(() => expireStaleOrders().catch((err) => console.error("Order expiry job error:", err.message)), 60 * 1000);
        expireStaleOrders().catch((err) => console.error("Order expiry job error:", err.message));
        server = app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));
        // Keep-alive longer than typical load-balancer idle timeouts to avoid 502s on reused sockets
        server.keepAliveTimeout = 65_000;
        server.headersTimeout = 66_000;
    })
    .catch((err) => {
        console.error("Startup failed:", err);
        process.exit(1);
    });
