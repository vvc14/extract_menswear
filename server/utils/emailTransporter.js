import { Resend } from "resend";
import crypto from "crypto";

// ─── Resend client (proper transactional email service) ───
let _resend = null;

function getResend() {
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
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
 * Send an email via Resend with proper deliverability.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plain text body (auto-generated from html if omitted)
 * @param {Array}  [options.attachments] - File attachments [{filename, content}]
 * @param {string} [options.replyTo] - Reply-to address
 * @returns {Promise}
 */
export async function sendEmail(options) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️  RESEND_API_KEY not set. Email skipped.");
        return;
    }

    const resend = getResend();

    // Auto-generate plain text from HTML if not provided
    const plainText = options.text || htmlToPlainText(options.html || "");

    // Format attachments for Resend (expects Buffer content)
    const attachments = (options.attachments || []).map((att) => ({
        filename: att.filename,
        content: att.content, // Buffer
        content_type: att.contentType,
    }));

    const emailPayload = {
        // onboarding@resend.dev is Resend's shared sender — works without domain verification
        // Once you verify your own domain in Resend dashboard, change this to your domain email
        from: "Extract Menswear <onboarding@resend.dev>",
        to: [options.to],
        subject: options.subject,
        html: options.html || undefined,
        text: plainText,
        reply_to: options.replyTo || process.env.EMAIL_USER || undefined,
    };

    if (attachments.length > 0) {
        emailPayload.attachments = attachments;
    }

    try {
        const { data, error } = await resend.emails.send(emailPayload);
        if (error) {
            console.error("❌ Resend error:", error);
            throw new Error(error.message);
        }
        console.log(`📧 Email sent via Resend (ID: ${data?.id})`);
        return data;
    } catch (err) {
        console.error("❌ Email send failed:", err.message);
        throw err;
    }
}

/**
 * Check if email service is configured.
 */
export function isEmailConfigured() {
    return !!process.env.RESEND_API_KEY;
}

export default { sendEmail, isEmailConfigured };
