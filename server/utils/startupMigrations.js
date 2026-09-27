import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Otp from "../models/Otp.js";
import Counter from "../models/Counter.js";

// Idempotent data fixes that run on every boot. Each step is safe to repeat.
export const runStartupMigrations = async () => {
    // 1. Orders created before stock reservations existed: stock was deducted at payment,
    //    so paid-and-later orders hold stock; everything else does not.
    const held = await Order.updateMany(
        { stockReserved: { $exists: false }, status: { $in: ["paid", "shipped", "delivered", "return-requested", "exchange-requested"] } },
        { $set: { stockReserved: true } }
    );
    const notHeld = await Order.updateMany({ stockReserved: { $exists: false } }, { $set: { stockReserved: false } });

    // 2. Legacy orders counted their coupon use at payment time
    await Order.updateMany(
        { couponReserved: { $exists: false }, couponCode: { $nin: [null, ""] }, status: { $nin: ["created", "failed"] } },
        { $set: { couponReserved: true } }
    );

    // 3. Oversold products may have negative stock, which the schema now rejects
    const negative = await Product.updateMany({ stock: { $lt: 0 } }, { $set: { stock: 0 } });

    // 4. Products still showing the old fake 4.0 default rating with no reviews
    await Product.updateMany({ numOfReviews: 0, ratings: { $ne: 0 } }, { $set: { ratings: 0 } });

    // 5. Replace the old non-unique razorpayOrderId index with the unique one
    try {
        const indexes = await Order.collection.indexes();
        const old = indexes.find((i) => i.name === "razorpayOrderId_1" && !i.unique);
        if (old) await Order.collection.dropIndex("razorpayOrderId_1");
    } catch (err) {
        if (err.codeName !== "NamespaceNotFound") console.warn("Index migration warning:", err.message);
    }

    // 6. Start invoice numbering after any existing invoices
    const existingCounter = await Counter.findById("invoice").lean();
    if (!existingCounter) {
        const paidCount = await Order.countDocuments({ invoiceNumber: { $exists: true } });
        await Counter.updateOne({ _id: "invoice" }, { $setOnInsert: { seq: paidCount } }, { upsert: true });
    }

    try {
        await Promise.all([Order.syncIndexes(), Otp.syncIndexes(), Product.createIndexes()]);
    } catch (err) {
        // e.g. duplicate razorpayOrderId values in old data block the unique index
        console.error("⚠️  Index sync failed — fix the data and restart:", err.message);
    }

    if (held.modifiedCount || notHeld.modifiedCount || negative.modifiedCount) {
        console.log(`Startup migrations: ${held.modifiedCount} orders marked holding stock, ${notHeld.modifiedCount} not holding, ${negative.modifiedCount} negative stocks reset to 0`);
    }
};
