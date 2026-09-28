import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { handleError } from "../utils/httpError.js";
import { reserveLine, releaseLine } from "../utils/inventory.js";
import {
    RETURN_WINDOW_DAYS,
    releaseOrderStock,
    releaseCouponForOrder,
    releaseExchangeReservations,
    issueRefund,
    failUnpaidOrder,
    notifyCustomer,
    notifyAdmin,
} from "../services/orderService.js";

const HIDDEN_FROM_LISTS = ["created", "failed"];
const REVENUE_STATUSES = ["paid", "shipped", "delivered", "return-requested", "exchange-requested", "exchanged"];

// Allowed admin transitions: from -> [to]
const ADMIN_TRANSITIONS = {
    created: ["failed"],
    paid: ["shipped", "cancelled"],
    // "returned" from shipped = parcel came back to us undelivered (RTO): restock and refund
    shipped: ["delivered", "returned"],
    "return-requested": ["returned", "delivered"],
    "exchange-requested": ["exchanged", "delivered"],
};

const cleanText = (value, max = 500) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// Find an order by Mongo id or Razorpay order id, optionally scoped to a user
const findOrder = async (idOrRzp, userId, { lean = false } = {}) => {
    const filter = mongoose.isValidObjectId(idOrRzp) ? { _id: idOrRzp } : { razorpayOrderId: String(idOrRzp) };
    if (userId) filter.userId = userId;
    const query = Order.findOne(filter);
    return lean ? query.lean() : query;
};

const withinReturnWindow = (order) => {
    const from = order.deliveredAt || order.paidAt || order.createdAt;
    return Date.now() - new Date(from).getTime() <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

// GET /api/orders — orders for the logged-in user
export const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id, status: { $nin: HIDDEN_FROM_LISTS } })
            .select("-statusHistory")
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();
        res.json(orders);
    } catch (error) {
        handleError(res, error, "Get user orders");
    }
};

// GET /api/orders/:id — owner, or an admin
export const getOrderById = async (req, res) => {
    try {
        const scope = req.user.role === "admin" ? null : req.user.id;
        const order = await findOrder(req.params.id, scope, { lean: true });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (error) {
        handleError(res, error, "Get order");
    }
};

// POST /api/orders/:id/cancel — customer cancels a paid order before it ships
export const cancelOrder = async (req, res) => {
    try {
        const reason = cleanText(req.body.reason) || "Customer request";
        const existing = await findOrder(req.params.id, req.user.id, { lean: true });
        if (!existing) return res.status(404).json({ message: "Order not found" });

        const order = await Order.findOneAndUpdate(
            { _id: existing._id, userId: req.user.id, status: "paid" },
            {
                $set: { status: "cancelled", cancelReason: reason, cancelledAt: new Date() },
                $push: { statusHistory: { status: "cancelled", by: `user:${req.user.id}`, note: reason } },
            },
            { new: true }
        );
        if (!order) {
            return res.status(400).json({ message: "Only paid orders that have not shipped can be cancelled. Shipped orders can be returned after delivery." });
        }

        await releaseOrderStock(order._id);
        await releaseCouponForOrder(order._id);
        const refund = await issueRefund(order._id, `Cancelled by customer: ${reason}`, `user:${req.user.id}`);
        notifyCustomer(order, "cancelled", { refundAmount: refund.amount });

        res.json({
            message: refund.failed
                ? "Order cancelled. We couldn't start your refund automatically; our team will process it shortly."
                : "Order cancelled successfully. Your refund has been initiated.",
        });
    } catch (error) {
        handleError(res, error, "Cancel order");
    }
};

// POST /api/orders/:id/return — request a return (delivered orders, within the window)
export const requestReturn = async (req, res) => {
    try {
        const reason = cleanText(req.body.reason) || "No reason provided";
        const existing = await findOrder(req.params.id, req.user.id, { lean: true });
        if (!existing) return res.status(404).json({ message: "Order not found" });
        if (existing.status !== "delivered") return res.status(400).json({ message: "Returns are available once your order is delivered" });
        if (existing.returnRejected) return res.status(400).json({ message: "A return for this order was already reviewed. Please contact support." });
        if (!withinReturnWindow(existing)) return res.status(400).json({ message: `Return window (${RETURN_WINDOW_DAYS} days from delivery) has expired` });

        const order = await Order.findOneAndUpdate(
            { _id: existing._id, userId: req.user.id, status: "delivered" },
            {
                $set: { status: "return-requested", returnReason: reason },
                $push: { statusHistory: { status: "return-requested", by: `user:${req.user.id}`, note: reason } },
            },
            { new: true }
        );
        if (!order) return res.status(409).json({ message: "Order status changed. Please refresh and try again." });

        notifyAdmin(
            `Return Request — ${order.invoiceNumber}`,
            `Return request from ${order.userName} (${order.userEmail})\n\nInvoice: ${order.invoiceNumber}\nReason: ${reason}\nOrder Total: Rs.${order.totalAmount + (order.shipping || 0)}\n\nItems:\n${order.items.map((i) => `- ${i.name}${i.size ? ` (${i.size})` : ""} x${i.quantity} @ Rs.${i.price}`).join("\n")}`,
            order.userEmail
        );
        res.json({ message: "Return request submitted successfully" });
    } catch (error) {
        handleError(res, error, "Request return");
    }
};

// POST /api/orders/:id/exchange — request a size exchange
// body: { reason, items: [{ itemId, size }] }  (replacement stock is reserved immediately)
export const requestExchange = async (req, res) => {
    const reserved = [];
    try {
        const reason = cleanText(req.body.reason) || "Size exchange";
        const requested = Array.isArray(req.body.items) ? req.body.items : [];
        if (requested.length === 0) return res.status(400).json({ message: "Select at least one item and the new size" });

        const existing = await findOrder(req.params.id, req.user.id, { lean: true });
        if (!existing) return res.status(404).json({ message: "Order not found" });
        if (existing.status !== "delivered") return res.status(400).json({ message: "Exchanges are available once your order is delivered" });
        if (existing.exchangeRejected) return res.status(400).json({ message: "An exchange for this order was already reviewed. Please contact support." });
        if (!withinReturnWindow(existing)) return res.status(400).json({ message: `Exchange window (${RETURN_WINDOW_DAYS} days from delivery) has expired` });

        const seen = new Set();
        const exchangeItems = [];
        for (const reqItem of requested) {
            const itemId = String(reqItem?.itemId || "");
            const toSize = typeof reqItem?.size === "string" ? reqItem.size.trim() : "";
            if (seen.has(itemId)) return res.status(400).json({ message: "Each item can only be exchanged once" });
            seen.add(itemId);

            const line = existing.items.find((i) => String(i._id) === itemId);
            if (!line) return res.status(400).json({ message: "Item not found in this order" });
            if (!toSize || toSize === line.size) return res.status(400).json({ message: `Choose a different size for ${line.name}` });

            const product = await Product.findById(line.productId).select("name sizes").lean();
            if (!product) return res.status(400).json({ message: `${line.name} is no longer available for exchange` });
            if (!product.sizes?.includes(toSize)) return res.status(400).json({ message: `Size ${toSize} is not available for ${line.name}` });

            exchangeItems.push({ itemId: line._id, productId: line.productId, name: line.name, fromSize: line.size, toSize, quantity: line.quantity, reserved: true });
        }

        // Reserve the replacement units now so the exchange can be fulfilled if approved
        for (const ex of exchangeItems) {
            const ok = await reserveLine(ex.productId, ex.toSize, ex.quantity);
            if (!ok) {
                for (const r of reserved) await releaseLine(r.productId, r.toSize, r.quantity);
                reserved.length = 0;
                return res.status(409).json({ message: `Size ${ex.toSize} of ${ex.name} is out of stock right now` });
            }
            reserved.push(ex);
        }

        const order = await Order.findOneAndUpdate(
            { _id: existing._id, userId: req.user.id, status: "delivered" },
            {
                $set: { status: "exchange-requested", exchangeReason: reason, exchangeItems },
                $push: { statusHistory: { status: "exchange-requested", by: `user:${req.user.id}`, note: reason } },
            },
            { new: true }
        );
        if (!order) {
            for (const r of reserved) await releaseLine(r.productId, r.toSize, r.quantity);
            reserved.length = 0;
            return res.status(409).json({ message: "Order status changed. Please refresh and try again." });
        }
        reserved.length = 0;

        notifyAdmin(
            `Exchange Request — ${order.invoiceNumber}`,
            `Exchange request from ${order.userName} (${order.userEmail})\n\nInvoice: ${order.invoiceNumber}\nReason: ${reason}\n\nItems:\n${exchangeItems.map((x) => `- ${x.name} x${x.quantity}: ${x.fromSize || "-"} → ${x.toSize}`).join("\n")}`,
            order.userEmail
        );
        res.json({ message: "Exchange request submitted successfully" });
    } catch (error) {
        for (const r of reserved) await releaseLine(r.productId, r.toSize, r.quantity).catch(() => {});
        handleError(res, error, "Request exchange");
    }
};

// ─── Admin-only endpoints ───

// GET /api/orders/admin — all orders (paid and later). ?includeUnpaid=true shows created/failed too.
// Optional pagination: ?page=1&limit=50 returns { orders, total, page, pages }.
export const getAllOrders = async (req, res) => {
    try {
        const filter = req.query.includeUnpaid === "true" ? {} : { status: { $nin: HIDDEN_FROM_LISTS } };
        const page = parseInt(req.query.page, 10) || 0;
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

        const base = () => Order.find(filter).populate("userId", "addresses name email").sort({ createdAt: -1 });

        const withAddress = (order) => {
            // Fallback for older orders without a snapshotted shippingAddress
            if (!order.shippingAddress || !order.shippingAddress.street) {
                const orderUser = order.userId;
                if (orderUser && Array.isArray(orderUser.addresses) && orderUser.addresses.length > 0) {
                    const a = orderUser.addresses.find((x) => x.isDefault) || orderUser.addresses[0];
                    order.shippingAddress = {
                        name: a.name || orderUser.name || order.userName || "",
                        phone: a.phone || "",
                        street: a.street || "",
                        city: a.city || "",
                        state: a.state || "",
                        pincode: a.pincode || "",
                        country: a.country || "India",
                    };
                }
            }
            return order;
        };

        if (page >= 1) {
            const [orders, total] = await Promise.all([
                base().skip((page - 1) * limit).limit(limit).lean(),
                Order.countDocuments(filter),
            ]);
            return res.json({ orders: orders.map(withAddress), total, page, pages: Math.ceil(total / limit) });
        }

        const orders = await base().limit(2000).lean();
        res.json(orders.map(withAddress));
    } catch (error) {
        handleError(res, error, "Get all orders");
    }
};

// GET /api/orders/admin/stats — revenue and counts computed from raw orders
export const getOrderStats = async (req, res) => {
    try {
        const [byStatus] = await Promise.all([
            Order.aggregate([
                { $match: { status: { $nin: HIDDEN_FROM_LISTS } } },
                { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: { $add: ["$totalAmount", { $ifNull: ["$shipping", 0] }] } } } },
            ]),
        ]);
        const stats = { totalOrders: 0, revenue: 0, pendingReturns: 0, pendingExchanges: 0, byStatus: {} };
        for (const row of byStatus) {
            stats.byStatus[row._id] = { count: row.count, amount: row.amount };
            stats.totalOrders += row.count;
            if (REVENUE_STATUSES.includes(row._id)) stats.revenue += row.amount;
        }
        stats.pendingReturns = stats.byStatus["return-requested"]?.count || 0;
        stats.pendingExchanges = stats.byStatus["exchange-requested"]?.count || 0;
        stats.revenueDefinition = "Amount charged (items after discount + shipping) for orders that are paid, shipped, delivered, exchanged or have a pending return/exchange. Excludes cancelled, returned, failed and unpaid orders.";
        res.json(stats);
    } catch (error) {
        handleError(res, error, "Order stats");
    }
};

// PUT /api/orders/:id/status — admin moves an order along the allowed lifecycle
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const trackingNumber = cleanText(req.body.trackingNumber, 100);
        const carrierName = cleanText(req.body.carrierName, 100);
        const note = cleanText(req.body.note);
        const actor = `admin:${req.admin.id}`;

        const existing = await findOrder(req.params.id, null, { lean: true });
        if (!existing) return res.status(404).json({ message: "Order not found" });

        const from = existing.status;
        const allowed = ADMIN_TRANSITIONS[from] || [];
        if (!allowed.includes(status)) {
            return res.status(409).json({ message: `Cannot change an order from "${from}" to "${status}".${allowed.length ? ` Allowed: ${allowed.join(", ")}` : ""}` });
        }

        // Unpaid order: mark failed and free its reservation
        if (from === "created" && status === "failed") {
            await failUnpaidOrder(existing._id, note || "Marked failed by admin", actor);
            return res.json({ message: 'Order status updated to "failed"' });
        }

        const set = { status };
        const now = new Date();
        let emailKey = status;
        if (status === "shipped") {
            set.shippedAt = now;
            if (trackingNumber) set.trackingNumber = trackingNumber;
            if (carrierName) set.carrierName = carrierName;
        }
        if (status === "delivered" && from === "shipped") set.deliveredAt = now;
        if (status === "delivered" && from === "return-requested") { set.returnRejected = true; emailKey = "return-rejected"; }
        if (status === "delivered" && from === "exchange-requested") { set.exchangeRejected = true; emailKey = "exchange-rejected"; }
        if (status === "cancelled") { set.cancelledAt = now; set.cancelReason = note || "Cancelled by store"; }

        const order = await Order.findOneAndUpdate(
            { _id: existing._id, status: from },
            { $set: set, $push: { statusHistory: { status, by: actor, note } } },
            { new: true }
        );
        if (!order) return res.status(409).json({ message: "Order status changed meanwhile. Please refresh and try again." });

        // Side effects for the transition that actually happened
        let refund = null;
        if (status === "cancelled") {
            await releaseOrderStock(order._id);
            await releaseCouponForOrder(order._id);
            refund = await issueRefund(order._id, `Cancelled by store${note ? `: ${note}` : ""}`, actor);
        } else if (status === "returned") {
            await releaseOrderStock(order._id);
            refund = await issueRefund(order._id, `Return approved${note ? `: ${note}` : ""}`, actor);
        } else if (status === "exchanged") {
            // Returned units go back to stock; the reserved replacement units stay deducted
            for (const ex of order.exchangeItems || []) {
                await releaseLine(ex.productId, ex.fromSize, ex.quantity);
            }
            await Order.updateOne({ _id: order._id }, { $set: { "exchangeItems.$[].reserved": false } });
        } else if (status === "delivered" && from === "exchange-requested") {
            await releaseExchangeReservations(order);
        }

        notifyCustomer(order, emailKey, { refundAmount: refund?.amount });

        let message = `Order status updated to "${status}"`;
        if (refund?.failed) message += `. Automatic refund failed: ${refund.error}. Use "Retry refund".`;
        else if (refund?.refundId) message += `. Refund ${refund.refundId} initiated.`;
        res.json({ message, refund });
    } catch (error) {
        handleError(res, error, "Update order status");
    }
};

// POST /api/orders/:id/refund — admin retries a failed or missing refund
export const retryRefund = async (req, res) => {
    try {
        const order = await findOrder(req.params.id, null, { lean: true });
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!["cancelled", "returned"].includes(order.status)) {
            return res.status(400).json({ message: "Refunds apply to cancelled or returned orders only" });
        }
        if (order.refund?.status === "processed" || order.refund?.status === "pending") {
            return res.status(400).json({ message: `Refund already ${order.refund.status}` });
        }
        const refund = await issueRefund(order._id, order.refund?.reason || `Refund for ${order.status} order`, `admin:${req.admin.id}`);
        if (refund.failed) return res.status(502).json({ message: `Refund failed: ${refund.error}`, refund });
        if (refund.skipped === "no-payment") return res.status(400).json({ message: "This order has no captured payment to refund" });
        res.json({ message: "Refund initiated", refund });
    } catch (error) {
        handleError(res, error, "Retry refund");
    }
};
