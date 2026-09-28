import { escapeHtml as e } from "./httpError.js";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const shell = (inner) => `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#0f172a;padding:28px 32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em">EXTRACT</h1>
            <p style="margin:4px 0 0;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em">Premium Menswear</p>
        </div>
        <div style="padding:32px">${inner}</div>
    </div>`;

export const buildOrderConfirmationHtml = (order) => {
    const itemRows = order.items
        .map(
            (i) => `<tr>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155">${e(i.name)}${i.size ? ` <span style="color:#94a3b8">(${e(i.size)})</span>` : ""}</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;text-align:center">${e(i.quantity)}</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;text-align:right">${inr(i.price * i.quantity)}</td>
                </tr>`
        )
        .join("");

    const shipping = order.shipping || 0;
    const discount = order.discountAmount || 0;
    return shell(`
            <div style="text-align:center;margin-bottom:28px">
                <div style="width:56px;height:56px;background:#ecfdf5;border-radius:50%;display:inline-block;text-align:center;line-height:56px;margin-bottom:12px">
                    <span style="font-size:28px;color:#10b981">✓</span>
                </div>
                <h2 style="margin:0;font-size:22px;font-weight:700;color:#0f172a">Payment Successful!</h2>
                <p style="margin:6px 0 0;font-size:14px;color:#64748b">Thank you for your purchase, ${e(order.userName || "Customer")}</p>
            </div>
            <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                    <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Invoice No.</td><td style="font-size:13px;font-weight:700;color:#0f172a;text-align:right;padding:4px 0">${e(order.invoiceNumber || "—")}</td></tr>
                    <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Order Date</td><td style="font-size:13px;font-weight:600;color:#0f172a;text-align:right;padding:4px 0">${new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
                    <tr><td style="font-size:13px;color:#64748b;padding:4px 0">Payment ID</td><td style="font-size:13px;font-weight:600;color:#0f172a;text-align:right;padding:4px 0">${e(order.razorpayPaymentId || "—")}</td></tr>
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
            <div style="text-align:right;border-top:2px solid #e2e8f0;padding-top:16px;margin-bottom:28px">
                <p style="margin:0 0 6px;font-size:14px;color:#64748b">Subtotal: <span style="display:inline-block;width:90px;color:#0f172a;font-weight:600">${inr(order.totalAmount + discount)}</span></p>
                ${discount ? `<p style="margin:0 0 6px;font-size:14px;color:#64748b">Discount (${e(order.couponCode)}): <span style="display:inline-block;width:90px;color:#10b981;font-weight:600">-${inr(discount)}</span></p>` : ""}
                <p style="margin:0 0 12px;font-size:14px;color:#64748b">Shipping: <span style="display:inline-block;width:90px;color:${shipping === 0 ? "#10b981" : "#0f172a"};font-weight:600">${shipping === 0 ? "FREE" : inr(shipping)}</span></p>
                <p style="margin:0;font-size:18px;font-weight:800;color:#0f172a">Grand Total: <span style="display:inline-block;width:90px">${inr(order.totalAmount + shipping)}</span></p>
            </div>
            <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center">
                <p style="margin:0;font-size:13px;color:#94a3b8">Returns &amp; exchanges available within 7 days of delivery.</p>
                <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1">Extract Menswear • Premium Men's Fashion</p>
            </div>`);
};

// `paragraphs` are plain strings; they are escaped here, so callers must not pass HTML.
export const buildStatusEmailHtml = (order, title, paragraphs) => {
    const body = paragraphs
        .filter(Boolean)
        .map((p) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155">${e(p).replace(/\n/g, "<br/>")}</p>`)
        .join("");
    return shell(`
            <h2 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#0f172a">${e(title)}</h2>
            ${body}
            <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-top:10px">
                <p style="margin:0;font-size:13px;color:#64748b">Invoice: <strong style="color:#0f172a">${e(order.invoiceNumber || "—")}</strong></p>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b">Order total: <strong style="color:#0f172a">${inr((order.totalAmount || 0) + (order.shipping || 0))}</strong></p>
            </div>`);
};

// ─── Plain-text versions (sent alongside the HTML; improves deliverability and accessibility) ───
const rs = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

export const buildOrderConfirmationText = (order) => {
    const shipping = order.shipping || 0;
    const discount = order.discountAmount || 0;
    const lines = order.items.map((i) => `- ${i.name}${i.size ? ` (${i.size})` : ""} x${i.quantity}: ${rs(i.price * i.quantity)}`);
    return [
        `Hi ${order.userName || "there"},`,
        "",
        "Thank you for your order. Your payment was successful.",
        "",
        `Invoice: ${order.invoiceNumber || "-"}`,
        `Payment ID: ${order.razorpayPaymentId || "-"}`,
        "",
        ...lines,
        "",
        `Subtotal: ${rs(order.totalAmount + discount)}`,
        discount ? `Discount (${order.couponCode}): -${rs(discount)}` : null,
        `Shipping: ${shipping === 0 ? "FREE" : rs(shipping)}`,
        `Total paid: ${rs(order.totalAmount + shipping)}`,
        "",
        "Your invoice is attached. Returns and exchanges are available within 7 days of delivery.",
        "",
        "Extract Menswear",
    ].filter((l) => l !== null).join("\n");
};

export const buildStatusEmailText = (order, title, paragraphs) =>
    [
        title,
        "",
        ...paragraphs.filter(Boolean),
        "",
        `Invoice: ${order.invoiceNumber || "-"}`,
        `Order total: ${rs((order.totalAmount || 0) + (order.shipping || 0))}`,
        "",
        "Extract Menswear",
    ].join("\n");

