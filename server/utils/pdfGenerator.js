import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDFBuffer = (order) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 0, size: "A4" });
            const buffers = [];

            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => {
                resolve(Buffer.concat(buffers));
            });

            const pw = doc.page.width;   // 595.28
            const ph = doc.page.height;  // 841.89

            // ─── Full page background ───
            doc.rect(0, 0, pw, ph).fill("#fafbfc");

            // ─── Left accent strip ───
            doc.rect(0, 0, 6, ph).fill("#d4af37");

            // ─── Header Band ───
            doc.rect(6, 0, pw - 6, 140).fill("#0f172a");

            // ─── Gold underline accent ───
            doc.rect(6, 140, pw - 6, 3).fill("#d4af37");

            // ─── Logo / Brand ───
            const logoPath = path.resolve(process.cwd(), "../client/public/images/logo.png");
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, 25, { height: 50 });
                doc.fillColor("#d4af37").font("Helvetica").fontSize(9)
                    .text("P R E M I U M   M E N S W E A R", 42, 85, { characterSpacing: 0.8 });
            } else {
                doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(38)
                    .text("EXTRACT", 40, 35, { characterSpacing: 3 });
                doc.fillColor("#d4af37").font("Helvetica").fontSize(9)
                    .text("P R E M I U M   M E N S W E A R", 42, 85, { characterSpacing: 0.8 });
            }

            // ─── Invoice Title Block ───
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(28)
                .text("INVOICE", pw - 220, 40, { width: 180, align: "right", characterSpacing: 2 });
            doc.fillColor("#94a3b8").font("Helvetica").fontSize(10)
                .text(`No. ${order.invoiceNumber || "N/A"}`, pw - 220, 78, { width: 180, align: "right" });

            // ─── Paid Badge ───
            const badgeW = 60, badgeH = 22;
            doc.roundedRect(pw - 100, 105, badgeW, badgeH, 4).fill("#10b981");
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10)
                .text((order.status || "PAID").toUpperCase(), pw - 100, 111, { width: badgeW, align: "center" });

            // ─── Date line below header ───
            const orderDate = new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
            });
            doc.fillColor("#64748b").font("Helvetica").fontSize(9)
                .text(`Issue Date: ${orderDate}`, pw - 220, 118, { width: 180, align: "right" });

            // ─── Customer Details Card ───
            let y = 165;
            doc.roundedRect(40, y, pw - 80, 85, 6).fillAndStroke("#ffffff", "#e2e8f0");

            y += 16;
            doc.fillColor("#94a3b8").font("Helvetica-Bold").fontSize(8).text("BILLED TO", 60, y);
            doc.fillColor("#94a3b8").font("Helvetica-Bold").fontSize(8).text("PAYMENT DETAILS", pw / 2 + 20, y);
            
            y += 18;
            doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14)
                .text(order.userName || "Customer", 60, y);
            doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                .text(orderDate, pw / 2 + 20, y);

            y += 18;
            doc.fillColor("#475569").font("Helvetica").fontSize(10)
                .text(order.userEmail || "N/A", 60, y);
            doc.fillColor("#475569").font("Helvetica").fontSize(9)
                .text(`Payment ID: ${order.razorpayPaymentId || "N/A"}`, pw / 2 + 20, y);

            // ─── Table ───
            y = 275;

            // Table Header
            doc.roundedRect(40, y, pw - 80, 32, 4).fill("#0f172a");
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
            doc.text("No.", 55, y + 11, { width: 25 });
            doc.text("DESCRIPTION", 85, y + 11, { width: 200 });
            doc.text("QTY", 310, y + 11, { width: 40, align: "center" });
            doc.text("UNIT PRICE", 360, y + 11, { width: 80, align: "right" });
            doc.text("AMOUNT", 450, y + 11, { width: 90, align: "right" });

            y += 40;

            // Table Rows
            order.items.forEach((item, idx) => {
                const totalItemPrice = item.price * item.quantity;
                const isEven = idx % 2 === 0;

                if (isEven) {
                    doc.rect(40, y - 6, pw - 80, 28).fill("#f8fafc");
                }

                doc.fillColor("#94a3b8").font("Helvetica").fontSize(9)
                    .text(String(idx + 1).padStart(2, "0"), 55, y + 3, { width: 25 });
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(item.name, 85, y + 2, { width: 200 });
                doc.fillColor("#475569").font("Helvetica").fontSize(10)
                    .text(item.quantity.toString(), 310, y + 2, { width: 40, align: "center" });
                doc.fillColor("#475569").font("Helvetica").fontSize(10)
                    .text(`Rs. ${item.price.toLocaleString("en-IN")}`, 360, y + 2, { width: 80, align: "right" });
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(`Rs. ${totalItemPrice.toLocaleString("en-IN")}`, 450, y + 2, { width: 90, align: "right" });
                
                y += 28;
            });

            // ─── Table bottom line ───
            doc.moveTo(40, y + 2).lineTo(pw - 40, y + 2).lineWidth(0.5).stroke("#e2e8f0");

            // ─── Summary Block ───
            y += 20;
            const shipping = order.shipping || 0;
            const discount = order.discountAmount || 0;
            const originalSubtotal = order.totalAmount + discount;
            const grandTotal = order.totalAmount + shipping;
            const sumLabelX = 370;
            const sumValueX = pw - 55;

            doc.fillColor("#64748b").font("Helvetica").fontSize(11).text("Subtotal", sumLabelX, y);
            doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11)
                .text(`Rs. ${originalSubtotal.toLocaleString("en-IN")}`, sumValueX, y, { align: "right", width: 100 });
            
            if (discount > 0) {
                y += 22;
                doc.fillColor("#64748b").font("Helvetica").fontSize(11).text(`Discount (${order.couponCode || 'Coupon'})`, sumLabelX, y);
                doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(11)
                    .text(`-Rs. ${discount.toLocaleString("en-IN")}`, sumValueX, y, { align: "right", width: 100 });
            }

            y += 22;
            doc.fillColor("#64748b").font("Helvetica").fontSize(11).text("Shipping", sumLabelX, y);
            doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(11)
                .text(shipping > 0 ? `Rs. ${shipping.toLocaleString("en-IN")}` : "FREE", sumValueX, y, { align: "right", width: 100 });

            // ─── Divider ───
            y += 22;
            doc.moveTo(sumLabelX, y).lineTo(pw - 40, y).dash(2, { space: 2 }).stroke("#cbd5e1").undash();

            // ─── Grand Total Row ───
            y += 12;
            doc.roundedRect(sumLabelX - 15, y - 8, pw - sumLabelX + 15 - 25, 40, 5).fill("#0f172a");
            doc.fillColor("#d4af37").font("Helvetica-Bold").fontSize(12)
                .text("GRAND TOTAL", sumLabelX + 5, y + 5);
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20)
                .text(`Rs. ${grandTotal.toLocaleString("en-IN")}`, sumValueX - 10, y + 1, { align: "right", width: 120 });

            // ─── Decorative line across middle ───
            const midDecY = y + 55;
            doc.moveTo(40, midDecY).lineTo(pw - 40, midDecY).lineWidth(0.5).stroke("#e2e8f0");

            // ─── Thank You Block ───
            doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16)
                .text("Thank You for Your Business!", 0, midDecY + 18, { align: "center", width: pw });
            doc.fillColor("#64748b").font("Helvetica").fontSize(10)
                .text("We truly appreciate your trust in Extract Premium Menswear.", 0, midDecY + 40, { align: "center", width: pw });

            // ─── Footer band ───
            const footH = 50;
            const footY = ph - footH;
            doc.rect(6, footY, pw - 6, footH).fill("#0f172a");
            doc.rect(6, footY, pw - 6, 2).fill("#d4af37");

            doc.fillColor("#94a3b8").font("Helvetica").fontSize(8)
                .text("Returns & exchanges within 7 days  •  Quality guaranteed  •  www.extractmenswear.com", 0, footY + 20, { align: "center", width: pw });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
