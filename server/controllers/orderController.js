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

// Helper to format/sanitize email product image URLs and handle proxy block/local issues
const formatEmailImageUrl = (url) => {
    const defaultPlaceholder = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&q=80"; // Premium linen shirt placeholder
    if (!url) return defaultPlaceholder;
    
    let formatted = url.trim();
    
    // gstatic search thumbnails are blocked by Google Image Proxy, use a premium shirt placeholder
    if (formatted.includes("gstatic.com") || formatted.includes("googleusercontent.com")) {
        return defaultPlaceholder;
    }
    
    if (formatted.startsWith("/")) {
        // Resolve relative paths to absolute backend paths
        const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
        formatted = `${baseUrl}${formatted}`;
    }
    
    // HTML Escape characters to prevent template issues
    return formatted
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

// Helper to build a luxury HTML email for status notifications
const buildStatusEmailHtml = (order, status, statusTitle, statusMessage) => {
    const itemRows = (order.items || [])
        .map(
            (i) => {
                const imgUrl = formatEmailImageUrl(i.imageUrl);
                const imgCell = imgUrl 
                    ? `<td style="width:52px;padding-right:16px;border-bottom:1px solid #f1f5f9;padding-top:12px;padding-bottom:12px;border-top:none;border-left:none;border-right:none;vertical-align:middle;">
                         <img src="${imgUrl}" alt="${i.name}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;display:block;"/>
                       </td>` 
                    : "";
                
                return `<tr>
                    ${imgCell}
                    <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;vertical-align:middle;border-top:none;border-left:none;border-right:none;">
                        <span style="font-weight:700;display:block;color:#0f172a;font-family:'Outfit','Segoe UI',sans-serif;">${i.name}</span>
                        <span style="font-size:12px;color:#64748b;font-weight:500;">Size: ${i.size || 'N/A'}</span>
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;text-align:center;vertical-align:middle;border-top:none;border-left:none;border-right:none;">${i.quantity}</td>
                    <td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#0f172a;text-align:right;vertical-align:middle;border-top:none;border-left:none;border-right:none;font-family:'Outfit','Segoe UI',sans-serif;">₹${(i.price * i.quantity).toLocaleString("en-IN")}</td>
                </tr>`;
            }
        )
        .join("");

    let statusColor = "#3b82f6"; // default blue
    let icon = "📦";
    if (status === "shipped") {
        statusColor = "#c9a84c"; // Brand Gold
        icon = "🚚";
    } else if (status === "delivered") {
        statusColor = "#10b981"; // Emerald
        icon = "✅";
    } else if (status === "returned") {
        statusColor = "#ef4444"; // Red
        icon = "↩️";
    } else if (status === "exchanged") {
        statusColor = "#8b5cf6"; // Violet
        icon = "🔄";
    }

    // Progress Tracker styles
    let step1Class = "color: #10b981; font-weight: bold;";
    let step2Class = "color: #94a3b8;";
    let step3Class = "color: #94a3b8;";

    let step1Dot = "background-color: #10b981;";
    let step2Dot = "background-color: #cbd5e1;";
    let step3Dot = "background-color: #cbd5e1;";

    let line1 = "background-color: #cbd5e1;";
    let line2 = "background-color: #cbd5e1;";

    if (status === "shipped") {
        step2Class = "color: #c9a84c; font-weight: bold;";
        step2Dot = "background-color: #c9a84c;";
        line1 = "background-color: #c9a84c;";
    } else if (status === "delivered" || status === "returned" || status === "exchanged") {
        step2Class = "color: #10b981; font-weight: bold;";
        step3Class = "color: #10b981; font-weight: bold;";
        step2Dot = "background-color: #10b981;";
        step3Dot = "background-color: #10b981;";
        line1 = "background-color: #10b981;";
        line2 = "background-color: #10b981;";
    }

    return `
    <div style="background-color:#f1f5f9;padding:40px 16px;font-family:'Outfit','Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05),0 8px 10px -6px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
            
            <!-- Branding Header -->
            <div style="background:#0f172a;padding:32px;text-align:center;border-bottom:4px solid #c9a84c;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.1em;font-family:'Outfit',sans-serif;">EXTRACT</h1>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.2em;">Premium Menswear</p>
            </div>

            <!-- Main Content Area -->
            <div style="padding:40px 32px;">
                
                <!-- Status Announcement -->
                <div style="text-align:center;margin-bottom:32px;">
                    <div style="width:64px;height:64px;background:${statusColor}15;border-radius:50%;display:inline-block;text-align:center;line-height:64px;margin-bottom:16px;">
                        <span style="font-size:32px;vertical-align:middle;">${icon}</span>
                    </div>
                    <h2 style="margin:0;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;font-family:'Outfit',sans-serif;">${statusTitle}</h2>
                    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;font-weight:500;">${statusMessage}</p>
                </div>

                <!-- Progress Tracker Bar -->
                <div style="margin:36px 0;padding:24px 20px;background:#fafafb;border-radius:12px;border:1px solid #f1f5f9;text-align:center;">
                    <table style="width:100%;border-collapse:collapse;border:none;">
                        <tr>
                            <td style="width:33%;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;${step1Class}">Order Placed</td>
                            <td style="width:33%;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;${step2Class}">Shipped</td>
                            <td style="width:33%;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;${step3Class}">Delivered</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding-top:14px;border:none;">
                                <table style="width:100%;border-collapse:collapse;border:none;">
                                    <tr>
                                        <td style="width:16%;border:none;"></td>
                                        <td style="width:12px;height:12px;border-radius:50%;border:none;${step1Dot}"></td>
                                        <td style="height:4px;border:none;${line1}"></td>
                                        <td style="width:12px;height:12px;border-radius:50%;border:none;${step2Dot}"></td>
                                        <td style="height:4px;border:none;${line2}"></td>
                                        <td style="width:12px;height:12px;border-radius:50%;border:none;${step3Dot}"></td>
                                        <td style="width:16%;border:none;"></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Invoice Meta Details -->
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:32px;border:1px solid #f1f5f9;">
                    <table style="width:100%;border-collapse:collapse;border:none;">
                        <tr>
                            <td style="font-size:13px;font-weight:600;color:#64748b;padding:4px 0;border:none;">Invoice Number</td>
                            <td style="font-size:13px;font-weight:800;color:#0f172a;text-align:right;padding:4px 0;border:none;font-family:'Outfit',sans-serif;">${order.invoiceNumber}</td>
                        </tr>
                        <tr>
                            <td style="font-size:13px;font-weight:600;color:#64748b;padding:4px 0;border:none;">Order Status</td>
                            <td style="font-size:13px;font-weight:800;color:${statusColor};text-align:right;padding:4px 0;border:none;text-transform:uppercase;letter-spacing:0.05em;font-family:'Outfit',sans-serif;">${status}</td>
                        </tr>
                    </table>
                </div>

                <!-- Product Detail Section Title -->
                <p style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;margin-top:0;">Shipment Summary</p>

                <!-- Order Item Table -->
                <table style="width:100%;border-collapse:collapse;margin-bottom:32px;border:none;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;border-top:none;border-left:none;border-right:none;">Item</th>
                            <th style="padding:12px 14px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;border-top:none;border-left:none;border-right:none;">Qty</th>
                            <th style="padding:12px 14px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0;border-top:none;border-left:none;border-right:none;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>

                <div style="border-top:2px solid #0f172a;padding-top:16px;text-align:right;margin-bottom:40px;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:#0f172a;font-family:'Outfit',sans-serif;">Total: ₹${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")}</p>
                </div>

                <!-- Call to Action Button (Luxury Gold Button) -->
                <div style="text-align:center;margin-bottom:8px;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" 
                       style="display:inline-block;background:#c9a84c;color:#0f172a;padding:16px 36px;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;text-transform:uppercase;letter-spacing:0.1em;box-shadow:0 4px 6px -1px rgba(201,168,76,0.25);font-family:'Outfit',sans-serif;">
                       Track Your Order
                    </a>
                </div>

            </div>

            <!-- Footer Details -->
            <div style="background:#0f172a;padding:32px;text-align:center;border-top:1px solid #1e293b;">
                <p style="margin:0;font-size:13px;color:#94a3b8;font-weight:500;">Returns & exchanges are available within 7 days of delivery.</p>
                <p style="margin:12px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.15em;font-weight:600;">Extract Menswear • Premium Men's Fashion</p>
            </div>
            
        </div>
    </div>`;
};

// PUT /api/orders/:id/status — admin updates order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["paid", "shipped", "delivered", "returned", "exchanged", "failed"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(", ")}` });
        }

        let order;
        try {
            if (req.admin) {
                // Admin: fetch by ID or razorpayOrderId without user check (no .lean() so we can save)
                order = await Order.findOne({ _id: req.params.id });
                if (!order) {
                    order = await Order.findOne({ razorpayOrderId: req.params.id });
                }
            } else {
                // Regular user: enforce ownership
                order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
            }
        } catch (e) {
            // If ID is not a valid ObjectId, try razorpayOrderId fallback (for both admin and user)
            order = await Order.findOne({ razorpayOrderId: req.params.id });
        }
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = status;
        await order.save();

        // Send customer notification for key status changes
        if (order.userEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            let subject = "";
            let title = "";
            let message = "";
            const greeting = `Hi ${order.userName || "Customer"},`;

            if (status === "shipped") {
                subject = `Shipping Update for Order ${order.invoiceNumber}`;
                title = `Order Shipped!`;
                message = `${greeting} Great news! Your order (${order.invoiceNumber}) has been shipped and is on its way to you.<br/><br/>Estimated delivery: 3-5 business days.`;
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
                    html: buildStatusEmailHtml(order, status, title, message),
                }).catch((err) => console.error("Status email error:", err));
            }
        }

        res.json({ message: `Order status updated to "${status}"` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
