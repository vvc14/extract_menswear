import crypto from "crypto";
import nodemailer from "nodemailer";
import razorpayInstance from "../config/razorpay.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import { generateInvoicePDFBuffer } from "../utils/pdfGenerator.js";

const generateInvoiceNumber = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `EXT-${y}${m}${d}-${rand}`;
};

const buildEmailHtml = (order) => {
    const itemRows = order.items
        .map(
            (i) =>
                `<tr>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155">${i.name}</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;text-align:center">${i.quantity}</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;text-align:right">₹${(i.price * i.quantity).toLocaleString("en-IN")}</td>
                </tr>`
        )
        .join("");

    return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#0f172a;padding:28px 32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em">EXTRACT</h1>
            <p style="margin:4px 0 0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em">Premium Menswear</p>
        </div>
        <div style="padding:32px">
            <div style="text-align:center;margin-bottom:28px">
                <div style="width:56px;height:56px;background:#ecfdf5;border-radius:50%;display:inline-block;text-align:center;line-height:56px;margin-bottom:12px">
                    <span style="font-size:28px;color:#10b981">✓</span>
                </div>
                <h2 style="margin:0;font-size:22px;font-weight:700;color:#0f172a">Payment Successful!</h2>
                <p style="margin:6px 0 0;font-size:14px;color:#64748b">Thank you for your purchase, ${order.userName || "Customer"}</p>
            </div>
            <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                    <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Invoice No.</td><td style="font-size:13px;font-weight:700;color:#0f172a;text-align:right;padding:4px 0">${order.invoiceNumber}</td></tr>
                    <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Order Date</td><td style="font-size:13px;font-weight:600;color:#0f172a;text-align:right;padding:4px 0">${new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
                    <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Payment ID</td><td style="font-size:13px;font-weight:600;color:#0f172a;text-align:right;padding:4px 0">${order.razorpayPaymentId}</td></tr>
                </table>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <thead>
                    <tr style="background:#f1f5f9">
                        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Item</th>
                        <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Qty</th>
                        <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div style="border-top:2px solid #0f172a;padding-top:14px;text-align:right">
                <p style="margin:0 0 4px;font-size:13px;color:#64748b">Shipping: ${order.shipping > 0 ? "₹" + order.shipping : "FREE"}</p>
                <p style="margin:0;font-size:20px;font-weight:800;color:#0f172a">Total: ₹${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")}</p>
            </div>
        </div>
        <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:13px;color:#94a3b8">Returns & exchanges available within 7 days of delivery.</p>
            <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1">Extract Menswear • Premium Men's Fashion</p>
        </div>
    </div>`;
};

export const createOrder = async (req, res) => {
    try {
        const { items, userId, userEmail, userName, shippingAddress } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }

        let computedSubtotal = 0;
        let computedShipping = 0;
        const verifiedItems = [];

        // Look up the user's cart to find reserved stock
        const cart = await Cart.findOne({ userId });
        const cartQtys = {};
        if (cart && cart.items) {
            cart.items.forEach(item => {
                cartQtys[item.productId.toString()] = (cartQtys[item.productId.toString()] || 0) + item.quantity;
            });
        }

        for (const item of items) {
            const dbProduct = await Product.findById(item.productId);
            if (!dbProduct) {
                return res.status(404).json({ message: `Product ${item.name || item.productId} not found` });
            }

            // Check stock availability (adding back reserved items in user's own cart)
            const reservedInCart = cartQtys[dbProduct._id.toString()] || 0;
            const totalAvailableStock = dbProduct.stock + reservedInCart;

            if (totalAvailableStock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${dbProduct.name}. Available: ${totalAvailableStock}` });
            }

            computedSubtotal += dbProduct.price * item.quantity;
            computedShipping += (dbProduct.shippingCost || 0) * item.quantity;

            verifiedItems.push({
                productId: dbProduct._id,
                name: dbProduct.name,
                price: dbProduct.price,
                quantity: item.quantity,
                size: item.size || "",
                imageUrl: dbProduct.imageUrl,
                images: dbProduct.images || [],
            });
        }

        const totalAmount = computedSubtotal + computedShipping;
        if (totalAmount <= 0) {
            return res.status(400).json({ message: "Order total must be greater than zero" });
        }

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        await Order.create({
            razorpayOrderId: razorpayOrder.id,
            userId: userId || null,
            userEmail: userEmail || "",
            userName: userName || "",
            items: verifiedItems,
            totalAmount: computedSubtotal,
            shipping: computedShipping,
            shippingAddress: shippingAddress || {},
            status: "created",
        });

        res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency });
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const invoiceNumber = generateInvoiceNumber();
        const now = new Date();

        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { razorpayPaymentId: razorpay_payment_id, status: "paid", invoiceNumber, paidAt: now },
            { new: true }
        );

        // Clear user's cart immediately on payment verification success (does not release/restore stock)
        if (order && order.userId) {
            await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });
        }

        // Send confirmation email with invoice PDF asynchronously
        if (order?.userEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            (async () => {
                try {
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                    });

                    const pdfBuffer = await generateInvoicePDFBuffer(order);
                    console.log(`✅ Invoice PDF generated for ${invoiceNumber} (${pdfBuffer.length} bytes)`);

                    await transporter.sendMail({
                        from: `"Extract Menswear" <${process.env.EMAIL_USER}>`,
                        to: order.userEmail,
                        subject: `Order Confirmed — ${invoiceNumber}`,
                        html: buildEmailHtml(order),
                        attachments: [
                            {
                                filename: `Invoice_${invoiceNumber}.pdf`,
                                content: pdfBuffer,
                                contentType: "application/pdf",
                            },
                        ],
                    });
                    console.log(`📧 Confirmation email sent to ${order.userEmail}`);
                } catch (err) {
                    console.error("❌ Email/PDF error:", err.message);
                }
            })();
        }

        res.json({
            message: "Payment verified successfully",
            orderId: order._id,
            invoiceNumber,
        });
    } catch (error) {
        console.error("Verify payment error:", error);
        res.status(500).json({ message: error.message });
    }
};
