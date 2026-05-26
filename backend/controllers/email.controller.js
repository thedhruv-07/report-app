const EmailLog = require('../models/emailLog.model');
const { enqueueEmail } = require('../services/email.queue');
const { sendImmediateEmail } = require('../services/email.service');

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
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;">
        <h2 style="margin:0 0 12px;color:#1d4ed8;">Email delivery test</h2>
        <p style="margin:0 0 12px;">This is a test message from the Absolute Veritas email system.</p>
        <p style="margin:0 0 12px;">Recipient: <strong>${recipient}</strong></p>
        <p style="margin:0 0 12px;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `;

    await EmailLog.create({
      recipient,
      subject,
      type: 'test_email',
      html,
      status: 'queued',
      metadata: { triggeredBy: req.user?.email || req.user?.id || 'admin' }
    });

    const result = await sendImmediateEmail({
      to: recipient,
      subject,
      html,
    });

    await EmailLog.create({
      recipient,
      subject,
      type: 'test_email',
      html,
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(),
      metadata: { messageId: result.messageId, previewUrl: result.previewUrl || false, accepted: result.accepted || [], rejected: result.rejected || [], response: result.response || '', envelope: result.envelope || null }
    });

    return res.json({ message: 'Test email sent', recipient, result });
  } catch (err) {
    console.error('Send test email error:', err);
    return res.status(500).json({ error: 'Failed to send test email', detail: err.message });
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

    const log = await EmailLog.create({
      recipient,
      subject,
      type: 'test_email_self',
      html,
      status: 'queued',
      metadata: { triggeredBy: req.user?.email || req.user?.id || 'self-test' }
    });

    const result = await sendImmediateEmail({
      to: recipient,
      subject,
      html,
    });

    await EmailLog.findByIdAndUpdate(log._id, {
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(),
      metadata: { ...(log.metadata || {}), messageId: result.messageId, previewUrl: result.previewUrl || false, accepted: result.accepted || [], rejected: result.rejected || [], response: result.response || '', envelope: result.envelope || null }
    });

    return res.json({ message: 'Self test email sent', recipient, result });
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

module.exports = { listEmails, retryEmail, sendTestEmail, sendSelfTestEmail, getRawEmail };
