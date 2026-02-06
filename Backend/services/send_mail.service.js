const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    },
});

async function sendOtpEmail({ to, otp }) {
    return transporter.sendMail({
        from: `"QA Examination Platform - VEC" <${process.env.EMAIL_USER}>`,
        to,
        subject: "🔐 Password Reset Request - Your OTP Code",
        text: `Your OTP for password reset is: ${otp}. This code is valid for 10 minutes only. If you did not request this, please ignore this email.`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        </head>
        <body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color:#f1f5f9;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;">
            <tr>
            <td align="center" style="padding:40px 20px;">
                
                <!-- Email Card -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:100%; max-width:600px; background:#ffffff; border-radius:12px;">
                
                <!-- Header with Icon -->
                <tr>
                    <td style="background-color:#fdcc03; padding:40px 30px; text-align:center; border-radius:12px 12px 0 0;">
                    <!-- Icon Circle -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 16px;">
                        <tr>
                        <td align="center" style="width:80px; height:80px; background:#ffffff; border-radius:50%; line-height:80px; font-size:40px;">
                            🔐
                        </td>
                        </tr>
                    </table>
                    <h1 style="margin:0; padding:0; color:#1e293b; font-size:28px; font-weight:700;">Password Reset Request</h1>
                    <p style="margin:8px 0 0; padding:0; color:#334155; font-size:14px;">QA Examination Platform</p>
                    </td>
                </tr>
    
                <!-- Content Body -->
                <tr>
                    <td style="padding:40px 30px;">
                    
                    <!-- Greeting -->
                    <p style="margin:0 0 16px; padding:0; color:#1e293b; font-size:16px; font-weight:600;">Hello,</p>
    
                    <!-- Main Message -->
                    <p style="margin:0 0 24px; padding:0; color:#475569; font-size:15px; line-height:1.6;">
                        We received a request to reset your password for your QA Examination Platform account. 
                        To proceed with resetting your password, please use the One-Time Password (OTP) below:
                    </p>
    
                    <!-- OTP Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
                        <tr>
                        <td align="center">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background:#fffbeb; border:3px solid #fdcc03; border-radius:12px;">
                            <tr>
                                <td style="padding:24px 40px; text-align:center;">
                                <p style="margin:0 0 12px; padding:0; color:#64748b; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">YOUR OTP CODE</p>
                                <input
                                    id="otpCode"
                                    type="text"
                                    value="${otp}"
                                    readonly
                                    style="
                                    border:none;
                                    background:transparent;
                                    font-size:48px;
                                    font-weight:700;
                                    color:#800000;
                                    letter-spacing:16px;
                                    text-align:center;
                                    width:100%;
                                    outline:none;
                                    user-select:all;
                                    "
                                />
                                <p style="font-size:13px; color:#64748b; text-align:center;">
                                    Tip: You can tap the OTP to select it and copy (Ctrl+C / Cmd+C) for easy pasting during reset!
                                </p>
                                </td>
                            </tr>
                            </table>
                        </td>
                        </tr>
                    </table>
    
                    <!-- Important Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0; background:#fef3c7; border-left:4px solid #fdcc03; border-radius:6px;">
                        <tr>
                        <td style="padding:16px 20px;">
                            <p style="margin:0; padding:0; color:#92400e; font-size:14px; line-height:1.6;">
                            <strong>⏰ Important:</strong> This OTP is valid for <strong>10 minutes only</strong>. 
                            Please complete your password reset within this time frame.
                            </p>
                        </td>
                        </tr>
                    </table>
    
                    <!-- Security Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0; background:#fee2e2; border-left:4px solid #ef4444; border-radius:6px;">
                        <tr>
                        <td style="padding:16px 20px;">
                            <p style="margin:0; padding:0; color:#7f1d1d; font-size:14px; line-height:1.6;">
                            <strong>🔒 Security Alert:</strong> If you did not request this password reset, 
                            please ignore this email and ensure your account is secure. No changes will be made to your account.
                            </p>
                        </td>
                        </tr>
                    </table>
    
                    <!-- Instructions -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0; background:#f8fafc; border-radius:8px;">
                        <tr>
                        <td style="padding:20px;">
                            <p style="margin:0 0 12px; padding:0; color:#1e293b; font-size:14px; font-weight:600;">📝 How to use this OTP:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td style="padding:4px 0; color:#475569; font-size:14px; line-height:1.8;">
                                1. Return to the password reset page<br/>
                                2. Click the OTP code above to select it<br/>
                                3. Press Ctrl+C (Windows) or Cmd+C (Mac) to copy<br/>
                                4. Paste the OTP and create your new password
                                </td>
                            </tr>
                            </table>
                        </td>
                        </tr>
                    </table>
    
                    <!-- Support -->
                    <p style="margin:24px 0 0; padding:0; color:#64748b; font-size:14px; line-height:1.6;">
                        If you're having trouble or need assistance, please contact our support team.
                    </p>
    
                    <!-- Signature -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:32px; border-top:2px solid #e2e8f0;">
                        <tr>
                        <td style="padding-top:24px;">
                            <p style="margin:0 0 4px; padding:0; color:#1e293b; font-size:15px; font-weight:600;">Best regards,</p>
                            <p style="margin:0; padding:0; color:#800000; font-size:16px; font-weight:700;">WEBOPS Team - VEC</p>
                            <p style="margin:4px 0 0; padding:0; color:#64748b; font-size:13px;">QA Examination Platform</p>
                        </td>
                        </tr>
                    </table>
    
                    </td>
                </tr>
    
                <!-- Footer -->
                <tr>
                    <td style="background-color:#1e293b; padding:24px 30px; text-align:center; border-radius:0 0 12px 12px;">
                    <p style="margin:0 0 8px; padding:0; color:#94a3b8; font-size:12px; line-height:1.5;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                    <p style="margin:0; padding:0; color:#64748b; font-size:11px;">
                        © ${new Date().getFullYear()} Velammal Engineering College. All rights reserved.
                    </p>
                    </td>
                </tr>
    
                </table>
    
            </td>
            </tr>
        </table>
    
        </body>
        </html>
        `
    });

}

module.exports = { sendOtpEmail };