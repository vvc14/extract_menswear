import crypto from "crypto";
import nodemailer from "nodemailer";
import razorpayInstance from "../config/razorpay.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import { generateInvoicePDFBuffer } from "../utils/pdfGenerator.js";
import { orderQueue } from "../utils/requestQueue.js";

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
                <tbody>
                    ${itemRows}
                </tbody>
            </table>
            <div style="text-align:right;border-top:2px solid #e2e8f0;padding-top:16px;margin-bottom:28px">
                <p style="margin:0 0 6px;font-size:14px;color:#64748b">Subtotal: <span style="display:inline-block;width:90px;color:#0f172a;font-weight:600">₹${(order.totalAmount + (order.discountAmount || 0)).toLocaleString("en-IN")}</span></p>
                ${order.discountAmount ? `<p style="margin:0 0 6px;font-size:14px;color:#64748b">Discount (${order.couponCode}): <span style="display:inline-block;width:90px;color:#10b981;font-weight:600">-₹${order.discountAmount.toLocaleString("en-IN")}</span></p>` : ''}
                <p style="margin:0 0 12px;font-size:14px;color:#64748b">Shipping: <span style="display:inline-block;width:90px;color:${order.shipping === 0 ? "#10b981" : "#0f172a"};font-weight:600">${order.shipping === 0 ? "FREE" : "₹" + order.shipping.toLocaleString("en-IN")}</span></p>
                <p style="margin:0;font-size:18px;font-weight:800;color:#0f172a">Grand Total: <span style="display:inline-block;width:90px">₹${(order.totalAmount + (order.shipping || 0)).toLocaleString("en-IN")}</span></p>
            </div>
            <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center">
                <p style="margin:0;font-size:13px;color:#94a3b8">Returns & exchanges available within 7 days of delivery.</p>
                <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1">Extract Menswear • Premium Men's Fashion</p>
            </div>
        </div>
    </div>`;
};

export const createOrder = async (req, res) => {
    try {
        const result = await orderQueue.enqueue(async () => {
            const { items, userId, userEmail, userName, shippingAddress, couponCode } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                const err = new Error("No items in order");
                err.statusCode = 400;
                throw err;
            }

            let computedSubtotal = 0;
            let computedShipping = 0;
            const verifiedItems = [];

            for (const item of items) {
                const dbProduct = await Product.findById(item.productId);
                if (!dbProduct) {
                    const err = new Error(`Product ${item.name || item.productId} not found`);
                    err.statusCode = 404;
                    throw err;
                }

                // Check actual stock availability
                if (dbProduct.stock < item.quantity) {
                    const err = new Error(`Insufficient stock for ${dbProduct.name}. Available: ${dbProduct.stock}`);
                    err.statusCode = 400;
                    throw err;
                }

                // Check if size is required and validate
                if (dbProduct.sizes && dbProduct.sizes.length > 0) {
                    if (!item.size || !dbProduct.sizes.includes(item.size)) {
                        const err = new Error(`Size is required and must be valid for ${dbProduct.name}`);
                        err.statusCode = 400;
                        throw err;
                    }
                } else {
                    if (item.size && item.size !== "") {
                        const err = new Error(`Product ${dbProduct.name} does not accept size`);
                        err.statusCode = 400;
                        throw err;
                    }
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

            let discountAmount = 0;
            if (couponCode) {
                const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
                if (!coupon) {
                    throw Object.assign(new Error("Invalid coupon code"), { statusCode: 400 });
                }
                if (!coupon.isActive) {
                    throw Object.assign(new Error("This coupon is no longer active"), { statusCode: 400 });
                }
                if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
                    throw Object.assign(new Error("This coupon has expired"), { statusCode: 400 });
                }
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    throw Object.assign(new Error("This coupon has reached its usage limit"), { statusCode: 400 });
                }
                if (coupon.oncePerUser && coupon.usedBy.includes(userId)) {
                    throw Object.assign(new Error("You have already used this coupon"), { statusCode: 400 });
                }
                if (coupon.minOrderValue && computedSubtotal < coupon.minOrderValue) {
                    throw Object.assign(new Error(`Minimum order value of ₹${coupon.minOrderValue} required`), { statusCode: 400 });
                }
                
                if (coupon.discountType === "percentage") {
                    discountAmount = (computedSubtotal * coupon.discountValue) / 100;
                } else if (coupon.discountType === "fixed") {
                    discountAmount = coupon.discountValue;
                }
                if (discountAmount > computedSubtotal) {
                    discountAmount = computedSubtotal;
                }
            }

            computedSubtotal -= Math.round(discountAmount);

            const totalAmount = computedSubtotal + computedShipping;
            if (totalAmount <= 0) {
                const err = new Error("Order total must be greater than zero");
                err.statusCode = 400;
                throw err;
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
                couponCode: couponCode ? couponCode.toUpperCase() : null,
                discountAmount: Math.round(discountAmount),
            });

            return { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency };
        });

        res.json(result);
    } catch (error) {
        console.error("Create order error:", error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const result = await orderQueue.enqueue(async () => {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            const expectedBuffer = Buffer.from(expectedSignature, "hex");
            const signatureBuffer = Buffer.from(razorpay_signature, "hex");

            if (
                expectedBuffer.length !== signatureBuffer.length ||
                !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
            ) {
                const err = new Error("Payment verification failed");
                err.statusCode = 400;
                throw err;
            }

            const invoiceNumber = generateInvoiceNumber();
            const now = new Date();

            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { razorpayPaymentId: razorpay_payment_id, status: "paid", invoiceNumber, paidAt: now },
                { new: true }
            );

            if (!order) {
                const err = new Error("Order not found");
                err.statusCode = 404;
                throw err;
            }

            // Deduct stock for each purchased item now that payment is confirmed
            if (order.items) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { stock: -item.quantity } }
                    );
                }
            }

            // Clear user's cart after successful payment
            if (order.userId) {
                await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });
            }

            // Increment coupon usage count if a coupon was used
            if (order.couponCode) {
                const updateQuery = { $inc: { usedCount: 1 } };
                if (order.userId) {
                    updateQuery.$push = { usedBy: order.userId };
                }
                await Coupon.findOneAndUpdate(
                    { code: order.couponCode },
                    updateQuery
                );
            }

            // Send confirmation email with invoice PDF asynchronously
            if (order.userEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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

            return {
                message: "Payment verified successfully",
                orderId: order._id,
                invoiceNumber,
            };
        });

        res.json(result);
    } catch (error) {
        console.error("Verify payment error:", error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
