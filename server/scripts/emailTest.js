// Email deliverability check.
//
//   npm run email:test -- you@example.com
//
// Sends a sample verification-code email and a sample order confirmation (with invoice PDF)
// using your real email settings from .env, and prints the setup warnings.
//
// Best use: open https://www.mail-tester.com, copy the throwaway address it shows, run this
// script with that address, then click "Then check your score". It reports SPF, DKIM, DMARC,
// blacklist and content problems for exactly the mail your store sends.
import "dotenv/config";
import { sendEmail, describeEmailSetup, isEmailConfigured } from "../utils/emailTransporter.js";
import { sendOtpEmail } from "../utils/emailSender.js";
import { buildOrderConfirmationHtml, buildOrderConfirmationText } from "../utils/emailTemplates.js";
import { generateInvoicePDFBuffer } from "../utils/pdfGenerator.js";

const to = process.argv[2];
if (!to || !to.includes("@")) {
    console.error("Usage: npm run email:test -- recipient@example.com");
    process.exit(1);
}

const setup = describeEmailSetup();
console.log(`Provider: ${setup.provider || "none"}   From: ${setup.from || "(not set)"}`);
for (const w of setup.warnings) console.log(`⚠️  ${w}`);
if (!isEmailConfigured()) process.exit(1);

const sampleOrder = {
    invoiceNumber: "EXT-TEST-000001",
    userName: "Test Customer",
    razorpayPaymentId: "pay_TEST123",
    paidAt: new Date(),
    createdAt: new Date(),
    items: [{ name: "Oxford Cotton Shirt", size: "M", price: 1499, quantity: 1 }],
    totalAmount: 1499,
    shipping: 0,
    discountAmount: 0,
    shippingAddress: { name: "Test Customer", phone: "9999999999", street: "1 Test Street", city: "Pune", state: "MH", pincode: "411001", country: "India" },
};

try {
    await sendOtpEmail(to, "123456");
    const pdf = await generateInvoicePDFBuffer(sampleOrder);
    console.log(`Invoice PDF size: ${(pdf.length / 1024).toFixed(0)} KB`);
    await sendEmail({
        to,
        subject: `Order Confirmed — ${sampleOrder.invoiceNumber}`,
        html: buildOrderConfirmationHtml(sampleOrder),
        text: buildOrderConfirmationText(sampleOrder),
        attachments: [{ filename: `Invoice_${sampleOrder.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    console.log("Sent 2 test emails. In Gmail, open one → ⋮ → 'Show original' and check SPF, DKIM and DMARC all say PASS.");
    process.exit(0);
} catch (err) {
    console.error("Sending failed:", err.message);
    process.exit(1);
}
