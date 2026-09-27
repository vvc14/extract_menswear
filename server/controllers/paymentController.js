import crypto from "crypto";
import mongoose from "mongoose";
import razorpayInstance from "../config/razorpay.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { reserveItems, releaseItems, availableStock } from "../utils/inventory.js";
import { handleError, httpError } from "../utils/httpError.js";
import {
    RESERVATION_MINUTES,
    toPaise,
    reserveCouponUse,
    markOrderPaid,
    failUnpaidOrder,
} from "../services/orderService.js";

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 20;

const isHex = (v) => typeof v === "string" && /^[0-9a-f]+$/i.test(v);

const validateAddress = (addr) => {
    if (!addr || typeof addr !== "object") throw httpError(400, "Please select a delivery address");
    const fields = ["name", "phone", "street", "city", "state", "pincode"];
    for (const f of fields) {
        if (typeof addr[f] !== "string" || !addr[f].trim()) throw httpError(400, "Delivery address is incomplete");
        if (addr[f].length > 200) throw httpError(400, "Delivery address field is too long");
    }
    if (!/^\d{10}$/.test(addr.phone.trim())) throw httpError(400, "Phone number must be exactly 10 digits");
    if (!/^\d{6}$/.test(addr.pincode.trim())) throw httpError(400, "Pincode must be exactly 6 digits");
    return {
        name: addr.name.trim(),
        phone: addr.phone.trim(),
        street: addr.street.trim(),
        city: addr.city.trim(),
        state: addr.state.trim(),
        pincode: addr.pincode.trim(),
        country: typeof addr.country === "string" && addr.country.trim() ? addr.country.trim() : "India",
    };
};

// Validate the requested lines and price them from the database
const priceItems = async (items) => {
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, "No items in order");
    if (items.length > MAX_LINES) throw httpError(400, "Too many items in one order");

    const requested = items.map((item) => {
        const quantity = Number(item?.quantity);
        const productId = String(item?.productId || "");
        const size = typeof item?.size === "string" ? item.size.trim() : "";
        if (!mongoose.isValidObjectId(productId)) throw httpError(400, "Invalid product in cart");
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
            throw httpError(400, `Quantity must be a whole number between 1 and ${MAX_QTY_PER_LINE}`);
        }
        return { productId, size, quantity };
    });

    // Merge duplicate product+size lines
    const merged = new Map();
    for (const line of requested) {
        const key = `${line.productId}::${line.size}`;
        if (merged.has(key)) merged.get(key).quantity += line.quantity;
        else merged.set(key, { ...line });
    }

    const ids = [...new Set([...merged.values()].map((l) => l.productId))];
    const products = await Product.find({ _id: { $in: ids } }).select("-reviews").lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    let subtotal = 0;
    let shipping = 0;
    const verifiedItems = [];
    for (const line of merged.values()) {
        const product = byId.get(line.productId);
        if (!product) throw httpError(404, "A product in your cart is no longer available. Please remove it and try again.");

        if (product.sizes?.length > 0) {
            if (!line.size || !product.sizes.includes(line.size)) throw httpError(400, `Please select a valid size for ${product.name}`);
        } else if (line.size) {
            throw httpError(400, `${product.name} does not come in sizes`);
        }

        const available = availableStock(product, line.size);
        if (available < line.quantity) {
            throw httpError(409, available > 0
                ? `Only ${available} left of ${product.name}${line.size ? ` (size ${line.size})` : ""}. Please update your cart.`
                : `${product.name}${line.size ? ` (size ${line.size})` : ""} is out of stock. Please update your cart.`);
        }

        subtotal += product.price * line.quantity;
        shipping += (product.shippingCost || 0) * line.quantity;
        verifiedItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: line.quantity,
            size: line.size,
            imageUrl: product.imageUrl,
            images: product.images || [],
        });
    }
    return { verifiedItems, subtotal, shipping };
};

const computeDiscount = (coupon, subtotal, userId) => {
    const now = new Date();
    if (!coupon.isActive) throw httpError(400, "This coupon is no longer active");
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) throw httpError(400, "This coupon has expired");
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw httpError(400, "This coupon has reached its usage limit");
    if (coupon.oncePerUser && coupon.usedBy.some((id) => String(id) === String(userId))) throw httpError(400, "You have already used this coupon");
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) throw httpError(400, `Minimum order value of ₹${coupon.minOrderValue} required`);

    let discount = coupon.discountType === "percentage"
        ? (subtotal * Math.min(100, Math.max(0, coupon.discountValue))) / 100
        : Math.max(0, coupon.discountValue);
    discount = Math.min(discount, subtotal);
    return Math.round(discount);
};

// POST /api/payment/razorpay/order — validate cart, reserve stock + coupon, create Razorpay order
export const createOrder = async (req, res) => {
    let reservedItems = null;
    let reservedCoupon = null;
    try {
        if (req.user.kind !== "user") throw httpError(403, "Please sign in with a customer account to place orders");
        const userId = req.user.id;
        const { items, shippingAddress, couponCode } = req.body;

        const address = validateAddress(shippingAddress);

        // A new checkout supersedes this user's earlier unpaid ones (frees their stock first)
        const previous = await Order.find({ userId, status: "created" }).select("_id").lean();
        for (const p of previous) await failUnpaidOrder(p._id, "Superseded by a new checkout", "system");

        const { verifiedItems, subtotal, shipping } = await priceItems(items);

        let coupon = null;
        let discountAmount = 0;
        if (couponCode) {
            if (typeof couponCode !== "string" || couponCode.length > 50) throw httpError(400, "Invalid coupon code");
            coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
            if (!coupon) throw httpError(400, "Invalid coupon code");
            discountAmount = computeDiscount(coupon, subtotal, userId);
        }

        const totalAmount = subtotal - discountAmount; // excludes shipping
        const charge = totalAmount + shipping;
        if (charge <= 0) throw httpError(400, "Order total must be greater than zero");

        // Reserve stock atomically (all or nothing)
        const reservation = await reserveItems(verifiedItems);
        if (!reservation.ok) {
            const product = verifiedItems.find((i) => String(i.productId) === String(reservation.failed.productId));
            throw httpError(409, `${product?.name || "An item"}${reservation.failed.size ? ` (size ${reservation.failed.size})` : ""} just sold out or has less stock than requested. Please update your cart.`);
        }
        reservedItems = verifiedItems;

        if (coupon) {
            reservedCoupon = await reserveCouponUse(coupon, userId);
            if (!reservedCoupon) throw httpError(400, "This coupon is no longer available");
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: toPaise(charge),
            currency: "INR",
            receipt: `rcpt_${userId.slice(-8)}_${Date.now()}`,
            notes: { userId },
        });

        const order = await Order.create({
            razorpayOrderId: razorpayOrder.id,
            userId,
            userEmail: req.user.email || "",
            userName: req.user.name || "",
            items: verifiedItems,
            totalAmount,
            shipping,
            shippingAddress: address,
            status: "created",
            couponCode: coupon ? coupon.code : undefined,
            discountAmount,
            couponReserved: !!reservedCoupon,
            stockReserved: true,
            reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
            statusHistory: [{ status: "created", by: `user:${userId}` }],
        });
        reservedItems = null;
        reservedCoupon = null;

        console.log(JSON.stringify({ ts: new Date().toISOString(), event: "order.created", orderId: String(order._id), razorpayOrderId: razorpayOrder.id, userId, amount: charge }));

        res.json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            summary: { subtotal, discount: discountAmount, shipping, total: charge },
            items: verifiedItems.map((i) => ({ productId: i.productId, size: i.size, price: i.price, quantity: i.quantity })),
        });
    } catch (error) {
        // Roll back reservations if anything after them failed
        if (reservedItems) await releaseItems(reservedItems);
        if (reservedCoupon) {
            const update = { $inc: { usedCount: -1 } };
            if (reservedCoupon.oncePerUser) update.$pull = { usedBy: req.user.id };
            await Coupon.updateOne({ _id: reservedCoupon._id, usedCount: { $gt: 0 } }, update).catch(() => {});
        }
        handleError(res, error, "Create order");
    }
};

// POST /api/payment/razorpay/verify — browser callback after Razorpay Checkout success
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (typeof razorpay_order_id !== "string" || typeof razorpay_payment_id !== "string" || !isHex(razorpay_signature)) {
            throw httpError(400, "Payment verification failed");
        }

        const expected = Buffer.from(
            crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex"),
            "hex"
        );
        const given = Buffer.from(razorpay_signature, "hex");
        if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
            throw httpError(400, "Payment verification failed");
        }

        const { order, cancelled } = await markOrderPaid({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            source: "verify",
        });

        if (cancelled || order.status === "cancelled") {
            return res.status(409).json({
                message: "Sorry, an item sold out while you were paying. Your order was cancelled and a full refund has been initiated.",
                orderId: order._id,
            });
        }

        res.json({ message: "Payment verified successfully", orderId: order._id, invoiceNumber: order.invoiceNumber, status: order.status });
    } catch (error) {
        handleError(res, error, "Verify payment");
    }
};

// POST /api/payment/razorpay/cancel — customer closed Checkout without paying
export const cancelPendingOrder = async (req, res) => {
    try {
        const { razorpayOrderId } = req.body;
        if (typeof razorpayOrderId !== "string" || !razorpayOrderId) throw httpError(400, "Order id is required");
        const order = await Order.findOne({ razorpayOrderId, userId: req.user.id }).select("_id status").lean();
        if (!order) throw httpError(404, "Order not found");
        if (order.status === "created") await failUnpaidOrder(order._id, "Checkout closed by customer", `user:${req.user.id}`);
        res.json({ message: "Checkout cancelled" });
    } catch (error) {
        handleError(res, error, "Cancel pending order");
    }
};

// POST /api/payment/razorpay/webhook — server-to-server confirmation from Razorpay.
// Mounted with express.raw() so the signature is checked against the exact bytes sent.
export const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error("Webhook received but RAZORPAY_WEBHOOK_SECRET is not set");
        return res.status(503).json({ message: "Webhook not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const expected = Buffer.from(crypto.createHmac("sha256", secret).update(raw).digest("hex"), "hex");
    const given = isHex(signature) ? Buffer.from(signature, "hex") : Buffer.alloc(0);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
        return res.status(400).json({ message: "Invalid signature" });
    }

    let event;
    try {
        event = JSON.parse(raw.toString("utf8"));
    } catch {
        return res.status(400).json({ message: "Invalid payload" });
    }

    try {
        const payment = event?.payload?.payment?.entity;
        const refund = event?.payload?.refund?.entity;

        switch (event.event) {
            case "payment.captured":
            case "order.paid":
                if (payment?.order_id && payment?.id) {
                    try {
                        await markOrderPaid({ razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id, source: "webhook" });
                    } catch (err) {
                        // Unknown order or amount mismatch: retrying won't help, acknowledge and log
                        if (err.statusCode && err.statusCode < 500) {
                            console.error(`Webhook ${event.event} for ${payment.order_id}: ${err.message}`);
                        } else {
                            throw err;
                        }
                    }
                }
                break;
            case "payment.failed":
                console.log(JSON.stringify({ ts: new Date().toISOString(), event: "payment.failed", razorpayOrderId: payment?.order_id, reason: payment?.error_description }));
                break;
            case "refund.processed":
            case "refund.failed":
                if (refund?.payment_id) {
                    const status = event.event === "refund.processed" ? "processed" : "failed";
                    await Order.updateOne(
                        { razorpayPaymentId: refund.payment_id },
                        {
                            $set: {
                                "refund.status": status,
                                "refund.razorpayRefundId": refund.id,
                                ...(status === "processed" ? { "refund.processedAt": new Date() } : { "refund.error": "Refund failed at gateway" }),
                            },
                            $push: { statusHistory: { status: `refund-${status}`, by: "webhook", note: refund.id } },
                        }
                    );
                }
                break;
            default:
                break;
        }
        res.json({ received: true });
    } catch (error) {
        // 5xx makes Razorpay retry the delivery
        console.error("Webhook processing error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};
