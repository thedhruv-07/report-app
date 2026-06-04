// Shared helper: create a dashboard SystemNotification for admin+manager and send emails
const SystemNotification = require('../models/systemNotification.model');
const { User } = require('../models/user.model');

const notifyStaff = async ({ title, message, type = 'info', priority = 2, emailSubject, emailHtml }) => {
  await SystemNotification.create({
    title,
    message,
    type,
    priority,
    targetRoles: ['admin', 'manager'],
    isActive: true,
  });

  try {
    const { enqueueEmail } = require('../services/email.queue');
    const recipients = new Set(
      (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '')
        .split(',').map(s => s.trim()).filter(Boolean)
    );
    const dbUsers = await User.find({ role: { $in: ['admin', 'manager'] } }).select('email').lean();
    dbUsers.forEach(u => { if (u.email) recipients.add(u.email); });
    for (const r of Array.from(recipients)) {
      enqueueEmail({ recipient: r, subject: emailSubject, type: 'system', html: emailHtml });
    }
  } catch (e) {
    console.warn('[notifyStaff] email failed:', e.message);
  }
};

module.exports = notifyStaff;
