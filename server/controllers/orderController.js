import nodemailer from "nodemailer";
import Order from "../models/Order.js";

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
        } catch (e) {
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
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            transporter
                .sendMail({
                    from: `"Extract Menswear" <${process.env.EMAIL_USER}>`,
                    to: "janassistai@gmail.com",
                    subject: `Return Request — ${order.invoiceNumber}`,
                    text: `Return request from ${order.userName} (${order.userEmail})\n\nInvoice: ${order.invoiceNumber}\nReason: ${order.returnReason}\nOrder Total: ₹${order.totalAmount}\n\nItems:\n${order.items.map((i) => `- ${i.name} x${i.quantity} @ ₹${i.price}`).join("\n")}`,
                })
                .catch((err) => console.error("Return email error:", err));
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
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            transporter
                .sendMail({
                    from: `"Extract Menswear" <${process.env.EMAIL_USER}>`,
                    to: "janassistai@gmail.com",
                    subject: `Exchange Request — ${order.invoiceNumber}`,
                    text: `Exchange request from ${order.userName} (${order.userEmail})\n\nInvoice: ${order.invoiceNumber}\nReason: ${order.exchangeReason}\nOrder Total: ₹${order.totalAmount}\n\nItems:\n${order.items.map((i) => `- ${i.name} x${i.quantity} @ ₹${i.price}`).join("\n")}`,
                })
                .catch((err) => console.error("Exchange email error:", err));
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

// PUT /api/orders/:id/status — admin updates order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["paid", "shipped", "delivered", "returned", "exchanged", "failed"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(", ")}` });
        }

// Adjust fetch logic to allow admin access (no userId restriction)
        let order;
        try {
            if (req.admin) {
                // Admin: fetch by ID or razorpayOrderId without user check
                order = await Order.findOne({ _id: req.params.id }).lean();
                if (!order) {
                    order = await Order.findOne({ razorpayOrderId: req.params.id }).lean();
                }
            } else {
                // Regular user: enforce ownership
                order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).lean();
            }
        } catch (e) {
            // If ID is not a valid ObjectId, try razorpayOrderId fallback (for both admin and user)
            order = await Order.findOne({ razorpayOrderId: req.params.id }).lean();
        }
        if (!order) return res.status(404).json({ message: "Order not found" }); return res.status(404).json({ message: "Order not found" });

        order.status = status;
        await order.save();

        // Send customer notification for key status changes
        if (order.userEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            let subject = "";
            let body = "";
            const greeting = `Hi ${order.userName || "Customer"},`;

            if (status === "shipped") {
                subject = `Your Order ${order.invoiceNumber} Has Been Shipped!`;
                body = `${greeting}\n\nGreat news! Your order (${order.invoiceNumber}) has been shipped and is on its way to you.\n\nEstimated delivery: 3-5 business days.\n\nThank you for shopping with Extract Menswear!`;
            } else if (status === "delivered") {
                subject = `Your Order ${order.invoiceNumber} Has Been Delivered`;
                body = `${greeting}\n\nYour order (${order.invoiceNumber}) has been marked as delivered.\n\nIf you have any issues, you can request a return or exchange within 7 days from your Orders page.\n\nThank you for choosing Extract Menswear!`;
            } else if (status === "returned") {
                subject = `Return Approved — ${order.invoiceNumber}`;
                body = `${greeting}\n\nYour return request for order ${order.invoiceNumber} has been approved.\n\nYour refund of ₹${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")} will be processed within 5-7 business days.\n\nThank you for your patience.`;
            } else if (status === "exchanged") {
                subject = `Exchange Approved — ${order.invoiceNumber}`;
                body = `${greeting}\n\nYour exchange request for order ${order.invoiceNumber} has been approved.\n\nWe will arrange a replacement and notify you once it's shipped.\n\nThank you for your patience.`;
            }

            if (subject) {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                });
                transporter.sendMail({
                    from: `"Extract Menswear" <${process.env.EMAIL_USER}>`,
                    to: order.userEmail,
                    subject,
                    text: body,
                }).catch((err) => console.error("Status email error:", err));
            }
        }

        res.json({ message: `Order status updated to "${status}"` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
