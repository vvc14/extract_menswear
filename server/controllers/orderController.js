import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail, isEmailConfigured } from "../utils/emailTransporter.js";

// GET /api/orders — all orders for the logged-in user
export const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id, status: { $ne: "created" } })
            .sort({ createdAt: -1 })
            .lean();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/orders/:id — single order detail
export const getOrderById = async (req, res) => {
    try {
// Adjust fetch logic to allow admin access (no userId restriction)
        let order;
        try {
            if (req.user && req.user.role === "admin") {
                // Admin: fetch by ID or razorpayOrderId without user check
                order = await Order.findOne({ _id: req.params.id }).lean();
                if (!order) {
                    order = await Order.findOne({ razorpayOrderId: req.params.id }).lean();
                }
            } else {
                // Regular user: enforce ownership
                order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).lean();
            }
        } catch {
            // If ID is not a valid ObjectId, try razorpayOrderId fallback (for both admin and user)
            order = await Order.findOne({ razorpayOrderId: req.params.id }).lean();
        }
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/orders/:id/return — request a return
export const requestReturn = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!["paid", "delivered"].includes(order.status)) {
            return res.status(400).json({ message: "Return not available for this order status" });
        }

        const daysSinceOrder = Math.floor((Date.now() - new Date(order.paidAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOrder > 7) {
            return res.status(400).json({ message: "Return window (7 days) has expired" });
        }

        order.status = "return-requested";
        order.returnReason = reason || "No reason provided";
        await order.save();

        // Notify admin via email
        if (isEmailConfigured()) {
            sendEmail({
                to: "janassistai@gmail.com",
                subject: `Return Request — ${order.invoiceNumber}`,
                text: `Return request from ${order.userName} (${order.userEmail})\n\nInvoice: ${order.invoiceNumber}\nReason: ${order.returnReason}\nOrder Total: Rs.${order.totalAmount}\n\nItems:\n${order.items.map((i) => `- ${i.name} x${i.quantity} @ Rs.${i.price}`).join("\n")}`,
                replyTo: order.userEmail,
            }).catch((err) => console.error("Return email error:", err));
        }

        res.json({ message: "Return request submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/orders/:id/exchange — request an exchange
export const requestExchange = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!["paid", "delivered"].includes(order.status)) {
            return res.status(400).json({ message: "Exchange not available for this order status" });
        }

        const daysSinceOrder = Math.floor((Date.now() - new Date(order.paidAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOrder > 7) {
            return res.status(400).json({ message: "Exchange window (7 days) has expired" });
        }

        order.status = "exchange-requested";
        order.exchangeReason = reason || "No reason provided";
        await order.save();

        // Notify admin via email
        if (isEmailConfigured()) {
            sendEmail({
                to: "janassistai@gmail.com",
                subject: `Exchange Request — ${order.invoiceNumber}`,
                text: `Exchange request from ${order.userName} (${order.userEmail})\n\nInvoice: ${order.invoiceNumber}\nReason: ${order.exchangeReason}\nOrder Total: Rs.${order.totalAmount}\n\nItems:\n${order.items.map((i) => `- ${i.name} x${i.quantity} @ Rs.${i.price}`).join("\n")}`,
                replyTo: order.userEmail,
            }).catch((err) => console.error("Exchange email error:", err));
        }

        res.json({ message: "Exchange request submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin-only endpoints ───

// GET /api/orders/admin — all orders for admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: "created" } })
            .populate("userId", "addresses name email")
            .sort({ createdAt: -1 })
            .lean();

        const processed = orders.map((order) => {
            // Fallback for older orders that don't have a snapshotted shippingAddress
            if (!order.shippingAddress || !order.shippingAddress.street) {
                const orderUser = order.userId;
                if (orderUser && Array.isArray(orderUser.addresses) && orderUser.addresses.length > 0) {
                    const defaultAddr = orderUser.addresses.find((a) => a.isDefault) || orderUser.addresses[0];
                    order.shippingAddress = {
                        name: defaultAddr.name || orderUser.name || order.userName || "",
                        phone: defaultAddr.phone || "",
                        street: defaultAddr.street || "",
                        city: defaultAddr.city || "",
                        state: defaultAddr.state || "",
                        pincode: defaultAddr.pincode || "",
                        country: defaultAddr.country || "India",
                    };
                }
            }
            return order;
        });

        res.json(processed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to format/sanitize email product image URLs and handle proxy block/local issues
const restoreOrderStock = async (order) => {
    try {
        for (const item of order.items) {
            if (item.productId) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.quantity }
                });
            }
        }
    } catch (err) {
        console.error("Failed to restore stock for order:", order._id, err.message);
    }
};

// PUT /api/orders/:id/status — admin updates order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, trackingNumber, carrierName } = req.body;
        const allowed = ["paid", "shipped", "delivered", "returned", "exchanged", "failed", "cancelled"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(", ")}` });
        }

        let order;
        try {
            if (req.admin || (req.user && req.user.role === "admin")) {
                // Admin: fetch by ID or razorpayOrderId without user check (no .lean() so we can save)
                order = await Order.findOne({ _id: req.params.id });
                if (!order) {
                    order = await Order.findOne({ razorpayOrderId: req.params.id });
                }
            } else {
                // Regular user: enforce ownership
                order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
            }
        } catch {
            // If ID is not a valid ObjectId, try razorpayOrderId fallback (for both admin and user)
            order = await Order.findOne({ razorpayOrderId: req.params.id });
        }
        if (!order) return res.status(404).json({ message: "Order not found" });

        const oldStatus = order.status;

        // Auto-restore stock if changing to returned or cancelled
        if (["returned", "cancelled"].includes(status) && !["returned", "cancelled"].includes(oldStatus)) {
            await restoreOrderStock(order);
        }

        order.status = status;
        
        // Add tracking details if provided and order is shipped
        if (status === "shipped" || order.status === "shipped") {
            if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
            if (carrierName !== undefined) order.carrierName = carrierName;
        }

        await order.save();

        // Send customer notification for key status changes
        if (order.userEmail && isEmailConfigured()) {
            let subject = "";
            let title = "";
            let message = "";
            const greeting = `Hi ${order.userName || "Customer"},`;

            if (status === "shipped") {
                subject = `Shipping Update for Order ${order.invoiceNumber}`;
                title = `Order Shipped!`;
                message = `${greeting} Great news! Your order (${order.invoiceNumber}) has been shipped and is on its way to you.<br/><br/>Carrier: ${order.carrierName || "Standard Shipping"}<br/>Tracking Number: ${order.trackingNumber || "N/A"}<br/><br/>Estimated delivery: 3-5 business days.`;
            } else if (status === "delivered") {
                subject = `Delivery Confirmation: Order ${order.invoiceNumber}`;
                title = `Order Delivered!`;
                message = `${greeting} Your order (${order.invoiceNumber}) has been marked as delivered. We hope you love your new menswear.<br/><br/>If you have any issues, you can request a return or exchange within 7 days from your Orders page.`;
            } else if (status === "returned") {
                subject = `Return Update: Order ${order.invoiceNumber}`;
                title = `Return Approved`;
                message = `${greeting} Your return request for order ${order.invoiceNumber} has been approved.<br/><br/>Your refund of ₹${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")} will be processed within 5-7 business days.`;
            } else if (status === "exchanged") {
                subject = `Exchange Update: Order ${order.invoiceNumber}`;
                title = `Exchange Approved`;
                message = `${greeting} Your exchange request for order ${order.invoiceNumber} has been approved.<br/><br/>We will arrange a replacement and notify you once it's shipped.`;
            } else if (status === "cancelled") {
                subject = `Order Cancelled: ${order.invoiceNumber}`;
                title = `Order Cancelled`;
                message = `${greeting} Your order ${order.invoiceNumber} has been cancelled.<br/><br/>A full refund of ₹${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")} will be processed shortly.`;
            }

            if (subject) {
                sendEmail({
                    to: order.userEmail,
                    subject,
                    html: buildStatusEmailHtml(order, status, title, message),
                }).catch((err) => console.error("Status email error:", err));
            }
        }

        res.json({ message: `Order status updated to "${status}"` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/orders/:id/cancel — cancel a paid order before shipping
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== "paid") {
            return res.status(400).json({ message: "Only paid, processing orders can be cancelled. Shipped orders must be returned." });
        }

        order.status = "cancelled";
        order.cancelReason = reason || "Customer request";
        await order.save();

        // Restore stock
        await restoreOrderStock(order);

        // Notify user via email
        if (order.userEmail && isEmailConfigured()) {
            const subject = `Order Cancelled: ${order.invoiceNumber}`;
            const title = `Order Cancelled`;
            const message = `Hi ${order.userName || "Customer"},<br/><br/>Your order (${order.invoiceNumber}) has been cancelled successfully as requested.<br/>Reason: ${order.cancelReason}<br/><br/>A full refund of Rs.${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")} will be credited back to your original payment method.`;

            sendEmail({
                to: order.userEmail,
                subject,
                html: buildStatusEmailHtml(order, "cancelled", title, message),
            }).catch((err) => console.error("Cancel email error:", err));
        }

        res.json({ message: "Order cancelled successfully, stock restored" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
