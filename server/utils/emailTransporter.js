import nodemailer from "nodemailer";

// ─── Email delivery ───
// Providers, picked from the environment in this order:
//   1. BREVO_API_KEY        → Brevo HTTPS API (works on hosts that block SMTP ports)
//   2. SMTP_HOST            → any SMTP relay (Brevo SMTP, Amazon SES, Zoho, Mailjet, ...)
//   3. MAILJET_API_KEY/_SECRET_KEY → Mailjet SMTP (kept for existing setups)
//   4. EMAIL_USER/EMAIL_PASS → Gmail with an app password
//
// Deliverability rules applied here:
//   - The From address must belong to a domain the provider is authorised to send for
//     (SPF + DKIM aligned with DMARC). Sending as @gmail.com through anything other than
//     Gmail fails DMARC and lands in spam, so we warn about it at startup.
//   - No fake or broken headers (no custom Message-ID, no List-Unsubscribe pointing at
//     pages that don't unsubscribe). Transactional mail doesn't need List-Unsubscribe.
//   - Every message has a real plain-text part alongside the HTML.

const FREE_MAIL_DOMAINS = ["gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com", "live.com", "icloud.com", "rediffmail.com"];

const provider = () => {
    if (process.env.BREVO_API_KEY) return "brevo";
    if (process.env.SMTP_HOST) return "smtp";
    if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) return "mailjet";
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return "gmail";
    return null;
};

const fromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
const fromName = () => process.env.EMAIL_FROM_NAME || "Extract Menswear";
const replyToDefault = () => process.env.EMAIL_REPLY_TO || fromAddress();

export function isEmailConfigured() {
    return !!provider() && !!fromAddress();
}

let _transporter = null;
function getTransporter() {
    if (_transporter) return _transporter;
    const p = provider();
    if (p === "smtp") {
        const port = Number(process.env.SMTP_PORT || 587);
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            pool: true,
            maxConnections: 3,
        });
    } else if (p === "mailjet") {
        _transporter = nodemailer.createTransport({
            host: "in-v3.mailjet.com",
            port: 587,
            secure: false,
            auth: { user: process.env.MAILJET_API_KEY, pass: process.env.MAILJET_SECRET_KEY },
            pool: true,
            maxConnections: 3,
        });
    } else {
        _transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            pool: true,
            maxConnections: 3,
        });
    }
    return _transporter;
}

/** Strip HTML tags to produce a plain-text version of the email. */
export function htmlToPlainText(html) {
    if (!html) return "";
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
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
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

async function sendViaBrevo({ to, subject, html, text, replyTo, attachments }) {
    const body = {
        sender: { name: fromName(), email: fromAddress() },
        to: [{ email: to }],
        subject,
        htmlContent: html || undefined,
        textContent: text,
        replyTo: replyTo ? { email: replyTo } : undefined,
        attachment: attachments?.length
            ? attachments.map((a) => ({ name: a.filename, content: Buffer.from(a.content).toString("base64") }))
            : undefined,
    };
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(`Brevo API ${res.status}: ${data.message || res.statusText}`);
        err.responseCode = res.status;
        throw err;
    }
    return { messageId: data.messageId };
}

/**
 * Send an email.
 * @param {Object} options { to, subject, html?, text?, attachments?, replyTo? }
 */
export async function sendEmail(options) {
    if (!isEmailConfigured()) {
        console.warn("⚠️  Email is not configured. Email skipped.");
        return;
    }

    const message = {
        to: options.to,
        subject: options.subject,
        html: options.html || undefined,
        text: options.text || htmlToPlainText(options.html || ""),
        replyTo: options.replyTo || replyToDefault(),
        attachments: options.attachments || [],
    };

    let result;
    if (provider() === "brevo") {
        result = await sendViaBrevo(message);
    } else {
        result = await getTransporter().sendMail({
            ...message,
            from: { name: fromName(), address: fromAddress() },
        });
    }
    console.log(`📧 Email sent to ${options.to} (ID: ${result?.messageId || "n/a"})`);
    return result;
}

// Startup check: explain configurations that are known to land in spam
export function describeEmailSetup() {
    const p = provider();
    if (!p) return { ok: false, warnings: ["No email provider configured — order emails and OTPs will not be sent."] };
    const from = fromAddress();
    const domain = from.split("@")[1]?.toLowerCase() || "";
    const warnings = [];
    if (!from) warnings.push("EMAIL_FROM is not set.");
    if (FREE_MAIL_DOMAINS.includes(domain) && p !== "gmail") {
        warnings.push(`EMAIL_FROM uses ${domain} but mail is sent through ${p}. This fails DMARC and will land in spam. Use an address on your own domain (e.g. orders@yourstore.com) verified with the provider.`);
    }
    if (p === "gmail" && process.env.EMAIL_FROM && process.env.EMAIL_FROM.toLowerCase() !== (process.env.EMAIL_USER || "").toLowerCase()) {
        warnings.push("With Gmail, EMAIL_FROM must be the Gmail account itself (or a verified 'Send mail as' alias).");
    }
    if (p === "gmail") {
        warnings.push("Sending through a personal Gmail account works for testing, but store mail from a free mailbox is often filtered. For production, use your own domain with Brevo/SES and SPF, DKIM and DMARC records.");
    }
    return { ok: true, provider: p, from, warnings };
}

export default { sendEmail, isEmailConfigured, describeEmailSetup };
