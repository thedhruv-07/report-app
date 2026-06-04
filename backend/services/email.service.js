const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');

// Create transporter — uses Ethereal (free test SMTP) by default.
// Replace with real SMTP credentials in production.
let cachedTransporter = null;
let templateCache = {};

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // Check for real SMTP config
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465;
    const transportOpts = {
      host: process.env.SMTP_HOST,
      port,
      secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      name: process.env.SMTP_HELO || process.env.DKIM_DOMAIN || process.env.SMTP_HOST,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    };

    // Optional DKIM support: add signing options if provided
    if (process.env.DKIM_SELECTOR && process.env.DKIM_DOMAIN && process.env.DKIM_PRIVATE_KEY) {
      try {
        let privateKey = process.env.DKIM_PRIVATE_KEY;
        // If DKIM_PRIVATE_KEY is a path to a file, read it
        if (!/-----BEGIN [A-Z ]+-----/.test(privateKey)) {
          const fs = require('fs');
          const p = require('path').resolve(privateKey);
          if (fs.existsSync(p)) {
            privateKey = fs.readFileSync(p, 'utf8');
          }
        }
        transportOpts.dkim = {
          domainName: process.env.DKIM_DOMAIN,
          keySelector: process.env.DKIM_SELECTOR,
          privateKey: String(privateKey).replace(/\\r?\\n/g, '\\n')
        };
        console.log('DKIM enabled for domain', process.env.DKIM_DOMAIN, 'selector', process.env.DKIM_SELECTOR);
      } catch (e) {
        console.error('Failed to enable DKIM', e && e.message);
      }
    }

    cachedTransporter = nodemailer.createTransport(transportOpts);
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

const renderTemplate = (name, vars = {}) => {
  if (!templateCache[name]) {
    const filePath = path.join(__dirname, '..', 'email_templates', `${name}`);
    if (!fs.existsSync(filePath)) return '';
    templateCache[name] = fs.readFileSync(filePath, 'utf8');
  }
  let html = templateCache[name];
  Object.keys(vars).forEach(k => {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    html = html.replace(re, vars[k] == null ? '' : String(vars[k]));
  });
  return html;
};

const sendImmediateEmail = async ({ to, subject, html, text, attachments = [], from } = {}) => {
  const transporter = await getTransporter();
  const fromAddress = from || process.env.SMTP_FROM || process.env.SMTP_USER || 'cs@absoluteveritas.com';
  const logoPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'company-logo.png');

  const debugBcc = process.env.EMAIL_DEBUG_BCC ? String(process.env.EMAIL_DEBUG_BCC).split(/,\s*/) : undefined;
  const overrideRecipient = process.env.EMAIL_OVERRIDE_RECIPIENT ? String(process.env.EMAIL_OVERRIDE_RECIPIENT).trim() : null;
  const originalTo = to;
  const sendTo = overrideRecipient || to;
  const headers = {
    'X-Absolute-Veritas-Mailer': 'report-app'
  };
  if (overrideRecipient) {
    headers['X-Original-To'] = originalTo;
  }

  const mailOptions = {
    from: `"Absolute Veritas" <${fromAddress}>`,
    to: sendTo,
    bcc: debugBcc,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : undefined),
    attachments: (() => {
      const nextAttachments = Array.isArray(attachments) ? [...attachments] : [];
      const hasCompanyLogo = nextAttachments.some((item) => item && item.cid === 'company-logo');
      if (!hasCompanyLogo && fs.existsSync(logoPath)) {
        nextAttachments.push({
          filename: 'company-logo.png',
          path: logoPath,
          cid: 'company-logo',
        });
      }
      return nextAttachments;
    })(),
    envelope: {
      from: fromAddress,
      to: overrideRecipient ? [overrideRecipient] : to
    },
    headers: Object.assign({
      'List-Unsubscribe': `<mailto:${fromAddress}?subject=unsubscribe>`,
      'Reply-To': fromAddress,
      'Sender': fromAddress
    }, headers)
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Primary SMTP send failed:', err && err.message);
    // Try fallback SMTP if configured
    if (process.env.SMTP_FALLBACK_HOST && process.env.SMTP_FALLBACK_USER && process.env.SMTP_FALLBACK_PASS) {
      try {
        console.log('Attempting fallback SMTP send via', process.env.SMTP_FALLBACK_HOST);
        const fallbackTransport = nodemailer.createTransport({
          host: process.env.SMTP_FALLBACK_HOST,
          port: parseInt(process.env.SMTP_FALLBACK_PORT || '587', 10),
          secure: process.env.SMTP_FALLBACK_SECURE === 'true',
          auth: {
            user: process.env.SMTP_FALLBACK_USER,
            pass: process.env.SMTP_FALLBACK_PASS
          },
          name: process.env.SMTP_FALLBACK_HELO || process.env.SMTP_FALLBACK_HOST
        });
        info = await fallbackTransport.sendMail(mailOptions);
        info.fallback = true;
      } catch (fbErr) {
        console.error('Fallback SMTP send also failed:', fbErr && fbErr.message);
        throw fbErr;
      }
    } else {
      throw err;
    }
  }

  // If primary send succeeded but recipients were rejected, attempt fallback
  if (info && info.rejected && info.rejected.length > 0 && process.env.SMTP_FALLBACK_HOST && process.env.SMTP_FALLBACK_USER && process.env.SMTP_FALLBACK_PASS && !info.fallback) {
    try {
      console.log('Primary send had rejected recipients, trying fallback SMTP');
      const fallbackTransport = nodemailer.createTransport({
        host: process.env.SMTP_FALLBACK_HOST,
        port: parseInt(process.env.SMTP_FALLBACK_PORT || '587', 10),
        secure: process.env.SMTP_FALLBACK_SECURE === 'true',
        auth: {
          user: process.env.SMTP_FALLBACK_USER,
          pass: process.env.SMTP_FALLBACK_PASS
        },
        name: process.env.SMTP_FALLBACK_HELO || process.env.SMTP_FALLBACK_HOST
      });
      const fbInfo = await fallbackTransport.sendMail(mailOptions);
      fbInfo.fallback = true;
      // merge metadata
      info.fallbackAttempt = fbInfo;
    } catch (fbErr) {
      console.error('Fallback after reject failed:', fbErr && fbErr.message);
    }
  }

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log('📧 Email preview:', previewUrl);
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const logEntry = {
      ts: new Date().toISOString(),
      to,
      from: fromAddress,
      subject,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || '',
      envelope: info.envelope || null,
      headers: {
        'X-Absolute-Veritas-Mailer': 'report-app',
        messageId: info.messageId,
        subject,
        date: new Date().toUTCString()
      },
      previewUrl: previewUrl || null,
      snippet: (text || '').slice(0, 1000)
    };
    fs.appendFileSync(path.join(logsDir, 'smtp.log'), JSON.stringify(logEntry) + '\n');
  } catch (e) {
    console.error('Failed to write smtp.log', e);
  }
  return {
    messageId: info.messageId,
    previewUrl,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    response: info.response || '',
    envelope: info.envelope || null,
    bcc: debugBcc || undefined
  };
};

const sendResetEmail = async (to, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const logoPath = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'company-logo.png');
  const text = [
    'Absolute Veritas password reset',
    '',
    `Use this link to reset your password: ${resetLink}`,
    '',
    'If you did not request this email, you can ignore it.'
  ].join('\n');
  const html = renderTemplate('report-password-reset.html', { resetLink, year: new Date().getFullYear() }) || `Reset: ${resetLink}`;
  return await sendImmediateEmail({
    to,
    subject: 'Password Reset — Veritas Report',
    html: `${html}`,
    text,
    attachments: [
      {
        filename: 'company-logo.png',
        path: logoPath,
        cid: 'company-logo',
      },
    ],
  });
};

module.exports = { sendResetEmail, sendImmediateEmail, renderTemplate };
