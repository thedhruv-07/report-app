const nodemailer = require("nodemailer");

// Create transporter — uses Ethereal (free test SMTP) by default.
// Replace with real SMTP credentials in production.
let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // Check for real SMTP config
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // Fallback: auto-generate Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return cachedTransporter;
};

const sendResetEmail = async (to, resetToken) => {
  const transporter = await getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}?page=reset-password&token=${resetToken}`;

  const info = await transporter.sendMail({
    from: '"Veritas Report" <noreply@veritas-report.com>',
    to,
    subject: "Password Reset — Veritas Report",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:'Inter',system-ui,sans-serif;color:#1e293b;">
        <div style="text-align:center;padding:32px 0 24px;">
          <h2 style="margin:0;color:#3b82f6;font-size:22px;font-weight:800;">VERITAS REPORT</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Inspection Portal</p>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
          <h3 style="margin:0 0 8px;font-size:18px;font-weight:700;">Reset Your Password</h3>
          <p style="font-size:14px;color:#64748b;line-height:1.6;">
            You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
              Reset Password
            </a>
          </div>
          <p style="font-size:12px;color:#94a3b8;line-height:1.5;">
            If you didn't request this, you can safely ignore this email.<br/>
            <span style="word-break:break-all;color:#94a3b8;">Link: ${resetLink}</span>
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#cbd5e1;margin-top:24px;">
          © ${new Date().getFullYear()} Absolute Veritas. All rights reserved.
        </p>
      </div>
    `,
  });

  // Log Ethereal preview URL for development
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("📧 Reset email preview:", previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
};

module.exports = { sendResetEmail };
