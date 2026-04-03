import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = async (order) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();   // 210
    const ph = doc.internal.pageSize.getHeight();   // 297

    // ─── Full page background ───
    doc.setFillColor(250, 251, 252);
    doc.rect(0, 0, pw, ph, "F");

    // ─── Left gold accent strip ───
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 0, 2, ph, "F");

    // ─── Header band ───
    doc.setFillColor(15, 23, 42);
    doc.rect(2, 0, pw - 2, 50, "F");

    // ─── Gold underline ───
    doc.setFillColor(212, 175, 55);
    doc.rect(2, 50, pw - 2, 1.2, "F");

    // ─── Logo / Brand ───
    try {
        const img = await new Promise((res, rej) => {
            const image = new Image();
            image.src = "/images/logo.png";
            image.onload = () => res(image);
            image.onerror = rej;
        });
        const ratio = img.height / img.width;
        const logoH = 18;
        const logoW = logoH / ratio;
        doc.addImage(img, "PNG", 12, 8, logoW, logoH);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(212, 175, 55);
        doc.text("P R E M I U M   M E N S W E A R", 12, 34);
    } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.text("EXTRACT", 12, 26);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(212, 175, 55);
        doc.text("P R E M I U M   M E N S W E A R", 12, 34);
    }

    // ─── Invoice Title ───
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("INVOICE", pw - 12, 22, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`No. ${order.invoiceNumber || "N/A"}`, pw - 12, 32, { align: "right" });

    // ─── PAID badge ───
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pw - 35, 38, 23, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text("PAID", pw - 23.5, 43.5, { align: "center" });

    // ─── Customer Details Card ───
    let y = 58;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, y, pw - 24, 30, 2, 2, "FD");

    y += 8;
    // Left side
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("BILLED TO", 16, y);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(order.userName || "Customer", 16, y + 6);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(order.userEmail || "N/A", 16, y + 12);

    // Right side
    const orderDate = new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("DATE", pw / 2 + 10, y);
    doc.text("PAYMENT ID", pw / 2 + 10, y + 10);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(orderDate, pw / 2 + 40, y);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(order.razorpayPaymentId || "N/A", pw / 2 + 40, y + 10);

    // ─── Items Table ───
    const tableBody = order.items.map((item, idx) => [
        String(idx + 1).padStart(2, "0"),
        item.name,
        item.quantity,
        `Rs. ${item.price.toLocaleString("en-IN")}`,
        `Rs. ${(item.price * item.quantity).toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
        startY: 95,
        head: [["No.", "Description", "Qty", "Unit Price", "Amount"]],
        body: tableBody,
        margin: { left: 12, right: 12 },
        styles: {
            fontSize: 9,
            cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
            textColor: [15, 23, 42],
            lineColor: [241, 245, 249],
            lineWidth: 0.3,
        },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { cellWidth: 14, halign: "center", textColor: [148, 163, 184], fontStyle: "normal" },
            1: { fontStyle: "bold" },
            2: { cellWidth: 14, halign: "center" },
            3: { cellWidth: 30, halign: "right" },
            4: { cellWidth: 34, halign: "right", fontStyle: "bold" },
        },
    });

    // ─── Summary ───
    const finalY = doc.lastAutoTable.finalY + 8;
    const sumLX = pw - 100;
    const sumRX = pw - 16;

    const shipping = order.shipping || 0;
    const grandTotal = order.totalAmount + shipping;

    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal", sumLX, finalY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${order.totalAmount.toLocaleString("en-IN")}`, sumRX, finalY, { align: "right" });

    // Shipping
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Shipping", sumLX, finalY + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(shipping > 0 ? `Rs. ${shipping.toLocaleString("en-IN")}` : "FREE", sumRX, finalY + 8, { align: "right" });

    // Dash separator
    doc.setDrawColor(203, 213, 225);
    doc.setLineDash([1, 1], 0);
    doc.line(sumLX, finalY + 14, sumRX, finalY + 14);
    doc.setLineDash([], 0);

    // Grand Total Box
    const boxX = sumLX - 5;
    const boxW = sumRX - sumLX + 10;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(boxX, finalY + 18, boxW, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text("GRAND TOTAL", boxX + 8, finalY + 28);
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`Rs. ${grandTotal.toLocaleString("en-IN")}`, boxX + boxW - 6, finalY + 28.5, { align: "right" });

    // ─── Thank You ───
    const tyY = finalY + 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Thank You for Your Business!", pw / 2, tyY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("We truly appreciate your trust in Extract Premium Menswear.", pw / 2, tyY + 8, { align: "center" });

    // ─── Footer band ───
    const footH = 16;
    const footY = ph - footH;
    doc.setFillColor(15, 23, 42);
    doc.rect(2, footY, pw - 2, footH, "F");
    doc.setFillColor(212, 175, 55);
    doc.rect(2, footY, pw - 2, 0.8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Returns & exchanges within 7 days  •  Quality guaranteed  •  www.extractmenswear.com", pw / 2, footY + 10, { align: "center" });

    doc.save(`Extract_Invoice_${order.invoiceNumber || "order"}.pdf`);
};
