// Shared helper: create a dashboard SystemNotification for admin+manager and send emails
const SystemNotification = require('../models/systemNotification.model');
const { User } = require('../models/user.model');
const { renderTemplate } = require('../services/email.service');
const { getIO } = require('../socket');

const DASHBOARD_URL = (process.env.FRONTEND_URL || 'https://absolute-veritas.netlify.app') + '/dashboard';

const notifyStaff = async ({ title, message, type = 'info', priority = 2, emailSubject, templateName, templateVars = {}, relatedTaskId = null, relatedBookingId = null, relatedReportId = null, relatedNoticeId = null }) => {
  await SystemNotification.create({
    title,
    message,
    type,
    priority,
    targetRoles: ['admin', 'manager'],
    relatedTaskId,
    relatedBookingId,
    relatedReportId,
    relatedNoticeId,
    isActive: true,
  });

  try {
    getIO().to(['admin_room', 'manager_room']).emit('new_system_notification');
  } catch (e) {
    console.warn('[notifyStaff] socket emit failed:', e.message);
  }

  try {
    const { enqueueEmail } = require('../services/email.queue');
    const recipients = new Set(
      (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '')
        .split(',').map(s => s.trim()).filter(Boolean)
    );
    const dbUsers = await User.find({ role: { $in: ['admin', 'manager'] } }).select('email').lean();
    dbUsers.forEach(u => { if (u.email) recipients.add(u.email); });

    const html = renderTemplate(templateName, {
      dashboardUrl: DASHBOARD_URL,
      year: new Date().getFullYear(),
      ...templateVars,
    });

    for (const r of Array.from(recipients)) {
      enqueueEmail({ recipient: r, subject: emailSubject, type: 'system', html });
    }
  } catch (e) {
    console.warn('[notifyStaff] email failed:', e.message);
  }
};

module.exports = notifyStaff;
