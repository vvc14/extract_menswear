import nodemailer from "nodemailer";
import crypto from "crypto";

// ─── Singleton transporter ───
let _transporter = null;

function getTransporter() {
    if (!_transporter) {
        // Use Mailjet SMTP if configured, otherwise fall back to Gmail
        if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
            _transporter = nodemailer.createTransport({
                host: "in-v3.mailjet.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.MAILJET_API_KEY,
                    pass: process.env.MAILJET_SECRET_KEY,
                },
                pool: true,
                maxConnections: 3,
            });
            console.log("📧 Email: Using Mailjet SMTP relay");
        } else {
            _transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                pool: true,
                maxConnections: 3,
            });
            console.log("📧 Email: Using Gmail SMTP (fallback)");
        }
    }
    return _transporter;
}

/**
 * Strip HTML tags to produce a plain-text version of the email.
 */
function htmlToPlainText(html) {
    if (!html) return "";
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<\/td>/gi, "  ")
        .replace(/<\/th>/gi, "  ")
        .replace(/<li>/gi, "• ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Generate a proper RFC 2822 Message-ID.
 */
function generateMessageId() {
    const domain = (process.env.EMAIL_USER || "noreply@extract.com").split("@")[1] || "extract.com";
    const uniqueId = crypto.randomBytes(16).toString("hex");
    return `<${uniqueId}@${domain}>`;
}

/**
 * Send an email with anti-spam best practices.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plain text body (auto-generated from html if omitted)
 * @param {Array}  [options.attachments] - File attachments
 * @param {string} [options.replyTo] - Reply-to address
 * @returns {Promise}
 */
export async function sendEmail(options) {
    if (!process.env.EMAIL_USER) {
        console.warn("⚠️  EMAIL_USER not set. Email skipped.");
        return;
    }

    const transporter = getTransporter();
    const fromAddress = `"Extract Menswear" <${process.env.EMAIL_USER}>`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // Auto-generate plain text from HTML if not provided
    const plainText = options.text || htmlToPlainText(options.html || "");

    const mailOptions = {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html || undefined,
        text: plainText,
        replyTo: options.replyTo || process.env.EMAIL_USER,
        attachments: options.attachments || [],
        headers: {
            "Message-ID": generateMessageId(),
            "X-Priority": "3",
            "X-Mailer": "Extract Menswear Notifications",
            "List-Unsubscribe": `<${clientUrl}/profile>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "Feedback-ID": "transactional:extract:account:orders",
        },
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.to} (ID: ${result.messageId})`);
    return result;
}

/**
 * Check if email service is configured.
 */
export function isEmailConfigured() {
    return !!((process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) || (process.env.EMAIL_USER && process.env.EMAIL_PASS));
}

export default { sendEmail, isEmailConfigured };
