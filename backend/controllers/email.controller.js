const EmailLog = require('../models/emailLog.model');
const { enqueueEmail } = require('../services/email.queue');
const { sendImmediateEmail, renderTemplate } = require('../services/email.service');

const listEmails = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const q = {};
    if (status) q.status = status;
    if (type) q.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await EmailLog.countDocuments(q);
    const emails = await EmailLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    res.json({ total, emails });
  } catch (err) {
    console.error('List emails error:', err);
    res.status(500).json({ error: 'Failed to list emails' });
  }
};

const retryEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await EmailLog.findById(id).lean();
    if (!log) return res.status(404).json({ error: 'Email log not found' });
    // Re-enqueue with same content
    await enqueueEmail({ reportId: log.reportId, recipient: log.recipient, subject: log.subject, type: log.type, html: log.html, attachments: log.attachments, metadata: log.metadata });
    res.json({ message: 'Email re-enqueued' });
  } catch (err) {
    console.error('Retry email error:', err);
    res.status(500).json({ error: 'Failed to retry email' });
  }
};

const sendTestEmail = async (req, res) => {
  try {
    const recipient = String(req.body?.recipient || '').trim();
    if (!recipient) {
      return res.status(400).json({ error: 'recipient is required' });
    }

    const subject = '[TEST] Absolute Veritas email delivery check';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;background:#f8fafc;">
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 12px;color:#1d4ed8;">✅ Email Delivery Test</h2>
          <p style="margin:0 0 8px;">This is a test message from the <strong>Absolute Veritas</strong> email system.</p>
          <p style="margin:0 0 8px;">Recipient: <strong>${recipient}</strong></p>
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Sent: ${new Date().toUTCString()}</p>
        </div>
      </div>
    `;

    // Use queue so request returns immediately — SMTP runs in background
    await enqueueEmail({
      recipient,
      subject,
      type: 'test_email',
      html,
      metadata: { triggeredBy: req.user?.email || req.user?.id || 'admin' }
    });

    return res.json({ message: 'Test email queued — check your inbox in a few seconds', recipient });
  } catch (err) {
    console.error('Send test email error:', err);
    return res.status(500).json({ error: 'Failed to queue test email', detail: err.message });
  }
};

const sendSelfTestEmail = async (req, res) => {
  try {
    const recipient = req.user?.email;
    if (!recipient) {
      return res.status(400).json({ error: 'Authenticated email is required' });
    }

    const subject = '[TEST] Absolute Veritas email delivery check';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;">
        <h2 style="margin:0 0 12px;color:#1d4ed8;">Email delivery test</h2>
        <p style="margin:0 0 12px;">This is a test message from the Absolute Veritas email system.</p>
        <p style="margin:0 0 12px;">Recipient: <strong>${recipient}</strong></p>
        <p style="margin:0 0 12px;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `;

    await enqueueEmail({
      recipient,
      subject,
      type: 'test_email_self',
      html,
      metadata: { triggeredBy: req.user?.email || req.user?.id || 'self-test' }
    });

    return res.json({ message: 'Self test email queued', recipient });
  } catch (err) {
    console.error('Send self test email error:', err);
    return res.status(500).json({ error: 'Failed to send self test email', detail: err.message });
  }
};

const getRawEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await EmailLog.findById(id).lean();
    if (!log) return res.status(404).json({ error: 'Email log not found' });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'cs@absoluteveritas.com';
    const to = log.recipient;
    const subject = log.subject || '';
    const date = (log.sentAt || log.createdAt || new Date()).toUTCString();
    const messageId = (log.metadata && log.metadata.messageId) || `<${id}@absoluteveritas.com>`;

    const text = (log.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const html = log.html || '';

    const boundary = '----=_Veritas_' + Date.now();
    let eml = '';
    eml += `From: Absolute Veritas <${from}>\r\n`;
    eml += `To: ${to}\r\n`;
    eml += `Subject: ${subject}\r\n`;
    eml += `Date: ${date}\r\n`;
    eml += `Message-ID: ${messageId}\r\n`;
    eml += `MIME-Version: 1.0\r\n`;
    eml += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
    eml += `\r\n`;
    eml += `--${boundary}\r\n`;
    eml += `Content-Type: text/plain; charset="utf-8"\r\n`;
    eml += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    eml += text + "\r\n\r\n";
    eml += `--${boundary}\r\n`;
    eml += `Content-Type: text/html; charset="utf-8"\r\n`;
    eml += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    eml += html + "\r\n\r\n";
    eml += `--${boundary}--\r\n`;

    res.setHeader('Content-Type', 'message/rfc822');
    res.setHeader('Content-Disposition', `attachment; filename="email-${id}.eml"`);
    return res.send(eml);
  } catch (err) {
    console.error('Get raw email error:', err);
    return res.status(500).json({ error: 'Failed to build raw email' });
  }
};

const sendLogoTestEmail = async (req, res) => {
  try {
    const recipient = req.user?.email;
    if (!recipient) return res.status(400).json({ error: 'No authenticated email' });
    const html = renderTemplate('task-accepted.html', {
      inspectorName: req.user?.name || recipient,
      inspectionType: 'PSI',
      clientName: 'Logo Test Client',
      acceptedAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      dashboardLink: process.env.FRONTEND_URL || '#',
    });
    await sendImmediateEmail({ to: recipient, subject: '[LOGO TEST] Absolute Veritas', html });
    return res.json({ message: 'Logo test email sent', recipient });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listEmails, retryEmail, sendTestEmail, sendSelfTestEmail, getRawEmail, sendLogoTestEmail };
