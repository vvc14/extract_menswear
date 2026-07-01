import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send OTP verification email
 */
export async function sendOtpEmail(toEmail, otp) {
    const mailOptions = {
        from: `"Extract Menswear" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your Verification Code — Extract Menswear",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 30px; background: #0f172a; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Extract Menswear</h1>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Premium Fashion</p>
                </div>
                <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 8px;">Your verification code is</p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #3b82f6; padding: 16px 0; font-family: monospace;">${otp}</div>
                    <p style="color: #64748b; font-size: 13px; margin: 12px 0 0;">This code expires in <strong style="color: #94a3b8;">10 minutes</strong></p>
                </div>
                <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 24px; line-height: 1.5;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}
