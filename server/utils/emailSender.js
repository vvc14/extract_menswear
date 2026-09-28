import { sendEmail } from "./emailTransporter.js";

/**
 * Send OTP verification email.
 * Kept deliberately simple: light background, one short message, a plain-text part,
 * no links or images — the pattern mailbox providers expect from verification codes.
 */
export async function sendOtpEmail(toEmail, otp) {
    const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;color:#0f172a">
            <p style="font-size:18px;font-weight:bold;margin:0 0 20px">Extract Menswear</p>
            <p style="font-size:15px;line-height:1.6;margin:0 0 16px">Use this code to verify your email address:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:0 0 16px;font-family:'Courier New',monospace">${otp}</p>
            <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 8px">The code expires in 10 minutes.</p>
            <p style="font-size:13px;line-height:1.6;color:#64748b;margin:24px 0 0">If you didn't request this, you can ignore this email. Someone may have typed your address by mistake.</p>
        </div>
    `;

    await sendEmail({
        to: toEmail,
        subject: `${otp} is your Extract Menswear verification code`,
        html,
        text: `Extract Menswear\n\nUse this code to verify your email address: ${otp}\n\nThe code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    });
}
