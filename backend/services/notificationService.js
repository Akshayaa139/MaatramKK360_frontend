const nodemailer = require('nodemailer');

function buildTransport(alias) {
  const map = {
    notifications: {
      user: process.env.MAIL_KK_NOTIFICATIONS_USER,
      pass: process.env.MAIL_KK_NOTIFICATIONS_PASS,
      from: process.env.MAIL_KK_NOTIFICATIONS_FROM || process.env.MAIL_DEFAULT_FROM
    },
    admin: {
      user: process.env.MAIL_KK_ADMIN_USER,
      pass: process.env.MAIL_KK_ADMIN_PASS,
      from: process.env.MAIL_KK_ADMIN_FROM || process.env.MAIL_DEFAULT_FROM
    },
    students: {
      user: process.env.MAIL_KK_STUDENTS_USER,
      pass: process.env.MAIL_KK_STUDENTS_PASS,
      from: process.env.MAIL_KK_STUDENTS_FROM || process.env.MAIL_DEFAULT_FROM
    },
    default: {
      user: process.env.MAIL_DEFAULT_USER,
      pass: process.env.MAIL_DEFAULT_PASS,
      from: process.env.MAIL_DEFAULT_FROM
    }
  };
  const cfg = map[alias] || map.default;
  if (!cfg.user || !cfg.pass) return null;
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: { user: cfg.user, pass: cfg.pass }
  });
  return { transporter, from: cfg.from || cfg.user };
}

class NotificationService {
  static async sendEmail(to, subject, text, html = null, alias = 'default') {
    try {
      const t = buildTransport(alias);
      if (!t || !to) return { success: false, error: 'Email disabled or missing recipient' };
      const info = await t.transporter.sendMail({ to, from: t.from, subject, text, html: html || text });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async sendOTPEmail(to, otp, alias = 'notifications') {
    const subject = 'Your One-Time Password (OTP)';
    const text = `Your OTP is ${otp}. It expires in 10 minutes.`;
    const html = `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
    return this.sendEmail(to, subject, text, html, alias);
  }

  static async sendApplicationConfirmation(application) {
    try {
      const fullName = application.personalInfo?.fullName || application.name || 'Student';
      const email = application.personalInfo?.email || application.email;
      const applicationId = application.applicationId;
      const emailSubject = 'Application Submitted Successfully - Karpom Karpippom (KK)';
      const emailText = `
        Dear ${fullName},
        
        Your application has been submitted successfully!
        
        Application ID: ${applicationId}
        Submission Date: ${new Date().toLocaleDateString()}
        
        We will review your application and get back to you soon.
        
        Best regards,
        Karpom Karpippom Team
      `;
      const emailHtml = `
        <h1>Thank you for applying to Karpom Karpippom!</h1>
        <p>Dear ${fullName},</p>
        <p>Your application has been received successfully.</p>
        <p><strong>Application ID: ${applicationId}</strong></p>
        <p>Submission Date: ${new Date().toLocaleDateString()}</p>
        <p>We will review your application and get back to you soon.</p>
        <p>Best regards,<br>Karpom Karpippom Team</p>
      `;
      const result = await this.sendEmail(email, emailSubject, emailText, emailHtml, 'students');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async sendStatusUpdate(application, newStatus) {
    try {
      const fullName = application.personalInfo?.fullName || application.name || 'Student';
      const email = application.personalInfo?.email || application.email;
      const applicationId = application.applicationId;
      const statusMessages = {
        'pending': 'Your application is pending review',
        'under_review': 'Your application is under review',
        'tele-verification': 'You have been selected for tele-verification',
        'televerification': 'You have been selected for tele-verification',
        'panel-interview': 'You have been selected for panel interview',
        'panel_interview': 'You have been selected for panel interview',
        'selected': 'Congratulations! You have been selected',
        'rejected': 'Your application has been rejected'
      };
      const emailSubject = `Application Status Update - Karpom Karpippom`;
      const emailText = `
        Dear ${fullName},
        
        Your application status has been updated to: ${statusMessages[newStatus] || newStatus}
        
        Application ID: ${applicationId}
        
        Best regards,
        Karpom Karpippom Team
      `;
      const emailHtml = `
        <h1>Application Status Update</h1>
        <p>Dear ${fullName},</p>
        <p>Your application status has been updated to: <strong>${statusMessages[newStatus] || newStatus}</strong></p>
        <p>Application ID: <strong>${applicationId}</strong></p>
        <p>Best regards,<br>Karpom Karpippom Team</p>
      `;
      const result = await this.sendEmail(email, emailSubject, emailText, emailHtml, 'students');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async sendWelcomeEmail(user) {
    const to = user.email;
    const subject = 'Welcome to KK360';
    const text = `Welcome ${user.name || ''} to KK360.`;
    const html = `<p>Welcome <strong>${user.name || ''}</strong> to KK360.</p>`;
    return this.sendEmail(to, subject, text, html, 'notifications');
  }

  static async sendAdminAlert(subject, text, html) {
    const to = process.env.MAIL_ADMIN_ALERT_TO || process.env.MAIL_KK_ADMIN_USER;
    return this.sendEmail(to, subject, text, html || text, 'admin');
  }

  static async sendEventReminder(to, eventTitle, eventDate) {
    const subject = `Reminder: ${eventTitle}`;
    const text = `Reminder for ${eventTitle} on ${eventDate}.`;
    const html = `<p>Reminder for <strong>${eventTitle}</strong> on ${eventDate}.</p>`;
    return this.sendEmail(to, subject, text, html, 'notifications');
  }
}

module.exports = NotificationService;
