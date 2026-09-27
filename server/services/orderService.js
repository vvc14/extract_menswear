import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Counter from "../models/Counter.js";
import razorpayInstance from "../config/razorpay.js";
import { reserveItems, releaseItems, releaseLine } from "../utils/inventory.js";
import { sendEmail, isEmailConfigured } from "../utils/emailTransporter.js";
import { buildOrderConfirmationHtml, buildStatusEmailHtml } from "../utils/emailTemplates.js";
import { generateInvoicePDFBuffer } from "../utils/pdfGenerator.js";
import { httpError } from "../utils/httpError.js";

// How long a created (unpaid) order holds its stock and coupon
export const RESERVATION_MINUTES = 30;
export const RETURN_WINDOW_DAYS = 7;

export const toPaise = (rupees) => Math.round(Number(rupees) * 100);
export const orderChargeRupees = (order) => (order.totalAmount || 0) + (order.shipping || 0);

export const adminNotifyEmail = () => process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_USER || null;

const log = (event, data) => console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));

// ─── Invoice numbers: atomic, sequential, unique ───
export const nextInvoiceNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { _id: "invoice" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );
    return `EXT-${new Date().getFullYear()}-${String(counter.seq).padStart(6, "0")}`;
};

// ─── Coupons ───
// Atomically claim one use of a coupon for this user. Returns the coupon or null.
export const reserveCouponUse = async (coupon, userId) => {
    const now = new Date();
    const filter = {
        _id: coupon._id,
        isActive: true,
        $and: [
            { $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }, { expiryDate: { $gt: now } }] },
            { $or: [{ usageLimit: null }, { usageLimit: { $exists: false } }, { usageLimit: { $lte: 0 } }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
        ],
    };
    const update = { $inc: { usedCount: 1 } };
    if (coupon.oncePerUser) {
        filter.usedBy = { $ne: userId };
        update.$addToSet = { usedBy: userId };
    }
    return Coupon.findOneAndUpdate(filter, update, { new: true });
};

// Give back the coupon use held by an order (idempotent via the couponReserved flag)
export const releaseCouponForOrder = async (orderId) => {
    const order = await Order.findOneAndUpdate(
        { _id: orderId, couponReserved: true },
        { $set: { couponReserved: false } },
        { new: true }
    );
    if (!order || !order.couponCode) return;
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (!coupon) return;
    const update = { $inc: { usedCount: -1 } };
    if (coupon.oncePerUser && order.userId) update.$pull = { usedBy: order.userId };
    await Coupon.updateOne({ _id: coupon._id, usedCount: { $gt: 0 } }, update);
};

// ─── Stock ───
// Return an order's items to inventory (idempotent via the stockReserved flag)
export const releaseOrderStock = async (orderId) => {
    const order = await Order.findOneAndUpdate(
        { _id: orderId, stockReserved: true },
        { $set: { stockReserved: false } },
        { new: true }
    );
    if (!order) return false;
    await releaseItems(order.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })));
    log("stock.released", { orderId: String(orderId) });
    return true;
};

// Release replacement stock held by a pending exchange request
export const releaseExchangeReservations = async (order) => {
    for (const ex of order.exchangeItems || []) {
        if (!ex.reserved) continue;
        const res = await Order.updateOne(
            { _id: order._id, exchangeItems: { $elemMatch: { _id: ex._id, reserved: true } } },
            { $set: { "exchangeItems.$.reserved": false } }
        );
        if (res.modifiedCount === 1) await releaseLine(ex.productId, ex.toSize, ex.quantity);
    }
};

// ─── Refunds (Razorpay) ───
// Issues a full refund of the amount charged. Safe to call repeatedly: only one refund
// can be pending/processed per order, and a failed one can be retried.
export const issueRefund = async (orderId, reason, actor = "system") => {
    const current = await Order.findById(orderId);
    if (!current) throw httpError(404, "Order not found");
    if (!current.razorpayPaymentId) return { skipped: "no-payment" };

    const amount = orderChargeRupees(current);
    const claimed = await Order.findOneAndUpdate(
        {
            _id: orderId,
            razorpayPaymentId: { $exists: true, $ne: null },
            $or: [{ "refund.status": { $exists: false } }, { "refund.status": null }, { "refund.status": "failed" }],
        },
        { $set: { refund: { status: "pending", amount, reason, requestedAt: new Date() } } },
        { new: true }
    );
    if (!claimed) return { skipped: "already-refunded", refund: current.refund };

    try {
        const refund = await razorpayInstance.payments.refund(claimed.razorpayPaymentId, {
            amount: toPaise(amount),
            speed: "normal",
            notes: { orderId: String(claimed._id), invoice: claimed.invoiceNumber || "", reason: String(reason || "").slice(0, 200) },
        });
        const status = refund.status === "processed" ? "processed" : "pending";
        await Order.updateOne(
            { _id: orderId },
            {
                $set: {
                    "refund.razorpayRefundId": refund.id,
                    "refund.status": status,
                    ...(status === "processed" ? { "refund.processedAt": new Date() } : {}),
                },
                $push: { statusHistory: { status: `refund-${status}`, by: actor, note: `Refund ${refund.id} for ₹${amount}` } },
            }
        );
        log("refund.created", { orderId: String(orderId), refundId: refund.id, amount, status, actor });
        return { refundId: refund.id, status, amount };
    } catch (err) {
        const message = err?.error?.description || err?.message || "Refund failed";
        await Order.updateOne(
            { _id: orderId },
            {
                $set: { "refund.status": "failed", "refund.error": message },
                $push: { statusHistory: { status: "refund-failed", by: actor, note: message } },
            }
        );
        console.error(`Refund failed for order ${orderId}:`, message);
        return { failed: true, error: message };
    }
};

// ─── Notifications (never throw) ───
const safeSend = (options, label) => {
    if (!isEmailConfigured() || !options.to) return;
    sendEmail(options).catch((err) => console.error(`${label} email error:`, err.message));
};

export const sendOrderConfirmation = (order) => {
    if (!order.userEmail || !isEmailConfigured()) return;
    (async () => {
        try {
            const pdfBuffer = await generateInvoicePDFBuffer(order);
            await sendEmail({
                to: order.userEmail,
                subject: `Order Confirmed — ${order.invoiceNumber}`,
                html: buildOrderConfirmationHtml(order),
                attachments: [{ filename: `Invoice_${order.invoiceNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
            });
        } catch (err) {
            console.error("Order confirmation email error:", err.message);
        }
    })();
};

export const notifyCustomer = (order, status, extra = {}) => {
    if (!order.userEmail) return;
    const name = order.userName || "Customer";
    const inv = order.invoiceNumber || "";
    const refundLine = extra.refundAmount
        ? `A refund of ₹${Number(extra.refundAmount).toLocaleString("en-IN")} has been initiated to your original payment method. It usually reaches you within 5-7 business days.`
        : null;

    const templates = {
        shipped: [`Shipping Update for Order ${inv}`, "Order Shipped!", [
            `Hi ${name}, great news! Your order (${inv}) has been shipped and is on its way to you.`,
            `Carrier: ${order.carrierName || "Standard Shipping"}\nTracking Number: ${order.trackingNumber || "N/A"}`,
            "Estimated delivery: 3-5 business days.",
        ]],
        delivered: [`Delivery Confirmation: Order ${inv}`, "Order Delivered!", [
            `Hi ${name}, your order (${inv}) has been marked as delivered. We hope you love your new menswear.`,
            `If you have any issues, you can request a return or exchange within ${RETURN_WINDOW_DAYS} days from your Orders page.`,
        ]],
        returned: [`Return Update: Order ${inv}`, "Return Approved", [
            `Hi ${name}, your return request for order ${inv} has been approved.`,
            refundLine,
        ]],
        "return-rejected": [`Return Update: Order ${inv}`, "Return Request Declined", [
            `Hi ${name}, we were unable to approve the return request for order ${inv}. Please contact us if you have questions.`,
        ]],
        exchanged: [`Exchange Update: Order ${inv}`, "Exchange Approved", [
            `Hi ${name}, your exchange request for order ${inv} has been approved.`,
            "We will arrange the replacement and notify you once it ships.",
        ]],
        "exchange-rejected": [`Exchange Update: Order ${inv}`, "Exchange Request Declined", [
            `Hi ${name}, we were unable to approve the exchange request for order ${inv}. Please contact us if you have questions.`,
        ]],
        cancelled: [`Order Cancelled: ${inv}`, "Order Cancelled", [
            `Hi ${name}, your order (${inv}) has been cancelled.`,
            order.cancelReason ? `Reason: ${order.cancelReason}` : null,
            refundLine,
        ]],
    };
    const tpl = templates[status];
    if (!tpl) return;
    const [subject, title, paragraphs] = tpl;
    safeSend({ to: order.userEmail, subject, html: buildStatusEmailHtml(order, title, paragraphs) }, `Status (${status})`);
};

export const notifyAdmin = (subject, text, replyTo) => {
    const to = adminNotifyEmail();
    if (!to) return;
    safeSend({ to, subject, text, replyTo }, "Admin notification");
};

// ─── Payment confirmation (shared by /verify and the webhook) ───
// Confirms with Razorpay that the payment belongs to this order and covers the full amount,
// captures it if only authorized, then marks the order paid exactly once.
const confirmPaymentWithGateway = async (order, razorpayPaymentId) => {
    const payment = await razorpayInstance.payments.fetch(razorpayPaymentId);
    const expected = toPaise(orderChargeRupees(order));
    if (payment.order_id !== order.razorpayOrderId) throw httpError(400, "Payment does not belong to this order");
    if (Number(payment.amount) !== expected || payment.currency !== "INR") throw httpError(400, "Payment amount mismatch");
    if (payment.status === "authorized") {
        try {
            await razorpayInstance.payments.capture(razorpayPaymentId, expected, "INR");
        } catch (err) {
            // A concurrent confirmation (verify vs webhook) may have captured it first
            const again = await razorpayInstance.payments.fetch(razorpayPaymentId);
            if (again.status !== "captured") throw err;
        }
    } else if (payment.status !== "captured") {
        throw httpError(400, `Payment is ${payment.status}`);
    }
};

export const markOrderPaid = async ({ razorpayOrderId, razorpayPaymentId, source }) => {
    const order = await Order.findOne({ razorpayOrderId });
    if (!order) throw httpError(404, "Order not found");

    // Idempotent: anything past created/failed has already been processed
    if (!["created", "failed"].includes(order.status)) {
        return { order, alreadyProcessed: true };
    }

    await confirmPaymentWithGateway(order, razorpayPaymentId);

    // An expired/failed order no longer holds stock: take it again now
    let reservedNow = false;
    if (order.stockReserved !== true) {
        const reservation = await reserveItems(order.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })));
        if (!reservation.ok) {
            // Paid but the stock is gone: record the payment, cancel and refund in full
            const cancelled = await Order.findOneAndUpdate(
                { _id: order._id, status: order.status },
                {
                    $set: {
                        status: "cancelled",
                        razorpayPaymentId,
                        paidAt: new Date(),
                        cancelledAt: new Date(),
                        cancelReason: "Item went out of stock before payment completed",
                        stockReserved: false,
                    },
                    $push: { statusHistory: { status: "cancelled", by: source, note: "Out of stock at payment confirmation" } },
                },
                { new: true }
            );
            if (!cancelled) return { order: await Order.findById(order._id), alreadyProcessed: true };
            await releaseCouponForOrder(order._id);
            const refund = await issueRefund(order._id, "Out of stock at payment confirmation", source);
            const fresh = await Order.findById(order._id);
            notifyCustomer(fresh, "cancelled", { refundAmount: refund.amount });
            log("order.paid_out_of_stock", { orderId: String(order._id), source });
            return { order: fresh, alreadyProcessed: false, cancelled: true };
        }
        reservedNow = true;
    }

    const paid = await Order.findOneAndUpdate(
        { _id: order._id, status: order.status },
        {
            $set: { status: "paid", razorpayPaymentId, paidAt: new Date(), stockReserved: true },
            $unset: { reservedUntil: 1 },
            $push: { statusHistory: { status: "paid", by: source } },
        },
        { new: true }
    );

    if (!paid) {
        // Lost a race with a concurrent confirmation: undo our reservation
        if (reservedNow) await releaseItems(order.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })));
        return { order: await Order.findById(order._id), alreadyProcessed: true };
    }

    // Coupon use: already held unless the reservation expired; honour the discount either way
    if (paid.couponCode && !paid.couponReserved) {
        const coupon = await Coupon.findOne({ code: paid.couponCode });
        if (coupon) {
            const update = { $inc: { usedCount: 1 } };
            if (coupon.oncePerUser && paid.userId) update.$addToSet = { usedBy: paid.userId };
            await Coupon.updateOne({ _id: coupon._id }, update);
            await Order.updateOne({ _id: paid._id }, { $set: { couponReserved: true } });
        }
    }

    const invoiceNumber = await nextInvoiceNumber();
    const final = await Order.findOneAndUpdate(
        { _id: paid._id, invoiceNumber: { $exists: false } },
        { $set: { invoiceNumber } },
        { new: true }
    ) || await Order.findById(paid._id);

    if (final.userId) await Cart.updateOne({ userId: final.userId }, { $set: { items: [] } });

    log("order.paid", { orderId: String(final._id), razorpayOrderId, razorpayPaymentId, amount: orderChargeRupees(final), source });
    sendOrderConfirmation(final);
    return { order: final, alreadyProcessed: false };
};

// Mark an unpaid order failed and give back its stock and coupon
export const failUnpaidOrder = async (orderId, reason, by) => {
    const failed = await Order.findOneAndUpdate(
        { _id: orderId, status: "created" },
        { $set: { status: "failed" }, $unset: { reservedUntil: 1 }, $push: { statusHistory: { status: "failed", by, note: reason } } },
        { new: true }
    );
    if (!failed) return false;
    await releaseOrderStock(orderId);
    await releaseCouponForOrder(orderId);
    return true;
};

// Periodic job: expire unpaid orders whose reservation window passed
export const expireStaleOrders = async () => {
    const stale = await Order.find({ status: "created", reservedUntil: { $lt: new Date() } }).select("_id").limit(200).lean();
    for (const { _id } of stale) {
        try {
            await failUnpaidOrder(_id, "Payment window expired", "system");
        } catch (err) {
            console.error(`Failed to expire order ${_id}:`, err.message);
        }
    }
    if (stale.length) log("orders.expired", { count: stale.length });
};
